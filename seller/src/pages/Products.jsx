import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getSellerProductsAPI, deleteProductAPI } from '../services/api';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete, MdInventory2, MdSearch, MdFilterList, MdCheckCircle, MdPending } from 'react-icons/md';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all'); // all | approved | pending
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, ...(filter !== 'all' ? { status: filter } : {}) };
      const res = await getSellerProductsAPI(params);
      setProducts(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await deleteProductAPI(id);
      toast.success('Product deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const filtered = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} products listed</p>
        </div>
        <Link to="/products/add" className="btn-primary flex items-center gap-2">
          <MdAdd className="text-lg" /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..." className="input pl-10" />
        </div>
        <div className="flex gap-2">
          {['all', 'approved', 'pending'].map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all
                ${filter === f ? 'bg-primary-500 text-white shadow-green' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-14 h-14 bg-gray-200 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <MdInventory2 className="text-5xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No products found</p>
            <Link to="/products/add" className="btn-primary mt-4 inline-flex items-center gap-2">
              <MdAdd /> Add your first product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Product</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Price</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Stock</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">Status</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(product => (
                  <tr key={product._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={product.images?.[0] || '/placeholder.png'} alt={product.name}
                          className="w-12 h-12 rounded-xl object-cover bg-gray-100 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate max-w-[200px]">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.catName || 'Uncategorized'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-sm font-semibold text-gray-900">₹{product.price?.toLocaleString()}</p>
                      {product.oldPrice > product.price && (
                        <p className="text-xs text-gray-400 line-through">₹{product.oldPrice?.toLocaleString()}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className={`text-sm font-semibold ${product.countInStock <= 5 ? 'text-red-500' : 'text-gray-700'}`}>
                        {product.countInStock}
                      </span>
                      {product.countInStock <= 5 && <p className="text-xs text-red-400">Low stock</p>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        {product.adminApproved
                          ? <><MdCheckCircle className="text-green-500 text-sm" /><span className="badge-approved">Live</span></>
                          : <><MdPending className="text-amber-500 text-sm" /><span className="badge-pending">Pending</span></>
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/products/edit/${product._id}`}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                          <MdEdit className="text-lg" />
                        </Link>
                        <button onClick={() => handleDelete(product._id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                          <MdDelete className="text-lg" />
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
        {total > limit && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 hover:border-primary-400 disabled:opacity-40 transition-all">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * limit >= total}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 hover:border-primary-400 disabled:opacity-40 transition-all">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}