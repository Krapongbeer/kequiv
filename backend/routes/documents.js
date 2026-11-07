const express = require('express');
const router = express.Router();
const db = require('../db');
const { getNextDocumentCode, commitDocumentCode } = require('../utils/docNumber');
const { getNextDocumentCodeSupabase, commitDocumentCodeSupabase } = require('../utils/docNumberSupabase');
const { thaiBahtText } = require('../utils/thaiBahtText');
const { supabase, isSupabaseConfigured } = require('../supabase');
const { logAudit } = require('../services/auditService');
const { generateDocShareKey } = require('../utils/shareSecurity');
const { extractServiceBillInfo, serializeServiceBillRemark } = require('../utils/serviceBillHelper');

// Helper to calculate totals from items
function calculateItemsTotal(items, docDiscountTotal = 0) {
    let subtotal = 0;
    const processedItems = items.map((item, index) => {
        const qty = Math.max(1, Math.round(parseFloat(item.quantity) || 1));
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
    const vat_amount = 0.00; // ร้านไม่มี VAT
    const grand_total = Math.max(0, subtotal - docDiscount);

    return {
        processedItems,
        subtotal,
        discount_total: docDiscount,
        vat_amount,
        grand_total
    };
}

// GET next code preview
router.get('/next-code', async (req, res) => {
    try {
        const { type = 'quotation', date = new Date().toISOString() } = req.query;

        if (isSupabaseConfigured && supabase) {
            const result = await getNextDocumentCodeSupabase(supabase, type, date);
            return res.json({ success: true, data: result });
        }

        const result = getNextDocumentCode(db, type, date);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET next codes for ALL types (quotation, billing, receipt) for any date (present, past, or future)
router.get('/next-codes-all', async (req, res) => {
    try {
        const { date = new Date().toISOString() } = req.query;

        if (isSupabaseConfigured && supabase) {
            const [qt, inv, re] = await Promise.all([
                getNextDocumentCodeSupabase(supabase, 'quotation', date),
                getNextDocumentCodeSupabase(supabase, 'billing', date),
                getNextDocumentCodeSupabase(supabase, 'receipt', date)
            ]);
            return res.json({
                success: true,
                data: {
                    quotation: qt,
                    billing: inv,
                    receipt: re
                }
            });
        }

        const qt = getNextDocumentCode(db, 'quotation', date);
        const inv = getNextDocumentCode(db, 'billing', date);
        const re = getNextDocumentCode(db, 'receipt', date);

        res.json({
            success: true,
            data: {
                quotation: qt,
                billing: inv,
                receipt: re
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET all documents with filter
router.get('/', async (req, res) => {
    try {
        const {
            type, status, customer_id, project_id,
            search, start_date, end_date, service_bill, limit = 100, offset = 0
        } = req.query;

        if (isSupabaseConfigured && supabase) {
            let query = supabase
                .from('documents')
                .select(`
                    *,
                    customer:customers(name, phone),
                    project:customer_projects(project_name)
                `)
                .is('deleted_at', null)
                .order('issue_date', { ascending: false })
                .order('id', { ascending: false })
                .range(parseInt(offset, 10), parseInt(offset, 10) + parseInt(limit, 10) - 1);

            if (type && type !== 'all') {
                query = query.eq('type', type);
            }
            if (status && status !== 'all') {
                query = query.eq('status', status);
            }
            if (customer_id) {
                query = query.eq('customer_id', customer_id);
            }
            if (project_id) {
                query = query.eq('project_id', project_id);
            }
            if (start_date) {
                query = query.gte('issue_date', start_date);
            }
            if (end_date) {
                query = query.lte('issue_date', end_date);
            }
            if (service_bill === 'service') {
                query = query.ilike('remark', '%[บิลที่ร้านให้บริการ:%');
            } else if (service_bill === 'regular') {
                query = query.not('remark', 'ilike', '%[บิลที่ร้านให้บริการ:%');
            }
            if (search && search.trim()) {
                const s = search.trim();
                query = query.or(`code.ilike.%${s}%,project_name_custom.ilike.%${s}%`);
            }

            const { data, error } = await query;
            if (error) throw new Error(error.message);

            const result = (data || []).map(d => {
                extractServiceBillInfo(d);
                return {
                    ...d,
                    customer_name: d.customer ? d.customer.name : '-',
                    customer_phone: d.customer ? d.customer.phone : '',
                    project_name: d.project ? d.project.project_name : null,
                    share_key: generateDocShareKey(d.code, d.id)
                };
            });

            return res.json({ success: true, data: result });
        }

        // SQLite Fallback
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
        if (service_bill === 'service') {
            query += ' AND d.remark LIKE ?';
            params.push('%[บิลที่ร้านให้บริการ:%');
        } else if (service_bill === 'regular') {
            query += ' AND (d.remark NOT LIKE ? OR d.remark IS NULL)';
            params.push('%[บิลที่ร้านให้บริการ:%');
        }
        if (search) {
            query += ' AND (d.code LIKE ? OR c.name LIKE ? OR d.project_name_custom LIKE ? OR p.project_name LIKE ?)';
            const s = `%${search}%`;
            params.push(s, s, s, s);
        }

        query += ' ORDER BY d.issue_date DESC, d.id DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit, 10), parseInt(offset, 10));

        const docs = db.prepare(query).all(...params).map(d => {
            extractServiceBillInfo(d);
            return {
                ...d,
                share_key: generateDocShareKey(d.code, d.id)
            };
        });
        res.json({ success: true, data: docs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET single document by ID with full details & printable data
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;

        if (isSupabaseConfigured && supabase) {
            const { data: doc, error } = await supabase
                .from('documents')
                .select(`
                    *,
                    customer:customers(name, tax_id, address, phone, email),
                    project:customer_projects(project_name, site_address, contact_person),
                    items:document_items(*)
                `)
                .eq('id', id)
                .is('deleted_at', null)
                .single();

            if (error || !doc) {
                console.error('Supabase fetch document error:', error);
                return res.status(404).json({ success: false, error: 'ไม่พบเอกสาร' });
            }

            // If reference_document_id exists, fetch reference doc code
            let reference_code = null;
            let reference_type = null;
            if (doc.reference_document_id) {
                const { data: refDoc } = await supabase
                    .from('documents')
                    .select('code, type')
                    .eq('id', doc.reference_document_id)
                    .maybeSingle();

                if (refDoc) {
                    reference_code = refDoc.code;
                    reference_type = refDoc.type;
                }
            }

            const flattened = {
                ...doc,
                customer_name: doc.customer ? doc.customer.name : '-',
                customer_tax_id: doc.customer ? doc.customer.tax_id : '',
                customer_address: doc.customer ? doc.customer.address : '',
                customer_phone: doc.customer ? doc.customer.phone : '',
                customer_email: doc.customer ? doc.customer.email : '',
                project_name: doc.project ? doc.project.project_name : null,
                project_site_address: doc.project ? doc.project.site_address : '',
                project_contact_person: doc.project ? doc.project.contact_person : '',
                reference_code,
                reference_type,
                items: (doc.items || []).sort((a, b) => a.sort_order - b.sort_order)
            };

            flattened.grand_total_thai = thaiBahtText(flattened.grand_total);
            flattened.share_key = generateDocShareKey(flattened.code, flattened.id);
            extractServiceBillInfo(flattened);

            // Attach company info
            const { data: comp } = await supabase.from('company_profile').select('*').eq('id', 1).single();
            if (comp) {
                try {
                    comp.bank_accounts = typeof comp.bank_info === 'string' ? JSON.parse(comp.bank_info) : (comp.bank_info || []);
                } catch (e) {
                    comp.bank_accounts = [];
                }
                flattened.company = comp;
            }

            return res.json({ success: true, data: flattened });
        }

        // SQLite Fallback
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
        `).get(id);

        if (!doc) {
            return res.status(404).json({ success: false, error: 'ไม่พบเอกสาร' });
        }

        doc.items = db.prepare(`
            SELECT * FROM document_items 
            WHERE document_id = ? 
            ORDER BY sort_order ASC, id ASC
        `).all(doc.id);

        doc.grand_total_thai = thaiBahtText(doc.grand_total);
        doc.share_key = generateDocShareKey(doc.code, doc.id);
        extractServiceBillInfo(doc);

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

// POST create document
router.post('/', async (req, res) => {
    try {
        const {
            code_mode = 'auto',
            specified_code = null,
            type, customer_id, project_id = null, project_name_custom = '',
            issue_date, due_date = null,
            items = [],
            discount_total = 0,
            status = 'issued',
            remark = '', payment_terms = '',
            reference_document_id = null,
            is_service_bill = false,
            service_fee_percent = 0,
            service_fee_amount = 0,
            partner_payout_amount = 0,
            partner_name = ''
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

        const totals = calculateItemsTotal(items, discount_total);

        // Internal Service Bill Calculations
        const feeAmount = is_service_bill
            ? (Number(service_fee_amount) || Math.round((totals.grand_total * (Number(service_fee_percent) / 100)) * 100) / 100)
            : 0;
        const payoutAmount = is_service_bill
            ? (Number(partner_payout_amount) || Math.round((totals.grand_total - feeAmount) * 100) / 100)
            : 0;
        const finalRemark = serializeServiceBillRemark(remark, is_service_bill, service_fee_percent, feeAmount, payoutAmount, partner_name);

        if (isSupabaseConfigured && supabase) {
            let finalCode;
            if (code_mode === 'reserved' || code_mode === 'custom') {
                if (!specified_code || !specified_code.trim()) {
                    throw new Error('กรุณาระบุเลขที่เอกสารที่ต้องการใช้');
                }
                const cleanCode = specified_code.trim();

                const { data: existingDoc } = await supabase
                    .from('documents')
                    .select('id')
                    .eq('code', cleanCode)
                    .is('deleted_at', null)
                    .maybeSingle();

                if (existingDoc) {
                    throw new Error(`เลขที่เอกสาร ${cleanCode} ถูกใช้งานไปแล้ว ไม่สามารถใช้ซ้ำได้`);
                }

                finalCode = await commitDocumentCodeSupabase(supabase, type, issue_date, cleanCode);
            } else {
                finalCode = await commitDocumentCodeSupabase(supabase, type, issue_date);
            }

            const { data: newDoc, error: docErr } = await supabase
                .from('documents')
                .insert({
                    code: finalCode,
                    type,
                    customer_id: parseInt(customer_id, 10),
                    project_id: project_id ? parseInt(project_id, 10) : null,
                    project_name_custom: project_name_custom || '',
                    reference_document_id: reference_document_id ? parseInt(reference_document_id, 10) : null,
                    issue_date,
                    due_date: due_date || null,
                    subtotal: totals.subtotal,
                    discount_total: totals.discount_total,
                    vat_amount: 0,
                    grand_total: totals.grand_total,
                    status,
                    remark: finalRemark,
                    payment_terms: payment_terms || ''
                })
                .select()
                .single();

            if (docErr) throw new Error(docErr.message);

            const itemRows = totals.processedItems.map(it => ({
                document_id: newDoc.id,
                sort_order: it.sort_order,
                product_name: it.product_name,
                image_url: it.image_url || '',
                quantity: it.quantity,
                unit: it.unit,
                unit_price: it.unit_price,
                discount: it.discount,
                discount_type: it.discount_type,
                total_price: it.total_price
            }));

            const { error: itemErr } = await supabase.from('document_items').insert(itemRows);
            if (itemErr) throw new Error(itemErr.message);

            await logAudit(req, 'DOCUMENT_CREATED', {
                targetType: 'document',
                targetId: newDoc.id,
                details: `สร้างเอกสาร ${finalCode} (${type}) ยอดรวม ฿${totals.grand_total}`
            });

            return res.json({
                success: true,
                message: 'บันทึกเอกสารเรียบร้อยแล้ว',
                data: { id: newDoc.id, code: finalCode }
            });
        }

        // SQLite Fallback
        db.exec('BEGIN TRANSACTION');
        try {
            let finalCode;
            if (code_mode === 'reserved' || code_mode === 'custom') {
                if (!specified_code || !specified_code.trim()) {
                    throw new Error('กรุณาระบุเลขที่เอกสารที่ต้องการใช้');
                }
                const cleanCode = specified_code.trim();
                const existingDoc = db.prepare('SELECT id FROM documents WHERE code = ? AND deleted_at IS NULL').get(cleanCode);
                if (existingDoc) {
                    throw new Error(`เลขที่เอกสาร ${cleanCode} ถูกใช้งานไปแล้ว ไม่สามารถใช้ซ้ำได้`);
                }
                finalCode = commitDocumentCode(db, type, issue_date, cleanCode);
            } else {
                finalCode = commitDocumentCode(db, type, issue_date);
            }

            const insertDoc = db.prepare(`
                INSERT INTO documents (
                    code, type, customer_id, project_id, project_name_custom, reference_document_id,
                    issue_date, due_date, subtotal, discount_total, vat_amount, grand_total,
                    status, remark, payment_terms,
                    is_service_bill, service_fee_percent, service_fee_amount, partner_payout_amount, partner_name
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const result = insertDoc.run(
                finalCode, type, customer_id, project_id || null, project_name_custom || '', reference_document_id || null,
                issue_date, due_date || null, totals.subtotal, totals.discount_total, totals.vat_amount, totals.grand_total,
                status, finalRemark, payment_terms || '',
                is_service_bill ? 1 : 0, Number(service_fee_percent) || 0, feeAmount, payoutAmount, (partner_name || '').trim()
            );
            const docId = result.lastInsertRowid;

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

            await logAudit(req, 'DOCUMENT_CREATED', {
                targetType: 'document',
                targetId: docId,
                details: `สร้างเอกสาร ${finalCode} (${type}) ยอดรวม ฿${totals.grand_total}`
            });

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

// PUT update existing document
router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const {
            customer_id, project_id = null, project_name_custom = '',
            issue_date, due_date = null,
            items = [],
            discount_total = 0,
            status,
            remark = '', payment_terms = '',
            is_service_bill = false,
            service_fee_percent = 0,
            service_fee_amount = 0,
            partner_payout_amount = 0,
            partner_name = ''
        } = req.body;

        if (!customer_id) {
            return res.status(400).json({ success: false, error: 'กรุณาเลือกลูกค้า' });
        }
        if (!issue_date) {
            return res.status(400).json({ success: false, error: 'กรุณาระบุวันที่ออกเอกสาร' });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: 'กรุณาระบุรายการสินค้าอย่างน้อย 1 รายการ' });
        }

        const totals = calculateItemsTotal(items, discount_total);

        // Internal Service Bill Calculations
        const feeAmount = is_service_bill
            ? (Number(service_fee_amount) || Math.round((totals.grand_total * (Number(service_fee_percent) / 100)) * 100) / 100)
            : 0;
        const payoutAmount = is_service_bill
            ? (Number(partner_payout_amount) || Math.round((totals.grand_total - feeAmount) * 100) / 100)
            : 0;
        const finalRemark = serializeServiceBillRemark(remark, is_service_bill, service_fee_percent, feeAmount, payoutAmount, partner_name);

        if (isSupabaseConfigured && supabase) {
            // Check existing
            const { data: existingDoc, error: fErr } = await supabase
                .from('documents')
                .select('id, code, type, status')
                .eq('id', id)
                .is('deleted_at', null)
                .maybeSingle();

            if (fErr || !existingDoc) {
                return res.status(404).json({ success: false, error: 'ไม่พบเอกสารที่ต้องการแก้ไข' });
            }

            if (existingDoc.status === 'cancelled') {
                return res.status(400).json({ success: false, error: 'ไม่สามารถแก้ไขเอกสารที่ถูกยกเลิกแล้วได้' });
            }

            // Update document header
            const docIdNum = parseInt(id, 10);
            const { error: uErr } = await supabase
                .from('documents')
                .update({
                    customer_id: parseInt(customer_id, 10),
                    project_id: project_id ? parseInt(project_id, 10) : null,
                    project_name_custom: project_name_custom || '',
                    issue_date,
                    due_date: due_date || null,
                    subtotal: totals.subtotal,
                    discount_total: totals.discount_total,
                    grand_total: totals.grand_total,
                    status: status || existingDoc.status,
                    remark: finalRemark,
                    payment_terms: payment_terms || '',
                    updated_at: new Date().toISOString()
                })
                .eq('id', docIdNum);

            if (uErr) throw new Error(uErr.message);

            // Replace items safely without manual primary key collision
            await supabase.from('document_items').delete().eq('document_id', docIdNum);

            const rowsToInsert = totals.processedItems.map(it => ({
                document_id: docIdNum,
                sort_order: it.sort_order,
                product_name: it.product_name,
                image_url: it.image_url || '',
                quantity: it.quantity,
                unit: it.unit || 'ชิ้น',
                unit_price: it.unit_price || 0,
                discount: it.discount || 0,
                discount_type: it.discount_type || 'amount',
                total_price: it.total_price || 0
            }));

            if (rowsToInsert.length > 0) {
                const { error: iErr } = await supabase.from('document_items').insert(rowsToInsert);
                if (iErr) throw new Error(iErr.message);
            }

            return res.json({
                success: true,
                message: 'แก้ไขเอกสารเรียบร้อยแล้ว',
                data: { id, code: existingDoc.code }
            });
        }

        // SQLite Fallback
        const existingDoc = db.prepare('SELECT id, code, status FROM documents WHERE id = ? AND deleted_at IS NULL').get(id);
        if (!existingDoc) {
            return res.status(404).json({ success: false, error: 'ไม่พบเอกสารที่ต้องการแก้ไข' });
        }
        if (existingDoc.status === 'cancelled') {
            return res.status(400).json({ success: false, error: 'ไม่สามารถแก้ไขเอกสารที่ถูกยกเลิกแล้วได้' });
        }

        db.exec('BEGIN TRANSACTION');
        try {
            db.prepare(`
                UPDATE documents SET
                    customer_id = ?, project_id = ?, project_name_custom = ?,
                    issue_date = ?, due_date = ?, subtotal = ?, discount_total = ?,
                    grand_total = ?, status = ?, remark = ?, payment_terms = ?,
                    is_service_bill = ?, service_fee_percent = ?, service_fee_amount = ?,
                    partner_payout_amount = ?, partner_name = ?,
                    updated_at = datetime('now', 'localtime')
                WHERE id = ?
            `).run(
                customer_id, project_id, project_name_custom,
                issue_date, due_date, totals.subtotal, totals.discount_total,
                totals.grand_total, status || existingDoc.status, finalRemark, payment_terms,
                is_service_bill ? 1 : 0, Number(service_fee_percent) || 0, feeAmount, payoutAmount, (partner_name || '').trim(),
                id
            );

            db.prepare('DELETE FROM document_items WHERE document_id = ?').run(id);

            const insertItem = db.prepare(`
                INSERT INTO document_items (document_id, sort_order, product_name, image_url, quantity, unit, unit_price, discount, discount_type, total_price)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            totals.processedItems.forEach((it) => {
                insertItem.run(
                    id, it.sort_order, it.product_name, it.image_url || '',
                    it.quantity, it.unit || 'ชิ้น', it.unit_price || 0,
                    it.discount || 0, it.discount_type || 'amount', it.total_price || 0
                );
            });

            db.exec('COMMIT');
            res.json({
                success: true,
                message: 'แก้ไขเอกสารเรียบร้อยแล้ว',
                data: { id, code: existingDoc.code }
            });
        } catch (e) {
            db.exec('ROLLBACK');
            throw e;
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST convert document
router.post('/:id/convert', async (req, res) => {
    try {
        const id = req.params.id;
        const { target_type, issue_date, due_date = null, reserved_code } = req.body;

        if (!['quotation', 'billing', 'receipt'].includes(target_type)) {
            return res.status(400).json({ success: false, error: 'ประเภทเอกสารปลายทางไม่ถูกต้อง' });
        }

        if (isSupabaseConfigured && supabase) {
            const { data: sourceDoc, error: sErr } = await supabase
                .from('documents')
                .select('*, items:document_items(*)')
                .eq('id', id)
                .is('deleted_at', null)
                .single();

            if (sErr || !sourceDoc) {
                return res.status(404).json({ success: false, error: 'ไม่พบเอกสารต้นทาง' });
            }

            // CRITICAL: Default to source document's issue date if not explicitly specified
            const finalIssueDate = issue_date || sourceDoc.issue_date || new Date().toISOString().slice(0, 10);
            let finalCode = (reserved_code && typeof reserved_code === 'string') ? reserved_code.trim() : null;

            // If no reserved_code specified, check if there is an active reservation matching this date/month
            if (!finalCode) {
                const d = new Date(finalIssueDate);
                const dateFmt = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
                const ym = finalIssueDate.replace(/-/g, '').slice(0, 6);
                const { data: matchedRes } = await supabase
                    .from('document_reservations')
                    .select('code')
                    .eq('doc_type', target_type)
                    .eq('status', 'reserved')
                    .or(`note.ilike.%${finalIssueDate}%,note.ilike.%${dateFmt}%,code.ilike.%${ym}%`)
                    .order('id', { ascending: true })
                    .limit(1);

                if (matchedRes && matchedRes.length > 0) {
                    finalCode = matchedRes[0].code;
                }
            }

            const newCode = await commitDocumentCodeSupabase(supabase, target_type, finalIssueDate, finalCode);

            // Build clean reference remark without redundant duplication
            const existingRemark = (sourceDoc.remark || '').trim();
            const refLine = `อ้างอิงจากเอกสาร ${sourceDoc.code}`;
            const combinedRemark = existingRemark
                ? (existingRemark.includes(sourceDoc.code) ? existingRemark : `${refLine}\n${existingRemark}`)
                : refLine;

            const { data: newDoc, error: nErr } = await supabase
                .from('documents')
                .insert({
                    code: newCode,
                    type: target_type,
                    customer_id: sourceDoc.customer_id,
                    project_id: sourceDoc.project_id,
                    project_name_custom: sourceDoc.project_name_custom,
                    reference_document_id: sourceDoc.id,
                    issue_date: finalIssueDate,
                    due_date: due_date || null,
                    subtotal: sourceDoc.subtotal,
                    discount_total: sourceDoc.discount_total,
                    vat_amount: 0,
                    grand_total: sourceDoc.grand_total,
                    status: 'issued',
                    remark: combinedRemark,
                    payment_terms: sourceDoc.payment_terms || ''
                })
                .select()
                .single();

            if (nErr) throw new Error(nErr.message);

            const itemsToInsert = (sourceDoc.items || []).map(it => ({
                document_id: newDoc.id,
                sort_order: it.sort_order,
                product_name: it.product_name,
                image_url: it.image_url || '',
                quantity: it.quantity,
                unit: it.unit,
                unit_price: it.unit_price,
                discount: it.discount,
                discount_type: it.discount_type,
                total_price: it.total_price
            }));

            if (itemsToInsert.length > 0) {
                await supabase.from('document_items').insert(itemsToInsert);
            }

            // Mark reservation as used if applicable
            if (finalCode) {
                await supabase
                    .from('document_reservations')
                    .update({
                        status: 'used',
                        used_at: new Date().toISOString(),
                        used_by_doc_id: newDoc.id
                    })
                    .eq('code', newCode);
            }

            // If billing note was converted to a receipt, mark source billing note as paid
            if (target_type === 'receipt' && sourceDoc.type === 'billing') {
                await supabase.from('documents').update({ status: 'paid', updated_at: new Date().toISOString() }).eq('id', sourceDoc.id);
            }

            return res.json({
                success: true,
                message: `แปลงเป็น ${target_type} สำเร็จ (เลขที่ ${newCode})`,
                data: { id: newDoc.id, code: newCode }
            });
        }

        // SQLite Fallback
        const sourceDoc = db.prepare('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL').get(id);
        if (!sourceDoc) {
            return res.status(404).json({ success: false, error: 'ไม่พบเอกสารต้นทาง' });
        }

        const finalIssueDate = issue_date || sourceDoc.issue_date || new Date().toISOString().slice(0, 10);
        let finalCode = (reserved_code && typeof reserved_code === 'string') ? reserved_code.trim() : null;

        if (!finalCode) {
            const d = new Date(finalIssueDate);
            const dateFmt = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
            const ym = finalIssueDate.replace(/-/g, '').slice(0, 6);
            const matchedRes = db.prepare(`
                SELECT code FROM document_reservations 
                WHERE doc_type = ? AND status = 'reserved' 
                  AND (note LIKE ? OR note LIKE ? OR code LIKE ?)
                ORDER BY id ASC LIMIT 1
            `).get(target_type, `%${finalIssueDate}%`, `%${dateFmt}%`, `%${ym}%`);

            if (matchedRes) {
                finalCode = matchedRes.code;
            }
        }

        const items = db.prepare('SELECT * FROM document_items WHERE document_id = ? ORDER BY sort_order ASC').all(sourceDoc.id);

        db.exec('BEGIN TRANSACTION');
        try {
            const newCode = commitDocumentCode(db, target_type, finalIssueDate, finalCode);

            const insertDoc = db.prepare(`
                INSERT INTO documents (
                    code, type, customer_id, project_id, project_name_custom, reference_document_id,
                    issue_date, due_date, subtotal, discount_total, vat_amount, grand_total,
                    status, remark, payment_terms,
                    is_service_bill, service_fee_percent, service_fee_amount, partner_payout_amount, partner_name
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'issued', ?, ?, ?, ?, ?, ?, ?)
            `);

            // Build clean reference remark without redundant duplication
            const existingRemarkSqlite = (sourceDoc.remark || '').trim();
            const refLineSqlite = `อ้างอิงจากเอกสาร ${sourceDoc.code}`;
            const combinedRemarkSqlite = existingRemarkSqlite
                ? (existingRemarkSqlite.includes(sourceDoc.code) ? existingRemarkSqlite : `${refLineSqlite}\n${existingRemarkSqlite}`)
                : refLineSqlite;

            const result = insertDoc.run(
                newCode, target_type, sourceDoc.customer_id, sourceDoc.project_id, sourceDoc.project_name_custom,
                sourceDoc.id, finalIssueDate, due_date || null,
                sourceDoc.subtotal, sourceDoc.discount_total, sourceDoc.grand_total,
                combinedRemarkSqlite,
                sourceDoc.payment_terms || '',
                sourceDoc.is_service_bill || 0,
                sourceDoc.service_fee_percent || null,
                sourceDoc.service_fee_amount || 0,
                sourceDoc.partner_payout_amount || 0,
                sourceDoc.partner_name || null
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

            if (finalCode) {
                db.prepare("UPDATE document_reservations SET used_by_doc_id = ?, status = 'used', used_at = datetime('now') WHERE code = ?").run(newDocId, newCode);
            }

            // If billing note was converted to a receipt, mark source billing note as paid
            if (target_type === 'receipt' && sourceDoc.type === 'billing') {
                db.prepare("UPDATE documents SET status = 'paid', updated_at = datetime('now', 'localtime') WHERE id = ?").run(sourceDoc.id);
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

// POST cancel (Void) document
router.post('/:id/cancel', async (req, res) => {
    try {
        const id = req.params.id;
        const { reason = '' } = req.body;

        if (isSupabaseConfigured && supabase) {
            const { data: doc, error } = await supabase
                .from('documents')
                .select('*')
                .eq('id', id)
                .is('deleted_at', null)
                .single();

            if (error || !doc) {
                return res.status(404).json({ success: false, error: 'ไม่พบเอกสาร' });
            }
            if (doc.status === 'cancelled') {
                return res.status(400).json({ success: false, error: 'เอกสารนี้ถูกยกเลิกไปแล้ว' });
            }

            await supabase
                .from('documents')
                .update({
                    status: 'cancelled',
                    cancel_reason: reason || 'ยกเลิกตามคำขอ',
                    cancelled_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            await logAudit(req, 'DOCUMENT_CANCELLED', {
                targetType: 'document',
                targetId: doc.id,
                details: `ยกเลิกเอกสาร ${doc.code} (เหตุผล: ${reason || 'ยกเลิกตามคำขอ'})`
            });

            return res.json({ success: true, message: `ยกเลิกเอกสาร ${doc.code} เรียบร้อยแล้ว` });
        }

        // SQLite Fallback
        const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL').get(id);
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
        `).run(reason || 'ยกเลิกตามคำขอ', id);

        await logAudit(req, 'DOCUMENT_CANCELLED', {
            targetType: 'document',
            targetId: doc.id,
            details: `ยกเลิกเอกสาร ${doc.code} (เหตุผล: ${reason || 'ยกเลิกตามคำขอ'})`
        });

        res.json({ success: true, message: `ยกเลิกเอกสาร ${doc.code} เรียบร้อยแล้ว` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST mark as paid
router.post('/:id/mark-paid', async (req, res) => {
    try {
        const id = req.params.id;

        if (isSupabaseConfigured && supabase) {
            await supabase
                .from('documents')
                .update({
                    status: 'paid',
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .is('deleted_at', null);

            return res.json({ success: true, message: 'บันทึกสถานะชำระเงินแล้ว' });
        }

        // SQLite Fallback
        db.prepare(`
            UPDATE documents SET
                status = 'paid',
                updated_at = datetime('now')
            WHERE id = ? AND deleted_at IS NULL
        `).run(id);

        res.json({ success: true, message: 'บันทึกสถานะชำระเงินแล้ว' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE soft delete document
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;

        if (isSupabaseConfigured && supabase) {
            await supabase
                .from('documents')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            return res.json({ success: true, message: 'ลบเอกสารเรียบร้อยแล้ว' });
        }

        // SQLite Fallback
        db.prepare("UPDATE documents SET deleted_at = datetime('now') WHERE id = ?").run(id);
        res.json({ success: true, message: 'ลบเอกสารเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
