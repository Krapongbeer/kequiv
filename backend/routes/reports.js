const express = require('express');
const router = express.Router();
const db = require('../db');
const { supabase, isSupabaseConfigured } = require('../supabase');
const { requireAdmin } = require('../middleware/auth');
const { getAuditLogs } = require('../services/auditService');
const { extractServiceBillInfo } = require('../utils/serviceBillHelper');

// GET /api/reports/export-csv
// Exports documents to CSV with UTF-8 BOM for Thai Excel
router.get('/export-csv', async (req, res) => {
    try {
        const { year, month, type, service_bill } = req.query;

        let docs = [];
        if (isSupabaseConfigured && supabase) {
            let query = supabase
                .from('documents')
                .select(`
                    id, code, type, status, issue_date, due_date, subtotal, discount_total, grand_total,
                    remark, payment_terms, project_name_custom,
                    customer:customers(name, tax_id, phone),
                    project:customer_projects(project_name)
                `)
                .is('deleted_at', null)
                .order('issue_date', { ascending: true });

            if (type && type !== 'all') {
                query = query.eq('type', type);
            }
            if (service_bill === 'service') {
                query = query.ilike('remark', '%[บิลที่ร้านให้บริการ:%');
            } else if (service_bill === 'regular') {
                query = query.not('remark', 'ilike', '%[บิลที่ร้านให้บริการ:%');
            }
            if (year && month) {
                const ym = `${year}-${String(month).padStart(2, '0')}`;
                query = query.gte('issue_date', `${ym}-01`).lte('issue_date', `${ym}-31`);
            } else if (year) {
                query = query.gte('issue_date', `${year}-01-01`).lte('issue_date', `${year}-12-31`);
            }

            const { data, error } = await query;
            if (error) throw new Error(error.message);
            docs = (data || []).map(d => {
                extractServiceBillInfo(d);
                return {
                    code: d.code,
                    type: d.type === 'quotation' ? 'ใบเสนอราคา' : (d.type === 'billing' ? 'ใบแจ้งหนี้/วางบิล' : 'ใบเสร็จรับเงิน'),
                    issue_date: d.issue_date,
                    customer_name: d.customer?.name || '-',
                    customer_tax_id: d.customer?.tax_id || '-',
                    project_name: d.project_name_custom || d.project?.project_name || '-',
                    subtotal: d.subtotal || 0,
                    discount_total: d.discount_total || 0,
                    grand_total: d.grand_total || 0,
                    is_service_bill: d.is_service_bill,
                    service_fee_percent: d.service_fee_percent,
                    service_fee_amount: d.service_fee_amount,
                    partner_payout_amount: d.partner_payout_amount,
                    partner_name: d.partner_name,
                    status: d.status === 'paid' ? 'ชำระแล้ว' : (d.status === 'issued' ? 'ออกเอกสารแล้ว' : 'ยกเลิก')
                };
            });
        } else {
            let sql = `
                SELECT d.code, d.type, d.issue_date, d.subtotal, d.discount_total, d.grand_total, d.status,
                       d.remark, d.project_name_custom, c.name as customer_name, c.tax_id as customer_tax_id, p.project_name
                FROM documents d
                LEFT JOIN customers c ON c.id = d.customer_id
                LEFT JOIN customer_projects p ON p.id = d.project_id
                WHERE d.deleted_at IS NULL
            `;
            const params = [];
            if (type && type !== 'all') {
                sql += ' AND d.type = ?';
                params.push(type);
            }
            if (service_bill === 'service') {
                sql += ' AND d.remark LIKE ?';
                params.push('%[บิลที่ร้านให้บริการ:%');
            } else if (service_bill === 'regular') {
                sql += ' AND (d.remark NOT LIKE ? OR d.remark IS NULL)';
                params.push('%[บิลที่ร้านให้บริการ:%');
            }
            if (year && month) {
                const ym = `${year}-${String(month).padStart(2, '0')}`;
                sql += ' AND d.issue_date >= ? AND d.issue_date <= ?';
                params.push(`${ym}-01`, `${ym}-31`);
            } else if (year) {
                sql += ' AND d.issue_date >= ? AND d.issue_date <= ?';
                params.push(`${year}-01-01`, `${year}-12-31`);
            }
            sql += ' ORDER BY d.issue_date ASC';

            const rows = db.prepare(sql).all(...params);
            docs = rows.map(d => {
                extractServiceBillInfo(d);
                return {
                    code: d.code,
                    type: d.type === 'quotation' ? 'ใบเสนอราคา' : (d.type === 'billing' ? 'ใบแจ้งหนี้/วางบิล' : 'ใบเสร็จรับเงิน'),
                    issue_date: d.issue_date,
                    customer_name: d.customer_name || '-',
                    customer_tax_id: d.customer_tax_id || '-',
                    project_name: d.project_name_custom || d.project_name || '-',
                    subtotal: d.subtotal || 0,
                    discount_total: d.discount_total || 0,
                    grand_total: d.grand_total || 0,
                    is_service_bill: d.is_service_bill,
                    service_fee_percent: d.service_fee_percent,
                    service_fee_amount: d.service_fee_amount,
                    partner_payout_amount: d.partner_payout_amount,
                    partner_name: d.partner_name,
                    status: d.status === 'paid' ? 'ชำระแล้ว' : (d.status === 'issued' ? 'ออกเอกสารแล้ว' : 'ยกเลิก')
                };
            });
        }

        // Generate CSV string with UTF-8 BOM
        const headers = [
            'ลำดับ', 'เลขที่เอกสาร', 'ประเภท', 'วันที่ออก', 'ชื่อลูกค้า', 'เลขผู้เสียภาษี', 'โครงการ/หัวบิล',
            'ประเภทบิล', 'ยอดรวมก่อนลด', 'ส่วนลด', 'ยอดสุทธิ (หน้าบิล)', 'อัตราค่าบริการ (%)',
            'รายได้ค่าบริการของร้าน', 'ยอดส่งต่อผู้ร่วมงาน/ทุน', 'ผู้ร่วมงาน/พันธมิตร', 'สถานะ'
        ];
        const csvRows = [headers.join(',')];

        docs.forEach((d, idx) => {
            const row = [
                idx + 1,
                `"${d.code}"`,
                `"${d.type}"`,
                `"${d.issue_date}"`,
                `"${(d.customer_name || '').replace(/"/g, '""')}"`,
                `"${d.customer_tax_id}"`,
                `"${(d.project_name || '').replace(/"/g, '""')}"`,
                `"${d.is_service_bill ? 'บิลที่ร้านให้บริการ' : 'บิลขายปกติ'}"`,
                d.subtotal.toFixed(2),
                d.discount_total.toFixed(2),
                d.grand_total.toFixed(2),
                d.is_service_bill ? `"${d.service_fee_percent}%"` : '"-"',
                d.is_service_bill ? d.service_fee_amount.toFixed(2) : '0.00',
                d.is_service_bill ? d.partner_payout_amount.toFixed(2) : '0.00',
                d.is_service_bill && d.partner_name ? `"${d.partner_name.replace(/"/g, '""')}"` : '"-"',
                `"${d.status}"`
            ];
            csvRows.push(row.join(','));
        });

        // Add UTF-8 BOM for Excel
        const csvContent = '\uFEFF' + csvRows.join('\r\n');
        const filename = `kequiv-report-${year || 'all'}-${month || 'all'}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvContent);
    } catch (err) {
        console.error('CSV Export error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/reports/audit-logs (Security & Compliance Audit Trail - Admin only)
router.get('/audit-logs', requireAdmin, async (req, res) => {
    try {
        const { limit = 100, action, username } = req.query;
        const logs = await getAuditLogs({ limit, action, username });
        res.json({ success: true, data: logs });
    } catch (err) {
        console.error('Audit logs fetch error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
