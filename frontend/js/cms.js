/**
 * Website CMS Controller (v2.3)
 * Standalone Content Management System for Kequiv Storefront
 */

const cmsModule = {
    state: {
        activeTab: 'general',
        content: {},
        services: [],
        portfolio: [],
        leads: [],
        currentEditingService: null,
        currentEditingPortfolio: null
    },

    async init() {
        console.log('CMS Module Initializing...');
        await this.loadAll();
        this.render();
    },

    async loadAll() {
        try {
            const [contentRes, servicesRes, portfolioRes, leadsRes] = await Promise.all([
                api.getCmsContent().catch(() => ({ data: {} })),
                api.getCmsServices().catch(() => ({ data: [] })),
                api.getCmsPortfolio().catch(() => ({ data: [] })),
                api.getLeads().catch(() => ({ data: [] }))
            ]);

            this.state.content = contentRes.data || {};
            this.state.services = servicesRes.data || [];
            this.state.portfolio = portfolioRes.data || [];
            this.state.leads = leadsRes.data || [];
        } catch (err) {
            console.error('CMS loadAll error:', err);
        }
    },

    switchTab(tabName) {
        this.state.activeTab = tabName || 'general';
        document.querySelectorAll('.cms-tab-btn').forEach(btn => {
            const btnTab = btn.getAttribute('data-tab');
            if (btnTab === this.state.activeTab) {
                btn.classList.add('bg-sky-600', 'text-white', 'shadow-xs');
                btn.classList.remove('text-slate-600', 'dark:text-slate-300', 'hover:bg-slate-200', 'dark:hover:bg-slate-800');
            } else {
                btn.classList.remove('bg-sky-600', 'text-white', 'shadow-xs');
                btn.classList.add('text-slate-600', 'dark:text-slate-300', 'hover:bg-slate-200', 'dark:hover:bg-slate-800');
            }
        });

        document.querySelectorAll('.cms-tab-pane').forEach(pane => {
            const paneName = pane.getAttribute('data-pane') || pane.id.replace('cms-pane-', '');
            pane.classList.toggle('hidden', paneName !== this.state.activeTab);
        });
    },

    render() {
        this.renderGeneral();
        this.renderServices();
        this.renderPortfolio();
        this.renderLeads();
        this.switchTab(this.state.activeTab || 'general');
    },

    // -------------------------------------------------------------
    // Tab 1: General Content
    // -------------------------------------------------------------
    renderGeneral() {
        const container = document.getElementById('cms-pane-general');
        if (!container) return;
        const c = this.state.content;

        container.innerHTML = `
            <div class="max-w-4xl mx-auto space-y-6 font-mono text-xs">
                <div class="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span>🏠</span> ส่วนหัวและแบนเนอร์ต้อนรับ (Hero Section)
                            </h3>
                            <p class="text-[11px] text-slate-500 mt-0.5">ข้อความที่ปรากฏบนสุดของหน้าแรก</p>
                        </div>
                        <button type="button" onclick="cmsModule.saveGeneral()" class="btn-ocean py-2 px-4 text-xs">
                            💾 บันทึกการเปลี่ยนแปลง
                        </button>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">ป้ายกำกับด้านบน (Badge):</label>
                            <input type="text" id="cms-hero-badge" value="${this.escapeHtml(c.hero_badge || '')}"
                                class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500">
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">ชื่อร้านหลัก (Title):</label>
                                <input type="text" id="cms-hero-title" value="${this.escapeHtml(c.hero_title || '')}"
                                    class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">สโลแกนบริการ (Subtitle):</label>
                                <input type="text" id="cms-hero-subtitle" value="${this.escapeHtml(c.hero_subtitle || '')}"
                                    class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500">
                            </div>
                        </div>

                        <div>
                            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">คำบรรยายแนะนำบริการ (Hero Description):</label>
                            <textarea id="cms-hero-desc" rows="3"
                                class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500">${this.escapeHtml(c.hero_description || '')}</textarea>
                        </div>
                    </div>
                </div>

                <!-- Contact & Office Info -->
                <div class="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                        <span>📍</span> ข้อมูลติดต่อและที่ตั้งสำนักงาน
                    </h3>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">เบอร์โทรศัพท์ร้าน:</label>
                            <input type="text" id="cms-phone" value="${this.escapeHtml(c.phone || '')}"
                                class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">LINE Official Account ID:</label>
                            <input type="text" id="cms-line-id" value="${this.escapeHtml(c.line_id || '')}"
                                class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">ลิงก์แอด LINE (URL):</label>
                            <input type="text" id="cms-line-url" value="${this.escapeHtml(c.line_url || '')}"
                                class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">อีเมลติดต่อ:</label>
                            <input type="text" id="cms-email" value="${this.escapeHtml(c.email || '')}"
                                class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
                        </div>
                        <div class="sm:col-span-2">
                            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">ที่ตั้งสำนักงานใหญ่ (พะเยา):</label>
                            <input type="text" id="cms-addr-phayao" value="${this.escapeHtml(c.address_phayao || '')}"
                                class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
                        </div>
                        <div class="sm:col-span-2">
                            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">ที่ตั้งสาขาเชียงใหม่:</label>
                            <input type="text" id="cms-addr-cm" value="${this.escapeHtml(c.address_cm || '')}"
                                class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
                        </div>
                        <div class="sm:col-span-2">
                            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">เวลาทำการ:</label>
                            <input type="text" id="cms-hours" value="${this.escapeHtml(c.business_hours || '')}"
                                class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
                        </div>
                    </div>

                    <div class="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button type="button" onclick="cmsModule.saveGeneral()" class="btn-ocean py-2 px-5 text-xs">
                            💾 บันทึกข้อมูลทั้งหมด
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    async saveGeneral() {
        const payload = {
            hero_badge: document.getElementById('cms-hero-badge')?.value?.trim(),
            hero_title: document.getElementById('cms-hero-title')?.value?.trim(),
            hero_subtitle: document.getElementById('cms-hero-subtitle')?.value?.trim(),
            hero_description: document.getElementById('cms-hero-desc')?.value?.trim(),
            phone: document.getElementById('cms-phone')?.value?.trim(),
            line_id: document.getElementById('cms-line-id')?.value?.trim(),
            line_url: document.getElementById('cms-line-url')?.value?.trim(),
            email: document.getElementById('cms-email')?.value?.trim(),
            address_phayao: document.getElementById('cms-addr-phayao')?.value?.trim(),
            address_cm: document.getElementById('cms-addr-cm')?.value?.trim(),
            business_hours: document.getElementById('cms-hours')?.value?.trim()
        };

        try {
            await api.updateCmsContent(payload);
            this.state.content = { ...this.state.content, ...payload };
            if (window.app) window.app.toast('บันทึกข้อมูลเว็บไซต์เรียบร้อยแล้ว', 'success');
            // Refresh storefront elements if on same page
            if (window.storefront && typeof window.storefront.refreshFromCms === 'function') {
                window.storefront.refreshFromCms(this.state.content);
            }
        } catch (err) {
            if (window.app) window.app.toast(err.message || 'บันทึกข้อมูลล้มเหลว', 'error');
        }
    },

    // -------------------------------------------------------------
    // Tab 2: Services CMS
    // -------------------------------------------------------------
    renderServices() {
        const container = document.getElementById('cms-pane-services');
        if (!container) return;

        const services = this.state.services || [];
        const categories = [
            { key: 'cctv', label: '📹 กล้องวงจรปิด (CCTV)' },
            { key: 'network', label: '💻 ไอที-เน็ตเวิร์ก (Network)' },
            { key: 'systems', label: '⚡ ระบบไฟฟ้า & MDB (Systems)' },
            { key: 'other', label: '🛠️ บริการอื่นๆ (Other)' }
        ];

        let html = `
            <div class="max-w-5xl mx-auto space-y-6 font-mono text-xs">
                <div class="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div>
                        <h3 class="text-sm font-bold text-slate-900 dark:text-white">รายการบริการบนเว็บไซต์ (${services.length} รายการ)</h3>
                        <p class="text-[11px] text-slate-500">จัดการรายละเอียดบริการ 3 เสาหลัก และบริการอื่นๆ ที่แสดงหน้าร้าน</p>
                    </div>
                    <button type="button" onclick="cmsModule.openServiceModal()" class="btn-ocean py-2 px-3.5 text-xs">
                        + เพิ่มบริการใหม่
                    </button>
                </div>
        `;

        categories.forEach(cat => {
            const list = services.filter(s => s.category === cat.key);
            html += `
                <div class="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    <h4 class="text-xs font-bold text-sky-600 dark:text-sky-400 pb-2 mb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span>${cat.label}</span>
                        <span class="text-[11px] font-normal text-slate-400">${list.length} รายการ</span>
                    </h4>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            `;

            if (list.length === 0) {
                html += `<div class="col-span-2 text-center py-4 text-slate-400">ยังไม่มีรายการในหมวดนี้</div>`;
            } else {
                list.forEach(item => {
                    html += `
                        <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col justify-between">
                            <div>
                                <div class="flex items-center gap-2 mb-1.5">
                                    <span class="text-lg">${item.icon || '⚡'}</span>
                                    <h5 class="font-bold text-slate-900 dark:text-white text-xs">${this.escapeHtml(item.title)}</h5>
                                </div>
                                <p class="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                    ${this.escapeHtml(item.description)}
                                </p>
                            </div>
                            <div class="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                                <button type="button" onclick="cmsModule.editService(${item.id})" class="text-sky-600 hover:underline">แก้ไข</button>
                                <span class="text-slate-300 dark:text-slate-700">•</span>
                                <button type="button" onclick="cmsModule.deleteService(${item.id})" class="text-rose-500 hover:underline">ลบ</button>
                            </div>
                        </div>
                    `;
                });
            }

            html += `
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    },

    openServiceModal(item = null) {
        this.state.currentEditingService = item;
        const modal = document.getElementById('modal-cms-service');
        if (!modal) return;

        document.getElementById('form-cms-service-id').value = item ? item.id : '';
        document.getElementById('form-cms-service-cat').value = item ? item.category : 'cctv';
        document.getElementById('form-cms-service-icon').value = item ? item.icon : '⚡';
        document.getElementById('form-cms-service-title').value = item ? item.title : '';
        document.getElementById('form-cms-service-desc').value = item ? item.description : '';
        document.getElementById('form-cms-service-bullets').value = item ? item.bullets : '';
        document.getElementById('form-cms-service-order').value = item ? item.sort_order : '0';

        document.getElementById('modal-cms-service-title').textContent = item ? 'แก้ไขบริการ' : 'เพิ่มบริการใหม่';
        modal.classList.remove('hidden');
    },

    closeServiceModal() {
        document.getElementById('modal-cms-service')?.classList.add('hidden');
    },

    editService(id) {
        const item = this.state.services.find(s => s.id === id);
        if (item) this.openServiceModal(item);
    },

    async saveServiceForm(e) {
        e.preventDefault();
        const id = document.getElementById('form-cms-service-id')?.value;
        const payload = {
            category: document.getElementById('form-cms-service-cat')?.value,
            icon: document.getElementById('form-cms-service-icon')?.value?.trim() || '⚡',
            title: document.getElementById('form-cms-service-title')?.value?.trim(),
            description: document.getElementById('form-cms-service-desc')?.value?.trim(),
            bullets: document.getElementById('form-cms-service-bullets')?.value?.trim(),
            sort_order: Number(document.getElementById('form-cms-service-order')?.value || 0)
        };

        if (!payload.title) {
            if (window.app) window.app.toast('กรุณากรอกชื่อบริการ', 'error');
            return;
        }

        try {
            if (id) {
                await api.updateCmsService(id, payload);
                if (window.app) window.app.toast('อัปเดตบริการเรียบร้อย', 'success');
            } else {
                await api.createCmsService(payload);
                if (window.app) window.app.toast('เพิ่มบริการใหม่เรียบร้อย', 'success');
            }
            this.closeServiceModal();
            const res = await api.getCmsServices();
            this.state.services = res.data || [];
            this.renderServices();
        } catch (err) {
            if (window.app) window.app.toast(err.message || 'เกิดข้อผิดพลาด', 'error');
        }
    },

    async deleteService(id) {
        if (!confirm('ยืนยันที่จะลบบริการนี้ออกจากเว็บไซต์?')) return;
        try {
            await api.deleteCmsService(id);
            if (window.app) window.app.toast('ลบบริการเรียบร้อย', 'info');
            this.state.services = this.state.services.filter(s => s.id !== id);
            this.renderServices();
        } catch (err) {
            if (window.app) window.app.toast(err.message, 'error');
        }
    },

    // -------------------------------------------------------------
    // Tab 3: Portfolio CMS
    // -------------------------------------------------------------
    renderPortfolio() {
        const container = document.getElementById('cms-pane-portfolio');
        if (!container) return;

        const portfolio = this.state.portfolio || [];
        let html = `
            <div class="max-w-5xl mx-auto space-y-6 font-mono text-xs">
                <div class="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div>
                        <h3 class="text-sm font-bold text-slate-900 dark:text-white">จัดการผลงานจริง (Portfolio Showcase - ${portfolio.length} รายการ)</h3>
                        <p class="text-[11px] text-slate-500">ผลงานและโครงการที่แสดงบนหน้าแรกเพื่อสร้างความน่าเชื่อถือ</p>
                    </div>
                    <button type="button" onclick="cmsModule.openPortfolioModal()" class="btn-ocean py-2 px-3.5 text-xs">
                        + เพิ่มผลงานใหม่
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        `;

        if (portfolio.length === 0) {
            html += `<div class="col-span-3 text-center py-8 text-slate-400">ยังไม่มีรายการผลงาน</div>`;
        } else {
            portfolio.forEach(item => {
                html += `
                    <div class="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
                        <div>
                            <div class="flex items-center justify-between gap-2 mb-2">
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                                    ${this.escapeHtml(item.tag || item.category)}
                                </span>
                                <span class="text-[10px] text-emerald-600 font-bold">${this.escapeHtml(item.status || 'ส่งมอบงานแล้ว')}</span>
                            </div>
                            <h4 class="font-bold text-slate-900 dark:text-white text-xs mb-1">${this.escapeHtml(item.title)}</h4>
                            <p class="text-[11px] text-sky-600 dark:text-sky-400 mb-2">📍 ${this.escapeHtml(item.location)}</p>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                ${this.escapeHtml(item.description)}
                            </p>
                        </div>

                        <div class="flex items-center justify-end gap-2 mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                            <button type="button" onclick="cmsModule.editPortfolio(${item.id})" class="text-sky-600 hover:underline">แก้ไข</button>
                            <span class="text-slate-300 dark:text-slate-700">•</span>
                            <button type="button" onclick="cmsModule.deletePortfolio(${item.id})" class="text-rose-500 hover:underline">ลบ</button>
                        </div>
                    </div>
                `;
            });
        }

        html += `</div></div>`;
        container.innerHTML = html;
    },

    openPortfolioModal(item = null) {
        this.state.currentEditingPortfolio = item;
        const modal = document.getElementById('modal-cms-portfolio');
        if (!modal) return;

        document.getElementById('form-cms-port-id').value = item ? item.id : '';
        document.getElementById('form-cms-port-cat').value = item ? item.category : 'cctv';
        document.getElementById('form-cms-port-tag').value = item ? item.tag : 'กล้องวงจรปิด IP 4K';
        document.getElementById('form-cms-port-title').value = item ? item.title : '';
        document.getElementById('form-cms-port-location').value = item ? item.location : '';
        document.getElementById('form-cms-port-desc').value = item ? item.description : '';
        document.getElementById('form-cms-port-status').value = item ? item.status : '✓ ตรวจรับเรียบร้อย';

        document.getElementById('modal-cms-portfolio-title').textContent = item ? 'แก้ไขผลงาน' : 'เพิ่มผลงานใหม่';
        modal.classList.remove('hidden');
    },

    closePortfolioModal() {
        document.getElementById('modal-cms-portfolio')?.classList.add('hidden');
    },

    editPortfolio(id) {
        const item = this.state.portfolio.find(p => p.id === id);
        if (item) this.openPortfolioModal(item);
    },

    async savePortfolioForm(e) {
        e.preventDefault();
        const id = document.getElementById('form-cms-port-id')?.value;
        const payload = {
            category: document.getElementById('form-cms-port-cat')?.value,
            tag: document.getElementById('form-cms-port-tag')?.value?.trim(),
            title: document.getElementById('form-cms-port-title')?.value?.trim(),
            location: document.getElementById('form-cms-port-location')?.value?.trim(),
            description: document.getElementById('form-cms-port-desc')?.value?.trim(),
            status: document.getElementById('form-cms-port-status')?.value?.trim() || '✓ ตรวจรับเรียบร้อย'
        };

        if (!payload.title || !payload.location) {
            if (window.app) window.app.toast('กรุณากรอกชื่อผลงานและสถานที่', 'error');
            return;
        }

        try {
            if (id) {
                await api.updateCmsPortfolio(id, payload);
                if (window.app) window.app.toast('อัปเดตผลงานเรียบร้อย', 'success');
            } else {
                await api.createCmsPortfolio(payload);
                if (window.app) window.app.toast('เพิ่มผลงานใหม่เรียบร้อย', 'success');
            }
            this.closePortfolioModal();
            const res = await api.getCmsPortfolio();
            this.state.portfolio = res.data || [];
            this.renderPortfolio();
        } catch (err) {
            if (window.app) window.app.toast(err.message || 'เกิดข้อผิดพลาด', 'error');
        }
    },

    async deletePortfolio(id) {
        if (!confirm('ยืนยันที่จะลบผลงานนี้ออกจากเว็บไซต์?')) return;
        try {
            await api.deleteCmsPortfolio(id);
            if (window.app) window.app.toast('ลบผลงานเรียบร้อย', 'info');
            this.state.portfolio = this.state.portfolio.filter(p => p.id !== id);
            this.renderPortfolio();
        } catch (err) {
            if (window.app) window.app.toast(err.message, 'error');
        }
    },

    // -------------------------------------------------------------
    // Tab 4: Leads & Quotation Inquiries
    // -------------------------------------------------------------
    renderLeads() {
        const container = document.getElementById('cms-pane-leads');
        if (!container) return;

        const leads = this.state.leads || [];
        const pendingCount = leads.filter(l => l.status === 'pending').length;

        let html = `
            <div class="max-w-5xl mx-auto space-y-4 font-mono text-xs">
                <div class="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="text-sm font-bold text-slate-900 dark:text-white">คำขอใบเสนอราคาจากหน้าร้าน (Website Leads)</h3>
                            ${pendingCount > 0 ? `<span class="px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[10px]">${pendingCount} รอตอบกลับ</span>` : ''}
                        </div>
                        <p class="text-[11px] text-slate-500">ข้อมูลที่ลูกค้าส่งมาจากฟอร์มหน้าเว็บ สามารถแปลงเป็นลูกค้าและเปิดใบเสนอราคาต่อได้ทันที</p>
                    </div>
                    <button type="button" onclick="cmsModule.refreshLeads()" class="btn-paper py-1.5 px-3 text-xs">
                        🔄 รีเฟรชรายการ
                    </button>
                </div>
        `;

        if (leads.length === 0) {
            html += `
                <div class="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div class="text-3xl mb-2">📬</div>
                    <div>ยังไม่มีคำขอใบเสนอราคาเข้ามา</div>
                </div>
            `;
        } else {
            html += `<div class="space-y-3">`;
            leads.forEach(lead => {
                const isPending = lead.status === 'pending';
                const isConverted = lead.status === 'converted';

                html += `
                    <div class="p-4 rounded-2xl border ${isPending ? 'border-sky-300 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'} shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="space-y-1">
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="font-bold text-slate-900 dark:text-white text-sm">${this.escapeHtml(lead.name)}</span>
                                <span class="text-[10px] px-2 py-0.5 rounded font-bold ${
                                    isPending ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                    isConverted ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }">
                                    ${lead.status === 'pending' ? '⏳ รอดำเนินการ' : lead.status === 'converted' ? '✓ แปลงเป็นลูกค้าแล้ว' : 'ปิดงานแล้ว'}
                                </span>
                                <span class="text-[11px] text-slate-400">${lead.created_at || ''}</span>
                            </div>

                            <div class="text-[11px] text-slate-600 dark:text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                                <span>📞 <strong>โทร:</strong> <a href="tel:${this.escapeHtml(lead.phone)}" class="text-sky-600 hover:underline font-bold">${this.escapeHtml(lead.phone)}</a></span>
                                ${lead.line_id ? `<span>💬 <strong>LINE:</strong> <a href="https://line.me/R/ti/p/@vcv6921d" target="_blank" class="text-emerald-600 hover:underline">${this.escapeHtml(lead.line_id)}</a></span>` : ''}
                                ${lead.location ? `<span>📍 <strong>พื้นที่:</strong> ${this.escapeHtml(lead.location)}</span>` : ''}
                            </div>

                            <div class="text-[11px] text-slate-700 dark:text-slate-300 pt-1">
                                <span class="font-bold text-sky-700 dark:text-sky-400">บริการที่สนใจ:</span> ${this.escapeHtml(lead.service_type || '-')}
                            </div>

                            ${lead.details ? `<div class="text-[11px] text-slate-500 italic">"${this.escapeHtml(lead.details)}"</div>` : ''}
                        </div>

                        <!-- Actions -->
                        <div class="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                            ${!isConverted ? `
                                <button type="button" onclick="cmsModule.convertLead(${lead.id})" class="btn-ocean py-1.5 px-3 text-xs">
                                    ⚡ แปลงเป็นลูกค้า & ส่งไปออกบิล
                                </button>
                            ` : `
                                <button type="button" onclick="app.openBackoffice('create-doc')" class="btn-paper py-1.5 px-3 text-xs text-sky-600">
                                    ✍️ ไปเปิดใบเสนอราคา
                                </button>
                            `}
                            <button type="button" onclick="cmsModule.deleteLead(${lead.id})" class="p-1.5 text-slate-400 hover:text-rose-500 transition text-xs" title="ลบรายการ">
                                🗑️
                            </button>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        html += `</div>`;
        container.innerHTML = html;
    },

    async refreshLeads() {
        const res = await api.getLeads();
        this.state.leads = res.data || [];
        this.renderLeads();
    },

    async convertLead(id) {
        try {
            const res = await api.convertLeadToCustomer(id);
            if (window.app) window.app.toast('แปลงเป็นข้อมูลลูกค้าเรียบร้อยแล้ว กำลังนำท่านไปยังระบบออกบิล...', 'success');
            await this.refreshLeads();
            // Switch to Billing backoffice
            setTimeout(() => {
                if (window.app) window.app.openBackoffice('create-doc');
            }, 800);
        } catch (err) {
            if (window.app) window.app.toast(err.message, 'error');
        }
    },

    async deleteLead(id) {
        if (!confirm('ยืนยันลบคำขอนี้?')) return;
        try {
            await api.deleteLead(id);
            this.state.leads = this.state.leads.filter(l => l.id !== id);
            this.renderLeads();
        } catch (err) {
            if (window.app) window.app.toast(err.message, 'error');
        }
    },

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

window.cmsModule = cmsModule;
