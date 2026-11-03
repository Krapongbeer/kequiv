/**
 * Reservations Management Module (สมุดคุมเลขที่กันไว้สำหรับออกบิลย้อนหลัง - สไตล์พิมพ์ดีด)
 */

window.reservationsModule = {
    currentType: '',
    currentStatus: 'reserved',

    async loadList() {
        const container = document.getElementById('reservations-content');
        if (!container) return;

        container.innerHTML = `
            <div class="flex items-center justify-center p-12 text-stone-600 font-mono">
                <div class="text-center">
                    <div class="text-3xl mb-2">⌨️</div>
                    <div>กำลังเปิดสมุดคุมเลขที่กันไว้...</div>
                </div>
            </div>
        `;

        try {
            const res = await api.getReservations(this.currentType, this.currentStatus);
            this.render(res.data);
        } catch (err) {
            container.innerHTML = `
                <div class="p-6 typewriter-card border-red-800 text-red-800 font-mono">
                    <p class="font-bold">[ เกิดข้อผิดพลาดในการโหลดสมุดคุมเลขที่กันไว้ ]</p>
                    <p class="text-xs mt-1">${err.message}</p>
                </div>
            `;
        }
    },

    render(list) {
        const container = document.getElementById('reservations-content');
        if (!container) return;

        container.innerHTML = `
            <div class="typewriter-card rounded-xl p-6 mb-6 font-mono">
                <!-- Header & Controls -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-stone-800">
                    <div>
                        <h2 class="text-xl font-bold text-stone-900 font-typewriter flex items-center gap-2">
                            <span>🔢</span> [ สมุดคุมเลขที่กันไว้สำหรับออกบิลย้อนหลัง ]
                        </h2>
                        <p class="text-xs text-stone-600 mt-1">
                            ป้องกันเลขชนกัน 100% ระบบล็อกเลขไว้ในคลัง และให้เลขรันปกติข้ามเลขที่ถูกกันไว้โดยอัตโนมัติ
                        </p>
                    </div>
                    <button onclick="window.reservationsModule.openReserveModal()" class="btn-typewriter">
                        <span>+ ประทับตรากันเลขที่ใหม่ (เดี่ยว / ชุด)</span>
                    </button>
                </div>

                <!-- Filters -->
                <div class="flex flex-wrap items-center justify-between gap-4 my-4">
                    <!-- Doc Type Filter -->
                    <div class="flex items-center gap-1.5 p-1 bg-[#eee3c8] border-2 border-stone-700 rounded-lg text-xs font-mono">
                        <button onclick="window.reservationsModule.filterType('')" class="px-2.5 py-1 rounded transition ${this.currentType === '' ? 'bg-[#2b2725] text-amber-50 font-bold' : 'text-stone-700 hover:bg-stone-300'}">
                            [ ทุกประเภท ]
                        </button>
                        <button onclick="window.reservationsModule.filterType('quotation')" class="px-2.5 py-1 rounded transition ${this.currentType === 'quotation' ? 'bg-blue-900 text-white font-bold' : 'text-stone-700 hover:bg-stone-300'}">
                            [QT] ใบเสนอราคา
                        </button>
                        <button onclick="window.reservationsModule.filterType('billing')" class="px-2.5 py-1 rounded transition ${this.currentType === 'billing' ? 'bg-amber-900 text-white font-bold' : 'text-stone-700 hover:bg-stone-300'}">
                            [INV] ใบแจ้งหนี้/วางบิล
                        </button>
                        <button onclick="window.reservationsModule.filterType('receipt')" class="px-2.5 py-1 rounded transition ${this.currentType === 'receipt' ? 'bg-emerald-900 text-white font-bold' : 'text-stone-700 hover:bg-stone-300'}">
                            [RE] ใบเสร็จรับเงิน
                        </button>
                    </div>

                    <!-- Status Filter -->
                    <div class="flex items-center gap-1.5 p-1 bg-[#eee3c8] border-2 border-stone-700 rounded-lg text-xs font-mono">
                        <button onclick="window.reservationsModule.filterStatus('reserved')" class="px-2.5 py-1 rounded transition ${this.currentStatus === 'reserved' ? 'bg-purple-900 text-white font-bold' : 'text-stone-700 hover:bg-stone-300'}">
                            เฉพาะที่ว่างอยู่
                        </button>
                        <button onclick="window.reservationsModule.filterStatus('used')" class="px-2.5 py-1 rounded transition ${this.currentStatus === 'used' ? 'bg-stone-800 text-white font-bold' : 'text-stone-700 hover:bg-stone-300'}">
                            ใช้งานแล้ว
                        </button>
                        <button onclick="window.reservationsModule.filterStatus('all')" class="px-2.5 py-1 rounded transition ${this.currentStatus === 'all' ? 'bg-stone-800 text-white font-bold' : 'text-stone-700 hover:bg-stone-300'}">
                            ทั้งหมด
                        </button>
                    </div>
                </div>

                <!-- Ledger Table -->
                <div class="overflow-x-auto">
                    <table class="w-full text-xs text-left border-collapse border-2 border-stone-800">
                        <thead>
                            <tr class="bg-[#eee3c8] text-stone-900 border-b-2 border-stone-800 font-bold">
                                <th class="p-2.5 border-r border-stone-700">เลขที่บิลที่กันไว้</th>
                                <th class="p-2.5 border-r border-stone-700">ประเภท</th>
                                <th class="p-2.5 border-r border-stone-700">ลูกค้า / โครงการที่ระบุไว้</th>
                                <th class="p-2.5 border-r border-stone-700">หมายเหตุบันทึก</th>
                                <th class="p-2.5 border-r border-stone-700">วันที่ทำรายการ</th>
                                <th class="p-2.5 border-r border-stone-700 text-center">ตราประทับ</th>
                                <th class="p-2.5 text-right">คำสั่งการ</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-stone-300">
                            ${list.length === 0 ? `
                                <tr>
                                    <td colspan="7" class="p-10 text-center text-stone-500 font-typewriter">
                                        [ ไม่พบรายการเลขที่กันไว้ในหมวดนี้ ]
                                        <br>
                                        <button onclick="window.reservationsModule.openReserveModal()" class="mt-2 text-purple-900 font-bold underline">
                                            + คลิกเพื่อกันเลขใหม่
                                        </button>
                                    </td>
                                </tr>
                            ` : list.map(r => `
                                <tr class="hover:bg-[#f7f1e1] transition">
                                    <td class="p-2.5 border-r border-stone-300">
                                        <span class="font-bold text-stone-950 font-typewriter text-sm">${r.code}</span>
                                    </td>
                                    <td class="p-2.5 border-r border-stone-300">
                                        ${app.getDocTypeBadge(r.doc_type)}
                                    </td>
                                    <td class="p-2.5 border-r border-stone-300">
                                        ${r.customer_name ? `
                                            <div class="font-bold text-stone-900">${r.customer_name}</div>
                                            ${r.project_name ? `<div class="text-[10px] text-blue-900">📌 ${r.project_name}</div>` : ''}
                                        ` : `
                                            <span class="text-stone-400 text-[11px]">[ ไม่ระบุลูกค้า ]</span>
                                        `}
                                    </td>
                                    <td class="p-2.5 border-r border-stone-300 text-stone-700 max-w-[220px]">
                                        ${r.note || '-'}
                                    </td>
                                    <td class="p-2.5 border-r border-stone-300 whitespace-nowrap text-stone-600">
                                        ${r.reserved_at ? app.formatDateThai(r.reserved_at.slice(0, 10)) : '-'}
                                    </td>
                                    <td class="p-2.5 border-r border-stone-300 text-center whitespace-nowrap">
                                        ${app.getStatusBadge(r.status)}
                                    </td>
                                    <td class="p-2.5 text-right whitespace-nowrap">
                                        ${r.status === 'reserved' ? `
                                            <button onclick="app.switchTab('create-doc', { type: '${r.doc_type}', useReservedCode: '${r.code}', customer_id: ${r.customer_id || 'null'}, project_id: ${r.project_id || 'null'} })" class="btn-typewriter text-[11px] py-1 px-2.5 mr-1 bg-purple-900 border-purple-950">
                                                ✍️ นำไปออกบิล
                                            </button>
                                            <button onclick="window.reservationsModule.cancelReservation(${r.id}, '${r.code}')" class="btn-paper text-[11px] py-1 px-2 text-red-800 border-red-800" title="ยกเลิกการกันเลขนี้">
                                                ยกเลิก
                                            </button>
                                        ` : `
                                            <span class="text-stone-400 text-[11px]">[ ใช้งานแล้ว ]</span>
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

    filterType(type) {
        this.currentType = type;
        this.loadList();
    },

    filterStatus(status) {
        this.currentStatus = status;
        this.loadList();
    },

    async openReserveModal() {
        app.openModal('modal-reserve');
        const selectCustomer = document.getElementById('reserve-customer-id');
        if (selectCustomer) {
            selectCustomer.innerHTML = '<option value="">-- ไม่ระบุ (ใช้กับลูกค้าใดก็ได้) --</option>';
            try {
                const res = await api.getCustomers();
                res.data.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.id;
                    opt.textContent = c.name;
                    selectCustomer.appendChild(opt);
                });
            } catch (e) {
                console.error(e);
            }
        }
    },

    async submitReserve() {
        const form = document.getElementById('form-reserve');
        if (!form) return;

        const doc_type = form.doc_type.value;
        const count = parseInt(form.count.value, 10);
        const note = form.note.value;
        const customer_id = form.customer_id.value || null;

        if (isNaN(count) || count < 1) {
            app.toast('กรุณาระบุจำนวนเลขที่ต้องการกันอย่างน้อย 1 เลข', 'warning');
            return;
        }

        try {
            const res = await api.reserveBatch({
                doc_type,
                count,
                note,
                customer_id
            });
            app.closeModal('modal-reserve');
            app.toast(res.message, 'success');
            form.reset();
            this.loadList();
        } catch (err) {
            app.toast(err.message, 'error');
        }
    },

    async cancelReservation(id, code) {
        if (!confirm(`คุณต้องการยกเลิกการกันเลข ${code} ใช่หรือไม่?`)) return;

        try {
            await api.cancelReservation(id);
            app.toast(`ยกเลิกการกันเลข ${code} เรียบร้อยแล้ว`, 'success');
            this.loadList();
        } catch (err) {
            app.toast(err.message, 'error');
        }
    }
};
