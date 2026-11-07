const express = require('express');
const router = express.Router();
const db = require('../db');
const { supabase, isSupabaseConfigured } = require('../supabase');
const { extractServiceBillInfo } = require('../utils/serviceBillHelper');

router.get('/', async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const thisMonthStart = today.slice(0, 7) + '-01';

        if (isSupabaseConfigured && supabase) {
            // 1. Fetch active docs
            const { data: allDocs, error: docsErr } = await supabase
                .from('documents')
                .select('id, code, type, status, issue_date, due_date, grand_total, remark, customer_id, reference_document_id, project_name_custom, customer:customers(name)')
                .is('deleted_at', null)
                .order('id', { ascending: false });

            if (docsErr) throw new Error(docsErr.message);
            const docs = allDocs || [];

            // Find all doc IDs that are referenced by a non-cancelled receipt (to prevent double counting when converted)
            const docsReferencedByReceipt = new Set(
                docs.filter(d => d.type === 'receipt' && d.status !== 'cancelled' && d.reference_document_id)
                    .map(d => Number(d.reference_document_id))
            );

            // True Sales: Receipts + unconverted Billing notes (NOT cancelled, NEVER quotations)
            const salesDocs = docs.filter(d => {
                if (d.status === 'cancelled') return false;
                if (d.type === 'receipt') return true;
                if (d.type === 'billing' && !docsReferencedByReceipt.has(Number(d.id))) return true;
                return false;
            });

            // Service Bill Statistics & Real Shop Revenue Calculation
            let totalServiceFee = 0;
            let monthServiceFee = 0;
            let monthGrossBilled = 0;
            let monthRegularSales = 0;
            let monthServiceBillsCount = 0;
            let monthRegularBillsCount = 0;
            let serviceBillsCount = 0;
            let regularBillsCount = 0;
            const monthDocs = [];
            const allTimeServiceDocs = [];

            salesDocs.forEach(d => {
                extractServiceBillInfo(d);
                const isThisMonth = d.issue_date && d.issue_date >= thisMonthStart;

                if (d.is_service_bill) {
                    serviceBillsCount++;
                    totalServiceFee += Number(d.service_fee_amount || 0);
                    allTimeServiceDocs.push({
                        id: d.id,
                        code: d.code,
                        type: d.type,
                        issue_date: d.issue_date,
                        grand_total: Number(d.grand_total || 0),
                        service_fee_percent: d.service_fee_percent || 0,
                        service_fee_amount: Number(d.service_fee_amount || 0),
                        partner_payout_amount: Number(d.partner_payout_amount || 0),
                        customer_name: d.customer ? d.customer.name : '-'
                    });

                    if (isThisMonth) {
                        monthServiceBillsCount++;
                        monthGrossBilled += Number(d.grand_total || 0);
                        monthServiceFee += Number(d.service_fee_amount || 0);
                        monthDocs.push({
                            id: d.id,
                            code: d.code,
                            type: d.type,
                            issue_date: d.issue_date,
                            grand_total: Number(d.grand_total || 0),
                            is_service_bill: true,
                            service_fee_percent: d.service_fee_percent || 0,
                            service_fee_amount: Number(d.service_fee_amount || 0),
                            customer_name: d.customer ? d.customer.name : '-'
                        });
                    }
                } else {
                    regularBillsCount++;
                    if (isThisMonth) {
                        monthRegularBillsCount++;
                        monthGrossBilled += Number(d.grand_total || 0);
                        monthRegularSales += Number(d.grand_total || 0);
                        monthDocs.push({
                            id: d.id,
                            code: d.code,
                            type: d.type,
                            issue_date: d.issue_date,
                            grand_total: Number(d.grand_total || 0),
                            is_service_bill: false,
                            service_fee_percent: 0,
                            service_fee_amount: 0,
                            customer_name: d.customer ? d.customer.name : '-'
                        });
                    }
                }
            });

            // True shop income this month: regular sales + service fee earnings (e.g. 45,000 + 2,600 = 47,600)
            const monthRevenue = monthRegularSales + monthServiceFee;

            const serviceStats = {
                total_service_fee_revenue: totalServiceFee,
                all_time_service_bills_count: serviceBillsCount,
                all_time_regular_bills_count: regularBillsCount,
                all_time_service_docs: allTimeServiceDocs,
                month_service_fee_revenue: monthServiceFee,
                month_service_bills_count: monthServiceBillsCount,
                month_regular_sales: monthRegularSales,
                month_regular_bills_count: monthRegularBillsCount,
                month_gross_billed: monthGrossBilled,
                month_docs: monthDocs
            };

            // Unpaid receivables:
            // 1. Open receipts that haven't been marked as paid yet (d.type === 'receipt' && d.status === 'issued')
            // 2. Open billing notes that haven't been paid AND haven't been converted to a receipt yet
            const unpaidBillingDocs = docs.filter(d => {
                if (d.status !== 'issued') return false;
                if (d.type === 'receipt') return true;
                if (d.type === 'billing' && !docsReferencedByReceipt.has(Number(d.id))) return true;
                return false;
            });

            let unpaidRegularTotal = 0;
            let unpaidServiceFeeTotal = 0;
            let unpaidServiceBillsCount = 0;
            let unpaidRegularBillsCount = 0;
            let unpaidGrossTotal = 0;

            unpaidBillingDocs.forEach(d => {
                extractServiceBillInfo(d);
                unpaidGrossTotal += Number(d.grand_total || 0);
                if (d.is_service_bill) {
                    unpaidServiceBillsCount++;
                    unpaidServiceFeeTotal += Number(d.service_fee_amount || 0);
                } else {
                    unpaidRegularBillsCount++;
                    unpaidRegularTotal += Number(d.grand_total || 0);
                }
            });

            // True shop income expected from unpaid bills (regular sales + service fees)
            const unpaidNetTotal = unpaidRegularTotal + unpaidServiceFeeTotal;

            const unpaidBilling = {
                count: unpaidBillingDocs.length,
                total: unpaidNetTotal,
                gross_total: unpaidGrossTotal,
                regular_total: unpaidRegularTotal,
                service_fee_total: unpaidServiceFeeTotal,
                service_bills_count: unpaidServiceBillsCount,
                regular_bills_count: unpaidRegularBillsCount
            };

            // Overdue billing
            const overdueBillingDocs = unpaidBillingDocs.filter(d => d.due_date && d.due_date < today);
            let overdueRegularTotal = 0;
            let overdueServiceFeeTotal = 0;
            let overdueGrossTotal = 0;

            overdueBillingDocs.forEach(d => {
                extractServiceBillInfo(d);
                overdueGrossTotal += Number(d.grand_total || 0);
                if (d.is_service_bill) {
                    overdueServiceFeeTotal += Number(d.service_fee_amount || 0);
                } else {
                    overdueRegularTotal += Number(d.grand_total || 0);
                }
            });

            const overdueBilling = {
                count: overdueBillingDocs.length,
                total: overdueRegularTotal + overdueServiceFeeTotal,
                gross_total: overdueGrossTotal
            };

            // Counts by type & status
            const typeCountsMap = {};
            docs.forEach(d => {
                const key = `${d.type}_${d.status}`;
                if (!typeCountsMap[key]) {
                    typeCountsMap[key] = { type: d.type, status: d.status, count: 0, total: 0 };
                }
                typeCountsMap[key].count++;
                typeCountsMap[key].total += Number(d.grand_total || 0);
            });
            const typeCounts = Object.values(typeCountsMap);

            // Customer counts & Reservations
            const { count: total_customers } = await supabase.from('customers').select('*', { count: 'exact', head: true }).is('deleted_at', null);
            const { count: total_projects } = await supabase.from('customer_projects').select('*', { count: 'exact', head: true }).is('deleted_at', null);
            const { count: active_reservations } = await supabase.from('document_reservations').select('*', { count: 'exact', head: true }).eq('status', 'reserved');

            const customerStats = {
                total_customers: total_customers || 0,
                total_projects: total_projects || 0,
                active_reservations: active_reservations || 0
            };

            // Recent 6 docs
            const recentDocs = docs.slice(0, 6).map(d => ({
                id: d.id,
                code: d.code,
                type: d.type,
                issue_date: d.issue_date,
                grand_total: Number(d.grand_total || 0),
                status: d.status,
                customer_name: d.customer ? d.customer.name : '-',
                project_name_custom: d.project_name_custom
            }));

            // Top 5 customers based on actual sales (Receipts + unconverted Billing, EXCLUDING quotations & cancelled)
            const customerSpendMap = {};
            salesDocs.forEach(d => {
                const cid = d.customer_id;
                const cname = d.customer ? d.customer.name : 'ลูกค้า #' + cid;
                if (!customerSpendMap[cid]) {
                    customerSpendMap[cid] = { id: cid, name: cname, doc_count: 0, total_spent: 0 };
                }
                customerSpendMap[cid].doc_count++;
                customerSpendMap[cid].total_spent += Number(d.grand_total || 0);
            });
            const topCustomers = Object.values(customerSpendMap)
                .sort((a, b) => b.total_spent - a.total_spent)
                .slice(0, 5);

            // Available reservations
            const { data: resList } = await supabase
                .from('document_reservations')
                .select('*, customer:customers(name)')
                .eq('status', 'reserved')
                .order('code', { ascending: true })
                .limit(10);

            const availableReservations = (resList || []).map(r => ({
                ...r,
                customer_name: r.customer ? r.customer.name : null
            }));

            return res.json({
                success: true,
                data: {
                    monthRevenue,
                    monthGrossBilled,
                    monthRegularSales,
                    monthServiceFee,
                    unpaidBilling,
                    overdueBilling,
                    typeCounts,
                    customerStats,
                    recentDocs,
                    topCustomers,
                    availableReservations,
                    serviceStats
                }
            });
        }

        // SQLite Fallback
        const unpaidBillingDocsSqlite = db.prepare(`
            SELECT id, type, status, issue_date, due_date, grand_total, remark
            FROM documents
            WHERE deleted_at IS NULL
              AND status = 'issued'
              AND (
                  type = 'receipt'
                  OR (type = 'billing' AND id NOT IN (
                      SELECT reference_document_id FROM documents 
                      WHERE type = 'receipt' AND status != 'cancelled' AND reference_document_id IS NOT NULL
                  ))
              )
        `).all();

        let unpaidRegularTotalSqlite = 0;
        let unpaidServiceFeeTotalSqlite = 0;
        let unpaidServiceBillsCountSqlite = 0;
        let unpaidRegularBillsCountSqlite = 0;
        let unpaidGrossTotalSqlite = 0;

        unpaidBillingDocsSqlite.forEach(d => {
            extractServiceBillInfo(d);
            unpaidGrossTotalSqlite += Number(d.grand_total || 0);
            if (d.is_service_bill) {
                unpaidServiceBillsCountSqlite++;
                unpaidServiceFeeTotalSqlite += Number(d.service_fee_amount || 0);
            } else {
                unpaidRegularBillsCountSqlite++;
                unpaidRegularTotalSqlite += Number(d.grand_total || 0);
            }
        });

        const unpaidBilling = {
            count: unpaidBillingDocsSqlite.length,
            total: unpaidRegularTotalSqlite + unpaidServiceFeeTotalSqlite,
            gross_total: unpaidGrossTotalSqlite,
            regular_total: unpaidRegularTotalSqlite,
            service_fee_total: unpaidServiceFeeTotalSqlite,
            service_bills_count: unpaidServiceBillsCountSqlite,
            regular_bills_count: unpaidRegularBillsCountSqlite
        };

        const overdueBillingDocsSqlite = unpaidBillingDocsSqlite.filter(d => d.due_date && d.due_date < today);
        let overdueRegularTotalSqlite = 0;
        let overdueServiceFeeTotalSqlite = 0;
        let overdueGrossTotalSqlite = 0;

        overdueBillingDocsSqlite.forEach(d => {
            extractServiceBillInfo(d);
            overdueGrossTotalSqlite += Number(d.grand_total || 0);
            if (d.is_service_bill) {
                overdueServiceFeeTotalSqlite += Number(d.service_fee_amount || 0);
            } else {
                overdueRegularTotalSqlite += Number(d.grand_total || 0);
            }
        });

        const overdueBilling = {
            count: overdueBillingDocsSqlite.length,
            total: overdueRegularTotalSqlite + overdueServiceFeeTotalSqlite,
            gross_total: overdueGrossTotalSqlite
        };

        const typeCounts = db.prepare(`
            SELECT type, status, COUNT(*) as count, COALESCE(SUM(grand_total), 0) as total
            FROM documents
            WHERE deleted_at IS NULL
            GROUP BY type, status
        `).all();

        const customerStats = db.prepare(`
            SELECT 
                (SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL) as total_customers,
                (SELECT COUNT(*) FROM customer_projects WHERE deleted_at IS NULL) as total_projects,
                (SELECT COUNT(*) FROM document_reservations WHERE status = 'reserved') as active_reservations
        `).get();

        const recentDocs = db.prepare(`
            SELECT d.id, d.code, d.type, d.issue_date, d.grand_total, d.status,
                   c.name as customer_name,
                   d.project_name_custom
            FROM documents d
            LEFT JOIN customers c ON c.id = d.customer_id
            WHERE d.deleted_at IS NULL
            ORDER BY d.id DESC LIMIT 6
        `).all();

        const topCustomers = db.prepare(`
            SELECT c.id, c.name, COUNT(d.id) as doc_count, COALESCE(SUM(d.grand_total), 0) as total_spent
            FROM customers c
            JOIN documents d ON d.customer_id = c.id
            WHERE c.deleted_at IS NULL 
              AND d.deleted_at IS NULL 
              AND d.status != 'cancelled'
              AND (
                  d.type = 'receipt'
                  OR (d.type = 'billing' AND d.id NOT IN (
                      SELECT reference_document_id FROM documents 
                      WHERE type = 'receipt' AND status != 'cancelled' AND reference_document_id IS NOT NULL
                  ))
              )
            GROUP BY c.id
            ORDER BY total_spent DESC
            LIMIT 5
        `).all();

        const availableReservations = db.prepare(`
            SELECT r.*, c.name as customer_name
            FROM document_reservations r
            LEFT JOIN customers c ON c.id = r.customer_id
            WHERE r.status = 'reserved'
            ORDER BY r.code ASC LIMIT 10
        `).all();

        // Service Bill Statistics & Real Shop Revenue (SQLite)
        const allSqliteDocs = db.prepare(`
            SELECT id, type, status, issue_date, grand_total, remark
            FROM documents
            WHERE deleted_at IS NULL AND status != 'cancelled'
              AND (
                  type = 'receipt'
                  OR (type = 'billing' AND id NOT IN (
                      SELECT reference_document_id FROM documents 
                      WHERE type = 'receipt' AND status != 'cancelled' AND reference_document_id IS NOT NULL
                  ))
              )
        `).all();

        let totalServiceFee = 0;
        let monthServiceFee = 0;
        let monthGrossBilled = 0;
        let monthRegularSales = 0;
        let monthServiceBillsCount = 0;
        let monthRegularBillsCount = 0;
        let serviceBillsCount = 0;
        let regularBillsCount = 0;
        const monthDocsSqlite = [];
        const allTimeServiceDocsSqlite = [];

        allSqliteDocs.forEach(d => {
            extractServiceBillInfo(d);
            const isThisMonth = d.issue_date && d.issue_date >= thisMonthStart;
            if (d.is_service_bill) {
                serviceBillsCount++;
                totalServiceFee += Number(d.service_fee_amount || 0);
                allTimeServiceDocsSqlite.push({
                    id: d.id,
                    code: d.code,
                    type: d.type,
                    issue_date: d.issue_date,
                    grand_total: Number(d.grand_total || 0),
                    service_fee_percent: d.service_fee_percent || 0,
                    service_fee_amount: Number(d.service_fee_amount || 0),
                    partner_payout_amount: Number(d.partner_payout_amount || 0)
                });
                if (isThisMonth) {
                    monthServiceBillsCount++;
                    monthGrossBilled += Number(d.grand_total || 0);
                    monthServiceFee += Number(d.service_fee_amount || 0);
                    monthDocsSqlite.push({
                        id: d.id,
                        code: d.code,
                        type: d.type,
                        issue_date: d.issue_date,
                        grand_total: Number(d.grand_total || 0),
                        is_service_bill: true,
                        service_fee_percent: d.service_fee_percent || 0,
                        service_fee_amount: Number(d.service_fee_amount || 0)
                    });
                }
            } else {
                regularBillsCount++;
                if (isThisMonth) {
                    monthRegularBillsCount++;
                    monthGrossBilled += Number(d.grand_total || 0);
                    monthRegularSales += Number(d.grand_total || 0);
                    monthDocsSqlite.push({
                        id: d.id,
                        code: d.code,
                        type: d.type,
                        issue_date: d.issue_date,
                        grand_total: Number(d.grand_total || 0),
                        is_service_bill: false,
                        service_fee_percent: 0,
                        service_fee_amount: 0
                    });
                }
            }
        });

        const monthRevenue = monthRegularSales + monthServiceFee;

        const serviceStats = {
            total_service_fee_revenue: totalServiceFee,
            all_time_service_bills_count: serviceBillsCount,
            all_time_regular_bills_count: regularBillsCount,
            all_time_service_docs: allTimeServiceDocsSqlite,
            month_service_fee_revenue: monthServiceFee,
            month_service_bills_count: monthServiceBillsCount,
            month_regular_sales: monthRegularSales,
            month_regular_bills_count: monthRegularBillsCount,
            month_gross_billed: monthGrossBilled,
            month_docs: monthDocsSqlite
        };

        res.json({
            success: true,
            data: {
                monthRevenue,
                monthGrossBilled,
                monthRegularSales,
                monthServiceFee,
                unpaidBilling,
                overdueBilling,
                typeCounts,
                customerStats,
                recentDocs,
                topCustomers,
                availableReservations,
                serviceStats
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
