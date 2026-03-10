import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRightLong, FaLayerGroup } from "react-icons/fa6";
import { useAppContext } from "../../hooks/useAppContext";

/* ─── Category image: uses cat.image if present, else Unsplash keyword fallback ─── */
const getCatImage = (cat) => {
  if (cat?.image && cat.image.startsWith("http")) return cat.image;
  if (cat?.image && cat.image.length > 4) return cat.image;
  // keyword-based fallback from Unsplash
  const name = (cat?.name || "shop").toLowerCase();
  const map = {
    electronics: "electronics,gadgets",
    mobile: "smartphone,mobile",
    phone: "smartphone",
    laptop: "laptop,computer",
    fashion: "fashion,clothing",
    clothes: "clothing,fashion",
    shirt: "shirt,fashion",
    shoes: "shoes,sneakers",
    footwear: "shoes,footwear",
    beauty: "beauty,cosmetics",
    skincare: "skincare,beauty",
    furniture: "furniture,interior",
    home: "home,interior",
    kitchen: "kitchen,cookware",
    sports: "sports,fitness",
    toys: "toys,children",
    books: "books,reading",
    jewellery: "jewelry,gold",
    jewelry: "jewelry",
    watches: "watch,luxury",
    bags: "bag,handbag",
    grocery: "grocery,food",
    food: "food,fresh",
    health: "health,wellness",
    automotive: "car,automotive",
  };
  const keyword = Object.entries(map).find(([k]) => name.includes(k))?.[1] || name;
  return `https://source.unsplash.com/600x400/?${encodeURIComponent(keyword)}`;
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

  .cp-root * { box-sizing: border-box; }
  .cp-root { font-family: 'DM Sans', sans-serif; }

  /* Hero */
  .cp-hero {
    position: relative; overflow: hidden;
    background: #0a0a0f;
    border-radius: 20px;
    padding: 52px 44px;
    margin-bottom: 40px;
    min-height: 220px;
    display: flex; align-items: center;
  }
  .cp-hero-bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 70% 50%, rgba(232,54,42,0.18) 0%, transparent 60%),
                radial-gradient(ellipse at 20% 80%, rgba(99,102,241,0.12) 0%, transparent 50%);
    pointer-events: none;
  }
  .cp-hero-grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }
  .cp-hero-content { position: relative; z-index: 2; max-width: 600px; }
  .cp-hero-tag {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.6); font-size: 11px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    padding: 5px 12px; border-radius: 20px; margin-bottom: 16px;
  }
  .cp-hero-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(28px, 4vw, 44px); font-weight: 800;
    color: #fff; line-height: 1.15; margin-bottom: 12px; letter-spacing: -0.02em;
  }
  .cp-hero-title span { color: #E8362A; }
  .cp-hero-sub {
    font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.6;
    margin-bottom: 24px; max-width: 420px;
  }
  .cp-hero-btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: #fff; color: #0a0a0f;
    padding: 10px 22px; border-radius: 40px;
    font-size: 13px; font-weight: 700;
    text-decoration: none;
    transition: all 0.2s ease;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }
  .cp-hero-btn:hover { background: #E8362A; color: #fff; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(232,54,42,0.35); }

  /* Section header */
  .cp-section-header {
    display: flex; align-items: baseline; justify-content: space-between;
    margin-bottom: 24px;
  }
  .cp-section-title {
    font-family: 'Playfair Display', serif;
    font-size: 22px; font-weight: 800; color: #0a0a0f; letter-spacing: -0.02em;
  }
  .cp-section-count {
    font-size: 12px; font-weight: 600; color: #9ca3af;
  }

  /* Grid */
  .cp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }

  /* Card */
  .cp-card {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #f0f0f5;
    transition: box-shadow 0.25s ease, transform 0.25s ease;
    cursor: pointer;
    display: flex; flex-direction: column;
  }
  .cp-card:hover {
    box-shadow: 0 12px 40px rgba(0,0,0,0.1);
    transform: translateY(-4px);
    border-color: transparent;
  }

  /* Image */
  .cp-img-wrap {
    position: relative; width: 100%; height: 180px; overflow: hidden;
    background: #f3f4f6;
  }
  .cp-img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.5s ease;
  }
  .cp-card:hover .cp-img { transform: scale(1.07); }
  .cp-img-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55) 100%);
  }
  .cp-img-badge {
    position: absolute; top: 12px; right: 12px;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(6px);
    color: #0a0a0f; font-size: 11px; font-weight: 700;
    padding: 4px 10px; border-radius: 20px;
  }
  .cp-img-name {
    position: absolute; bottom: 14px; left: 16px; right: 16px;
    color: #fff; font-size: 16px; font-weight: 700;
    font-family: 'Playfair Display', serif;
    line-height: 1.3; letter-spacing: -0.01em;
    text-shadow: 0 2px 8px rgba(0,0,0,0.4);
  }

  /* Card body */
  .cp-card-body { padding: 16px 18px 18px; flex: 1; display: flex; flex-direction: column; gap: 12px; }

  /* Subcategory pills */
  .cp-subcats { display: flex; flex-wrap: wrap; gap: 6px; }
  .cp-subcat-pill {
    display: inline-block;
    background: #f7f7fb; color: #374151;
    font-size: 11.5px; font-weight: 500;
    padding: 4px 10px; border-radius: 20px;
    text-decoration: none;
    border: 1px solid #ececf5;
    transition: all 0.15s ease;
    white-space: nowrap;
  }
  .cp-subcat-pill:hover { background: #0a0a0f; color: #fff; border-color: #0a0a0f; }
  .cp-subcat-more {
    display: inline-block;
    background: transparent; color: #9ca3af;
    font-size: 11px; font-weight: 600;
    padding: 4px 8px; border-radius: 20px;
    border: 1px dashed #d1d5db;
  }

  /* Card footer */
  .cp-card-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid #f3f4f6;
    margin-top: auto;
  }
  .cp-view-link {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12.5px; font-weight: 700; color: #0a0a0f;
    text-decoration: none;
    padding: 6px 14px; border-radius: 20px;
    background: #f3f4f6;
    transition: all 0.18s ease;
  }
  .cp-view-link:hover { background: #E8362A; color: #fff; }

  /* Empty state */
  .cp-empty {
    background: #fff; border-radius: 16px; border: 2px dashed #e5e7eb;
    padding: 60px 24px; text-align: center;
  }

  /* Skeleton */
  @keyframes cp-shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  .cp-skeleton {
    background: linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%);
    background-size: 600px 100%;
    animation: cp-shimmer 1.4s infinite linear;
    border-radius: 8px;
  }

  /* Stagger animation */
  @keyframes cp-fadein { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  .cp-card { animation: cp-fadein 0.4s ease both; }
`;

const CategoriesPage = () => {
  const { catData } = useAppContext();
  const categories = useMemo(() => catData || [], [catData]);
  const [imgErrors, setImgErrors] = useState({});

  const handleImgError = (id) => setImgErrors(p => ({ ...p, [id]: true }));

  return (
    <section className="cp-root" style={{ background: "#f8f8fb", minHeight: "70vh", padding: "32px 0 60px" }}>
      <style>{CSS}</style>

      <div className="container">

        {/* ── Hero ── */}
        <div className="cp-hero">
          <div className="cp-hero-bg" />
          <div className="cp-hero-grid" />
          <div className="cp-hero-content">
            <span className="cp-hero-tag">
              <FaLayerGroup size={10} /> Explore Collections
            </span>
            <h1 className="cp-hero-title">
              Shop by <span>Categories</span>
            </h1>
            <p className="cp-hero-sub">
              Premium collections, hand-picked essentials, and trending picks —
              all in one place to help you find what you love, faster.
            </p>
            <Link to="/products" className="cp-hero-btn">
              View All Products <FaArrowRightLong size={12} />
            </Link>
          </div>
        </div>

        {/* ── Section header ── */}
        <div className="cp-section-header">
          <h2 className="cp-section-title">All Categories</h2>
          <span className="cp-section-count">{categories.length} collections</span>
        </div>

        {/* ── Empty state ── */}
        {categories.length === 0 && (
          <div className="cp-empty">
            <FaLayerGroup style={{ fontSize: 28, color: "#d1d5db", marginBottom: 12 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
              Loading categories...
            </h3>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>
              Fetching the latest collection map, please wait.
            </p>
            {/* Skeleton cards */}
            <div className="cp-grid" style={{ marginTop: 32, textAlign: "left" }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid #f0f0f5" }}>
                  <div className="cp-skeleton" style={{ height: 180 }} />
                  <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div className="cp-skeleton" style={{ height: 14, width: "60%" }} />
                    <div className="cp-skeleton" style={{ height: 11, width: "80%" }} />
                    <div className="cp-skeleton" style={{ height: 11, width: "50%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Category grid ── */}
        {categories.length > 0 && (
          <div className="cp-grid">
            {categories.map((cat, idx) => {
              const imgSrc = imgErrors[cat?._id] ? null : getCatImage(cat);
              const subcats = cat?.children || [];
              const visibleSubs = subcats.slice(0, 5);
              const extraCount = subcats.length - 5;

              return (
                <article
                  key={cat?._id}
                  className="cp-card"
                  style={{ animationDelay: `${idx * 0.06}s` }}
                >
                  {/* Image */}
                  <div className="cp-img-wrap">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={cat?.name}
                        className="cp-img"
                        onError={() => handleImgError(cat?._id)}
                      />
                    ) : (
                      <div style={{
                        width: "100%", height: "100%",
                        background: `hsl(${(idx * 47) % 360},20%,92%)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <FaLayerGroup style={{ fontSize: 36, color: `hsl(${(idx * 47) % 360},30%,60%)` }} />
                      </div>
                    )}
                    <div className="cp-img-overlay" />
                    <span className="cp-img-badge">
                      {subcats.length > 0 ? `${subcats.length} Sub` : "New"}
                    </span>
                    <span className="cp-img-name">{cat?.name}</span>
                  </div>

                  {/* Body */}
                  <div className="cp-card-body">

                    {/* Subcategory pills */}
                    {subcats.length > 0 ? (
                      <div className="cp-subcats">
                        {visibleSubs.map(sub => (
                          <Link
                            key={sub?._id}
                            to={`/products?subCatId=${sub?._id}`}
                            className="cp-subcat-pill"
                          >
                            {sub?.name}
                          </Link>
                        ))}
                        {extraCount > 0 && (
                          <span className="cp-subcat-more">+{extraCount} more</span>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                        No subcategories yet
                      </p>
                    )}

                    {/* Footer */}
                    <div className="cp-card-footer">
                      <Link
                        to={`/products?catId=${cat?._id}`}
                        className="cp-view-link"
                      >
                        Shop {cat?.name} <FaArrowRightLong size={11} />
                      </Link>
                      <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>
                        {subcats.length} subcategories
                      </span>
                    </div>

                  </div>
                </article>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};

export default CategoriesPage;