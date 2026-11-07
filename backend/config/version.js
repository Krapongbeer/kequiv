/**
 * Kequiv Web System Version & Changelog Configuration
 */

module.exports = {
    version: '2.9.25',
    releaseDate: '2026-11-07',
    codename: 'Unpaid Billing Service Fee Breakdown & True Expected Income',
    changelog: [
        {
            version: '2.9.25',
            date: '2026-11-07',
            title: 'Unpaid Billing Service Fee Breakdown & True Expected Income',
            features: [
                'จำแนกรายได้จริงรอรับในการ์ดยอดรอเก็บเงิน (Unpaid Billing True Income Breakdown): ปรับการ์ด "ยอดรอเก็บเงิน" ให้แสดงยอดเงินได้จริงรอรับ (บิลขายปกติ + ค่าบริการร้านสุทธิ) และแจกแจงรายการย่อยเหมือนกับการ์ด "รายได้จริงเดือนนี้" (บิลขายปกติ, ค่าบริการร้านกี่บิล, และยอดหน้าบิลรวมเรียกเก็บ) ให้สอดคล้องกันอย่างสมบูรณ์แบบ'
            ]
        },
        {
            version: '2.9.24',
            date: '2026-11-07',
            title: 'Multi-Click Debounce Protection & Cleaned Duplicate Quotations',
            features: [
                'ระบบป้องกันการกดบันทึกซ้ำ (Submit Guard & Debounce Lock): ล็อกปุ่มบันทึกทันทีเมื่อกด และแสดง "กำลังบันทึก..." ป้องกันการยิงคำขอสร้างเอกสารซ้ำหลายฉบับในคราวเดียว 100%',
                'เคลียร์เอกสารซ้ำเรียบร้อย: ลบ QT202610-003 และ QT202610-004 ที่ถูกบันทึกซ้ำออก คงเหลือเฉพาะ QT202610-001 ฉบับเดียวที่ตรงกับเลขที่กันไว้ (INV202610-001 และ RE202610-001)',
                'รีเซ็ตสถานะเลขสำรอง INV202610-001: พร้อมสำหรับการกด "แปลง" เป็น INV และ RE ได้ทันที'
            ]
        },
        {
            version: '2.9.23',
            date: '2026-11-07',
            title: 'Fix Schema Cache & Convert Modal Badge Display',
            features: [
                'แก้ไขข้อผิดพลาด Could not find is_service_bill column: ปรับแต่งการแปลงเอกสารใน Supabase ให้บันทึกข้อมูลผ่าน remark ตามมาตรฐานสถาปัตยกรรมระบบ ป้องกันปัญหา schema cache mismatch 100%',
                'แสดงป้ายประเภทเอกสารในหน้าต่างแปลงบิลอย่างถูกต้อง: ปรับการแสดงผลป้ายต้นทางเป็น HTML ช่วยให้แสดงชื่อประเภทเอกสารและเลขที่บิลได้อย่างสวยงามและคมชัด'
            ]
        },
        {
            version: '2.9.22',
            date: '2026-11-07',
            title: 'Smart Document Conversion with Date Lock & Auto-Matching Reserved Codes',
            features: [
                'ล็อกวันที่ตามเอกสารต้นทางอัตโนมัติ (Lock Date to Source Document): เมื่อกดแปลงเอกสาร (เช่น แปลง QT ไปเป็น INV หรือแปลง INV ไปเป็น RE) ระบบจะดึงวันที่ของเอกสารต้นทางมาตั้งต้นให้อัตโนมัติ ไม่ดึงวันที่ปัจจุบันมาทับบิลย้อนหลัง/ล่วงหน้าอีกต่อไป',
                'ตรวจจับและเลือกเลขที่ล็อกสำรองไว้ให้อัตโนมัติ (Smart Reserved Code Auto-Matching): เมื่อกดแปลงเอกสาร ระบบจะค้นหาเลขสำรองในคลังที่กันไว้สำหรับวันที่ของเอกสารนั้น และเลือกเลขให้อัตโนมัติทันที (เช่น แปลง QT วันที่ 17/7/2026 ระบบจะดึง INV202607-003 และ RE202607-003 ที่ล็อกไว้มาใช้ทันที)',
                'หน้าต่างแปลงเอกสารโฉมใหม่ (Enhanced Convert Modal): แสดงข้อมูลวันที่ต้นทาง ชัดเจน สามารถปรับวันที่ได้ และเลือกได้ว่าจะใช้เลขที่ล็อกสำรองไว้ หรือจะรันเลขอัตโนมัติตามเดือนที่ระบุ'
            ]
        },
        {
            version: '2.9.21',
            date: '2026-11-07',
            title: 'Accurate Shop Net Income Dashboard & Unified Backdate/Future 3-Bill Reservation System',
            features: [
                'คำนวณรายได้จริงของร้านในแดชบอร์ดอย่างถูกต้อง (True Shop Revenue Calculation): ปรับยอดสรุปแดชบอร์ด "รายได้จริงเดือนนี้" ให้คำนวณจากบิลขายปกติรวมกับค่าบริการสุทธิที่ร้านได้รับจริงจากบิลที่ร้านให้บริการ (เช่น บิลปกติ 45,000 + ค่าบริการร้าน 2,600 = ฿47,600.00) ไม่นำยอดเต็มหน้าบิล (฿58,000.00) มานับเป็นรายได้ทั้งหมด พร้อมแจกแจงที่มาในบัตรสรุปอย่างชัดเจน',
                'รวมระบบระบุวันออกเอกสาร (ย้อนหลัง / ล่วงหน้า พร้อมคำนวณ 3 บิล): สามารถเลือกวันใดก็ได้ ทั้งย้อนหลังและล่วงหน้า มีปุ่มลัดเลือกวันสะดวกรวดเร็ว (-30 วัน, -7 วัน, เมื่อวาน, วันนี้, +7 วัน, +15 วัน, +30 วัน, เดือนหน้า) พร้อมแสดงพรีวิวเลข QT, INV, RE ของวันนั้นแบบเรียลไทม์',
                'แก้ไขปัญหากันเลขทั้ง 3 เข้าคลังสำรอง (Fix Duplicate Key Violation): ปรับระบบกันเลขทั้ง 3 ประเภทเข้าคลังสำรองเป็นแบบ Atomic Sequence Server-Side ป้องกัน Race Condition และข้อผิดพลาด duplicate key value violates unique constraint "document_reservations_pkey" อย่างสมบูรณ์'
            ]
        },
        {
            version: '2.9.20',
            date: '2026-11-07',
            title: 'Comprehensive Daily Auto-Buffer with Automatic Missed-Day Catchup & Chronological Sorting',
            features: [
                'ระบบกันเลขสำรองประจำวันแบบตรวจจับวันตกหล่นอัตโนมัติ (Automatic Missed-Day Catchup): ระบบจะตรวจสอบย้อนหลังทุกวันในเดือน หากมีวันใดที่ไม่ได้เปิดระบบหรือไม่มีคนเข้า (เช่น วันที่ 6 หรือวันหยุด) ระบบจะออกเลขสำรองของวันนั้นๆ ครบทุกประเภท (QT, INV, RE) อัตโนมัติทันที',
                'เติมเลขสำรองวันที่ 6 พ.ย. 2026 เรียบร้อย: ออกเลขสำรองย้อนหลังให้ครบทั้ง QT, INV และ RE ครบทั้ง 5 เลข',
                'เรียงลำดับเลขสำรองตามวันและเวลาอย่างแม่นยำ (Chronological Ordering): ใน Dropdown ตัวเลือก "ใช้เลขสำรอง" เรียงตามวันที่ในวงเล็บ [YYYY-MM-DD] อย่างถูกต้อง (วันที่ 4 -> 5 -> 6 -> 7)',
                'อัปเดตวันที่ออกบิลอัตโนมัติตามเลขสำรองที่เลือก: เมื่อเลือกเลขสำรองของวันที่ใด ระบบจะปรับช่อง "วันที่ออกเอกสาร" เป็นวันที่ของเลขนั้นทันทีเพื่อความสะดวกในการออกบิลย้อนหลัง'
            ]
        },
        {
            version: '2.9.19',
            date: '2026-11-07',
            title: 'Service Bill Accounting & Dynamic Fee Rate System (บิลที่ร้านให้บริการ)',
            features: [
                'ระบบบิลที่ร้านให้บริการ (Service Bill Accounting): เพิ่มตัวเลือกในหน้าออกและแก้ไขเอกสาร ให้ระบุว่าเป็น "บิลที่ร้านให้บริการ"',
                'ปรับอัตราเปอร์เซ็นต์ค่าบริการได้อิสระ: สามารถพิมพ์ระบุอัตรา % ค่าบริการที่ร้านคิดได้ตามต้องการ (เช่น 10%, 15%, 20%, 25%, 30% หรือยอดกำหนดเอง)',
                'ระบบคำนวณแบ่งรายได้และส่งต่องานแบบ Real-time: แสดงยอดรวมหน้าบิล, รายได้ค่าบริการของร้านตาม %, ยอดส่งต่อผู้ร่วมงาน/ต้นทุน, และระบุชื่อผู้ประสานงาน/พันธมิตร',
                'ความปลอดภัยข้อมูลภายใน 100%: บิลฉบับจริงสำหรับลูกค้า, เอกสารสั่งพิมพ์ A4, ไฟล์ PDF และหน้าเปิดดูออนไลน์ (/share/:code) จะแสดงยอดสุทธิตามปกติ ไม่มีการแสดงข้อมูล % หรือค่าบริการภายในให้ลูกค้าเห็น',
                'ระบบกรองและรายงานบัญชีแยกประเภท: เพิ่มปุ่มกรอง "บิลที่ร้านให้บริการ" ในหน้ารายการเอกสาร พร้อมแสดง Badge กำกับ และส่งออกข้อมูลลงไฟล์ Excel/CSV ครบทุกคอลัมน์บัญชี'
            ]
        },
        {
            version: '2.9.18',
            date: '2026-11-05',
            title: 'Desktop & Mobile Universal LINE Web Share (No QR Block, UTF-8 Thai Support & Zero Extra Links)',
            features: [
                'แก้ปัญหาการส่งเข้า LINE บนคอมพิวเตอร์ (Desktop Web Share Support): ส่งผ่าน Official LINE Share Endpoint โดยตรง สามารถเลือกเพื่อน/แชตส่งได้ทันทีบนคอม ไม่ติดแจ้งเตือนให้สแกนมือถือ',
                'กำจัดปัญหาภาษาต่างดาว (UTF-8 Encoding): เข้ารหัสข้อความภาษาไทยอย่างถูกต้อง แสดงผลคมชัดสวยงาม',
                'กำจัดลิงก์หน้าแรกส่วนเกินอย่างถาวร: กำหนด url=shareUrl โดยตรง ทำให้ LINE แสดงพรีวิวเฉพาะการ์ดเอกสารใบนั้นใบเดียว ไม่มีการดึงหน้าแรกมาต่อท้าย',
                'คัดลอกข้อความลงคลิปบอร์ดอัตโนมัติ: เผื่อกรณีต้องการกดวาง (Ctrl+V) ในหน้าต่างแชต LINE ใดๆ ได้ทันที'
            ]
        },
        {
            version: '2.9.17',
            date: '2026-11-05',
            title: 'Password Visibility Toggle & Direct LINE App URI Scheme (Zero Referrer Leak)',
            features: [
                'ปุ่มเปิด/ปิดดูรหัสผ่านหน้าล็อกอิน (Password Visibility Toggle): เพิ่มไอคอนดวงตา 👁️ ให้กดเปิดดูรหัสผ่านที่พิมพ์ได้ทันที ป้องกันการพิมพ์ผิด',
                'กำจัดลิงก์เว็บไซต์ซ้ำซ้อนใน LINE เด็ดขาด (Zero Referrer Leak): ปรับการส่งข้อความผ่าน Direct URI Scheme (line://msg/text/...) ป้องกันไม่ให้ LINE Web Plugin แอบแนบ https://kequiv.vercel.app/ ต่อท้ายข้อความ',
                'อัปเดตระบบ Cache-Busting สคริปต์ JavaScript ทุกไฟล์เพื่อบังคับให้เบราว์เซอร์โหลดเวอร์ชันล่าสุดทันที'
            ]
        },
        {
            version: '2.9.16',
            date: '2026-11-05',
            title: 'Future Document Code Generator, Quick Remark Presets & Clean LINE Share Message',
            features: [
                'ระบบสร้างเลขเอกสารล่วงหน้า (เลขอนาคต): เลือกวัน/เดือน/ปี แล้วคำนวณเลขพร้อมกันทั้ง 3 ประเภท (QT, INV, RE) ทันที พร้อมปุ่มสลับประเภทและปุ่มกันเลขเข้าคลังสำรอง',
                'ปุ่มข้อความด่วนหมายเหตุท้ายเอกสาร: เพิ่มปุ่มกดเลือก "+ ราคาสุทธิ", "+ ยืนราคา" (ยืนราคา 30 วัน ส่งของภายใน 30 วัน หลังได้รับใบสั่งซื้อ) และ "+ รับประกัน" (รับประกันสินค้า 1 ปี)',
                'ปรับข้อความแชร์เข้า LINE ให้กระชับ สวยงาม และไม่มีลิงก์เว็บซ้ำซ้อน ป้องกัน LINE แสดงการ์ดตัวอย่างซ้อน 2 ใบ'
            ]
        },
        {
            version: '2.9.15',
            date: '2026-11-05',
            title: 'Secure Anti-Guessing Public Document Share with Secret Access Tokens',
            features: [
                'ยกระดับความปลอดภัยลิงก์แชร์เอกสาร (Anti-Guessing & Anti-IDOR Protection): เพิ่ม Cryptographic Secret Access Token (?k=...) กำกับท้ายลิงก์แชร์ทุกฉบับ',
                'ป้องกันบุคคลภายนอกสุ่มเดาหรือเปลี่ยนเลขที่เอกสารเพื่อแอบดูบิล/ราคาของลูกค้ารายอื่นอย่างสมบูรณ์แบบ',
                'ระบบบล็อกการเข้าถึงโดยไม่ได้รับอนุญาต (403 Forbidden) พร้อมบันทึกลงระบบ Security Audit Log ทันที',
                'หน้าแจ้งเตือนความปลอดภัยมาตรฐานสูง พร้อมปุ่มติดต่อร้านผ่าน LINE OA ทันทีหากไม่มีสิทธิ์เข้าถึง'
            ]
        },
        {
            version: '2.9.14',
            date: '2026-11-05',
            title: 'Clean Blank Project Box when No Sub-Project is Selected',
            features: [
                'ลบข้อความ "หัวบิลมาตรฐาน (ไม่มีโครงการย่อย)" และ "ที่อยู่ตามข้อมูลลูกค้า" ออกจากหน้าบิลพิมพ์',
                'หากไม่มีการระบุหรือเลือกโครงการย่อย กล่องโครงการจะถูกเว้นว่างไว้อย่างสะอาดเรียบร้อยตามคำขอ'
            ]
        },
        {
            version: '2.9.13',
            date: '2026-11-05',
            title: 'Fix Customer Project Deletion Route Mismatch & Special Char Escaping',
            features: [
                'แก้ไขปัญหาปุ่มลบโครงการ/สาขาของลูกค้ากดลบไม่ได้ (Fix Project Delete 404 Route Mismatch): ปรับให้รองรับ Endpoint ทั้ง /api/customers/:customerId/projects/:projectId และ /api/customers/projects/:projectId',
                'ป้องกัน JavaScript Error จากชื่อโครงการที่มีอักขระพิเศษหรือวงเล็บ ด้วย JSON Safe Escaping',
                'บันทึกประวัติการลบโครงการลงในระบบ Audit Log (PROJECT_DELETED) โดยอัตโนมัติ'
            ]
        },
        {
            version: '2.9.12',
            date: '2026-11-05',
            title: 'Restore Classic Layout: Customer (Left) & Project (Right)',
            features: [
                'ย้อนกลับไปใช้การจัดวางแบบดั้งเดิมที่คุ้นเคย: "ข้อมูลลูกค้า" (Customer) อยู่ฝั่งซ้าย และ "โครงการ / หัวบิลย่อย" (Project) อยู่ฝั่งขวา',
                'ปรับปรุงให้ตรงกันทั้งหน้าฟอร์มสร้าง/แก้ไขเอกสาร และหน้าพรีวิวบิลพิมพ์ A4 / PDF / ภาพแชร์'
            ]
        },
        {
            version: '2.9.11',
            date: '2026-11-05',
            title: 'Swap Project (Left) & Customer (Right) Across Bill Forms and Print Sheets',
            features: [
                'สลับตำแหน่งการจัดวางข้อมูล: เอา "โครงการ / หัวบิลย่อย" (Project) ไว้ฝั่งซ้าย และ "ข้อมูลลูกค้า" (Customer) ไว้ฝั่งขวา',
                'มีผลครอบคลุมทั้งหน้าฟอร์มออกบิล/แก้ไขบิล (Create/Edit Document Form) และหน้าใบเสร็จ/ใบเสนอราคา A4 สำหรับพิมพ์และแชร์ (Print Preview, PDF, PNG Export)'
            ]
        },
        {
            version: '2.9.10',
            date: '2026-11-05',
            title: 'Balanced Header Layout & Persistent Multi-User Cloud Audit Trail',
            features: [
                'ปรับปรุง Layout แถบนำทางด้านบนให้สมดุล: ย้ายปุ่มสลับโหมดมืด/สว่าง (Theme Toggle) ไปอยู่ชิดขวาสุดของ Header พร้อมคั่นด้วย Vertical Divider และลบปุ่มหน้าร้านที่ซ้ำซ้อน',
                'ระบบเก็บบันทึกประวัติกิจกรรมแบบกระจายศูนย์บนคลาวด์ถาวร (Persistent Multi-User Cloud Audit Trail): แก้ปัญหา Log ของผู้ใช้ (เช่น ampui) ไม่แสดงผลข้ามเครื่อง/ข้ามเซิร์ฟเวอร์',
                'บันทึกกิจกรรมครอบคลุมทุกการกระทำ: เข้าสู่ระบบ (LOGIN_SUCCESS / LOGIN_FAILED), ออกจากระบบ (LOGOUT), สร้างเอกสารใหม่ (DOCUMENT_CREATED), แก้ไขเอกสาร (DOCUMENT_UPDATED), ยกเลิกเอกสาร (DOCUMENT_CANCELLED), เปลี่ยนรหัสผ่าน และสำรองข้อมูล'
            ]
        },
        {
            version: '2.9.9',
            date: '2026-11-05',
            title: 'Fix Document Module Variable Collision & Enforce Top-of-Page Scroll Position',
            features: [
                'แก้ไขข้อผิดพลาดใน documents.js ที่ทำให้เมนู "2. รายการเอกสารทั้งหมด" และ "3. ออกเอกสารใหม่" แสดงผลเป็นหน้าว่างเปล่า (Fix Duplicate Identifier Collision)',
                'ป้องกันหน้าเว็บเลื่อนลงล่างสุดอัตโนมัติขณะเปิดหน้าเว็บ (Enforce Top-of-Page Scroll Position): ปิด Browser Auto-scroll Restoration ด้วย history.scrollRestoration = manual',
                'เพิ่ม Hash Navigation ให้รองรับเมนู #audit-logs เชื่อมต่อตรงได้อย่างราบรื่น'
            ]
        },
        {
            version: '2.9.8',
            date: '2026-11-05',
            title: 'Public Share Link Security Hardening & Anti-Scraping Protection',
            features: [
                'ยกระดับความปลอดภัยลิงก์แชร์ดูบิลสาธารณะ (Zero Risk Public Sandbox): ออกแบบเป็นระบบ Read-Only 100% แยกส่วนจากระบบจัดการหลังบ้านโดยเด็ดขาด',
                'ระบบป้องกันการเจาะข้อมูลผ่าน Regex Format Sanitization: ตรวจสอบแพตเทิร์นรหัสเอกสาร ปฏิเสธค่าแปลกปลอมหรืออักขระพิเศษทันทีก่อนเข้าถึงฐานข้อมูล',
                'เพิ่ม Rate Limiting ป้องกันการสุ่มเจาะเลขบิล (Anti-Enumeration / Anti-Scraping): จำกัดการเรียกดูไม่เกิน 60 ครั้งต่อ 10 นาทีต่อ IP',
                'ระบบป้องกันการฝังมัลแวร์และ XSS: ควบคุมการ Render เอกสารด้วย HTML Escaping และ Content Security Policy (CSP)'
            ]
        },
        {
            version: '2.9.7',
            date: '2026-11-05',
            title: 'Dedicated Security Audit Log Menu & Interactive Compliance Dashboard',
            features: [
                'เพิ่มเมนูหลัก "7. ประวัติความปลอดภัย (Audit Log)" บนแถบเมนูด้านซ้าย (Sidebar Navigation)',
                'แดชบอร์ดตรวจสอบกิจกรรมความปลอดภัยแบบเจาะลึก (Interactive Audit Log Viewer): ตรวจสอบ Login Success, Login Failed, Password Change, Document Cancel, Backup และ Profile Update',
                'การ์ดสถิติความปลอดภัย (Security KPI Summary Cards): แสดงยอดสถิติจำนวนครั้งการเข้าสู่ระบบสำเร็จ, ตรวจจับการล็อกอินล้มเหลว และการเปลี่ยนรหัสผ่าน',
                'ฟิลเตอร์คัดกรองตามประเภทกิจกรรม และช่องค้นหาตามชื่อผู้ใช้งานแบบเรียลไทม์',
                'ระบบส่งออกประวัติความปลอดภัยเป็นไฟล์ CSV (1-Click CSV Export)'
            ]
        },
        {
            version: '2.9.6',
            date: '2026-11-05',
            title: 'Interactive Security Audit Trail UI & Visual Activity Logs',
            features: [
                'เพิ่มหน้าต่างตรวจสอบประวัติความปลอดภัยบนหน้าเว็บ (Security Audit Logs UI Viewer): แสดงผลในแท็บการตั้งค่า (Settings)',
                'แสดงตาราง Audit Trail ละเอียด: วันที่/เวลา, ผู้ใช้, กิจกรรม (Badge สีระบุประเภทเหตุการณ์), IP Address, และรายละเอียดการทำรายการ',
                'ปุ่มรีเฟรชประวัติความปลอดภัยแบบเรียลไทม์ (Real-time Log Refresh)',
                'จำกัดสิทธิ์เข้าถึงเฉพาะผู้ดูแลระบบ (Admin-only RBAC Enforcement)'
            ]
        },
        {
            version: '2.9.5',
            date: '2026-11-05',
            title: 'Unified Desktop Pill Toolbar & Responsive Print Preview Action Strip',
            features: [
                'ปรับปรุงโครงสร้างแถบเครื่องมือพิมพ์ (Print Preview Toolbar) ให้สวยงาม เรียบร้อยระดับพรีเมียม ไม่มีการหักบรรทัดกระจัดกระจาย',
                'จัดกลุ่มเครื่องมือคัดลอก/แชร์ (Copy & Share Pill Group) สไตล์ macOS/Figma บนคอมพิวเตอร์',
                'แถบทางลัดสำหรับอุปกรณ์มือถือและแท็บเล็ต (Responsive Action Strip) จัดปุ่มเต็มแถบ ใช้งานสะดวกด้วยมือเดียว',
                'เน้นปุ่มพิมพ์/PDF (Primary Ocean CTA) และแยกปุ่มปิด ✕ อย่างชัดเจนด้วย Vertical Divider'
            ]
        },
        {
            version: '2.9.4',
            date: '2026-11-05',
            title: 'Optimized LINE Share Payload, 1-Click Link Copy & Mobile/Desktop Deep Linking',
            features: [
                'ปรับปรุงโครงสร้างข้อความแชร์เข้า LINE: ป้องกันปัญหาหน้าขาวว่างเปล่า (Blank Page) จากข้อความ URL ขนาดยาวเกินขีดจำกัดของ LINE Web Plugin',
                'เพิ่มปุ่ม "🔗 คัดลอกลิงก์บิล": คัดลอก URL หน้าดูบิลออนไลน์ส่งให้ลูกค้าทาง LINE หรือแชตอื่นๆ ได้ทันที',
                'ระบบ Auto-Clipboard สำรองข้อมูล: เมื่อกดปุ่มแชร์เข้า LINE ระบบจะคัดลอกข้อความสรุปและลิงก์ไว้ใน Clipboard ให้โดยอัตโนมัติ เพื่อให้ผู้ใช้สามารถกด Ctrl+V ในห้องแชตได้ทันที',
                'รองรับ Deep Linking สลับระหว่าง line:// (มือถือ/Desktop App) และ line.me/R/ (เบราว์เซอร์) อย่างราบรื่น'
            ]
        },
        {
            version: '2.9.3',
            date: '2026-11-05',
            title: 'Official LINE Messaging API Integration, 1-Click Image Export & Public Bill Viewer',
            features: [
                'เชื่อมต่อระบบ LINE Messaging API ของร้าน @vcv6921d อย่างเป็นทางการ (Official Verified Bot Connection)',
                'เพิ่มปุ่ม "📸 บันทึกเป็นรูปภาพ" (Save as Image): แปลงใบเสนอราคา A4 เป็นรูปภาพ .PNG คมชัดสูง (300DPI) ส่งต่อให้ลูกค้าใน LINE ได้ทันที',
                'เพิ่มปุ่ม "📋 คัดลอกภาพบิล" (Copy Image to Clipboard): คลิกเดียวคัดลอกรูปภาพลงคลิปบอร์ด กด Ctrl+V หรือ Cmd+V วางส่งในแชต LINE ทันทีโดยไม่ต้องเซฟไฟล์',
                'ระบบเปิดดูใบเสนอราคาออนไลน์สำหรับลูกค้า (/share/:code): แสดงผลบนมือถือสวยงาม พร้อมปุ่มให้ลูกค้าดาวน์โหลด PDF หรือบันทึกเป็นรูปภาพได้ด้วยตนเอง',
                'ระบบ LINE Webhook & Push Message (/api/line): รองรับการตอบกลับข้อความอัตโนมัติ และส่งการ์ด Flex Message ใบเสนอราคาเข้าแชตลูกค้า'
            ]
        },
        {
            version: '2.9.2',
            date: '2026-11-05',
            title: 'Token Versioning Revocation, Audit Logging Trail & Environment Bootstrap Credentials',
            features: [
                'ระบบเพิกถอนเซสชันทันทีเมื่อเปลี่ยนรหัสผ่าน (Token Versioning & Instant Session Revocation): เพิ่ม token_version ใน Token และฐานข้อมูล เมื่อเปลี่ยนรหัสผ่าน Token เดิมทั้งหมดจะถูกยกเลิกทันที ไม่สามารถนำมาใช้งานได้อีก',
                'บันทึกประวัติการทำธุรกรรมความปลอดภัย (Security & Compliance Audit Logging): บันทึก Log เมื่อมีการล็อกอิน, ล็อกอินล้มเหลว, เปลี่ยนรหัสผ่าน, ดาวน์โหลด Backup ข้อมูล, ยกเลิกบิล และอัปเดตข้อมูลบริษัท พร้อม IP Address และ User-Agent',
                'เปิด API ตรวจสอบ Audit Log สำหรับผู้ดูแลระบบ (GET /api/reports/audit-logs): ตรวจสอบย้อนหลังได้ว่าใครทำอะไร เมื่อไหร่ จาก IP ใด',
                'ขจัดรหัสผ่าน Hardcoded ในโค้ดโดยสมบูรณ์: รองรับการกำหนดรหัสผ่านเริ่มต้นผ่านตัวแปรสภาพแวดล้อม INITIAL_ADMIN_PASSWORD และ INITIAL_EDITOR_PASSWORD'
            ]
        },
        {
            version: '2.9.1',
            date: '2026-11-05',
            title: 'IT Hardware Core Showcase & Comprehensive Cybersecurity Hardening (Med/Low)',
            features: [
                'ยกระดับการขายอุปกรณ์ไอทีและฮาร์ดแวร์ขึ้นเป็นธุรกิจหลัก (Primary Hero Focus): จัดทำเซกชัน "ศูนย์จำหน่ายอุปกรณ์ไอทีและฮาร์ดแวร์ครบวงจร" พร้อม 6 แคตตาล็อกสินค้ามาตรฐาน',
                'เพิ่มแคตตาล็อกอุปกรณ์ไอที: คอมพิวเตอร์ประกอบ & โน้ตบุ๊กองค์กร, เราเตอร์ สวิตช์ PoE & ตู้แร็ค, จอมอนิเตอร์ ปริ้นเตอร์ & อุปกรณ์ต่อพ่วง, เซิร์ฟเวอร์ NAS & ฮาร์ดดิสก์ CCTV, สายสัญญาณ LAN/Fiber, และชุดกล้องวงจรปิด',
                'ปรับแถบนำทาง (Navbar) และเมนูมือถือ เพิ่มเมนู "🖥️ จำหน่ายอุปกรณ์ไอที" เป็นอันดับแรก พร้อมตัวเลือกขอใบเสนอราคาอุปกรณ์ไอที',
                'เพิ่มหน่วยนับและข้อกำหนดอุปกรณ์ไอทีในระบบออกบิล: เพิ่มหน่วย "เครื่อง", "ตัว", "อัน", "เส้น" และหมายเหตุการรับประกันศูนย์ 1-3 ปี ใน Presets',
                'ป้องกัน Stored XSS ในระบบพิมพ์และออกบิล A4 (XSS Sanitization Guard): กรองและหลบอักขระพิเศษ (HTML Escape) ในข้อมูลลูกค้า โครงการ และรายการสินค้า ป้องกันการฝังโค้ดอันตรายในเอกสาร',
                'ติดตั้งชุด Security Headers ครบวงจร: เพิ่ม Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), และ Permissions-Policy ป้องกันการโจมตีแบบ Clickjacking, Sniffing และ Script Injection',
                'เพิ่มระบบออกจากระบบฝั่งเซิร์ฟเวอร์ (POST /api/auth/logout): เคลียร์เซสชันและโทเค็นอย่างสมบูรณ์แบบ',
                'กรองข้อมูลข้อผิดพลาดใน Production (Safe Error Responses): ปกปิดรายละเอียดโครงสร้างฐานข้อมูลและ Internal Stack Traces ไม่ให้หลุดไปยัง Client'
            ]
        },
        {
            version: '2.9.0',
            date: '2026-11-05',
            title: 'Cybersecurity Hardening, Persistent Supabase Auth & Strict RBAC Engine',
            features: [
                'ขจัด Hardcoded Credentials ออกจากซอร์สโค้ด ยกระดับการยืนยันตัวตนด้วย Supabase Auth และ SQLite Identity Store',
                'สร้างและจัดเก็บ JWT Secret ที่เข้ารหัสอย่างปลอดภัย (256-bit cryptographically secure token) ขจัดความเสี่ยง JWT Forgery',
                'เพิ่มระบบบันทึกรหัสผ่านถาวร (Persistent Password Change) แก้ไขแล้วคงอยู่ถาวรไม่สูญหายเมื่อ Vercel Serverless รีสตาร์ต',
                'กำหนดสิทธิ์การเข้าถึงตามบทบาทอย่างเข้มงวด (Strict RBAC: requireAdmin) ล็อกสิทธิ์การดาวน์โหลด Backup ฐานข้อมูล และการแก้ไขข้อมูลบริษัท/บัญชีธนาคาร ให้เฉพาะ Admin เท่านั้น',
                'ยกระดับ CORS Policy ให้รับเฉพาะโดเมนของระบบ (kequiv.vercel.app & localhost) ป้องกันการยิงคำขอจากเว็บไซต์ภายนอก',
                'ปรับอายุ Token ให้ปลอดภัยยิ่งขึ้นจาก 30 วันเป็น 7 วัน (7-Day Hardened Session)'
            ]
        },
        {
            version: '2.8.5',
            date: '2026-11-04',
            title: 'Create Document View Safe Options & Form Initialization Guard Fix',
            features: [
                'แก้ไขข้อผิดพลาดหน้าออกเอกสารใหม่ว่างเปล่า (Safe Options Guard ใน loadCreateForm และ switchTab)',
                'ป้องกัน Null Pointer Exception เมื่อกดเข้าเมนูออกเอกสารใหม่จากแถบเมนูด้านข้างหรือปุ่มต่าง ๆ',
                'เพิ่ม Fallback สำหรับการดึงข้อมูลลูกค้า เลขถัดไป และคลังเลขสำรอง ให้โหลดฟอร์มได้อย่างราบรื่น 100%'
            ]
        },
        {
            version: '2.8.4',
            date: '2026-11-04',
            title: 'Customer Project Identity Sequence Collision Fix & Zero-Fail Insert Engine',
            features: [
                'แก้ไขข้อผิดพลาด duplicate key value violates unique constraint customer_projects_pkey เมื่อกดเพิ่มโครงการหรือหัวบิลใหม่',
                'เพิ่มระบบกลไก Sequence Auto-Advancement & Fallback (Zero-Fail Insert) กู้คืนและเลื่อนลำดับอัตโนมัติหากลำดับเลข ID ของ PostgreSQL ใน Supabase ไม่ตรงกับข้อมูลเดิม',
                'รองรับการเพิ่มโครงการได้ราบรื่น 100% ทั้งตอนสร้างลูกค้าใหม่และตอนเพิ่มแฟ้มโครงการภายหลัง'
            ]
        },
        {
            version: '2.8.3',
            date: '2026-11-04',
            title: 'Blank Undated Field, Clean Ledger Notes & Complete Daily Buffer Pool',
            features: [
                'ปรับช่องวันที่ออกบิลแบบไม่ลงวันที่ให้เป็นช่องว่างอย่างแท้จริง (เว้นว่าง 100% ไม่มีจุดไข่ปลาหรือ ../...)',
                'จัดระเบียบเงื่อนไขชำระเงินและหมายเหตุท้ายบิล (Clean Ledger Notes) ขึ้นบรรทัดใหม่ตามข้ออย่างถูกต้อง ป้องกันคำตกหล่น และป้องกันเลขที่เอกสาร (เช่น QT202611-008) ตัดขาดครึ่งบรรทัด',
                'เปิดใช้งานระบบกันเลขสำรองประจำวัน (Daily Auto-Buffer Pool) ครบทั้ง 3 ประเภท: QT, INV, และ RE ตามความต้องการใช้งาน'
            ]
        },
        {
            version: '2.8.2',
            date: '2026-11-04',
            title: 'Proportional Logout Button, Compact LINE Floating Widget & Buffer Refinement',
            features: [
                'ปรับปุ่มออกจากระบบที่แถบเมนูด้านข้างให้สมส่วน สวยงาม ไม่ตัดข้อความเป็น 2 บรรทัด',
                'ย่อขนาดปุ่ม LINE ติดต่อร้านให้กะทัดรัด ไม่บดบังการแสดงผลการ์ดสรุปข้อมูลบนแดชบอร์ด',
                'ปรับปรุงระบบคลังเลขสำรองอัตโนมัติประจำวัน (Daily Auto-Buffer) ให้เน้นเฉพาะใบเสนอราคา (QT) ป้องกันการเกิดเลขสำรองค้างของ INV และ RE'
            ]
        },
        {
            version: '2.8.1',
            date: '2026-11-04',
            title: 'Undated Documents, Smart PDF File Naming & Revenue Double-Count Fix',
            features: [
                'เพิ่มตัวเลือกออกบิลไม่ลงวันที่ (เว้นว่างเป็น ..... / ..... / .......... บนบิลจริง เหมาะสำหรับประทับตรายางหรือลงวันที่ภายหลัง)',
                'ตั้งชื่อไฟล์อัตโนมัติเวลาสั่งพิมพ์/เซฟ PDF ตามประเภทเอกสาร (KequivQT@เลขใบ, KequivINV@เลขใบ, KequivRE@เลขใบ)',
                'แก้ไขการคำนวณยอดขายเดือนนี้และยอดรอเก็บเงิน ไม่นับบิลที่แปลงแล้วซ้ำ (ตัดการนับเบิ้ลระหว่าง INV กับ RE)',
                'แก้ไขการคำนวณลูกค้ายอดซื้อสูงสุด ไม่นำใบเสนอราคา (QT) และเอกสารที่ยกเลิกแล้วมารวม นับเฉพาะบิลขายจริงเท่านั้น'
            ]
        },
        {
            version: '2.8.0',
            date: '2026-11-04',
            title: 'Integer Quantity, Custom Item Specs, Row Reordering & Bottom Anchored Notes',
            features: [
                'บังคับจำนวนสินค้าเป็นจำนวนเต็ม (Integer Quantity) ป้องกันทศนิยม step=1 ทั้งตอนกรอกและพิมพ์',
                'เพิ่มช่องพิมพ์รายละเอียด / สเปกสินค้า (+ เพิ่มรายละเอียด / สเปกสินค้า) พิมพ์กำกับใต้ชื่อสินค้าอย่างสวยงาม',
                'เพิ่มปุ่มสลับลำดับแถว (▲ สลับขึ้น / ▼ สลับลง) สามารถคลิกเปลี่ยนตำแหน่งแถวรายการสินค้าได้ตามใจชอบ',
                'จัดแถวของแถม/ประกัน (*) ให้ลงไปอยู่บรรทัดสุดท้ายของตารางเสมอ (Bottom-Anchored Ledger Notes) คั่นด้วยบรรทัดเปล่าอย่างสมบูรณ์แบบ',
                'แก้ไขข้อผิดพลาดตอนบันทึกแก้ไขเอกสาร (PUT /api/documents) ขจัดปัญหา Primary Key Collision ใน Supabase'
            ]
        },
        {
            version: '2.7.9',
            date: '2026-11-04',
            title: 'Perfect Header Contact Symmetry & Zero-Wrap Layout',
            features: [
                'จัดเลย์เอาต์ข้อมูลติดต่อหัวบิลใหม่แบบ 2x2 ตารางสมดุลสมบูรณ์แบบ (เลขผู้เสียภาษี, โทร, อีเมล, LINE)',
                'ป้องกันการตัดบรรทัดเลขผู้เสียภาษีและอีเมลตกขอบ (Zero-Wrap) จัดวางคู่อยู่ในบรรทัดเดียวกันอย่างลงตัว',
                'แนวคอลัมน์ซ้าย-ขวาตรงกันทุกระดับสายตา พร้อมระยะห่างระหว่างคอลัมน์ที่สบายตาและเป็นระเบียบ',
                'ปรับความกว้างกล่องเลขที่เอกสารด้านขวาให้ได้สัดส่วนลงตัวพอดีกับฝั่งข้อมูลร้านค้า'
            ]
        },
        {
            version: '2.7.8',
            date: '2026-11-04',
            title: 'Compact Customer Block & 12-Row Single-Page A4 Layout',
            features: [
                'ปรับสัดส่วนกล่องชื่อลูกค้าและโครงการให้กะทัดรัด สวยงาม สมดุล ไม่เทอะทะ (Compact & Balanced Customer Block)',
                'ขยายตารางรายการสินค้าเป็น 12 บรรทัดมาตรฐาน (12-Row Standard Ledger) เติมเต็มกระดาษพิมพ์ดีด A4 พอดี 1 หน้ากระดาษ',
                'รองรับบรรทัดพิเศษสำหรับของแถม บริการ หรือการรับประกัน (*) แบบขยายเต็มบรรทัด (Colspan 6) ไฮไลท์โทนกระดาษคลาสสิก',
                'การันตีเนื้อหาเอกสารทั้งหมด 12 บรรทัด + ยอดสรุปการเงิน + ลายเซ็น อยู่พอดีในแผ่น A4 หน้าเดียว 100% ไม่หลุดข้ามหน้า 2'
            ]
        },
        {
            version: '2.7.7',
            date: '2026-11-04',
            title: 'Full-Page 8-Row Balanced Ledger Print Layout',
            features: [
                'ปรับตารางรายการสินค้าตอนพิมพ์ให้มีบรรทัดเต็มกระดาษ 8 บรรทัดมาตรฐาน (Full A4 Ledger Table) เวลาพิมพ์เอกสารจะไม่สั้นหรือโล่ง',
                'เส้นตารางต่อเนื่องสวยงามเต็มหน้ากระดาษ A4 สไตล์สมุดบัญชีการค้าอย่างเป็นทางการ',
                'เปิดฟอร์มสร้างเอกสารใหม่พร้อมแถวรายการ 3 แถวเริ่มต้นให้กรอกขายสินค้าได้รวดเร็วทันใจ',
                'รักษายอดรวมและกล่องลายเซ็นให้อยู่พอดีกับระยะขอบล่างของกระดาษ 1 แผ่น ไม่ล้นหน้า 2'
            ]
        },
        {
            version: '2.7.6',
            date: '2026-11-04',
            title: 'Clean Image Suppression & Table Note Row Support',
            features: [
                'ตัดการแสดงรูปภาพที่ไม่ได้ใส่หรือโหลดไม่ติดทิ้ง 100% ไม่หลงเหลือกรอบรูปแหว่งหรือช่องว่าง',
                'รองรับการใส่ข้อความบรรทัดสุดท้ายในตาราง เช่น *แถมฟรีเมาส์ Bluetooth, Service, Warranty 3 years',
                'เพิ่มปุ่มลัด ★ + ของแถม / บริการ / ประกัน (*) ในหน้าสร้างและแก้ไขเอกสาร ให้เพิ่มแถวข้อความได้ทันทีในคลิกเดียว',
                'แถวข้อความของแถมจะขยายเต็มความกว้างตาราง (colspan) สไตล์กระดาษพิมพ์ดีดอย่างลงตัวโดยไม่กระทบยอดเงิน'
            ]
        },
        {
            version: '2.7.5',
            date: '2026-11-04',
            title: 'Header/Footer Suppression & Full Thai Glyph Headroom',
            features: [
                'ยกเลิกส่วนหัวกระดาษและท้ายกระดาษของเบราว์เซอร์อัตโนมัติ (ลบชื่อโครงการ วันที่ และเลขหน้าทิ้ง 100%) ด้วย @page margin: 0',
                'แก้ปัญหาสระและวรรณยุกต์หัวแหว่ง (ไม้โท ้ ใน ร้านเคอีควิป และ สระใอ ใ ใน ใบเสร็จรับเงิน/ใบเสนอราคา)',
                'เพิ่ม Headroom ด้านบน (pt-2.5) และปรับฟอนต์หัวเรื่องเป็น Bai Jamjuree & Sarabun ที่รองรับความสูงของสระและวรรณยุกต์ไทยครบถ้วน',
                'กำหนดขนาดพิมพ์ A4 แน่นอน (210mm x 297mm) พร้อมระยะขอบมาตรฐาน 12mm 15mm 15mm 15mm คมชัดสะอาดตา'
            ]
        },
        {
            version: '2.7.4',
            date: '2026-11-04',
            title: 'Isolated Pure A4 Print Frame & Zero Header Collision',
            features: [
                'แก้ปัญหาหัวบิลโดนปุ่มพรีวิวขี่ทับ (Zero Header Collision) ด้วยระบบ Isolated Print Frame แยกแผ่นพิมพ์อิสระ 100%',
                'ป้องกันแถบพรีวิวและปุ่มสั่งพิมพ์หลุดเข้าไปในหน้าพิมพ์หรือเซฟ PDF โดยเด็ดขาด',
                'แก้ไขข้อผิดพลาดไวยากรณ์ CSS (Orphaned Brace at line 75) ที่ทำให้ Safari ละเลยกฎ @media print',
                'เพิ่ม Cache-Busting Versioning (?v=2.7.4) และ Inline Print Isolation Shield ใน HTML ป้องกันการแคชไฟล์เดิม',
                'การันตีการพิมพ์และส่งออกเป็น PDF ได้เฉพาะตัวเอกสารบิล A4 หน้าเดียวจบ คมชัดสวยงามไร้สิ่งแปลกปลอม'
            ]
        },
        {
            version: '2.7.3',
            date: '2026-11-04',
            title: 'Zero-Distortion True A4 Single-Page Print Layout',
            features: [
                'แก้ปัญหาการสั่งพิมพ์/เซฟ PDF หน้ากระดาษเพี้ยนและขี่กัน โดยซ่อนส่วนประกอบ Storefront, CMS, และ Backoffice ตอนพิมพ์ 100%',
                'รื้อถอน nested flexbox ในโมดอลขณะสั่งพิมพ์ เพื่อให้เอกสารจัดเรียงแบบ Block Flow ตามมาตรฐานการพิมพ์กระดาษ A4 สากล',
                'เพิ่ม print-color-adjust: exact เพื่อล็อกสีพื้นหลังตารางสไตล์พิมพ์ดีด (#faf6ee, #ede4d3) และเส้นขอบคมชัดครบถ้วน',
                'ปรับระยะขอบ @page (12mm 15mm 15mm 15mm) ให้ตรงกับกรอบแสดงผลบนหน้าจอแบบ 1:1 พอดีกระดาษ 1 แผ่นจบ ไม่ล้นหน้า 2',
                'ป้องกันรูปสินค้าที่โหลดไม่ติดไม่ให้แสดงกรอบข้อผิดพลาด [?] และป้องกันการตัดขาดส่วนลายเซ็นและสรุปยอด'
            ]
        },
        {
            version: '2.7.2',
            date: '2026-11-03',
            title: 'Bill Header Logo Alignment & Balanced Contact Layout',
            features: [
                'ครอบตัดขอบโปร่งใสซ้ายของไฟล์โลโก้ (247px Left Margin Trim) ทำให้ขอบซ้ายของโลโก้เสมอแนวเดียวกับข้อความ (สำนักงานใหญ่) พอดี 100%',
                'จัดระเบียบข้อมูลหัวบิลเป็นตาราง 2x2 สมดุลสวยงาม (คอลัมน์ 1: เลขผู้เสียภาษี & อีเมล | คอลัมน์ 2: เบอร์โทร & LINE)',
                'ปรับระยะห่างและสีตัวอักษรให้อ่านง่าย สบายตา สไตล์พิมพ์ดีดคลาสสิกร่วมสมัย'
            ]
        },
        {
            version: '2.7.1',
            date: '2026-11-03',
            title: 'Absolute Zero Navbar Collision on All Viewport Widths',
            features: [
                'ปรับ Breakpoint ของ Desktop Navbar ไปที่ XL (1280px+) เพื่อป้องกันการทับซ้อน 100% บนจอขนาดกลาง 1024px–1279px',
                'บนหน้าจอต่ำกว่า 1280px แสดง Hamburger Drawer ☰ ให้เข้าถึงครบทั้ง 8 หมวดหมู่อย่างโปร่ง สบายตา ไม่ชนปุ่ม LINE',
                'ปรับปุ่มทีมงานฝั่งขวาให้เป็นไอคอนกะทัดรัด 🔐 ป้องกันการกินพื้นที่และการขี่ทับปุ่มขอใบเสนอราคา',
                'การันตีพื้นที่ว่าง (Safety Margin) มากกว่า 500px ในทุกขนาดหน้าจอ ไม่มีวันขี่กันเด็ดขาด'
            ]
        },
        {
            version: '2.7.0',
            date: '2026-11-03',
            title: 'Website CMS Management Portal Fully Activated & Repaired',
            features: [
                'แก้ไขระบบจัดการเนื้อหาร้าน (Website CMS) ให้แสดงผลและใช้งานได้ครบทุกแท็บ 100%',
                'แก้ปัญหาแท็บข้อมูลทั่วไป (General) ไม่แสดงผลโดยผูก data-pane ให้กับคอนเทนเนอร์เนื้อหา',
                'เพิ่มสคีมา website_content, website_services, website_portfolio ลงในฐานข้อมูล พร้อม Seeding เริ่มต้นครบ 18 บริการ และ 6 โครงการ',
                'เปิดใช้งานฟอร์มแก้ไขแบนเนอร์, เบอร์โทร, LINE, ที่อยู่สาขา, บริการ, และผลงาน พร้อมปุ่มบันทึกทันที',
                'เชื่อมต่อระบบจัดการคำขอใบเสนอราคา (Leads Management) ให้ตรวจดูและแปลงเป็นลูกค้าได้ในคลิกเดียว'
            ]
        },
        {
            version: '2.6.2',
            date: '2026-11-03',
            title: 'Full System Verification, Timing Attack Shield & Dual Sync',
            features: [
                'ตรวจเช็ควิเคราะห์ระบบอย่างละเอียดทุกจุด (Comprehensive Deep Audit Passed 100%)',
                'ป้องกัน Timing Attack ในการยืนยันตัวตน (Constant-Time Password Verification)',
                'เชื่อมต่อระบบบันทึก Leads แบบ Dual Sync สำรองลงทั้ง SQLite และ Supabase Cloud PostgreSQL พร้อมกัน',
                'เพิ่ม Responsive Overflow Shield ป้องกันการเลื่อนสะดุดด้านข้างบนอุปกรณ์มือถือทุกรุ่น (Zero Horizontal Jitter)',
                'อัปเดตสคีมาฐานข้อมูล Supabase PostgreSQL ให้ครอบคลุมทุกตารางของระบบ'
            ]
        },
        {
            version: '2.6.1',
            date: '2026-11-03',
            title: 'Responsive Navbar, Zero Collision & Scroll Margins',
            features: [
                'ปรับปรุงโครงสร้างแถบนำทาง (Navbar) ให้รองรับการตอบสนองทุกขนาดหน้าจอ (100% Fully Responsive)',
                'แก้ปัญหาตัวอักษรขี่กัน (Zero Collision) โดยล็อก flex-shrink-0 บนโลโก้และปุ่ม Action',
                'จัดระเบียบเมนู Desktop เป็น 5 หมวดหลักที่กระชับ ไม่เบียดบังโลโก้และปุ่มบนจอขนาดกลาง-แล็ปท็อป',
                'ตั้งค่า scroll-padding-top และ scroll-mt-24 ในทุก Section ป้องกันหัวข้อเลื่อนไปซ่อนใต้ Sticky Header',
                'ปรับความทึบของแถบเมนูด้านบน (Solid 98% Backdrop) ป้องกันตัวอักษรของหน้าเว็บทะลุขึ้นมาซ้อนทับขณะเลื่อนจอ'
            ]
        },
        {
            version: '2.6.0',
            date: '2026-11-03',
            title: 'Cybersecurity Hardening, Supabase Auto-Pause Prevention & Clean Wording',
            features: [
                'ลบชื่อผู้ใช้และรหัสผ่านออกจากหน้าเว็บ 100% (ลบ Quick Fill Login & Credentials Leak)',
                'ปิดการแสดง Username บนปุ่มระบบหลังร้านหน้าร้านสาธารณะเพื่อความปลอดภัยสูงสุด',
                'ติดตั้ง Security HTTP Headers ป้องกัน Clickjacking (X-Frame-Options), XSS และ MIME Sniffing',
                'ปิด Express Server Signature (disable x-powered-by)',
                'เพิ่ม Rate Limiter ป้องกัน Bot สแปมฟอร์มขอใบเสนอราคา (/api/leads) และสุ่มรหัสผ่าน (/api/auth/login)',
                'เพิ่มระบบ Sanitize Input ตัดแท็กโค้ดอันตราย (XSS/Script Injection) จากฟอร์มติดต่อ',
                'ลบคำว่า "ไม่จดแวท" และ "Non-VAT" ออกจากทุกจุดของเว็บไซต์และเอกสาร เปลี่ยนเป็น "ราคาสุทธิ"',
                'ระบบ Supabase Keep-Alive Heartbeat ป้องกันฐานข้อมูลหลับ/ดาวน์เมื่อไม่มีคนเข้าเกิน 7 วัน (ทำงานทั้ง In-App 24h Timer และ GitHub Actions Cron 3 วัน)'
            ]
        },
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
