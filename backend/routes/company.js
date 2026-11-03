const express = require('express');
const router = express.Router();
const db = require('../db');

// GET company profile
router.get('/', (req, res) => {
    try {
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

// PUT update company profile
router.put('/', (req, res) => {
    try {
        const {
            name, tax_id, address, phone, email, line_id,
            bank_accounts, logo_url, signature_url,
            default_terms, default_remark, year_format
        } = req.body;

        const bankInfoStr = JSON.stringify(bank_accounts || []);

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
