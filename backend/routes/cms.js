const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

/**
 * GET /api/cms/content - Get all website key-value settings
 */
router.get('/content', (req, res) => {
    try {
        const rows = db.prepare('SELECT key, value FROM website_content').all();
        const content = {};
        rows.forEach(r => { content[r.key] = r.value; });
        res.json({ success: true, data: content });
    } catch (err) {
        console.error('Error fetching CMS content:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการโหลดข้อมูลเว็บไซต์' });
    }
});

/**
 * PUT /api/cms/content - Update website settings (Protected)
 */
router.put('/content', requireAuth, (req, res) => {
    try {
        const updates = req.body;
        if (!updates || typeof updates !== 'object') {
            return res.status(400).json({ success: false, error: 'ข้อมูลไม่ถูกต้อง' });
        }

        const stmt = db.prepare('INSERT OR REPLACE INTO website_content (key, value) VALUES (?, ?)');
        for (const [key, val] of Object.entries(updates)) {
            stmt.run(key, String(val ?? ''));
        }

        res.json({ success: true, message: 'บันทึกข้อมูลเว็บไซต์เรียบร้อยแล้ว' });
    } catch (err) {
        console.error('Error updating CMS content:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
});

/**
 * Services CRUD
 */
router.get('/services', (req, res) => {
    try {
        const services = db.prepare('SELECT * FROM website_services ORDER BY sort_order ASC, id ASC').all();
        res.json({ success: true, data: services });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/services', requireAuth, (req, res) => {
    try {
        const { category, title, description, icon, bullets, sort_order } = req.body;
        if (!title || !category) {
            return res.status(400).json({ success: false, error: 'กรุณาระบุหมวดหมู่และชื่อบริการ' });
        }
        const stmt = db.prepare(`
            INSERT INTO website_services (category, title, description, icon, bullets, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(category, title, description || '', icon || '⚡', bullets || '', Number(sort_order || 0));
        res.json({ success: true, message: 'เพิ่มบริการใหม่เรียบร้อยแล้ว', id: Number(result.lastInsertRowid) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/services/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const { category, title, description, icon, bullets, sort_order } = req.body;
        db.prepare(`
            UPDATE website_services
            SET category = ?, title = ?, description = ?, icon = ?, bullets = ?, sort_order = ?
            WHERE id = ?
        `).run(category, title, description || '', icon || '⚡', bullets || '', Number(sort_order || 0), id);
        res.json({ success: true, message: 'แก้ไขบริการเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/services/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM website_services WHERE id = ?').run(id);
        res.json({ success: true, message: 'ลบบริการเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * Portfolio CRUD
 */
router.get('/portfolio', (req, res) => {
    try {
        const portfolio = db.prepare('SELECT * FROM website_portfolio ORDER BY sort_order ASC, id ASC').all();
        res.json({ success: true, data: portfolio });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/portfolio', requireAuth, (req, res) => {
    try {
        const { category, title, location, description, tag, status, gradient, sort_order } = req.body;
        if (!title || !category) {
            return res.status(400).json({ success: false, error: 'กรุณาระบุหมวดหมู่และชื่อผลงาน' });
        }
        const stmt = db.prepare(`
            INSERT INTO website_portfolio (category, title, location, description, tag, status, gradient, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(category, title, location || '', description || '', tag || '', status || 'ส่งมอบงาน 100%', gradient || 'from-sky-900 to-slate-800', Number(sort_order || 0));
        res.json({ success: true, message: 'เพิ่มผลงานใหม่เรียบร้อยแล้ว', id: Number(result.lastInsertRowid) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/portfolio/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const { category, title, location, description, tag, status, gradient, sort_order } = req.body;
        db.prepare(`
            UPDATE website_portfolio
            SET category = ?, title = ?, location = ?, description = ?, tag = ?, status = ?, gradient = ?, sort_order = ?
            WHERE id = ?
        `).run(category, title, location || '', description || '', tag || '', status || 'ส่งมอบงาน 100%', gradient || 'from-sky-900 to-slate-800', Number(sort_order || 0), id);
        res.json({ success: true, message: 'แก้ไขผลงานเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/portfolio/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM website_portfolio WHERE id = ?').run(id);
        res.json({ success: true, message: 'ลบผลงานเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
