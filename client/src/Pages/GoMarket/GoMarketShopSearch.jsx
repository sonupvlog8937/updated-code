import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Breadcrumb, STYLES } from "./shared";
import GoMarketShopCatalog from "./GoMarketShopCatalog";

const GoMarketShopSearch = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isLogin = useSelector((s) => s.app.isLogin);
  const q = searchParams.get("q") || "";

  React.useEffect(() => {
    if (!isLogin) navigate("/login");
  }, [isLogin, navigate]);

  return (
    <div className="gmp-root">
      <style>{STYLES}</style>
      <div className="gmp-container" style={{ paddingTop: 16 }}>
        <Breadcrumb
          items={[
            { to: "/go-market", label: "Go Market" },
            { to: `/go-market/shop/${id}`, label: "Shop" },
            { label: q ? `Search: ${q}` : "Search" },
          ]}
        />
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "12px 0 4px" }}>
          {q ? `Results for “${q}”` : "Search products"}
        </h1>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
          Filter, sort, and scroll to load more products.
        </p>
        <GoMarketShopCatalog shopId={id} searchMode initialQuery={q} />
      </div>
    </div>
  );
};

export default GoMarketShopSearch;
