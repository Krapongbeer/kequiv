# Project Specification: Business Document & Customer Management System

## 1. Project Overview
Build a web application for small businesses to manage customers, quotations, delivery notes/billing notes, and receipts. The system must support database storage, automatic calculations, and a clean printable layout for A4 documents.

## 2. Tech Stack Recommendations
- **Frontend:** HTML5, Tailwind CSS (via CDN), JavaScript (Vanilla JS for interactive forms)
- **Backend:** Node.js with Express (or Python FastAPI)
- **Database:** SQLite / PostgreSQL (Relational Database)

## 3. Database Schema Requirements
Create a migration or initialization script (`database.sql`) with the following tables:

### Table: customers
- id (PK, Auto Increment)
- name (VARCHAR, Not Null)
- tax_id (VARCHAR)
- address (TEXT)
- phone (VARCHAR)
- email (VARCHAR)
- created_at (TIMESTAMP)

### Table: customer_projects (โครงการ / หัวบิลย่อยของลูกค้า)
- id (PK, Auto Increment)
- customer_id (FK to customers.id)
- project_name (VARCHAR, Not Null) - เช่น "โครงการ A", "โครงการปรับปรุงอาคาร B"
- site_address (TEXT) - ที่อยู่หน้างาน/ที่อยู่จัดส่งเฉพาะโครงการ (ถ้ามี)
- contact_person (VARCHAR)
- note (TEXT)
- created_at (TIMESTAMP)

### Table: document_sequences (ตารางควบคุมการรันเลขและเลขที่ถูกกันไว้)
- id (PK, Auto Increment)
- doc_type (VARCHAR) - 'quotation', 'billing', 'receipt'
- year_month (VARCHAR) - เช่น '202611'
- current_number (INT) - เลขรันล่าสุด
- updated_at (TIMESTAMP)

### Table: document_reservations (ตารางจัดการเลขที่กันไว้สำหรับออกบิลย้อนหลัง)
- id (PK, Auto Increment)
- doc_type (VARCHAR) - 'quotation', 'billing', 'receipt'
- code (VARCHAR, Unique) - เช่น QT202611005 (เลขที่กันไว้)
- customer_id (FK to customers.id, Nullable) - ระบุลูกค้าล่วงหน้าได้ (หรือเว้นว่างไว้)
- note (TEXT) - บันทึกเหตุผลการกันเลข เช่น "กันไว้สำหรับโครงการ A บิลย้อนหลัง"
- status (VARCHAR) - 'reserved' (ยังไม่ถูกใช้), 'used' (ใช้งานแล้ว)
- reserved_at (TIMESTAMP)

### Table: documents
- id (PK, Auto Increment)
- code (VARCHAR, Unique) - เช่น QT202611001 (มี Unique Constraint ห้ามซ้ำเด็ดขาดในระดับ Database)
- type (ENUM) - 'quotation', 'billing', 'receipt'
- customer_id (FK to customers.id)
- project_id (FK to customer_projects.id, Nullable) - ผูกกับโครงการ/หัวบิลย่อย
- project_name_custom (VARCHAR) - หัวบิล/ชื่อโครงการระบุในเอกสาร
- issue_date (DATE) - รองรับการลงวันที่ย้อนหลัง
- due_date (DATE)
- subtotal (DECIMAL)
- vat_amount (DECIMAL, default 0) - ไม่คิด VAT (0.00) เนื่องจากร้านไม่ได้จด VAT
- grand_total (DECIMAL)
- status (VARCHAR) - 'draft', 'issued', 'paid'
- created_at (TIMESTAMP)

### Table: document_items
- id (PK, Auto Increment)
- document_id (FK to documents.id)
- product_name (VARCHAR, Not Null)
- quantity (INT, Not Null)
- unit_price (DECIMAL, Not Null)
- total_price (DECIMAL, Not Null)

## 4. Core Features & Pages to Implement
1. **Customer & Project Management (CRM & Multiple Billing Titles):**
   - เพิ่ม แก้ไข ดู และลบข้อมูลลูกค้าหลัก
   - เพิ่ม/จัดการโครงการหรือหัวบิลย่อยของลูกค้า (เช่น ลูกค้า ก มีโครงการ A, โครงการ B) พร้อมระบุที่อยู่หน้างานหรือผู้ติดต่อเฉพาะโครงการได้
   - แสดงประวัติเอกสารและรายการสินค้าแยกตามลูกค้า และคัดกรองแยกตามโครงการได้

2. **Robust Number Generation & Reservation System (ระบบรันเลขไม่ชนกัน 100% พร้อมระบบกันเลขย้อนหลัง):**
   - **ป้องกันเลขชนกันเด็ดขาด (Zero Collision Architecture):**
     - ใช้ตาราง Sequence + Database Transaction Lock ในการออกเลขรัน
     - บังคับ `UNIQUE INDEX` ที่ระดับฐานข้อมูลทั้งตารางเอกสารและตารางจองเลข ป้องกันการบันทึกซ้ำซ้อน
     - รูปแบบเลขรันมาตรฐานตามประเภทและปีเดือน เช่น `QT202611-001`, `INV202611-001`, `RE202611-001`
   - **ระบบกันเลขเผื่อไว้ออกบิลย้อนหลัง (Reserved Number Pools):**
     - สามารถ "กดกันเลขล่วงหน้าทีละเลข" หรือ "กำหนดกันเลขเป็นชุด" (เช่น กันไว้ 5 เลข: 010 - 014) แล้วให้เลขรันปัจจุบันกระโดดข้ามไปเริ่มที่ 015 ทันที
     - เลขที่กันไว้จะมีบันทึกกำกับ (Note) ว่ากันไว้ให้ใครหรือเพื่องานอะไร
     - ระบบ Auto-run บิลปัจจุบันจะตรวจเช็คเสมอ และ "ข้าม" เลขที่อยู่ในคลังเลขที่กันไว้โดยอัตโนมัติ เพื่อไม่ให้ชนกันเด็ดขาด
   - **การนำเลขที่กันไว้มาออกบิลย้อนหลัง:**
     - ในหน้าสร้างเอกสาร จะมี Dropdown ให้เลือก "ใช้เลขรันอัตโนมัติ" หรือ "เลือกเลขที่เคยกันไว้ในคลัง"
     - สามารถระบุวันที่ออกเอกสารย้อนหลังได้ตามต้องการ
     - เมื่อบันทึกเอกสาร เลขที่กันไว้จะถูกเปลี่ยนสถานะเป็น `used` เพื่อไม่ให้นำมาใช้ซ้ำ

3. **Document Creator Form:**
   - เลือกประเภทเอกสาร (Quotation / Billing Note / Receipt)
   - เลือกลูกค้า -> โหลดรายการโครงการ/หัวบิลของลูกค้ารายนั้นให้เลือก (หรือพิมพ์ระบุหัวบิลใหม่ได้)
   - เลือกระบุเลขที่เอกสาร (จะใช้เลขอัตโนมัติ, เลือกเลขที่เคยกันไว้, หรือระบุเลขเองที่ต้องการ)
   - Dynamic item rows (เพิ่ม/ลดแถวสินค้า, คำนวณ จำนวน × ราคาต่อหน่วย)
   - กล่องสรุปยอดรวม (Subtotal / ยอดรวมสุทธิ Grand Total โดยไม่คิด VAT 7%)
   - ในเอกสารพิมพ์ จะไม่มีคำว่า "ใบกำกับภาษี" (ใช้คำว่า ใบเสนอราคา / ใบแจ้งหนี้-ใบวางบิล / ใบเสร็จรับเงิน เท่านั้น)

4. **Print / PDF View:**
   - เลย์เอาต์ A4 สวยงาม มาตรฐานสำหรับงานพิมพ์ ระบุชื่อโครงการ/หัวบิล และข้อมูลลูกค้าชัดเจน

## 5. Execution Steps for Agent
- Step 1: Initialize the project folder structure (`backend/` and `frontend/`).
- Step 2: Create the database schema and sample seed data.
- Step 3: Implement backend API endpoints for customers and documents.
- Step 4: Build the frontend user interface matching the requirements.
- Step 5: Test the calculation logic and document generation flow.