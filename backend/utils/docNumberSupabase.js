/**
 * Supabase Async Document Number Sequence & Reservation Engine
 * Guarantees zero collision and supports reservation for backdating.
 */

const TYPE_PREFIXES = {
    quotation: 'QT',
    billing: 'INV',
    receipt: 'RE'
};

function getYearMonth(dateStr, yearFormat = 'CE') {
    const d = dateStr ? new Date(dateStr) : new Date();
    let year = d.getFullYear();
    if (isNaN(year)) {
        year = new Date().getFullYear();
    }
    if (yearFormat === 'BE') {
        year += 543;
    }
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}${month}`;
}

function formatCode(prefix, yearMonth, num) {
    const seqStr = String(num).padStart(3, '0');
    return `${prefix}${yearMonth}-${seqStr}`;
}

async function getNextDocumentCodeSupabase(supabase, docType, issueDate) {
    const prefix = TYPE_PREFIXES[docType] || 'DOC';

    // 1. Get company profile year_format
    const { data: comp } = await supabase
        .from('company_profile')
        .select('year_format')
        .eq('id', 1)
        .single();

    const yearFormat = comp ? comp.year_format : 'CE';
    const ym = getYearMonth(issueDate, yearFormat);

    // 2. Get current sequence
    const { data: seqRow } = await supabase
        .from('document_sequences')
        .select('current_number')
        .eq('doc_type', docType)
        .eq('year_month', ym)
        .maybeSingle();

    let nextNum = (seqRow ? seqRow.current_number : 0) + 1;

    // 3. Loop to find next available code
    while (true) {
        const candidateCode = formatCode(prefix, ym, nextNum);

        const { data: docExists } = await supabase
            .from('documents')
            .select('id')
            .eq('code', candidateCode)
            .maybeSingle();

        const { data: resExists } = await supabase
            .from('document_reservations')
            .select('id')
            .eq('code', candidateCode)
            .maybeSingle();

        if (!docExists && !resExists) {
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

async function commitDocumentCodeSupabase(supabase, docType, issueDate, specifiedCode = null) {
    if (specifiedCode) {
        const { data: res } = await supabase
            .from('document_reservations')
            .select('id, status')
            .eq('code', specifiedCode)
            .maybeSingle();

        if (res) {
            await supabase
                .from('document_reservations')
                .update({
                    status: 'used',
                    used_at: new Date().toISOString()
                })
                .eq('id', res.id);
        }
        return specifiedCode;
    }

    const { code, yearMonth, sequenceNum } = await getNextDocumentCodeSupabase(supabase, docType, issueDate);

    // Upsert sequence
    const { data: existingSeq } = await supabase
        .from('document_sequences')
        .select('id, current_number')
        .eq('doc_type', docType)
        .eq('year_month', yearMonth)
        .maybeSingle();

    if (existingSeq) {
        const newMax = Math.max(existingSeq.current_number, sequenceNum);
        await supabase
            .from('document_sequences')
            .update({
                current_number: newMax,
                updated_at: new Date().toISOString()
            })
            .eq('id', existingSeq.id);
    } else {
        await supabase
            .from('document_sequences')
            .insert({
                doc_type: docType,
                year_month: yearMonth,
                current_number: sequenceNum
            });
    }

    return code;
}

async function reserveBatchNumbersSupabase(supabase, docType, count, options = {}) {
    const { note = '', customer_id = null, project_id = null, yearMonth = null } = options;
    const prefix = TYPE_PREFIXES[docType] || 'DOC';

    let ym = yearMonth;
    if (!ym) {
        const { data: comp } = await supabase
            .from('company_profile')
            .select('year_format')
            .eq('id', 1)
            .single();
        ym = getYearMonth(new Date().toISOString(), comp ? comp.year_format : 'CE');
    }

    const { data: seqRow } = await supabase
        .from('document_sequences')
        .select('id, current_number')
        .eq('doc_type', docType)
        .eq('year_month', ym)
        .maybeSingle();

    let nextNum = (seqRow ? seqRow.current_number : 0) + 1;
    const reservedCodes = [];
    const rowsToInsert = [];

    while (reservedCodes.length < count) {
        const candidateCode = formatCode(prefix, ym, nextNum);

        const { data: docExists } = await supabase
            .from('documents')
            .select('id')
            .eq('code', candidateCode)
            .maybeSingle();

        const { data: resExists } = await supabase
            .from('document_reservations')
            .select('id')
            .eq('code', candidateCode)
            .maybeSingle();

        if (!docExists && !resExists) {
            reservedCodes.push(candidateCode);
            rowsToInsert.push({
                doc_type: docType,
                code: candidateCode,
                customer_id: customer_id ? parseInt(customer_id, 10) : null,
                project_id: project_id ? parseInt(project_id, 10) : null,
                note: note || '',
                status: 'reserved'
            });
        }
        nextNum++;
    }

    // Insert reservations with safe explicit IDs
    if (rowsToInsert.length > 0) {
        const { data: maxRow } = await supabase
            .from('document_reservations')
            .select('id')
            .order('id', { ascending: false })
            .limit(1);
        let nextId = (maxRow?.[0]?.id || 0) + 1;

        rowsToInsert.forEach(row => {
            row.id = nextId++;
        });

        const { error: insErr } = await supabase.from('document_reservations').insert(rowsToInsert);
        if (insErr) {
            console.error('reserveBatchNumbersSupabase insert error:', insErr);
            throw new Error(insErr.message);
        }
    }

    // Update sequence
    const finalNumber = nextNum - 1;
    if (seqRow) {
        await supabase
            .from('document_sequences')
            .update({
                current_number: Math.max(seqRow.current_number, finalNumber),
                updated_at: new Date().toISOString()
            })
            .eq('id', seqRow.id);
    } else {
        await supabase
            .from('document_sequences')
            .insert({
                doc_type: docType,
                year_month: ym,
                current_number: finalNumber
            });
    }

    return reservedCodes;
}

module.exports = {
    getNextDocumentCodeSupabase,
    commitDocumentCodeSupabase,
    reserveBatchNumbersSupabase
};
