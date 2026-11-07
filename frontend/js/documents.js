/**
 * Documents List & Dynamic Creator Module (รูปแบบทันสมัย เป็นระเบียบ สวยงาม)
 */

window.documentsModule = {
    filters: {
        type: 'all',
        status: 'all',
        service_bill: 'all',
        customer_id: '',
        search: '',
        start_date: '',
        end_date: ''
    },

    formData: {
        items: []
    },

    // ==========================================
    // 1. DOCUMENTS LIST VIEW
    // ==========================================
    async loadList(presetFilters = null) {
        if (presetFilters) {
            this.filters = { ...this.filters, ...presetFilters };
        }

        const container = document.getElementById('documents-content');
        if (!container) return;

        container.innerHTML = `
            <div class="flex items-center justify-center p-16 text-slate-500">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span class="ml-3 text-sm font-medium">กำลังโหลดรายการเอกสาร...</span>
            </div>
        `;

        try {
            const [docsRes, customersRes] = await Promise.all([
                api.getDocuments(this.filters),
                api.getCustomers()
            ]);
            this.renderList(docsRes.data, customersRes.data);
        } catch (err) {
            container.innerHTML = `
                <div class="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
                    <p class="font-bold">เกิดข้อผิดพลาดในการโหลดรายการเอกสาร</p>
                    <p class="text-sm mt-1">${err.message}</p>
                </div>
            `;
        }
    },

    renderList(docs, customers) {
        const container = document.getElementById('documents-content');
        if (!container) return;

        container.innerHTML = `
            <div class="typewriter-card rounded-xl p-6 md:p-8 font-mono bg-white">
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div>
                        <h2 class="text-xl font-bold text-slate-900 font-typewriter flex items-center gap-2">
                            <span>📄</span> รายการเอกสารทั้งหมด
                        </h2>
                        <p class="text-xs text-slate-500 mt-1">ใบเสนอราคา (QT), ใบแจ้งหนี้/วางบิล (INV) และใบเสร็จรับเงิน (RE)</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="app.switchTab('create-doc')" class="btn-ocean text-xs py-2 px-3.5">
                            <span>+ ออกเอกสารใหม่</span>
                        </button>
                    </div>
                </div>

                <!-- Tabs by Type / Status -->
                <div class="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono my-4">
                    <button onclick="window.documentsModule.setFilter('type', 'all', 'status', 'all')" class="px-3 py-1.5 rounded-lg transition ${this.filters.type === 'all' && this.filters.status === 'all' ? 'bg-slate-900 text-white font-bold shadow-xs' : 'text-slate-700 hover:bg-slate-200'}">
                        ทั้งหมด
                    </button>
                    <button onclick="window.documentsModule.setFilter('type', 'quotation', 'status', 'all')" class="px-3 py-1.5 rounded-lg transition ${this.filters.type === 'quotation' ? 'bg-sky-600 text-white font-bold shadow-xs' : 'text-slate-700 hover:bg-slate-200'}">
                        ใบเสนอราคา (QT)
                    </button>
                    <button onclick="window.documentsModule.setFilter('type', 'billing', 'status', 'all')" class="px-3 py-1.5 rounded-lg transition ${this.filters.type === 'billing' && this.filters.status === 'all' ? 'bg-amber-600 text-white font-bold shadow-xs' : 'text-slate-700 hover:bg-slate-200'}">
                        ใบแจ้งหนี้/วางบิล (INV)
                    </button>
                    <button onclick="window.documentsModule.setFilter('type', 'receipt', 'status', 'all')" class="px-3 py-1.5 rounded-lg transition ${this.filters.type === 'receipt' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-700 hover:bg-slate-200'}">
                        ใบเสร็จรับเงิน (RE)
                    </button>
                    <button onclick="window.documentsModule.setFilter('type', 'billing', 'status', 'issued')" class="px-3 py-1.5 rounded-lg transition ${this.filters.type === 'billing' && this.filters.status === 'issued' ? 'bg-amber-700 text-white font-bold shadow-xs' : 'text-amber-800 hover:bg-amber-100'}">
                        ⏳ รอชำระเงิน
                    </button>
                    <button onclick="window.documentsModule.setFilter('type', 'all', 'status', 'cancelled', 'service_bill', 'all')" class="px-3 py-1.5 rounded-lg transition ${this.filters.status === 'cancelled' ? 'bg-rose-700 text-white font-bold shadow-xs' : 'text-rose-800 hover:bg-rose-100'}">
                        🚫 ยกเลิกแล้ว
                    </button>
                    <div class="h-4 w-px bg-slate-300 mx-1 hidden sm:block"></div>
                    <button onclick="window.documentsModule.setFilter('service_bill', window.documentsModule.filters.service_bill === 'service' ? 'all' : 'service')" class="px-3 py-1.5 rounded-lg transition ${this.filters.service_bill === 'service' ? 'bg-amber-600 text-white font-bold shadow-xs' : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300/60'}">
                        🏢 บิลที่ร้านให้บริการ
                    </button>
                </div>

                <!-- Search & Filters Bar -->
                <div class="space-y-3 mb-5 font-mono">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div class="md:col-span-2 relative">
                            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">🔍</span>
                            <input type="text" id="doc-search-input" value="${this.filters.search || ''}" placeholder="ค้นหาเลขที่เอกสาร, ชื่อลูกค้า, โครงการ..." 
                                class="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-sky-500"
                                onkeyup="if(event.key === 'Enter') window.documentsModule.applySearch()">
                        </div>
                        <div>
                            <select id="doc-filter-customer" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-sky-500" onchange="window.documentsModule.applyCustomerFilter(this.value)">
                                <option value="">-- เลือกลูกค้าทั้งหมด --</option>
                                ${customers.map(c => `
                                    <option value="${c.id}" ${this.filters.customer_id == c.id ? 'selected' : ''}>${c.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="window.documentsModule.applySearch()" class="btn-ocean flex-1 text-xs py-2">
                                ค้นหา
                            </button>
                            <button onclick="window.documentsModule.resetFilters()" class="btn-paper text-xs py-2 px-3">
                                ล้างค่า
                            </button>
                        </div>
                    </div>

                    <!-- Date Range Filter Row -->
                    <div class="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
                        <span class="font-bold text-slate-700">ช่วงวันที่:</span>
                        <input type="date" id="doc-filter-start" value="${this.filters.start_date || ''}" class="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-sky-500" onchange="window.documentsModule.applyDateFilter()">
                        <span class="text-slate-400">ถึง</span>
                        <input type="date" id="doc-filter-end" value="${this.filters.end_date || ''}" class="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-sky-500" onchange="window.documentsModule.applyDateFilter()">
                        <button type="button" onclick="window.documentsModule.presetDateRange('this_month')" class="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 transition">
                            เดือนนี้
                        </button>
                        <button type="button" onclick="window.documentsModule.presetDateRange('last_month')" class="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 transition">
                            เดือนที่แล้ว
                        </button>
                    </div>
                </div>

                <!-- Table -->
                <div class="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                    <table class="w-full text-xs text-left min-w-[960px] border-collapse">
                        <thead class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 font-typewriter">
                            <tr>
                                <th class="px-3.5 py-3 whitespace-nowrap w-44">เลขที่ / ประเภท</th>
                                <th class="px-3.5 py-3 min-w-[240px]">ลูกค้าและโครงการ</th>
                                <th class="px-3.5 py-3 whitespace-nowrap w-32">วันที่เอกสาร</th>
                                <th class="px-3.5 py-3 whitespace-nowrap w-32">ครบกำหนด</th>
                                <th class="px-3.5 py-3 whitespace-nowrap w-32 text-right">ยอดรวมสุทธิ</th>
                                <th class="px-3.5 py-3 whitespace-nowrap w-32 text-center">สถานะ</th>
                                <th class="px-3.5 py-3 whitespace-nowrap w-52 text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-stone-200 font-mono">
                            ${docs.length === 0 ? `
                                <tr>
                                    <td colspan="7" class="px-4 py-12 text-center text-stone-400">
                                        <div class="text-3xl mb-2">📄</div>
                                        <p class="font-medium text-stone-600">ไม่พบเอกสารตรงตามเงื่อนไข</p>
                                    </td>
                                </tr>
                            ` : docs.map(d => `
                                <tr class="hover:bg-slate-50 transition">
                                    <td class="px-3.5 py-3 whitespace-nowrap">
                                        <div class="font-bold text-slate-900 font-typewriter text-sm">${d.code}</div>
                                        <div class="mt-1 flex items-center gap-1 flex-wrap">
                                            ${app.getDocTypeBadge(d.type)}
                                            ${d.is_service_bill ? `
                                                <span class="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300" title="บิลที่ร้านให้บริการ (คิดค่าบริการ ${d.service_fee_percent}%)">
                                                    🏢 บริการ (${d.service_fee_percent}%)
                                                </span>
                                            ` : ''}
                                        </div>
                                    </td>
                                    <td class="px-3.5 py-3 min-w-[240px]">
                                        <div class="font-bold text-slate-900 text-xs">${app.escapeHtml ? app.escapeHtml(d.customer_name) : (d.customer_name || '-')}</div>
                                        ${d.project_name_custom || d.project_name ? `
                                            <div class="text-[11px] text-sky-800 font-medium mt-0.5">📌 ${app.escapeHtml ? app.escapeHtml(d.project_name_custom || d.project_name) : (d.project_name_custom || d.project_name)}</div>
                                        ` : ''}
                                    </td>
                                    <td class="px-3.5 py-3 text-xs text-slate-600 whitespace-nowrap">
                                        ${app.formatDateThai(d.issue_date)}
                                    </td>
                                    <td class="px-3.5 py-3 text-xs text-slate-500 whitespace-nowrap">
                                        ${d.due_date ? app.formatDateThai(d.due_date) : '-'}
                                    </td>
                                    <td class="px-3.5 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                                        <div>฿${app.formatCurrency(d.grand_total)}</div>
                                        ${d.is_service_bill ? `
                                            <div class="text-[10px] font-semibold text-emerald-700 mt-0.5" title="รายได้ค่าบริการของร้าน">
                                                +฿${app.formatCurrency(d.service_fee_amount)} (${d.service_fee_percent}%)
                                            </div>
                                            ${d.partner_name ? `
                                                <div class="text-[10px] text-slate-500 font-normal">ผู้ร่วมงาน: ${app.escapeHtml ? app.escapeHtml(d.partner_name) : d.partner_name}</div>
                                            ` : ''}
                                        ` : ''}
                                    </td>
                                    <td class="px-3.5 py-3 text-center whitespace-nowrap">
                                        ${app.getStatusBadge(d.status)}
                                    </td>
                                    <td class="px-3.5 py-3 text-right whitespace-nowrap space-x-1">
                                        <button onclick="window.printModule.openPrint(${d.id})" class="btn-ocean text-xs py-1 px-2.5" title="ดูเอกสารและสั่งพิมพ์ A4">
                                            🖨️ พิมพ์
                                        </button>
                                        <button onclick="window.documentsModule.shareToLine(${d.id})" class="btn-line text-xs py-1 px-2" title="แชร์สรุปบิลเข้า LINE">
                                            💬 LINE
                                        </button>
                                        ${d.type === 'billing' && d.status === 'issued' ? `
                                            <button onclick="window.documentsModule.sendReminderLine(${d.id})" class="btn-paper text-xs py-1 px-2 text-amber-900 border-amber-300 bg-amber-50 hover:bg-amber-100" title="ส่งข้อความเตือนชำระเงินเข้า LINE">
                                                🔔 เตือน
                                            </button>
                                        ` : ''}
                                        ${d.status !== 'cancelled' ? `
                                            ${d.status !== 'paid' ? `
                                                <button onclick="window.documentsModule.loadEditForm(${d.id})" class="btn-paper text-xs py-1 px-2 text-sky-800 border-sky-300 hover:bg-sky-50" title="แก้ไขเอกสาร">
                                                    ✏️ แก้ไข
                                                </button>
                                            ` : ''}
                                            <button onclick="window.documentsModule.openConvertModal(${d.id}, '${d.type}', '${d.code}', '${d.issue_date || ''}')" class="btn-paper text-xs py-1 px-2" title="แปลงเป็นเอกสารขั้นถัดไป">
                                                🔄 แปลง
                                            </button>
                                            ${d.type === 'receipt' ? `
                                                ${d.status !== 'paid' ? `
                                                    <button onclick="window.documentsModule.markPaid(${d.id}, '${d.status}')" class="btn-paper text-xs py-1 px-2 text-emerald-800 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 font-bold" title="บันทึกว่าได้รับเงินแล้ว (ชำระแล้ว)">
                                                        ✓ ชำระแล้ว
                                                    </button>
                                                ` : `
                                                    <button onclick="window.documentsModule.markPaid(${d.id}, '${d.status}')" class="btn-paper text-xs py-1 px-1.5 text-slate-500 border-slate-300 bg-slate-50 hover:bg-slate-100" title="คลิกเพื่อยกเลิกสถานะชำระเงิน (เปลี่ยนกลับเป็นยังไม่ได้รับเงิน)">
                                                        ↩ คืนสถานะ
                                                    </button>
                                                `}
                                            ` : ''}
                                            <button onclick="window.documentsModule.duplicate(${d.id})" class="btn-paper text-xs py-1 px-2" title="คัดลอกสร้างฉบับใหม่">
                                                📋
                                            </button>
                                            <button onclick="window.documentsModule.openCancelModal(${d.id}, '${d.code}')" class="btn-paper text-xs py-1 px-2 text-rose-700 border-rose-300 hover:bg-rose-50" title="ยกเลิกเอกสารนี้">
                                                🚫
                                            </button>
                                        ` : `
                                            <span class="text-xs text-rose-600 font-bold">ยกเลิกแล้ว</span>
                                        `}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    setFilter(...args) {
        for (let i = 0; i < args.length; i += 2) {
            if (args[i]) this.filters[args[i]] = args[i + 1];
        }
        this.loadList();
    },

    applySearch() {
        const input = document.getElementById('doc-search-input');
        if (input) this.filters.search = input.value.trim();
        this.loadList();
    },

    applyCustomerFilter(customerId) {
        this.filters.customer_id = customerId;
        this.loadList();
    },

    applyDateFilter() {
        const start = document.getElementById('doc-filter-start')?.value || '';
        const end = document.getElementById('doc-filter-end')?.value || '';
        this.filters.start_date = start;
        this.filters.end_date = end;
        this.loadList();
    },

    presetDateRange(type) {
        const now = new Date();
        const y = now.getFullYear();
        if (type === 'this_month') {
            const m = String(now.getMonth() + 1).padStart(2, '0');
            this.filters.start_date = `${y}-${m}-01`;
            this.filters.end_date = `${y}-${m}-31`;
        } else if (type === 'last_month') {
            const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const ly = lastM.getFullYear();
            const lm = String(lastM.getMonth() + 1).padStart(2, '0');
            this.filters.start_date = `${ly}-${lm}-01`;
            this.filters.end_date = `${ly}-${lm}-31`;
        }
        this.loadList();
    },

    async sendReminderLine(docId) {
        try {
            app.toast('กำลังเตรียมข้อความแจ้งเตือนชำระเงิน...', 'info');
            const res = await api.getDocument(docId);
            const doc = res.data;
            const company = doc.company || {};
            const bank = (company.bank_accounts && company.bank_accounts[0]) ? company.bank_accounts[0] : null;

            const titles = { quotation: 'ใบเสนอราคา', billing: 'ใบแจ้งหนี้/วางบิล', receipt: 'ใบเสร็จรับเงิน' };
            const typeLabel = titles[doc.type] || 'เอกสารธุรกิจ';
            const host = window.location.origin;
            const keyParam = doc.share_key ? `?k=${doc.share_key}` : '';
            const shareUrl = `${host}/share/${doc.code}${keyParam}`;

            let msg = `🔔 [แจ้งเตือนยอดครบกำหนดชำระ] ${company.name || 'ร้านเคอีควิป'}\n`;
            msg += `📄 [${typeLabel}] เลขที่: ${doc.code}\n`;
            msg += `ลูกค้า: ${doc.customer_name || 'ลูกค้าผู้มีอุปการคุณ'}\n`;
            msg += `ยอดเงิน: ฿${app.formatCurrency(doc.grand_total)} บาท\n`;
            if (bank) {
                msg += `ธนาคาร: ${bank.bank} (${bank.account_no})\n`;
            }
            msg += `\n👉 เปิดดูเอกสารฉบับเต็ม & โหลด PDF:\n${shareUrl}\n\nขอบพระคุณที่ไว้วางใจในบริการของเราครับ 🙏`;

            // Auto copy to clipboard
            try {
                await navigator.clipboard.writeText(msg);
            } catch (err) {}

            let lineShareText = `🔔 [แจ้งเตือนยอดครบกำหนดชำระ] ${company.name || 'ร้านเคอีควิป'}\n`;
            lineShareText += `📄 [${typeLabel}] เลขที่: ${doc.code}\n`;
            lineShareText += `ลูกค้า: ${doc.customer_name || 'ลูกค้าผู้มีอุปการคุณ'}\n`;
            lineShareText += `ยอดเงิน: ฿${app.formatCurrency(doc.grand_total)} บาท\n`;
            if (bank) {
                lineShareText += `ธนาคาร: ${bank.bank} (${bank.account_no})\n`;
            }
            lineShareText += `\nขอบพระคุณที่ไว้วางใจในบริการของเราครับ 🙏\n`;
            lineShareText += `👉 เปิดดูเอกสารฉบับเต็ม & โหลด PDF:`;

            const shareEndpoint = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(lineShareText)}`;
            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            if (isMobile) {
                window.location.href = shareEndpoint;
            } else {
                const w = 550;
                const h = 650;
                const left = Math.max(0, (window.screen.width / 2) - (w / 2));
                const top = Math.max(0, (window.screen.height / 2) - (h / 2));
                window.open(shareEndpoint, 'LineSharePopup', `width=${w},height=${h},top=${top},left=${left},scrollbars=yes,resizable=yes`);
            }
            app.toast('เปิดหน้าต่างส่ง LINE เรียบร้อย! (และคัดลอกข้อความสรุปพร้อมลิงก์ไว้ให้แล้ว สามารถกด Ctrl+V ในแชตได้ทันที) 📋💬', 'success');
        } catch (e) {
            app.toast('เกิดข้อผิดพลาด: ' + e.message, 'error');
        }
    },

    loadEditForm(id) {
        app.switchTab('create-doc', { edit_id: id });
    },

    resetFilters() {
        this.filters = {
            type: 'all',
            status: 'all',
            service_bill: 'all',
            customer_id: '',
            search: '',
            start_date: '',
            end_date: ''
        };
        this.loadList();
    },

    // ==========================================
    // 2. DOCUMENT CREATOR / FORM
    // ==========================================
    async loadCreateForm(options = {}) {
        options = options || {};
        const container = document.getElementById('create-doc-content');
        if (!container) return;

        const defaultType = options.type || 'quotation';
        const defaultDate = new Date().toISOString().slice(0, 10);

        container.innerHTML = `
            <div class="flex items-center justify-center p-16 text-slate-500">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                <span class="ml-3 text-sm font-medium">กำลังเตรียมแบบฟอร์ม...</span>
            </div>
        `;

        try {
            // Mode A: Edit existing document
            if (options.edit_id) {
                const [docRes, customersRes] = await Promise.all([
                    api.getDocument(options.edit_id),
                    api.getCustomers()
                ]);
                const doc = (docRes && docRes.data) || {};
                const customers = (customersRes && customersRes.data) || [];

                this.formData.items = (doc.items || []).map(it => {
                    const parts = (it.product_name || '').split('\n');
                    const pName = parts[0] || '';
                    const desc = parts.slice(1).join('\n');
                    return {
                        product_name: pName,
                        description: desc,
                        show_description: Boolean(desc),
                        image_url: it.image_url || '',
                        quantity: Math.max(1, Math.round(Number(it.quantity) || 1)),
                        unit: it.unit || 'ชิ้น',
                        unit_price: it.unit_price || 0,
                        discount: it.discount || 0,
                        discount_type: it.discount_type || 'amount',
                        total_price: it.total_price || 0
                    };
                });

                const rawRemark = doc.remark || '';
                const isUndated = rawRemark.includes('[ไม่ลงวันที่]');
                const serviceInfo = this.parseServiceBill(doc);
                const cleanRemark = serviceInfo.clean_remark.replace(/\[ไม่ลงวันที่\]/g, '').trim();

                this.renderCreateForm({
                    isEdit: true,
                    docId: doc.id,
                    docCode: doc.code,
                    docStatus: doc.status,
                    type: doc.type,
                    issue_date: doc.issue_date,
                    due_date: doc.due_date,
                    customers,
                    nextCodePreview: doc.code,
                    availableReservations: [],
                    selectedCustomerId: doc.customer_id,
                    selectedProjectId: doc.project_id,
                    projectNameCustom: doc.project_name_custom,
                    discountTotal: doc.discount_total,
                    paymentTerms: doc.payment_terms,
                    remark: cleanRemark,
                    isUndated,
                    isServiceBill: serviceInfo.is_service_bill,
                    serviceFeePercent: serviceInfo.service_fee_percent,
                    partnerName: serviceInfo.partner_name,
                    useReservedCode: null
                });
                return;
            }

            // Mode B: Create new document
            const [customersRes, nextCodeRes, reservationsRes] = await Promise.all([
                api.getCustomers(),
                api.getNextCode(defaultType, defaultDate),
                api.getReservations(defaultType, 'reserved')
            ]);

            const customers = (customersRes && customersRes.data) || [];
            const nextCodePreview = (nextCodeRes && nextCodeRes.data && nextCodeRes.data.code) || '';
            const availableReservations = this.sortReservationsByDate((reservationsRes && reservationsRes.data) || []);

            // Initialize default items (3 empty item rows ready for quick entry)
            this.formData.items = [
                { product_name: '', image_url: '', quantity: 1, unit: 'ชิ้น', unit_price: 0, discount: 0, discount_type: 'amount', total_price: 0 },
                { product_name: '', image_url: '', quantity: 1, unit: 'ชิ้น', unit_price: 0, discount: 0, discount_type: 'amount', total_price: 0 },
                { product_name: '', image_url: '', quantity: 1, unit: 'ชิ้น', unit_price: 0, discount: 0, discount_type: 'amount', total_price: 0 }
            ];

            this.renderCreateForm({
                isEdit: false,
                type: defaultType,
                issue_date: defaultDate,
                customers,
                nextCodePreview,
                availableReservations,
                selectedCustomerId: options.customer_id || null,
                selectedProjectId: options.project_id || null,
                isServiceBill: false,
                serviceFeePercent: 20,
                partnerName: '',
                useReservedCode: options.useReservedCode || null
            });
        } catch (err) {
            container.innerHTML = `
                <div class="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
                    <p class="font-bold">เกิดข้อผิดพลาดในการโหลดแบบฟอร์ม</p>
                    <p class="text-sm mt-1">${err.message}</p>
                </div>
            `;
        }
    },

    renderCreateForm(ctx) {
        const container = document.getElementById('create-doc-content');
        if (!container) return;

        const {
            isEdit, docId, docCode, docStatus,
            type, issue_date, due_date, customers, nextCodePreview,
            availableReservations, selectedCustomerId, selectedProjectId, projectNameCustom,
            discountTotal, paymentTerms, remark, isUndated, useReservedCode,
            isServiceBill = false, serviceFeePercent = 20, partnerName = ''
        } = ctx;

        container.innerHTML = `
            <div class="max-w-5xl mx-auto typewriter-card rounded-xl p-6 md:p-8 font-mono bg-white">
                <!-- Form Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div>
                        <span class="text-xs font-bold text-sky-700 uppercase tracking-wider font-mono">
                            ${isEdit ? `โหมดแก้ไขข้อมูลเอกสาร • สถานะ: ${app.getStatusBadge(docStatus)}` : 'ระบบจัดการเอกสาร (ใบเสนอราคา • ใบแจ้งหนี้ • ใบเสร็จรับเงิน)'}
                        </span>
                        <h2 class="text-2xl font-bold text-slate-900 font-typewriter mt-1" id="form-doc-title">
                            ${isEdit ? `✏️ แก้ไขเอกสาร: ${docCode}` : '✍️ ออกเอกสารใหม่'}
                        </h2>
                    </div>
                    <div class="flex items-center gap-2">
                        <button type="button" onclick="app.switchTab('documents')" class="btn-paper text-xs py-1.5 px-3">
                            ✕ ยกเลิก
                        </button>
                    </div>
                </div>

                <form id="doc-create-form" onsubmit="event.preventDefault(); window.documentsModule.submitDocument();" class="mt-6 space-y-6">
                    ${isEdit ? `<input type="hidden" id="doc-edit-id" value="${docId}">` : ''}

                    <!-- Section 1: Document Type & Numbering Setup -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-5 p-5 bg-slate-50/80 rounded-xl border border-slate-200">
                        <!-- Doc Type -->
                        <div>
                            <label class="block text-xs font-bold text-slate-800 mb-1.5 font-typewriter">
                                ประเภทเอกสาร <span class="text-rose-600">*</span>
                            </label>
                            <select id="doc-type-select" name="type" ${isEdit ? 'disabled' : ''} class="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-sky-500 ${isEdit ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''}" onchange="window.documentsModule.onDocTypeChanged(this.value)">
                                <option value="quotation" ${type === 'quotation' ? 'selected' : ''}>ใบเสนอราคา (Quotation / QT)</option>
                                <option value="billing" ${type === 'billing' ? 'selected' : ''}>ใบแจ้งหนี้ / วางบิล (Invoice / INV)</option>
                                <option value="receipt" ${type === 'receipt' ? 'selected' : ''}>ใบเสร็จรับเงิน (Receipt / RE)</option>
                            </select>
                            ${isEdit ? `<input type="hidden" name="type" value="${type}">` : ''}
                        </div>

                        <!-- Code Assignment Mode (Auto / Reserved for Backdating / Custom) -->
                        <div class="md:col-span-2">
                            <label class="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                                <span>เลขที่เอกสาร <span class="text-rose-500">*</span></span>
                                <span class="text-[11px] text-sky-700 font-medium">
                                    ${isEdit ? 'เลขที่เอกสารถูกล็อกตามเดิม' : 'มีเลขสำรองพร้อมใช้ออกย้อนหลัง'}
                                </span>
                            </label>

                            ${isEdit ? `
                                <div class="px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-lg font-mono font-bold text-slate-800 text-sm flex items-center justify-between">
                                    <span>${docCode}</span>
                                    <span class="text-[11px] font-normal text-slate-500">🔒 ล็อกเลขเดิมไว้ ไม่สามารถเปลี่ยนเลขขณะแก้ไข</span>
                                </div>
                                <input type="hidden" name="code_mode" value="auto">
                            ` : `
                                <div class="space-y-2">
                                    <div class="flex items-center gap-3 text-xs flex-wrap">
                                        <label class="inline-flex items-center gap-1.5 cursor-pointer">
                                            <input type="radio" name="code_mode" value="auto" ${!useReservedCode ? 'checked' : ''} onchange="window.documentsModule.toggleCodeMode('auto')" class="text-sky-600">
                                            <span class="font-medium text-slate-700">รันเลขอัตโนมัติ (ปัจจุบัน)</span>
                                        </label>
                                        <label class="inline-flex items-center gap-1.5 cursor-pointer">
                                            <input type="radio" name="code_mode" value="reserved" ${useReservedCode ? 'checked' : ''} onchange="window.documentsModule.toggleCodeMode('reserved')" class="text-purple-600">
                                            <span class="font-semibold text-purple-700">ใช้เลขสำรอง (สำหรับออกบิลย้อนหลัง)</span>
                                        </label>
                                        <label class="inline-flex items-center gap-1.5 cursor-pointer">
                                            <input type="radio" name="code_mode" value="future" onchange="window.documentsModule.toggleCodeMode('future')" class="text-emerald-600">
                                            <span class="font-semibold text-emerald-700">📅 ระบุวันออกเอกสาร (ย้อนหลัง / ล่วงหน้า พร้อมคำนวณ 3 บิล)</span>
                                        </label>
                                    </div>

                                    <!-- Container for Auto Code Display -->
                                    <div id="code-auto-container" class="${useReservedCode ? 'hidden' : ''}">
                                        <div class="flex items-center gap-2">
                                            <input type="text" id="auto-code-preview" value="${nextCodePreview}" readonly class="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-700">
                                            <span class="text-[11px] text-slate-400 whitespace-nowrap">ระบบจะล็อกเลขนี้ตอนกดบันทึก</span>
                                        </div>
                                    </div>

                                    <!-- Container for Reserved Code Dropdown -->
                                    <div id="code-reserved-container" class="${useReservedCode ? '' : 'hidden'}">
                                        <select id="reserved-code-select" onchange="window.documentsModule.onReservedCodeSelected(this.value)" class="w-full px-3 py-2 bg-purple-50 border border-purple-200 text-purple-950 font-mono font-bold text-sm rounded-lg focus:outline-none">
                                            ${availableReservations.length === 0 ? `
                                                <option value="">-- ไม่มีเลขสำรองในคลัง (ไปที่แท็บ 'คลังเลขสำรอง' เพื่อกดเพิ่มเลข) --</option>
                                            ` : availableReservations.map(r => `
                                                <option value="${r.code}" data-note="${app.escapeHtml ? app.escapeHtml(r.note || '') : (r.note || '')}" ${useReservedCode === r.code ? 'selected' : ''}>
                                                    ${r.code} ${r.note ? `— [${r.note}]` : ''}
                                                </option>
                                            `).join('')}
                                        </select>
                                    </div>

                                    <!-- Container for Date-Specific Code Generation (Backdating & Future) -->
                                    <div id="code-future-container" class="hidden space-y-2.5 p-3.5 bg-emerald-50/80 border border-emerald-300 rounded-xl">
                                        <div class="flex flex-wrap items-center justify-between gap-2">
                                            <label class="text-xs font-bold text-emerald-950 flex items-center gap-1">
                                                <span>📅 เลือกวัน/เดือน/ปี ที่ต้องการออกเอกสาร (ย้อนหลัง หรือ ล่วงหน้า):</span>
                                            </label>
                                            <div class="flex items-center gap-1 flex-wrap">
                                                <span class="text-[10px] text-purple-800 font-bold mr-0.5">ย้อนหลัง:</span>
                                                <button type="button" onclick="window.documentsModule.setFutureOffset(-30)" class="text-[10px] px-1.5 py-0.5 bg-white border border-purple-300 rounded text-purple-800 hover:bg-purple-100 font-medium">-30 วัน</button>
                                                <button type="button" onclick="window.documentsModule.setFutureOffset(-7)" class="text-[10px] px-1.5 py-0.5 bg-white border border-purple-300 rounded text-purple-800 hover:bg-purple-100 font-medium">-7 วัน</button>
                                                <button type="button" onclick="window.documentsModule.setFutureOffset(-1)" class="text-[10px] px-1.5 py-0.5 bg-white border border-purple-300 rounded text-purple-800 hover:bg-purple-100 font-medium">เมื่อวาน</button>
                                                <button type="button" onclick="window.documentsModule.setFutureOffset(0)" class="text-[10px] px-1.5 py-0.5 bg-white border border-sky-300 rounded text-sky-800 hover:bg-sky-100 font-bold">วันนี้</button>
                                                <span class="text-[10px] text-emerald-800 font-bold mx-0.5">ล่วงหน้า:</span>
                                                <button type="button" onclick="window.documentsModule.setFutureOffset(7)" class="text-[10px] px-1.5 py-0.5 bg-white border border-emerald-300 rounded text-emerald-800 hover:bg-emerald-100 font-medium">+7 วัน</button>
                                                <button type="button" onclick="window.documentsModule.setFutureOffset(15)" class="text-[10px] px-1.5 py-0.5 bg-white border border-emerald-300 rounded text-emerald-800 hover:bg-emerald-100 font-medium">+15 วัน</button>
                                                <button type="button" onclick="window.documentsModule.setFutureOffset(30)" class="text-[10px] px-1.5 py-0.5 bg-white border border-emerald-300 rounded text-emerald-800 hover:bg-emerald-100 font-medium">+30 วัน</button>
                                                <button type="button" onclick="window.documentsModule.setFutureNextMonth()" class="text-[10px] px-1.5 py-0.5 bg-white border border-emerald-300 rounded text-emerald-800 hover:bg-emerald-100 font-bold">เดือนหน้า</button>
                                            </div>
                                        </div>

                                        <input type="date" id="future-date-picker" class="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg text-emerald-950 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20" onchange="window.documentsModule.onFutureDatePicked(this.value)">

                                        <!-- Live Calculated Codes for ALL 3 types (QT, INV, RE) for the chosen date -->
                                        <div>
                                            <div class="flex items-center justify-between text-[11px] text-emerald-900 font-bold mb-1.5">
                                                <span>⚡ เลขที่ระบบคำนวณให้ทั้ง 3 ประเภท (สำหรับวันที่ระบุ):</span>
                                                <span class="text-[10px] text-emerald-700 font-normal">(คลิกการ์ดเพื่อสลับประเภทเอกสาร)</span>
                                            </div>
                                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                <!-- QT Card -->
                                                <div id="card-future-qt" onclick="window.documentsModule.selectFutureType('quotation')" class="cursor-pointer p-2.5 bg-white rounded-lg border-2 border-emerald-500 shadow-xs transition hover:shadow-md">
                                                    <div class="flex items-center justify-between text-[11px] font-bold">
                                                        <span class="text-sky-900">📄 ใบเสนอราคา (QT)</span>
                                                        <span id="badge-active-qt" class="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-sans">กำลังใช้</span>
                                                    </div>
                                                    <div id="future-code-qt" class="text-sm font-bold font-mono text-sky-700 mt-1">กำลังคำนวณ...</div>
                                                </div>

                                                <!-- INV Card -->
                                                <div id="card-future-inv" onclick="window.documentsModule.selectFutureType('billing')" class="cursor-pointer p-2.5 bg-white rounded-lg border-2 border-slate-200 shadow-xs transition hover:border-emerald-400 hover:shadow-md">
                                                    <div class="flex items-center justify-between text-[11px] font-bold">
                                                        <span class="text-amber-900">📑 ใบแจ้งหนี้ (INV)</span>
                                                        <span id="badge-active-inv" class="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-sans hidden">กำลังใช้</span>
                                                    </div>
                                                    <div id="future-code-inv" class="text-sm font-bold font-mono text-amber-700 mt-1">กำลังคำนวณ...</div>
                                                </div>

                                                <!-- RE Card -->
                                                <div id="card-future-re" onclick="window.documentsModule.selectFutureType('receipt')" class="cursor-pointer p-2.5 bg-white rounded-lg border-2 border-slate-200 shadow-xs transition hover:border-emerald-400 hover:shadow-md">
                                                    <div class="flex items-center justify-between text-[11px] font-bold">
                                                        <span class="text-emerald-900">🧾 ใบเสร็จรับเงิน (RE)</span>
                                                        <span id="badge-active-re" class="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-sans hidden">กำลังใช้</span>
                                                    </div>
                                                    <div id="future-code-re" class="text-sm font-bold font-mono text-emerald-700 mt-1">กำลังคำนวณ...</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="flex flex-wrap items-center justify-between pt-1 gap-2 text-[11px] text-emerald-800">
                                            <span class="flex items-center gap-1 font-mono">
                                                <span>💡 เลขที่เลือก:</span>
                                                <b id="future-selected-display" class="font-bold underline text-emerald-950">-</b>
                                            </span>
                                            <button type="button" onclick="window.documentsModule.reserveAllFutureCodes()" class="text-[11px] font-bold text-emerald-900 hover:underline bg-white px-2 py-0.5 rounded border border-emerald-300 shadow-xs inline-flex items-center gap-1">
                                                <span>📥 กันเลขทั้ง 3 นี้เข้าคลังสำรอง (สำหรับวันที่ระบุ)</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- Section 2: Project, Customer & Dates -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <!-- Project / Billing Title (โครงการ / หัวบิล) -->
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                                <span>โครงการ / หัวบิล <span class="text-[10px] text-slate-400 font-normal">งาน / สถานที่</span></span>
                                <button type="button" id="btn-add-project-shortcut" onclick="window.customersModule.openProjectsModal(document.getElementById('doc-customer-select')?.value || window.documentsModule.state?.selectedCustomerId)" class="text-[11px] text-blue-600 font-semibold hover:underline">
                                    + เพิ่มโครงการ
                                </button>
                            </label>
                            <select id="doc-project-select" name="project_id" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none" onchange="window.documentsModule.onProjectSelected(this.value)">
                                <option value="">-- ไม่ระบุโครงการ / หัวบิลย่อย --</option>
                            </select>
                            <div class="mt-2">
                                <input type="text" id="project-name-custom" name="project_name_custom" value="${projectNameCustom || ''}" placeholder="หรือพิมพ์ระบุชื่อหัวบิล/โครงการที่นี่..." class="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:border-sky-500">
                            </div>
                        </div>

                        <!-- Customer Dropdown (ชื่อลูกค้า / ผู้ติดต่อ) -->
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                                <span>ชื่อลูกค้า / ผู้ติดต่อ <span class="text-rose-500">*</span></span>
                                <button type="button" onclick="window.customersModule.openCustomerModal()" class="text-[11px] text-blue-600 font-semibold hover:underline">
                                    + เพิ่มลูกค้าใหม่
                                </button>
                            </label>
                            <select id="doc-customer-select" name="customer_id" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none" onchange="window.documentsModule.onCustomerSelected(this.value)">
                                <option value="">-- เลือกลูกค้า (ชื่อคนค้นหาง่าย) --</option>
                                ${customers.map(c => `
                                    <option value="${c.id}" ${selectedCustomerId == c.id ? 'selected' : ''}>${c.name}</option>
                                `).join('')}
                            </select>

                            <!-- Customer info snippet -->
                            <div id="customer-info-box" class="mt-2 text-xs text-slate-500 p-3 bg-slate-50 rounded-lg border border-slate-200 hidden">
                                <div id="c-box-tax" class="font-mono text-[11px]"></div>
                                <div id="c-box-address" class="mt-0.5"></div>
                            </div>
                        </div>

                        <!-- Issue Date (รองรับลงย้อนหลัง & ออกบิลไม่ลงวันที่) -->
                        <div>
                            <div class="flex items-center justify-between mb-1.5">
                                <label class="block text-xs font-bold text-slate-700">
                                    วันที่ออกเอกสาร <span class="text-rose-500">*</span>
                                </label>
                                <label class="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-sky-700 font-medium select-none hover:text-sky-900" title="พิมพ์วันที่บนบิลเป็น ..... / ..... / ..........">
                                    <input type="checkbox" id="doc-is-undated" ${isUndated ? 'checked' : ''} onchange="window.documentsModule.toggleUndated(this.checked)" class="rounded border-slate-300 text-sky-600 focus:ring-sky-500">
                                    <span>ออกบิลไม่ลงวันที่ (เว้นว่าง)</span>
                                </label>
                            </div>
                            <input type="date" id="doc-issue-date" name="issue_date" value="${issue_date}" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none ${isUndated ? 'opacity-50' : ''}" onchange="window.documentsModule.onDateChanged(this.value)">
                            <div id="undated-helper" class="text-[11px] text-amber-700 mt-1 font-mono ${isUndated ? '' : 'hidden'}">
                                ℹ️ บนบิลจริงจะแสดงเป็น: <span class="font-bold">..... / ..... / ..........</span> (สามารถประทับตรายางหรือลงวันที่ภายหลังได้)
                            </div>
                        </div>

                        <!-- Due Date -->
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1.5">
                                วันที่ครบกำหนด / มีผลถึงวันที่
                            </label>
                            <input type="date" id="doc-due-date" name="due_date" value="${due_date || ''}" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none">
                        </div>
                    </div>

                    <!-- Section 3: Dynamic Items Table -->
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <h3 class="text-sm font-bold text-slate-800 font-heading">รายการสินค้า / บริการ</h3>
                                <p class="text-xs text-slate-400">ระบุจำนวน หน่วย และราคาต่อหน่วย (ระบบคำนวณอัตโนมัติ)</p>
                            </div>
                            <div class="flex items-center gap-2">
                                <button type="button" onclick="window.documentsModule.addNoteRow()" class="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold rounded-lg transition" title="เพิ่มบรรทัดข้อความ เช่น *แถมฟรีเมาส์ Bluetooth, Warranty 3 years">
                                    ★ + ของแถม / บริการ / ประกัน (*)
                                </button>
                                <button type="button" onclick="window.documentsModule.addItemRow()" class="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-xs font-semibold rounded-lg transition">
                                    + เพิ่มแถวรายการ
                                </button>
                            </div>
                        </div>

                        <div class="overflow-x-auto border border-slate-200 rounded-xl">
                            <table class="w-full text-xs text-left">
                                <thead class="bg-slate-50 text-slate-700 uppercase border-b border-slate-200 font-semibold">
                                    <tr>
                                        <th class="px-3 py-3 w-12 text-center">ลำดับ</th>
                                        <th class="px-3 py-3">รูปภาพ & รายการสินค้า / รายละเอียดงาน</th>
                                        <th class="px-3 py-3 w-24 text-right">จำนวน</th>
                                        <th class="px-3 py-3 w-24">หน่วยนับ</th>
                                        <th class="px-3 py-3 w-28 text-right">ราคา/หน่วย</th>
                                        <th class="px-3 py-3 w-24 text-right">ส่วนลด</th>
                                        <th class="px-3 py-3 w-32 text-right">จำนวนเงิน</th>
                                        <th class="px-3 py-3 w-10 text-center">ลบ</th>
                                    </tr>
                                </thead>
                                <tbody id="doc-items-tbody" class="divide-y divide-slate-100">
                                    <!-- Dynamic rows rendered here -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Section 4: Summary & Remarks -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                        <!-- Left: Remarks & Payment Terms -->
                        <div class="space-y-4">
                            <div>
                                <div class="flex items-center justify-between mb-1.5">
                                    <label class="text-xs font-bold text-slate-700">เงื่อนไขการชำระเงิน</label>
                                    <div class="flex gap-1">
                                        <button type="button" onclick="window.documentsModule.insertPreset('terms', 'เครดิต 30 วัน')" class="text-[11px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-600 transition">+ เครดิต 30 วัน</button>
                                        <button type="button" onclick="window.documentsModule.insertPreset('terms', 'มัดจำ 50% ก่อนเริ่มงาน')" class="text-[11px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-600 transition">+ มัดจำ 50%</button>
                                    </div>
                                </div>
                                <textarea id="doc-payment-terms" rows="2" class="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none text-slate-700">${paymentTerms !== undefined ? paymentTerms : (app.state.company ? app.state.company.default_terms || '' : '')}</textarea>
                            </div>

                            <div>
                                <div class="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                                    <label class="text-xs font-bold text-slate-700">หมายเหตุท้ายเอกสาร</label>
                                    <div class="flex items-center gap-1.5 flex-wrap">
                                        <button type="button" onclick="window.documentsModule.insertPreset('remark', 'ราคาสินค้าและบริการเป็นราคาสุทธิ')" class="text-[11px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-700 border border-slate-300 transition font-medium" title="เพิ่มข้อความราคาสุทธิ">+ ราคาสุทธิ</button>
                                        <button type="button" onclick="window.documentsModule.insertPreset('remark', 'ยืนราคา 30 วัน ส่งของภายใน 30 วัน หลังได้รับใบสั่งซื้อ')" class="text-[11px] bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded text-sky-800 border border-sky-300 transition font-medium" title="เพิ่มเงื่อนไขยืนราคาและส่งของ">+ ยืนราคา</button>
                                        <button type="button" onclick="window.documentsModule.insertPreset('remark', 'รับประกันสินค้า 1 ปี')" class="text-[11px] bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded text-emerald-800 border border-emerald-300 transition font-medium" title="เพิ่มเงื่อนไขการรับประกัน">+ รับประกัน</button>
                                    </div>
                                </div>
                                <textarea id="doc-remark" rows="2" class="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none text-slate-700">${remark !== undefined ? remark : (app.state.company ? app.state.company.default_remark || '' : '')}</textarea>
                            </div>
                        </div>

                        <!-- Right: Totals Box (No VAT) -->
                        <div class="bg-slate-50/90 p-5 rounded-2xl border border-slate-200 space-y-3">
                            <div class="flex items-center justify-between text-xs text-slate-600">
                                <span>รวมเป็นเงิน (Subtotal):</span>
                                <span class="font-bold text-slate-800 text-sm" id="calc-subtotal">฿0.00</span>
                            </div>

                            <div class="flex items-center justify-between text-xs text-slate-600">
                                <span>ส่วนลดท้ายบิล:</span>
                                <div class="flex items-center gap-1 w-36">
                                    <span class="text-slate-400">฿</span>
                                    <input type="number" id="doc-discount-total" value="${discountTotal || 0}" min="0" step="0.01" class="w-full px-2 py-1 text-right text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500" oninput="window.documentsModule.recalculate()">
                                </div>
                            </div>

                            <div class="flex items-center justify-between text-sm font-bold text-slate-900 pt-3 border-t border-slate-200">
                                <span class="text-base font-heading">ยอดเงินรวมสุทธิ (Grand Total):</span>
                                <span class="text-xl text-sky-800 font-heading font-bold" id="calc-grand-total">฿0.00</span>
                            </div>

                            <!-- Live Thai Baht Text -->
                            <div class="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs">
                                <span class="text-sky-800 font-bold">จำนวนเงินเป็นตัวอักษร:</span>
                                <div class="font-semibold text-sky-950 mt-0.5" id="calc-thai-baht">ศูนย์บาทถ้วน</div>
                            </div>
                        </div>
                    </div>

                    <!-- บิลที่ร้านให้บริการ (ระบบบัญชีภายใน / คิดเปอร์เซ็นต์ค่าบริการ) -->
                    <div class="p-4 rounded-xl border ${isServiceBill ? 'border-amber-300 bg-amber-50/70 shadow-xs' : 'border-slate-200 bg-slate-50/60'} transition">
                        <div class="flex items-center justify-between flex-wrap gap-2">
                            <label class="flex items-center gap-2.5 cursor-pointer select-none">
                                <input type="checkbox" id="doc-is-service-bill" ${isServiceBill ? 'checked' : ''} class="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer" onchange="window.documentsModule.toggleServiceBillFields()">
                                <span class="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-heading">
                                    <span>🏢</span> บิลที่ร้านให้บริการ
                                </span>
                            </label>
                            <span class="text-[11px] text-slate-500 font-sans">
                                (คำนวณส่วนแบ่งค่าบริการ / สำหรับลงบัญชีภายใน ไม่แสดงบนบิลลูกค้า)
                            </span>
                        </div>

                        <!-- Expandable options -->
                        <div id="service-bill-fields" class="mt-3 pt-3 border-t border-amber-200/80 space-y-3 ${isServiceBill ? '' : 'hidden'}">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs font-semibold text-slate-700 mb-1">
                                        อัตราค่าบริการของร้าน (%):
                                    </label>
                                    <div class="flex items-center gap-1.5">
                                        <input type="number" id="doc-service-fee-percent" value="${serviceFeePercent !== undefined && serviceFeePercent !== null ? serviceFeePercent : 20}" min="0" max="100" step="0.1" class="w-28 px-3 py-1.5 text-sm bg-white border border-amber-300 rounded-lg font-bold text-amber-900 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-right" oninput="window.documentsModule.recalculateServiceFee()">
                                        <span class="text-xs font-bold text-amber-800">%</span>
                                        <span class="text-[11px] text-slate-500 ml-1">(ระบุเปอร์เซ็นต์ที่ร้านคิด)</span>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-700 mb-1">
                                        ชื่อผู้ประสานงาน / พันธมิตร (ถ้ามี):
                                    </label>
                                    <input type="text" id="doc-partner-name" value="${app.escapeHtml ? app.escapeHtml(partnerName || '') : (partnerName || '')}" placeholder="เช่น ช่างเอก, ผู้ว่าจ้างภายนอก" class="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800">
                                </div>
                            </div>

                            <!-- Realtime calculations -->
                            <div class="bg-white p-3.5 rounded-xl border border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                    <span class="text-slate-500 block text-[11px]">ยอดรวมสุทธิหน้าบิล:</span>
                                    <span class="font-bold text-slate-800 text-sm mt-0.5 block" id="service-calc-grand-total">฿0.00</span>
                                </div>
                                <div class="p-2.5 bg-emerald-50/80 rounded-lg border border-emerald-200">
                                    <span class="text-emerald-800 font-medium block text-[11px]">🟢 รายได้ค่าบริการของร้าน (<span id="service-calc-percent-label">${serviceFeePercent !== undefined ? serviceFeePercent : 20}</span>%):</span>
                                    <span class="font-bold text-emerald-800 text-sm mt-0.5 block" id="service-calc-fee-amount">฿0.00</span>
                                </div>
                                <div class="p-2.5 bg-sky-50/80 rounded-lg border border-sky-200">
                                    <span class="text-sky-800 font-medium block text-[11px]">🔵 ยอดส่งต่อผู้ร่วมงาน / ทุน:</span>
                                    <span class="font-bold text-sky-800 text-sm mt-0.5 block" id="service-calc-payout-amount">฿0.00</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-end gap-3 font-mono">
                        <button type="button" onclick="app.switchTab('documents')" class="btn-paper w-full md:w-auto text-xs py-2 px-4">
                            ✕ ยกเลิก
                        </button>
                        ${!isEdit ? `
                            <button type="button" onclick="window.documentsModule.submitDocument('draft')" class="btn-paper w-full md:w-auto text-xs py-2 px-4">
                                💾 บันทึกเป็นฉบับร่าง
                            </button>
                        ` : ''}
                        <button type="submit" class="btn-ocean w-full md:w-auto text-xs py-2 px-5">
                            <span>${isEdit ? '💾 บันทึกการแก้ไข & พิมพ์ A4' : '✓ บันทึกเอกสาร & เปิดพิมพ์ A4'}</span>
                        </button>
                    </div>
                </form>
            </div>
        `;

        this.renderItemRows();
        this.recalculate();

        if (selectedCustomerId) {
            this.onCustomerSelected(selectedCustomerId);
        }
    },

    renderItemRows() {
        const tbody = document.getElementById('doc-items-tbody');
        if (!tbody) return;

        const unitsPreset = (app.state.presets && app.state.presets.units) || ['ชิ้น', 'งาน', 'เมตร', 'ตร.ม.', 'ชุด', 'ม้วน', 'กล่อง'];

        tbody.innerHTML = this.formData.items.map((item, idx) => {
            const isNoteRow = (item.product_name || '').trim().startsWith('*');

            return `
            <tr class="hover:bg-slate-50/60 transition ${isNoteRow ? 'bg-amber-50/30' : ''}">
                <td class="px-3 py-2 text-center text-slate-400 font-mono font-medium">${isNoteRow ? '★' : idx + 1}</td>
                <td class="px-3 py-2">
                    <div class="flex items-start gap-2">
                        <!-- Thumbnail upload/preview -->
                        <div class="relative shrink-0 mt-0.5">
                            ${item.image_url ? `
                                <div class="relative group">
                                    <img src="${item.image_url}" alt="Item" class="w-9 h-9 object-cover rounded-lg border border-slate-200 bg-white" onerror="this.remove()">
                                    <button type="button" onclick="window.documentsModule.removeItemImage(${idx})" title="ลบรูปภาพ" class="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] shadow transition">✕</button>
                                </div>
                            ` : `
                                <label class="w-9 h-9 border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-lg flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-blue-600 transition text-[11px]" title="แนบรูปสินค้า (เหมาะสำหรับใบเสนอราคา)">
                                    <span>📷</span>
                                    <input type="file" accept="image/*" class="hidden" onchange="window.documentsModule.handleImageUpload(${idx}, event)">
                                </label>
                            `}
                        </div>
                        <div class="flex-1 min-w-0">
                            <input type="text" value="${item.product_name || ''}" placeholder="ชื่อสินค้า หรือ *ข้อความของแถม/ประกันท้ายตาราง (เช่น *แถมฟรีเมาส์ Bluetooth, Warranty 3 years)" 
                                class="w-full px-2.5 py-1.5 text-xs border ${isNoteRow ? 'border-amber-400 bg-amber-50/60 font-bold text-amber-950' : 'border-slate-200'} rounded-lg focus:outline-none focus:border-blue-500"
                                oninput="window.documentsModule.updateItemField(${idx}, 'product_name', this.value)">
                            ${!isNoteRow ? `
                                <div class="mt-1">
                                    ${item.show_description || item.description ? `
                                        <div class="bg-slate-50 border border-slate-200 rounded-lg p-1.5 mt-0.5">
                                            <div class="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                                                <span class="font-medium text-slate-600">📝 รายละเอียด / สเปกสินค้า:</span>
                                                <button type="button" onclick="window.documentsModule.toggleItemDescription(${idx}, false)" class="text-slate-400 hover:text-rose-500 font-bold text-[10px]" title="ซ่อน">✕ ปิด</button>
                                            </div>
                                            <textarea rows="2" placeholder="ระบุรายละเอียดเพิ่มเติม สเปกสินค้า ประกัน หรือซีเรียลนัมเบอร์..." 
                                                class="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:border-blue-500 leading-snug font-sans"
                                                oninput="window.documentsModule.updateItemField(${idx}, 'description', this.value)">${item.description || ''}</textarea>
                                        </div>
                                    ` : `
                                        <button type="button" onclick="window.documentsModule.toggleItemDescription(${idx}, true)" class="text-[11px] text-sky-600 hover:text-sky-800 font-medium inline-flex items-center gap-1 hover:underline">
                                            <span>+ เพิ่มรายละเอียด / สเปกสินค้า</span>
                                        </button>
                                    `}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </td>
                <td class="px-3 py-2">
                    <input type="number" step="1" min="1" value="${Math.max(1, Math.round(Number(item.quantity) || 1))}" 
                        class="w-full px-2 py-1.5 text-right text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                        oninput="window.documentsModule.updateItemField(${idx}, 'quantity', this.value)">
                </td>
                <td class="px-3 py-2">
                    <input type="text" list="units-datalist" value="${item.unit || 'ชิ้น'}" 
                        class="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                        oninput="window.documentsModule.updateItemField(${idx}, 'unit', this.value)">
                    <datalist id="units-datalist">
                        ${unitsPreset.map(u => `<option value="${u}">`).join('')}
                    </datalist>
                </td>
                <td class="px-3 py-2">
                    <input type="number" step="0.01" min="0" value="${item.unit_price}" 
                        class="w-full px-2 py-1.5 text-right text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                        oninput="window.documentsModule.updateItemField(${idx}, 'unit_price', this.value)">
                </td>
                <td class="px-3 py-2">
                    <input type="number" step="0.01" min="0" value="${item.discount || 0}" 
                        class="w-full px-2 py-1.5 text-right text-xs border border-slate-200 rounded-lg focus:outline-none font-mono"
                        oninput="window.documentsModule.updateItemField(${idx}, 'discount', this.value)">
                </td>
                <td class="px-3 py-2 text-right font-bold text-slate-800 font-mono" id="row-total-${idx}">
                    ฿${app.formatCurrency(item.total_price || 0)}
                </td>
                <td class="px-2 py-2 text-center whitespace-nowrap">
                    <div class="inline-flex items-center gap-0.5">
                        <button type="button" onclick="window.documentsModule.moveItemRow(${idx}, -1)" ${idx === 0 ? 'disabled class="text-slate-200 cursor-not-allowed text-xs p-1"' : 'class="text-slate-400 hover:text-sky-600 font-bold text-xs p-1 rounded hover:bg-slate-100 transition"'} title="สลับขึ้น">
                            ▲
                        </button>
                        <button type="button" onclick="window.documentsModule.moveItemRow(${idx}, 1)" ${idx === this.formData.items.length - 1 ? 'disabled class="text-slate-200 cursor-not-allowed text-xs p-1"' : 'class="text-slate-400 hover:text-sky-600 font-bold text-xs p-1 rounded hover:bg-slate-100 transition"'} title="สลับลง">
                            ▼
                        </button>
                        <button type="button" onclick="window.documentsModule.removeItemRow(${idx})" class="text-slate-300 hover:text-rose-500 font-bold text-sm p-1 rounded hover:bg-rose-50 transition ml-0.5" title="ลบแถว">
                            ✕
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    },

    toggleItemDescription(index, show) {
        if (!this.formData.items[index]) return;
        this.formData.items[index].show_description = show;
        if (!show) {
            this.formData.items[index].description = '';
        }
        this.renderItemRows();
    },

    moveItemRow(index, direction) {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= this.formData.items.length) return;
        const temp = this.formData.items[index];
        this.formData.items[index] = this.formData.items[targetIndex];
        this.formData.items[targetIndex] = temp;
        this.renderItemRows();
        this.recalculate();
    },

    async handleImageUpload(idx, event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Data = e.target.result;
            try {
                app.toast('กำลังอัปโหลดรูปภาพสินค้า...', 'info');
                const res = await api.uploadImage(base64Data, 'item');
                this.formData.items[idx].image_url = res.url;
                app.toast('อัปโหลดรูปภาพเรียบร้อย', 'success');
            } catch (err) {
                console.warn('Backend upload error, using local data URL fallback:', err);
                this.formData.items[idx].image_url = base64Data;
                app.toast('บันทึกรูปภาพเรียบร้อย (Data URL)', 'success');
            }
            this.renderItemRows();
        };
        reader.readAsDataURL(file);
    },

    removeItemImage(idx) {
        if (this.formData.items[idx]) {
            this.formData.items[idx].image_url = '';
            this.renderItemRows();
        }
    },

    addItemRow() {
        this.formData.items.push({
            product_name: '',
            image_url: '',
            quantity: 1,
            unit: 'ชิ้น',
            unit_price: 0,
            discount: 0,
            discount_type: 'amount',
            total_price: 0
        });
        this.renderItemRows();
        this.recalculate();
    },

    addNoteRow(defaultText = '*แถมฟรีเมาส์ Bluetooth, Service, Warranty 3 years') {
        this.formData.items.push({
            product_name: defaultText,
            image_url: '',
            quantity: 1,
            unit: 'รายการ',
            unit_price: 0,
            discount: 0,
            discount_type: 'amount',
            total_price: 0
        });
        this.renderItemRows();
        this.recalculate();
    },

    removeItemRow(index) {
        if (this.formData.items.length <= 1) {
            app.toast('ต้องมีรายการสินค้าอย่างน้อย 1 รายการ', 'warning');
            return;
        }
        this.formData.items.splice(index, 1);
        this.renderItemRows();
        this.recalculate();
    },

    updateItemField(index, field, value) {
        if (!this.formData.items[index]) return;
        if (field === 'quantity') {
            this.formData.items[index].quantity = Math.max(0, parseInt(value, 10) || 0);
        } else {
            this.formData.items[index][field] = value;
        }

        // Recalculate row total
        const qty = Math.max(0, parseInt(this.formData.items[index].quantity, 10) || 0);
        const price = parseFloat(this.formData.items[index].unit_price) || 0;
        const disc = parseFloat(this.formData.items[index].discount) || 0;
        const total = Math.max(0, (qty * price) - disc);
        this.formData.items[index].total_price = total;

        const rowTotalEl = document.getElementById(`row-total-${index}`);
        if (rowTotalEl) {
            rowTotalEl.textContent = `฿${app.formatCurrency(total)}`;
        }

        this.recalculate();
    },

    recalculate() {
        let subtotal = 0;
        this.formData.items.forEach(it => {
            const qty = Math.max(0, parseInt(it.quantity, 10) || 0);
            const price = parseFloat(it.unit_price) || 0;
            const disc = parseFloat(it.discount) || 0;
            const total = Math.max(0, (qty * price) - disc);
            it.total_price = total;
            subtotal += total;
        });

        const docDiscInput = document.getElementById('doc-discount-total');
        const docDisc = docDiscInput ? parseFloat(docDiscInput.value) || 0 : 0;
        const grandTotal = Math.max(0, subtotal - docDisc);

        const subtotalEl = document.getElementById('calc-subtotal');
        if (subtotalEl) subtotalEl.textContent = `฿${app.formatCurrency(subtotal)}`;

        const grandTotalEl = document.getElementById('calc-grand-total');
        if (grandTotalEl) grandTotalEl.textContent = `฿${app.formatCurrency(grandTotal)}`;

        const thaiBahtEl = document.getElementById('calc-thai-baht');
        if (thaiBahtEl) thaiBahtEl.textContent = app.thaiBahtText(grandTotal);

        this.recalculateServiceFee(grandTotal);
    },

    toggleServiceBillFields() {
        const isChecked = document.getElementById('doc-is-service-bill')?.checked || false;
        const container = document.getElementById('service-bill-fields');
        if (container) {
            if (isChecked) {
                container.classList.remove('hidden');
                this.recalculateServiceFee();
            } else {
                container.classList.add('hidden');
            }
        }
    },

    recalculateServiceFee(currentGrandTotal = null) {
        let grandTotal = currentGrandTotal;
        if (grandTotal === null) {
            const grandTotalEl = document.getElementById('calc-grand-total');
            const text = grandTotalEl ? grandTotalEl.textContent.replace(/[฿,]/g, '').trim() : '0';
            grandTotal = parseFloat(text) || 0;
        }

        const percentInput = document.getElementById('doc-service-fee-percent');
        const percent = percentInput ? (parseFloat(percentInput.value) || 0) : 20;

        const fee = Math.round((grandTotal * (percent / 100)) * 100) / 100;
        const payout = Math.round((grandTotal - fee) * 100) / 100;

        const gtEl = document.getElementById('service-calc-grand-total');
        if (gtEl) gtEl.textContent = `฿${app.formatCurrency(grandTotal)}`;

        const pLabel = document.getElementById('service-calc-percent-label');
        if (pLabel) pLabel.textContent = percent;

        const feeEl = document.getElementById('service-calc-fee-amount');
        if (feeEl) feeEl.textContent = `฿${app.formatCurrency(fee)}`;

        const payoutEl = document.getElementById('service-calc-payout-amount');
        if (payoutEl) payoutEl.textContent = `฿${app.formatCurrency(payout)}`;
    },

    parseServiceBill(doc) {
        if (!doc) return { is_service_bill: false, service_fee_percent: 20, service_fee_amount: 0, partner_payout_amount: 0, partner_name: '', clean_remark: '' };

        if (doc.is_service_bill === true || doc.is_service_bill === 1 || doc.is_service_bill === '1') {
            return {
                is_service_bill: true,
                service_fee_percent: doc.service_fee_percent !== undefined ? Number(doc.service_fee_percent) : 20,
                service_fee_amount: Number(doc.service_fee_amount) || 0,
                partner_payout_amount: Number(doc.partner_payout_amount) || 0,
                partner_name: doc.partner_name || '',
                clean_remark: (doc.clean_remark !== undefined ? doc.clean_remark : (doc.remark || '')).replace(/\[บิลที่ร้านให้บริการ:.*?\]/g, '').trim()
            };
        }

        const rawRemark = doc.remark || '';
        const match = rawRemark.match(/\[บิลที่ร้านให้บริการ:({.*?})\]/);
        if (match) {
            try {
                const data = JSON.parse(match[1]);
                return {
                    is_service_bill: true,
                    service_fee_percent: data.percent !== undefined ? Number(data.percent) : 20,
                    service_fee_amount: Number(data.fee) || 0,
                    partner_payout_amount: Number(data.payout) || 0,
                    partner_name: data.partner || '',
                    clean_remark: rawRemark.replace(match[0], '').trim()
                };
            } catch (e) {}
        }

        return {
            is_service_bill: false,
            service_fee_percent: 20,
            service_fee_amount: 0,
            partner_payout_amount: 0,
            partner_name: '',
            clean_remark: rawRemark
        };
    },

    toggleUndated(checked) {
        const dateInput = document.getElementById('doc-issue-date');
        const helper = document.getElementById('undated-helper');
        if (dateInput) {
            if (checked) dateInput.classList.add('opacity-50');
            else dateInput.classList.remove('opacity-50');
        }
        if (helper) {
            if (checked) helper.classList.remove('hidden');
            else helper.classList.add('hidden');
        }
    },

    futureCodesCache: null,

    toggleCodeMode(mode) {
        const autoBox = document.getElementById('code-auto-container');
        const reservedBox = document.getElementById('code-reserved-container');
        const futureBox = document.getElementById('code-future-container');

        if (mode === 'reserved') {
            if (autoBox) autoBox.classList.add('hidden');
            if (reservedBox) reservedBox.classList.remove('hidden');
            if (futureBox) futureBox.classList.add('hidden');
        } else if (mode === 'future') {
            if (autoBox) autoBox.classList.add('hidden');
            if (reservedBox) reservedBox.classList.add('hidden');
            if (futureBox) futureBox.classList.remove('hidden');

            const picker = document.getElementById('future-date-picker');
            if (picker) {
                if (!picker.value) {
                    const d = new Date();
                    d.setDate(d.getDate() + 7);
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    picker.value = `${y}-${m}-${day}`;
                }
                this.onFutureDatePicked(picker.value);
            }
        } else {
            if (autoBox) autoBox.classList.remove('hidden');
            if (reservedBox) reservedBox.classList.add('hidden');
            if (futureBox) futureBox.classList.add('hidden');

            // Reset Section 2 issue date to today if returning to auto
            const issueDateEl = document.getElementById('doc-issue-date');
            if (issueDateEl) {
                const today = new Date().toISOString().slice(0, 10);
                issueDateEl.value = today;
                this.onDateChanged(today);
            }
        }
    },

    setFutureOffset(days) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const val = `${y}-${m}-${day}`;
        const picker = document.getElementById('future-date-picker');
        if (picker) {
            picker.value = val;
            this.onFutureDatePicked(val);
        }
    },

    setFutureNextMonth() {
        const now = new Date();
        const nextM = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const y = nextM.getFullYear();
        const m = String(nextM.getMonth() + 1).padStart(2, '0');
        const val = `${y}-${m}-01`;
        const picker = document.getElementById('future-date-picker');
        if (picker) {
            picker.value = val;
            this.onFutureDatePicked(val);
        }
    },

    async onFutureDatePicked(dateStr) {
        if (!dateStr) return;
        try {
            const qtEl = document.getElementById('future-code-qt');
            const invEl = document.getElementById('future-code-inv');
            const reEl = document.getElementById('future-code-re');
            if (qtEl) qtEl.textContent = '...';
            if (invEl) invEl.textContent = '...';
            if (reEl) reEl.textContent = '...';

            const res = await api.getNextCodesAll(dateStr);
            this.futureCodesCache = res.data;

            if (qtEl) qtEl.textContent = res.data.quotation.code;
            if (invEl) invEl.textContent = res.data.billing.code;
            if (reEl) reEl.textContent = res.data.receipt.code;

            // Sync with Section 2 issue date
            const issueDateEl = document.getElementById('doc-issue-date');
            if (issueDateEl) issueDateEl.value = dateStr;

            this.updateFutureTypeHighlight();
        } catch (e) {
            console.error('Error fetching future codes:', e);
        }
    },

    selectFutureType(type) {
        const typeSelect = document.getElementById('doc-type-select');
        if (typeSelect) {
            typeSelect.value = type;
        }
        this.updateFutureTypeHighlight();
    },

    updateFutureTypeHighlight() {
        const typeSelect = document.getElementById('doc-type-select');
        const curType = typeSelect ? typeSelect.value : 'quotation';

        const cards = {
            quotation: { card: document.getElementById('card-future-qt'), badge: document.getElementById('badge-active-qt'), code: this.futureCodesCache?.quotation?.code },
            billing: { card: document.getElementById('card-future-inv'), badge: document.getElementById('badge-active-inv'), code: this.futureCodesCache?.billing?.code },
            receipt: { card: document.getElementById('card-future-re'), badge: document.getElementById('badge-active-re'), code: this.futureCodesCache?.receipt?.code }
        };

        Object.entries(cards).forEach(([t, item]) => {
            if (item.card) {
                if (t === curType) {
                    item.card.classList.add('border-emerald-500', 'bg-emerald-50/50');
                    item.card.classList.remove('border-slate-200');
                    if (item.badge) item.badge.classList.remove('hidden');
                } else {
                    item.card.classList.remove('border-emerald-500', 'bg-emerald-50/50');
                    item.card.classList.add('border-slate-200');
                    if (item.badge) item.badge.classList.add('hidden');
                }
            }
        });

        const activeCode = cards[curType]?.code || '-';
        const displayEl = document.getElementById('future-selected-display');
        if (displayEl) displayEl.textContent = activeCode;

        const autoPreviewEl = document.getElementById('auto-code-preview');
        if (autoPreviewEl && activeCode !== '-') {
            autoPreviewEl.value = activeCode;
        }
    },

    async reserveAllFutureCodes() {
        const picker = document.getElementById('future-date-picker');
        const dateStr = (picker && picker.value) ? picker.value : new Date().toISOString().slice(0, 10);
        
        try {
            if (window.app) app.toast('กำลังกันเลขทั้ง 3 ประเภทเข้าคลังสำรอง...', 'info');
            
            const d = new Date(dateStr);
            const dateLabel = isNaN(d.getTime()) ? dateStr : `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
            const noteText = `กันเลขสำหรับวันที่ ${dateLabel}`;

            await api.reserveBatchAll({
                date_str: dateStr,
                note: noteText,
                count: 1
            });

            if (window.app) app.toast(`กันเลขทั้ง 3 ประเภท (QT, INV, RE) สำหรับวันที่ ${dateLabel} เข้าคลังเลขสำรองเรียบร้อยแล้ว! 📥⚡`, 'success');

            // Refresh the live codes display for this date
            await this.onFutureDatePicked(dateStr);

            // Also reload reservations cache if reservations module is loaded
            if (window.reservationsModule && typeof window.reservationsModule.load === 'function') {
                window.reservationsModule.load();
            }
        } catch (e) {
            if (window.app) app.toast('เกิดข้อผิดพลาด: ' + e.message, 'error');
        }
    },

    async onDocTypeChanged(type) {
        const form = document.getElementById('doc-create-form');
        const codeMode = form ? form.code_mode?.value : 'auto';
        if (codeMode === 'future') {
            this.updateFutureTypeHighlight();
            return;
        }

        const dateInput = document.getElementById('doc-issue-date');
        const issueDate = dateInput ? dateInput.value : new Date().toISOString().slice(0, 10);

        try {
            const [nextRes, resRes] = await Promise.all([
                api.getNextCode(type, issueDate),
                api.getReservations(type, 'reserved')
            ]);
            const previewEl = document.getElementById('auto-code-preview');
            if (previewEl) previewEl.value = nextRes.data.code;

            const resSelect = document.getElementById('reserved-code-select');
            if (resSelect) {
                const sorted = this.sortReservationsByDate(resRes.data || []);
                if (sorted.length === 0) {
                    resSelect.innerHTML = '<option value="">-- ไม่มีเลขที่กันไว้สำหรับประเภทนี้ (ไปที่แท็บ "คลังเลขที่กันไว้" เพื่อกดกันเลข) --</option>';
                } else {
                    resSelect.innerHTML = sorted.map(r => `
                        <option value="${r.code}" data-note="${app.escapeHtml ? app.escapeHtml(r.note || '') : (r.note || '')}">
                            ${r.code} ${r.note ? `— [${r.note}]` : ''}
                        </option>
                    `).join('');
                }
            }
        } catch (e) {
            console.error(e);
        }
    },

    sortReservationsByDate(list) {
        return (list || []).slice().sort((a, b) => {
            const dateA = (a.note || '').match(/\[(\d{4}-\d{2}-\d{2})\]/)?.[1] || a.reserved_at || '';
            const dateB = (b.note || '').match(/\[(\d{4}-\d{2}-\d{2})\]/)?.[1] || b.reserved_at || '';
            if (dateA && dateB && dateA !== dateB) {
                return dateA.localeCompare(dateB);
            }
            return (a.code || '').localeCompare(b.code || '');
        });
    },

    onReservedCodeSelected(code) {
        const select = document.getElementById('reserved-code-select');
        const selectedOption = select?.options[select.selectedIndex];
        const note = selectedOption?.getAttribute('data-note') || '';
        const m = note.match(/\[(\d{4}-\d{2}-\d{2})\]/);
        if (m && m[1]) {
            const dateInput = document.getElementById('doc-issue-date');
            if (dateInput) {
                dateInput.value = m[1];
                app.toast(`ปรับวันที่ออกบิลเป็น ${app.formatDateThai(m[1])} ตามโควตาเลขสำรอง`, 'info');
            }
        }
    },

    async onDateChanged(date) {
        const typeSelect = document.getElementById('doc-type-select');
        const docType = typeSelect ? typeSelect.value : 'quotation';
        try {
            const nextRes = await api.getNextCode(docType, date);
            const previewEl = document.getElementById('auto-code-preview');
            if (previewEl) previewEl.value = nextRes.data.code;
        } catch (e) {
            console.error(e);
        }
    },

    async onCustomerSelected(customerId) {
        const infoBox = document.getElementById('customer-info-box');
        const projectSelect = document.getElementById('doc-project-select');

        if (!customerId) {
            if (infoBox) infoBox.classList.add('hidden');
            if (projectSelect) projectSelect.innerHTML = '<option value="">-- ใช้หัวบิลทั่วไปของลูกค้า --</option>';
            const btnAddProject = document.getElementById('btn-add-project-shortcut');
            if (btnAddProject) btnAddProject.classList.add('hidden');
            return;
        }

        try {
            const res = await api.getCustomer(customerId);
            const c = res.data;

            if (infoBox) {
                infoBox.classList.remove('hidden');
                document.getElementById('c-box-tax').textContent = c.tax_id ? `เลขประจำตัวผู้เสียภาษี: ${c.tax_id}` : 'ไม่ได้ระบุเลขผู้เสียภาษี';
                document.getElementById('c-box-address').textContent = c.address ? `ที่อยู่: ${c.address}` : '';
            }

            // Populate projects
            if (projectSelect) {
                projectSelect.innerHTML = '<option value="">-- ใช้หัวบิลทั่วไปของลูกค้า --</option>';
                if (c.projects && c.projects.length > 0) {
                    c.projects.forEach(p => {
                        const opt = document.createElement('option');
                        opt.value = p.id;
                        opt.textContent = `${p.project_name}${p.contact_person ? ` (${p.contact_person})` : ''}`;
                        projectSelect.appendChild(opt);
                    });
                }
            }

            // Show/hide add-project shortcut button
            const btnAddProject = document.getElementById('btn-add-project-shortcut');
            if (btnAddProject) btnAddProject.classList.remove('hidden');
        } catch (e) {
            console.error(e);
        }
    },

    onProjectSelected(projectId) {
        const customInput = document.getElementById('project-name-custom');
        const select = document.getElementById('doc-project-select');
        if (projectId && select && customInput) {
            const text = select.options[select.selectedIndex].text.replace('📌 ', '');
            customInput.value = text;
        }
    },

    insertPreset(type, text) {
        if (type === 'terms') {
            const el = document.getElementById('doc-payment-terms');
            if (el) el.value = (el.value ? el.value + '\n' : '') + text;
        } else if (type === 'remark') {
            const el = document.getElementById('doc-remark');
            if (el) el.value = (el.value ? el.value + '\n' : '') + text;
        }
    },

    async submitDocument(statusOverride = null) {
        if (this.isSubmitting) return;

        const form = document.getElementById('doc-create-form');
        if (!form) return;

        const type = form.type.value;
        const customer_id = form.customer_id.value;
        const project_id = form.project_id.value || null;
        const project_name_custom = form.project_name_custom.value.trim();
        const issue_date = form.issue_date.value;
        const due_date = form.due_date.value || null;
        const discount_total = parseFloat(document.getElementById('doc-discount-total').value) || 0;
        const payment_terms = document.getElementById('doc-payment-terms').value.trim();
        let remark = document.getElementById('doc-remark').value.trim();
        // Remove any existing tags from typed input
        remark = remark.replace(/\[ไม่ลงวันที่\]/g, '').replace(/\[บิลที่ร้านให้บริการ:.*?\]/g, '').trim();

        const isUndated = document.getElementById('doc-is-undated')?.checked || false;
        if (isUndated) {
            remark = remark ? `${remark}\n[ไม่ลงวันที่]` : '[ไม่ลงวันที่]';
        }

        const isServiceBill = document.getElementById('doc-is-service-bill')?.checked || false;
        const serviceFeePercent = parseFloat(document.getElementById('doc-service-fee-percent')?.value) || 0;
        const partnerName = (document.getElementById('doc-partner-name')?.value || '').trim();

        const code_mode = form.code_mode.value;
        let specified_code = null;
        if (code_mode === 'reserved') {
            const resSelect = document.getElementById('reserved-code-select');
            specified_code = resSelect ? resSelect.value : null;
            if (!specified_code) {
                app.toast('กรุณาเลือกเลขที่กันไว้ หรือเปลี่ยนเป็นรันเลขอัตโนมัติ', 'warning');
                return;
            }
        } else if (code_mode === 'future') {
            const futurePicker = document.getElementById('future-date-picker');
            if (futurePicker && futurePicker.value) {
                form.issue_date.value = futurePicker.value;
            }
            const activeCode = this.futureCodesCache?.[type]?.code;
            if (activeCode && activeCode !== '-') {
                specified_code = activeCode;
            }
        }

        const effectiveIssueDate = (code_mode === 'future' && document.getElementById('future-date-picker')?.value)
            ? document.getElementById('future-date-picker').value
            : issue_date;

        if (!customer_id) {
            app.toast('กรุณาเลือกลูกค้า', 'warning');
            return;
        }
        if (!effectiveIssueDate) {
            app.toast('กรุณาระบุวันที่ออกเอกสาร', 'warning');
            return;
        }

        // Validate items & combine description if provided
        const validItems = this.formData.items
            .filter(it => it.product_name && it.product_name.trim())
            .map(it => {
                const pName = it.product_name.trim();
                const desc = (it.description || '').trim();
                const finalName = desc ? `${pName}\n${desc}` : pName;
                return {
                    ...it,
                    product_name: finalName,
                    quantity: Math.max(1, Math.round(Number(it.quantity) || 1))
                };
            });
        if (validItems.length === 0) {
            app.toast('กรุณาระบุรายการสินค้าอย่างน้อย 1 รายการ', 'warning');
            return;
        }

        // Calculate grand total for service fee calculations
        let subtotal = 0;
        validItems.forEach(it => {
            const qty = Math.max(1, Math.round(Number(it.quantity) || 1));
            const price = parseFloat(it.unit_price) || 0;
            const disc = parseFloat(it.discount) || 0;
            const discType = it.discount_type || 'amount';
            const rowDiscount = discType === 'percent' ? (qty * price * disc) / 100 : disc;
            subtotal += Math.max(0, (qty * price) - rowDiscount);
        });
        const grandTotal = Math.max(0, subtotal - discount_total);

        const serviceFeeAmount = isServiceBill ? Math.round((grandTotal * (serviceFeePercent / 100)) * 100) / 100 : 0;
        const partnerPayoutAmount = isServiceBill ? Math.round((grandTotal - serviceFeeAmount) * 100) / 100 : 0;

        if (isServiceBill) {
            const servicePayload = JSON.stringify({
                percent: serviceFeePercent,
                fee: serviceFeeAmount,
                payout: partnerPayoutAmount,
                partner: partnerName
            });
            remark = remark ? `${remark}\n[บิลที่ร้านให้บริการ:${servicePayload}]` : `[บิลที่ร้านให้บริการ:${servicePayload}]`;
        }

        const editId = document.getElementById('doc-edit-id')?.value;

        const payload = {
            code_mode: code_mode === 'future' ? (specified_code ? 'custom' : 'auto') : code_mode,
            specified_code,
            type,
            customer_id: parseInt(customer_id, 10),
            project_id: project_id ? parseInt(project_id, 10) : null,
            project_name_custom,
            issue_date: effectiveIssueDate,
            due_date,
            items: validItems,
            discount_total,
            status: statusOverride || 'issued',
            remark,
            payment_terms,
            is_service_bill: isServiceBill,
            service_fee_percent: serviceFeePercent,
            service_fee_amount: serviceFeeAmount,
            partner_payout_amount: partnerPayoutAmount,
            partner_name: partnerName
        };

        this.isSubmitting = true;
        const submitBtns = form.querySelectorAll('button[type="submit"], button[onclick*="submitDocument"]');
        submitBtns.forEach(b => {
            b.dataset.origText = b.innerHTML;
            b.disabled = true;
            b.classList.add('opacity-50', 'cursor-not-allowed');
            b.innerHTML = '⏳ กำลังบันทึก...';
        });

        try {
            if (editId) {
                const res = await api.updateDocument(editId, payload);
                app.toast(res.message, 'success');
                this.loadList();
                window.printModule.openPrint(editId);
            } else {
                const res = await api.createDocument(payload);
                app.toast(res.message, 'success');
                this.loadList();
                window.printModule.openPrint(res.data.id);
            }
        } catch (err) {
            app.toast(err.message, 'error');
        } finally {
            this.isSubmitting = false;
            submitBtns.forEach(b => {
                b.disabled = false;
                b.classList.remove('opacity-50', 'cursor-not-allowed');
                if (b.dataset.origText) b.innerHTML = b.dataset.origText;
            });
        }
    },

    // Actions
    async openConvertModal(id, currentType, code, issueDate) {
        if (!issueDate) {
            const doc = (app.state.documents || []).find(d => Number(d.id) === Number(id));
            issueDate = doc ? doc.issue_date : new Date().toISOString().slice(0, 10);
        }

        app.state.pendingConvertDoc = { id, currentType, code, issue_date: issueDate };

        const label = document.getElementById('modal-convert-source');
        if (label) label.innerHTML = `${app.getDocTypeBadge(currentType)} <span class="font-bold text-slate-900 ml-1.5">${code}</span>`;

        const dateLabel = document.getElementById('modal-convert-source-date');
        if (dateLabel) {
            dateLabel.textContent = `${app.formatDateThai(issueDate)} (${issueDate})`;
        }

        const dateInput = document.getElementById('convert-issue-date');
        if (dateInput) {
            dateInput.value = issueDate;
        }

        const selectTarget = document.getElementById('convert-target-type');
        if (selectTarget) {
            if (currentType === 'quotation') {
                selectTarget.innerHTML = `
                    <option value="billing">ใบแจ้งหนี้ / ใบวางบิล (INV)</option>
                    <option value="receipt">ใบเสร็จรับเงิน (RE)</option>
                `;
            } else if (currentType === 'billing') {
                selectTarget.innerHTML = `
                    <option value="receipt">ใบเสร็จรับเงิน (RE)</option>
                `;
            } else {
                selectTarget.innerHTML = `
                    <option value="billing">ใบแจ้งหนี้ / ใบวางบิล (INV)</option>
                    <option value="quotation">ใบเสนอราคา (QT)</option>
                `;
            }
        }

        app.openModal('modal-convert');
        await this.onConvertTargetOrDateChanged();
    },

    toggleConvertCodeMode(mode) {
        const resContainer = document.getElementById('convert-reserved-container');
        const autoContainer = document.getElementById('convert-auto-container');
        if (mode === 'reserved') {
            if (resContainer) resContainer.classList.remove('hidden');
            if (autoContainer) autoContainer.classList.add('hidden');
        } else {
            if (resContainer) resContainer.classList.add('hidden');
            if (autoContainer) autoContainer.classList.remove('hidden');
        }
    },

    async onConvertTargetOrDateChanged() {
        const targetTypeSelect = document.getElementById('convert-target-type');
        const issueDateInput = document.getElementById('convert-issue-date');
        const dueDateContainer = document.getElementById('convert-due-date-container');
        const dueDateInput = document.getElementById('convert-due-date');
        const reservedSelect = document.getElementById('convert-reserved-select');
        const reservedHint = document.getElementById('convert-reserved-hint');
        const badgeEl = document.getElementById('convert-code-badge');
        const autoPreviewEl = document.getElementById('convert-auto-preview');
        const modeReservedRadio = document.getElementById('convert-mode-reserved');
        const modeAutoRadio = document.getElementById('convert-mode-auto');

        if (!targetTypeSelect || !issueDateInput) return;

        const targetType = targetTypeSelect.value;
        const issueDate = issueDateInput.value || new Date().toISOString().slice(0, 10);

        // Show/hide due date for billing
        if (dueDateContainer) {
            if (targetType === 'billing') {
                dueDateContainer.classList.remove('hidden');
                if (dueDateInput && !dueDateInput.value) {
                    const d = new Date(issueDate);
                    d.setDate(d.getDate() + 30);
                    dueDateInput.value = d.toISOString().slice(0, 10);
                }
            } else {
                dueDateContainer.classList.add('hidden');
            }
        }

        // Fetch preview for auto code
        try {
            const nextCodeRes = await api.getNextCode(targetType, issueDate);
            if (autoPreviewEl && nextCodeRes.data) {
                autoPreviewEl.value = nextCodeRes.data.code;
            }
        } catch (e) {
            console.error('Failed to get next code preview:', e);
        }

        // Fetch active reservations for targetType
        try {
            if (badgeEl) badgeEl.textContent = 'กำลังหาเลขสำรอง...';
            const resRes = await api.getReservations(targetType, 'reserved');
            const reservations = (resRes && resRes.data) ? resRes.data : [];

            // Match reservations:
            // 1. Exact match on date in note (e.g. "17/7/2026" or "2026-07-17")
            // 2. Or YearMonth in code (e.g. "202607")
            const d = new Date(issueDate);
            const dateStrShort = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
            const ymStr = issueDate.replace(/-/g, '').slice(0, 6);

            let bestMatchIndex = -1;
            for (let i = 0; i < reservations.length; i++) {
                const r = reservations[i];
                const note = r.note || '';
                const code = r.code || '';
                if (note.includes(dateStrShort) || note.includes(issueDate)) {
                    bestMatchIndex = i;
                    break;
                }
                if (bestMatchIndex === -1 && code.includes(ymStr)) {
                    bestMatchIndex = i;
                }
            }

            if (reservations.length > 0) {
                reservedSelect.innerHTML = reservations.map((r, idx) => {
                    const isBest = (idx === bestMatchIndex);
                    return `
                        <option value="${r.code}" ${isBest ? 'selected' : ''}>
                            ${r.code} ${r.note ? `— [${r.note}]` : ''} ${isBest ? '✨ (ตรงกับวันที่ระบุ)' : ''}
                        </option>
                    `;
                }).join('');

                if (bestMatchIndex !== -1) {
                    const matched = reservations[bestMatchIndex];
                    if (badgeEl) {
                        badgeEl.className = 'text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold';
                        badgeEl.textContent = `✨ พบเลขที่ล็อกไว้: ${matched.code}`;
                    }
                    if (reservedHint) {
                        reservedHint.innerHTML = `<span class="text-emerald-700 font-bold">✓ ตรวจพบเลข ${matched.code} ที่ล็อกไว้สำหรับวันที่ ${dateStrShort} (เลือกให้อัตโนมัติ)</span>`;
                    }
                    if (modeReservedRadio) {
                        modeReservedRadio.checked = true;
                        this.toggleConvertCodeMode('reserved');
                    }
                } else {
                    if (badgeEl) {
                        badgeEl.className = 'text-[10px] bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded-full font-bold';
                        badgeEl.textContent = `มีเลขในคลัง ${reservations.length} เลข`;
                    }
                    if (reservedHint) {
                        reservedHint.textContent = `มีเลขสำรองในคลัง ${reservations.length} รายการ สามารถเลือกเลขที่ต้องการได้`;
                    }
                }
            } else {
                reservedSelect.innerHTML = `<option value="">-- ไม่มีเลขสำรองประเภทนี้ในคลัง --</option>`;
                if (badgeEl) {
                    badgeEl.className = 'text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium';
                    badgeEl.textContent = 'ไม่มีเลขสำรอง (จะรันเลขอัตโนมัติ)';
                }
                if (reservedHint) {
                    reservedHint.textContent = 'ไม่พบเลขสำรองในคลัง ระบบจะรันเลขอัตโนมัติตามเดือนของวันที่ออกเอกสาร';
                }
                if (modeAutoRadio) {
                    modeAutoRadio.checked = true;
                    this.toggleConvertCodeMode('auto');
                }
            }
        } catch (err) {
            console.error('Failed to load reservations for convert:', err);
        }
    },

    async submitConvert() {
        if (!app.state.pendingConvertDoc) return;
        const targetType = document.getElementById('convert-target-type').value;
        const issueDate = document.getElementById('convert-issue-date').value;
        const dueDate = document.getElementById('convert-due-date')?.value || null;
        const codeMode = document.querySelector('input[name="convert_code_mode"]:checked')?.value || 'reserved';
        const reservedCode = (codeMode === 'reserved') ? document.getElementById('convert-reserved-select')?.value : null;

        const submitBtn = document.getElementById('btn-submit-convert');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'กำลังแปลงเอกสาร...';
        }

        try {
            const payload = {
                target_type: targetType,
                issue_date: issueDate,
                due_date: targetType === 'billing' ? dueDate : null,
                reserved_code: reservedCode || null
            };

            const res = await api.convertDocument(app.state.pendingConvertDoc.id, payload);
            app.closeModal('modal-convert');
            app.toast(res.message, 'success');
            await this.loadList();
            window.printModule.openPrint(res.data.id);
        } catch (err) {
            app.toast(err.message, 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '🔄 ยืนยันการแปลงเอกสาร';
            }
        }
    },

    async duplicate(id) {
        if (!confirm('คุณต้องการคัดลอกเอกสารนี้เพื่อสร้างฉบับใหม่ใช่หรือไม่?')) return;

        try {
            const res = await api.duplicateDocument(id);
            app.toast(res.message, 'success');
            this.loadList();
        } catch (err) {
            app.toast(err.message, 'error');
        }
    },

    openCancelModal(id, code) {
        app.state.pendingCancelDocId = id;
        document.getElementById('modal-cancel-code').textContent = code;
        document.getElementById('form-cancel-reason').value = '';
        app.openModal('modal-cancel');
    },

    async submitCancel() {
        if (!app.state.pendingCancelDocId) return;
        const reason = document.getElementById('form-cancel-reason').value.trim();

        try {
            const res = await api.cancelDocument(app.state.pendingCancelDocId, reason);
            app.closeModal('modal-cancel');
            app.toast(res.message, 'success');
            this.loadList();
        } catch (err) {
            app.toast(err.message, 'error');
        }
    },

    async markPaid(id, currentStatus) {
        const isPaid = currentStatus === 'paid';
        const msg = isPaid
            ? 'ต้องการเปลี่ยนสถานะเอกสารกลับเป็น "ยังไม่ได้รับเงิน (ออกเอกสารแล้ว)" ใช่หรือไม่?'
            : 'ยืนยันว่าได้รับเงินเรียบร้อยแล้ว และต้องการบันทึกสถานะเป็น "ชำระเงินแล้ว"?';
        if (!confirm(msg)) return;

        try {
            const res = await api.markPaid(id);
            app.toast(res.message || 'บันทึกสถานะเรียบร้อยแล้ว', 'success');
            this.loadList();
        } catch (err) {
            app.toast(err.message, 'error');
        }
    },

    async shareToLine(docId) {
        try {
            app.toast('กำลังดึงข้อมูลเอกสารสำหรับส่ง LINE...', 'info');
            const res = await api.getDocument(docId);
            window.printModule.currentDoc = res.data;
            window.printModule.shareCurrentToLine();
        } catch (e) {
            app.toast('เกิดข้อผิดพลาดในการโหลดข้อมูลสำหรับแชร์: ' + e.message, 'error');
        }
    }
};
