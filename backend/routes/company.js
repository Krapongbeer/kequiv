const express = require('express');
const router = express.Router();
const db = require('../db');
const { supabase, isSupabaseConfigured } = require('../supabase');
const { requireAdmin } = require('../middleware/auth');

// GET company profile
router.get('/', async (req, res) => {
    try {
        if (isSupabaseConfigured && supabase) {
            const { data, error } = await supabase
                .from('company_profile')
                .select('*')
                .eq('id', 1)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Supabase get company error:', error);
            }

            if (data) {
                let bank_accounts = [];
                if (data.bank_info) {
                    try {
                        bank_accounts = typeof data.bank_info === 'string' ? JSON.parse(data.bank_info) : data.bank_info;
                    } catch (e) {
                        bank_accounts = [];
                    }
                }
                data.bank_accounts = bank_accounts;
                return res.json({ success: true, data });
            }
        }

        // SQLite Fallback
        const row = db.prepare('SELECT * FROM company_profile WHERE id = 1').get();
        if (row && row.bank_info) {
            try {
                row.bank_accounts = JSON.parse(row.bank_info);
            } catch (e) {
                row.bank_accounts = [];
            }
        }
        res.json({ success: true, data: row });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT update company profile (Admin only)
router.put('/', requireAdmin, async (req, res) => {
    try {
        const {
            name, tax_id, address, phone, email, line_id,
            bank_accounts, logo_url, signature_url,
            default_terms, default_remark, year_format
        } = req.body;

        const bankInfoStr = JSON.stringify(bank_accounts || []);

        if (isSupabaseConfigured && supabase) {
            const updatePayload = {
                updated_at: new Date().toISOString()
            };
            if (name !== undefined) updatePayload.name = name;
            if (tax_id !== undefined) updatePayload.tax_id = tax_id;
            if (address !== undefined) updatePayload.address = address;
            if (phone !== undefined) updatePayload.phone = phone;
            if (email !== undefined) updatePayload.email = email;
            if (line_id !== undefined) updatePayload.line_id = line_id;
            if (bank_accounts !== undefined) updatePayload.bank_info = bankInfoStr;
            if (logo_url !== undefined) updatePayload.logo_url = logo_url;
            if (signature_url !== undefined) updatePayload.signature_url = signature_url;
            if (default_terms !== undefined) updatePayload.default_terms = default_terms;
            if (default_remark !== undefined) updatePayload.default_remark = default_remark;
            if (year_format !== undefined) updatePayload.year_format = year_format;

            const { data, error } = await supabase
                .from('company_profile')
                .update(updatePayload)
                .eq('id', 1)
                .select()
                .single();

            if (error) {
                console.error('Supabase update company error:', error);
                throw new Error(error.message);
            }

            if (data) {
                try {
                    data.bank_accounts = typeof data.bank_info === 'string' ? JSON.parse(data.bank_info) : data.bank_info;
                } catch (e) {
                    data.bank_accounts = [];
                }
                return res.json({ success: true, data });
            }
        }

        // SQLite Fallback
        db.prepare(`
            UPDATE company_profile SET
                name = COALESCE(?, name),
                tax_id = COALESCE(?, tax_id),
                address = COALESCE(?, address),
                phone = COALESCE(?, phone),
                email = COALESCE(?, email),
                line_id = COALESCE(?, line_id),
                bank_info = ?,
                logo_url = COALESCE(?, logo_url),
                signature_url = COALESCE(?, signature_url),
                default_terms = COALESCE(?, default_terms),
                default_remark = COALESCE(?, default_remark),
                year_format = COALESCE(?, year_format),
                updated_at = datetime('now')
            WHERE id = 1
        `).run(
            name, tax_id, address, phone, email, line_id,
            bankInfoStr,
            logo_url, signature_url,
            default_terms, default_remark, year_format
        );

        const updated = db.prepare('SELECT * FROM company_profile WHERE id = 1').get();
        if (updated && updated.bank_info) {
            updated.bank_accounts = JSON.parse(updated.bank_info);
        }
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
