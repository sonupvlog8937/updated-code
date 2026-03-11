import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import ProductItem from "../../components/ProductItem";
import { fetchDataFromApi } from "../../utils/api";

const StorePage = () => {
  const { sellerId } = useParams();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sellerName, setSellerName] = useState("Seller Store");

  useEffect(() => {
    setIsLoading(true);
    fetchDataFromApi(`/api/product/store/${sellerId}`).then((res) => {
      if (res?.success) {
        const items = res?.products || [];
        setProducts(items);
        setSellerName(items?.[0]?.seller?.name || "Seller Store");
      }
      setIsLoading(false);
    });
    window.scrollTo(0, 0);
  }, [sellerId]);

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
          <p className="text-[14px] text-[#64748b] mt-1">
            Explore all products from this verified seller store.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <CircularProgress />
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {products.map((item) => (
              <ProductItem key={item?._id} item={item} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-8 text-center text-[#64748b]">
            No products found in this store.
          </div>
        )}
      </div>
    </section>
  );
};

export default StorePage;