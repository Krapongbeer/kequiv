const express = require('express');
const router = express.Router();
const db = require('../db');
const { reserveBatchNumbers, getYearMonth } = require('../utils/docNumber');
const { reserveBatchNumbersSupabase } = require('../utils/docNumberSupabase');
const { supabase, isSupabaseConfigured } = require('../supabase');
const { ensureDailyBuffer } = require('../services/autoBuffer');

// Helper to sort reservations chronologically by date tag in note, then code
function sortReservationsByNoteDate(list) {
    return (list || []).sort((a, b) => {
        const dateA = (a.note || '').match(/\[(\d{4}-\d{2}-\d{2})\]/)?.[1] || a.reserved_at || '';
        const dateB = (b.note || '').match(/\[(\d{4}-\d{2}-\d{2})\]/)?.[1] || b.reserved_at || '';
        if (dateA && dateB && dateA !== dateB) {
            return dateA.localeCompare(dateB);
        }
        return (a.code || '').localeCompare(b.code || '');
    });
}

// GET all reservations
router.get('/', async (req, res) => {
    try {
        const { doc_type, status } = req.query;

        // Ensure all daily quotas are buffered and missing days backfilled
        try {
            await ensureDailyBuffer();
        } catch (e) {
            console.error('ensureDailyBuffer error in GET /reservations:', e.message);
        }

        if (isSupabaseConfigured && supabase) {
            let query = supabase
                .from('document_reservations')
                .select(`
                    *,
                    customer:customers(name),
                    project:customer_projects(project_name)
                `)
                .order('code', { ascending: true })
                .order('id', { ascending: false });

            if (doc_type) {
                query = query.eq('doc_type', doc_type);
            }
            if (status && status !== 'all') {
                query = query.eq('status', status);
            } else if (!status) {
                query = query.eq('status', 'reserved');
            }

            const { data, error } = await query;
            if (error) throw new Error(error.message);

            const result = (data || []).map(r => ({
                ...r,
                customer_name: r.customer ? r.customer.name : null,
                project_name: r.project ? r.project.project_name : null
            }));

            sortReservationsByNoteDate(result);

            return res.json({ success: true, data: result });
        }

        // SQLite Fallback
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
            query += " AND r.status = 'reserved'";
        }

        query += ' ORDER BY r.code ASC, r.id DESC';

        const list = db.prepare(query).all(...params);
        sortReservationsByNoteDate(list);
        res.json({ success: true, data: list });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST reserve batch numbers
router.post('/batch', async (req, res) => {
    try {
        const { doc_type, count = 1, note = '', customer_id = null, project_id = null, year_month = null } = req.body;

        if (!['quotation', 'billing', 'receipt'].includes(doc_type)) {
            return res.status(400).json({ success: false, error: 'ประเภทเอกสารไม่ถูกต้อง' });
        }

        const numCount = parseInt(count, 10);
        if (isNaN(numCount) || numCount < 1 || numCount > 100) {
            return res.status(400).json({ success: false, error: 'จำนวนเลขที่ต้องการกันต้องอยู่ระหว่าง 1 ถึง 100' });
        }

        if (isSupabaseConfigured && supabase) {
            const codes = await reserveBatchNumbersSupabase(supabase, doc_type, numCount, {
                note,
                customer_id: customer_id ? parseInt(customer_id, 10) : null,
                project_id: project_id ? parseInt(project_id, 10) : null,
                yearMonth: year_month
            });

            return res.json({
                success: true,
                message: `กันเลขที่ ${doc_type} สำเร็จจำนวน ${codes.length} เลข`,
                codes
            });
        }

        // SQLite Fallback
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

// POST reserve all 3 document types (QT, INV, RE) for a specific date in one request
router.post('/batch-all', async (req, res) => {
    try {
        const { date_str, note = '', count = 1 } = req.body;
        const types = ['quotation', 'billing', 'receipt'];
        const results = {};

        if (isSupabaseConfigured && supabase) {
            const { data: comp } = await supabase.from('company_profile').select('year_format').eq('id', 1).single();
            const yearMonth = date_str ? getYearMonth(date_str, comp ? comp.year_format : 'CE') : null;

            for (const docType of types) {
                const codes = await reserveBatchNumbersSupabase(supabase, docType, count, {
                    note,
                    yearMonth
                });
                results[docType] = codes;
            }

            return res.json({
                success: true,
                message: 'กันเลขทั้ง 3 ประเภท (QT, INV, RE) เข้าคลังสำรองเรียบร้อยแล้ว',
                data: results
            });
        }

        // SQLite Fallback
        const comp = db.prepare('SELECT year_format FROM company_profile WHERE id = 1').get();
        const yearMonth = date_str ? getYearMonth(date_str, comp ? comp.year_format : 'CE') : null;

        for (const docType of types) {
            const codes = reserveBatchNumbers(db, docType, count, {
                note,
                yearMonth
            });
            results[docType] = codes;
        }

        res.json({
            success: true,
            message: 'กันเลขทั้ง 3 ประเภท (QT, INV, RE) เข้าคลังสำรองเรียบร้อยแล้ว',
            data: results
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE cancel a reservation (if still 'reserved')
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;

        if (isSupabaseConfigured && supabase) {
            const { data: row, error } = await supabase
                .from('document_reservations')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !row) {
                return res.status(404).json({ success: false, error: 'ไม่พบรายการกันเลขนี้' });
            }
            if (row.status === 'used') {
                return res.status(400).json({ success: false, error: 'เลขนี้ถูกนำไปออกเอกสารแล้ว ไม่สามารถยกเลิกได้' });
            }

            await supabase
                .from('document_reservations')
                .update({ status: 'cancelled' })
                .eq('id', id);

            return res.json({ success: true, message: 'ยกเลิกการกันเลขเรียบร้อยแล้ว' });
        }

        // SQLite Fallback
        const row = db.prepare('SELECT * FROM document_reservations WHERE id = ?').get(id);
        if (!row) {
            return res.status(404).json({ success: false, error: 'ไม่พบรายการกันเลขนี้' });
        }
        if (row.status === 'used') {
            return res.status(400).json({ success: false, error: 'เลขนี้ถูกนำไปออกเอกสารแล้ว ไม่สามารถยกเลิกได้' });
        }

        db.prepare("UPDATE document_reservations SET status = 'cancelled' WHERE id = ?").run(id);
        res.json({ success: true, message: 'ยกเลิกการกันเลขเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
