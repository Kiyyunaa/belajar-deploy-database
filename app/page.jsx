
'use client';

import { useEffect, useState } from 'react';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: '',
};

export default function Home() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [sortPrice, setSortPrice] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [activeSelect, setActiveSelect] = useState('');

  async function loadProducts() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/products');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memuat data');
      }

      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  // Menutup dropdown saat pengguna mengeklik di luar dropdown.
  useEffect(() => {
    function handleOutsideClick(event) {
      if (!event.target.closest('.custom-select')) {
        setActiveSelect('');
      }
    }

    document.addEventListener('click', handleOutsideClick);

    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function startEdit(product) {
    setEditingId(product.id);

    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category || '',
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = editingId
        ? `/api/products/${editingId}`
        : '/api/products';

      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan data');
      }

      setForm(emptyForm);
      setEditingId(null);

      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;

    setError('');

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus data');
      }

      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  const categories = [
    ...new Set(
      products
        .map((p) => p.category)
        .filter(Boolean)
    ),
  ];

  const filteredProducts = products
    .filter((p) =>
      (p.name || '')
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .filter(
      (p) =>
        filterCategory === '' ||
        p.category === filterCategory
    )
    .sort((a, b) => {
      if (sortPrice === 'asc') {
        return Number(a.price) - Number(b.price);
      }

      if (sortPrice === 'desc') {
        return Number(b.price) - Number(a.price);
      }

      return 0;
    });

  function toggleSelect(name) {
    setActiveSelect((current) =>
      current === name ? '' : name
    );
  }

  return (
    <main>
      <h1>CRUD Produk</h1>
      <p className="subtitle">Next.js + MySQL (Aiven)</p>

      {error && (
        <div className="error-box">{error}</div>
      )}

      <div className="product-controls">
        <div className="search-box">
          <input
            id="search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk..."
            aria-label="Cari produk berdasarkan nama"
          />
        </div>

        <div className="filter-controls">
          {/* Dropdown kategori */}
          <div className="control-group">
            <label id="category-label">
              Filter Kategori
            </label>

            <div
              className={`custom-select ${
                activeSelect === 'category'
                  ? 'select-active'
                  : ''
              }`}
            >
              <button
                type="button"
                className="select-trigger"
                aria-labelledby="category-label"
                aria-expanded={activeSelect === 'category'}
                onClick={() => toggleSelect('category')}
              >
                <span>
                  {filterCategory || 'Semua kategori'}
                </span>

                <span
                  className="select-arrow"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </button>

              {activeSelect === 'category' && (
                <div className="select-options">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterCategory('');
                      setActiveSelect('');
                    }}
                  >
                    Semua kategori
                  </button>

                  {categories.map((category) => (
                    <button
                      type="button"
                      key={category}
                      onClick={() => {
                        setFilterCategory(category);
                        setActiveSelect('');
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dropdown sorting harga */}
          <div className="control-group">
            <label id="price-label">
              Sorting Harga
            </label>

            <div
              className={`custom-select ${
                activeSelect === 'price'
                  ? 'select-active'
                  : ''
              }`}
            >
              <button
                type="button"
                className="select-trigger"
                aria-labelledby="price-label"
                aria-expanded={activeSelect === 'price'}
                onClick={() => toggleSelect('price')}
              >
                <span>
                  {sortPrice === 'asc'
                    ? 'Harga termurah'
                    : sortPrice === 'desc'
                      ? 'Harga termahal'
                      : 'Urutan default'}
                </span>

                <span
                  className="select-arrow"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </button>

              {activeSelect === 'price' && (
                <div className="select-options">
                  <button
                    type="button"
                    onClick={() => {
                      setSortPrice('');
                      setActiveSelect('');
                    }}
                  >
                    Urutan default
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSortPrice('asc');
                      setActiveSelect('');
                    }}
                  >
                    Harga termurah
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSortPrice('desc');
                      setActiveSelect('');
                    }}
                  >
                    Harga termahal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form tambah dan edit produk */}
      <div className="card">
        <h3>
          {editingId ? 'Edit Produk' : 'Tambah Produk Baru'}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="name">Nama Produk</label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Misal: Kopi Susu"
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="description">Deskripsi</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Deskripsi singkat produk (opsional)"
            />
          </div>

          <div className="form-row">
            <label htmlFor="price">Harga (Rp)</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={handleChange}
              placeholder="0"
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="category">Kategori</label>
            <input
              id="category"
              name="category"
              type="text"
              value={form.category}
              onChange={handleChange}
              placeholder="Misal: Minuman"
              required
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving
                ? 'Menyimpan...'
                : editingId
                  ? 'Update'
                  : 'Simpan'}
            </button>

            {editingId && (
              <button
                type="button"
                className="btn-secondary"
                onClick={cancelEdit}
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="status">
        {loading
          ? 'Memuat data...'
          : `${filteredProducts.length} produk ditemukan`}
      </div>

      {/* Tabel produk */}
      <table>
        <thead>
          <tr>
            <th>Nama</th>
            <th>Deskripsi</th>
            <th>Harga</th>
            <th>Kategori</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          {filteredProducts.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.description || '-'}</td>
              <td>
                Rp {Number(p.price).toLocaleString('id-ID')}
              </td>
              <td>{p.category || '-'}</td>
              <td>
                <button
                  type="button"
                  className="btn-edit"
                  onClick={() => startEdit(p)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => handleDelete(p.id)}
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!loading && filteredProducts.length === 0 && (
        <div className="empty">
          Tidak ada produk yang cocok dengan pencarian
          atau filter.
        </div>
      )}
    </main>
  );
}
