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
            <div class="flex items-start justify-between gap-4 pb-2.5 border-b-2 border-[#1f1d1a] relative">
                <!-- Left: Company Info -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3.5">
                        ${company.logo_url ? `
                            <img src="${company.logo_url}" alt="Logo" class="w-auto object-contain shrink-0" style="height: 68px; max-width: 220px;">
                        ` : ''}
                        <div class="min-w-0">
                            <h1 class="text-lg font-bold font-typewriter text-[#1f1d1a] leading-tight">
                                ${company.name || 'ชื่อกิจการ / ร้านค้า'}
                            </h1>
                            <div class="text-[11px] text-stone-600 flex flex-wrap gap-x-2.5 leading-tight mt-1 font-mono">
                                ${company.tax_id ? `<span>เลขผู้เสียภาษี: <b>${company.tax_id}</b></span>` : ''}
                                ${company.phone ? `<span>โทร: <b>${company.phone}</b></span>` : ''}
                                ${company.email ? `<span>อีเมล: <b>${company.email}</b></span>` : ''}
                                ${company.line_id ? `<span>LINE: <b>${company.line_id}</b></span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="text-[11px] text-stone-600 mt-1.5 leading-snug font-mono whitespace-pre-line">
                        ${(company.address || '-').split('\n').map(l => l.trim()).filter(Boolean).join('\n')}
                    </div>
                </div>

                <!-- Right: Document Title & Compact Meta Box -->
                <div class="w-64 text-right shrink-0">
                    <div class="flex items-baseline justify-end gap-2 mb-1.5">
                        <h2 class="text-xl font-bold font-typewriter text-[#1f1d1a] tracking-wide">${titleInfo.th}</h2>
                        <span class="text-[11px] font-bold text-stone-600 uppercase font-typewriter">${titleInfo.en}</span>
                    </div>

                    <div class="bg-[#faf6ee] py-1.5 px-2.5 rounded border-2 border-[#292524] text-left text-xs space-y-0.5 shadow-xs font-mono">
                        <div class="flex justify-between items-center">
                            <span class="text-stone-500 text-[11px]">เลขที่เอกสาร:</span>
                            <span class="font-bold text-[#1f1d1a] font-typewriter text-xs">${doc.code}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-stone-500 text-[11px]">วันที่ออก:</span>
                            <span class="font-bold text-stone-800 text-xs">${app.formatDateThai(doc.issue_date, true)}</span>
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

            <!-- 2. Compact Customer & Project Block -->
            <div class="grid grid-cols-2 gap-3 py-2 border-b-2 border-[#1f1d1a] text-xs font-mono">
                <!-- Customer Box -->
                <div class="bg-[#faf6ee] p-2.5 rounded border-2 border-[#292524]">
                    <div class="flex items-center justify-between mb-1 pb-0.5 border-b border-stone-300">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-stone-600 font-typewriter">ลูกค้า / CUSTOMER</span>
                        ${doc.customer_tax_id ? `<span class="text-[10px] text-stone-700 font-mono font-bold">Tax: ${doc.customer_tax_id}</span>` : ''}
                    </div>
                    <div class="font-bold text-stone-900 text-xs">${doc.customer_name || '-'}</div>
                    <div class="text-[11px] text-stone-600 mt-1 leading-snug whitespace-pre-line">${doc.customer_address || '-'}</div>
                    <div class="text-[11px] text-stone-600 mt-1.5 space-y-0.5 font-mono">
                        ${doc.customer_phone ? `<div>โทร: <b>${doc.customer_phone}</b></div>` : ''}
                        ${doc.customer_email ? `<div class="break-all">อีเมล: <b>${doc.customer_email}</b></div>` : ''}
                    </div>
                </div>

                <!-- Project / Site Box -->
                <div class="bg-[#faf6ee] p-2.5 rounded border-2 border-[#292524]">
                    <div class="flex items-center justify-between mb-1 pb-0.5 border-b border-stone-300">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-stone-600 font-typewriter">
                            โครงการ / หัวบิล (PROJECT & SITE)
                        </span>
                    </div>
                    <div class="font-bold text-indigo-950 text-xs">
                        ${doc.project_name_custom || doc.project_name || 'หัวบิลมาตรฐาน (ไม่มีโครงการย่อย)'}
                    </div>
                    <div class="text-[11px] text-stone-600 mt-1 leading-snug whitespace-pre-line">
                        ${doc.project_site_address ? `หน้างาน: ${doc.project_site_address}` : 'ที่อยู่ตามข้อมูลลูกค้า'}
                    </div>
                    ${doc.project_contact_person ? `
                        <div class="text-[11px] text-stone-600 mt-1.5 font-mono">
                            ผู้ประสานงาน: <b>${doc.project_contact_person}</b>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- 3. Space-Efficient Typewriter Items Table with Product Thumbnail -->
            <div class="mt-2.5">
                <table class="w-full text-xs text-left border-collapse border-2 border-[#1f1d1a]">
                    <thead>
                        <tr class="bg-[#ede4d3] text-stone-900 font-bold border-b-2 border-[#1f1d1a] font-typewriter">
                            <th class="border border-stone-800 px-2 py-1.5 text-center whitespace-nowrap w-12">ลำดับ</th>
                            <th class="border border-stone-800 px-2.5 py-1.5">รายการสินค้า / รายละเอียดงาน</th>
                            <th class="border border-stone-800 px-2 py-1.5 text-right whitespace-nowrap w-16">จำนวน</th>
                            <th class="border border-stone-800 px-2 py-1.5 text-center whitespace-nowrap w-16">หน่วย</th>
                            <th class="border border-stone-800 px-2.5 py-1.5 text-right whitespace-nowrap w-24">ราคา/หน่วย</th>
                            <th class="border border-stone-800 px-2 py-1.5 text-right whitespace-nowrap w-20">ส่วนลด</th>
                            <th class="border border-stone-800 px-2.5 py-1.5 text-right whitespace-nowrap w-28">จำนวนเงิน</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${doc.items && doc.items.length > 0 ? doc.items.map((item, idx) => `
                            <tr class="border-b border-stone-300 hover:bg-stone-50/50">
                                <td class="border-x border-stone-800 px-1.5 py-1.5 text-center text-stone-600 align-middle font-mono">${idx + 1}</td>
                                <td class="border-x border-stone-800 px-2.5 py-1.5 align-middle">
                                    <div class="flex items-center gap-2">
                                        ${item.image_url ? `
                                            <img src="${item.image_url}" alt="รูปสินค้า" class="w-8 h-8 object-cover rounded border border-stone-300 shrink-0 bg-white shadow-xs">
                                        ` : ''}
                                        <div class="min-w-0">
                                            <div class="font-medium text-stone-900 leading-snug break-words">${item.product_name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="border-x border-stone-800 px-2 py-1.5 text-right font-mono align-middle">${item.quantity}</td>
                                <td class="border-x border-stone-800 px-2 py-1.5 text-center text-stone-700 align-middle">${item.unit || 'ชิ้น'}</td>
                                <td class="border-x border-stone-800 px-2.5 py-1.5 text-right font-mono align-middle">${app.formatCurrency(item.unit_price)}</td>
                                <td class="border-x border-stone-800 px-2 py-1.5 text-right text-stone-600 font-mono align-middle">
                                    ${item.discount > 0 ? app.formatCurrency(item.discount) : '-'}
                                </td>
                                <td class="border-x border-stone-800 px-2.5 py-1.5 text-right font-bold text-stone-900 font-mono align-middle">
                                    ${app.formatCurrency(item.total_price)}
                                </td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="7" class="text-center py-6 text-stone-500 font-mono">ไม่มีรายการสินค้า</td>
                            </tr>
                        `}
                        <!-- Pad empty rows only if fewer than 3 items to preserve A4 balance without overflowing -->
                        ${Array.from({ length: Math.max(0, 3 - (doc.items ? doc.items.length : 0)) }).map(() => `
                            <tr class="border-b border-stone-200 text-transparent select-none">
                                <td class="border-x border-stone-800 px-1.5 py-1 text-center">-</td>
                                <td class="border-x border-stone-800 px-2.5 py-1">-</td>
                                <td class="border-x border-stone-800 px-2 py-1">-</td>
                                <td class="border-x border-stone-800 px-2 py-1">-</td>
                                <td class="border-x border-stone-800 px-2.5 py-1">-</td>
                                <td class="border-x border-stone-800 px-2 py-1">-</td>
                                <td class="border-x border-stone-800 px-2.5 py-1">-</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- 4. Thai Baht Text Bar & Financial Summary -->
            <div class="grid grid-cols-12 gap-2.5 mt-2.5 text-xs font-mono">
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
                        ${doc.remark ? `
                            <div><span class="font-bold text-stone-700">หมายเหตุ:</span> ${doc.remark}</div>
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
            <div class="grid grid-cols-2 gap-6 mt-4 pt-3 border-t-2 border-[#1f1d1a] text-xs font-mono">
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
        window.print();
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
