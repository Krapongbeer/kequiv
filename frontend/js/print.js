/**
 * Print & A4 PDF Document Renderer
 * Authentic Vintage Typewriter & Paper Ledger Theme (ไม่มี VAT)
 * Ultra-Compact Layout with Small Product Thumbnail Support
 */

window.printModule = {
    currentDoc: null,

    async openPrint(docId) {
        app.openModal('modal-print');
        const sheet = document.getElementById('print-sheet');
        if (!sheet) return;

        sheet.innerHTML = `
            <div class="flex items-center justify-center p-20 text-slate-500 font-mono">
                <div class="animate-spin rounded-full h-7 w-7 border-b-2 border-sky-600"></div>
                <span class="ml-3 text-xs">กำลังเตรียมเอกสารสำหรับพิมพ์ A4...</span>
            </div>
        `;

        try {
            const res = await api.getDocument(docId);
            this.currentDoc = res.data;
            this.renderSheet(this.currentDoc);
        } catch (err) {
            sheet.innerHTML = `
                <div class="p-8 text-center text-rose-700 font-mono">
                    <p class="font-bold text-sm">เกิดข้อผิดพลาดในการโหลดข้อมูลเอกสาร</p>
                    <p class="text-xs mt-1">${err.message}</p>
                </div>
            `;
        }
    },

    renderSheet(doc) {
        const sheet = document.getElementById('print-sheet');
        if (!sheet) return;

        const company = doc.company || {};
        const bankAccounts = company.bank_accounts || [];

        const isUndated = doc.is_undated || (doc.remark && doc.remark.includes('[ไม่ลงวันที่]')) || !doc.issue_date;
        const cleanRemark = (doc.remark || '').replace(/\[ไม่ลงวันที่\]/g, '').trim();

        // Titles map (strictly NO "ใบกำกับภาษี")
        const titles = {
            quotation: { th: 'ใบเสนอราคา', en: 'QUOTATION', code: 'QT' },
            billing: { th: 'ใบแจ้งหนี้ / ใบวางบิล', en: 'INVOICE & BILLING NOTE', code: 'INV' },
            receipt: { th: 'ใบเสร็จรับเงิน', en: 'RECEIPT', code: 'RE' }
        };
        const titleInfo = titles[doc.type] || { th: 'เอกสารธุรกิจ', en: 'DOCUMENT', code: 'DOC' };

        sheet.innerHTML = `
            <!-- Watermark if cancelled -->
            ${doc.status === 'cancelled' ? `
                <div class="watermark-cancelled">ยกเลิก</div>
            ` : ''}

            <!-- 1. Header Section: Company Profile & Document Title (Vintage Typewriter Style) -->
            <div class="flex items-start justify-between gap-4 pt-2.5 pb-2 border-b-2 border-[#1f1d1a] relative avoid-page-break overflow-visible">
                <!-- Left: Company Info (Aligned flush with Branch Address) -->
                <div class="flex-1 min-w-0 pt-0.5 overflow-visible">
                    <div class="flex items-center gap-3.5 overflow-visible">
                        ${company.logo_url ? `
                            <img src="${company.logo_url}" alt="Logo" class="w-auto object-contain shrink-0" style="height: 64px; max-width: 200px;">
                        ` : ''}
                        <div class="min-w-0 flex-1 overflow-visible">
                            <h1 class="text-lg font-bold text-[#1f1d1a] pt-1 pb-0.5 leading-normal overflow-visible" style="font-family: 'Bai Jamjuree', 'Special Elite', var(--font-typewriter);">
                                ${company.name || 'ชื่อกิจการ / ร้านค้า'}
                            </h1>
                            <table class="text-[10.5px] text-stone-700 leading-tight mt-1 font-mono border-collapse">
                                <tbody>
                                    ${(company.tax_id || company.phone) ? `
                                        <tr>
                                            <td class="pr-5 py-0.5 whitespace-nowrap">
                                                ${company.tax_id ? `<span class="text-stone-500">เลขผู้เสียภาษี:</span> <b class="font-bold text-stone-900">${company.tax_id}</b>` : ''}
                                            </td>
                                            <td class="py-0.5 whitespace-nowrap">
                                                ${company.phone ? `<span class="text-stone-500">โทร:</span> <b class="font-bold text-stone-900">${company.phone}</b>` : ''}
                                            </td>
                                        </tr>
                                    ` : ''}
                                    ${(company.email || company.line_id) ? `
                                        <tr>
                                            <td class="pr-5 py-0.5 whitespace-nowrap">
                                                ${company.email ? `<span class="text-stone-500">อีเมล:</span> <b class="font-bold text-stone-900">${company.email}</b>` : ''}
                                            </td>
                                            <td class="py-0.5 whitespace-nowrap">
                                                ${company.line_id ? `<span class="text-stone-500">LINE:</span> <b class="font-bold text-stone-900">${company.line_id}</b>` : ''}
                                            </td>
                                        </tr>
                                    ` : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="text-[10.5px] text-stone-600 mt-1.5 leading-snug font-mono whitespace-pre-line">
                        ${(company.address || '-').split('\n').map(l => l.trim()).filter(Boolean).join('\n')}
                    </div>
                </div>

                <!-- Right: Document Title & Compact Meta Box -->
                <div class="w-56 text-right shrink-0 pt-0.5 overflow-visible">
                    <div class="flex items-baseline justify-end gap-2 mb-1.5 overflow-visible">
                        <h2 class="text-xl font-bold text-[#1f1d1a] tracking-wide pt-1 pb-0.5 leading-normal overflow-visible" style="font-family: 'Bai Jamjuree', 'Special Elite', var(--font-typewriter);">${titleInfo.th}</h2>
                        <span class="text-[11px] font-bold text-stone-600 uppercase font-typewriter">${titleInfo.en}</span>
                    </div>

                    <div class="bg-[#faf6ee] py-1.5 px-2.5 rounded border-2 border-[#292524] text-left text-xs space-y-0.5 shadow-xs font-mono">
                        <div class="flex justify-between items-center">
                            <span class="text-stone-500 text-[11px]">เลขที่เอกสาร:</span>
                            <span class="font-bold text-[#1f1d1a] font-typewriter text-xs">${doc.code}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-stone-500 text-[11px]">วันที่ออก:</span>
                            <span class="font-bold text-stone-800 text-xs">${isUndated ? '<span class="font-mono">..... / ..... / ..........</span>' : app.formatDateThai(doc.issue_date, true)}</span>
                        </div>
                        ${doc.due_date ? `
                            <div class="flex justify-between items-center">
                                <span class="text-stone-500 text-[11px]">ครบกำหนด:</span>
                                <span class="font-bold text-stone-800 text-xs">${app.formatDateThai(doc.due_date, true)}</span>
                            </div>
                        ` : ''}
                        ${doc.reference_code ? `
                            <div class="flex justify-between items-center pt-0.5 border-t border-stone-300">
                                <span class="text-stone-500 text-[11px]">อ้างอิง:</span>
                                <span class="font-mono text-blue-900 font-bold text-xs">${doc.reference_code}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>

            <!-- 2. Balanced & Compact Customer & Project Block -->
            <div class="grid grid-cols-2 gap-2.5 py-1.5 border-b-2 border-[#1f1d1a] font-mono avoid-page-break">
                <!-- Customer Box -->
                <div class="bg-[#faf6ee] px-2.5 py-1.5 rounded border border-stone-800 text-[10.5px]">
                    <div class="flex items-center justify-between mb-1 pb-0.5 border-b border-stone-300">
                        <span class="text-[9px] font-bold uppercase tracking-wider text-stone-600 font-typewriter">ลูกค้า / CUSTOMER</span>
                        ${doc.customer_tax_id ? `<span class="text-[9.5px] text-stone-700 font-mono font-bold">Tax: ${doc.customer_tax_id}</span>` : ''}
                    </div>
                    <div class="font-bold text-stone-900 text-[11px] leading-snug">${doc.customer_name || '-'}</div>
                    <div class="text-[10px] text-stone-600 mt-0.5 leading-tight whitespace-pre-line">${doc.customer_address || '-'}</div>
                    <div class="text-[10px] text-stone-600 mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono">
                        ${doc.customer_phone ? `<div>โทร: <b>${doc.customer_phone}</b></div>` : ''}
                        ${doc.customer_email ? `<div class="break-all">อีเมล: <b>${doc.customer_email}</b></div>` : ''}
                    </div>
                </div>

                <!-- Project / Site Box -->
                <div class="bg-[#faf6ee] px-2.5 py-1.5 rounded border border-stone-800 text-[10.5px]">
                    <div class="flex items-center justify-between mb-1 pb-0.5 border-b border-stone-300">
                        <span class="text-[9px] font-bold uppercase tracking-wider text-stone-600 font-typewriter">
                            โครงการ / หัวบิล (PROJECT & SITE)
                        </span>
                    </div>
                    <div class="font-bold text-indigo-950 text-[11px] leading-snug">
                        ${doc.project_name_custom || doc.project_name || 'หัวบิลมาตรฐาน (ไม่มีโครงการย่อย)'}
                    </div>
                    <div class="text-[10px] text-stone-600 mt-0.5 leading-tight whitespace-pre-line">
                        ${doc.project_site_address ? `หน้างาน: ${doc.project_site_address}` : 'ที่อยู่ตามข้อมูลลูกค้า'}
                    </div>
                    ${doc.project_contact_person ? `
                        <div class="text-[10px] text-stone-600 mt-1 font-mono">
                            ผู้ประสานงาน: <b>${doc.project_contact_person}</b>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- 3. Space-Efficient Typewriter Items Table (12 Rows Standard - ให้อยู่ในหน้าเดียว) -->
            <div class="mt-2">
                <table class="w-full text-[11px] text-left border-collapse border-2 border-[#1f1d1a]">
                    <thead>
                        <tr class="bg-[#ede4d3] text-stone-900 font-bold border-b-2 border-[#1f1d1a] font-typewriter">
                            <th class="border border-stone-800 px-1.5 py-1 text-center whitespace-nowrap w-10">ลำดับ</th>
                            <th class="border border-stone-800 px-2 py-1">รายการสินค้า / รายละเอียดงาน</th>
                            <th class="border border-stone-800 px-2 py-1 text-right whitespace-nowrap w-14">จำนวน</th>
                            <th class="border border-stone-800 px-2 py-1 text-center whitespace-nowrap w-14">หน่วย</th>
                            <th class="border border-stone-800 px-2 py-1 text-right whitespace-nowrap w-24">ราคา/หน่วย</th>
                            <th class="border border-stone-800 px-2 py-1 text-right whitespace-nowrap w-16">ส่วนลด</th>
                            <th class="border border-stone-800 px-2.5 py-1 text-right whitespace-nowrap w-24">จำนวนเงิน</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(() => {
                            const allItems = doc.items || [];
                            const regularItems = [];
                            const noteItems = [];

                            allItems.forEach(item => {
                                const isNoteRow = item.product_name && (
                                    item.product_name.trim().startsWith('*') || 
                                    (Number(item.unit_price) === 0 && Number(item.total_price) === 0 && (!item.unit || item.unit === 'รายการ' || item.unit === '-' || item.unit === ''))
                                );
                                if (isNoteRow) {
                                    noteItems.push(item);
                                } else {
                                    regularItems.push(item);
                                }
                            });

                            const totalItemsCount = regularItems.length + noteItems.length;
                            if (totalItemsCount === 0) {
                                return `
                                    <tr>
                                        <td colspan="7" class="text-center py-4 text-stone-500 font-mono">ไม่มีรายการสินค้า</td>
                                    </tr>
                                    ${Array.from({ length: 11 }).map(() => `
                                        <tr class="border-b border-stone-200 select-none h-6">
                                            <td class="border-x border-stone-800 px-1 py-0.5 text-center text-transparent">&nbsp;</td>
                                            <td class="border-x border-stone-800 px-2 py-0.5 text-transparent">&nbsp;</td>
                                            <td class="border-x border-stone-800 px-1 py-0.5 text-transparent">&nbsp;</td>
                                            <td class="border-x border-stone-800 px-1 py-0.5 text-transparent">&nbsp;</td>
                                            <td class="border-x border-stone-800 px-2 py-0.5 text-transparent">&nbsp;</td>
                                            <td class="border-x border-stone-800 px-1 py-0.5 text-transparent">&nbsp;</td>
                                            <td class="border-x border-stone-800 px-2.5 py-0.5 text-transparent">&nbsp;</td>
                                        </tr>
                                    `).join('')}
                                `;
                            }

                            const emptyRowsCount = Math.max(0, 12 - totalItemsCount);

                            // 1. Regular items
                            const renderedRegular = regularItems.map((item, idx) => {
                                const hasValidImage = item.image_url && 
                                    typeof item.image_url === 'string' && 
                                    item.image_url.trim().length > 0 && 
                                    !item.image_url.includes('placeholder') && 
                                    !item.image_url.includes('undefined') && 
                                    !item.image_url.includes('null');

                                const parts = (item.product_name || '').split('\n');
                                const title = parts[0] || '';
                                const desc = parts.slice(1).join('\n');
                                const intQty = Math.round(Number(item.quantity) || 0);

                                return `
                                    <tr class="border-b border-stone-300 hover:bg-stone-50/50 min-h-6">
                                        <td class="border-x border-stone-800 px-1 py-1 text-center text-stone-600 align-middle font-mono">${idx + 1}</td>
                                        <td class="border-x border-stone-800 px-2 py-1 align-middle">
                                            <div class="flex items-start gap-1.5">
                                                ${hasValidImage ? `
                                                    <img src="${item.image_url}" alt="รูปสินค้า" class="w-6 h-6 object-cover rounded border border-stone-300 shrink-0 bg-white mt-0.5" onerror="this.remove()">
                                                ` : ''}
                                                <div class="min-w-0 flex-1">
                                                    <div class="font-medium text-stone-900 leading-snug break-words">${title}</div>
                                                    ${desc ? `<div class="text-[9.5px] text-stone-600 mt-0.5 leading-tight whitespace-pre-line font-sans">${desc}</div>` : ''}
                                                </div>
                                            </div>
                                        </td>
                                        <td class="border-x border-stone-800 px-2 py-1 text-right font-mono align-middle">${intQty}</td>
                                        <td class="border-x border-stone-800 px-2 py-1 text-center text-stone-700 align-middle">${item.unit || 'ชิ้น'}</td>
                                        <td class="border-x border-stone-800 px-2 py-1 text-right font-mono align-middle">
                                            ${Number(item.unit_price) > 0 ? app.formatCurrency(item.unit_price) : (Number(item.total_price) === 0 ? '<span class="text-emerald-700 font-bold">ฟรี</span>' : '0.00')}
                                        </td>
                                        <td class="border-x border-stone-800 px-2 py-1 text-right text-stone-600 font-mono align-middle">
                                            ${item.discount > 0 ? app.formatCurrency(item.discount) : '-'}
                                        </td>
                                        <td class="border-x border-stone-800 px-2.5 py-1 text-right font-bold text-stone-900 font-mono align-middle">
                                            ${Number(item.total_price) > 0 ? app.formatCurrency(item.total_price) : (Number(item.unit_price) === 0 ? '<span class="text-emerald-700 font-bold">0.00</span>' : app.formatCurrency(item.total_price))}
                                        </td>
                                    </tr>
                                `;
                            }).join('');

                            // 2. Middle empty rows (fills space between regular items and bottom note rows)
                            const renderedEmpty = Array.from({ length: emptyRowsCount }).map(() => `
                                <tr class="border-b border-stone-200 select-none h-6">
                                    <td class="border-x border-stone-800 px-1 py-0.5 text-center text-transparent">&nbsp;</td>
                                    <td class="border-x border-stone-800 px-2 py-0.5 text-transparent">&nbsp;</td>
                                    <td class="border-x border-stone-800 px-1 py-0.5 text-transparent">&nbsp;</td>
                                    <td class="border-x border-stone-800 px-1 py-0.5 text-transparent">&nbsp;</td>
                                    <td class="border-x border-stone-800 px-2 py-0.5 text-transparent">&nbsp;</td>
                                    <td class="border-x border-stone-800 px-1 py-0.5 text-transparent">&nbsp;</td>
                                    <td class="border-x border-stone-800 px-2.5 py-0.5 text-transparent">&nbsp;</td>
                                </tr>
                            `).join('');

                            // 3. Note / Gift / Warranty rows (ALWAYS ANCHORED AT THE VERY BOTTOM OF THE 12-ROW TABLE)
                            const renderedNotes = noteItems.map(item => {
                                const cleanNote = item.product_name.startsWith('*') 
                                    ? item.product_name.substring(1).trim() 
                                    : item.product_name.trim();

                                return `
                                    <tr class="border-b border-stone-300 bg-[#faf6ee]/80 text-stone-900 font-mono h-6">
                                        <td class="border-x border-stone-800 px-1 py-0.5 text-center font-bold text-amber-900">★</td>
                                        <td colspan="6" class="border-x border-stone-800 px-2.5 py-0.5 text-[10.5px] leading-tight">
                                            <span class="font-bold text-stone-950">* ${cleanNote}</span>
                                        </td>
                                    </tr>
                                `;
                            }).join('');

                            return renderedRegular + renderedEmpty + renderedNotes;
                        })()}
                    </tbody>
                </table>
            </div>

            <!-- 4. Thai Baht Text Bar & Financial Summary -->
            <div class="grid grid-cols-12 gap-2.5 mt-2.5 text-xs font-mono avoid-page-break">
                <!-- Left 7 cols: Thai Baht Text + Bank Details + Notes -->
                <div class="col-span-7 space-y-1.5">
                    <!-- Thai Baht Text Box -->
                    <div class="py-1.5 px-2 bg-[#faf6ee] rounded border border-stone-800 flex items-center gap-1.5 text-xs">
                        <span class="font-bold text-stone-700 shrink-0 font-typewriter">ตัวอักษร:</span>
                        <span class="font-bold text-stone-900 leading-tight">( ${doc.grand_total_thai || 'ศูนย์บาทถ้วน'} )</span>
                    </div>

                    <!-- Bank Payment Accounts -->
                    ${bankAccounts.length > 0 ? `
                        <div class="py-1.5 px-2 bg-[#faf6ee] rounded border border-stone-400 text-[11px] space-y-1">
                            <div class="font-bold text-stone-800 flex items-center gap-1 font-typewriter">
                                <span>💳</span> ข้อมูลบัญชีสำหรับโอนเงิน:
                            </div>
                            <div class="grid grid-cols-1 gap-0.5">
                                ${bankAccounts.map(b => `
                                    <div class="flex items-center justify-between bg-white px-2 py-0.5 rounded border border-stone-200">
                                        <span class="font-medium text-stone-800">${b.bank}</span>
                                        <span class="font-bold text-blue-900 font-mono">${b.account_no}</span>
                                        <span class="text-stone-500 text-[10px]">(${b.account_name})</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Payment Terms & Remarks -->
                    <div class="text-[11px] text-stone-600 space-y-0.5 leading-snug">
                        ${doc.payment_terms ? `
                            <div><span class="font-bold text-stone-700">เงื่อนไขชำระเงิน:</span> ${doc.payment_terms}</div>
                        ` : ''}
                        ${cleanRemark ? `
                            <div><span class="font-bold text-stone-700">หมายเหตุ:</span> ${cleanRemark}</div>
                        ` : ''}
                    </div>
                </div>

                <!-- Right 5 cols: Calculations Table -->
                <div class="col-span-5 border-2 border-stone-800 rounded overflow-hidden bg-white text-xs">
                    <table class="w-full">
                        <tr class="border-b border-stone-200">
                            <td class="px-2.5 py-1 text-stone-600">รวมเป็นเงิน:</td>
                            <td class="px-2.5 py-1 text-right font-mono font-medium">${app.formatCurrency(doc.subtotal)}</td>
                        </tr>
                        ${doc.discount_total > 0 ? `
                            <tr class="border-b border-stone-200 text-red-700">
                                <td class="px-2.5 py-1">ส่วนลด:</td>
                                <td class="px-2.5 py-1 text-right font-mono font-medium">-฿${app.formatCurrency(doc.discount_total)}</td>
                            </tr>
                        ` : ''}
                        <tr class="bg-[#ede4d3] font-bold text-stone-900 border-t-2 border-stone-800">
                            <td class="px-2.5 py-2 text-xs font-typewriter">ยอดรวมสุทธิ:</td>
                            <td class="px-2.5 py-2 text-right font-bold text-base text-[#1f1d1a] font-typewriter">
                                ฿${app.formatCurrency(doc.grand_total)}
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- 5. Signatures Box -->
            <div class="grid grid-cols-2 gap-6 mt-4 pt-3 border-t-2 border-[#1f1d1a] text-xs font-mono avoid-page-break">
                <!-- Customer Signature -->
                <div class="text-center">
                    <div class="h-10 flex items-end justify-center">
                        <div class="w-44 border-b-2 border-stone-700"></div>
                    </div>
                    <div class="mt-1 font-bold text-stone-800 text-[11px] font-typewriter">ผู้สั่งซื้อ / ผู้รับบริการ</div>
                    <div class="text-[10px] text-stone-500 mt-0.5">วันที่ ..... / ..... / ..........</div>
                </div>

                <!-- Authorized Signature -->
                <div class="text-center">
                    <div class="h-10 flex items-end justify-center">
                        <div class="w-44 border-b-2 border-stone-700"></div>
                    </div>
                    <div class="mt-1 font-bold text-stone-800 text-[11px] font-typewriter">ผู้มีอำนาจลงนาม / ผู้รับเงิน</div>
                    <div class="text-[10px] text-stone-500 mt-0.5">วันที่ ..... / ..... / ..........</div>
                </div>
            </div>
        `;
    },

    triggerPrint() {
        const sheet = document.getElementById('print-sheet');
        if (!sheet) {
            document.body.classList.add('is-printing-doc');
            window.print();
            return;
        }

        try {
            // Remove any previous print isolation frame
            let iframe = document.getElementById('print-isolation-frame');
            if (iframe) iframe.remove();

            // Create dedicated clean print frame containing ONLY the A4 document
            iframe = document.createElement('iframe');
            iframe.id = 'print-isolation-frame';
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            iframe.style.visibility = 'hidden';
            iframe.style.pointerEvents = 'none';
            document.body.appendChild(iframe);

            const iframeDoc = iframe.contentWindow.document;
            let pdfFileName = 'KequivDoc';
            if (this.currentDoc) {
                const code = this.currentDoc.code || '';
                if (this.currentDoc.type === 'quotation') {
                    pdfFileName = `KequivQT@${code}`;
                } else if (this.currentDoc.type === 'billing') {
                    pdfFileName = `KequivINV@${code}`;
                } else if (this.currentDoc.type === 'receipt') {
                    pdfFileName = `KequivRE@${code}`;
                } else {
                    pdfFileName = `Kequiv@${code}`;
                }
            }

            const originalTitle = document.title;
            document.title = pdfFileName;

            iframeDoc.open();
            iframeDoc.write(`<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>${pdfFileName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="css/style.css?v=2.8.1">
    <style>
        @page {
            size: A4 portrait;
            margin: 0 !important; /* Disables browser-generated header (doc title/date) & footer (URL/pages) */
        }
        *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            box-sizing: border-box !important;
        }
        html, body {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #1f1d1a !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            font-family: 'Bai Jamjuree', 'Courier Prime', 'Sarabun', monospace;
            -webkit-font-smoothing: antialiased;
        }
        .print-container {
            width: 210mm !important;
            max-width: 210mm !important;
            min-height: 297mm !important;
            padding: 12mm 15mm 15mm 15mm !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            overflow: visible !important;
        }
        h1, h2, h3, p, div, span, th, td {
            overflow: visible !important;
        }
        table {
            border-collapse: collapse !important;
            width: 100% !important;
        }
        tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
        }
        .avoid-page-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
        }
        .bg-\\[\\#faf6ee\\] {
            background-color: #faf6ee !important;
        }
        .bg-\\[\\#ede4d3\\] {
            background-color: #ede4d3 !important;
        }
        .border-\\[\\#1f1d1a\\] {
            border-color: #1f1d1a !important;
        }
        .border-\\[\\#292524\\] {
            border-color: #292524 !important;
        }
    </style>
</head>
<body class="bg-white p-0 m-0">
    <div class="print-container">
        ${sheet.innerHTML}
    </div>
</body>
</html>`);
            iframeDoc.close();

            // Wait for styles and DOM to settle inside iframe then trigger print
            setTimeout(() => {
                try {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                } catch (e) {
                    document.body.classList.add('is-printing-doc');
                    window.print();
                } finally {
                    setTimeout(() => {
                        document.title = originalTitle;
                    }, 1000);
                }
            }, 250);
        } catch (err) {
            console.warn('Iframe print error, falling back to window.print():', err);
            document.body.classList.add('is-printing-doc');
            window.print();
        }
    },

    shareCurrentToLine() {
        if (!this.currentDoc) {
            app.toast('ไม่พบข้อมูลเอกสารสำหรับแชร์', 'warning');
            return;
        }
        const doc = this.currentDoc;
        const titles = { quotation: 'ใบเสนอราคา', billing: 'ใบแจ้งหนี้/วางบิล', receipt: 'ใบเสร็จรับเงิน' };
        const title = titles[doc.type] || 'เอกสารธุรกิจ';

        let msg = `📄 [${title}] ร้านเคอีควิป Kequiv\n`;
        msg += `เลขที่: ${doc.code}\n`;
        msg += `ลูกค้า: ${doc.customer_name || '-'}\n`;
        if (doc.project_name_custom || doc.project_name) {
            msg += `โครงการ: ${doc.project_name_custom || doc.project_name}\n`;
        }
        msg += `วันที่: ${app.formatDateThai(doc.issue_date, true)}\n`;
        msg += `----------------------------\n`;
        if (doc.items && doc.items.length > 0) {
            doc.items.forEach((it, idx) => {
                msg += `${idx + 1}. ${it.product_name} x ${it.quantity} ${it.unit} = ฿${app.formatCurrency(it.total_price)}\n`;
            });
            msg += `----------------------------\n`;
        }
        msg += `💰 ยอดรวมสุทธิ: ฿${app.formatCurrency(doc.grand_total)} บาท\n`;
        msg += `(${doc.grand_total_thai || ''})\n\n`;

        if (doc.company && doc.company.bank_accounts && doc.company.bank_accounts.length > 0) {
            msg += `💳 ข้อมูลโอนเงิน:\n`;
            doc.company.bank_accounts.forEach(b => {
                msg += `${b.bank} เลขที่: ${b.account_no} (${b.account_name})\n`;
            });
        }
        msg += `\nขอบพระคุณที่ไว้วางใจในบริการของเราครับ`;

        const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(msg)}`;
        window.open(lineUrl, '_blank');
    }
};

// Global cleanup after print dialog closes
if (typeof window !== 'undefined') {
    window.addEventListener('afterprint', () => {
        document.body.classList.remove('is-printing-doc');
    });
}
