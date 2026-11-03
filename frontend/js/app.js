/**
 * Main Application Controller & Utilities
 * Clean & Modern Professional Interface
 */

const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const THAI_MONTHS_FULL = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const app = {
    state: {
        activeTab: 'dashboard',
        company: null,
        presets: null,
        currentEditingCustomer: null,
        currentEditingDocument: null,
        pendingConvertDoc: null
    },

    async init() {
        console.log('App initializing...');
        try {
            await this.loadInitialData();
            this.setupEventListeners();
            this.switchTab('dashboard');
        } catch (err) {
            console.error('Initialization error:', err);
            this.toast('เกิดข้อผิดพลาดในการโหลดระบบ: ' + err.message, 'error');
        }
    },

    async loadInitialData() {
        try {
            const [companyRes, presetsRes] = await Promise.all([
                api.getCompany(),
                api.getPresets()
            ]);
            this.state.company = companyRes.data;
            this.state.presets = presetsRes;

            // Update company name in header
            const brandEl = document.getElementById('header-company-name');
            if (brandEl && this.state.company) {
                brandEl.textContent = this.state.company.name;
            }
        } catch (e) {
            console.error('Failed to load company info:', e);
        }
    },

    setupEventListeners() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = link.getAttribute('data-tab');
                if (tab) {
                    this.switchTab(tab);
                }
            });
        });

        // Close modals on clicking backdrop or close buttons
        document.querySelectorAll('.modal-close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal-container');
                if (modal) this.closeModal(modal.id);
            });
        });
    },

    switchTab(tabName, payload = null) {
        this.state.activeTab = tabName;

        // Update nav active states
        document.querySelectorAll('.nav-link').forEach(link => {
            const isTarget = link.getAttribute('data-tab') === tabName;
            if (isTarget) {
                link.classList.add('bg-blue-600', 'text-white', 'shadow-sm', 'font-semibold');
                link.classList.remove('text-slate-600', 'hover:bg-slate-100');
            } else {
                link.classList.remove('bg-blue-600', 'text-white', 'shadow-sm', 'font-semibold');
                link.classList.add('text-slate-600', 'hover:bg-slate-100');
            }
        });

        // Toggle tab view containers
        document.querySelectorAll('.tab-view').forEach(view => {
            view.classList.add('hidden');
        });

        const activeContainer = document.getElementById(`view-${tabName}`);
        if (activeContainer) {
            activeContainer.classList.remove('hidden');
        }

        // Trigger module load
        if (tabName === 'dashboard' && window.dashboardModule) {
            window.dashboardModule.load();
        } else if (tabName === 'documents' && window.documentsModule) {
            window.documentsModule.loadList(payload);
        } else if (tabName === 'create-doc' && window.documentsModule) {
            window.documentsModule.loadCreateForm(payload);
        } else if (tabName === 'customers' && window.customersModule) {
            window.customersModule.loadList();
        } else if (tabName === 'reservations' && window.reservationsModule) {
            window.reservationsModule.loadList();
        } else if (tabName === 'settings' && window.settingsModule) {
            window.settingsModule.load();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.classList.add('overflow-hidden');
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }
    },

    toast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        const bgColors = {
            success: 'bg-emerald-600 text-white',
            error: 'bg-rose-600 text-white',
            warning: 'bg-amber-500 text-white',
            info: 'bg-slate-800 text-white'
        };
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${bgColors[type] || bgColors.info} toast-enter mb-2 transition-all duration-300`;
        toast.innerHTML = `
            <span class="text-base font-bold">${icons[type] || '•'}</span>
            <span class="flex-1">${message}</span>
            <button class="opacity-70 hover:opacity-100 ml-2 text-xs">✕</button>
        `;

        toast.querySelector('button').addEventListener('click', () => {
            toast.remove();
        });

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    // Formatters
    formatCurrency(val) {
        const num = parseFloat(val);
        if (isNaN(num)) return '0.00';
        return num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    formatDateThai(dateStr, full = false) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;

        const day = d.getDate();
        const month = full ? THAI_MONTHS_FULL[d.getMonth()] : THAI_MONTHS_SHORT[d.getMonth()];
        const isBE = !this.state.company || this.state.company.year_format === 'BE';
        const year = d.getFullYear() + (isBE ? 543 : 0);

        return `${day} ${month} ${year}`;
    },

    thaiBahtText(num) {
        if (num === null || num === undefined || isNaN(num)) return 'ศูนย์บาทถ้วน';
        const absNum = Math.abs(parseFloat(num));
        if (absNum === 0) return 'ศูนย์บาทถ้วน';

        const thaiNums = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
        const thaiUnits = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

        const [intPart, decPart] = absNum.toFixed(2).split('.');

        function convert6Digits(digits) {
            let res = '';
            const len = digits.length;
            for (let i = 0; i < len; i++) {
                const digit = parseInt(digits[i], 10);
                const pos = len - 1 - i;
                if (digit !== 0) {
                    if (pos === 0 && digit === 1 && len > 1) {
                        res += 'เอ็ด';
                    } else if (pos === 1 && digit === 2) {
                        res += 'ยี่สิบ';
                    } else if (pos === 1 && digit === 1) {
                        res += 'สิบ';
                    } else {
                        res += thaiNums[digit] + thaiUnits[pos];
                    }
                }
            }
            return res;
        }

        let intText = '';
        const groups = [];
        let rem = intPart;
        while (rem.length > 0) {
            const sz = Math.min(6, rem.length);
            groups.unshift(rem.slice(-sz));
            rem = rem.slice(0, -sz);
        }

        for (let i = 0; i < groups.length; i++) {
            const gText = convert6Digits(groups[i]);
            if (gText) {
                intText += gText;
                if (i < groups.length - 1) intText += 'ล้าน';
            }
        }
        if (!intText) intText = 'ศูนย์';

        let result = '';
        const satang = parseInt(decPart, 10);
        if (satang === 0) {
            result = intText + 'บาทถ้วน';
        } else {
            const satText = convert6Digits(decPart);
            if (intText === 'ศูนย์') {
                result = satText + 'สตางค์';
            } else {
                result = intText + 'บาท' + satText + 'สตางค์';
            }
        }

        if (parseFloat(num) < 0) result = 'ลบ' + result;
        return result;
    },

    getDocTypeBadge(type) {
        const types = {
            quotation: { label: '[QT] ใบเสนอราคา', class: 'badge-quotation' },
            billing: { label: '[INV] ใบแจ้งหนี้/วางบิล', class: 'badge-billing' },
            receipt: { label: '[RE] ใบเสร็จรับเงิน', class: 'badge-receipt' }
        };
        const item = types[type] || { label: type, class: 'bg-stone-200 text-stone-800' };
        return `<span class="px-2 py-0.5 rounded text-xs font-bold font-mono whitespace-nowrap inline-block ${item.class}">${item.label}</span>`;
    },

    getStatusBadge(status) {
        const map = {
            draft: { label: 'ฉบับร่าง', class: 'stamp stamp-draft' },
            issued: { label: 'ออกเอกสารแล้ว', class: 'stamp stamp-issued' },
            paid: { label: 'ชำระเงินแล้ว', class: 'stamp stamp-paid' },
            cancelled: { label: 'ยกเลิก', class: 'stamp stamp-cancelled' },
            reserved: { label: 'กันเลขไว้', class: 'stamp stamp-reserved' },
            used: { label: 'ใช้งานแล้ว', class: 'stamp border border-stone-400 text-stone-600' }
        };
        const item = map[status] || { label: status, class: 'bg-stone-200 text-stone-800' };
        return `<span class="${item.class} text-[11px] whitespace-nowrap inline-block">${item.label}</span>`;
    }
};

window.app = app;
window.addEventListener('DOMContentLoaded', () => app.init());
