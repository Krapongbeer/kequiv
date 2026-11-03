/**
 * Seed Database with realistic sample customers, projects, and documents
 */

const db = require('./db');
const { commitDocumentCode, reserveBatchNumbers } = require('./utils/docNumber');

function seed() {
    console.log('🌱 Seeding database...');

    // Clear existing data for fresh seed if requested or if customers is empty
    const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
    if (customerCount > 0) {
        console.log('Database already has data. Skipping seed.');
        return;
    }

    // 1. Add Customers
    const insertCustomer = db.prepare(`
        INSERT INTO customers (name, tax_id, address, phone, email, note)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    const c1 = insertCustomer.run(
        'บริษัท สยาม คอนสตรัคชั่น แอนด์ ดีไซน์ จำกัด',
        '0105560012345',
        '99/1 อาคารสยามทาวเวอร์ ชั้น 12 ถนนสุขุมวิท แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ 10110',
        '02-789-0123, 081-999-8877',
        'procurement@siamconstruction.co.th',
        'ลูกค้าประจำ ชำระเงินตรงเวลา'
    );
    const c1Id = c1.lastInsertRowid;

    const c2 = insertCustomer.run(
        'บริษัท นครินทร์ เอ็นจิเนียริ่ง กรุ๊ป จำกัด',
        '0105558098765',
        '555 หมู่ 3 ถนนศรีนครินทร์ ต.สำโรงเหนือ อ.เมือง จ.สมุทรปราการ 10270',
        '02-384-5678',
        'account@nakarin-eng.com',
        'เครดิต 30 วัน'
    );
    const c2Id = c2.lastInsertRowid;

    const c3 = insertCustomer.run(
        'คุณอนุชา มิ่งขวัญ',
        '',
        '14/2 หมู่บ้านภัทรพาร์ค ซอยพัฒนาการ 65 แขวงสวนหลวง เขตสวนหลวง กรุงเทพฯ 10250',
        '086-555-1234',
        'anucha.m@gmail.com',
        'ลูกค้ารายบุคคล งานต่อเติมบ้าน'
    );
    const c3Id = c3.lastInsertRowid;

    // 2. Add Projects for Customers (1 ลูกค้า มีหลายหัวบิล/โครงการ)
    const insertProject = db.prepare(`
        INSERT INTO customer_projects (customer_id, project_name, site_address, contact_person, note)
        VALUES (?, ?, ?, ?, ?)
    `);

    const p1_1 = insertProject.run(
        c1Id,
        'โครงการ คอนโด ลักชัวรี่ สุขุมวิท 39',
        'ซอยสุขุมวิท 39 แขวงคลองตันเหนือ เขตวัฒนา กทม.',
        'คุณวิชัย (โฟร์แมนหน้างาน) 089-111-2233',
        'ส่งของเข้าหน้างานก่อน 17:00 น.'
    );
    const p1_1Id = p1_1.lastInsertRowid;

    const p1_2 = insertProject.run(
        c1Id,
        'โครงการ รีโนเวทบ้านเดี่ยว ราชพฤกษ์',
        'หมู่บ้านลดาวัลย์ ถนนราชพฤกษ์ ต.บางกร่าง อ.เมือง จ.นนทบุรี',
        'คุณกมลวรรณ (สถาปนิก) 081-444-5566',
        'โครงการเฟส 2'
    );
    const p1_2Id = p1_2.lastInsertRowid;

    const p2_1 = insertProject.run(
        c2Id,
        'โครงการ ติดตั้งระบบไฟฟ้า โรงงานเทพารักษ์',
        'นิคมอุตสาหกรรมบางปู ซอย 9 ต.แพรกษา อ.เมือง จ.สมุทรปราการ',
        'วิศวกรสมเกียรติ 085-777-8899',
        'บิลแยกเฉพาะค่าอุปกรณ์'
    );
    const p2_1Id = p2_1.lastInsertRowid;

    const p3_1 = insertProject.run(
        c3Id,
        'งานต่อเติมครัวและหลังคาโรงรถ',
        '14/2 หมู่บ้านภัทรพาร์ค ซอยพัฒนาการ 65',
        'คุณอนุชา 086-555-1234',
        'มัดจำ 50% ก่อนเริ่มงาน'
    );
    const p3_1Id = p3_1.lastInsertRowid;

    // 3. Reserve some numbers for backdating demo
    console.log('Reserving numbers for backdating...');
    reserveBatchNumbers(db, 'quotation', 2, { note: 'กันไว้สำหรับบิลย้อนหลัง โครงการสุขุมวิท', customer_id: c1Id, project_id: p1_1Id });
    reserveBatchNumbers(db, 'billing', 2, { note: 'กันไว้สำหรับใบแจ้งหนี้ย้อนหลัง' });

    // 4. Create sample documents
    const insertDoc = db.prepare(`
        INSERT INTO documents (
            code, type, customer_id, project_id, project_name_custom,
            issue_date, due_date, subtotal, discount_total, vat_amount, grand_total,
            status, remark, payment_terms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertItem = db.prepare(`
        INSERT INTO document_items (
            document_id, sort_order, product_name, quantity, unit, unit_price, discount, discount_type, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Document 1: Quotation for Siam Construction
    const code1 = commitDocumentCode(db, 'quotation', '2026-11-01');
    const doc1 = insertDoc.run(
        code1, 'quotation', c1Id, p1_1Id, 'โครงการ คอนโด ลักชัวรี่ สุขุมวิท 39',
        '2026-11-01', '2026-11-30', 25500.00, 500.00, 0.00, 25000.00,
        'issued', 'ราคานี้รวมค่าขนส่งถึงหน้างานแล้ว', 'ยืนยันราคาภายใน 30 วัน'
    );
    const doc1Id = doc1.lastInsertRowid;

    insertItem.run(doc1Id, 1, 'ท่อร้อยสายไฟ EMT ขนาด 1/2 นิ้ว (ยาว 3 เมตร)', 100, 'เส้น', 95.00, 0, 'amount', 9500.00);
    insertItem.run(doc1Id, 2, 'สายไฟ THW 1x2.5 sq.mm. (ม้วนละ 100 ม.)', 10, 'ม้วน', 1200.00, 0, 'amount', 12000.00);
    insertItem.run(doc1Id, 3, 'บริการติดตั้งและทดสอบระบบไฟฟ้าเบื้องต้น', 1, 'งาน', 4000.00, 0, 'amount', 4000.00);

    // Document 2: Billing Note / Invoice for Nakarin Eng
    const code2 = commitDocumentCode(db, 'billing', '2026-11-02');
    const doc2 = insertDoc.run(
        code2, 'billing', c2Id, p2_1Id, 'โครงการ ติดตั้งระบบไฟฟ้า โรงงานเทพารักษ์',
        '2026-11-02', '2026-12-02', 45000.00, 0.00, 0.00, 45000.00,
        'issued', 'กรุณาชำระเงินตามกำหนดเวลาเพื่อความต่อเนื่องในการส่งมอบงาน', 'เครดิต 30 วัน โอนเข้าบัญชีกสิกรไทย'
    );
    const doc2Id = doc2.lastInsertRowid;

    insertItem.run(doc2Id, 1, 'ตู้ควบคุมไฟสวิตช์บอร์ด MDB 100A', 1, 'ตู้', 32000.00, 0, 'amount', 32000.00);
    insertItem.run(doc2Id, 2, 'เบรกเกอร์ MCCB 3P 100A', 2, 'ชุด', 4500.00, 0, 'amount', 9000.00);
    insertItem.run(doc2Id, 3, 'อุปกรณ์เชื่อมต่อและบัสบาร์ทองแดง', 1, 'ชุด', 4000.00, 0, 'amount', 4000.00);

    // Document 3: Receipt for Anucha
    const code3 = commitDocumentCode(db, 'receipt', '2026-11-02');
    const doc3 = insertDoc.run(
        code3, 'receipt', c3Id, p3_1Id, 'งานต่อเติมครัวและหลังคาโรงรถ',
        '2026-11-02', null, 15000.00, 0.00, 0.00, 15000.00,
        'paid', 'ได้รับเงินมัดจำงวดแรกเรียบร้อยแล้ว ขอบคุณครับ', 'ชำระเงินสด / โอนเรียบร้อย'
    );
    const doc3Id = doc3.lastInsertRowid;

    insertItem.run(doc3Id, 1, 'ค่ามัดจำงวดที่ 1: งานโครงสร้างเหล็กและหลังคาโรงรถไวนิล', 1, 'งวด', 15000.00, 0, 'amount', 15000.00);

    console.log('✅ Seeding completed successfully!');
}

if (require.main === module) {
    seed();
}

module.exports = seed;
