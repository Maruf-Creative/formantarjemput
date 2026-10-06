/**
 * ╔══════════════════════════════════════════════╗
 * ║  FORM PAGE - Submission Logic                ║
 * ╠══════════════════════════════════════════════╣
 * ║  Handles form validation & submission to     ║
 * ║  Google Sheets + localStorage                ║
 * ╚══════════════════════════════════════════════╝
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formPeminjaman');
  const btnSubmit = document.getElementById('btnSubmit');

  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('tanggalPeminjaman').value = today;

  // Sync aria-invalid on blur for accessibility
  form.addEventListener('blur', (e) => {
    if (e.target.matches('input[required], select[required], textarea[required]')) {
      syncAriaInvalid(e.target);
    }
  }, true);

  form.addEventListener('input', (e) => {
    if (e.target.matches('input[required], select[required], textarea[required]') && e.target.checkValidity()) {
      e.target.removeAttribute('aria-invalid');
    }
  });

  function syncAriaInvalid(input) {
    if (!input.checkValidity()) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  }

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate all fields
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    requiredFields.forEach(field => {
      if (!field.checkValidity()) {
        isValid = false;
        syncAriaInvalid(field);
      }
    });

    if (!isValid) {
      Toast.error('Validasi Gagal', 'Mohon lengkapi semua field yang wajib diisi.');
      // Focus first invalid field
      const firstInvalid = form.querySelector(':invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Collect form data
    const formData = {
      tanggalPeminjaman: document.getElementById('tanggalPeminjaman').value,
      nama: document.getElementById('nama').value.trim(),
      telepon: document.getElementById('telepon').value.trim(),
      unit: document.getElementById('unit').value.trim(),
      tujuan: document.getElementById('tujuan').value.trim(),
      lokasi: document.getElementById('lokasi').value.trim(),
      jenisPerjalanan: document.getElementById('jenisPerjalanan').value,
      waktuBerangkat: document.getElementById('waktuBerangkat').value,
      waktuPulang: document.getElementById('waktuPulang').value,
      jumlahPenumpang: document.getElementById('jumlahPenumpang').value,
      jumlahArmada: document.getElementById('jumlahArmada').value,
      tanggalKepulangan: document.getElementById('tanggalKepulangan').value || '',
    };

    // Show loading
    btnSubmit.classList.add('btn--loading');
    btnSubmit.disabled = true;

    try {
      // Save to localStorage
      const savedItem = DataStore.add(formData);

      // Send to Google Sheets
      const result = await sendToGoogleSheet(formData);

      if (result.local) {
        Toast.success('Berhasil Disimpan!', 'Data peminjaman berhasil dicatat. Catatan: Google Sheets belum dikonfigurasi, data disimpan lokal.');
      } else if (result.success) {
        Toast.success('Berhasil Dikirim!', 'Data peminjaman berhasil dikirim ke sistem.');
      } else {
        Toast.warning('Disimpan Lokal', 'Data disimpan lokal. Gagal mengirim ke Google Sheets: ' + (result.error || 'Unknown error'));
      }

      // Reset form
      form.reset();
      document.getElementById('tanggalPeminjaman').value = today;

      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      Toast.error('Error', 'Terjadi kesalahan saat menyimpan data: ' + error.message);
    } finally {
      btnSubmit.classList.remove('btn--loading');
      btnSubmit.disabled = false;
    }
  });
});
