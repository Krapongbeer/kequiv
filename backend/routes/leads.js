const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

function sanitizeText(str, maxLength = 500) {
    if (!str || typeof str !== 'string') return '';
    // Strip tags and enforce maxLength to prevent injection attacks
    return str
        .replace(/<[^>]*>?/gm, '')
        .trim()
        .slice(0, maxLength);
}

/**
 * POST /api/leads - Public inquiry from website
 */
router.post('/', (req, res) => {
    try {
        let { name, phone, line_id, service_type, location, details } = req.body;

        name = sanitizeText(name, 100);
        phone = sanitizeText(phone, 40);
        line_id = sanitizeText(line_id, 80);
        service_type = sanitizeText(service_type, 100);
        location = sanitizeText(location, 200);
        details = sanitizeText(details, 2000);

        if (!name) {
            return res.status(400).json({ success: false, error: 'กรุณาระบุชื่อผู้ติดต่อ' });
        }
        if (!phone) {
            return res.status(400).json({ success: false, error: 'กรุณาระบุเบอร์โทรศัพท์' });
        }

        const stmt = db.prepare(`
            INSERT INTO leads (name, phone, line_id, service_type, location, details, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')
        `);

        const result = stmt.run(
            name,
            phone,
            line_id,
            service_type,
            location,
            details
        );

        res.json({
            success: true,
            message: 'บันทึกข้อมูลการติดต่อเรียบร้อยแล้ว ทีมงานจะติดต่อกลับอย่างเร็วที่สุด',
            data: { id: Number(result.lastInsertRowid) }
        });
    } catch (err) {
        console.error('Error creating lead:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
});

/**
 * GET /api/leads - List all leads (Protected)
 */
router.get('/', requireAuth, (req, res) => {
    try {
        const leads = db.prepare(`
            SELECT * FROM leads ORDER BY created_at DESC
        `).all();
        res.json({ success: true, data: leads });
    } catch (err) {
        console.error('Error fetching leads:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
});

/**
 * PUT /api/leads/:id - Update lead status (Protected)
 */
router.put('/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        db.prepare(`UPDATE leads SET status = ? WHERE id = ?`).run(status, id);
        res.json({ success: true, message: 'อัปเดตสถานะเรียบร้อย' });
    } catch (err) {
        console.error('Error updating lead:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' });
    }
});

/**
 * DELETE /api/leads/:id - Delete lead (Protected)
 */
router.delete('/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        db.prepare(`DELETE FROM leads WHERE id = ?`).run(id);
        res.json({ success: true, message: 'ลบข้อมูลเรียบร้อย' });
    } catch (err) {
        console.error('Error deleting lead:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
    }
});

/**
 * POST /api/leads/:id/convert - Convert lead to customer (Protected)
 */
router.post('/:id/convert', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
        if (!lead) {
            return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลคำขอ' });
        }

        // Insert into customers
        const note = `[แปลงจากหน้าเว็บ] บริการที่สนใจ: ${lead.service_type || '-'} | พื้นที่: ${lead.location || '-'} | รายละเอียด: ${lead.details || '-'}`;
        const custResult = db.prepare(`
            INSERT INTO customers (name, phone, address, note)
            VALUES (?, ?, ?, ?)
        `).run(lead.name, lead.phone, lead.location || '', note);

        const customerId = Number(custResult.lastInsertRowid);

        // Update lead status to 'converted'
        db.prepare("UPDATE leads SET status = 'converted' WHERE id = ?").run(id);

        res.json({
            success: true,
            message: 'แปลงเป็นข้อมูลลูกค้าเรียบร้อยแล้ว',
            customerId
        });
    } catch (err) {
        console.error('Error converting lead:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการแปลงข้อมูล' });
    }
});

module.exports = router;
