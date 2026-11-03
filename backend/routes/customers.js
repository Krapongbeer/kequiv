const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all active customers
router.get('/', (req, res) => {
    try {
        const { search } = req.query;
        let query = `
            SELECT c.*, 
                   COUNT(DISTINCT p.id) as project_count,
                   COUNT(DISTINCT d.id) as document_count,
                   COALESCE(SUM(CASE WHEN d.status != 'cancelled' THEN d.grand_total ELSE 0 END), 0) as total_spent
            FROM customers c
            LEFT JOIN customer_projects p ON p.customer_id = c.id AND p.deleted_at IS NULL
            LEFT JOIN documents d ON d.customer_id = c.id AND d.deleted_at IS NULL
            WHERE c.deleted_at IS NULL
        `;
        const params = [];

        if (search) {
            query += ` AND (c.name LIKE ? OR c.phone LIKE ? OR c.tax_id LIKE ? OR c.email LIKE ?)`;
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        query += ` GROUP BY c.id ORDER BY c.id DESC`;

        const customers = db.prepare(query).all(...params);

        // Fetch projects for each customer
        const projectsStmt = db.prepare(`
            SELECT * FROM customer_projects 
            WHERE customer_id = ? AND deleted_at IS NULL 
            ORDER BY id ASC
        `);

        for (const customer of customers) {
            customer.projects = projectsStmt.all(customer.id);
        }

        res.json({ success: true, data: customers });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET customer by ID
router.get('/:id', (req, res) => {
    try {
        const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลลูกค้า' });
        }

        customer.projects = db.prepare(`
            SELECT * FROM customer_projects 
            WHERE customer_id = ? AND deleted_at IS NULL 
            ORDER BY id ASC
        `).all(customer.id);

        customer.documents = db.prepare(`
            SELECT id, code, type, issue_date, grand_total, status, project_name_custom
            FROM documents 
            WHERE customer_id = ? AND deleted_at IS NULL 
            ORDER BY issue_date DESC, id DESC
        `).all(customer.id);

        res.json({ success: true, data: customer });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST create customer
router.post('/', (req, res) => {
    try {
        const { name, tax_id, address, phone, email, note, initial_projects } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, error: 'กรุณากรอกชื่อลูกค้า' });
        }

        db.exec('BEGIN TRANSACTION');
        try {
            const insertCustomer = db.prepare(`
                INSERT INTO customers (name, tax_id, address, phone, email, note)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            const result = insertCustomer.run(
                name.trim(), tax_id || '', address || '', phone || '', email || '', note || ''
            );
            const customerId = result.lastInsertRowid;

            // Insert initial projects if provided
            if (Array.isArray(initial_projects) && initial_projects.length > 0) {
                const insertProject = db.prepare(`
                    INSERT INTO customer_projects (customer_id, project_name, site_address, contact_person, note)
                    VALUES (?, ?, ?, ?, ?)
                `);
                for (const proj of initial_projects) {
                    if (proj.project_name && proj.project_name.trim()) {
                        insertProject.run(
                            customerId,
                            proj.project_name.trim(),
                            proj.site_address || '',
                            proj.contact_person || '',
                            proj.note || ''
                        );
                    }
                }
            }

            db.exec('COMMIT');

            const newCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
            newCustomer.projects = db.prepare('SELECT * FROM customer_projects WHERE customer_id = ? AND deleted_at IS NULL').all(customerId);
            res.json({ success: true, data: newCustomer });
        } catch (e) {
            db.exec('ROLLBACK');
            throw e;
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT update customer
router.put('/:id', (req, res) => {
    try {
        const { name, tax_id, address, phone, email, note } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, error: 'กรุณากรอกชื่อลูกค้า' });
        }

        const updateStmt = db.prepare(`
            UPDATE customers SET
                name = ?, tax_id = ?, address = ?, phone = ?, email = ?, note = ?,
                updated_at = datetime('now')
            WHERE id = ? AND deleted_at IS NULL
        `);
        const result = updateStmt.run(
            name.trim(), tax_id || '', address || '', phone || '', email || '', note || '',
            req.params.id
        );

        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลลูกค้า' });
        }

        const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE soft delete customer
router.delete('/:id', (req, res) => {
    try {
        const activeDocs = db.prepare(`
            SELECT COUNT(*) as count FROM documents 
            WHERE customer_id = ? AND deleted_at IS NULL AND status != 'cancelled'
        `).get(req.params.id).count;

        if (activeDocs > 0) {
            return res.status(400).json({
                success: false,
                error: `ไม่สามารถลบได้ เนื่องจากลูกค้ามีเอกสารที่ยังใช้งานอยู่ ${activeDocs} ฉบับ`
            });
        }

        db.prepare("UPDATE customers SET deleted_at = datetime('now') WHERE id = ?").run(req.params.id);
        res.json({ success: true, message: 'ลบข้อมูลลูกค้าเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- Customer Projects (หัวบิล / โครงการย่อย) ---

// POST add project to customer
router.post('/:id/projects', (req, res) => {
    try {
        const { project_name, site_address, contact_person, note } = req.body;
        if (!project_name || !project_name.trim()) {
            return res.status(400).json({ success: false, error: 'กรุณาระบุชื่อโครงการ / หัวบิล' });
        }

        const insert = db.prepare(`
            INSERT INTO customer_projects (customer_id, project_name, site_address, contact_person, note)
            VALUES (?, ?, ?, ?, ?)
        `);
        const result = insert.run(
            req.params.id,
            project_name.trim(),
            site_address || '',
            contact_person || '',
            note || ''
        );

        const newProject = db.prepare('SELECT * FROM customer_projects WHERE id = ?').get(result.lastInsertRowid);
        res.json({ success: true, data: newProject });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT update project
router.put('/:id/projects/:projectId', (req, res) => {
    try {
        const { project_name, site_address, contact_person, note } = req.body;
        if (!project_name || !project_name.trim()) {
            return res.status(400).json({ success: false, error: 'กรุณาระบุชื่อโครงการ / หัวบิล' });
        }

        db.prepare(`
            UPDATE customer_projects SET
                project_name = ?, site_address = ?, contact_person = ?, note = ?
            WHERE id = ? AND customer_id = ? AND deleted_at IS NULL
        `).run(project_name.trim(), site_address || '', contact_person || '', note || '', req.params.projectId, req.params.id);

        const updated = db.prepare('SELECT * FROM customer_projects WHERE id = ?').get(req.params.projectId);
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE soft delete project
router.delete('/:id/projects/:projectId', (req, res) => {
    try {
        db.prepare("UPDATE customer_projects SET deleted_at = datetime('now') WHERE id = ? AND customer_id = ?").run(
            req.params.projectId, req.params.id
        );
        res.json({ success: true, message: 'ลบโครงการเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
