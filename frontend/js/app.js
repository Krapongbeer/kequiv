/**
 * Main Application Controller & Utilities (v2.0.0 Ocean Typewriter Edition)
 * Full Authentication, Session Guard, Zero-Collision Management & Versioning
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
        currentUser: null,
        currentEditingCustomer: null,
        currentEditingDocument: null,
        pendingConvertDoc: null
    },

    async init() {
        console.log('Kequiv v2.0 Initializing...');

        // Check authentication state
        const token = localStorage.getItem('kequiv_token');
        if (!token) {
            this.showLoginScreen();
            return;
        }

        try {
            // Verify session with backend
            const userRes = await api.getCurrentUser();
            this.state.currentUser = userRes.user;
            this.updateUserUI(this.state.currentUser);
            this.hideLoginScreen();

            await this.loadInitialData();
            this.setupEventListeners();
            this.switchTab('dashboard');
        } catch (err) {
            console.warn('Session verification failed, requesting login:', err.message);
            this.showLoginScreen();
        }
    },

    // -----------------------------------------------------------------
    // Authentication Handlers
    // -----------------------------------------------------------------
    showLoginScreen() {
        const overlay = document.getElementById('login-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.style.opacity = '1';
        }
    },

    hideLoginScreen() {
        const overlay = document.getElementById('login-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    },

    quickFillLogin(username, password) {
        const uEl = document.getElementById('login-username');
        const pEl = document.getElementById('login-password');
        if (uEl) uEl.value = username;
        if (pEl) pEl.value = password;
        const errEl = document.getElementById('login-error-alert');
        if (errEl) errEl.classList.add('hidden');
    },

    async handleLogin() {
        const username = document.getElementById('login-username')?.value?.trim();
        const password = document.getElementById('login-password')?.value;
        const errAlert = document.getElementById('login-error-alert');
        const errMsg = document.getElementById('login-error-msg');
        const btnSubmit = document.getElementById('btn-login-submit');

        if (!username || !password) {
            if (errAlert) {
                errMsg.textContent = 'กรุณากรอกทั้งชื่อผู้ใช้และรหัสผ่าน';
                errAlert.classList.remove('hidden');
            }
            return;
        }

        try {
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = `<span>⏳</span> <span>กำลังตรวจสอบ...</span>`;
            }

            const res = await api.login(username, password);

            localStorage.setItem('kequiv_token', res.token);
            localStorage.setItem('kequiv_user', JSON.stringify(res.user));
            this.state.currentUser = res.user;

            this.updateUserUI(res.user);
            this.hideLoginScreen();
            this.toast(`ยินดีต้อนรับคุณ ${res.user.name}`, 'success');

            // Initialize app data
            await this.loadInitialData();
            this.setupEventListeners();
            this.switchTab('dashboard');
        } catch (err) {
            console.error('Login error:', err);
            if (errAlert) {
                errMsg.textContent = err.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
                errAlert.classList.remove('hidden');
            }
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = `<span>🔐</span> <span>เข้าสู่ระบบ (LOGIN)</span>`;
            }
        }
    },

    handleLogout() {
        localStorage.removeItem('kequiv_token');
        localStorage.removeItem('kequiv_user');
        this.state.currentUser = null;
        this.toast('ออกจากระบบเรียบร้อยแล้ว', 'info');
        this.showLoginScreen();
    },

    updateUserUI(user) {
        const nameEl = document.getElementById('sidebar-username');
        if (nameEl && user) {
            nameEl.textContent = `${user.username} (${user.role})`;
        }
    },

    openVersionModal() {
        this.openModal('modal-version');
    },

    // -----------------------------------------------------------------
    // Core Initializers
    // -----------------------------------------------------------------
    async loadInitialData() {
        try {
            const [companyRes, presetsRes] = await Promise.all([
                api.getCompany(),
                api.getPresets()
            ]);
            this.state.company = companyRes.data;
            this.state.presets = presetsRes;

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

    toggleSidebar(open = null) {
        const sidebar = document.getElementById('app-sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (!sidebar) return;

        const isCurrentlyOpen = !sidebar.classList.contains('-translate-x-full');
        const targetOpen = open !== null ? open : !isCurrentlyOpen;

        if (targetOpen) {
            sidebar.classList.remove('-translate-x-full');
            if (backdrop) backdrop.classList.remove('hidden');
        } else {
            sidebar.classList.add('-translate-x-full');
            if (backdrop) backdrop.classList.add('hidden');
        }
    },

    switchTab(tabName, payload = null) {
        this.state.activeTab = tabName;
        this.toggleSidebar(false);

        // Update nav active states with modern Ocean styling
        document.querySelectorAll('.nav-link').forEach(link => {
            const isTarget = link.getAttribute('data-tab') === tabName;
            if (isTarget) {
                link.classList.add('bg-sky-600', 'text-white', 'shadow-md', 'font-bold');
                link.classList.remove('text-slate-300', 'hover:bg-slate-800');
            } else {
                link.classList.remove('bg-sky-600', 'text-white', 'shadow-md', 'font-bold');
                link.classList.add('text-slate-300', 'hover:bg-slate-800');
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
            warning: 'bg-amber-600 text-white',
            info: 'bg-sky-800 text-white'
        };
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-xs font-mono font-bold ${bgColors[type] || bgColors.info} mb-2 transition-all duration-300 border border-white/20`;
        toast.innerHTML = `
            <span class="text-sm">${icons[type] || '•'}</span>
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
            quotation: { label: 'ใบเสนอราคา (QT)', class: 'bg-sky-50 text-sky-800 border border-sky-300' },
            billing: { label: 'ใบแจ้งหนี้/วางบิล (INV)', class: 'bg-amber-50 text-amber-900 border border-amber-300' },
            receipt: { label: 'ใบเสร็จรับเงิน (RE)', class: 'bg-emerald-50 text-emerald-900 border border-emerald-300' }
        };
        const item = types[type] || { label: type, class: 'bg-slate-100 text-slate-800 border border-slate-300' };
        return `<span class="px-2 py-0.5 rounded-md text-[11px] font-bold font-mono whitespace-nowrap inline-block ${item.class}">${item.label}</span>`;
    },

    getStatusBadge(status) {
        const map = {
            draft: { label: 'ฉบับร่าง', class: 'border border-slate-300 text-slate-600 bg-slate-100' },
            issued: { label: 'ออกเอกสารแล้ว', class: 'border border-sky-300 text-sky-800 bg-sky-50 font-bold' },
            paid: { label: 'ชำระเงินแล้ว', class: 'border border-emerald-300 text-emerald-800 bg-emerald-50 font-bold' },
            cancelled: { label: 'ยกเลิกแล้ว', class: 'border border-rose-300 text-rose-800 bg-rose-50' },
            reserved: { label: 'เลขสำรอง', class: 'border border-purple-300 text-purple-800 bg-purple-50 font-bold' },
            used: { label: 'ใช้งานแล้ว', class: 'border border-slate-200 text-slate-400 bg-slate-50' }
        };
        const item = map[status] || { label: status, class: 'bg-slate-100 text-slate-800 border border-slate-200' };
        return `<span class="px-2 py-0.5 rounded-md text-[11px] font-mono whitespace-nowrap inline-block ${item.class}">${item.label}</span>`;
    }
};

window.app = app;
window.addEventListener('DOMContentLoaded', () => app.init());
