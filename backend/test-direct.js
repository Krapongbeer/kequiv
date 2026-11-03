/**
 * Direct Unit & Integration Tests (No network socket required)
 */

const db = require('./db');
const { getNextDocumentCode, commitDocumentCode, reserveBatchNumbers } = require('./utils/docNumber');
const { thaiBahtText } = require('./utils/thaiBahtText');

function runTests() {
    console.log('--- 1. Testing Thai Baht Text ---');
    const cases = [
        [0, 'ศูนย์บาทถ้วน'],
        [1, 'หนึ่งบาทถ้วน'],
        [21, 'ยี่สิบเอ็ดบาทถ้วน'],
        [101, 'หนึ่งร้อยเอ็ดบาทถ้วน'],
        [15750, 'หนึ่งหมื่นห้าพันเจ็ดร้อยห้าสิบบาทถ้วน'],
        [8520.50, 'แปดพันห้าร้อยยี่สิบบาทห้าสิบสตางค์'],
        [0.75, 'เจ็ดสิบห้าสตางค์']
    ];

    cases.forEach(([num, expected]) => {
        const actual = thaiBahtText(num);
        if (actual !== expected) {
            throw new Error(`ThaiBahtText failed for ${num}: expected "${expected}", got "${actual}"`);
        }
        console.log(`  ✓ ${num} -> ${actual}`);
    });

    console.log('\n--- 2. Testing Database Integrity & Customers ---');
    const customer = db.prepare('SELECT * FROM customers WHERE id = 1').get();
    console.log(`  ✓ Customer loaded: ${customer.name}`);

    const projects = db.prepare('SELECT * FROM customer_projects WHERE customer_id = 1').all();
    console.log(`  ✓ Customer 1 projects count: ${projects.length}`);
    projects.forEach(p => console.log(`     - 📌 ${p.project_name} (contact: ${p.contact_person || 'N/A'})`));

    console.log('\n--- 3. Testing Number Reservation & Zero Collision Engine ---');
    // Reserve batch of 3 numbers
    const reservedCodes = reserveBatchNumbers(db, 'quotation', 3, {
        note: 'กันไว้สำหรับบิลย้อนหลัง โครงการทดสอบ',
        customer_id: 1,
        project_id: projects[0] ? projects[0].id : null
    });
    console.log(`  ✓ Batch reserved 3 codes:`, reservedCodes);

    // Next auto code MUST jump over the reserved block!
    const nextPreview = getNextDocumentCode(db, 'quotation', new Date().toISOString());
    console.log(`  ✓ Next regular quotation preview: ${nextPreview.code}`);
    
    // Check that next preview is NOT in reservedCodes
    if (reservedCodes.includes(nextPreview.code)) {
        throw new Error(`Collision detected! Next code ${nextPreview.code} matches reserved code!`);
    }
    console.log(`  ✓ Zero collision confirmed: Next auto code successfully skipped all reserved codes!`);

    console.log('\n--- 4. Testing Issuing Backdated Document Using Reserved Code ---');
    const chosenReservedCode = reservedCodes[0];
    const backdatedCode = commitDocumentCode(db, 'quotation', '2026-10-10', chosenReservedCode);
    console.log(`  ✓ Successfully committed reserved code for backdating: ${backdatedCode}`);

    // Verify reservation status changed to 'used'
    const resvRecord = db.prepare('SELECT status, used_at FROM document_reservations WHERE code = ?').get(chosenReservedCode);
    if (resvRecord.status !== 'used') {
        throw new Error(`Reservation ${chosenReservedCode} status should be 'used' but is ${resvRecord.status}`);
    }
    console.log(`  ✓ Reservation record updated to status: "${resvRecord.status}" at ${resvRecord.used_at}`);

    // Insert actual document
    const insertDoc = db.prepare(`
        INSERT INTO documents (
            code, type, customer_id, project_id, project_name_custom, issue_date,
            subtotal, discount_total, vat_amount, grand_total, status, remark
        ) VALUES (?, 'quotation', 1, ?, 'โครงการ ลักชัวรี่ สุขุมวิท 39', '2026-10-10', 8500, 500, 0, 8000, 'issued', 'บิลย้อนหลัง')
    `);
    const docResult = insertDoc.run(backdatedCode, projects[0].id);
    const newDocId = docResult.lastInsertRowid;

    // Insert items
    db.prepare(`
        INSERT INTO document_items (document_id, sort_order, product_name, quantity, unit, unit_price, discount, total_price)
        VALUES (?, 1, 'ท่อ PVC ขนาด 1 นิ้ว', 10, 'ท่อน', 850, 500, 8000)
    `).run(newDocId);

    console.log(`  ✓ Inserted backdated document id: ${newDocId} with code: ${backdatedCode}`);

    console.log('\n--- 5. Testing Unique Constraint (Prevent Duplicate Code) ---');
    try {
        db.prepare(`
            INSERT INTO documents (code, type, customer_id, issue_date, subtotal, grand_total)
            VALUES (?, 'quotation', 1, '2026-10-10', 1000, 1000)
        `).run(backdatedCode);
        throw new Error('UNIQUE constraint failed: duplicate code was allowed!');
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            console.log(`  ✓ Database strictly rejected duplicate code as expected: ${err.message}`);
        } else {
            throw err;
        }
    }

    console.log('\n--- 6. Testing Document Conversion & Cancellation ---');
    // Convert to Billing Note
    const nextInvCode = commitDocumentCode(db, 'billing', '2026-11-02');
    const convertResult = db.prepare(`
        INSERT INTO documents (
            code, type, customer_id, project_id, project_name_custom, reference_document_id,
            issue_date, subtotal, grand_total, status, remark
        ) VALUES (?, 'billing', 1, ?, 'โครงการ ลักชัวรี่ สุขุมวิท 39', ?, '2026-11-02', 8000, 8000, 'issued', 'แปลงจาก QT')
    `).run(nextInvCode, projects[0].id, newDocId);
    console.log(`  ✓ Converted to Billing Note with code: ${nextInvCode}`);

    // Void the billing note
    db.prepare(`
        UPDATE documents SET status = 'cancelled', cancel_reason = 'ลูกค้ายกเลิกคำสั่งซื้อ', cancelled_at = datetime('now')
        WHERE id = ?
    `).run(convertResult.lastInsertRowid);
    const cancelledDoc = db.prepare('SELECT status, cancel_reason FROM documents WHERE id = ?').get(convertResult.lastInsertRowid);
    console.log(`  ✓ Document voided successfully: status="${cancelledDoc.status}", reason="${cancelledDoc.cancel_reason}"`);

    console.log('\n--- 7. Testing Quotation with Product Thumbnail Image ---');
    const qtCode = commitDocumentCode(db, 'quotation', '2026-11-02');
    const qtDoc = db.prepare(`
        INSERT INTO documents (
            code, type, customer_id, project_id, project_name_custom, issue_date,
            subtotal, discount_total, vat_amount, grand_total, status, remark
        ) VALUES (?, 'quotation', 1, ?, 'โครงการ ลักชัวรี่ สุขุมวิท 39', '2026-11-02', 12500, 0, 0, 12500, 'issued', 'มีรูปสินค้าแนบ')
    `).run(qtCode, projects[0].id);

    db.prepare(`
        INSERT INTO document_items (document_id, sort_order, product_name, image_url, quantity, unit, unit_price, discount, total_price)
        VALUES (?, 1, 'โคมไฟแชนเดอเลียร์คริสตัล โมเดิร์น', '/uploads/item-sample.webp', 1, 'ชุด', 12500, 0, 12500)
    `).run(qtDoc.lastInsertRowid);

    const savedItem = db.prepare('SELECT * FROM document_items WHERE document_id = ?').get(qtDoc.lastInsertRowid);
    if (!savedItem || savedItem.image_url !== '/uploads/item-sample.webp') {
        throw new Error('Failed to save document item image_url');
    }
    console.log(`  ✓ Item with thumbnail image saved and verified: "${savedItem.product_name}" -> ${savedItem.image_url}`);

    console.log('\n=============================================');
    console.log('🎉 ALL INTEGRATION & BUSINESS RULES VERIFIED!');
    console.log('=============================================');
}

runTests();
