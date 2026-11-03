const express = require('express');
const router = express.Router();
const db = require('../db');
const { supabase, isSupabaseConfigured } = require('../supabase');

router.get('/', async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const thisMonthStart = today.slice(0, 7) + '-01';

        if (isSupabaseConfigured && supabase) {
            // 1. Fetch active docs
            const { data: allDocs, error: docsErr } = await supabase
                .from('documents')
                .select('id, code, type, status, issue_date, due_date, grand_total, customer_id, project_name_custom, customer:customers(name)')
                .is('deleted_at', null)
                .order('id', { ascending: false });

            if (docsErr) throw new Error(docsErr.message);
            const docs = allDocs || [];

            // Month revenue
            const monthRevenue = docs
                .filter(d => ['issued', 'paid'].includes(d.status) && ['billing', 'receipt'].includes(d.type) && d.issue_date >= thisMonthStart)
                .reduce((sum, d) => sum + Number(d.grand_total || 0), 0);

            // Unpaid billing
            const unpaidBillingDocs = docs.filter(d => d.type === 'billing' && d.status === 'issued');
            const unpaidBilling = {
                count: unpaidBillingDocs.length,
                total: unpaidBillingDocs.reduce((sum, d) => sum + Number(d.grand_total || 0), 0)
            };

            // Overdue billing
            const overdueBillingDocs = docs.filter(d => d.type === 'billing' && d.status === 'issued' && d.due_date && d.due_date < today);
            const overdueBilling = {
                count: overdueBillingDocs.length,
                total: overdueBillingDocs.reduce((sum, d) => sum + Number(d.grand_total || 0), 0)
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

            // Top 5 customers
            const customerSpendMap = {};
            docs.filter(d => d.status !== 'cancelled').forEach(d => {
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
                    unpaidBilling,
                    overdueBilling,
                    typeCounts,
                    customerStats,
                    recentDocs,
                    topCustomers,
                    availableReservations
                }
            });
        }

        // SQLite Fallback
        const monthRevenue = db.prepare(`
            SELECT COALESCE(SUM(grand_total), 0) as total
            FROM documents
            WHERE deleted_at IS NULL
              AND status IN ('issued', 'paid')
              AND type IN ('billing', 'receipt')
              AND issue_date >= ?
        `).get(thisMonthStart).total;

        const unpaidBilling = db.prepare(`
            SELECT COUNT(*) as count, COALESCE(SUM(grand_total), 0) as total
            FROM documents
            WHERE deleted_at IS NULL
              AND type = 'billing'
              AND status = 'issued'
        `).get();

        const overdueBilling = db.prepare(`
            SELECT COUNT(*) as count, COALESCE(SUM(grand_total), 0) as total
            FROM documents
            WHERE deleted_at IS NULL
              AND type = 'billing'
              AND status = 'issued'
              AND due_date IS NOT NULL
              AND due_date < ?
        `).get(today);

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
            WHERE c.deleted_at IS NULL AND d.deleted_at IS NULL AND d.status != 'cancelled'
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

        res.json({
            success: true,
            data: {
                monthRevenue,
                unpaidBilling,
                overdueBilling,
                typeCounts,
                customerStats,
                recentDocs,
                topCustomers,
                availableReservations
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
