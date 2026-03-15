import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import ProductItem from "../../components/ProductItem";
import { fetchDataFromApi } from "../../utils/api";

// ─── Tiny SVG Icons ───────────────────────────────────────────────────────────
const Svg = ({ d, size = 16, fill = "none", stroke = "currentColor", sw = 2, vb = "0 0 24 24", children, ...rest }) => (
  <svg width={size} height={size} viewBox={vb} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d ? <path d={d} /> : children}
  </svg>
);
const ISearch  = () => <Svg d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />;
const IFilter  = () => <Svg d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />;
const ISort    = () => <Svg d="M3 6h18M7 12h10M11 18h2" />;
const IGrid    = () => <Svg d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />;
const IList    = () => <Svg d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />;
const IStore   = () => <Svg d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" size={20} />;
const IX       = ({ size = 12 }) => <Svg d="M18 6L6 18M6 6l12 12" size={size} />;
const IChevron = ({ up }) => <Svg d={up ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} size={14} />;
const ITag     = () => <Svg d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" size={14} />;
const ICheck   = () => <Svg d="M20 6L9 17l-5-5" size={13} sw={2.5} />;
const IVerify  = () => (
  <Svg size={16} vb="0 0 24 24" fill="#2563eb" stroke="none">
    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z" />
  </Svg>
);
const IStar = ({ filled, half }) => (
  <Svg size={13} vb="0 0 24 24" fill={filled ? "#f59e0b" : "none"} stroke="#f59e0b" sw={1.5}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </Svg>
);

// ─── Micro components ─────────────────────────────────────────────────────────
const Stars = ({ v = 0 }) => (
  <span style={{ display: "flex", gap: 1 }}>
    {[1, 2, 3, 4, 5].map(s => <IStar key={s} filled={s <= Math.round(v)} />)}
  </span>
);

const StarBar = ({ star, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
      <span style={{ fontSize: 11, color: "#64748b", width: 7, flexShrink: 0 }}>{star}</span>
      <IStar filled />
      <div style={{ flex: 1, height: 5, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#f59e0b", borderRadius: 99, transition: "width .5s" }} />
      </div>
      <span style={{ fontSize: 10, color: "#94a3b8", width: 22, textAlign: "right" }}>{count}</span>
    </div>
  );
};

const Skel = () => (
  <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #f1f5f9", overflow: "hidden" }}>
    <div className="skel-shine" style={{ height: 175 }} />
    <div style={{ padding: "10px 12px" }}>
      <div className="skel-shine" style={{ height: 9, borderRadius: 4, marginBottom: 7 }} />
      <div className="skel-shine" style={{ height: 9, borderRadius: 4, width: "55%" }} />
    </div>
  </div>
);

const Cb = ({ checked }) => (
  <div style={{
    width: 15, height: 15, borderRadius: 3, flexShrink: 0,
    border: `2px solid ${checked ? "#2563eb" : "#c7d2dc"}`,
    background: checked ? "#2563eb" : "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all .15s",
  }}>
    {checked && <ICheck />}
  </div>
);

// ─── Constants ────────────────────────────────────────────────────────────────
const SORTS = [
  { v: "latest",         l: "Newest First" },
  { v: "popularity",     l: "Best Selling" },
  { v: "rating",         l: "Top Rated" },
  { v: "priceLowToHigh", l: "Price: Low → High" },
  { v: "priceHighToLow", l: "Price: High → Low" },
  { v: "discount",       l: "Biggest Discount" },
  { v: "nameAZ",         l: "Name A → Z" },
  { v: "nameZA",         l: "Name Z → A" },
];

const QUICK_PRICES = [
  { l: "Under ₹500",      min: "",     max: "500"  },
  { l: "₹500 – ₹1,000",  min: "500",  max: "1000" },
  { l: "₹1,000 – ₹5,000",min: "1000", max: "5000" },
  { l: "₹5,000 – ₹10,000",min:"5000", max: "10000"},
  { l: "Above ₹10,000",  min: "10000",max: ""     },
];

const DISCOUNT_OPTS = [
  { v: "10", l: "10% or more" },
  { v: "20", l: "20% or more" },
  { v: "30", l: "30% or more" },
  { v: "50", l: "50% or more" },
];

// ─── Section wrapper ──────────────────────────────────────────────────────────
const Section = ({ title, open, onToggle, children, badge }) => (
  <div style={{ borderBottom: "1px solid #f1f5f9" }}>
    <button onClick={onToggle} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 15px", background: "none", border: "none", cursor: "pointer" }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: ".06em", display: "flex", alignItems: "center", gap: 5 }}>
        {title}
        {badge > 0 && <span style={{ background: "#2563eb", color: "#fff", borderRadius: 99, fontSize: 9, padding: "1px 5px", fontWeight: 700 }}>{badge}</span>}
      </span>
      <IChevron up={open} />
    </button>
    {open && <div style={{ padding: "0 15px 13px" }}>{children}</div>}
  </div>
);

// ─── Multi-select filter row ──────────────────────────────────────────────────
const FRow = ({ label, checked, onToggle }) => (
  <button onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "5px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
    <Cb checked={checked} />
    <span style={{ fontSize: 12, color: checked ? "#2563eb" : "#374151", fontWeight: checked ? 600 : 400 }}>{label}</span>
  </button>
);

// ─── Color swatch ─────────────────────────────────────────────────────────────
const COLOR_MAP = { red:"#ef4444",blue:"#3b82f6",green:"#22c55e",yellow:"#eab308",black:"#1f2937",white:"#f8fafc",orange:"#f97316",pink:"#ec4899",purple:"#a855f7",grey:"#9ca3af",gray:"#9ca3af",brown:"#92400e",navy:"#1e3a5f",gold:"#d97706",silver:"#94a3b8",cream:"#fef3c7" };
const swatch = (name) => COLOR_MAP[name?.toLowerCase()] || "#e2e8f0";

// ─────────────────────────────────────────────────────────────────────────────
const StorePage = () => {
  const { sellerId } = useParams();
  const [sp, setSP] = useSearchParams();

  // ── Remote state ──
  const [products,      setProducts]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [sellerName,    setSellerName]     = useState("Seller Store");
  const [sellerProfile, setSellerProfile] = useState(null);
  const [categories,    setCategories]    = useState([]);
  const [filterOpts,    setFilterOpts]    = useState({ brands:[], sizes:[], colors:[], ramOptions:[], weights:[], hasDiscount: false, hasOutOfStock: false });
  const [meta,          setMeta]          = useState({ total: 0, totalPages: 1 });
  const [ratingStats,   setRatingStats]   = useState({ avg: 0, breakdown: {}, totalReviews: 0 });

  // ── UI state ──
  const [viewMode,    setViewMode]    = useState("grid");
  const [sbOpen,      setSbOpen]      = useState(false);
  const [expanded,    setExpanded]    = useState({ cat:true, price:true, brand:true, color:true, rating:true, size:false, ram:false, weight:false, discount:false, stock:false });
  const [searchInput, setSearchInput] = useState("");
  const [minPI,       setMinPI]       = useState("");
  const [maxPI,       setMaxPI]       = useState("");

  const topRef = useRef();

  // ── URL params ──
  const p           = n => sp.get(n) || "";
  const page        = Math.max(parseInt(p("page"))  || 1, 1);
  const sortBy      = p("sortBy")      || "latest";
  const search      = p("search");
  const catId       = p("catId");
  const minPrice    = p("minPrice");
  const maxPrice    = p("maxPrice");
  const minRating   = p("minRating");
  const stockStatus = p("stockStatus");
  const discountMin = p("discountMin");

  // array params stored as comma-separated
  const arrParam  = (key) => sp.get(key) ? sp.get(key).split(",").filter(Boolean) : [];
  const brands    = arrParam("brands");
  const colors    = arrParam("colors");
  const sizes     = arrParam("sizes");
  const ramOpts   = arrParam("ramOptions");
  const weights   = arrParam("weights");

  // ── Helpers ──
  const go = useCallback((patches) => {
    setSP(prev => {
      const n = new URLSearchParams(prev);
      Object.entries(patches).forEach(([k, v]) => {
        if (v === "" || v === null || v === undefined || (Array.isArray(v) && v.length === 0)) n.delete(k);
        else n.set(k, Array.isArray(v) ? v.join(",") : String(v));
      });
      if (!("page" in patches)) n.set("page", "1");
      return n;
    });
    setSbOpen(false); // close sidebar on any filter apply
  }, [setSP]);

  const setPage = (pg) => { setSP(prev => { const n = new URLSearchParams(prev); n.set("page", pg); return n; }); topRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }); };

  const toggleArr = (key, cur, val) => go({ [key]: cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val] });

  // ── Query string ──
  const query = useMemo(() => {
    const q = new URLSearchParams();
    q.set("page", page); q.set("limit", 20); q.set("sortBy", sortBy);
    if (search)      q.set("search",      search);
    if (catId)       q.set("catId",       catId);
    if (minPrice)    q.set("minPrice",    minPrice);
    if (maxPrice)    q.set("maxPrice",    maxPrice);
    if (minRating)   q.set("minRating",  minRating);
    if (stockStatus) q.set("stockStatus", stockStatus);
    if (discountMin) q.set("discountMin", discountMin);
    if (brands.length)  q.set("brands",     brands.join(","));
    if (colors.length)  q.set("colors",     colors.join(","));
    if (sizes.length)   q.set("sizes",      sizes.join(","));
    if (ramOpts.length) q.set("ramOptions", ramOpts.join(","));
    if (weights.length) q.set("weights",    weights.join(","));
    return q.toString();
  }, [page, sortBy, search, catId, minPrice, maxPrice, minRating, stockStatus, discountMin, brands, colors, sizes, ramOpts, weights]);

  // ── Fetch products ──
  // Scroll to top when navigating to a new store
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [sellerId]);

  useEffect(() => {
    setLoading(true);
    fetchDataFromApi(`/api/product/store/${sellerId}?${query}`).then(res => {
      if (res?.success) {
        setProducts(res.products || []);
        setMeta({ total: res.total || 0, totalPages: res.totalPages || 1 });
        setCategories(res.categories || []);
        if (res.filterOptions) setFilterOpts(res.filterOptions);
        if (res.ratingStats)   setRatingStats(res.ratingStats);
        const first = res.products?.[0];
        if (first) setSellerName(first?.seller?.storeProfile?.storeName || first?.seller?.name || "Seller Store");
      }
      setLoading(false);
    });
  }, [sellerId, query]);

  // ── Fetch seller profile ──
  useEffect(() => {
    fetchDataFromApi(`/api/user/seller/store-profile/${sellerId}`).then(res => {
      if (res?.success) {
        setSellerProfile(res?.seller?.storeProfile || null);
        setSellerName(res?.seller?.storeProfile?.storeName || res?.seller?.name || "Seller Store");
      }
    });
  }, [sellerId]);

  // Sync inputs with URL
  useEffect(() => { setSearchInput(search); },       [search]);
  useEffect(() => { setMinPI(minPrice); setMaxPI(maxPrice); }, [minPrice, maxPrice]);

  // ── Active filters count ──
  const activeCount = [catId, minPrice, maxPrice, minRating, search, stockStatus, discountMin, ...brands, ...colors, ...sizes, ...ramOpts, ...weights].filter(Boolean).length;

  const resetAll = () => { setSearchInput(""); setMinPI(""); setMaxPI(""); setSP({ page:"1", sortBy }); };

  // ── Pagination ──
  const pageRange = useMemo(() => {
    const t = meta.totalPages;
    if (t <= 7) return Array.from({ length: t }, (_, i) => i+1);
    if (page <= 4) return [1,2,3,4,5,"...",t];
    if (page >= t-3) return [1,"...",t-4,t-3,t-2,t-1,t];
    return [1,"...",page-1,page,page+1,"...",t];
  }, [page, meta.totalPages]);

  // ── Sidebar ──────────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <div style={{ display:"flex", flexDirection:"column" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 15px", borderBottom:"1px solid #f1f5f9" }}>
        <span style={{ fontSize:13, fontWeight:700, color:"#0f172a", display:"flex", alignItems:"center", gap:6 }}>
          <IFilter />Filters
          {activeCount > 0 && <span style={{ background:"#2563eb", color:"#fff", borderRadius:99, fontSize:10, padding:"1px 6px", fontWeight:700 }}>{activeCount}</span>}
        </span>
        {activeCount > 0 && (
          <button onClick={resetAll} style={{ fontSize:11, color:"#ef4444", cursor:"pointer", background:"none", border:"none", fontWeight:700 }}>Clear All</button>
        )}
      </div>

      {/* Category */}
      <Section title="Category" open={expanded.cat} onToggle={() => setExpanded(e => ({ ...e, cat: !e.cat }))} badge={catId ? 1 : 0}>
        {[{ _id:"", name:"All Categories", total: meta.total }, ...categories].map(cat => (
          <FRow key={cat._id} label={`${cat.name} (${cat.total})`} checked={catId === cat._id} onToggle={() => go({ catId: cat._id })} />
        ))}
      </Section>

      {/* Price */}
      <Section title="Price Range" open={expanded.price} onToggle={() => setExpanded(e => ({ ...e, price: !e.price }))} badge={(minPrice||maxPrice) ? 1 : 0}>
        {QUICK_PRICES.map(r => (
          <button key={r.l} onClick={() => { setMinPI(r.min); setMaxPI(r.max); go({ minPrice:r.min, maxPrice:r.max }); }}
            style={{ display:"block", width:"100%", textAlign:"left", fontSize:12, padding:"5px 0", background:"none", border:"none", cursor:"pointer", color:(minPrice===r.min&&maxPrice===r.max) ? "#2563eb" : "#374151", fontWeight:(minPrice===r.min&&maxPrice===r.max) ? 700 : 400 }}>
            {r.l}
          </button>
        ))}
        <div style={{ display:"flex", gap:6, marginTop:10 }}>
          <input type="number" placeholder="Min ₹" value={minPI} onChange={e => setMinPI(e.target.value)}
            style={{ flex:1, border:"1px solid #e2e8f0", borderRadius:6, padding:"6px 8px", fontSize:12, outline:"none" }} />
          <input type="number" placeholder="Max ₹" value={maxPI} onChange={e => setMaxPI(e.target.value)}
            style={{ flex:1, border:"1px solid #e2e8f0", borderRadius:6, padding:"6px 8px", fontSize:12, outline:"none" }} />
        </div>
        <button onClick={() => go({ minPrice: minPI, maxPrice: maxPI })}
          style={{ marginTop:8, width:"100%", background:"#0f172a", color:"#fff", border:"none", borderRadius:6, padding:"7px", fontSize:12, cursor:"pointer", fontWeight:700 }}>
          Apply
        </button>
      </Section>

      {/* Customer Rating */}
      <Section title="Customer Rating" open={expanded.rating} onToggle={() => setExpanded(e => ({ ...e, rating: !e.rating }))} badge={minRating ? 1 : 0}>
        {[4,3,2].map(r => (
          <button key={r} onClick={() => go({ minRating: minRating === String(r) ? "" : String(r) })}
            style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"5px 0", background:"none", border:"none", cursor:"pointer" }}>
            <Cb checked={minRating === String(r)} />
            <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color: minRating===String(r) ? "#2563eb" : "#374151", fontWeight: minRating===String(r) ? 600 : 400 }}>
              <Stars v={r} />&nbsp;& above
            </span>
          </button>
        ))}
        {ratingStats?.totalReviews > 0 && (
          <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid #f1f5f9" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <span style={{ fontSize:28, fontWeight:800, color:"#0f172a", lineHeight:1 }}>{ratingStats.avg}</span>
              <div><Stars v={ratingStats.avg} /><p style={{ fontSize:10, color:"#94a3b8", marginTop:3 }}>{ratingStats.totalReviews} reviews</p></div>
            </div>
            {[5,4,3,2,1].map(s => <StarBar key={s} star={s} count={ratingStats.breakdown?.[s]||0} total={ratingStats.totalReviews} />)}
          </div>
        )}
      </Section>

      {/* Brand */}
      {filterOpts.brands?.length > 0 && (
        <Section title="Brand" open={expanded.brand} onToggle={() => setExpanded(e => ({ ...e, brand: !e.brand }))} badge={brands.length}>
          <div style={{ maxHeight:170, overflowY:"auto" }}>
            {filterOpts.brands.map(b => (
              <FRow key={b} label={b} checked={brands.includes(b)} onToggle={() => toggleArr("brands", brands, b)} />
            ))}
          </div>
        </Section>
      )}

      {/* Color */}
      {filterOpts.colors?.length > 0 && (
        <Section title="Color" open={expanded.color} onToggle={() => setExpanded(e => ({ ...e, color: !e.color }))} badge={colors.length}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {filterOpts.colors.map(c => (
              <button key={c} onClick={() => toggleArr("colors", colors, c)} title={c}
                style={{ width:26, height:26, borderRadius:"50%", border:`2px solid ${colors.includes(c) ? "#2563eb" : "#e2e8f0"}`, background:swatch(c), cursor:"pointer", outline:"none", position:"relative", boxShadow: colors.includes(c) ? "0 0 0 2px #fff, 0 0 0 4px #2563eb" : "none", transition:"all .15s" }}>
                {colors.includes(c) && (
                  <span style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Svg d="M5 13l4 4L19 7" size={10} stroke="#fff" sw={2.5} fill="none" />
                  </span>
                )}
              </button>
            ))}
          </div>
          {colors.length > 0 && (
            <p style={{ fontSize:10, color:"#64748b", marginTop:6 }}>Selected: {colors.join(", ")}</p>
          )}
        </Section>
      )}

      {/* Size */}
      {filterOpts.sizes?.length > 0 && (
        <Section title="Size" open={expanded.size} onToggle={() => setExpanded(e => ({ ...e, size: !e.size }))} badge={sizes.length}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {filterOpts.sizes.map(s => (
              <button key={s} onClick={() => toggleArr("sizes", sizes, s)}
                style={{ padding:"3px 10px", borderRadius:5, border:`1.5px solid ${sizes.includes(s) ? "#2563eb" : "#e2e8f0"}`, background: sizes.includes(s) ? "#eff6ff" : "#fff", color: sizes.includes(s) ? "#2563eb" : "#374151", fontSize:11, fontWeight: sizes.includes(s) ? 700 : 400, cursor:"pointer", transition:"all .15s" }}>
                {s}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* RAM */}
      {filterOpts.ramOptions?.length > 0 && (
        <Section title="RAM" open={expanded.ram} onToggle={() => setExpanded(e => ({ ...e, ram: !e.ram }))} badge={ramOpts.length}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {filterOpts.ramOptions.map(r => (
              <button key={r} onClick={() => toggleArr("ramOptions", ramOpts, r)}
                style={{ padding:"3px 10px", borderRadius:5, border:`1.5px solid ${ramOpts.includes(r) ? "#2563eb" : "#e2e8f0"}`, background: ramOpts.includes(r) ? "#eff6ff" : "#fff", color: ramOpts.includes(r) ? "#2563eb" : "#374151", fontSize:11, fontWeight: ramOpts.includes(r) ? 700 : 400, cursor:"pointer", transition:"all .15s" }}>
                {r}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Weight */}
      {filterOpts.weights?.length > 0 && (
        <Section title="Weight" open={expanded.weight} onToggle={() => setExpanded(e => ({ ...e, weight: !e.weight }))} badge={weights.length}>
          {filterOpts.weights.map(w => (
            <FRow key={w} label={w} checked={weights.includes(w)} onToggle={() => toggleArr("weights", weights, w)} />
          ))}
        </Section>
      )}

      {/* Discount */}
      {filterOpts.hasDiscount && (
        <Section title="Discount" open={expanded.discount} onToggle={() => setExpanded(e => ({ ...e, discount: !e.discount }))} badge={discountMin ? 1 : 0}>
          {DISCOUNT_OPTS.map(d => (
            <button key={d.v} onClick={() => go({ discountMin: discountMin===d.v ? "" : d.v })}
              style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"5px 0", background:"none", border:"none", cursor:"pointer" }}>
              <Cb checked={discountMin === d.v} />
              <span style={{ fontSize:12, display:"flex", alignItems:"center", gap:4, color: discountMin===d.v ? "#2563eb" : "#374151", fontWeight: discountMin===d.v ? 700 : 400 }}>
                <ITag />{d.l}
              </span>
            </button>
          ))}
        </Section>
      )}

      {/* Availability */}
      <Section title="Availability" open={expanded.stock} onToggle={() => setExpanded(e => ({ ...e, stock: !e.stock }))} badge={stockStatus ? 1 : 0}>
        {[{ v:"", l:"All" }, { v:"inStock", l:"In Stock" }, ...(filterOpts.hasOutOfStock ? [{ v:"outOfStock", l:"Out of Stock" }] : [])].map(s => (
          <FRow key={s.v} label={s.l} checked={stockStatus === s.v} onToggle={() => go({ stockStatus: s.v })} />
        ))}
      </Section>

    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .sp * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        .sp-card { transition: transform .18s, box-shadow .18s; }
        .sp-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0,0,0,.1); }
        .sp-pgbtn { width:32px; height:32px; border-radius:6px; border:1px solid #e2e8f0; background:#fff; cursor:pointer; font-size:12px; font-weight:700; color:#374151; display:inline-flex; align-items:center; justify-content:center; transition:all .15s; font-family:inherit; }
        .sp-pgbtn:hover:not(:disabled) { background:#0f172a; color:#fff; border-color:#0f172a; }
        .sp-pgbtn.act { background:#2563eb; color:#fff; border-color:#2563eb; }
        .sp-pgbtn:disabled { opacity:.35; cursor:not-allowed; }
        .sp-chip { display:inline-flex; align-items:center; gap:4px; padding:3px 10px 3px 8px; border-radius:99px; background:#eff6ff; border:1px solid #bfdbfe; color:#1d4ed8; font-size:11px; font-weight:600; cursor:pointer; transition:background .15s; }
        .sp-chip:hover { background:#dbeafe; }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .skel-shine { background:linear-gradient(90deg,#f1f5f9 25%,#e8edf2 50%,#f1f5f9 75%); background-size:200% 100%; animation:shimmer 1.3s infinite; }
        .sp-mob-sb { position:fixed; left:0; top:0; bottom:0; width:290px; background:#fff; z-index:1000; overflow-y:auto; transform:translateX(-100%); transition:transform .28s cubic-bezier(.4,0,.2,1); box-shadow:4px 0 24px rgba(0,0,0,.13); }
        .sp-mob-sb.open { transform:translateX(0); }
        .sp-overlay { position:fixed; inset:0; background:rgba(15,23,42,.45); z-index:999; backdrop-filter:blur(2px); }
        .sp-desk-sb { display:none; }
        .sp-mob-fbtn { display:flex !important; }
        @media(min-width:1024px){ .sp-desk-sb{display:block;} .sp-mob-fbtn{display:none !important;} }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
      `}</style>

      <div className="sp" style={{ background:"#f1f5f9", minHeight:"80vh" }} ref={topRef}>

        {/* Mobile overlay */}
        {sbOpen && <div className="sp-overlay" onClick={() => setSbOpen(false)} />}
        <div className={`sp-mob-sb ${sbOpen ? "open" : ""}`}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 15px", background:"#0f172a", position:"sticky", top:0, zIndex:1 }}>
            <span style={{ color:"#fff", fontWeight:700, fontSize:14, display:"flex", alignItems:"center", gap:6 }}><IFilter />Filters {activeCount > 0 && `(${activeCount})`}</span>
            <button onClick={() => setSbOpen(false)} style={{ background:"rgba(255,255,255,.12)", border:"none", color:"#fff", cursor:"pointer", borderRadius:6, padding:"4px 8px", fontSize:13, fontWeight:700 }}>✕ Close</button>
          </div>
          <Sidebar />
        </div>

        <div className="container" style={{ paddingTop:16, paddingBottom:40 }}>

          {/* Breadcrumb */}
          <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:14, fontSize:12 }}>
            <Link to="/" style={{ color:"#2563eb", textDecoration:"none", fontWeight:500 }}>Home</Link>
            <span style={{ color:"#cbd5e1" }}>/</span>
            <span style={{ color:"#475569", fontWeight:600 }}>{sellerName}</span>
          </div>

          {/* ── Seller Banner ── */}
          <div style={{ background:"linear-gradient(130deg,#0f172a 0%,#1e3a5f 50%,#1d4ed8 100%)", borderRadius:16, padding:"20px 22px", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:54, height:54, borderRadius:14, background:"rgba(255,255,255,.13)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", flexShrink:0 }}>
                  <IStore />
                </div>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
                    <h1 style={{ fontSize:19, fontWeight:800, color:"#fff", margin:0, letterSpacing:"-.02em" }}>{sellerName}</h1>
                    <IVerify />
                  </div>
                  <p style={{ fontSize:12, color:"rgba(255,255,255,.65)", margin:"0 0 6px" }}>
                    {sellerProfile?.description || "Verified Seller · Quality Assured · Fast Delivery"}
                  </p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:14 }}>
                    {sellerProfile?.location  && <span style={{ fontSize:11, color:"rgba(255,255,255,.55)" }}>📍 {sellerProfile.location}</span>}
                    {sellerProfile?.contactNo && <span style={{ fontSize:11, color:"rgba(255,255,255,.55)" }}>☎ {sellerProfile.contactNo}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[
                  { val: meta.total,          lbl:"Products"   },
                  ratingStats?.avg > 0 ? { val:`${ratingStats.avg}★`, lbl:"Avg Rating" } : null,
                  categories.length > 0 ? { val: categories.length,    lbl:"Categories" } : null,
                ].filter(Boolean).map(s => (
                  <div key={s.lbl} style={{ textAlign:"center", background:"rgba(255,255,255,.1)", borderRadius:10, padding:"9px 16px", backdropFilter:"blur(4px)" }}>
                    <p style={{ fontSize:19, fontWeight:800, color:"#fff", margin:0 }}>{s.val}</p>
                    <p style={{ fontSize:10, color:"rgba(255,255,255,.55)", margin:0 }}>{s.lbl}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Layout ── */}
          <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>

            {/* Desktop sidebar */}
            <div className="sp-desk-sb" style={{ width:224, flexShrink:0, background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", overflow:"hidden", position:"sticky", top:80 }}>
              <Sidebar />
            </div>

            {/* Products column */}
            <div style={{ flex:1, minWidth:0 }}>

              {/* Toolbar */}
              <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"11px 13px", marginBottom:11 }}>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>

                  {/* Search */}
                  <div style={{ flex:"1 1 200px", display:"flex", border:"1.5px solid #e2e8f0", borderRadius:8, overflow:"hidden" }}>
                    <span style={{ padding:"0 10px", display:"flex", alignItems:"center", color:"#94a3b8", background:"#f8fafc", borderRight:"1px solid #e2e8f0" }}><ISearch /></span>
                    <input value={searchInput} placeholder="Search products in this store…"
                      onChange={e => setSearchInput(e.target.value)}
                      onKeyDown={e => { if(e.key==="Enter") go({ search: searchInput.trim() }); }}
                      style={{ flex:1, border:"none", padding:"9px 10px", fontSize:13, background:"#fff", outline:"none", fontFamily:"inherit" }} />
                    <button onClick={() => go({ search: searchInput.trim() })}
                      style={{ padding:"0 14px", background:"#1d4ed8", color:"#fff", border:"none", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                      Search
                    </button>
                  </div>

                  {/* Sort */}
                  <div style={{ display:"flex", alignItems:"center", gap:5, border:"1.5px solid #e2e8f0", borderRadius:8, padding:"0 10px", height:40, flexShrink:0 }}>
                    <ISort />
                    <select value={sortBy} onChange={e => go({ sortBy: e.target.value })}
                      style={{ border:"none", fontSize:12, fontWeight:600, color:"#374151", cursor:"pointer", background:"none", outline:"none", fontFamily:"inherit" }}>
                      {SORTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>

                  {/* Mobile filter */}
                  <button className="sp-mob-fbtn" onClick={() => setSbOpen(true)}
                    style={{ alignItems:"center", gap:6, padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, background: activeCount>0 ? "#eff6ff" : "#fff", cursor:"pointer", fontSize:12, fontWeight:700, color: activeCount>0 ? "#2563eb" : "#374151", display:"none" }}>
                    <IFilter /> Filters {activeCount>0 && `(${activeCount})`}
                  </button>

                  {/* View toggle */}
                  <div style={{ display:"flex", border:"1.5px solid #e2e8f0", borderRadius:8, overflow:"hidden", flexShrink:0 }}>
                    {[{m:"grid",i:<IGrid/>},{m:"list",i:<IList/>}].map(({m,i}) => (
                      <button key={m} onClick={() => setViewMode(m)}
                        style={{ padding:"8px 10px", border:"none", cursor:"pointer", background: viewMode===m ? "#0f172a" : "#fff", color: viewMode===m ? "#fff" : "#94a3b8", display:"flex", alignItems:"center", transition:"all .15s" }}>
                        {i}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active chips */}
                {activeCount > 0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:9 }}>
                    {search      && <span className="sp-chip" onClick={() => { setSearchInput(""); go({ search:"" }); }}>🔍 {search} <IX /></span>}
                    {catId       && <span className="sp-chip" onClick={() => go({ catId:"" })}>{categories.find(c=>c._id===catId)?.name||"Category"} <IX /></span>}
                    {(minPrice||maxPrice) && <span className="sp-chip" onClick={() => { setMinPI(""); setMaxPI(""); go({ minPrice:"", maxPrice:"" }); }}>₹{minPrice||"0"} – ₹{maxPrice||"∞"} <IX /></span>}
                    {minRating   && <span className="sp-chip" onClick={() => go({ minRating:"" })}>{minRating}★ & above <IX /></span>}
                    {stockStatus && <span className="sp-chip" onClick={() => go({ stockStatus:"" })}>{stockStatus==="inStock"?"In Stock":"Out of Stock"} <IX /></span>}
                    {discountMin && <span className="sp-chip" onClick={() => go({ discountMin:"" })}>{discountMin}%+ off <IX /></span>}
                    {brands.map(b  => <span key={b}  className="sp-chip" onClick={() => toggleArr("brands",    brands,  b)}>Brand: {b} <IX /></span>)}
                    {colors.map(c  => <span key={c}  className="sp-chip" onClick={() => toggleArr("colors",    colors,  c)}>🎨 {c} <IX /></span>)}
                    {sizes.map(s   => <span key={s}  className="sp-chip" onClick={() => toggleArr("sizes",     sizes,   s)}>Size: {s} <IX /></span>)}
                    {ramOpts.map(r => <span key={r}  className="sp-chip" onClick={() => toggleArr("ramOptions",ramOpts, r)}>RAM: {r} <IX /></span>)}
                    {weights.map(w => <span key={w}  className="sp-chip" onClick={() => toggleArr("weights",   weights, w)}>Wt: {w} <IX /></span>)}
                    <button onClick={resetAll} style={{ fontSize:11, color:"#ef4444", background:"none", border:"none", cursor:"pointer", fontWeight:700, padding:"3px 4px" }}>Clear All</button>
                  </div>
                )}
              </div>

              {/* Count */}
              {!loading && (
                <p style={{ fontSize:12, color:"#64748b", marginBottom:9, paddingLeft:2 }}>
                  Showing <strong style={{ color:"#0f172a" }}>{products.length}</strong> of <strong style={{ color:"#0f172a" }}>{meta.total}</strong> products
                  {search && <> for "<strong style={{ color:"#2563eb" }}>{search}</strong>"</>}
                </p>
              )}

              {/* Products */}
              {loading ? (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(150px, 1fr))", gap:11 }}>
                  {Array.from({length:12}).map((_,i) => <Skel key={i} />)}
                </div>
              ) : products.length > 0 ? (
                <>
                  <div style={{ display:"grid", gridTemplateColumns: viewMode==="list" ? "1fr" : "repeat(auto-fill, minmax(150px, 1fr))", gap:11 }}>
                    {products.map(item => (
                      <div key={item?._id} className="sp-card"><ProductItem item={item} /></div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {meta.totalPages > 1 && (
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:18, background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:"11px 15px", flexWrap:"wrap", gap:10 }}>
                      <p style={{ fontSize:12, color:"#64748b", margin:0 }}>
                        Page <strong style={{ color:"#0f172a" }}>{page}</strong> of <strong style={{ color:"#0f172a" }}>{meta.totalPages}</strong>
                        <span style={{ color:"#94a3b8", marginLeft:8 }}>· {meta.total} products</span>
                      </p>
                      <div style={{ display:"flex", gap:4, alignItems:"center", flexWrap:"wrap" }}>
                        <button className="sp-pgbtn" disabled={page<=1} onClick={() => setPage(1)} title="First">«</button>
                        <button className="sp-pgbtn" disabled={page<=1} onClick={() => setPage(page-1)}>‹</button>
                        {pageRange.map((pg, i) =>
                          pg==="..." ? <span key={`d${i}`} style={{ padding:"0 3px", color:"#94a3b8", fontSize:13 }}>…</span>
                          : <button key={pg} className={`sp-pgbtn${pg===page?" act":""}`} onClick={() => setPage(pg)}>{pg}</button>
                        )}
                        <button className="sp-pgbtn" disabled={page>=meta.totalPages} onClick={() => setPage(page+1)}>›</button>
                        <button className="sp-pgbtn" disabled={page>=meta.totalPages} onClick={() => setPage(meta.totalPages)} title="Last">»</button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:"52px 24px", textAlign:"center" }}>
                  <p style={{ fontSize:36, margin:"0 0 8px" }}>🔍</p>
                  <p style={{ fontSize:15, fontWeight:700, color:"#0f172a", margin:"0 0 6px" }}>No products found</p>
                  <p style={{ fontSize:13, color:"#64748b", margin:"0 0 18px" }}>Try adjusting your filters or search query</p>
                  <button onClick={resetAll} style={{ background:"#1d4ed8", color:"#fff", border:"none", borderRadius:8, padding:"10px 22px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StorePage;