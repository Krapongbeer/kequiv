const express = require('express');
const router = express.Router();
const db = require('../db');
const { getNextDocumentCode, commitDocumentCode } = require('../utils/docNumber');
const { thaiBahtText } = require('../utils/thaiBahtText');

// GET next code preview
router.get('/next-code', (req, res) => {
    try {
        const { type = 'quotation', date = new Date().toISOString() } = req.query;
        const result = getNextDocumentCode(db, type, date);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET all documents with filter
router.get('/', (req, res) => {
    try {
        const {
            type, status, customer_id, project_id,
            search, start_date, end_date, limit = 100, offset = 0
        } = req.query;

        let query = `
            SELECT d.*, 
                   c.name as customer_name,
                   c.phone as customer_phone,
                   p.project_name
            FROM documents d
            LEFT JOIN customers c ON c.id = d.customer_id
            LEFT JOIN customer_projects p ON p.id = d.project_id
            WHERE d.deleted_at IS NULL
        `;
        const params = [];

        if (type && type !== 'all') {
            query += ' AND d.type = ?';
            params.push(type);
        }
        if (status && status !== 'all') {
            query += ' AND d.status = ?';
            params.push(status);
        }
        if (customer_id) {
            query += ' AND d.customer_id = ?';
            params.push(customer_id);
        }
        if (project_id) {
            query += ' AND d.project_id = ?';
            params.push(project_id);
        }
        if (start_date) {
            query += ' AND d.issue_date >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND d.issue_date <= ?';
            params.push(end_date);
        }
        if (search) {
            query += ' AND (d.code LIKE ? OR c.name LIKE ? OR d.project_name_custom LIKE ? OR p.project_name LIKE ?)';
            const s = `%${search}%`;
            params.push(s, s, s, s);
        }

        query += ' ORDER BY d.issue_date DESC, d.id DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit, 10), parseInt(offset, 10));

        const docs = db.prepare(query).all(...params);
        res.json({ success: true, data: docs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET single document by ID with full details & printable data
router.get('/:id', (req, res) => {
    try {
        const doc = db.prepare(`
            SELECT d.*, 
                   c.name as customer_name,
                   c.tax_id as customer_tax_id,
                   c.address as customer_address,
                   c.phone as customer_phone,
                   c.email as customer_email,
                   p.project_name,
                   p.site_address as project_site_address,
                   p.contact_person as project_contact_person,
                   ref.code as reference_code,
                   ref.type as reference_type
            FROM documents d
            LEFT JOIN customers c ON c.id = d.customer_id
            LEFT JOIN customer_projects p ON p.id = d.project_id
            LEFT JOIN documents ref ON ref.id = d.reference_document_id
            WHERE d.id = ? AND d.deleted_at IS NULL
        `).get(req.params.id);

        if (!doc) {
            return res.status(404).json({ success: false, error: 'ไม่พบเอกสาร' });
        }

        // Get document items
        doc.items = db.prepare(`
            SELECT * FROM document_items 
            WHERE document_id = ? 
            ORDER BY sort_order ASC, id ASC
        `).all(doc.id);

        // Compute Thai Baht Text
        doc.grand_total_thai = thaiBahtText(doc.grand_total);

        // Attach company info for printing
        const company = db.prepare('SELECT * FROM company_profile WHERE id = 1').get();
        if (company && company.bank_info) {
            try {
                company.bank_accounts = JSON.parse(company.bank_info);
            } catch (e) {
                company.bank_accounts = [];
            }
        }
        doc.company = company;

        res.json({ success: true, data: doc });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Helper to calculate totals from items
function calculateItemsTotal(items, docDiscountTotal = 0) {
    let subtotal = 0;
    const processedItems = items.map((item, index) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unit_price) || 0;
        const disc = parseFloat(item.discount) || 0;
        const discType = item.discount_type || 'amount';

        let rowDiscount = 0;
        const rawTotal = qty * price;
        if (discType === 'percent') {
            rowDiscount = (rawTotal * disc) / 100;
        } else {
            rowDiscount = disc;
        }

        const total = Math.max(0, rawTotal - rowDiscount);
        subtotal += total;

        return {
            sort_order: index + 1,
            product_name: (item.product_name || '').trim(),
            image_url: (item.image_url || '').trim(),
            quantity: qty,
            unit: (item.unit || 'ชิ้น').trim(),
            unit_price: price,
            discount: disc,
            discount_type: discType,
            total_price: total
        };
    });

    const docDiscount = parseFloat(docDiscountTotal) || 0;
    // No VAT: vat_amount = 0
    const vat_amount = 0.00;
    const grand_total = Math.max(0, subtotal - docDiscount);

    return {
        processedItems,
        subtotal,
        discount_total: docDiscount,
        vat_amount,
        grand_total
    };
}

// POST create document
router.post('/', (req, res) => {
    try {
        const {
            code_mode = 'auto', // 'auto', 'reserved', 'custom'
            specified_code = null,
            type, customer_id, project_id = null, project_name_custom = '',
            issue_date, due_date = null,
            items = [],
            discount_total = 0,
            status = 'issued',
            remark = '', payment_terms = '',
            reference_document_id = null
        } = req.body;

        if (!['quotation', 'billing', 'receipt'].includes(type)) {
            return res.status(400).json({ success: false, error: 'ประเภทเอกสารไม่ถูกต้อง' });
        }
        if (!customer_id) {
            return res.status(400).json({ success: false, error: 'กรุณาเลือกลูกค้า' });
        }
        if (!issue_date) {
            return res.status(400).json({ success: false, error: 'กรุณาระบุวันที่ออกเอกสาร' });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ' });
        }

        db.exec('BEGIN TRANSACTION');
        try {
            // Determine document code
            let finalCode;
            if (code_mode === 'reserved' || code_mode === 'custom') {
                if (!specified_code || !specified_code.trim()) {
                    throw new Error('กรุณาระบุเลขที่เอกสารที่ต้องการใช้');
                }
                const cleanCode = specified_code.trim();

                // Check collision in existing documents
                const existingDoc = db.prepare('SELECT id FROM documents WHERE code = ? AND deleted_at IS NULL').get(cleanCode);
                if (existingDoc) {
                    throw new Error(`เลขที่เอกสาร ${cleanCode} ถูกใช้งานไปแล้ว ไม่สามารถใช้ซ้ำได้`);
                }

                finalCode = commitDocumentCode(db, type, issue_date, cleanCode);
            } else {
                // Auto generate
                finalCode = commitDocumentCode(db, type, issue_date);
            }

            // Calculate totals
            const totals = calculateItemsTotal(items, discount_total);

            // Insert document header
            const insertDoc = db.prepare(`
                INSERT INTO documents (
                    code, type, customer_id, project_id, project_name_custom, reference_document_id,
                    issue_date, due_date, subtotal, discount_total, vat_amount, grand_total,
                    status, remark, payment_terms
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const result = insertDoc.run(
                finalCode, type, customer_id, project_id || null, project_name_custom || '', reference_document_id || null,
                issue_date, due_date || null, totals.subtotal, totals.discount_total, totals.vat_amount, totals.grand_total,
                status, remark || '', payment_terms || ''
            );
            const docId = result.lastInsertRowid;

            // Insert items
            const insertItem = db.prepare(`
                INSERT INTO document_items (
                    document_id, sort_order, product_name, image_url, quantity, unit, unit_price, discount, discount_type, total_price
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const item of totals.processedItems) {
                insertItem.run(
                    docId, item.sort_order, item.product_name, item.image_url || '', item.quantity, item.unit,
                    item.unit_price, item.discount, item.discount_type, item.total_price
                );
            }

            db.exec('COMMIT');

            res.json({
                success: true,
                message: 'บันทึกเอกสารเรียบร้อยแล้ว',
                data: { id: docId, code: finalCode }
            });
        } catch (e) {
            db.exec('ROLLBACK');
            throw e;
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT update document
router.put('/:id', (req, res) => {
    try {
        const docId = req.params.id;
        const existing = db.prepare('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL').get(docId);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'ไม่พบเอกสาร' });
        }
        if (existing.status === 'cancelled') {
            return res.status(400).json({ success: false, error: 'เอกสารที่ถูกยกเลิกแล้วไม่สามารถแก้ไขได้' });
        }

        const {
            customer_id, project_id = null, project_name_custom = '',
            issue_date, due_date = null,
            items = [],
            discount_total = 0,
            status,
            remark = '', payment_terms = ''
        } = req.body;

        db.exec('BEGIN TRANSACTION');
        try {
            const totals = calculateItemsTotal(items, discount_total);

            // Update document header
            db.prepare(`
                UPDATE documents SET
                    customer_id = COALESCE(?, customer_id),
                    project_id = ?,
                    project_name_custom = ?,
                    issue_date = COALESCE(?, issue_date),
                    due_date = ?,
                    subtotal = ?,
                    discount_total = ?,
                    vat_amount = 0,
                    grand_total = ?,
                    status = COALESCE(?, status),
                    remark = ?,
                    payment_terms = ?,
                    updated_at = datetime('now')
                WHERE id = ?
            `).run(
                customer_id, project_id || null, project_name_custom || '',
                issue_date, due_date || null,
                totals.subtotal, totals.discount_total, totals.grand_total,
                status, remark || '', payment_terms || '',
                docId
            );

            // Re-insert items
            db.prepare('DELETE FROM document_items WHERE document_id = ?').run(docId);
            const insertItem = db.prepare(`
                INSERT INTO document_items (
                    document_id, sort_order, product_name, image_url, quantity, unit, unit_price, discount, discount_type, total_price
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const item of totals.processedItems) {
                insertItem.run(
                    docId, item.sort_order, item.product_name, item.image_url || '', item.quantity, item.unit,
                    item.unit_price, item.discount, item.discount_type, item.total_price
                );
            }

            db.exec('COMMIT');
            res.json({ success: true, message: 'แก้ไขเอกสารเรียบร้อยแล้ว' });
        } catch (e) {
            db.exec('ROLLBACK');
            throw e;
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST convert document (e.g. Quotation -> Billing Note, Billing Note -> Receipt)
router.post('/:id/convert', (req, res) => {
    try {
        const sourceDoc = db.prepare('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
        if (!sourceDoc) {
            return res.status(404).json({ success: false, error: 'ไม่พบเอกสารต้นทาง' });
        }

        const { target_type, issue_date = new Date().toISOString().slice(0, 10), due_date = null } = req.body;
        if (!['quotation', 'billing', 'receipt'].includes(target_type)) {
            return res.status(400).json({ success: false, error: 'ประเภทเอกสารปลายทางไม่ถูกต้อง' });
        }

        const items = db.prepare('SELECT * FROM document_items WHERE document_id = ? ORDER BY sort_order ASC').all(sourceDoc.id);

        db.exec('BEGIN TRANSACTION');
        try {
            const newCode = commitDocumentCode(db, target_type, issue_date);

            const insertDoc = db.prepare(`
                INSERT INTO documents (
                    code, type, customer_id, project_id, project_name_custom, reference_document_id,
                    issue_date, due_date, subtotal, discount_total, vat_amount, grand_total,
                    status, remark, payment_terms
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'issued', ?, ?)
            `);

            const result = insertDoc.run(
                newCode, target_type, sourceDoc.customer_id, sourceDoc.project_id, sourceDoc.project_name_custom,
                sourceDoc.id, issue_date, due_date || null,
                sourceDoc.subtotal, sourceDoc.discount_total, sourceDoc.grand_total,
                `อ้างอิงจากเอกสาร ${sourceDoc.code}\n${sourceDoc.remark || ''}`.trim(),
                sourceDoc.payment_terms || ''
            );
            const newDocId = result.lastInsertRowid;

            const insertItem = db.prepare(`
                INSERT INTO document_items (
                    document_id, sort_order, product_name, image_url, quantity, unit, unit_price, discount, discount_type, total_price
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const it of items) {
                insertItem.run(
                    newDocId, it.sort_order, it.product_name, it.image_url || '', it.quantity, it.unit,
                    it.unit_price, it.discount, it.discount_type, it.total_price
                );
            }

            db.exec('COMMIT');

            res.json({
                success: true,
                message: `แปลงเป็น ${target_type} สำเร็จ (เลขที่ ${newCode})`,
                data: { id: newDocId, code: newCode }
            });
        } catch (e) {
            db.exec('ROLLBACK');
            throw e;
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST duplicate document
router.post('/:id/duplicate', (req, res) => {
    try {
        const sourceDoc = db.prepare('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
        if (!sourceDoc) {
            return res.status(404).json({ success: false, error: 'ไม่พบเอกสารต้นฉบับ' });
        }

        const items = db.prepare('SELECT * FROM document_items WHERE document_id = ? ORDER BY sort_order ASC').all(sourceDoc.id);
        const today = new Date().toISOString().slice(0, 10);

        db.exec('BEGIN TRANSACTION');
        try {
            const newCode = commitDocumentCode(db, sourceDoc.type, today);

            const insertDoc = db.prepare(`
                INSERT INTO documents (
                    code, type, customer_id, project_id, project_name_custom, reference_document_id,
                    issue_date, due_date, subtotal, discount_total, vat_amount, grand_total,
                    status, remark, payment_terms
                ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, 0, ?, 'draft', ?, ?)
            `);

            const result = insertDoc.run(
                newCode, sourceDoc.type, sourceDoc.customer_id, sourceDoc.project_id, sourceDoc.project_name_custom,
                today, sourceDoc.due_date,
                sourceDoc.subtotal, sourceDoc.discount_total, sourceDoc.grand_total,
                sourceDoc.remark || '', sourceDoc.payment_terms || ''
            );
            const newDocId = result.lastInsertRowid;

            const insertItem = db.prepare(`
                INSERT INTO document_items (
                    document_id, sort_order, product_name, image_url, quantity, unit, unit_price, discount, discount_type, total_price
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const it of items) {
                insertItem.run(
                    newDocId, it.sort_order, it.product_name, it.image_url || '', it.quantity, it.unit,
                    it.unit_price, it.discount, it.discount_type, it.total_price
                );
            }

            db.exec('COMMIT');

            res.json({
                success: true,
                message: `คัดลอกเอกสารสำเร็จ (เลขที่ใหม่ ${newCode})`,
                data: { id: newDocId, code: newCode }
            });
        } catch (e) {
            db.exec('ROLLBACK');
            throw e;
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST cancel (Void) document
router.post('/:id/cancel', (req, res) => {
    try {
        const { reason = '' } = req.body;
        const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
        if (!doc) {
            return res.status(404).json({ success: false, error: 'ไม่พบเอกสาร' });
        }
        if (doc.status === 'cancelled') {
            return res.status(400).json({ success: false, error: 'เอกสารนี้ถูกยกเลิกไปแล้ว' });
        }

        db.prepare(`
            UPDATE documents SET
                status = 'cancelled',
                cancel_reason = ?,
                cancelled_at = datetime('now'),
                updated_at = datetime('now')
            WHERE id = ?
        `).run(reason || 'ยกเลิกตามคำขอ', req.params.id);

        res.json({ success: true, message: `ยกเลิกเอกสาร ${doc.code} เรียบร้อยแล้ว` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST mark as paid
router.post('/:id/mark-paid', (req, res) => {
    try {
        db.prepare(`
            UPDATE documents SET
                status = 'paid',
                updated_at = datetime('now')
            WHERE id = ? AND deleted_at IS NULL
        `).run(req.params.id);

        res.json({ success: true, message: 'บันทึกสถานะชำระเงินแล้ว' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE soft delete document
router.delete('/:id', (req, res) => {
    try {
        db.prepare("UPDATE documents SET deleted_at = datetime('now') WHERE id = ?").run(req.params.id);
        res.json({ success: true, message: 'ลบเอกสารเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
