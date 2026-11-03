/**
 * Sync all SQLite records to Supabase Cloud Database
 */
require('dotenv').config();
const db = require('./db');
const { supabase } = require('./supabase');

async function syncAll() {
    console.log('🚀 Starting SQLite -> Supabase Full Data Sync...');

    try {
        // 1. Company Profile
        console.log('--- 1. Syncing Company Profile ---');
        const company = db.prepare('SELECT * FROM company_profile WHERE id = 1').get();
        if (company) {
            const { error: cErr } = await supabase.from('company_profile').upsert({
                id: 1,
                name: company.name,
                tax_id: company.tax_id || '',
                address: company.address || '',
                phone: company.phone || '',
                email: company.email || '',
                line_id: company.line_id || '',
                bank_info: company.bank_info || '[]',
                logo_url: company.logo_url || 'https://sacwepwqyotcvsozpylx.supabase.co/storage/v1/object/public/kequiv/logo.png',
                signature_url: company.signature_url || '',
                default_terms: company.default_terms || '',
                default_remark: company.default_remark || '',
                year_format: company.year_format || 'CE'
            });
            if (cErr) console.error('Company Profile error:', cErr.message);
            else console.log('✓ Company Profile synced!');
        }

        // 2. Customers
        console.log('--- 2. Syncing Customers ---');
        const customers = db.prepare('SELECT * FROM customers').all();
        console.log(`Found ${customers.length} customers in SQLite.`);
        for (const c of customers) {
            const { error } = await supabase.from('customers').upsert({
                id: c.id,
                name: c.name,
                tax_id: c.tax_id || '',
                address: c.address || '',
                phone: c.phone || '',
                email: c.email || '',
                note: c.note || '',
                deleted_at: c.deleted_at || null,
                created_at: c.created_at || new Date().toISOString(),
                updated_at: c.updated_at || new Date().toISOString()
            });
            if (error) console.error(`Customer ${c.name} error:`, error.message);
        }
        console.log('✓ Customers synced!');

        // 3. Customer Projects
        console.log('--- 3. Syncing Customer Projects ---');
        const projects = db.prepare('SELECT * FROM customer_projects').all();
        console.log(`Found ${projects.length} projects in SQLite.`);
        for (const p of projects) {
            const { error } = await supabase.from('customer_projects').upsert({
                id: p.id,
                customer_id: p.customer_id,
                project_name: p.project_name,
                site_address: p.site_address || '',
                contact_person: p.contact_person || '',
                note: p.note || '',
                deleted_at: p.deleted_at || null,
                created_at: p.created_at || new Date().toISOString()
            });
            if (error) console.error(`Project ${p.project_name} error:`, error.message);
        }
        console.log('✓ Customer projects synced!');

        // 4. Document Sequences
        console.log('--- 4. Syncing Document Sequences ---');
        const sequences = db.prepare('SELECT * FROM document_sequences').all();
        for (const s of sequences) {
            const { error } = await supabase.from('document_sequences').upsert({
                doc_type: s.doc_type,
                year_month: s.year_month,
                current_number: s.current_number
            }, { onConflict: 'doc_type, year_month' });
            if (error) console.error(`Sequence error:`, error.message);
        }
        console.log('✓ Document sequences synced!');

        // 5. Document Reservations
        console.log('--- 5. Syncing Document Reservations ---');
        const reservations = db.prepare('SELECT * FROM document_reservations').all();
        for (const r of reservations) {
            const { error } = await supabase.from('document_reservations').upsert({
                id: r.id,
                doc_type: r.doc_type,
                code: r.code,
                customer_id: r.customer_id || null,
                project_id: r.project_id || null,
                note: r.note || '',
                status: r.status,
                reserved_at: r.reserved_at || new Date().toISOString(),
                used_at: r.used_at || null
            });
            if (error) console.error(`Reservation ${r.code} error:`, error.message);
        }
        console.log('✓ Document reservations synced!');

        // 6. Documents
        console.log('--- 6. Syncing Documents ---');
        const docs = db.prepare('SELECT * FROM documents').all();
        console.log(`Found ${docs.length} documents in SQLite.`);
        for (const d of docs) {
            // Normalize issue_date to YYYY-MM-DD
            let issueDate = (d.issue_date || '').slice(0, 10);
            if (!issueDate) issueDate = new Date().toISOString().slice(0, 10);

            let dueDate = d.due_date ? d.due_date.slice(0, 10) : null;

            const { error } = await supabase.from('documents').upsert({
                id: d.id,
                code: d.code,
                type: d.type,
                customer_id: d.customer_id,
                project_id: d.project_id || null,
                project_name_custom: d.project_name_custom || '',
                reference_document_id: d.reference_document_id || null,
                issue_date: issueDate,
                due_date: dueDate,
                subtotal: d.subtotal || 0,
                discount_total: d.discount_total || 0,
                vat_amount: 0,
                grand_total: d.grand_total || 0,
                status: d.status || 'issued',
                remark: d.remark || '',
                payment_terms: d.payment_terms || '',
                cancel_reason: d.cancel_reason || '',
                cancelled_at: d.cancelled_at || null,
                deleted_at: d.deleted_at || null,
                created_at: d.created_at || new Date().toISOString(),
                updated_at: d.updated_at || new Date().toISOString()
            });
            if (error) console.error(`Doc ${d.code} (id ${d.id}) error:`, error.message);
        }
        console.log('✓ Documents synced!');

        // 7. Document Items
        console.log('--- 7. Syncing Document Items ---');
        const items = db.prepare('SELECT * FROM document_items').all();
        console.log(`Found ${items.length} document items in SQLite.`);
        for (const it of items) {
            const { error } = await supabase.from('document_items').upsert({
                id: it.id,
                document_id: it.document_id,
                sort_order: it.sort_order || 1,
                product_name: it.product_name,
                image_url: it.image_url || '',
                quantity: it.quantity || 1,
                unit: it.unit || 'ชิ้น',
                unit_price: it.unit_price || 0,
                discount: it.discount || 0,
                discount_type: it.discount_type || 'amount',
                total_price: it.total_price || 0
            });
            if (error) console.error(`Item ${it.product_name} (id ${it.id}) error:`, error.message);
        }
        console.log('✓ Document items synced!');

        console.log('====================================================');
        console.log('🎉 FULL DATA SYNC TO SUPABASE COMPLETED SUCCESSFULLY!');
        console.log('====================================================');

    } catch (err) {
        console.error('Fatal sync error:', err);
    }
}

syncAll();
