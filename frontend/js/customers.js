/**
 * Customers & Multi-Project Management Module (สไตล์บัตรรายชื่อและแฟ้มโครงการ)
 */

window.customersModule = {
    searchQuery: '',
    selectedCustomerId: null,

    async loadList() {
        const container = document.getElementById('customers-content');
        if (!container) return;

        container.innerHTML = `
            <div class="flex items-center justify-center p-12 text-stone-600 font-mono">
                <div class="text-center">
                    <div class="text-3xl mb-2">⌨️</div>
                    <div>กำลังเปิดกล่องบัตรรายชื่อลูกค้า...</div>
                </div>
            </div>
        `;

        try {
            const res = await api.getCustomers(this.searchQuery);
            this.render(res.data);
        } catch (err) {
            container.innerHTML = `
                <div class="p-6 typewriter-card border-red-800 text-red-800 font-mono">
                    <p class="font-bold">[ เกิดข้อผิดพลาดในการโหลดบัตรรายชื่อลูกค้า ]</p>
                    <p class="text-xs mt-1">${err.message}</p>
                </div>
            `;
        }
    },

    render(customers) {
        const container = document.getElementById('customers-content');
        if (!container) return;

        container.innerHTML = `
            <div class="typewriter-card rounded-xl p-6 font-mono">
                <!-- Header & Action -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-stone-800">
                    <div>
                        <h2 class="text-xl font-bold text-stone-900 font-typewriter flex items-center gap-2">
                            <span>👥</span> [ บัญชีประวัติลูกค้า & แฟ้มโครงการย่อย ]
                        </h2>
                        <p class="text-xs text-stone-600 mt-1">
                            ลูกค้า 1 ราย มีได้หลายหัวบิล/โครงการ เพื่อแยกจัดกลุ่มบิลและสถานที่ส่งของ
                        </p>
                    </div>
                    <button onclick="window.customersModule.openCustomerModal()" class="btn-typewriter">
                        <span>+ พิมพ์บัตรลูกค้าใหม่</span>
                    </button>
                </div>

                <!-- Search Box -->
                <div class="my-4 flex items-center justify-between gap-3">
                    <div class="relative flex-1 max-w-md">
                        <input type="text" id="customer-search-input" value="${this.searchQuery}" placeholder="พิมพ์ค้นหาชื่อลูกค้า, เบอร์โทร, เลขประจำตัวผู้เสียภาษี..." 
                            class="w-full px-3 py-2 text-xs"
                            onkeyup="if(event.key === 'Enter') window.customersModule.search(this.value)">
                    </div>
                    <button onclick="window.customersModule.search(document.getElementById('customer-search-input').value)" class="btn-paper text-xs">
                        ค้นหาบัตร
                    </button>
                </div>

                <!-- Customer Index Cards -->
                <div class="space-y-4">
                    ${customers.length === 0 ? `
                        <div class="text-center py-12 text-stone-500 font-typewriter">
                            [ ไม่พบบัตรข้อมูลลูกค้าในกล่อง ]
                        </div>
                    ` : customers.map(c => `
                        <div class="border-2 border-stone-800 rounded-lg p-4 bg-[#fffdfa] hover:bg-[#fcf7ee] transition shadow-sm">
                            <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                                <!-- Customer Info -->
                                <div class="flex-1">
                                    <div class="flex items-center gap-3">
                                        <h3 class="font-bold text-stone-900 text-base font-typewriter">${c.name}</h3>
                                        ${c.tax_id ? `<span class="px-2 py-0.5 bg-stone-200 text-stone-800 rounded text-[10px] font-bold border border-stone-400">Tax ID: ${c.tax_id}</span>` : ''}
                                    </div>
                                    <p class="text-xs text-stone-700 mt-1">${c.address || '[ ไม่มีที่อยู่ ]'}</p>
                                    
                                    <div class="flex flex-wrap items-center gap-4 text-xs text-stone-600 mt-2">
                                        ${c.phone ? `<span>โทร: <strong class="text-stone-900">${c.phone}</strong></span>` : ''}
                                        ${c.email ? `<span>อีเมล: ${c.email}</span>` : ''}
                                        ${c.note ? `<span class="text-stone-500 italic">(${c.note})</span>` : ''}
                                    </div>
                                </div>

                                <!-- Actions -->
                                <div class="flex flex-wrap items-center gap-2 self-start">
                                    <button onclick="app.switchTab('create-doc', { customer_id: ${c.id} })" class="btn-paper text-xs bg-blue-50 text-blue-900 border-blue-900 font-bold">
                                        + ออกบิล
                                    </button>
                                    <button onclick="window.customersModule.openProjectsModal(${c.id})" class="btn-paper text-xs bg-amber-50 text-amber-950 border-amber-900 font-bold">
                                        📌 แฟ้มโครงการ (${c.projects ? c.projects.length : 0})
                                    </button>
                                    <button onclick="window.customersModule.openEditCustomer(${c.id})" class="btn-paper text-xs font-bold">
                                        ✏️ แก้ไข
                                    </button>
                                    <button onclick="window.customersModule.deleteCustomer(${c.id}, '${c.name}')" class="btn-paper text-xs text-red-800 border-red-800" title="ลบบัตรนี้">
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            <!-- Projects pill list (Typewriter Tag Style) -->
                            <div class="mt-3 pt-2.5 border-t border-dashed border-stone-300 flex flex-wrap items-center gap-2 text-xs">
                                <span class="text-[10px] font-bold text-stone-500 uppercase">[ โครงการ/หัวบิลย่อย ]:</span>
                                ${c.projects && c.projects.length > 0 ? c.projects.map(p => `
                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-100 border border-stone-400 rounded text-stone-800 text-[11px]">
                                        <span>📌</span>
                                        <strong>${p.project_name}</strong>
                                        ${p.contact_person ? `<span class="text-stone-500 text-[10px]">(${p.contact_person})</span>` : ''}
                                    </span>
                                `).join('') : `
                                    <span class="text-stone-400 italic text-[11px]">[ ใช้หัวบิลรวมของลูกค้า ]</span>
                                `}
                                <button onclick="window.customersModule.openAddProjectPrompt(${c.id})" class="text-xs font-bold text-blue-900 underline ml-1">
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
        this.searchQuery = query.trim();
        this.loadList();
    },

    openCustomerModal() {
        this.selectedCustomerId = null;
        const form = document.getElementById('form-customer');
        if (form) form.reset();
        document.getElementById('modal-customer-title').textContent = '[ พิมพ์บัตรข้อมูลลูกค้าใหม่ ]';
        app.openModal('modal-customer');
    },

    async openEditCustomer(id) {
        this.selectedCustomerId = id;
        try {
            const res = await api.getCustomer(id);
            const c = res.data;
            const form = document.getElementById('form-customer');
            form.name.value = c.name || '';
            form.tax_id.value = c.tax_id || '';
            form.address.value = c.address || '';
            form.phone.value = c.phone || '';
            form.email.value = c.email || '';
            form.note.value = c.note || '';

            document.getElementById('modal-customer-title').textContent = '[ แก้ไขบัตรข้อมูลลูกค้า ]';
            app.openModal('modal-customer');
        } catch (err) {
            app.toast(err.message, 'error');
        }
    },

    async submitCustomer() {
        const form = document.getElementById('form-customer');
        if (!form) return;

        const data = {
            name: form.name.value.trim(),
            tax_id: form.tax_id.value.trim(),
            address: form.address.value.trim(),
            phone: form.phone.value.trim(),
            email: form.email.value.trim(),
            note: form.note.value.trim()
        };

        if (!data.name) {
            app.toast('กรุณาระบุชื่อลูกค้า', 'warning');
            return;
        }

        try {
            if (this.selectedCustomerId) {
                await api.updateCustomer(this.selectedCustomerId, data);
                app.toast('อัปเดตบัตรลูกค้าเรียบร้อยแล้ว', 'success');
            } else {
                await api.createCustomer(data);
                app.toast('เพิ่มบัตรลูกค้าใหม่เรียบร้อยแล้ว', 'success');
            }
            app.closeModal('modal-customer');
            this.loadList();
        } catch (err) {
            app.toast(err.message, 'error');
        }
    },

    async deleteCustomer(id, name) {
        if (!confirm(`คุณต้องการลบบัตรลูกค้า "${name}" ใช่หรือไม่?`)) return;

        try {
            await api.deleteCustomer(id);
            app.toast('ลบบัตรลูกค้าเรียบร้อยแล้ว', 'success');
            this.loadList();
        } catch (err) {
            app.toast(err.message, 'error');
        }
    },

    // --- Customer Projects Management ---
    async openProjectsModal(customerId) {
        this.selectedCustomerId = customerId;
        const container = document.getElementById('projects-modal-list');
        if (!container) return;

        container.innerHTML = '<div class="text-center py-4 text-xs text-stone-500 font-mono">[ กำลังค้นแฟ้มโครงการ... ]</div>';
        app.openModal('modal-projects');

        try {
            const res = await api.getCustomer(customerId);
            const customer = res.data;
            document.getElementById('modal-projects-customer-name').textContent = customer.name;

            this.renderProjectsInModal(customer.projects || []);
        } catch (err) {
            container.innerHTML = `<div class="text-red-700 text-xs">${err.message}</div>`;
        }
    },

    renderProjectsInModal(projects) {
        const container = document.getElementById('projects-modal-list');
        if (!container) return;

        if (projects.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6 text-stone-500 text-xs font-mono border border-dashed border-stone-400 p-4">
                    [ ยังไม่มีโครงการย่อยสำหรับลูกค้ารายนี้ ]
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="space-y-2 font-mono">
                ${projects.map(p => `
                    <div class="p-3 bg-stone-100/70 border border-stone-700 rounded flex items-start justify-between gap-3 text-xs">
                        <div class="flex-1">
                            <div class="font-bold text-stone-900">📌 ${p.project_name}</div>
                            ${p.site_address ? `<div class="text-stone-700 mt-0.5">📍 หน้างาน: ${p.site_address}</div>` : ''}
                            ${p.contact_person ? `<div class="text-stone-700 mt-0.5">👤 ผู้ติดต่อ: ${p.contact_person}</div>` : ''}
                            ${p.note ? `<div class="text-stone-500 italic mt-0.5">📝 ${p.note}</div>` : ''}
                        </div>
                        <button onclick="window.customersModule.deleteProject(${p.id}, '${p.project_name}')" class="btn-paper text-[10px] py-0.5 px-1.5 text-red-800 border-red-800">
                            ลบ
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    async openAddProjectPrompt(customerId) {
        const name = prompt('ระบุชื่อโครงการ / หัวบิลย่อย:');
        if (!name || !name.trim()) return;

        try {
            await api.addProject(customerId, { project_name: name.trim() });
            app.toast('เพิ่มโครงการย่อยเรียบร้อยแล้ว', 'success');
            this.loadList();
        } catch (err) {
            app.toast(err.message, 'error');
        }
    },

    async submitNewProjectFromModal() {
        const form = document.getElementById('form-add-project');
        if (!form || !this.selectedCustomerId) return;

        const data = {
            project_name: form.project_name.value.trim(),
            site_address: form.site_address.value.trim(),
            contact_person: form.contact_person.value.trim(),
            note: form.note.value.trim()
        };

        if (!data.project_name) {
            app.toast('กรุณาระบุชื่อโครงการ', 'warning');
            return;
        }

        try {
            await api.addProject(this.selectedCustomerId, data);
            app.toast('บันทึกโครงการสำเร็จ', 'success');
            form.reset();
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
