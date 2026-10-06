/**
 * ╔══════════════════════════════════════════════╗
 * ║  UTILITY FUNCTIONS                           ║
 * ╠══════════════════════════════════════════════╣
 * ║  Shared helpers: toast, navbar, date format  ║
 * ╚══════════════════════════════════════════════╝
 */

// ── Toast Notification System ──
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toastContainer');
  },

  show(type, title, message, duration = 4000) {
    if (!this.container) this.init();

    const icons = {
      success: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>',
      error: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>',
      warning: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>',
      info: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>',
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <div class="toast__icon">${icons[type]}</div>
      <div class="toast__content">
        <div class="toast__title">${title}</div>
        <div class="toast__message">${message}</div>
      </div>
      <button class="toast__close" aria-label="Close notification">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
      </button>
    `;

    this.container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast__close');
    closeBtn.addEventListener('click', () => this.remove(toast));

    setTimeout(() => this.remove(toast), duration);
  },

  remove(toast) {
    if (!toast.parentNode) return;
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  },

  success(title, message) { this.show('success', title, message); },
  error(title, message) { this.show('error', title, message, 6000); },
  warning(title, message) { this.show('warning', title, message, 5000); },
  info(title, message) { this.show('info', title, message); },
};

// ── Navbar Scroll & Mobile Toggle ──
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
    });

    // Close menu when clicking a link
    links.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        links.classList.remove('open');
      });
    });
  }
}

// ── Date Formatting ──
function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateLong(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ── Status Badge HTML ──
function getStatusBadge(status) {
  const statusMap = {
    'Pending': 'pending',
    'Disetujui': 'approved',
    'Ditolak': 'rejected',
    'Selesai': 'completed',
  };

  const labelMap = {
    'Pending': 'Menunggu',
    'Disetujui': 'Disetujui',
    'Ditolak': 'Ditolak',
    'Selesai': 'Selesai',
  };

  const badgeClass = statusMap[status] || 'pending';
  const label = labelMap[status] || status;

  return `<span class="badge badge--${badgeClass}"><span class="dot"></span>${label}</span>`;
}

// ── Local Storage CRUD (offline fallback & primary data for demo) ──
const DataStore = {
  KEY: 'antarJemput_data',

  getAll() {
    const data = localStorage.getItem(this.KEY);
    return data ? JSON.parse(data) : [];
  },

  save(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
  },

  add(item) {
    const items = this.getAll();
    item.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    item.status = CONFIG.STATUS.PENDING;
    item.createdAt = new Date().toISOString();
    items.unshift(item);
    this.save(items);
    return item;
  },

  update(id, updates) {
    const items = this.getAll();
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
      this.save(items);
      return items[index];
    }
    return null;
  },

  delete(id) {
    const items = this.getAll();
    const filtered = items.filter(item => item.id !== id);
    this.save(filtered);
    return filtered.length < items.length;
  },

  getById(id) {
    return this.getAll().find(item => item.id === id) || null;
  },
};

// ── Send data to Google Apps Script ──
async function sendToGoogleSheet(data) {
  if (CONFIG.APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
    console.warn('Google Apps Script URL belum dikonfigurasi. Data hanya disimpan di localStorage.');
    return { success: true, local: true };
  }

  try {
    const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending to Google Sheet:', error);
    return { success: false, error: error.message };
  }
}

// ── CSV Export ──
function exportToCSV(data, filename = 'data_peminjaman.csv') {
  if (data.length === 0) {
    Toast.warning('Export Gagal', 'Tidak ada data untuk diekspor.');
    return;
  }

  const headers = [
    'No', 'Tanggal Peminjaman', 'Nama', 'Telepon', 'Unit',
    'Tujuan', 'Lokasi', 'Jenis Perjalanan', 'Waktu Berangkat',
    'Waktu Pulang', 'Jumlah Penumpang', 'Jumlah Armada',
    'Tanggal Kepulangan', 'Status',
  ];

  const rows = data.map((item, i) => [
    i + 1,
    item.tanggalPeminjaman,
    item.nama,
    item.telepon,
    item.unit,
    `"${(item.tujuan || '').replace(/"/g, '""')}"`,
    `"${(item.lokasi || '').replace(/"/g, '""')}"`,
    item.jenisPerjalanan,
    item.waktuBerangkat,
    item.waktuPulang,
    item.jumlahPenumpang,
    item.jumlahArmada,
    item.tanggalKepulangan || '-',
    item.status,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);

  Toast.success('Export Berhasil', `${data.length} data berhasil diekspor ke CSV.`);
}

// ── Truncate text ──
function truncate(str, len = 30) {
  if (!str) return '-';
  return str.length > len ? str.substring(0, len) + '…' : str;
}

// ── Initialize navbar on every page ──
document.addEventListener('DOMContentLoaded', initNavbar);
