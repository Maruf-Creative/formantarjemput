/**
 * ╔══════════════════════════════════════════════╗
 * ║  ADMIN PANEL - CRUD & Data Management        ║
 * ╠══════════════════════════════════════════════╣
 * ║  Table rendering, search, filter, pagination, ║
 * ║  edit/delete modals, stats, & surat jalan    ║
 * ╚══════════════════════════════════════════════╝
 */

document.addEventListener('DOMContentLoaded', () => {
  // ── Authentication ──
  const loginOverlay = document.getElementById('loginOverlay');
  const adminContent = document.getElementById('adminContent');
  const loginForm = document.getElementById('loginForm');

  // Check session
  if (sessionStorage.getItem('adminAuth') === 'true') {
    loginOverlay.classList.remove('active');
    adminContent.style.display = 'block';
    renderAll();
  }

  // Handle Login
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = document.getElementById('adminUsername').value;
      const pass = document.getElementById('adminPassword').value;

      if (user === CONFIG.ADMIN_CREDENTIALS.USERNAME && pass === CONFIG.ADMIN_CREDENTIALS.PASSWORD) {
        sessionStorage.setItem('adminAuth', 'true');
        loginOverlay.classList.remove('active');
        adminContent.style.display = 'block';
        Toast.success('Login Berhasil', 'Selamat datang di Admin Panel.');
        renderAll();
      } else {
        Toast.error('Login Gagal', 'Username atau password salah.');
      }
    });
  }

  // ── State ──
  let currentPage = 1;
  let searchQuery = '';
  let filterStatus = '';
  let deleteTargetId = null;
  let currentDetailData = null;

  // ── DOM References ──
  const tableBody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');
  const paginationEl = document.getElementById('pagination');
  const searchInput = document.getElementById('searchInput');
  const filterSelect = document.getElementById('filterStatus');
  const statsEls = {
    total: document.getElementById('statTotal'),
    pending: document.getElementById('statPending'),
    approved: document.getElementById('statApproved'),
    rejected: document.getElementById('statRejected'),
  };

  // Modals
  const detailModal = document.getElementById('detailModal');
  const detailModalBody = document.getElementById('detailModalBody');
  const editModal = document.getElementById('editModal');
  const deleteDialog = document.getElementById('deleteDialog');

  // ── Initialize ──
  // renderAll is now called after successful login or session check

  // ── Event Listeners ──
  searchInput.addEventListener('input', debounce((e) => {
    searchQuery = e.target.value.toLowerCase();
    currentPage = 1;
    renderAll();
  }, 300));

  filterSelect.addEventListener('change', (e) => {
    filterStatus = e.target.value;
    currentPage = 1;
    renderAll();
  });

  document.getElementById('btnRefresh').addEventListener('click', () => {
    renderAll();
    Toast.info('Data Diperbarui', 'Tabel data telah diperbarui.');
  });

  document.getElementById('btnExport').addEventListener('click', () => {
    const data = getFilteredData();
    exportToCSV(data);
  });

  // Detail modal close
  document.getElementById('detailModalClose').addEventListener('click', () => {
    detailModal.classList.remove('active');
  });
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) detailModal.classList.remove('active');
  });

  // Edit modal close
  document.getElementById('editModalClose').addEventListener('click', () => {
    editModal.classList.remove('active');
  });
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) editModal.classList.remove('active');
  });

  // Save edit
  document.getElementById('btnSaveEdit').addEventListener('click', saveEdit);

  // Delete dialog
  document.getElementById('deleteCancel').addEventListener('click', () => {
    deleteDialog.close();
    deleteTargetId = null;
  });
  document.getElementById('deleteConfirm').addEventListener('click', confirmDelete);

  // Print surat jalan
  document.getElementById('btnPrintSurat').addEventListener('click', () => {
    if (currentDetailData) {
      printSuratJalan(currentDetailData);
    }
  });

  // ── Core Functions ──

  function getFilteredData() {
    let data = DataStore.getAll();

    if (searchQuery) {
      data = data.filter(item =>
        (item.nama || '').toLowerCase().includes(searchQuery) ||
        (item.unit || '').toLowerCase().includes(searchQuery) ||
        (item.tujuan || '').toLowerCase().includes(searchQuery) ||
        (item.lokasi || '').toLowerCase().includes(searchQuery) ||
        (item.telepon || '').includes(searchQuery)
      );
    }

    if (filterStatus) {
      data = data.filter(item => item.status === filterStatus);
    }

    return data;
  }

  function renderAll() {
    updateStats();
    renderTable();
  }

  function updateStats() {
    const allData = DataStore.getAll();
    statsEls.total.textContent = allData.length;
    statsEls.pending.textContent = allData.filter(d => d.status === CONFIG.STATUS.PENDING).length;
    statsEls.approved.textContent = allData.filter(d => d.status === CONFIG.STATUS.APPROVED).length;
    statsEls.rejected.textContent = allData.filter(d => d.status === CONFIG.STATUS.REJECTED).length;

    // Animate count
    animateCounters();
  }

  function animateCounters() {
    document.querySelectorAll('.stat-card__value').forEach(el => {
      const target = parseInt(el.textContent);
      if (isNaN(target)) return;
      let current = 0;
      const increment = Math.max(1, Math.ceil(target / 20));
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        el.textContent = current;
      }, 30);
    });
  }

  function renderTable() {
    const data = getFilteredData();
    const totalPages = Math.max(1, Math.ceil(data.length / CONFIG.ITEMS_PER_PAGE));

    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const pageData = data.slice(start, start + CONFIG.ITEMS_PER_PAGE);

    if (data.length === 0) {
      tableBody.innerHTML = '';
      emptyState.style.display = 'block';
      paginationEl.innerHTML = '';
      return;
    }

    emptyState.style.display = 'none';

    tableBody.innerHTML = pageData.map((item, idx) => `
      <tr style="animation: fadeInUp 0.3s ease-out ${idx * 0.05}s both;">
        <td>${start + idx + 1}</td>
        <td>${formatDate(item.tanggalPeminjaman)}</td>
        <td><strong>${escapeHtml(item.nama)}</strong></td>
        <td>${escapeHtml(item.unit)}</td>
        <td title="${escapeHtml(item.tujuan)}">${truncate(item.tujuan, 25)}</td>
        <td title="${escapeHtml(item.lokasi)}">${truncate(item.lokasi, 20)}</td>
        <td>${escapeHtml(item.jenisPerjalanan)}</td>
        <td>${item.waktuBerangkat || '-'}</td>
        <td>${item.waktuPulang || '-'}</td>
        <td style="text-align:center;">${item.jumlahPenumpang || '-'}</td>
        <td style="text-align:center;">${item.jumlahArmada || '-'}</td>
        <td>${getStatusBadge(item.status)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn--icon btn--secondary" onclick="viewDetail('${item.id}')" title="Lihat Detail">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
            </button>
            <button class="btn btn--icon btn--secondary" onclick="openEdit('${item.id}')" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
            </button>
            <button class="btn btn--icon btn--danger" onclick="openDelete('${item.id}')" title="Hapus" style="background:rgba(239,68,68,0.1); color:var(--color-danger); box-shadow:none;">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }

    let html = `
      <button class="pagination__btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
      </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
      if (totalPages > 7) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
          html += `<button class="pagination__btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
          html += `<span style="color:var(--color-text-muted); padding:0 4px;">…</span>`;
        }
      } else {
        html += `<button class="pagination__btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
      }
    }

    html += `
      <button class="pagination__btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
      </button>
    `;

    paginationEl.innerHTML = html;
  }

  // ── Global functions (called from onclick in HTML) ──
  window.changePage = function(page) {
    currentPage = page;
    renderTable();
    window.scrollTo({ top: document.querySelector('.toolbar').offsetTop - 100, behavior: 'smooth' });
  };

  window.viewDetail = function(id) {
    const item = DataStore.getById(id);
    if (!item) return;

    currentDetailData = item;

    detailModalBody.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-item__label">Tanggal Peminjaman</div>
          <div class="detail-item__value">${formatDateLong(item.tanggalPeminjaman)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item__label">Nama</div>
          <div class="detail-item__value">${escapeHtml(item.nama)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item__label">Telepon/WhatsApp</div>
          <div class="detail-item__value">${escapeHtml(item.telepon)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item__label">Unit</div>
          <div class="detail-item__value">${escapeHtml(item.unit)}</div>
        </div>
        <div class="detail-item" style="grid-column:1/-1;">
          <div class="detail-item__label">Tujuan / Jenis Kegiatan</div>
          <div class="detail-item__value">${escapeHtml(item.tujuan)}</div>
        </div>
        <div class="detail-item" style="grid-column:1/-1;">
          <div class="detail-item__label">Lokasi Kegiatan</div>
          <div class="detail-item__value">${escapeHtml(item.lokasi)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item__label">Jenis Perjalanan</div>
          <div class="detail-item__value">${escapeHtml(item.jenisPerjalanan)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item__label">Waktu Keberangkatan</div>
          <div class="detail-item__value">${item.waktuBerangkat || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item__label">Waktu Kepulangan</div>
          <div class="detail-item__value">${item.waktuPulang || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item__label">Jumlah Penumpang</div>
          <div class="detail-item__value">${item.jumlahPenumpang || '-'} orang</div>
        </div>
        <div class="detail-item">
          <div class="detail-item__label">Jumlah Armada</div>
          <div class="detail-item__value">${item.jumlahArmada || '-'} unit</div>
        </div>
        <div class="detail-item">
          <div class="detail-item__label">Tanggal Kepulangan</div>
          <div class="detail-item__value">${item.tanggalKepulangan ? formatDateLong(item.tanggalKepulangan) : 'Tidak menginap'}</div>
        </div>
        <div class="detail-item" style="grid-column:1/-1;">
          <div class="detail-item__label">Status</div>
          <div class="detail-item__value">${getStatusBadge(item.status)}</div>
        </div>
      </div>
    `;

    detailModal.classList.add('active');
  };

  window.openEdit = function(id) {
    const item = DataStore.getById(id);
    if (!item) return;

    document.getElementById('editId').value = item.id;
    document.getElementById('editTanggal').value = item.tanggalPeminjaman;
    document.getElementById('editNama').value = item.nama;
    document.getElementById('editTelepon').value = item.telepon;
    document.getElementById('editUnit').value = item.unit;
    document.getElementById('editTujuan').value = item.tujuan;
    document.getElementById('editLokasi').value = item.lokasi;
    document.getElementById('editJenisPerjalanan').value = item.jenisPerjalanan;
    document.getElementById('editWaktuBerangkat').value = item.waktuBerangkat;
    document.getElementById('editWaktuPulang').value = item.waktuPulang;
    document.getElementById('editJumlahPenumpang').value = item.jumlahPenumpang;
    document.getElementById('editJumlahArmada').value = item.jumlahArmada;
    document.getElementById('editTanggalKepulangan').value = item.tanggalKepulangan || '';
    document.getElementById('editStatus').value = item.status;

    editModal.classList.add('active');
  };

  function saveEdit() {
    const id = document.getElementById('editId').value;
    const updates = {
      tanggalPeminjaman: document.getElementById('editTanggal').value,
      nama: document.getElementById('editNama').value.trim(),
      telepon: document.getElementById('editTelepon').value.trim(),
      unit: document.getElementById('editUnit').value.trim(),
      tujuan: document.getElementById('editTujuan').value.trim(),
      lokasi: document.getElementById('editLokasi').value.trim(),
      jenisPerjalanan: document.getElementById('editJenisPerjalanan').value,
      waktuBerangkat: document.getElementById('editWaktuBerangkat').value,
      waktuPulang: document.getElementById('editWaktuPulang').value,
      jumlahPenumpang: document.getElementById('editJumlahPenumpang').value,
      jumlahArmada: document.getElementById('editJumlahArmada').value,
      tanggalKepulangan: document.getElementById('editTanggalKepulangan').value,
      status: document.getElementById('editStatus').value,
    };

    if (!updates.nama || !updates.tanggalPeminjaman) {
      Toast.error('Validasi Gagal', 'Nama dan tanggal peminjaman wajib diisi.');
      return;
    }

    const result = DataStore.update(id, updates);
    if (result) {
      Toast.success('Data Diperbarui', `Data peminjaman ${updates.nama} berhasil diperbarui.`);
      editModal.classList.remove('active');
      renderAll();
    } else {
      Toast.error('Gagal', 'Data tidak ditemukan.');
    }
  }

  window.openDelete = function(id) {
    deleteTargetId = id;
    deleteDialog.showModal();
  };

  function confirmDelete() {
    if (!deleteTargetId) return;
    const item = DataStore.getById(deleteTargetId);
    const success = DataStore.delete(deleteTargetId);
    deleteDialog.close();

    if (success) {
      Toast.success('Data Dihapus', `Data peminjaman ${item?.nama || ''} berhasil dihapus.`);
      renderAll();
    } else {
      Toast.error('Gagal', 'Data tidak ditemukan.');
    }
    deleteTargetId = null;
  }

  // ── Surat Jalan Print ──
  function printSuratJalan(data) {
    const suratWindow = window.open('', '_blank', 'width=800,height=600');
    suratWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Surat Jalan - ${data.nama}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            color: #000;
            padding: 40px;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 3px double #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            font-size: 18pt;
            letter-spacing: 2px;
            margin-bottom: 5px;
          }
          .header h2 {
            font-size: 14pt;
            font-weight: normal;
          }
          .nomor {
            text-align: center;
            margin-bottom: 20px;
          }
          .nomor strong {
            font-size: 13pt;
            text-decoration: underline;
          }
          table.info {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          table.info td {
            padding: 5px 10px;
            vertical-align: top;
          }
          table.info td:first-child {
            width: 200px;
            font-weight: bold;
          }
          table.info td:nth-child(2) {
            width: 15px;
            text-align: center;
          }
          .content {
            margin: 20px 0;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
          }
          .sign-box {
            text-align: center;
            width: 200px;
          }
          .sign-box .line {
            margin-top: 80px;
            border-bottom: 1px solid #000;
            margin-bottom: 5px;
          }
          .footer-note {
            margin-top: 40px;
            font-size: 10pt;
            color: #666;
            text-align: center;
            font-style: italic;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SURAT JALAN</h1>
          <h2>Peminjaman Kendaraan Operasional</h2>
        </div>

        <div class="nomor">
          <strong>No: SJ/${new Date().getFullYear()}/${String(Date.now()).slice(-6)}</strong>
        </div>

        <div class="content">
          <p>Yang bertanda tangan di bawah ini memberikan izin penggunaan kendaraan operasional dengan rincian sebagai berikut:</p>

          <table class="info">
            <tr>
              <td>Tanggal Peminjaman</td>
              <td>:</td>
              <td>${formatDateLong(data.tanggalPeminjaman)}</td>
            </tr>
            <tr>
              <td>Nama Peminjam</td>
              <td>:</td>
              <td>${data.nama}</td>
            </tr>
            <tr>
              <td>No. Telepon/WA</td>
              <td>:</td>
              <td>${data.telepon}</td>
            </tr>
            <tr>
              <td>Unit</td>
              <td>:</td>
              <td>${data.unit}</td>
            </tr>
            <tr>
              <td>Tujuan/Jenis Kegiatan</td>
              <td>:</td>
              <td>${data.tujuan}</td>
            </tr>
            <tr>
              <td>Lokasi Kegiatan</td>
              <td>:</td>
              <td>${data.lokasi}</td>
            </tr>
            <tr>
              <td>Jenis Perjalanan</td>
              <td>:</td>
              <td>${data.jenisPerjalanan}</td>
            </tr>
            <tr>
              <td>Waktu Keberangkatan</td>
              <td>:</td>
              <td>${data.waktuBerangkat || '-'}</td>
            </tr>
            <tr>
              <td>Waktu Kepulangan</td>
              <td>:</td>
              <td>${data.waktuPulang || '-'}</td>
            </tr>
            <tr>
              <td>Jumlah Penumpang</td>
              <td>:</td>
              <td>${data.jumlahPenumpang || '-'} orang</td>
            </tr>
            <tr>
              <td>Jumlah Armada</td>
              <td>:</td>
              <td>${data.jumlahArmada || '-'} unit</td>
            </tr>
            ${data.tanggalKepulangan ? `
            <tr>
              <td>Tanggal Kepulangan</td>
              <td>:</td>
              <td>${formatDateLong(data.tanggalKepulangan)}</td>
            </tr>` : ''}
          </table>

          <p style="margin-top:15px;">Demikian surat jalan ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
        </div>

        <div class="signatures">
          <div class="sign-box">
            <p>Peminjam,</p>
            <div class="line"></div>
            <p>${data.nama}</p>
          </div>
          <div class="sign-box">
            <p>Mengetahui,</p>
            <div class="line"></div>
            <p>(_________________________)</p>
          </div>
          <div class="sign-box">
            <p>Penanggung Jawab,</p>
            <div class="line"></div>
            <p>(_________________________)</p>
          </div>
        </div>

        <p class="footer-note">Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `);
    suratWindow.document.close();
  }

  // ── Helpers ──
  function debounce(fn, delay) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
});

// ── HTML Escape (security) ──
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
