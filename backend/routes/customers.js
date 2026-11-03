const express = require('express');
const router = express.Router();
const db = require('../db');
const { supabase, isSupabaseConfigured } = require('../supabase');

// GET all active customers
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;

        if (isSupabaseConfigured && supabase) {
            let query = supabase
                .from('customers')
                .select(`
                    *,
                    projects:customer_projects(*),
                    documents:documents(id, grand_total, status, deleted_at)
                `)
                .is('deleted_at', null)
                .order('id', { ascending: false });

            if (search && search.trim()) {
                const s = search.trim();
                query = query.or(`name.ilike.%${s}%,phone.ilike.%${s}%,tax_id.ilike.%${s}%,email.ilike.%${s}%`);
            }

            const { data, error } = await query;
            if (error) throw new Error(error.message);

            const result = (data || []).map(c => {
                const activeProjects = (c.projects || []).filter(p => !p.deleted_at);
                const activeDocs = (c.documents || []).filter(d => !d.deleted_at);
                const totalSpent = activeDocs.reduce((sum, d) => {
                    return d.status !== 'cancelled' ? sum + Number(d.grand_total || 0) : sum;
                }, 0);

                return {
                    ...c,
                    projects: activeProjects,
                    project_count: activeProjects.length,
                    document_count: activeDocs.length,
                    total_spent: totalSpent
                };
            });

            return res.json({ success: true, data: result });
        }

        // SQLite Fallback
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
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;

        if (isSupabaseConfigured && supabase) {
            const { data: customer, error } = await supabase
                .from('customers')
                .select(`
                    *,
                    projects:customer_projects(*),
                    documents:documents(id, code, type, issue_date, grand_total, status, project_name_custom, deleted_at)
                `)
                .eq('id', id)
                .is('deleted_at', null)
                .single();

            if (error || !customer) {
                return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลลูกค้า' });
            }

            customer.projects = (customer.projects || []).filter(p => !p.deleted_at);
            customer.documents = (customer.documents || [])
                .filter(d => !d.deleted_at)
                .sort((a, b) => (b.issue_date || '').localeCompare(a.issue_date || '') || b.id - a.id);

            return res.json({ success: true, data: customer });
        }

        // SQLite Fallback
        const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL').get(id);
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
router.post('/', async (req, res) => {
    try {
        const { name, tax_id, address, phone, email, note, initial_projects } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, error: 'กรุณากรอกชื่อลูกค้า' });
        }

        if (isSupabaseConfigured && supabase) {
            const { data: newCustomer, error } = await supabase
                .from('customers')
                .insert({
                    name: name.trim(),
                    tax_id: tax_id || '',
                    address: address || '',
                    phone: phone || '',
                    email: email || '',
                    note: note || ''
                })
                .select()
                .single();

            if (error) throw new Error(error.message);

            let createdProjects = [];
            if (Array.isArray(initial_projects) && initial_projects.length > 0) {
                const projectRows = initial_projects
                    .filter(p => p.project_name && p.project_name.trim())
                    .map(p => ({
                        customer_id: newCustomer.id,
                        project_name: p.project_name.trim(),
                        site_address: p.site_address || '',
                        contact_person: p.contact_person || '',
                        note: p.note || ''
                    }));

                if (projectRows.length > 0) {
                    const { data: projs, error: pErr } = await supabase
                        .from('customer_projects')
                        .insert(projectRows)
                        .select();
                    if (!pErr && projs) createdProjects = projs;
                }
            }

            newCustomer.projects = createdProjects;
            return res.json({ success: true, data: newCustomer });
        }

        // SQLite Fallback
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
router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { name, tax_id, address, phone, email, note } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, error: 'กรุณากรอกชื่อลูกค้า' });
        }

        if (isSupabaseConfigured && supabase) {
            const { data, error } = await supabase
                .from('customers')
                .update({
                    name: name.trim(),
                    tax_id: tax_id !== undefined ? tax_id : '',
                    address: address !== undefined ? address : '',
                    phone: phone !== undefined ? phone : '',
                    email: email !== undefined ? email : '',
                    note: note !== undefined ? note : '',
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .is('deleted_at', null)
                .select()
                .single();

            if (error) throw new Error(error.message);

            const { data: projs } = await supabase
                .from('customer_projects')
                .select('*')
                .eq('customer_id', id)
                .is('deleted_at', null);

            data.projects = projs || [];
            return res.json({ success: true, data });
        }

        // SQLite Fallback
        const updateStmt = db.prepare(`
            UPDATE customers SET
                name = ?, tax_id = ?, address = ?, phone = ?, email = ?, note = ?,
                updated_at = datetime('now')
            WHERE id = ? AND deleted_at IS NULL
        `);
        updateStmt.run(name.trim(), tax_id || '', address || '', phone || '', email || '', note || '', id);

        const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
        if (!updated) {
            return res.status(404).json({ success: false, error: 'ไม่พบข้อมูลลูกค้า' });
        }
        updated.projects = db.prepare('SELECT * FROM customer_projects WHERE customer_id = ? AND deleted_at IS NULL').all(id);
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE customer (Soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;

        if (isSupabaseConfigured && supabase) {
            const now = new Date().toISOString();
            const { error } = await supabase
                .from('customers')
                .update({ deleted_at: now })
                .eq('id', id);

            if (error) throw new Error(error.message);

            // Also soft delete projects
            await supabase
                .from('customer_projects')
                .update({ deleted_at: now })
                .eq('customer_id', id);

            return res.json({ success: true, message: 'ลบข้อมูลลูกค้าเรียบร้อยแล้ว' });
        }

        // SQLite Fallback
        db.prepare("UPDATE customers SET deleted_at = datetime('now') WHERE id = ?").run(id);
        db.prepare("UPDATE customer_projects SET deleted_at = datetime('now') WHERE customer_id = ?").run(id);
        res.json({ success: true, message: 'ลบข้อมูลลูกค้าเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST add customer project
router.post('/:id/projects', async (req, res) => {
    try {
        const customerId = req.params.id;
        const { project_name, site_address, contact_person, note } = req.body;

        if (!project_name || !project_name.trim()) {
            return res.status(400).json({ success: false, error: 'กรุณาระบุชื่อโครงการ / หัวบิล' });
        }

        if (isSupabaseConfigured && supabase) {
            const { data, error } = await supabase
                .from('customer_projects')
                .insert({
                    customer_id: customerId,
                    project_name: project_name.trim(),
                    site_address: site_address || '',
                    contact_person: contact_person || '',
                    note: note || ''
                })
                .select()
                .single();

            if (error) throw new Error(error.message);
            return res.json({ success: true, data });
        }

        // SQLite Fallback
        const stmt = db.prepare(`
            INSERT INTO customer_projects (customer_id, project_name, site_address, contact_person, note)
            VALUES (?, ?, ?, ?, ?)
        `);
        const result = stmt.run(customerId, project_name.trim(), site_address || '', contact_person || '', note || '');
        const project = db.prepare('SELECT * FROM customer_projects WHERE id = ?').get(result.lastInsertRowid);
        res.json({ success: true, data: project });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE customer project (Soft delete)
router.delete('/projects/:projectId', async (req, res) => {
    try {
        const projectId = req.params.projectId;

        if (isSupabaseConfigured && supabase) {
            const { error } = await supabase
                .from('customer_projects')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', projectId);

            if (error) throw new Error(error.message);
            return res.json({ success: true, message: 'ลบโครงการเรียบร้อยแล้ว' });
        }

        // SQLite Fallback
        db.prepare("UPDATE customer_projects SET deleted_at = datetime('now') WHERE id = ?").run(projectId);
        res.json({ success: true, message: 'ลบโครงการเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
