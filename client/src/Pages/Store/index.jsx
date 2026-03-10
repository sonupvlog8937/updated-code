import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import { fetchDataFromApi } from "../../utils/api";

export default function StorePage() {
  const { storeSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchDataFromApi(`/api/seller/store/${storeSlug}`).then((res) => {
      if (!mounted) return;
      if (res?.success) setStoreData(res?.data);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [storeSlug]);

  if (loading) {
    return (
      <div className="container" style={{ padding: "80px 0", display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </div>
    );
  }

  if (!storeData?.seller) {
    return (
      <div className="container" style={{ padding: "80px 0" }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Store not found</h2>
      </div>
    );
  }

  const { seller, products = [] } = storeData;

  return (
    <div className="container" style={{ padding: "40px 0 60px" }}>
      <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
        {seller?.storeBanner ? (
          <img src={seller.storeBanner} alt={seller.storeName} style={{ width: "100%", height: 220, objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: 180, background: "linear-gradient(135deg,#f5f5f5,#ececec)" }} />
        )}
        <div style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
          <img
            src={seller?.storeLogo || "/placeholder.png"}
            alt={seller?.storeName}
            style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", background: "#f3f4f6" }}
          />
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{seller?.storeName}</h1>
            <p style={{ margin: 0, color: "rgba(0,0,0,0.6)", fontSize: 14 }}>{seller?.storeDescription || "Trusted seller on our marketplace"}</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Products ({products.length})</h3>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
        {products.map((product) => (
          <Link
            key={product._id}
            to={`/product/${product._id}`}
            style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, overflow: "hidden", textDecoration: "none", color: "inherit", background: "#fff" }}
          >
            <img src={product?.images?.[0] || "/placeholder.png"} alt={product?.name} style={{ width: "100%", height: 180, objectFit: "cover" }} />
            <div style={{ padding: 12 }}>
              <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14, lineHeight: 1.4 }}>{product?.name}</p>
              <p style={{ margin: 0, color: "#111", fontWeight: 800 }}>₹{Number(product?.price || 0).toLocaleString("en-IN")}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}