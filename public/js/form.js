/**
 * @file form.js - halaman Caption.
 * Validasi nama produk & harga, lalu buat caption dari template yang dipilih.
 * Bisa terisi otomatis dari tombol "Buat caption" di halaman Etalase.
 */

/**
 * Template caption. Key-nya harus sama dengan `value` di <select id="template">.
 * Parameter: nama produk, harga (sudah format Rupiah), hashtag nama produk (tanpa #).
 */
const templates = {
  promo: (nama, harga, tag) => `🔥 PROMO SEGAR HARI INI! 🔥

${nama} lagi diskon, dan ini bukan prank! 😱

💸 Harga spesial: ${harga}
🛒 Dapur penuh, dompet tetap aman
⏰ Stok terbatas, siapa cepat dia dapat

Masukkan ke keranjang sekarang sebelum harga balik normal. Ajak keluarga dan tetangga borong bareng, biar makin hemat! 🥳

#Promo #${tag} #BelanjaHemat #DiskonHariIni #SegarMart`,

  santai: (nama, harga, tag) => `Hai tetangga! 👋🌿

Lagi cari ${nama}? Pas banget, kamu mampir di tempat yang tepat 😎

Cuma ${harga}, udah bisa dibawa pulang. Worth it parah sih, apalagi buat stok di rumah 🏡✨

🥬 Selalu segar
💚 Harga ramah di kantong
🛵 Bisa diantar sampai depan pintu

Mau titip? Chat aja ya, kami siap bantu~ 💬

#${tag} #BelanjaSantai #RekomendasiBelanja #WorthIt #SegarMart`,

  formal: (nama, harga, tag) => `✦ ${nama} ✦

Kami dengan bangga menghadirkan ${nama} untuk memenuhi kebutuhan keluarga Anda.

Harga: ${harga}

Keunggulan:
• Kualitas dijaga melalui seleksi yang ketat
• Penyimpanan dan pengemasan yang higienis
• Pengiriman aman dan tepat waktu

Untuk pemesanan dan informasi lebih lanjut, silakan hubungi kami melalui pesan langsung. Terima kasih atas kepercayaan Anda.

#${tag} #ProdukBerkualitas #BelanjaAman #SegarMart`,
};

const form = document.getElementById("form");
const captionEl = document.getElementById("caption");
const copyBtn = document.getElementById("copyBtn");
const hargaHint = document.getElementById("harga-hint");

/**
 * Aturan validasi per input (key = id input).
 * Mengembalikan pesan error, atau string kosong kalau valid.
 */
const rules = {
  nama: (v) => {
    v = v.trim();
    if (!v) return "Nama produk wajib diisi.";
    if (v.length < 3) return `Nama produk minimal 3 karakter (sekarang ${v.length}).`;
    if (v.length > 60) return `Nama produk maksimal 60 karakter (sekarang ${v.length}).`;
    if (!/\p{L}/u.test(v)) return "Nama produk harus mengandung huruf.";
    return "";
  },
  harga: (v) => {
    if (!v) return "Harga wajib diisi.";
    const n = Number(v);
    if (!Number.isInteger(n)) return "Harga harus angka bulat, tanpa koma.";
    if (n < 1000) return "Harga minimal Rp 1.000.";
    if (n > 100000000) return "Harga maksimal Rp 100.000.000.";
    return "";
  },
};

/**
 * Ubah angka jadi teks Rupiah.
 * @param {number} n
 * @returns {string}
 */
function formatRupiah(n) {
  return n.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
}

/**
 * Validasi satu input: tampilkan pesan error dan set aria-invalid.
 * @param {string} id - id input, harus ada di {@link rules}.
 * @returns {boolean} true kalau valid.
 */
function validate(id) {
  const input = document.getElementById(id);
  const msg = rules[id](input.value);
  document.getElementById(`${id}-error`).textContent = msg;
  input.setAttribute("aria-invalid", msg ? "true" : "false");
  return !msg;
}

/** Tampilkan pratinjau harga dalam Rupiah di bawah input harga. */
function updateHargaHint() {
  const n = Number(document.getElementById("harga").value);
  hargaHint.textContent = n > 0 ? `Tampil sebagai ${formatRupiah(n)}` : "";
}

// cek langsung saat mengetik, supaya error ketahuan tanpa menunggu submit
for (const id in rules) {
  document.getElementById(id).addEventListener("input", () => validate(id));
}
document.getElementById("harga").addEventListener("input", updateHargaHint);

// isi otomatis kalau datang dari tombol "Buat caption" di Etalase
const params = new URLSearchParams(location.search);
if (params.get("nama")) {
  document.getElementById("nama").value = params.get("nama");
  document.getElementById("harga").value = params.get("harga") || "";
  document.getElementById("prefill").hidden = false;
  updateHargaHint();
  for (const id in rules) validate(id);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const invalid = Object.keys(rules).filter((id) => !validate(id));
  if (invalid.length) {
    document.getElementById(invalid[0]).focus();
    captionEl.value = "";
    copyBtn.disabled = true;
    return;
  }

  const nama = document.getElementById("nama").value.trim();
  const harga = formatRupiah(Number(document.getElementById("harga").value));
  const template = document.getElementById("template").value;
  // "kopi susu aren" menjadi "KopiSusuAren"
  const tag = nama.replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");

  captionEl.value = templates[template](nama, harga, tag);
  copyBtn.disabled = false;
});

// tombol salin caption
copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(captionEl.value);
  } catch {
    captionEl.select();
    document.execCommand("copy"); // cadangan kalau clipboard API tidak tersedia
  }
  copyBtn.textContent = "Tersalin ✓";
  setTimeout(() => (copyBtn.textContent = "Salin caption"), 1800);
});
