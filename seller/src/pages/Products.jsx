import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getSellerProductsAPI, deleteProductAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  MdAdd, MdEdit, MdDelete, MdInventory2,
  MdSearch, MdCheckCircle, MdPending, MdRefresh
} from 'react-icons/md';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const status = filter === 'live' ? 'approved' : undefined;
      const res = await getSellerProductsAPI({ page, limit, ...(status ? { status } : {}) });
      setProducts(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteProductAPI(id);
      toast.success('Product deleted');
      load();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = search
    ? products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))
    : products;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {total > 0 ? `${total} product${total !== 1 ? 's' : ''} listed` : 'No products yet'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700 transition-all disabled:opacity-50">
            <MdRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link to="/products/add" className="btn-primary flex items-center gap-2">
            <MdAdd className="text-lg" /> Add Product
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products by name..."
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          {[
            { key: 'all', label: 'All' },
            { key: 'live', label: '🟢 Live' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => { setFilter(key); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
                ${filter === key
                  ? 'bg-green-500 text-white shadow-[0_2px_8px_rgba(76,175,80,0.3)]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-14 h-14 bg-gray-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 pt-2">
                  <div className="h-4 bg-gray-100 rounded-lg w-2/3" />
                  <div className="h-3 bg-gray-50 rounded-lg w-1/3" />
                </div>
                <div className="w-20 h-8 bg-gray-100 rounded-lg self-center" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MdInventory2 className="text-3xl text-gray-300" />
            </div>
            <p className="text-gray-500 font-semibold mb-1">
              {search ? 'No products match your search' : 'No products yet'}
            </p>
            <p className="text-gray-400 text-sm mb-5">
              {search ? 'Try a different keyword' : 'Add your first product to start selling'}
            </p>
            {!search && (
              <Link to="/products/add" className="btn-primary inline-flex items-center gap-2">
                <MdAdd /> Add your first product
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Product', 'Price', 'Stock', 'Status', ''].map((h, i) => (
                    <th key={i}
                      className={`text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3.5
                        ${i === 0 ? 'px-6' : 'px-4'}
                        ${i === 1 || i === 2 ? 'hidden md:table-cell' : ''}
                        ${i === 4 ? 'text-right pr-6' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(product => (
                  <tr key={product._id} className="hover:bg-gray-50/60 transition-colors group">
                    {/* Product */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                          <img
                            src={product.images?.[0] || '/placeholder.png'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={e => { e.target.src = '/placeholder.png'; }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate max-w-[180px]">{product.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{product.catName || 'Uncategorized'}</p>
                        </div>
                      </div>
                    </td>
                    {/* Price */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-sm font-bold text-gray-900">₹{product.price?.toLocaleString('en-IN')}</p>
                      {product.oldPrice > product.price && (
                        <p className="text-xs text-gray-400 line-through">₹{product.oldPrice?.toLocaleString('en-IN')}</p>
                      )}
                    </td>
                    {/* Stock */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className={`text-sm font-bold ${product.countInStock <= 5 ? 'text-red-500' : 'text-gray-700'}`}>
                        {product.countInStock ?? '—'}
                      </span>
                      {product.countInStock <= 5 && (
                        <p className="text-xs text-red-400 font-medium">Low stock</p>
                      )}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-4">
                      {product.adminApproved ? (
                        <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200">
                          <MdCheckCircle className="text-green-500" /> Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                          <MdPending className="text-amber-500" /> Pending
                        </span>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/products/edit/${product._id}`}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                          title="Edit">
                          <MdEdit className="text-lg" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product._id, product.name)}
                          disabled={deleting === product._id}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                          title="Delete">
                          {deleting === product._id
                            ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                            : <MdDelete className="text-lg" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/40">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-700">{(page - 1) * limit + 1}</span>–
              <span className="font-semibold text-gray-700">{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-semibold text-gray-700">{total}</span>
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-200 hover:border-green-400 hover:text-green-600 disabled:opacity-40 transition-all">
                ← Prev
              </button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all
                      ${page === p
                        ? 'bg-green-500 text-white shadow-[0_2px_8px_rgba(76,175,80,0.3)]'
                        : 'border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600'}`}>
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-200 hover:border-green-400 hover:text-green-600 disabled:opacity-40 transition-all">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}