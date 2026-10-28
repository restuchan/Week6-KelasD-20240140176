/**
 * @file index.js - halaman Etalase.
 * Ambil produk dari dummyjson pakai fetch native, simpan, lalu tampilkan
 * sebagai kartu yang bisa dicari dan difilter per kategori.
 */

/** Endpoint daftar produk (maksimal 100 produk). */
const API_URL = "https://dummyjson.com/products?limit=100";

/** Kurs tetap USD ke Rupiah. Ganti angka ini kalau mau kurs lain. */
const KURS = 16000;

/**
 * Kategori yang dijual di SegarMart (key = nama kategori dari API).
 * Kategori lain (laptop, motor, dll) tidak ditampilkan. Tambah baris baru untuk menampilkannya.
 */
const CATEGORIES = {
  groceries: "Sembako & segar",
  "kitchen-accessories": "Peralatan dapur",
  "home-decoration": "Dekorasi rumah",
  beauty: "Kecantikan",
  "skin-care": "Perawatan kulit",
  fragrances: "Parfum",
};

const statusEl = document.getElementById("status");
const gridEl = document.getElementById("productGrid");
const countEl = document.getElementById("count");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");

/** Semua produk hasil fetch, disimpan supaya filter tidak perlu fetch ulang. */
let allProducts = [];

/**
 * Ubah harga USD ke Rupiah (dibulatkan ke ratusan terdekat).
 * @param {number} usd
 * @returns {number}
 */
function toRupiah(usd) {
  return Math.round((usd * KURS) / 100) * 100;
}

/**
 * Format angka jadi teks Rupiah.
 * @param {number} n
 * @returns {string} Contoh: `15900` menjadi `"Rp 15.900"`.
 */
function formatRupiah(n) {
  return n.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
}

/**
 * Tampilkan pesan di elemen status.
 * @param {string} html - Isi pesan.
 * @param {boolean} [isError] - Beri gaya error kalau true.
 */
function showStatus(html, isError = false) {
  statusEl.innerHTML = html;
  statusEl.classList.toggle("error", isError);
  statusEl.style.display = "block";
}

/** Tampilkan kartu kerangka (skeleton) selama data dimuat. */
function showSkeleton() {
  countEl.textContent = "";
  gridEl.innerHTML = '<div class="card skeleton"></div>'.repeat(8);
}

/**
 * Tampilkan produk sebagai kartu di grid.
 * @param {Object[]} products - Produk yang mau ditampilkan.
 */
function renderProducts(products) {
  gridEl.innerHTML = "";
  countEl.textContent = `Menampilkan ${products.length} dari ${allProducts.length} produk`;

  if (products.length === 0) {
    showStatus("Produk tidak ditemukan. Coba kata kunci atau kategori lain.");
    return;
  }
  statusEl.style.display = "none";

  const fragment = document.createDocumentFragment();

  products.forEach((p) => {
    const finalPrice = toRupiah(p.price * (1 - p.discountPercentage / 100));
    const hasDiscount = p.discountPercentage >= 1;
    const isLowStock = p.stock < 10;
    // kirim nama & harga ke halaman Caption lewat query string
    const captionLink = "form.html?" + new URLSearchParams({ nama: p.title, harga: finalPrice });

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <span class="badge ${isLowStock ? "low" : ""}">${isLowStock ? "Stok menipis" : "Tersedia"}</span>
      <div class="thumb"><img src="${p.thumbnail}" alt="${p.title}" loading="lazy"></div>
      <div class="body">
        <p class="cat">${CATEGORIES[p.category]}</p>
        <h3>${p.title}</h3>
        <p class="meta">${p.brand ? p.brand + ", " : ""}stok ${p.stock}</p>
        <div class="price-row">
          <span class="now">${formatRupiah(finalPrice)}</span>
          ${hasDiscount ? `<span class="old">${formatRupiah(toRupiah(p.price))}</span>
          <span class="off">-${Math.round(p.discountPercentage)}%</span>` : ""}
        </div>
        <div class="actions">
          <span class="rating">★ ${p.rating.toFixed(1)}</span>
          <a class="btn-mini" href="${captionLink}">Buat caption</a>
        </div>
      </div>`;
    fragment.appendChild(card);
  });

  gridEl.appendChild(fragment);
}

/** Isi dropdown kategori dari kategori yang ada di data (urut abjad label). */
function populateCategoryOptions() {
  const keys = [...new Set(allProducts.map((p) => p.category))]
    .sort((a, b) => CATEGORIES[a].localeCompare(CATEGORIES[b]));

  keys.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = CATEGORIES[key];
    categorySelect.appendChild(option);
  });
}

/** Filter produk berdasarkan kata kunci dan kategori, lalu render ulang. */
function applyFilters() {
  const keyword = searchInput.value.trim().toLowerCase();
  const category = categorySelect.value;

  renderProducts(allProducts.filter((p) =>
    p.title.toLowerCase().includes(keyword) && (!category || p.category === category)
  ));
}

/** Ambil produk dari API. Kalau gagal, tampilkan pesan error dan tombol coba lagi. */
async function fetchProducts() {
  showStatus("Memuat produk...");
  showSkeleton();

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`status ${response.status}`);

    const data = await response.json();
    console.log("Data produk dari API:", data.products);

    allProducts = data.products.filter((p) => p.category in CATEGORIES);
    console.log("Produk yang ditampilkan di SegarMart:", allProducts);

    populateCategoryOptions();
    renderProducts(allProducts);
  } catch (error) {
    gridEl.innerHTML = "";
    showStatus(`Gagal memuat produk (${error.message}). Periksa koneksi internetmu. <button id="retry" type="button">Coba lagi</button>`, true);
    document.getElementById("retry").addEventListener("click", fetchProducts);
    console.error("Fetch error:", error);
  }
}

// event listener untuk pencarian & filter kategori
searchInput.addEventListener("input", applyFilters);
categorySelect.addEventListener("change", applyFilters);

// jalankan fetch saat halaman pertama kali dibuka
document.addEventListener("DOMContentLoaded", fetchProducts);
