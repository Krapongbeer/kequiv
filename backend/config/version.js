/**
 * Kequiv Web System Version & Changelog Configuration
 */

module.exports = {
    version: '2.0.0',
    releaseDate: '2026-11-03',
    codename: 'Ocean Typewriter Edition',
    changelog: [
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
