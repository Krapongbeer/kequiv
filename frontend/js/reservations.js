/**
 * Reservations Management Module (Clean Ocean Edition)
 * Zero-Collision Auto Buffer Pool & Manual Backdating Slates
 */

window.reservationsModule = {
    currentType: '',
    currentStatus: 'reserved',

    async loadList() {
        const container = document.getElementById('reservations-content');
        if (!container) return;

        container.innerHTML = `
            <div class="flex items-center justify-center p-12 text-slate-500 font-mono">
                <div class="text-center">
                    <div class="animate-spin text-3xl mb-2">⚙️</div>
                    <div>กำลังโหลดข้อมูลคลังเลขสำรอง...</div>
                </div>
            </div>
        `;

        try {
            const res = await api.getReservations(this.currentType, this.currentStatus);
            this.render(res.data);
        } catch (err) {
            container.innerHTML = `
                <div class="p-6 typewriter-card border-rose-300 text-rose-800 font-mono bg-rose-50/50">
                    <p class="font-bold">เกิดข้อผิดพลาดในการโหลดคลังเลขสำรอง</p>
                    <p class="text-xs mt-1">${err.message}</p>
                </div>
            `;
        }
    },

    getDisplayDate(r) {
        const m = (r.note || '').match(/\[(\d{4}-\d{2}-\d{2})\]/);
        if (m && m[1]) return m[1];
        if (!r.reserved_at) return '';
        try {
            return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date(r.reserved_at));
        } catch (e) {
            return String(r.reserved_at).slice(0, 10);
        }
    },

    render(list) {
        const container = document.getElementById('reservations-content');
        if (!container) return;

        // Sort newest date first so today's auto-buffer is immediately visible at the top
        const sortedList = (list || []).slice().sort((a, b) => {
            const dA = this.getDisplayDate(a);
            const dB = this.getDisplayDate(b);
            if (dA !== dB) return dB.localeCompare(dA);
            return (a.code || '').localeCompare(b.code || '');
        });

        container.innerHTML = `
            <div class="typewriter-card rounded-xl p-6 mb-6 font-mono bg-white">
                <!-- Header & Controls -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div>
                        <h2 class="text-xl font-bold text-slate-900 font-typewriter flex items-center gap-2">
                            <span>🔢</span> คลังเลขสำรอง (สำหรับออกบิลย้อนหลัง)
                        </h2>
                        <p class="text-xs text-slate-500 mt-1">
                            ระบบรันเลขกันไว้ล่วงหน้าวันละ 5 เลขอัตโนมัติ เพื่อให้มีเลขพร้อมดึงออกบิลย้อนหลังได้ตลอดเวลา เลขไม่กระโดดข้าม ไม่ชนกับบิลปัจจุบัน (เรียงจากวันที่ล่าสุด)
                        </p>
                    </div>
                    <div class="flex flex-wrap items-center gap-2 shrink-0">
                        <button id="btn-sync-buffer" onclick="window.reservationsModule.syncBuffer()" class="btn-paper text-xs py-2 px-3 border-sky-300 text-sky-800 hover:bg-sky-50">
                            <span>🔄 เช็ค/สำรองเลขวันนี้</span>
                        </button>
                        <button onclick="window.reservationsModule.openReserveModal()" class="btn-ocean text-xs py-2 px-3.5">
                            <span>+ จองเลขสำรองเพิ่ม</span>
                        </button>
                    </div>
                </div>

                <!-- Filters -->
                <div class="flex flex-wrap items-center justify-between gap-4 my-4">
                    <!-- Doc Type Filter -->
                    <div class="flex items-center gap-1.5 p-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono">
                        <button onclick="window.reservationsModule.filterType('')" class="px-3 py-1.5 rounded-lg transition ${this.currentType === '' ? 'bg-slate-900 text-white font-bold' : 'text-slate-700 hover:bg-slate-200'}">
                            ทุกประเภท
                        </button>
                        <button onclick="window.reservationsModule.filterType('quotation')" class="px-3 py-1.5 rounded-lg transition ${this.currentType === 'quotation' ? 'bg-sky-600 text-white font-bold' : 'text-slate-700 hover:bg-slate-200'}">
                            ใบเสนอราคา (QT)
                        </button>
                        <button onclick="window.reservationsModule.filterType('billing')" class="px-3 py-1.5 rounded-lg transition ${this.currentType === 'billing' ? 'bg-amber-600 text-white font-bold' : 'text-slate-700 hover:bg-slate-200'}">
                            ใบแจ้งหนี้/วางบิล (INV)
                        </button>
                        <button onclick="window.reservationsModule.filterType('receipt')" class="px-3 py-1.5 rounded-lg transition ${this.currentType === 'receipt' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-700 hover:bg-slate-200'}">
                            ใบเสร็จรับเงิน (RE)
                        </button>
                    </div>

                    <!-- Status Filter -->
                    <div class="flex items-center gap-1.5 p-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono">
                        <button onclick="window.reservationsModule.filterStatus('reserved')" class="px-3 py-1.5 rounded-lg transition ${this.currentStatus === 'reserved' ? 'bg-purple-700 text-white font-bold' : 'text-slate-700 hover:bg-slate-200'}">
                            เฉพาะที่ว่างอยู่
                        </button>
                        <button onclick="window.reservationsModule.filterStatus('used')" class="px-3 py-1.5 rounded-lg transition ${this.currentStatus === 'used' ? 'bg-slate-800 text-white font-bold' : 'text-slate-700 hover:bg-slate-200'}">
                            ใช้งานแล้ว
                        </button>
                        <button onclick="window.reservationsModule.filterStatus('all')" class="px-3 py-1.5 rounded-lg transition ${this.currentStatus === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-700 hover:bg-slate-200'}">
                            ทั้งหมด
                        </button>
                    </div>
                </div>

                <!-- Ledger Table -->
                <div class="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                    <table class="w-full text-xs text-left border-collapse min-w-[850px]">
                        <thead>
                            <tr class="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold font-typewriter">
                                <th class="py-3 px-3.5 whitespace-nowrap">เลขที่เอกสารสำรอง</th>
                                <th class="py-3 px-3.5 whitespace-nowrap">ประเภท</th>
                                <th class="py-3 px-3.5 min-w-[200px]">ลูกค้า / โครงการที่ระบุ</th>
                                <th class="py-3 px-3.5 min-w-[220px]">หมายเหตุ</th>
                                <th class="py-3 px-3.5 whitespace-nowrap">วันที่สำรอง</th>
                                <th class="py-3 px-3.5 text-center whitespace-nowrap">สถานะ</th>
                                <th class="py-3 px-3.5 text-right whitespace-nowrap">การดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${sortedList.length === 0 ? `
                                <tr>
                                    <td colspan="7" class="py-12 text-center text-slate-400 font-mono">
                                        ไม่มีรายการเลขสำรองในหมวดนี้
                                        <br>
                                        <button onclick="window.reservationsModule.openReserveModal()" class="mt-2 text-sky-700 font-bold hover:underline">
                                            + คลิกเพื่อจองเลขสำรองเพิ่ม
                                        </button>
                                    </td>
                                </tr>
                            ` : sortedList.map(r => {
                                const dispDate = this.getDisplayDate(r);
                                return `
                                <tr class="hover:bg-slate-50 transition">
                                    <td class="py-2.5 px-3.5 font-mono">
                                        <span class="font-bold text-slate-900 font-typewriter text-sm">${r.code}</span>
                                    </td>
                                    <td class="py-2.5 px-3.5 whitespace-nowrap">
                                        ${app.getDocTypeBadge(r.doc_type)}
                                    </td>
                                    <td class="py-2.5 px-3.5">
                                        ${r.customer_name ? `
                                            <div class="font-bold text-slate-900">${r.customer_name}</div>
                                            ${r.project_name ? `<div class="text-[10px] text-sky-700 font-medium">${r.project_name}</div>` : ''}
                                        ` : `
                                            <span class="text-slate-400 text-[11px]">ทั่วไป (ไม่ระบุ)</span>
                                        `}
                                    </td>
                                    <td class="py-2.5 px-3.5 text-slate-600 max-w-[220px]">
                                        ${r.note || '-'}
                                    </td>
                                    <td class="py-2.5 px-3.5 whitespace-nowrap text-slate-600">
                                        ${dispDate ? app.formatDateThai(dispDate) : '-'}
                                    </td>
                                    <td class="py-2.5 px-3.5 text-center whitespace-nowrap">
                                        ${app.getStatusBadge(r.status)}
                                    </td>
                                    <td class="py-2.5 px-3.5 text-right whitespace-nowrap space-x-1">
                                        ${r.status === 'reserved' ? `
                                            <button onclick="app.switchTab('create-doc', { type: '${r.doc_type}', useReservedCode: '${r.code}', customer_id: ${r.customer_id || 'null'}, project_id: ${r.project_id || 'null'} })" class="btn-ocean text-xs py-1 px-2.5">
                                                ✍️ นำไปออกบิล
                                            </button>
                                            <button onclick="window.reservationsModule.cancelReservation(${r.id}, '${r.code}')" class="btn-paper text-xs py-1 px-2 text-rose-700 border-rose-300 hover:bg-rose-50" title="ยกเลิกเลขสำรองนี้">
                                                ยกเลิก
                                            </button>
                                        ` : `
                                            <span class="text-slate-400 text-xs">ใช้งานแล้ว</span>
                                        `}
                                    </td>
                                </tr>
                            `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    async syncBuffer() {
        const btn = document.getElementById('btn-sync-buffer');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="animate-spin inline-block">⚙️</span> กำลังตรวจสอบ...';
        }
        try {
            const res = await api.syncReservationBuffer();
            app.toast(res.message || 'ตรวจสอบเลขสำรองเรียบร้อย', 'success');
            await this.loadList();
        } catch (err) {
            app.toast(err.message || 'เกิดข้อผิดพลาดในการซิงค์เลขสำรอง', 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span>🔄 เช็ค/สำรองเลขวันนี้</span>';
            }
        }
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
            app.toast('กรุณาระบุจำนวนเลขที่ต้องการสำรองอย่างน้อย 1 เลข', 'warning');
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
        if (!confirm(`คุณต้องการยกเลิกการสำรองเลข ${code} ใช่หรือไม่?`)) return;

        try {
            await api.cancelReservation(id);
            app.toast(`ยกเลิกเลขสำรอง ${code} เรียบร้อยแล้ว`, 'success');
            this.loadList();
        } catch (err) {
            app.toast(err.message, 'error');
        }
    }
};
