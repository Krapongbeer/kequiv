/**
 * Document Number Sequence & Reservation Engine
 * Guarantees zero collision and supports reservation for backdating.
 */

const TYPE_PREFIXES = {
    quotation: 'QT',
    billing: 'INV',
    receipt: 'RE'
};

function getYearMonth(dateStr, yearFormat = 'BE') {
    let year, month;
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}/.test(dateStr)) {
        const parts = dateStr.split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
    } else {
        const nowStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(dateStr ? new Date(dateStr) : new Date());
        const parts = nowStr.split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
    }
    if (yearFormat === 'BE') {
        year += 543;
    }
    return `${year}${String(month).padStart(2, '0')}`;
}

function formatCode(prefix, yearMonth, num) {
    const seqStr = String(num).padStart(3, '0');
    return `${prefix}${yearMonth}-${seqStr}`;
}

/**
 * Get next available document code for a given type & date.
 * Skips any numbers already present in documents or reservations.
 */
function getNextDocumentCode(db, docType, issueDate) {
    const prefix = TYPE_PREFIXES[docType] || 'DOC';
    
    // Check company profile year format
    const company = db.prepare('SELECT year_format FROM company_profile WHERE id = 1').get() || { year_format: 'BE' };
    const ym = getYearMonth(issueDate, company.year_format);

    // Get current sequence
    let seqRow = db.prepare('SELECT current_number FROM document_sequences WHERE doc_type = ? AND year_month = ?').get(docType, ym);
    let nextNum = (seqRow ? seqRow.current_number : 0) + 1;

    // Loop to find next available code that does not exist in documents OR active reservations
    while (true) {
        const candidateCode = formatCode(prefix, ym, nextNum);
        
        const docExists = db.prepare('SELECT id FROM documents WHERE code = ?').get(candidateCode);
        const resExists = db.prepare('SELECT id FROM document_reservations WHERE code = ?').get(candidateCode);

        if (!docExists && !resExists) {
            // Found a free number
            break;
        }
        nextNum++;
    }

    return {
        code: formatCode(prefix, ym, nextNum),
        prefix,
        yearMonth: ym,
        sequenceNum: nextNum
    };
}

/**
 * Atomically assign and commit next sequence number for an issued document
 */
function commitDocumentCode(db, docType, issueDate, specifiedCode = null) {
    if (specifiedCode) {
        // If user used a reserved code or specific custom code, check if it's in reservations
        const res = db.prepare('SELECT id, status FROM document_reservations WHERE code = ?').get(specifiedCode);
        if (res) {
            db.prepare("UPDATE document_reservations SET status = 'used', used_at = datetime('now') WHERE id = ?").run(res.id);
        }
        return specifiedCode;
    }

    const { code, yearMonth, sequenceNum } = getNextDocumentCode(db, docType, issueDate);

    // Update or insert sequence
    const exists = db.prepare('SELECT id FROM document_sequences WHERE doc_type = ? AND year_month = ?').get(docType, yearMonth);
    if (exists) {
        db.prepare('UPDATE document_sequences SET current_number = MAX(current_number, ?), updated_at = datetime(\'now\') WHERE doc_type = ? AND year_month = ?')
          .run(sequenceNum, docType, yearMonth);
    } else {
        db.prepare('INSERT INTO document_sequences (doc_type, year_month, current_number) VALUES (?, ?, ?)')
          .run(docType, yearMonth, sequenceNum);
    }

    return code;
}

/**
 * Reserve a batch of numbers for backdating
 */
function reserveBatchNumbers(db, docType, count, options = {}) {
    const { note = '', customer_id = null, project_id = null, yearMonth = null } = options;
    const prefix = TYPE_PREFIXES[docType] || 'DOC';
    
    const company = db.prepare('SELECT year_format FROM company_profile WHERE id = 1').get() || { year_format: 'BE' };
    const ym = yearMonth || getYearMonth(new Date().toISOString(), company.year_format);

    let seqRow = db.prepare('SELECT current_number FROM document_sequences WHERE doc_type = ? AND year_month = ?').get(docType, ym);
    let curNum = seqRow ? seqRow.current_number : 0;

    const reservedCodes = [];
    const insertStmt = db.prepare(`
        INSERT INTO document_reservations (doc_type, code, customer_id, project_id, note, status, reserved_at)
        VALUES (?, ?, ?, ?, ?, 'reserved', datetime('now'))
    `);

    db.exec('BEGIN TRANSACTION');
    try {
        let created = 0;
        let testNum = curNum + 1;

        while (created < count) {
            const candidateCode = formatCode(prefix, ym, testNum);
            const docExists = db.prepare('SELECT id FROM documents WHERE code = ?').get(candidateCode);
            const resExists = db.prepare('SELECT id FROM document_reservations WHERE code = ?').get(candidateCode);

            if (!docExists && !resExists) {
                insertStmt.run(docType, candidateCode, customer_id || null, project_id || null, note || `กันเลขไว้ ${docType}`);
                reservedCodes.push(candidateCode);
                created++;
            }
            testNum++;
        }

        const highestNum = testNum - 1;
        // Update sequence so regular generation jumps past these reserved numbers
        if (seqRow) {
            db.prepare('UPDATE document_sequences SET current_number = MAX(current_number, ?), updated_at = datetime(\'now\') WHERE doc_type = ? AND year_month = ?')
              .run(highestNum, docType, ym);
        } else {
            db.prepare('INSERT INTO document_sequences (doc_type, year_month, current_number) VALUES (?, ?, ?)')
              .run(docType, ym, highestNum);
        }

        db.exec('COMMIT');
        return reservedCodes;
    } catch (err) {
        db.exec('ROLLBACK');
        throw err;
    }
}

module.exports = {
    TYPE_PREFIXES,
    getYearMonth,
    formatCode,
    getNextDocumentCode,
    commitDocumentCode,
    reserveBatchNumbers
};
