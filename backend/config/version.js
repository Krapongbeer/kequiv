/**
 * Kequiv Web System Version & Changelog Configuration
 */

module.exports = {
    version: '2.2.0',
    releaseDate: '2026-11-03',
    codename: 'Mobile Responsive & Full Edit Edition',
    changelog: [
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
