/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  GOOGLE APPS SCRIPT - Antar Jemput Vehicle Lending System      ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║                                                                 ║
 * ║  CARA SETUP:                                                    ║
 * ║  1. Buka Google Sheets → buat spreadsheet baru                 ║
 * ║  2. Klik Extensions → Apps Script                               ║
 * ║  3. Hapus semua code default                                    ║
 * ║  4. Copy-paste SELURUH code di file ini                        ║
 * ║  5. Klik Deploy → New Deployment                               ║
 * ║     - Pilih type: Web App                                       ║
 * ║     - Execute as: Me                                            ║
 * ║     - Who has access: Anyone                                    ║
 * ║  6. Klik Deploy → copy URL Web App                             ║
 * ║  7. Paste URL tersebut ke file js/config.js                    ║
 * ║     (ganti 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL')              ║
 * ║                                                                 ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

// Nama sheet untuk data peminjaman
const SHEET_NAME = 'Data Peminjaman';

/**
 * Setup awal - buat header kolom jika belum ada
 * Jalankan fungsi ini SATU KALI setelah paste code
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // Set headers
  const headers = [
    'TIMESTAMP',
    'TANGGAL PEMINJAMAN',
    'NAMA',
    'NOMOR TELEPON/WHATSAPP',
    'UNIT',
    'TUJUAN (JENIS KEGIATAN)',
    'LOKASI KEGIATAN',
    'JENIS PERJALANAN',
    'WAKTU KEBERANGKATAN',
    'WAKTU KEPULANGAN',
    'JUMLAH PENUMPANG',
    'JUMLAH ARMADA',
    'TANGGAL KEPULANGAN (JIKA MENGINAP)',
    'STATUS'
  ];

  // Write headers to first row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);

  // Style headers
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#1a73e8');
  headerRange.setFontColor('#ffffff');
  headerRange.setHorizontalAlignment('center');
  headerRange.setWrap(true);

  // Auto resize columns
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }

  // Set minimum column widths
  sheet.setColumnWidth(1, 160);  // Timestamp
  sheet.setColumnWidth(2, 150);  // Tanggal Peminjaman
  sheet.setColumnWidth(3, 180);  // Nama
  sheet.setColumnWidth(4, 180);  // Telepon
  sheet.setColumnWidth(5, 150);  // Unit
  sheet.setColumnWidth(6, 250);  // Tujuan
  sheet.setColumnWidth(7, 250);  // Lokasi
  sheet.setColumnWidth(8, 150);  // Jenis Perjalanan
  sheet.setColumnWidth(9, 160);  // Waktu Berangkat
  sheet.setColumnWidth(10, 160); // Waktu Pulang
  sheet.setColumnWidth(11, 150); // Jumlah Penumpang
  sheet.setColumnWidth(12, 150); // Jumlah Armada
  sheet.setColumnWidth(13, 200); // Tanggal Kepulangan
  sheet.setColumnWidth(14, 120); // Status

  // Freeze header row
  sheet.setFrozenRows(1);

  SpreadsheetApp.flush();
  Logger.log('Sheet setup selesai!');
}

/**
 * Handle POST request dari website
 */
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      setupSheet();
      sheet = ss.getSheetByName(SHEET_NAME);
    }

    // Parse incoming data
    const data = JSON.parse(e.postData.contents);
    const action = data.action || 'add';

    if (action === 'add') {
      // Prepare row data
      const timestamp = new Date();
      const row = [
        Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss'),
        data.tanggalPeminjaman || '',
        data.nama || '',
        data.telepon || '',
        data.unit || '',
        data.tujuan || '',
        data.lokasi || '',
        data.jenisPerjalanan || '',
        data.waktuBerangkat || '',
        data.waktuPulang || '',
        data.jumlahPenumpang || '',
        data.jumlahArmada || '',
        data.tanggalKepulangan || '',
        'Pending'
      ];

      // Append row to sheet
      sheet.appendRow(row);

      // Format the newly added row
      const lastRow = sheet.getLastRow();
      const statusCell = sheet.getRange(lastRow, 14);
      statusCell.setBackground('#fff3cd');
      statusCell.setFontColor('#856404');
      statusCell.setHorizontalAlignment('center');

      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          message: 'Data berhasil disimpan',
          row: lastRow
        }))
        .setMimeType(ContentService.MimeType.JSON);
    } 
    else if (action === 'update' || action === 'delete') {
      const targetTimestamp = data.id; // We use TIMESTAMP as ID
      const sheetData = sheet.getDataRange().getValues();
      let targetRow = -1;

      for (let i = 1; i < sheetData.length; i++) {
        // Column A (index 0) is TIMESTAMP
        if (sheetData[i][0] == targetTimestamp) {
          targetRow = i + 1; // 1-based row index
          break;
        }
      }

      if (targetRow === -1) {
        throw new Error('Data tidak ditemukan');
      }

      if (action === 'delete') {
        sheet.deleteRow(targetRow);
        return ContentService
          .createTextOutput(JSON.stringify({
            status: 'success',
            message: 'Data berhasil dihapus'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      } 
      else if (action === 'update') {
        // Update cells based on provided data
        if (data.tanggalPeminjaman !== undefined) sheet.getRange(targetRow, 2).setValue(data.tanggalPeminjaman);
        if (data.nama !== undefined) sheet.getRange(targetRow, 3).setValue(data.nama);
        if (data.telepon !== undefined) sheet.getRange(targetRow, 4).setValue(data.telepon);
        if (data.unit !== undefined) sheet.getRange(targetRow, 5).setValue(data.unit);
        if (data.tujuan !== undefined) sheet.getRange(targetRow, 6).setValue(data.tujuan);
        if (data.lokasi !== undefined) sheet.getRange(targetRow, 7).setValue(data.lokasi);
        if (data.jenisPerjalanan !== undefined) sheet.getRange(targetRow, 8).setValue(data.jenisPerjalanan);
        if (data.waktuBerangkat !== undefined) sheet.getRange(targetRow, 9).setValue(data.waktuBerangkat);
        if (data.waktuPulang !== undefined) sheet.getRange(targetRow, 10).setValue(data.waktuPulang);
        if (data.jumlahPenumpang !== undefined) sheet.getRange(targetRow, 11).setValue(data.jumlahPenumpang);
        if (data.jumlahArmada !== undefined) sheet.getRange(targetRow, 12).setValue(data.jumlahArmada);
        if (data.tanggalKepulangan !== undefined) sheet.getRange(targetRow, 13).setValue(data.tanggalKepulangan);
        if (data.status !== undefined) sheet.getRange(targetRow, 14).setValue(data.status);
        
        return ContentService
          .createTextOutput(JSON.stringify({
            status: 'success',
            message: 'Data berhasil diupdate'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

  } catch (error) {
    Logger.log('Error: ' + error.toString());

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET request (optional - untuk mengambil data)
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'error',
          message: 'Sheet tidak ditemukan'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const action = e.parameter.action || 'getAll';

    if (action === 'getAll') {
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1).map((row, index) => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i];
        });
        obj['ROW_NUMBER'] = index + 2; // +2 karena header di row 1
        return obj;
      });

      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'success',
          data: rows,
          count: rows.length
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Conditional formatting untuk kolom Status
 * Jalankan sekali untuk setup warna otomatis
 */
function setupConditionalFormatting() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) return;

  const statusRange = sheet.getRange('N2:N1000');

  // Clear existing rules
  sheet.clearConditionalFormatRules();

  const rules = [];

  // Pending - Yellow
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Pending')
    .setBackground('#fff3cd')
    .setFontColor('#856404')
    .setRanges([statusRange])
    .build());

  // Disetujui - Green
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Disetujui')
    .setBackground('#d4edda')
    .setFontColor('#155724')
    .setRanges([statusRange])
    .build());

  // Ditolak - Red
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Ditolak')
    .setBackground('#f8d7da')
    .setFontColor('#721c24')
    .setRanges([statusRange])
    .build());

  // Selesai - Blue
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Selesai')
    .setBackground('#cce5ff')
    .setFontColor('#004085')
    .setRanges([statusRange])
    .build());

  sheet.setConditionalFormatRules(rules);
  Logger.log('Conditional formatting berhasil diatur!');
}
