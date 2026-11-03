-- Kequiv Business Document & Customer Management System
-- Database Schema (SQLite)

-- 1. Company Profile
CREATE TABLE IF NOT EXISTS company_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL DEFAULT 'ชื่อร้านค้า / กิจการของคุณ',
    tax_id TEXT DEFAULT '',
    address TEXT DEFAULT '123/45 ถนน... แขวง/ตำบล... เขต/อำเภอ... จังหวัด...',
    phone TEXT DEFAULT '081-234-5678',
    email TEXT DEFAULT 'contact@example.com',
    line_id TEXT DEFAULT '',
    bank_info TEXT DEFAULT '[{"bank":"กสิกรไทย","account_no":"123-4-56789-0","account_name":"ชื่อบัญชีของคุณ"}]',
    logo_url TEXT DEFAULT '',
    signature_url TEXT DEFAULT '',
    default_terms TEXT DEFAULT '1. ชำระเงินภายใน 30 วันนับจากวันที่ออกเอกสาร\n2. โอนเงินเข้าบัญชีธนาคารตามที่ระบุไว้ในเอกสารนี้',
    default_remark TEXT DEFAULT 'ขอขอบคุณที่ไว้วางใจในบริการของเรา',
    year_format TEXT NOT NULL DEFAULT 'BE', -- 'BE' (พ.ศ.) หรือ 'CE' (ค.ศ.)
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customers
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    tax_id TEXT DEFAULT '',
    address TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    note TEXT DEFAULT '',
    deleted_at TEXT DEFAULT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 3. Customer Projects / Billing Titles (หลายหัวบิล/โครงการต่อ 1 ลูกค้า)
CREATE TABLE IF NOT EXISTS customer_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    project_name TEXT NOT NULL,
    site_address TEXT DEFAULT '',
    contact_person TEXT DEFAULT '',
    note TEXT DEFAULT '',
    deleted_at TEXT DEFAULT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 4. Document Sequences (ตารางควบคุมเลขรันแต่ละประเภทและงวดเดือน)
CREATE TABLE IF NOT EXISTS document_sequences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_type TEXT NOT NULL, -- 'quotation', 'billing', 'receipt'
    year_month TEXT NOT NULL, -- เช่น '256911' หรือ '202611'
    current_number INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doc_type, year_month)
);

-- 5. Document Reservations (ตารางจอง/กันเลขไว้สำหรับออกบิลย้อนหลัง)
CREATE TABLE IF NOT EXISTS document_reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_type TEXT NOT NULL, -- 'quotation', 'billing', 'receipt'
    code TEXT NOT NULL UNIQUE, -- เช่น 'QT256911-005'
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    project_id INTEGER REFERENCES customer_projects(id) ON DELETE SET NULL,
    note TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'reserved', -- 'reserved', 'used', 'cancelled'
    reserved_at TEXT DEFAULT CURRENT_TIMESTAMP,
    used_at TEXT DEFAULT NULL
);

-- 6. Documents (เอกสารหลัก)
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE, -- เช่น 'QT256911-001'
    type TEXT NOT NULL, -- 'quotation', 'billing', 'receipt'
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    project_id INTEGER REFERENCES customer_projects(id),
    project_name_custom TEXT DEFAULT '',
    reference_document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
    issue_date TEXT NOT NULL, -- YYYY-MM-DD
    due_date TEXT DEFAULT NULL, -- YYYY-MM-DD
    subtotal REAL NOT NULL DEFAULT 0,
    discount_total REAL NOT NULL DEFAULT 0,
    vat_amount REAL NOT NULL DEFAULT 0, -- 0.00 เนื่องจากร้านไม่มี VAT
    grand_total REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'issued', -- 'draft', 'issued', 'paid', 'cancelled'
    remark TEXT DEFAULT '',
    payment_terms TEXT DEFAULT '',
    cancel_reason TEXT DEFAULT '',
    cancelled_at TEXT DEFAULT NULL,
    deleted_at TEXT DEFAULT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 7. Document Items (รายการสินค้าในเอกสาร)
CREATE TABLE IF NOT EXISTS document_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    product_name TEXT NOT NULL,
    image_url TEXT DEFAULT '',
    quantity REAL NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'ชิ้น',
    unit_price REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    discount_type TEXT NOT NULL DEFAULT 'amount', -- 'amount' or 'percent'
    total_price REAL NOT NULL DEFAULT 0
);

-- 8. Website Leads / Inquiries (คำขอใบเสนอราคาและติดต่อจากหน้าร้าน)
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    line_id TEXT DEFAULT '',
    service_type TEXT DEFAULT '',
    location TEXT DEFAULT '',
    details TEXT DEFAULT '',
    status TEXT DEFAULT 'pending', -- 'pending', 'contacted', 'converted', 'closed'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance & integrity
CREATE INDEX IF NOT EXISTS idx_customers_deleted ON customers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_projects_customer ON customer_projects(customer_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_docs_type_status ON documents(type, status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_docs_customer ON documents(customer_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_docs_issue_date ON documents(issue_date);
CREATE INDEX IF NOT EXISTS idx_doc_items_doc ON document_items(document_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_reservations_type_status ON document_reservations(doc_type, status);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status, created_at);
