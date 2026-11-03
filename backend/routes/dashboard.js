const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const thisMonthStart = today.slice(0, 7) + '-01';

        // 1. Total revenue this month (paid & issued invoices/receipts)
        const monthRevenue = db.prepare(`
            SELECT COALESCE(SUM(grand_total), 0) as total
            FROM documents
            WHERE deleted_at IS NULL
              AND status IN ('issued', 'paid')
              AND type IN ('billing', 'receipt')
              AND issue_date >= ?
        `).get(thisMonthStart).total;

        // 2. Unpaid billing notes
        const unpaidBilling = db.prepare(`
            SELECT COUNT(*) as count, COALESCE(SUM(grand_total), 0) as total
            FROM documents
            WHERE deleted_at IS NULL
              AND type = 'billing'
              AND status = 'issued'
        `).get();

        // 3. Overdue billing notes
        const overdueBilling = db.prepare(`
            SELECT COUNT(*) as count, COALESCE(SUM(grand_total), 0) as total
            FROM documents
            WHERE deleted_at IS NULL
              AND type = 'billing'
              AND status = 'issued'
              AND due_date IS NOT NULL
              AND due_date < ?
        `).get(today);

        // 4. Counts by type
        const typeCounts = db.prepare(`
            SELECT type, status, COUNT(*) as count, COALESCE(SUM(grand_total), 0) as total
            FROM documents
            WHERE deleted_at IS NULL
            GROUP BY type, status
        `).all();

        // 5. Total active customers & active projects
        const customerStats = db.prepare(`
            SELECT 
                (SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL) as total_customers,
                (SELECT COUNT(*) FROM customer_projects WHERE deleted_at IS NULL) as total_projects,
                (SELECT COUNT(*) FROM document_reservations WHERE status = 'reserved') as active_reservations
        `).get();

        // 6. Recent documents
        const recentDocs = db.prepare(`
            SELECT d.id, d.code, d.type, d.issue_date, d.grand_total, d.status,
                   c.name as customer_name,
                   d.project_name_custom
            FROM documents d
            LEFT JOIN customers c ON c.id = d.customer_id
            WHERE d.deleted_at IS NULL
            ORDER BY d.id DESC LIMIT 6
        `).all();

        // 7. Top 5 customers by revenue
        const topCustomers = db.prepare(`
            SELECT c.id, c.name, COUNT(d.id) as doc_count, COALESCE(SUM(d.grand_total), 0) as total_spent
            FROM customers c
            JOIN documents d ON d.customer_id = c.id
            WHERE c.deleted_at IS NULL AND d.deleted_at IS NULL AND d.status != 'cancelled'
            GROUP BY c.id
            ORDER BY total_spent DESC
            LIMIT 5
        `).all();

        // 8. Reserved numbers ready for use
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
