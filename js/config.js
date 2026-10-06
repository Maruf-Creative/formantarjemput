/**
 * ╔══════════════════════════════════════════════╗
 * ║  CONFIGURATION - Google Apps Script URL      ║
 * ╠══════════════════════════════════════════════╣
 * ║  Ganti URL di bawah dengan URL Google Apps   ║
 * ║  Script Web App Anda setelah deploy.         ║
 * ╚══════════════════════════════════════════════╝
 */

const CONFIG = {
  // ⚠️ GANTI URL INI dengan URL Web App dari Google Apps Script Anda
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxgjcTHA5RH38ukhHno5oCrQEavT-fJ9Wkb98tZZxxzaD2cqWujSKJFHzpOoWRmxhGX/exec',

  // Nama sheet di Google Spreadsheet
  SHEET_NAME: 'Data Peminjaman',

  // Items per page di admin table
  ITEMS_PER_PAGE: 10,

  // Status options
  STATUS: {
    PENDING: 'Pending',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
    COMPLETED: 'Selesai',
  },

  // Jenis Perjalanan options
  JENIS_PERJALANAN: ['Dalam Kota', 'Luar Kota', 'Antar Provinsi'],

  // Kredensial Admin (Simple Client-Side Auth)
  ADMIN_CREDENTIALS: {
    USERNAME: 'admin',
    PASSWORD: 'password123'
  }
};
