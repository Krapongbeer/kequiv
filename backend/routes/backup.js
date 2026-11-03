const express = require('express');
const router = express.Router();
const db = require('../db');
const { supabase, isSupabaseConfigured } = require('../supabase');

// GET /api/backup/export
// Downloads full JSON snapshot of all database records
router.get('/export', async (req, res) => {
    try {
        let snapshot = {
            exported_at: new Date().toISOString(),
            system: 'Kequiv Web',
            version: '2.0.0',
            source: isSupabaseConfigured && supabase ? 'supabase' : 'sqlite'
        };

        if (isSupabaseConfigured && supabase) {
            const { data: company } = await supabase.from('company_profile').select('*');
            const { data: customers } = await supabase.from('customers').select('*');
            const { data: projects } = await supabase.from('customer_projects').select('*');
            const { data: sequences } = await supabase.from('document_sequences').select('*');
            const { data: reservations } = await supabase.from('document_reservations').select('*');
            const { data: documents } = await supabase.from('documents').select('*');
            const { data: items } = await supabase.from('document_items').select('*');

            snapshot.data = {
                company_profile: company || [],
                customers: customers || [],
                customer_projects: projects || [],
                document_sequences: sequences || [],
                document_reservations: reservations || [],
                documents: documents || [],
                document_items: items || []
            };
        } else {
            snapshot.data = {
                company_profile: db.prepare('SELECT * FROM company_profile').all(),
                customers: db.prepare('SELECT * FROM customers').all(),
                customer_projects: db.prepare('SELECT * FROM customer_projects').all(),
                document_sequences: db.prepare('SELECT * FROM document_sequences').all(),
                document_reservations: db.prepare('SELECT * FROM document_reservations').all(),
                documents: db.prepare('SELECT * FROM documents').all(),
                document_items: db.prepare('SELECT * FROM document_items').all()
            };
        }

        const filename = `kequiv-backup-${new Date().toISOString().slice(0, 10)}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(JSON.stringify(snapshot, null, 2));
    } catch (err) {
        console.error('Backup export error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
