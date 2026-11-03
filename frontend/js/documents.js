/**
 * Documents List & Dynamic Creator Module (รูปแบบทันสมัย เป็นระเบียบ สวยงาม)
 */

window.documentsModule = {
    filters: {
        type: 'all',
        status: 'all',
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
            <div class="typewriter-card rounded-xl p-6 md:p-8 font-mono">
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-stone-800">
                    <div>
                        <h2 class="text-xl font-bold text-stone-900 font-typewriter flex items-center gap-2">
                            <span>📄</span> [ แฟ้มจัดเก็บเอกสารธุรกิจทั้งหมด ]
                        </h2>
                        <p class="text-xs text-stone-600 mt-1">ใบเสนอราคา (QT), ใบแจ้งหนี้/วางบิล (INV) และใบเสร็จรับเงิน (RE)</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="app.switchTab('create-doc')" class="btn-typewriter">
                            <span>+ สอดกระดาษออกบิลใหม่</span>
                        </button>
                    </div>
                </div>

                <!-- Tabs by Type / Status -->
                <div class="flex flex-wrap items-center gap-1.5 p-1 bg-[#eee3c8] border-2 border-stone-700 rounded-lg text-xs font-mono my-4">
                    <button onclick="window.documentsModule.setFilter('type', 'all', 'status', 'all')" class="px-3 py-1 rounded transition ${this.filters.type === 'all' && this.filters.status === 'all' ? 'bg-[#2b2725] text-amber-50 font-bold' : 'text-stone-700 hover:bg-stone-300'}">
                        [ ทั้งหมด ]
                    </button>
                    <button onclick="window.documentsModule.setFilter('type', 'quotation', 'status', 'all')" class="px-3 py-1 rounded transition ${this.filters.type === 'quotation' ? 'bg-blue-900 text-white font-bold' : 'text-stone-700 hover:bg-stone-300'}">
                        [QT] ใบเสนอราคา
                    </button>
                    <button onclick="window.documentsModule.setFilter('type', 'billing', 'status', 'all')" class="px-3 py-1 rounded transition ${this.filters.type === 'billing' && this.filters.status === 'all' ? 'bg-amber-900 text-white font-bold' : 'text-stone-700 hover:bg-stone-300'}">
                        [INV] ใบแจ้งหนี้/วางบิล
                    </button>
                    <button onclick="window.documentsModule.setFilter('type', 'receipt', 'status', 'all')" class="px-3 py-1 rounded transition ${this.filters.type === 'receipt' ? 'bg-emerald-900 text-white font-bold' : 'text-stone-700 hover:bg-stone-300'}">
                        [RE] ใบเสร็จรับเงิน
                    </button>
                    <button onclick="window.documentsModule.setFilter('type', 'billing', 'status', 'issued')" class="px-3 py-1 rounded transition ${this.filters.type === 'billing' && this.filters.status === 'issued' ? 'bg-amber-600 text-white font-bold' : 'text-amber-900 hover:bg-amber-100'}">
                        ⏳ รอชำระเงิน
                    </button>
                    <button onclick="window.documentsModule.setFilter('type', 'all', 'status', 'cancelled')" class="px-3 py-1 rounded transition ${this.filters.status === 'cancelled' ? 'bg-rose-900 text-white font-bold' : 'text-rose-900 hover:bg-rose-100'}">
                        🚫 ยกเลิก
                    </button>
                </div>

                <!-- Search & Filters Bar -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5 font-mono">
                    <div class="md:col-span-2 relative">
                        <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">🔍</span>
                        <input type="text" id="doc-search-input" value="${this.filters.search || ''}" placeholder="ค้นหาเลขที่เอกสาร, ชื่อลูกค้า, โครงการ..." 
                            class="w-full pl-9 pr-4 py-1.5 text-xs border-2 border-stone-800 rounded bg-[#fffdfa] focus:outline-none"
                            onkeyup="if(event.key === 'Enter') window.documentsModule.applySearch()">
                    </div>
                    <div>
                        <select id="doc-filter-customer" class="w-full px-3 py-1.5 text-xs border-2 border-stone-800 rounded bg-[#fffdfa] focus:outline-none" onchange="window.documentsModule.applyCustomerFilter(this.value)">
                            <option value="">-- ลูกค้าทั้งหมด --</option>
                            ${customers.map(c => `
                                <option value="${c.id}" ${this.filters.customer_id == c.id ? 'selected' : ''}>${c.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="window.documentsModule.applySearch()" class="btn-typewriter flex-1 text-xs py-1.5">
                            ค้นหา
                        </button>
                        <button onclick="window.documentsModule.resetFilters()" class="btn-paper text-xs py-1.5 px-3">
                            ล้าง
                        </button>
                    </div>
                </div>

                <!-- Table -->
                <div class="overflow-x-auto border-2 border-stone-800 rounded-lg bg-white">
                    <table class="w-full text-xs text-left min-w-[960px] border-collapse">
                        <thead class="bg-[#ede4d3] text-stone-900 font-bold border-b-2 border-stone-800 font-typewriter">
                            <tr>
                                <th class="px-3.5 py-2.5 whitespace-nowrap w-44">เลขที่ / ประเภท</th>
                                <th class="px-3.5 py-2.5 min-w-[240px]">ลูกค้าและโครงการ</th>
                                <th class="px-3.5 py-2.5 whitespace-nowrap w-32">วันที่เอกสาร</th>
                                <th class="px-3.5 py-2.5 whitespace-nowrap w-32">ครบกำหนด</th>
                                <th class="px-3.5 py-2.5 whitespace-nowrap w-32 text-right">ยอดรวมสุทธิ</th>
                                <th class="px-3.5 py-2.5 whitespace-nowrap w-32 text-center">สถานะ</th>
                                <th class="px-3.5 py-2.5 whitespace-nowrap w-48 text-right">จัดการ</th>
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
                                <tr class="hover:bg-amber-50/40 transition">
                                    <td class="px-3.5 py-3 whitespace-nowrap">
                                        <div class="font-bold text-stone-900 font-typewriter text-sm">${d.code}</div>
                                        <div class="mt-1">${app.getDocTypeBadge(d.type)}</div>
                                    </td>
                                    <td class="px-3.5 py-3 min-w-[240px]">
                                        <div class="font-bold text-stone-900 text-xs">${d.customer_name || '-'}</div>
                                        ${d.project_name_custom || d.project_name ? `
                                            <div class="text-[11px] text-indigo-900 font-medium mt-0.5">📌 ${d.project_name_custom || d.project_name}</div>
                                        ` : ''}
                                    </td>
                                    <td class="px-3.5 py-3 text-xs text-stone-600 whitespace-nowrap">
                                        ${app.formatDateThai(d.issue_date)}
                                    </td>
                                    <td class="px-3.5 py-3 text-xs text-stone-500 whitespace-nowrap">
                                        ${d.due_date ? app.formatDateThai(d.due_date) : '-'}
                                    </td>
                                    <td class="px-3.5 py-3 text-right font-bold text-stone-900 whitespace-nowrap">
                                        ฿${app.formatCurrency(d.grand_total)}
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
                                        ${d.status !== 'cancelled' ? `
                                            <button onclick="window.documentsModule.openConvertModal(${d.id}, '${d.type}', '${d.code}')" class="btn-paper text-xs py-1 px-2" title="แปลงเป็นเอกสารขั้นถัดไป">
                                                🔄 แปลง
                                            </button>
                                            ${d.type === 'billing' && d.status !== 'paid' ? `
                                                <button onclick="window.documentsModule.markPaid(${d.id})" class="btn-paper text-xs py-1 px-2 text-emerald-800 border-emerald-800 bg-emerald-50" title="ทำเครื่องหมายว่าชำระแล้ว">
                                                    ✓ ชำระแล้ว
                                                </button>
                                            ` : ''}
                                            <button onclick="window.documentsModule.duplicate(${d.id})" class="btn-paper text-xs py-1 px-2" title="คัดลอกสร้างฉบับใหม่">
                                                📋
                                            </button>
                                            <button onclick="window.documentsModule.openCancelModal(${d.id}, '${d.code}')" class="btn-paper text-xs py-1 px-2 text-rose-700 border-rose-800" title="ยกเลิกเอกสารนี้">
                                                🚫
                                            </button>
                                        ` : `
                                            <span class="text-xs text-rose-700 font-bold">ยกเลิกแล้ว</span>
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

    setFilter(key1, val1, key2 = null, val2 = null) {
        this.filters[key1] = val1;
        if (key2) this.filters[key2] = val2;
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

    resetFilters() {
        this.filters = {
            type: 'all',
            status: 'all',
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
        const container = document.getElementById('create-doc-content');
        if (!container) return;

        const defaultType = options.type || 'quotation';
        const defaultDate = new Date().toISOString().slice(0, 10);

        container.innerHTML = `
            <div class="flex items-center justify-center p-16 text-slate-500">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span class="ml-3 text-sm font-medium">กำลังเตรียมแบบฟอร์มออกเอกสาร...</span>
            </div>
        `;

        try {
            const [customersRes, nextCodeRes, reservationsRes] = await Promise.all([
                api.getCustomers(),
                api.getNextCode(defaultType, defaultDate),
                api.getReservations(defaultType, 'reserved')
            ]);

            const customers = customersRes.data;
            const nextCodePreview = nextCodeRes.data.code;
            const availableReservations = reservationsRes.data;

            // Initialize default items (1 empty item)
            this.formData.items = [
                { product_name: '', image_url: '', quantity: 1, unit: 'ชิ้น', unit_price: 0, discount: 0, discount_type: 'amount', total_price: 0 }
            ];

            this.renderCreateForm({
                type: defaultType,
                issue_date: defaultDate,
                customers,
                nextCodePreview,
                availableReservations,
                selectedCustomerId: options.customer_id || null,
                selectedProjectId: options.project_id || null,
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
            type, issue_date, customers, nextCodePreview,
            availableReservations, selectedCustomerId, selectedProjectId, useReservedCode
        } = ctx;

        container.innerHTML = `
            <div class="max-w-5xl mx-auto typewriter-card rounded-xl p-6 md:p-8 font-mono">
                <!-- Form Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-stone-800">
                    <div>
                        <span class="text-xs font-bold text-stone-700 uppercase tracking-wider font-mono">[ ระบบพิมพ์ดีดและจัดการเอกสารธุรกิจ ]</span>
                        <h2 class="text-2xl font-bold text-stone-900 font-typewriter mt-1" id="form-doc-title">
                            ✍️ สอดกระดาษพิมพ์ออกบิลใหม่
                        </h2>
                    </div>
                    <div class="flex items-center gap-2">
                        <button type="button" onclick="app.switchTab('documents')" class="btn-paper text-xs">
                            ✕ ยกเลิก
                        </button>
                    </div>
                </div>

                <form id="doc-create-form" onsubmit="event.preventDefault(); window.documentsModule.submitDocument();" class="mt-6 space-y-6">
                    <!-- Section 1: Document Type & Numbering Setup -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-5 p-5 bg-[#faf6ee] rounded-xl border-2 border-stone-800">
                        <!-- Doc Type -->
                        <div>
                            <label class="block text-xs font-bold text-stone-800 mb-1.5 font-typewriter">
                                ประเภทเอกสาร <span class="text-red-700">*</span>
                            </label>
                            <select id="doc-type-select" name="type" class="w-full px-3 py-2 text-sm bg-white border-2 border-stone-800 rounded font-bold text-stone-900" onchange="window.documentsModule.onDocTypeChanged(this.value)">
                                <option value="quotation" ${type === 'quotation' ? 'selected' : ''}>[QT] ใบเสนอราคา (Quotation)</option>
                                <option value="billing" ${type === 'billing' ? 'selected' : ''}>[INV] ใบแจ้งหนี้ / วางบิล (Billing Note)</option>
                                <option value="receipt" ${type === 'receipt' ? 'selected' : ''}>[RE] ใบเสร็จรับเงิน (Receipt)</option>
                            </select>
                        </div>

                        <!-- Code Assignment Mode (Auto / Reserved for Backdating / Custom) -->
                        <div class="md:col-span-2">
                            <label class="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                                <span>เลขที่เอกสาร <span class="text-rose-500">*</span></span>
                                <span class="text-[11px] text-purple-600 font-medium">รองรับการใช้เลขที่กันไว้ออกย้อนหลัง</span>
                            </label>

                            <div class="space-y-2">
                                <div class="flex items-center gap-4 text-xs">
                                    <label class="inline-flex items-center gap-1.5 cursor-pointer">
                                        <input type="radio" name="code_mode" value="auto" ${!useReservedCode ? 'checked' : ''} onchange="window.documentsModule.toggleCodeMode('auto')" class="text-blue-600">
                                        <span class="font-medium text-slate-700">รันเลขอัตโนมัติ (ปัจจุบัน)</span>
                                    </label>
                                    <label class="inline-flex items-center gap-1.5 cursor-pointer">
                                        <input type="radio" name="code_mode" value="reserved" ${useReservedCode ? 'checked' : ''} onchange="window.documentsModule.toggleCodeMode('reserved')" class="text-purple-600">
                                        <span class="font-semibold text-purple-700">ดึงเลขที่เคยกันไว้ (สำหรับบิลย้อนหลัง)</span>
                                    </label>
                                </div>

                                <!-- Container for Auto Code Display -->
                                <div id="code-auto-container" class="${useReservedCode ? 'hidden' : ''}">
                                    <div class="flex items-center gap-2">
                                        <input type="text" id="auto-code-preview" value="${nextCodePreview}" readonly class="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-700">
                                        <span class="text-[11px] text-slate-400 whitespace-nowrap">ระบบจะล็อกเลขนี้ตอนกดบันทึก</span>
                                    </div>
                                </div>

                                <!-- Container for Reserved Code Dropdown -->
                                <div id="code-reserved-container" class="${useReservedCode ? '' : 'hidden'}">
                                    <select id="reserved-code-select" class="w-full px-3 py-2 bg-purple-50 border border-purple-200 text-purple-950 font-mono font-bold text-sm rounded-xl focus:outline-none">
                                        ${availableReservations.length === 0 ? `
                                            <option value="">-- ไม่มีเลขที่กันไว้สำหรับประเภทนี้ (ไปที่แท็บ 'คลังเลขที่กันไว้' เพื่อกดกันเลข) --</option>
                                        ` : availableReservations.map(r => `
                                            <option value="${r.code}" ${useReservedCode === r.code ? 'selected' : ''}>
                                                ${r.code} ${r.note ? `— [${r.note}]` : ''}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Section 2: Customer, Project & Dates -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <!-- Customer Dropdown -->
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                                <span>เลือกลูกค้า <span class="text-rose-500">*</span></span>
                                <button type="button" onclick="window.customersModule.openCustomerModal()" class="text-[11px] text-blue-600 font-semibold hover:underline">
                                    + เพิ่มลูกค้าใหม่
                                </button>
                            </label>
                            <select id="doc-customer-select" name="customer_id" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" onchange="window.documentsModule.onCustomerSelected(this.value)">
                                <option value="">-- เลือกลูกค้า --</option>
                                ${customers.map(c => `
                                    <option value="${c.id}" ${selectedCustomerId == c.id ? 'selected' : ''}>${c.name}</option>
                                `).join('')}
                            </select>

                            <!-- Customer info snippet -->
                            <div id="customer-info-box" class="mt-2 text-xs text-slate-500 p-3 bg-slate-50 rounded-xl border border-slate-100 hidden">
                                <div id="c-box-tax" class="font-mono text-[11px]"></div>
                                <div id="c-box-address" class="mt-0.5"></div>
                            </div>
                        </div>

                        <!-- Project / Billing Title (หลายหัวบิลต่อลูกค้า) -->
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                                <span>โครงการ / หัวบิลย่อย (แยกตามลูกค้า)</span>
                                <span class="text-[10px] text-slate-400">สำหรับจัดกลุ่มบิล</span>
                            </label>
                            <select id="doc-project-select" name="project_id" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" onchange="window.documentsModule.onProjectSelected(this.value)">
                                <option value="">-- ใช้หัวบิลทั่วไปของลูกค้า (ไม่ระบุโครงการ) --</option>
                            </select>
                            <div class="mt-2">
                                <input type="text" id="project-name-custom" name="project_name_custom" placeholder="หรือพิมพ์ระบุชื่อหัวบิล/โครงการที่นี่..." class="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500">
                            </div>
                        </div>

                        <!-- Issue Date (รองรับลงย้อนหลัง) -->
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1.5">
                                วันที่ออกเอกสาร (ลงวันที่ย้อนหลังได้) <span class="text-rose-500">*</span>
                            </label>
                            <input type="date" id="doc-issue-date" name="issue_date" value="${issue_date}" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none" onchange="window.documentsModule.onDateChanged(this.value)">
                        </div>

                        <!-- Due Date -->
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1.5">
                                วันที่ครบกำหนด / มีผลถึงวันที่
                            </label>
                            <input type="date" id="doc-due-date" name="due_date" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none">
                        </div>
                    </div>

                    <!-- Section 3: Dynamic Items Table -->
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <h3 class="text-sm font-bold text-slate-800 font-heading">รายการสินค้า / บริการ</h3>
                                <p class="text-xs text-slate-400">ระบุจำนวน หน่วย และราคาต่อหน่วย (ระบบคำนวณอัตโนมัติ)</p>
                            </div>
                            <button type="button" onclick="window.documentsModule.addItemRow()" class="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition">
                                + เพิ่มแถวรายการ
                            </button>
                        </div>

                        <div class="overflow-x-auto border border-slate-200 rounded-2xl">
                            <table class="w-full text-xs text-left">
                                <thead class="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-semibold">
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
                                <textarea id="doc-payment-terms" rows="2" class="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-slate-700">${app.state.company ? app.state.company.default_terms || '' : ''}</textarea>
                            </div>

                            <div>
                                <div class="flex items-center justify-between mb-1.5">
                                    <label class="text-xs font-bold text-slate-700">หมายเหตุท้ายเอกสาร</label>
                                    <button type="button" onclick="window.documentsModule.insertPreset('remark', 'เอกสารนี้ออกโดยไม่มีภาษีมูลค่าเพิ่ม (ผู้ขายไม่ได้จดทะเบียน VAT)')" class="text-[11px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-600 transition">+ ข้อความไม่มี VAT</button>
                                </div>
                                <textarea id="doc-remark" rows="2" class="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-slate-700">${app.state.company ? app.state.company.default_remark || '' : ''}</textarea>
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
                                    <input type="number" id="doc-discount-total" value="0" min="0" step="0.01" class="w-full px-2 py-1 text-right text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" oninput="window.documentsModule.recalculate()">
                                </div>
                            </div>

                            <div class="flex items-center justify-between text-sm font-bold text-slate-900 pt-3 border-t border-slate-200">
                                <span class="text-base font-heading">ยอดเงินรวมสุทธิ (Grand Total):</span>
                                <span class="text-xl text-blue-700 font-heading font-bold" id="calc-grand-total">฿0.00</span>
                            </div>

                            <!-- Live Thai Baht Text -->
                            <div class="p-3 bg-blue-50/80 rounded-xl border border-blue-100 text-xs">
                                <span class="text-blue-700 font-bold">จำนวนเงินเป็นตัวอักษร:</span>
                                <div class="font-semibold text-blue-950 mt-0.5" id="calc-thai-baht">ศูนย์บาทถ้วน</div>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="pt-6 border-t-2 border-stone-800 flex flex-col md:flex-row items-center justify-end gap-3 font-mono">
                        <button type="button" onclick="app.switchTab('documents')" class="btn-paper w-full md:w-auto">
                            ✕ ยกเลิก
                        </button>
                        <button type="button" onclick="window.documentsModule.submitDocument('draft')" class="btn-paper w-full md:w-auto">
                            💾 บันทึกเป็นฉบับร่าง (Draft)
                        </button>
                        <button type="submit" class="btn-typewriter w-full md:w-auto">
                            <span>✓ สอดกระดาษ & บันทึกเปิดพิมพ์ A4</span>
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

        tbody.innerHTML = this.formData.items.map((item, idx) => `
            <tr class="hover:bg-slate-50/60 transition">
                <td class="px-3 py-2 text-center text-slate-400 font-mono font-medium">${idx + 1}</td>
                <td class="px-3 py-2">
                    <div class="flex items-center gap-2">
                        <!-- Thumbnail upload/preview -->
                        <div class="relative shrink-0">
                            ${item.image_url ? `
                                <div class="relative group">
                                    <img src="${item.image_url}" alt="Item" class="w-9 h-9 object-cover rounded-lg border border-slate-200 bg-white">
                                    <button type="button" onclick="window.documentsModule.removeItemImage(${idx})" title="ลบรูปภาพ" class="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] shadow transition">✕</button>
                                </div>
                            ` : `
                                <label class="w-9 h-9 border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-lg flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-blue-600 transition text-[11px]" title="แนบรูปสินค้า (เหมาะสำหรับใบเสนอราคา)">
                                    <span>📷</span>
                                    <input type="file" accept="image/*" class="hidden" onchange="window.documentsModule.handleImageUpload(${idx}, event)">
                                </label>
                            `}
                        </div>
                        <input type="text" value="${item.product_name || ''}" placeholder="ชื่อสินค้า, บริการ หรือรายละเอียดงาน" 
                            class="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                            oninput="window.documentsModule.updateItemField(${idx}, 'product_name', this.value)">
                    </div>
                </td>
                <td class="px-3 py-2">
                    <input type="number" step="0.01" min="0" value="${item.quantity}" 
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
                <td class="px-3 py-2 text-center">
                    <button type="button" onclick="window.documentsModule.removeItemRow(${idx})" class="text-slate-300 hover:text-rose-500 font-bold text-sm transition" title="ลบแถว">
                        ✕
                    </button>
                </td>
            </tr>
        `).join('');
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
        this.formData.items[index][field] = value;

        // Recalculate row total
        const qty = parseFloat(this.formData.items[index].quantity) || 0;
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
            const qty = parseFloat(it.quantity) || 0;
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
    },

    toggleCodeMode(mode) {
        const autoBox = document.getElementById('code-auto-container');
        const reservedBox = document.getElementById('code-reserved-container');

        if (mode === 'reserved') {
            if (autoBox) autoBox.classList.add('hidden');
            if (reservedBox) reservedBox.classList.remove('hidden');
        } else {
            if (autoBox) autoBox.classList.remove('hidden');
            if (reservedBox) reservedBox.classList.add('hidden');
        }
    },

    async onDocTypeChanged(type) {
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
                if (resRes.data.length === 0) {
                    resSelect.innerHTML = '<option value="">-- ไม่มีเลขที่กันไว้สำหรับประเภทนี้ (ไปที่แท็บ "คลังเลขที่กันไว้" เพื่อกดกันเลข) --</option>';
                } else {
                    resSelect.innerHTML = resRes.data.map(r => `
                        <option value="${r.code}">${r.code} ${r.note ? `— [${r.note}]` : ''}</option>
                    `).join('');
                }
            }
        } catch (e) {
            console.error(e);
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
                        opt.textContent = `📌 ${p.project_name}${p.contact_person ? ` (${p.contact_person})` : ''}`;
                        projectSelect.appendChild(opt);
                    });
                }
            }
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
        const remark = document.getElementById('doc-remark').value.trim();

        const code_mode = form.code_mode.value;
        let specified_code = null;
        if (code_mode === 'reserved') {
            const resSelect = document.getElementById('reserved-code-select');
            specified_code = resSelect ? resSelect.value : null;
            if (!specified_code) {
                app.toast('กรุณาเลือกเลขที่กันไว้ หรือเปลี่ยนเป็นรันเลขอัตโนมัติ', 'warning');
                return;
            }
        }

        if (!customer_id) {
            app.toast('กรุณาเลือกลูกค้า', 'warning');
            return;
        }
        if (!issue_date) {
            app.toast('กรุณาระบุวันที่ออกเอกสาร', 'warning');
            return;
        }

        // Validate items
        const validItems = this.formData.items.filter(it => it.product_name && it.product_name.trim());
        if (validItems.length === 0) {
            app.toast('กรุณาระบุรายการสินค้าอย่างน้อย 1 รายการ', 'warning');
            return;
        }

        const payload = {
            code_mode,
            specified_code,
            type,
            customer_id: parseInt(customer_id, 10),
            project_id: project_id ? parseInt(project_id, 10) : null,
            project_name_custom,
            issue_date,
            due_date,
            items: validItems,
            discount_total,
            status: statusOverride || 'issued',
            remark,
            payment_terms
        };

        try {
            const res = await api.createDocument(payload);
            app.toast(res.message, 'success');
            window.printModule.openPrint(res.data.id);
        } catch (err) {
            app.toast(err.message, 'error');
        }
    },

    // Actions
    openConvertModal(id, currentType, code) {
        app.state.pendingConvertDoc = { id, currentType, code };
        const label = document.getElementById('modal-convert-source');
        if (label) label.textContent = `${app.getDocTypeBadge(currentType)} เลขที่ ${code}`;

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
    },

    async submitConvert() {
        if (!app.state.pendingConvertDoc) return;
        const targetType = document.getElementById('convert-target-type').value;

        try {
            const res = await api.convertDocument(app.state.pendingConvertDoc.id, {
                target_type: targetType
            });
            app.closeModal('modal-convert');
            app.toast(res.message, 'success');
            window.printModule.openPrint(res.data.id);
        } catch (err) {
            app.toast(err.message, 'error');
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

    async markPaid(id) {
        if (!confirm('ยืนยันบันทึกสถานะเป็น "ชำระเงินแล้ว"?')) return;

        try {
            await api.markPaid(id);
            app.toast('บันทึกสถานะชำระเงินเรียบร้อยแล้ว', 'success');
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
