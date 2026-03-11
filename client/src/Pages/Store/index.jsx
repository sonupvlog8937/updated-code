import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import ProductItem from "../../components/ProductItem";
import { fetchDataFromApi } from "../../utils/api";

const StorePage = () => {
  const { sellerId } = useParams();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sellerName, setSellerName] = useState("Seller Store");
  const [sellerProfile, setSellerProfile] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [sortBy, setSortBy] = useState("latest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", 12);
    params.set("sortBy", sortBy);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    return params.toString();
  }, [page, sortBy, minPrice, maxPrice]);

  useEffect(() => {
    setIsLoading(true);
    fetchDataFromApi(`/api/product/store/${sellerId}?${query}`).then((res) => {
      if (res?.success) {
        const items = res?.products || [];
        setProducts(items);
        setMeta({ total: res?.total || 0, totalPages: res?.totalPages || 1 });
        setSellerName(items?.[0]?.seller?.storeProfile?.storeName || items?.[0]?.seller?.name || "Seller Store");
      }
      setIsLoading(false);
    });
    fetchDataFromApi(`/api/user/seller/store-profile/${sellerId}`).then((res) => {
      if (res?.success) {
        setSellerProfile(res?.seller?.storeProfile || null);
        setSellerName(res?.seller?.storeProfile?.storeName || res?.seller?.name || "Seller Store");
      }
    });
    window.scrollTo(0, 0);
   }, [sellerId, query]);

  return (
    <section className="py-6 bg-[#f8fafc] min-h-[70vh]">
      <div className="container">
        <div className="mb-4">
          <Link to="/" className="text-[13px] text-[#2563eb]">Home</Link>
          <span className="mx-2 text-[#94a3b8]">/</span>
          <span className="text-[13px] text-[#475569]">{sellerName}</span>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 sm:p-5 mb-5">
          <h1 className="text-[22px] font-[700] text-[#0f172a]">{sellerName}</h1>
           <p className="text-[14px] text-[#64748b] mt-1">{sellerProfile?.description || "Explore all products from this verified seller store."}</p>
          {sellerProfile?.location && <p className="text-[12px] text-[#64748b] mt-2">📍 {sellerProfile.location}</p>}
          {sellerProfile?.contactNo && <p className="text-[12px] text-[#64748b]">☎ {sellerProfile.contactNo}</p>}
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-3 sm:p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} className="border rounded-md px-3 py-2 text-sm">
            <option value="latest">Latest</option>
            <option value="priceLowToHigh">Price: Low to High</option>
            <option value="priceHighToLow">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="popularity">Best Selling</option>
          </select>
          <input value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} type="number" placeholder="Min price" className="border rounded-md px-3 py-2 text-sm" />
          <input value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} type="number" placeholder="Max price" className="border rounded-md px-3 py-2 text-sm" />
          <button onClick={() => { setMinPrice(""); setMaxPrice(""); setSortBy("latest"); setPage(1); }} className="border rounded-md px-3 py-2 text-sm font-[600] text-[#334155]">Reset</button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><CircularProgress /></div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {products.map((item) => (<ProductItem key={item?._id} item={item} />))}
            </div>
            <div className="flex items-center justify-between mt-5 bg-white border border-[#e2e8f0] rounded-xl px-4 py-3">
              <p className="text-[13px] text-[#475569]">Showing page {page} of {meta.totalPages} ({meta.total} products)</p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 border rounded disabled:opacity-50">Prev</button>
                <button disabled={page >= meta.totalPages} onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} className="px-3 py-1.5 border rounded disabled:opacity-50">Next</button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-8 text-center text-[#64748b]">No products found in this store.</div>
        )}
      </div>
    </section>
  );
};

export default StorePage;