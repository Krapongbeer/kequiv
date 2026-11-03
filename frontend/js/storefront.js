/**
 * Kequiv Storefront Controller (v2.3)
 * IT, CCTV, and Systems Solutions
 */

const storefront = {
    init() {
        console.log('Kequiv Storefront Initialized');
        this.setupEventListeners();
        this.loadCmsData();
    },

    async loadCmsData() {
        try {
            const [contentRes, servicesRes, portRes] = await Promise.all([
                api.getCmsContent().catch(() => null),
                api.getCmsServices().catch(() => null),
                api.getCmsPortfolio().catch(() => null)
            ]);

            if (contentRes && contentRes.data) {
                this.refreshFromCms(contentRes.data);
            }
        } catch (e) {
            console.warn('Failed to load dynamic CMS data:', e);
        }
    },

    refreshFromCms(c) {
        if (!c) return;
        const bEl = document.getElementById('store-hero-badge');
        if (bEl && c.hero_badge) bEl.textContent = c.hero_badge;

        const tEl = document.getElementById('store-hero-title');
        if (tEl && c.hero_title) tEl.innerHTML = this.escapeHtml(c.hero_title);

        const subEl = document.getElementById('store-hero-subtitle');
        if (subEl && c.hero_subtitle) subEl.textContent = c.hero_subtitle;

        const dEl = document.getElementById('store-hero-desc');
        if (dEl && c.hero_description) dEl.textContent = c.hero_description;

        const pEl = document.getElementById('store-contact-phone');
        if (pEl && c.phone) {
            pEl.textContent = c.phone;
            pEl.href = 'tel:' + c.phone.replace(/[^0-9]/g, '');
        }

        const lEl = document.getElementById('store-contact-line');
        if (lEl && c.line_id) lEl.textContent = c.line_id;

        const addrPEl = document.getElementById('store-contact-addr-phayao');
        if (addrPEl && c.address_phayao) addrPEl.textContent = c.address_phayao;

        const addrCEl = document.getElementById('store-contact-addr-cm');
        if (addrCEl && c.address_cm) addrCEl.textContent = c.address_cm;
    },

    setupEventListeners() {
        // Quotation Form submit
        const form = document.getElementById('form-quote-request');
        if (form) {
            form.addEventListener('submit', (e) => this.handleQuoteSubmit(e));
        }

        // Mobile storefront menu toggle
        const toggleBtn = document.getElementById('store-mobile-toggle');
        const mobileMenu = document.getElementById('store-mobile-menu');
        if (toggleBtn && mobileMenu) {
            toggleBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
            // Close mobile menu on clicking any link
            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.add('hidden');
                });
            });
        }
    },

    filterPortfolio(category, btnElement) {
        // Highlight active filter button
        document.querySelectorAll('.portfolio-filter-btn').forEach(btn => {
            btn.classList.remove('bg-sky-600', 'text-white', 'shadow-md');
            btn.classList.add('bg-white', 'text-slate-700', 'hover:bg-slate-100');
        });
        if (btnElement) {
            btnElement.classList.add('bg-sky-600', 'text-white', 'shadow-md');
            btnElement.classList.remove('bg-white', 'text-slate-700', 'hover:bg-slate-100');
        }

        // Filter cards
        const cards = document.querySelectorAll('.portfolio-card');
        cards.forEach(card => {
            const cardCat = card.getAttribute('data-category');
            if (category === 'all' || cardCat === category) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    },

    async handleQuoteSubmit(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-submit-lead');
        const name = document.getElementById('quote-name')?.value?.trim();
        const phone = document.getElementById('quote-phone')?.value?.trim();
        const lineId = document.getElementById('quote-line')?.value?.trim();
        const location = document.getElementById('quote-location')?.value?.trim();
        const details = document.getElementById('quote-details')?.value?.trim();

        // Checked services
        const selectedServices = Array.from(document.querySelectorAll('input[name="quote-service"]:checked'))
            .map(cb => cb.value);
        const serviceType = selectedServices.join(', ') || 'สอบถามทั่วไป';

        if (!name || !phone) {
            if (window.app) window.app.toast('กรุณาระบุชื่อผู้ติดต่อและเบอร์โทรศัพท์', 'error');
            return;
        }

        try {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<span class="inline-block animate-spin">⏳</span> กำลังส่งข้อมูล...`;
            }

            await api.submitLead({
                name,
                phone,
                line_id: lineId,
                service_type: serviceType,
                location,
                details
            });

            this.showLeadSuccessModal({
                name,
                phone,
                lineId,
                serviceType,
                location,
                details
            });

            document.getElementById('form-quote-request')?.reset();
            if (window.app) window.app.toast('ส่งข้อมูลขอใบเสนอราคาสำเร็จ ทีมงานจะติดต่อกลับอย่างเร็วที่สุด', 'success');
        } catch (err) {
            console.error('Submit lead error:', err);
            if (window.app) window.app.toast(err.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล', 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `<span>🚀</span> ส่งคำขอใบเสนอราคา / นัดสำรวจหน้างาน`;
            }
        }
    },

    showLeadSuccessModal(data) {
        const modal = document.getElementById('modal-lead-success');
        const summary = document.getElementById('lead-success-summary');
        if (summary) {
            summary.innerHTML = `
                <div class="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div><strong>ผู้ติดต่อ:</strong> ${this.escapeHtml(data.name)} (โทร: ${this.escapeHtml(data.phone)})</div>
                    <div><strong>บริการที่สนใจ:</strong> ${this.escapeHtml(data.serviceType)}</div>
                    ${data.location ? `<div><strong>พื้นที่:</strong> ${this.escapeHtml(data.location)}</div>` : ''}
                    ${data.lineId ? `<div><strong>LINE ID:</strong> ${this.escapeHtml(data.lineId)}</div>` : ''}
                </div>
            `;
        }
        if (modal) modal.classList.remove('hidden');
    },

    closeLeadSuccessModal() {
        const modal = document.getElementById('modal-lead-success');
        if (modal) modal.classList.add('hidden');
    },

    openCertModal(type) {
        const modal = document.getElementById('modal-cert-viewer');
        const img = document.getElementById('cert-viewer-img');
        const title = document.getElementById('cert-viewer-title');
        const desc = document.getElementById('cert-viewer-desc');
        if (!modal || !img) return;

        if (type === 'sme-gp') {
            img.src = 'img/cert-sme-gp.png';
            title.textContent = 'หนังสือรับรองขึ้นทะเบียนผู้ประกอบการ SME เพื่อการจัดซื้อจัดจ้างภาครัฐ (THAI SME-GP)';
            desc.textContent = 'สำนักงานส่งเสริมวิสาหกิจขนาดกลางและขนาดย่อม (สสว.) • เลขที่ 30256/2569 • ผู้ประกอบการ: เค อีควิป';
        } else {
            img.src = 'img/cert-commercial.png';
            title.textContent = 'ใบทะเบียนพาณิชย์ (กรมพัฒนาธุรกิจการค้า เทศบาลเมืองดอกคำใต้)';
            desc.textContent = 'ทะเบียนเลขที่ 3560500055866 • ชื่อพาณิชยกิจ: เค อีควิป (K Equiv) • อุปกรณ์ไอที เน็ตเวิร์ก กล้องวงจรปิด';
        }
        modal.classList.remove('hidden');
    },

    closeCertModal() {
        document.getElementById('modal-cert-viewer')?.classList.add('hidden');
    },

    openLineChat(serviceName = '') {
        const lineUrl = 'https://line.me/R/ti/p/@vcv6921d';
        window.open(lineUrl, '_blank');
    },

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

window.storefront = storefront;
