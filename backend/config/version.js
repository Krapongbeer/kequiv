/**
 * Kequiv Web System Version & Changelog Configuration
 */

module.exports = {
    version: '2.5.0',
    releaseDate: '2026-11-03',
    codename: 'Verified Accreditations, DBD Registered & THAI SME-GP Edition',
    changelog: [
        {
            version: '2.5.0',
            date: '2026-11-03',
            title: 'DBD Registered, THAI SME-GP & Official Accreditations Showcase',
            features: [
                'เพิ่มส่วนแสดงความน่าเชื่อถือทางธุรกิจ (Verified Business Credentials)',
                'ติดตั้งเครื่องหมาย DBD Registered พาณิชย์อิเล็กทรอนิกส์ กรมพัฒนาธุรกิจการค้า',
                'เพิ่มหนังสือรับรองผู้ประกอบการ SME เพื่อการจัดซื้อจัดจ้างภาครัฐ (THAI SME-GP สสว.) เลขที่ 30256/2569',
                'เพิ่มใบทะเบียนพาณิชย์ (ท.พ.) เทศบาลเมืองดอกคำใต้ เลขทะเบียน 3560500055866',
                'ลบลายเซ็นส่วนบุคคลออกจากเอกสารเผยแพร่ออนไลน์ 100% ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)',
                'ระบบ Lightbox Modal สำหรับขยายดูเอกสารรับรองฉบับเต็ม'
            ]
        },
        {
            version: '2.4.0',
            date: '2026-11-03',
            title: 'Dark/Light Mode, Standalone Website CMS & Typography Overhaul',
            features: [
                'ระบบ Dark Mode (โหมดมืด) และ Light Mode (โหมดสว่าง) สลับได้ทันที จดจำค่าผ่าน LocalStorage',
                'แยก ระบบจัดการเนื้อหาเว็บ (Website CMS) ออกจากระบบงานขายและออกบิล (Billing ERP) 100%',
                'ระบบหลังบ้าน CMS จัดการแบนเนอร์, จัดการบริการ, จัดการผลงานจริง, และกล่องข้อความ Leads จากหน้าร้าน',
                'จัดระเบียบ Layout ใหม่ เมนูบาร์แถวเดียว (No text dropping) และปรับฟอนต์หัวข้อให้อ่านง่าย คมชัด สมดุล',
                'ปรับโลโก้ให้เด่น ใหญ่ คมชัด ปราศจากกรอบสีขาวบังสายตา'
            ]
        },
        {
            version: '2.3.0',
            date: '2026-11-03',
            title: 'Kequiv IT, CCTV & Systems Storefront with LINE OA Hub',
            features: [
                'เว็บไซต์หน้าร้านอย่างเป็นทางการ (Kequiv Official Storefront)',
                'ชู 3 เสาหลัก: ระบบกล้องวงจรปิด (CCTV) • ไอทีและเน็ตเวิร์ก (IT & Network) • งานระบบไฟฟ้า (Electrical & MDB)',
                'ระบบขอใบเสนอราคาและนัดสำรวจหน้างานออนไลน์ (Quick Quotation & Leads)',
                'เชื่อมต่อ LINE OA ร้าน @vcv6921d พร้อม QR Code และปุ่มลอยติดต่อด่วน',
                'แกลเลอรีผลงานติดตั้งจริง (Project Showcase) พร้อมตัวกรองหมวดหมู่',
                'การสลับไปมาระหว่างหน้าร้านสาธารณะ (Storefront) และระบบจัดการหลังร้าน (Back-office) อย่างราบรื่น'
            ]
        },
        {
            version: '2.2.0',
            date: '2026-11-03',
            title: 'Mobile Navigation, Document Edit, Line Reminder & Security',
            features: [
                'ระบบเมนูแถบเลื่อนบนมือถือ (Mobile Drawer & Hamburger Menu ☰)',
                'ระบบแก้ไขเอกสาร (Edit Document) แก้ไขรายการและราคาได้โดยไม่ต้องยกเลิกบิล',
                'ปุ่มส่งข้อความเตือนชำระเงินเข้า LINE ในคลิกเดียว (1-Click Payment Reminder)',
                'ตัวกรองช่วงวันที่ (Date Range Filter) พร้อมปุ่มลัดเลือกเดือนนี้/เดือนที่แล้ว',
                'ระบบเปลี่ยนรหัสผ่านเข้าใช้งาน (Change Password) ในหน้าตั้งค่า',
                'ระบบถังขยะและกู้คืนข้อมูลลูกค้า (Customer Trash & Restore)',
                'ปรับปรุงการพิมพ์และ Export PDF ให้พอดี 1 หน้า A4 100% ปราศจากขอบกล่อง'
            ]
        },
        {
            version: '2.1.0',
            date: '2026-11-03',
            title: 'Automated Daily Reservation Buffer Pool',
            features: [
                'ระบบกันเลขที่บิลสำรองอัตโนมัติวันละ 5 เลข (Daily Auto-Buffer Pool)',
                'การันตีมีช่องว่างสำหรับออกบิลย้อนหลังได้ตลอดเวลา ไม่ชนเลขใคร',
                'ทำงานอัตโนมัติทั้งบน Vercel Cloud Serverless และ Local Machine'
            ]
        },
        {
            version: '2.0.0',
            date: '2026-11-03',
            title: 'Major Security, Auth & Ocean Visual Upgrade',
            features: [
                'ระบบเข้าสู่ระบบความปลอดภัยสูง (JWT Authentication & Session Lock)',
                'ผู้ใช้งาน 2 ระดับบัญชี (phongphana & ampui)',
                'ดีไซน์ใหม่สไตล์ Ocean Cyan ล้อตามสีโลโก้ ผสานฟอนต์พิมพ์ดีดคลาสสิก',
                'ระบบแนบสลิปการโอนเงิน (Payment Slip Upload)',
                'ระบบส่งออกรายงานบัญชีรายเดือน (Export CSV / Excel)',
                'ระบบสำรองข้อมูลในคลิกเดียว (1-Click Database Backup)',
                'ระบบแชร์บิลเข้า LINE (Share to LINE Web API)',
                'ระบบแสดงหมายเลขเวอร์ชันและประวัติการอัปเดต (Version Badge & Modal)'
            ]
        },
        {
            version: '1.2.0',
            date: '2026-11-03',
            title: 'Cloud Database & Storage Integration',
            features: [
                'เชื่อมต่อฐานข้อมูล Supabase PostgreSQL ถาวร',
                'ระบบจัดเก็บรูปภาพผ่าน Supabase Storage CDN',
                'รองรับการ Deploy บน Vercel Serverless Platform'
            ]
        },
        {
            version: '1.1.0',
            date: '2026-11-02',
            title: 'Non-VAT & Compact A4 Print Overhaul',
            features: [
                'ลบการคำนวณและข้อความ VAT ออกทั้งหมดสำหรับร้านค้าทั่วไป',
                'ปรับหัวบิลแบบกะทัดรัด แยกสาขาเชียงใหม่ และขยายโลโก้',
                'แก้ปัญหาสระและพยัญชนะตกหล่นในตาราง'
            ]
        },
        {
            version: '1.0.0',
            date: '2026-11-01',
            title: 'Initial Release',
            features: [
                'ระบบออกใบเสนอราคา ใบวางบิล และใบเสร็จรับเงิน',
                'ระบบรันเลขเอกสารแบบ Zero Collision และกันเลขย้อนหลัง',
                'แปลงตัวเลขเป็นตัวอักษรภาษาไทยอัตโนมัติ'
            ]
        }
    ]
};
