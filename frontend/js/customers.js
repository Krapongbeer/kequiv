/**
 * Customers & Multi-Project Management Module (Clean Ocean Edition)
 * Straightforward customer directory with sub-project management
 */

window.customersModule = {
    searchQuery: '',
    selectedCustomerId: null,

    async loadList() {
        const container = document.getElementById('customers-content');
        if (!container) return;

        container.innerHTML = `
            <div class="flex items-center justify-center p-12 text-slate-500 font-mono">
                <div class="text-center">
                    <div class="animate-spin text-3xl mb-2">⚙️</div>
                    <div>กำลังโหลดข้อมูลลูกค้า...</div>
                </div>
            </div>
        `;

        try {
            const res = await api.getCustomers(this.searchQuery);
            this.render(res.data);
        } catch (err) {
            container.innerHTML = `
                <div class="p-6 typewriter-card border-rose-300 text-rose-800 font-mono bg-rose-50/50">
                    <p class="font-bold">เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า</p>
                    <p class="text-xs mt-1">${err.message}</p>
                </div>
            `;
        }
    },

    render(customers) {
        const container = document.getElementById('customers-content');
        if (!container) return;

        container.innerHTML = `
            <div class="typewriter-card rounded-xl p-6 font-mono bg-white">
                <!-- Header & Action -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div>
                        <h2 class="text-xl font-bold text-slate-900 font-typewriter flex items-center gap-2">
                            <span>👥</span> ข้อมูลลูกค้าและโครงการ
                        </h2>
                        <p class="text-xs text-slate-500 mt-1">
                            ลูกค้า 1 ราย สามารถสร้างได้หลายโครงการ/สาขา เพื่อแยกจัดกลุ่มบิลและสถานที่ส่งของ
                        </p>
                    </div>
                    <button onclick="window.customersModule.openCustomerModal()" class="btn-ocean text-xs py-2 px-3.5">
                        <span>+ เพิ่มลูกค้าใหม่</span>
                    </button>
                </div>

                <!-- Search Box -->
                <div class="my-4 flex items-center justify-between gap-3">
                    <div class="relative flex-1 max-w-md">
                        <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">🔍</span>
                        <input type="text" id="customer-search-input" value="${this.searchQuery}" placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, เลขผู้เสียภาษี..." 
                            class="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-sky-500"
                            onkeyup="if(event.key === 'Enter') window.customersModule.search(this.value)">
                    </div>
                    <button onclick="window.customersModule.search(document.getElementById('customer-search-input').value)" class="btn-ocean text-xs py-2 px-4">
                        ค้นหา
                    </button>
                </div>

                <!-- Customer Cards -->
                <div class="space-y-3">
                    ${customers.length === 0 ? `
                        <div class="text-center py-12 text-slate-400 font-mono">
                            ไม่พบข้อมูลลูกค้าที่ตรงกับการค้นหา
                        </div>
                    ` : customers.map(c => `
                        <div class="border border-slate-200 rounded-xl p-4 bg-white hover:bg-slate-50/70 transition shadow-xs">
                            <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                                <!-- Customer Info -->
                                <div class="flex-1">
                                    <div class="flex items-center gap-2.5">
                                        <h3 class="font-bold text-slate-900 text-base font-typewriter">${c.name}</h3>
                                        ${c.tax_id ? `<span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold border border-slate-300 font-mono">เลขผู้เสียภาษี: ${c.tax_id}</span>` : ''}
                                    </div>
                                    <p class="text-xs text-slate-600 mt-1">${c.address || 'ไม่ได้ระบุที่อยู่'}</p>
                                    
                                    <div class="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                                        ${c.phone ? `<span>โทร: <strong class="text-slate-800">${c.phone}</strong></span>` : ''}
                                        ${c.email ? `<span>อีเมล: ${c.email}</span>` : ''}
                                        ${c.note ? `<span class="text-slate-400 italic">(${c.note})</span>` : ''}
                                    </div>
                                </div>

                                <!-- Actions -->
                                <div class="flex flex-wrap items-center gap-2 self-start">
                                    <button onclick="app.switchTab('create-doc', { customer_id: ${c.id} })" class="btn-ocean text-xs py-1.5 px-3">
                                        + ออกบิล
                                    </button>
                                    <button onclick="window.customersModule.openProjectsModal(${c.id})" class="btn-paper text-xs py-1.5 px-3 bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100">
                                        📌 แฟ้มโครงการ (${c.projects ? c.projects.length : 0})
                                    </button>
                                    <button onclick="window.customersModule.openEditCustomer(${c.id})" class="btn-paper text-xs py-1.5 px-2.5">
                                        ✏️ แก้ไข
                                    </button>
                                    <button onclick="window.customersModule.deleteCustomer(${c.id}, '${c.name}')" class="btn-paper text-xs py-1.5 px-2 text-rose-700 border-rose-300 hover:bg-rose-50" title="ลบลูกค้ารายนี้">
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            <!-- Projects pill list -->
                            <div class="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                                <span class="text-[11px] font-bold text-slate-400">โครงการ / สาขา:</span>
                                ${c.projects && c.projects.length > 0 ? c.projects.map(p => `
                                    <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11px]">
                                        <span>📌</span>
                                        <strong>${p.project_name}</strong>
                                        ${p.contact_person ? `<span class="text-slate-400 text-[10px]">(${p.contact_person})</span>` : ''}
                                    </span>
                                `).join('') : `
                                    <span class="text-slate-400 text-[11px]">ใช้หัวบิลทั่วไป (ไม่มีโครงการย่อย)</span>
                                `}
                                <button onclick="window.customersModule.openAddProjectPrompt(${c.id})" class="text-xs font-bold text-sky-700 hover:underline ml-1">
                                    + เพิ่มโครงการ
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    search(query) {
        this.searchQuery = (query || '').trim();
        this.loadList();
    },

    openCustomerModal() {
        this.selectedCustomerId = null;
        const form = document.getElementById('form-customer');
        if (form) form.reset();
        const titleEl = document.getElementById('modal-customer-title');
        if (titleEl) titleEl.textContent = 'เพิ่มข้อมูลลูกค้า';
        app.openModal('modal-customer');
    },

    async openEditCustomer(id) {
        this.selectedCustomerId = id;
        try {
            const res = await api.getCustomer(id);
            const c = res.data;
            
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = val || '';
            };

            setVal('cust-name', c.name);
            setVal('cust-tax-id', c.tax_id);
            setVal('cust-address', c.address);
            setVal('cust-phone', c.phone);
            setVal('cust-email', c.email);
            setVal('cust-note', c.note);

            const titleEl = document.getElementById('modal-customer-title');
            if (titleEl) titleEl.textContent = 'แก้ไขข้อมูลลูกค้า';
            app.openModal('modal-customer');
        } catch (err) {
            app.toast(err.message, 'error');
        }
    },

    async saveCustomer() {
        const getVal = (id) => document.getElementById(id)?.value?.trim() || '';

        const data = {
            name: getVal('cust-name'),
            tax_id: getVal('cust-tax-id'),
            address: getVal('cust-address'),
            phone: getVal('cust-phone'),
            email: getVal('cust-email'),
            note: getVal('cust-note')
        };

        if (!data.name) {
            app.toast('กรุณาระบุชื่อลูกค้า', 'warning');
            return;
        }

        try {
            if (this.selectedCustomerId) {
                await api.updateCustomer(this.selectedCustomerId, data);
                app.toast('บันทึกการแก้ไขข้อมูลลูกค้าเรียบร้อย', 'success');
            } else {
                await api.createCustomer(data);
                app.toast('เพิ่มข้อมูลลูกค้าใหม่เรียบร้อย', 'success');
            }
            app.closeModal('modal-customer');
            this.loadList();
        } catch (err) {
            app.toast(err.message, 'error');
        }
    },

    async deleteCustomer(id, name) {
        if (!confirm(`คุณต้องการลบข้อมูลลูกค้า "${name}" ใช่หรือไม่?`)) return;

        try {
            await api.deleteCustomer(id);
            app.toast('ลบข้อมูลลูกค้าเรียบร้อยแล้ว', 'success');
            this.loadList();
        } catch (err) {
            app.toast(err.message, 'error');
        }
    },

    // --- Customer Projects Management ---
    async openProjectsModal(customerId) {
        this.selectedCustomerId = customerId;
        const container = document.getElementById('projects-list-container');
        if (!container) return;

        container.innerHTML = '<div class="text-center py-4 text-xs text-slate-400 font-mono">กำลังโหลดโครงการ...</div>';
        app.openModal('modal-projects');

        try {
            const res = await api.getCustomer(customerId);
            const customer = res.data;
            const nameEl = document.getElementById('projects-modal-customer-name');
            if (nameEl) nameEl.textContent = `ลูกค้า: ${customer.name}`;

            this.renderProjectsInModal(customer.projects || []);
        } catch (err) {
            container.innerHTML = `<div class="text-rose-600 text-xs">${err.message}</div>`;
        }
    },

    renderProjectsInModal(projects) {
        const container = document.getElementById('projects-list-container');
        if (!container) return;

        if (projects.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6 text-slate-400 text-xs font-mono border border-dashed border-slate-200 rounded-lg p-4">
                    ยังไม่มีโครงการย่อยสำหรับลูกค้ารายนี้
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="space-y-2 font-mono">
                ${projects.map(p => `
                    <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-3 text-xs">
                        <div class="flex-1">
                            <div class="font-bold text-slate-900">📌 ${p.project_name}</div>
                            ${p.site_address ? `<div class="text-slate-600 mt-0.5">📍 หน้างาน: ${p.site_address}</div>` : ''}
                            ${p.contact_person ? `<div class="text-slate-600 mt-0.5">👤 ผู้ติดต่อ: ${p.contact_person}</div>` : ''}
                            ${p.note ? `<div class="text-slate-400 italic mt-0.5">📝 ${p.note}</div>` : ''}
                        </div>
                        <button onclick="window.customersModule.deleteProject(${p.id}, '${p.project_name}')" class="btn-paper text-[11px] py-1 px-2 text-rose-700 border-rose-300 hover:bg-rose-50">
                            ลบ
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    async openAddProjectPrompt(customerId) {
        const name = prompt('ระบุชื่อโครงการ / สาขาของลูกค้า:');
        if (!name || !name.trim()) return;

        try {
            await api.addProject(customerId, { project_name: name.trim() });
            app.toast('เพิ่มโครงการเรียบร้อยแล้ว', 'success');
            this.loadList();
        } catch (err) {
            app.toast(err.message, 'error');
        }
    },

    async saveProject() {
        if (!this.selectedCustomerId) return;
        const name = document.getElementById('proj-name')?.value?.trim();
        const contact = document.getElementById('proj-contact')?.value?.trim();
        const site = document.getElementById('proj-site')?.value?.trim();

        if (!name) {
            app.toast('กรุณาระบุชื่อโครงการ', 'warning');
            return;
        }

        try {
            await api.addProject(this.selectedCustomerId, {
                project_name: name,
                contact_person: contact,
                site_address: site
            });
            app.toast('บันทึกโครงการสำเร็จ', 'success');
            document.getElementById('form-add-project')?.reset();
            this.openProjectsModal(this.selectedCustomerId);
            this.loadList();
        } catch (err) {
            app.toast(err.message, 'error');
        }
    },

    async deleteProject(projectId, projectName) {
        if (!confirm(`คุณต้องการลบโครงการ "${projectName}" ใช่หรือไม่?`)) return;

        try {
            await api.deleteProject(this.selectedCustomerId, projectId);
            app.toast('ลบโครงการเรียบร้อยแล้ว', 'success');
            this.openProjectsModal(this.selectedCustomerId);
            this.loadList();
        } catch (err) {
            app.toast(err.message, 'error');
        }
    }
};
