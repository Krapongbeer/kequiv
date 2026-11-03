const express = require('express');
const router = express.Router();
const db = require('../db');
const { reserveBatchNumbers } = require('../utils/docNumber');

// GET all reservations
router.get('/', (req, res) => {
    try {
        const { doc_type, status } = req.query;
        let query = `
            SELECT r.*, 
                   c.name as customer_name,
                   p.project_name
            FROM document_reservations r
            LEFT JOIN customers c ON c.id = r.customer_id
            LEFT JOIN customer_projects p ON p.id = r.project_id
            WHERE 1=1
        `;
        const params = [];

        if (doc_type) {
            query += ' AND r.doc_type = ?';
            params.push(doc_type);
        }
        if (status && status !== 'all') {
            query += ' AND r.status = ?';
            params.push(status);
        } else if (!status) {
            // Default to 'reserved' (available)
            query += " AND r.status = 'reserved'";
        }

        query += ' ORDER BY r.code ASC, r.id DESC';

        const list = db.prepare(query).all(...params);
        res.json({ success: true, data: list });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST reserve batch numbers
router.post('/batch', (req, res) => {
    try {
        const { doc_type, count = 1, note = '', customer_id = null, project_id = null, year_month = null } = req.body;

        if (!['quotation', 'billing', 'receipt'].includes(doc_type)) {
            return res.status(400).json({ success: false, error: 'ประเภทเอกสารไม่ถูกต้อง' });
        }

        const numCount = parseInt(count, 10);
        if (isNaN(numCount) || numCount < 1 || numCount > 100) {
            return res.status(400).json({ success: false, error: 'จำนวนเลขที่ต้องการกันต้องอยู่ระหว่าง 1 ถึง 100' });
        }

        const codes = reserveBatchNumbers(db, doc_type, numCount, {
            note,
            customer_id: customer_id ? parseInt(customer_id, 10) : null,
            project_id: project_id ? parseInt(project_id, 10) : null,
            yearMonth: year_month
        });

        res.json({
            success: true,
            message: `กันเลขที่ ${doc_type} สำเร็จจำนวน ${codes.length} เลข`,
            codes
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE cancel a reservation (if still 'reserved')
router.delete('/:id', (req, res) => {
    try {
        const row = db.prepare('SELECT * FROM document_reservations WHERE id = ?').get(req.params.id);
        if (!row) {
            return res.status(404).json({ success: false, error: 'ไม่พบรายการกันเลขนี้' });
        }
        if (row.status === 'used') {
            return res.status(400).json({ success: false, error: 'เลขนี้ถูกนำไปออกเอกสารแล้ว ไม่สามารถยกเลิกได้' });
        }

        db.prepare("UPDATE document_reservations SET status = 'cancelled' WHERE id = ?").run(req.params.id);
        res.json({ success: true, message: 'ยกเลิกการกันเลขเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
