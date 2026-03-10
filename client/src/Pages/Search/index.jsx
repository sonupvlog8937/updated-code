import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Sidebar } from "../../components/Sidebar";
import ProductItem from "../../components/ProductItem";
import ProductItemListView from "../../components/ProductItemListView";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import ProductLoadingGrid from "../../components/ProductLoading/productLoadingGrid";
import { useAppContext } from "../../hooks/useAppContext";
import { MdTune, MdClose, MdKeyboardArrowDown } from "react-icons/md";
import { HiViewGrid, HiViewList } from "react-icons/hi";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setGlobalLoading } from "../../store/appSlice";

/* ─────────────────────────── CSS ─────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  .sp-root * { font-family:'DM Sans',sans-serif; box-sizing:border-box; }
  .sp-display { font-family:'Syne',sans-serif !important; }

  @keyframes sp-fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sp-fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes sp-badgePop { 0%{opacity:0;transform:scale(0.5)} 70%{transform:scale(1.2)} 100%{opacity:1;transform:scale(1)} }
  @keyframes sp-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
  @keyframes sp-slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

  /* ── Toolbar: sticky, scroll-aware ── */
  .sp-toolbar { position:sticky; top:64px; z-index:99; transition:transform 0.38s cubic-bezier(0.22,0.61,0.36,1),opacity 0.28s ease; will-change:transform,opacity; margin-bottom:4px; }
  .sp-toolbar.sp-show { transform:translateY(0); opacity:1; pointer-events:all; }
  .sp-toolbar.sp-hide { transform:translateY(-120%); opacity:0; pointer-events:none; }

  /* Card wrapper */
  .sp-toolbar-inner { background:rgba(255,255,255,0.97); border:1px solid #e8e8f0; border-radius:16px; box-shadow:0 2px 16px rgba(0,0,0,0.07),0 1px 4px rgba(0,0,0,0.04); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); overflow:hidden; }

  /* Row 1: filter + count + views + sort */
  .sp-tb-row1 { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:9px 14px; border-bottom:1px solid transparent; transition:border-color 0.2s; }
  .sp-tb-row1.has-pills { border-bottom-color:#f1f2f6; }

  /* Row 2: pills */
  .sp-tb-row2 { padding:8px 14px 10px; animation:sp-pillsIn 0.22s ease both; }
  @keyframes sp-pillsIn { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }

  /* Filter button */
  .sp-filter-btn { display:inline-flex; align-items:center; gap:7px; height:36px; padding:0 14px; background:#0d0d12; color:#fff; border:none; border-radius:10px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; outline:none; flex-shrink:0; transition:transform 0.17s ease,box-shadow 0.17s ease,background 0.17s ease; -webkit-tap-highlight-color:transparent; }
  .sp-filter-btn:hover { background:#1d1d28; transform:translateY(-1px); box-shadow:0 5px 16px rgba(13,13,18,0.2); }
  .sp-filter-btn:active { transform:scale(0.97); }
  .sp-badge { display:inline-flex; align-items:center; justify-content:center; min-width:18px; height:18px; padding:0 5px; background:#E8362A; color:#fff; border-radius:20px; font-size:10px; font-weight:800; line-height:1; animation:sp-badgePop 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }

  /* Pills row */
  .sp-pills-wrap { position:relative; }
  .sp-pills-wrap::after { content:''; position:absolute; right:0; top:0; bottom:0; width:40px; background:linear-gradient(to right,transparent,rgba(255,255,255,0.97)); pointer-events:none; }
  .sp-pills { display:flex; align-items:center; gap:6px; overflow-x:auto; flex-wrap:nowrap; scrollbar-width:none; padding-bottom:2px; padding-right:40px; }
  .sp-pills::-webkit-scrollbar { display:none; }
  .sp-pills-meta { font-size:11px; color:#9ca3af; font-weight:500; white-space:nowrap; flex-shrink:0; padding-right:8px; border-right:1.5px solid #e8e8f0; margin-right:2px; }
  .sp-pill { display:inline-flex; align-items:center; gap:5px; height:28px; padding:0 11px; background:#f4f4f8; color:#374151; border:1px solid #e4e4ec; border-radius:20px; font-size:11.5px; font-weight:600; white-space:nowrap; cursor:pointer; outline:none; flex-shrink:0; transition:all 0.15s ease; animation:sp-fadeIn 0.18s ease both; }
  .sp-pill:hover { background:#fff0f0; color:#E8362A; border-color:#fecdd3; }
  .sp-pill-clear { background:#fff0f0; color:#E8362A; border-color:#fecdd3; font-weight:700; }
  .sp-pill-clear:hover { background:#E8362A; color:#fff; border-color:#E8362A; }

  /* Sort button */
  .sp-sort-btn { display:inline-flex; align-items:center; gap:5px; height:36px; padding:0 12px; background:#f8f8fb; color:#0d0d12; border:1.5px solid #e8e8f0; border-radius:10px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; outline:none; flex-shrink:0; white-space:nowrap; transition:all 0.17s ease; -webkit-tap-highlight-color:transparent; }
  .sp-sort-btn:hover { background:#fff; border-color:#0d0d12; box-shadow:0 3px 10px rgba(0,0,0,0.07); }
  .sp-sort-icon { transition:transform 0.22s ease; }
  .sp-sort-btn.sp-sort-open .sp-sort-icon { transform:rotate(180deg); }

  .sp-vbtn { width:36px; height:36px; border-radius:10px; display:inline-flex; align-items:center; justify-content:center; background:transparent; border:1.5px solid #e8e8f0; color:#9ca3af; cursor:pointer; outline:none; transition:all 0.17s ease; -webkit-tap-highlight-color:transparent; }
  .sp-vbtn:hover { background:#f8f8fb; color:#0d0d12; }
  .sp-vbtn.sp-vact { background:#0d0d12; color:#fff; border-color:#0d0d12; }

  .sp-meta { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; padding:12px 0 4px; animation:sp-fadeUp 0.35s ease both; }
  .sp-query-label { font-size:20px; font-weight:800; color:#0d0d12; font-family:'Syne',sans-serif; display:flex; align-items:center; gap:8px; }
  .sp-query-keyword { color:#E8362A; position:relative; }
  .sp-query-keyword::after { content:''; position:absolute; left:0; bottom:-2px; width:100%; height:2px; background:#E8362A; border-radius:2px; opacity:0.35; }
  .sp-result-count { font-size:12px; color:#9ca3af; font-weight:500; background:#f1f2f6; border-radius:20px; padding:4px 12px; white-space:nowrap; }
  .sp-result-count strong { color:#0d0d12; font-weight:700; }

  .sp-correction { display:flex; align-items:center; gap:8px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:10px 14px; margin-bottom:12px; font-size:13px; color:#1e40af; animation:sp-slideDown 0.25s ease both; }
  .sp-correction strong { font-weight:700; }

  .sp-ai-card { background:linear-gradient(135deg,#0d0d12 0%,#1a1a2e 100%); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:18px 20px; margin-bottom:16px; animation:sp-fadeUp 0.4s ease both; position:relative; overflow:hidden; }
  .sp-ai-card::before { content:''; position:absolute; top:0; right:0; width:200px; height:200px; background:radial-gradient(circle,rgba(232,54,42,0.15) 0%,transparent 70%); pointer-events:none; }
  .sp-ai-label { font-size:10px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:#93c5fd; display:flex; align-items:center; gap:5px; margin-bottom:8px; }
  .sp-ai-dot { width:6px; height:6px; border-radius:50%; background:#93c5fd; animation:sp-pulse 1.4s ease infinite; }
  .sp-ai-summary { font-size:14px; color:rgba(255,255,255,0.88); line-height:1.65; margin:0 0 10px; }
  .sp-ai-highlights { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:6px; }
  .sp-ai-highlights li { font-size:12px; color:rgba(255,255,255,0.55); display:flex; align-items:flex-start; gap:7px; line-height:1.5; }
  .sp-ai-highlights li::before { content:''; width:5px; height:5px; border-radius:50%; background:#E8362A; flex-shrink:0; margin-top:5px; }

  .sp-menu .MuiPaper-root { border-radius:14px !important; border:1px solid #e8e8f0 !important; box-shadow:0 8px 32px rgba(0,0,0,0.1) !important; min-width:210px !important; margin-top:6px !important; }
  .sp-menu .MuiMenuItem-root { font-family:'DM Sans',sans-serif !important; font-size:13px !important; font-weight:500 !important; padding:10px 16px !important; transition:background 0.14s ease !important; }
  .sp-menu .MuiMenuItem-root.Mui-selected { background:#f8f8fb !important; font-weight:700 !important; }
  .sp-menu .MuiMenuItem-root:hover { background:#f8f8fb !important; }

  .sp-grid { display:grid; gap:16px; grid-template-columns:repeat(5,1fr); }
  .sp-grid.sp-list { grid-template-columns:1fr; }
  @media (max-width:1280px){ .sp-grid { grid-template-columns:repeat(4,1fr); } }
  @media (max-width:900px)  { .sp-grid { grid-template-columns:repeat(3,1fr); } }
  @media (max-width:640px)  { .sp-grid { grid-template-columns:repeat(2,1fr); } }

  .sp-item { animation:sp-fadeUp 0.38s cubic-bezier(0.22,0.61,0.36,1) both; }
  .sp-item:nth-child(1){animation-delay:.02s} .sp-item:nth-child(2){animation-delay:.05s}
  .sp-item:nth-child(3){animation-delay:.08s} .sp-item:nth-child(4){animation-delay:.11s}
  .sp-item:nth-child(5){animation-delay:.14s} .sp-item:nth-child(6){animation-delay:.17s}
  .sp-item:nth-child(7){animation-delay:.20s} .sp-item:nth-child(8){animation-delay:.23s}
  .sp-item:nth-child(9){animation-delay:.26s} .sp-item:nth-child(10){animation-delay:.29s}

  .sp-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:80px 24px; text-align:center; animation:sp-fadeUp 0.4s ease both; grid-column:1/-1; }
  .sp-empty-icon { width:76px; height:76px; border-radius:20px; background:#f8f8fb; border:1.5px solid #e8e8f0; display:flex; align-items:center; justify-content:center; font-size:34px; margin-bottom:20px; }
  .sp-reset-btn { display:inline-flex; align-items:center; gap:6px; margin-top:18px; height:40px; padding:0 22px; background:#0d0d12; color:#fff; border:none; border-radius:10px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; outline:none; transition:transform 0.17s ease,box-shadow 0.17s ease; }
  .sp-reset-btn:hover { transform:translateY(-1px); box-shadow:0 5px 16px rgba(13,13,18,0.2); }

  .sp-no-query { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:100px 24px; text-align:center; animation:sp-fadeUp 0.4s ease both; }
  .sp-no-query-icon { width:88px; height:88px; border-radius:24px; background:linear-gradient(135deg,#f8f8fb,#f0f0f5); border:1.5px solid #e8e8f0; display:flex; align-items:center; justify-content:center; font-size:40px; margin-bottom:24px; box-shadow:0 4px 20px rgba(0,0,0,0.06); }

  .sp-paging { margin-top:40px; padding-top:24px; border-top:1px solid #e8e8f0; display:flex; flex-direction:column; align-items:center; gap:8px; }
  .sp-page-label { font-size:12px; color:#9ca3af; font-weight:500; }
`;

/* ─────────────────── SORT OPTIONS ─────────────────────────────── */
const SORT_OPTIONS = [
  { value: "bestseller", label: "🏆 Best Seller"       },
  { value: "latest",     label: "🆕 Latest"            },
  { value: "popular",    label: "⭐ Most Popular"       },
  { value: "priceAsc",   label: "💰 Price: Low → High" },
  { value: "priceDesc",  label: "💰 Price: High → Low" },
  { value: "nameAsc",    label: "🔤 Name: A → Z"       },
  { value: "nameDesc",   label: "🔤 Name: Z → A"       },
];

/* ─────────────────── URL HELPERS ───────────────────────────────
   ✅ URL is the SINGLE SOURCE OF TRUTH for all filters + page.
   This guarantees:
   - Page 2 ke saath filters apply karein → dono sync rahenge
   - Reset button → URL clear → all filters gone
   - Browser back → filters restore ho jaate hain
───────────────────────────────────────────────────────────────── */
const toArr    = (v) => (v || "").split(",").filter(Boolean);
const toNumArr = (v) => (v || "").split(",").map(Number).filter(Boolean);
const fromArr  = (a) => (a || []).join(",");

function readFiltersFromURL(params) {
  return {
    brands:     toArr(params.get("brands")),
    sizes:      toArr(params.get("sizes")),
    types:      toArr(params.get("types")),
    weights:    toArr(params.get("weights")),
    ram:        toArr(params.get("ram")),
    priceRanges:toArr(params.get("priceRanges")),
    minPrice:   params.get("minPrice") !== null ? Number(params.get("minPrice")) : null,
    maxPrice:   params.get("maxPrice") !== null ? Number(params.get("maxPrice")) : null,
    colors:     toArr(params.get("colors")),
    stock:      params.get("stock") || "all",
    sale:       params.get("sale") === "1",
    discount:   toNumArr(params.get("discount")),
    rating:     toNumArr(params.get("rating")),
    sort:       params.get("sort") || "bestseller",
    page:       Math.max(1, Number(params.get("page") || 1)),
    query:      params.get("query") || "",
    catId:      params.get("catId") || "",
    subCatId:   params.get("subCatId") || "",
    thirdCatId: params.get("thirdLavelCatId") || "",
  };
}

function buildURLSearch(filters) {
  const p = new URLSearchParams();
  if (filters.query)                            p.set("query",           filters.query);
  if (filters.catId)                            p.set("catId",           filters.catId);
  if (filters.subCatId)                         p.set("subCatId",        filters.subCatId);
  if (filters.thirdCatId)                       p.set("thirdLavelCatId", filters.thirdCatId);
  if (filters.page > 1)                         p.set("page",            String(filters.page));
  if (filters.sort && filters.sort !== "bestseller") p.set("sort",       filters.sort);
  if (filters.brands?.length)                   p.set("brands",          fromArr(filters.brands));
  if (filters.sizes?.length)                    p.set("sizes",           fromArr(filters.sizes));
  if (filters.types?.length)                    p.set("types",           fromArr(filters.types));
  if (filters.weights?.length)                  p.set("weights",         fromArr(filters.weights));
  if (filters.ram?.length)                      p.set("ram",             fromArr(filters.ram));
  if (filters.priceRanges?.length)              p.set("priceRanges",     fromArr(filters.priceRanges));
  if (filters.minPrice !== null && filters.minPrice !== undefined) p.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== null && filters.maxPrice !== undefined) p.set("maxPrice", String(filters.maxPrice));
  if (filters.colors?.length)                   p.set("colors",          fromArr(filters.colors));
  if (filters.stock && filters.stock !== "all") p.set("stock",           filters.stock);
  if (filters.sale)                             p.set("sale",            "1");
  if (filters.discount?.length)                 p.set("discount",        fromArr(filters.discount));
  if (filters.rating?.length)                   p.set("rating",          fromArr(filters.rating));
  return p.toString();
}

/* ─────────────────── SCROLL DIR HOOK ──────────────────────────── */
function useScrollDir(threshold = 90) {
  const [dir, setDir] = useState("up");
  const lastY = useRef(typeof window !== "undefined" ? window.scrollY : 0);
  useEffect(() => {
    const handler = () => {
      const y = window.scrollY, diff = y - lastY.current;
      if (Math.abs(diff) < 5) return;
      setDir(y <= threshold ? "up" : diff > 0 ? "down" : "up");
      lastY.current = y;
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);
  return dir;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const SearchPage = () => {
  const [itemView,      setItemView]      = useState("grid");
  const [anchorEl,      setAnchorEl]      = useState(null);
  const [productsData,  setProductsData]  = useState({});
  const [totalPages,    setTotalPages]    = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading,     setIsLoading]     = useState(false);
  const [aiInsights,    setAiInsights]    = useState(null);

  const context   = useAppContext();
  const location  = useLocation();
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const scrollDir = useScrollDir(90);
  const open      = Boolean(anchorEl);

  /* ──────────────────────────────────────────────────────────
     READ ALL STATE FROM URL — single source of truth
     Jab bhi location.search badlega (page/filter/sort),
     yahan se fresh values milenge. No stale state possible.
  ────────────────────────────────────────────────────────── */
  const filters = useMemo(
    () => readFiltersFromURL(new URLSearchParams(location.search)),
    [location.search]
  );

  const {
    brands:      selectedBrands,
    sizes:       selectedSizes,
    types:       selectedProductTypes,
    weights:     selectedWeights,
    ram:         selectedRamOptions,
    priceRanges: selectedPriceRanges,
    minPrice:    selectedMinPrice,
    maxPrice:    selectedMaxPrice,
    colors:      selectedColors,
    stock:       selectedStockStatus,
    sale:        selectedSaleOnly,
    discount:    selectedDiscountRanges,
    rating:      selectedRatingBands,
    sort:        selectedSortType,
    page,
    query:       searchQuery,
  } = filters;

  const sortLabel = useMemo(
    () => SORT_OPTIONS.find(o => o.value === selectedSortType)?.label || "🏆 Best Seller",
    [selectedSortType]
  );

  /* ──────────────────────────────────────────────────────────
     updateURL — merges overrides into current filters
     resetPage=true  → page jumps to 1 (filter change)
     resetPage=false → page stays same (only page changed)
  ────────────────────────────────────────────────────────── */
  const updateURL = useCallback((overrides, resetPage = true) => {
    const merged = resetPage
      ? { ...filters, ...overrides, page: 1 }
      : { ...filters, ...overrides };
    navigate(`${location.pathname}?${buildURLSearch(merged)}`, { replace: true });
  }, [filters, location.pathname, navigate]);

  /* ── Page navigation — keeps all filters ── */
  const goToPage = useCallback((newPage) => {
    updateURL({ page: newPage }, false);
  }, [updateURL]);

  /* ── Reset ALL filters — keeps only query + category ── */
  const handleResetAllFilters = useCallback(() => {
    navigate(
      `${location.pathname}?${buildURLSearch({
        query:      filters.query,
        catId:      filters.catId,
        subCatId:   filters.subCatId,
        thirdCatId: filters.thirdCatId,
        minPrice:   null,
        maxPrice:   null,
        page:       1,
      })}`,
      { replace: true }
    );
  }, [filters, location.pathname, navigate]);

  /* ── Sort ── */
  const handleSortBy = useCallback((sortType) => {
    setAnchorEl(null);
    updateURL({ sort: sortType });
  }, [updateURL]);

  /* ──────────────────────────────────────────────────────────
     FILTER SETTERS
     Each setter calls updateURL → URL changes → location.search
     changes → filters useMemo re-computes → Sidebar gets fresh
     values via props → Sidebar fetches with correct data.
     
     Accepts both direct value and functional updater (v => ...).
  ────────────────────────────────────────────────────────── */
  const makeUpdater = (key, current) => (v) => {
    const next = typeof v === "function" ? v(current) : v;
    updateURL({ [key]: next });
  };

  const setSelectedBrands         = makeUpdater("brands",      selectedBrands);
  const setSelectedSizes          = makeUpdater("sizes",       selectedSizes);
  const setSelectedProductTypes   = makeUpdater("types",       selectedProductTypes);
  const setSelectedWeights        = makeUpdater("weights",     selectedWeights);
  const setSelectedRamOptions     = makeUpdater("ram",         selectedRamOptions);
  const setSelectedPriceRanges    = makeUpdater("priceRanges", selectedPriceRanges);
  const setSelectedMinPrice       = makeUpdater("minPrice",    selectedMinPrice);
  const setSelectedMaxPrice       = makeUpdater("maxPrice",    selectedMaxPrice);
  const setSelectedColors         = makeUpdater("colors",      selectedColors);
  const setSelectedStockStatus    = makeUpdater("stock",       selectedStockStatus);
  const setSelectedSaleOnly       = makeUpdater("sale",        selectedSaleOnly);
  const setSelectedDiscountRanges = makeUpdater("discount",    selectedDiscountRanges);
  const setSelectedRatingBands    = makeUpdater("rating",      selectedRatingBands);

  /* ── Active filter count ── */
  const activeFiltersCount = useMemo(() => (
    selectedBrands.length + selectedSizes.length + selectedProductTypes.length +
    selectedPriceRanges.length + (selectedSaleOnly ? 1 : 0) +
    (selectedStockStatus !== "all" ? 1 : 0) + selectedDiscountRanges.length +
    selectedWeights.length + selectedRamOptions.length +
    selectedColors.length + selectedRatingBands.length +
    (selectedMinPrice !== null || selectedMaxPrice !== null ? 1 : 0)
  ), [
    selectedBrands, selectedSizes, selectedProductTypes, selectedPriceRanges,
    selectedSaleOnly, selectedStockStatus, selectedDiscountRanges,
    selectedWeights, selectedRamOptions, selectedColors, selectedRatingBands,
    selectedMinPrice, selectedMaxPrice,
  ]);

  /* ── Active filter pills ── */
  const filterPills = useMemo(() => {
    const pills = [];
    selectedBrands.forEach(b         => pills.push({ label: b,            clear: () => setSelectedBrands(p => p.filter(x => x !== b)) }));
    selectedSizes.forEach(s          => pills.push({ label: `Size: ${s}`, clear: () => setSelectedSizes(p => p.filter(x => x !== s)) }));
    selectedProductTypes.forEach(t   => pills.push({ label: t,            clear: () => setSelectedProductTypes(p => p.filter(x => x !== t)) }));
    selectedColors.forEach(c         => pills.push({ label: c,            clear: () => setSelectedColors(p => p.filter(x => x !== c)) }));
    selectedWeights.forEach(w        => pills.push({ label: w,            clear: () => setSelectedWeights(p => p.filter(x => x !== w)) }));
    selectedRamOptions.forEach(r     => pills.push({ label: `RAM: ${r}`,  clear: () => setSelectedRamOptions(p => p.filter(x => x !== r)) }));
    selectedPriceRanges.forEach(pr   => pills.push({ label: pr,           clear: () => setSelectedPriceRanges(p => p.filter(x => x !== pr)) }));
    selectedDiscountRanges.forEach(d => pills.push({ label: `${d}% off`,  clear: () => setSelectedDiscountRanges(p => p.filter(x => x !== d)) }));
    selectedRatingBands.forEach(rb   => pills.push({ label: `★ ${rb}+`,   clear: () => setSelectedRatingBands(p => p.filter(x => x !== rb)) }));
    if (selectedSaleOnly)              pills.push({ label: "On Sale",      clear: () => setSelectedSaleOnly(false) });
    if (selectedStockStatus !== "all") pills.push({ label: selectedStockStatus === "inStock" ? "In Stock" : "Out of Stock", clear: () => setSelectedStockStatus("all") });
    return pills;
  }, [
    selectedBrands, selectedSizes, selectedProductTypes, selectedColors,
    selectedWeights, selectedRamOptions, selectedPriceRanges, selectedDiscountRanges,
    selectedRatingBands, selectedSaleOnly, selectedStockStatus,
  ]);

  /* ── AI Insights ── */
  useEffect(() => {
    if (!searchQuery) {
      setProductsData({});
      setTotalPages(1);
      setTotalProducts(0);
      setAiInsights(null);
      return;
    }
    setAiInsights(productsData?.aiInsights || null);
  }, [productsData, searchQuery]);

  useEffect(() => { dispatch(setGlobalLoading(isLoading)); }, [isLoading, dispatch]);

  const paginatedProducts = productsData?.products || [];

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <div className="sp-root">
      <style>{CSS}</style>

      <section style={{ background: "#f8f8fb", minHeight: "100vh", padding: "0 0 56px" }}>
        <div className="container" style={{ display: "flex", gap: "18px", alignItems: "flex-start" }}>

          {/* ══ SIDEBAR ══ */}
          <div className={`sidebarWrapper fixed -bottom-[100%] left-0 w-full lg:h-full lg:static lg:w-[22%] bg-white z-[102] lg:z-[100] p-3 lg:p-0 transition-all lg:opacity-100 opacity-0 ${context?.openFilter === true ? "open" : ""}`}>
            <Sidebar
              productsData={productsData}
              setProductsData={setProductsData}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              setTotalPages={setTotalPages}
              setTotalProducts={setTotalProducts}

              page={page}

              selectedBrands={selectedBrands}                 setSelectedBrands={setSelectedBrands}
              selectedSizes={selectedSizes}                   setSelectedSizes={setSelectedSizes}
              selectedProductTypes={selectedProductTypes}     setSelectedProductTypes={setSelectedProductTypes}
              selectedSaleOnly={selectedSaleOnly}             setSelectedSaleOnly={setSelectedSaleOnly}
              selectedStockStatus={selectedStockStatus}       setSelectedStockStatus={setSelectedStockStatus}
              selectedDiscountRanges={selectedDiscountRanges} setSelectedDiscountRanges={setSelectedDiscountRanges}
              selectedWeights={selectedWeights}               setSelectedWeights={setSelectedWeights}
              selectedRamOptions={selectedRamOptions}         setSelectedRamOptions={setSelectedRamOptions}
              selectedPriceRanges={selectedPriceRanges}       setSelectedPriceRanges={setSelectedPriceRanges}
              selectedMinPrice={selectedMinPrice}             setSelectedMinPrice={setSelectedMinPrice}
              selectedMaxPrice={selectedMaxPrice}             setSelectedMaxPrice={setSelectedMaxPrice}
              selectedColors={selectedColors}                 setSelectedColors={setSelectedColors}
              selectedRatingBands={selectedRatingBands}       setSelectedRatingBands={setSelectedRatingBands}

              selectedSortType={selectedSortType}
              searchQuery={searchQuery}
              activeFiltersCount={activeFiltersCount}
              onResetAllFilters={handleResetAllFilters}
            />
          </div>

          {/* Mobile overlay */}
          {context?.windowWidth < 992 && (
            <div
              className={`filter_overlay w-full h-full bg-[rgba(0,0,0,0.5)] fixed top-0 left-0 z-[101] ${context?.openFilter === true ? "block" : "hidden"}`}
              onClick={() => context?.setOpenFilter(false)}
            />
          )}

          {/* ══ RIGHT CONTENT ══ */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: "20px" }}>

            {/* Search meta */}
            {searchQuery && !isLoading && (
              <div className="sp-meta">
                <h1 className="sp-query-label sp-display">
                  Results for&nbsp;
                  <span className="sp-query-keyword">"{searchQuery}"</span>
                </h1>
                {(totalProducts > 0 || paginatedProducts.length > 0) && (
                  <span className="sp-result-count">
                    <strong>{(totalProducts || paginatedProducts.length).toLocaleString("en-IN")}</strong> products found
                  </span>
                )}
              </div>
            )}

            {/* Scroll-aware toolbar */}
            <div
              className={`sp-toolbar ${scrollDir === "down" ? "sp-hide" : "sp-show"}`}
              style={{ marginTop: 12 }}
            >
              <div className="sp-toolbar-inner">

                {/* ── ROW 1: Filter btn · count · views · sort ── */}
                <div className={`sp-tb-row1${filterPills.length > 0 ? " has-pills" : ""}`}>

                  {/* LEFT: filter + count */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button className="sp-filter-btn" onClick={() => context?.setOpenFilter(true)}>
                      <MdTune size={16} />
                      Filters
                      {activeFiltersCount > 0 && <span className="sp-badge">{activeFiltersCount}</span>}
                    </button>

                    {!isLoading && totalProducts > 0 && (
                      <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500, whiteSpace: "nowrap" }} className="hidden sm:inline">
                        <strong style={{ color: "#0d0d12" }}>{totalProducts.toLocaleString("en-IN")}</strong> items
                      </span>
                    )}
                  </div>

                  {/* RIGHT: views + sort */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className={`sp-vbtn${itemView === "grid" ? " sp-vact" : ""}`} onClick={() => setItemView("grid")} title="Grid">
                        <HiViewGrid size={15} />
                      </button>
                      <button className={`sp-vbtn${itemView === "list" ? " sp-vact" : ""}`} onClick={() => setItemView("list")} title="List">
                        <HiViewList size={15} />
                      </button>
                    </div>

                    <button
                      id="sort-btn"
                      className={`sp-sort-btn${open ? " sp-sort-open" : ""}`}
                      onClick={e => setAnchorEl(e.currentTarget)}
                    >
                      <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }} className="hidden sm:inline">Sort:</span>
                      <span style={{ maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {sortLabel}
                      </span>
                      <MdKeyboardArrowDown className="sp-sort-icon" size={17} style={{ color: "#9ca3af" }} />
                    </button>

                    <Menu
                      id="sort-menu" anchorEl={anchorEl} open={open}
                      onClose={() => setAnchorEl(null)} className="sp-menu"
                      MenuListProps={{ "aria-labelledby": "sort-btn" }}
                      transformOrigin={{ horizontal: "right", vertical: "top" }}
                      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                    >
                      {SORT_OPTIONS.map(opt => (
                        <MenuItem
                          key={opt.value}
                          selected={selectedSortType === opt.value}
                          onClick={() => handleSortBy(opt.value)}
                        >
                          {opt.label}
                          {selectedSortType === opt.value && (
                            <span style={{ marginLeft: "auto", paddingLeft: 14 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                          )}
                        </MenuItem>
                      ))}
                    </Menu>
                  </div>
                </div>

                {/* ── ROW 2: Active filter pills (only when filters applied) ── */}
                {filterPills.length > 0 && (
                  <div className="sp-tb-row2">
                    <div className="sp-pills-wrap">
                      <div className="sp-pills">
                        <span className="sp-pills-meta">
                          {filterPills.length} filter{filterPills.length !== 1 ? "s" : ""}
                        </span>
                        {filterPills.map((pill, i) => (
                          <button
                            key={i}
                            className="sp-pill"
                            onClick={pill.clear}
                            style={{ animationDelay: `${i * 30}ms` }}
                          >
                            {pill.label} <MdClose size={10} />
                          </button>
                        ))}
                        <button className="sp-pill sp-pill-clear" onClick={handleResetAllFilters}>
                          Clear all <MdClose size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Spell correction */}
            {context?.searchData?.correctedQuery && (
              <div className="sp-correction">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Showing results for&nbsp;
                <strong>"{context.searchData.correctedQuery}"</strong>
              </div>
            )}

            {/* AI Insights */}
            {aiInsights?.summary && (
              <div className="sp-ai-card">
                <div className="sp-ai-label">
                  <span className="sp-ai-dot" />
                  {aiInsights?.title || "AI Search Assistant"}
                </div>
                <p className="sp-ai-summary">{aiInsights.summary}</p>
                {aiInsights?.highlights?.length > 0 && (
                  <ul className="sp-ai-highlights">
                    {aiInsights.highlights.map((point, i) => <li key={i}>{point}</li>)}
                  </ul>
                )}
              </div>
            )}

            {/* No query state */}
            {!searchQuery && !isLoading && (
              <div className="sp-no-query">
                <div className="sp-no-query-icon">🔍</div>
                <h2 className="sp-display" style={{ fontSize: 22, fontWeight: 800, color: "#0d0d12", marginBottom: 10 }}>
                  Search for Products
                </h2>
                <p style={{ fontSize: 14, color: "#9ca3af", maxWidth: 320, lineHeight: 1.65, margin: 0 }}>
                  Type a keyword in the search bar above to find products.
                </p>
              </div>
            )}

            {/* Product Grid / List */}
            {(isLoading || paginatedProducts.length > 0 || searchQuery) && (
              <div className={`sp-grid${itemView === "list" ? " sp-list" : ""}`}>
                {isLoading ? (
                  <ProductLoadingGrid view={itemView} />
                ) : paginatedProducts.length > 0 ? (
                  paginatedProducts.map((item, index) => (
                    <div key={item?._id || index} className="sp-item">
                      {itemView === "grid"
                        ? <ProductItem item={item} />
                        : <ProductItemListView item={item} />
                      }
                    </div>
                  ))
                ) : searchQuery ? (
                  <div className="sp-empty">
                    <div className="sp-empty-icon">😕</div>
                    <h3 className="sp-display" style={{ fontSize: 20, fontWeight: 700, color: "#0d0d12", marginBottom: 8 }}>
                      No Products Found
                    </h3>
                    <p style={{ fontSize: 14, color: "#9ca3af", maxWidth: 300, lineHeight: 1.65, margin: 0 }}>
                      No results for <strong style={{ color: "#0d0d12" }}>"{searchQuery}"</strong>.
                      Try different keywords or remove some filters.
                    </p>
                    {activeFiltersCount > 0 && (
                      <button className="sp-reset-btn" onClick={handleResetAllFilters}>
                        <MdClose size={13} /> Clear All Filters
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="sp-paging">
                <Pagination
                  showFirstButton showLastButton
                  count={totalPages} page={page}
                  shape="rounded"
                  onChange={(_, value) => {
                    dispatch(setGlobalLoading(true));
                    goToPage(value);
                  }}
                  sx={{
                    "& .MuiPaginationItem-root": {
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 600, fontSize: "13px",
                      borderRadius: "10px", transition: "all 0.18s ease",
                    },
                    "& .Mui-selected": {
                      background: "#0d0d12 !important",
                      color: "#fff !important",
                      boxShadow: "0 3px 10px rgba(13,13,18,0.2)",
                    },
                  }}
                />
                <span className="sp-page-label">Page {page} of {totalPages}</span>
              </div>
            )}

          </div>
        </div>
      </section>
    </div>
  );
};

export default SearchPage;