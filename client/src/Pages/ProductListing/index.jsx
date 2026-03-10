import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Sidebar } from "../../components/Sidebar";
import ProductItem from "../../components/ProductItem";
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

/* ══════════════════════════════════════════════════════════════════
   CSS — Design tokens, scroll-hide toolbar, animations
══════════════════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

  .pl-root * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
  .pl-display { font-family: 'Syne', sans-serif !important; }

  /* ── Animations ── */
  @keyframes pl-fadeUp {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes pl-fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes pl-badgePop {
    0%  { opacity:0; transform:scale(0.5); }
    70% { transform:scale(1.2); }
    100%{ opacity:1; transform:scale(1); }
  }
  @keyframes pl-shimmer {
    0%   { background-position:-600px 0; }
    100% { background-position: 600px 0; }
  }

  /* ══════════════════════════════════════════════════
     TOOLBAR WRAPPER — sticky, scroll-aware hide/show
  ══════════════════════════════════════════════════ */
  .pl-toolbar {
    position: sticky;
    top: 64px;
    z-index: 99;
    transition:
      transform  0.38s cubic-bezier(0.22, 0.61, 0.36, 1),
      opacity    0.28s ease,
      box-shadow 0.3s  ease;
    will-change: transform, opacity;
    margin-bottom: 4px;
  }
  .pl-toolbar.pl-tb-show {
    transform: translateY(0);
    opacity: 1;
    pointer-events: all;
  }
  .pl-toolbar.pl-tb-hide {
    transform: translateY(-120%);
    opacity: 0;
    pointer-events: none;
  }

  .pl-toolbar-inner {
    background: rgba(255,255,255,0.97);
    border: 1px solid #e8e8f0;
    border-radius: 16px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    overflow: hidden;
  }

  /* Row 1: filter + controls */
  .pl-tb-row1 {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 9px 14px;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s;
  }
  .pl-tb-row1.has-pills { border-bottom-color: #f1f2f6; }

  /* Row 2: pills */
  .pl-tb-row2 {
    padding: 8px 14px 10px;
    animation: pl-pillsIn 0.22s ease both;
  }
  @keyframes pl-pillsIn {
    from { opacity:0; transform:translateY(-5px); }
    to   { opacity:1; transform:translateY(0); }
  }

  /* ── Filter button ── */
  .pl-filter-btn {
    display: inline-flex; align-items: center; gap: 7px;
    height: 36px; padding: 0 14px;
    background: #0d0d12; color: #fff;
    border: none; border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 600;
    cursor: pointer; outline: none; flex-shrink: 0;
    transition: transform 0.17s ease, box-shadow 0.17s ease, background 0.17s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .pl-filter-btn:hover {
    background: #1d1d28;
    transform: translateY(-1px);
    box-shadow: 0 5px 16px rgba(13,13,18,0.2);
  }
  .pl-filter-btn:active { transform: scale(0.97); }

  /* red dot badge */
  .pl-badge {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 18px; height: 18px; padding: 0 5px;
    background: #E8362A; color: #fff;
    border-radius: 20px; font-size: 10px; font-weight: 800;
    line-height: 1;
    animation: pl-badgePop 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  /* ── Active filter pills row ── */
  .pl-pills-wrap { position: relative; }
  .pl-pills-wrap::after {
    content: '';
    position: absolute; right: 0; top: 0; bottom: 0; width: 40px;
    background: linear-gradient(to right, transparent, rgba(255,255,255,0.97));
    pointer-events: none;
  }
  .pl-pills {
    display: flex; align-items: center; gap: 6px;
    overflow-x: auto; flex-wrap: nowrap;
    scrollbar-width: none;
    padding-bottom: 2px;
    padding-right: 40px;
  }
  .pl-pills::-webkit-scrollbar { display: none; }

  .pl-pills-meta {
    font-size: 11px; color: #9ca3af; font-weight: 500;
    white-space: nowrap; flex-shrink: 0;
    padding-right: 8px;
    border-right: 1.5px solid #e8e8f0;
    margin-right: 2px;
  }

  .pl-pill {
    display: inline-flex; align-items: center; gap: 5px;
    height: 28px; padding: 0 11px;
    background: #f4f4f8; color: #374151;
    border: 1px solid #e4e4ec; border-radius: 20px;
    font-size: 11.5px; font-weight: 600; white-space: nowrap;
    cursor: pointer; outline: none; flex-shrink: 0;
    transition: all 0.15s ease;
    animation: pl-fadeIn 0.18s ease both;
  }
  .pl-pill:hover { background:#fff0f0; color:#E8362A; border-color:#fecdd3; }

  .pl-pill-clear {
    background: #fff0f0; color: #E8362A;
    border-color: #fecdd3; font-weight: 700;
  }
  .pl-pill-clear:hover { background: #E8362A; color: #fff; border-color: #E8362A; }

  /* ── Sort button ── */
  .pl-sort-btn {
    display: inline-flex; align-items: center; gap: 5px;
    height: 36px; padding: 0 12px;
    background: #f8f8fb; color: #0d0d12;
    border: 1.5px solid #e8e8f0; border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 600;
    cursor: pointer; outline: none; flex-shrink: 0; white-space: nowrap;
    transition: all 0.17s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .pl-sort-btn:hover { background:#fff; border-color:#0d0d12; box-shadow:0 3px 10px rgba(0,0,0,0.07); }
  .pl-sort-icon { transition: transform 0.22s ease; }
  .pl-sort-btn.pl-sort-open .pl-sort-icon { transform: rotate(180deg); }

  /* ── View toggles ── */
  .pl-vbtn {
    width: 36px; height: 36px; border-radius: 10px;
    display: inline-flex; align-items: center; justify-content: center;
    background: transparent; border: 1.5px solid #e8e8f0;
    color: #9ca3af; cursor: pointer; outline: none;
    transition: all 0.17s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .pl-vbtn:hover   { background:#f8f8fb; color:#0d0d12; }
  .pl-vbtn.pl-vact { background:#0d0d12; color:#fff; border-color:#0d0d12; }

  /* ── MUI Menu overrides ── */
  .pl-menu .MuiPaper-root {
    border-radius: 14px !important;
    border: 1px solid #e8e8f0 !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1) !important;
    min-width: 210px !important;
    margin-top: 6px !important;
  }
  .pl-menu .MuiMenuItem-root {
    font-family: 'DM Sans', sans-serif !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    padding: 10px 16px !important;
    transition: background 0.14s ease !important;
  }
  .pl-menu .MuiMenuItem-root.Mui-selected {
    background: #f8f8fb !important;
    font-weight: 700 !important;
  }
  .pl-menu .MuiMenuItem-root:hover { background: #f8f8fb !important; }

  /* ── Product grid ── */
  .pl-grid {
    display: grid; gap: 16px;
    grid-template-columns: repeat(5, 1fr);
  }
  .pl-grid.pl-list { grid-template-columns: 1fr; }
  @media (max-width:1280px){ .pl-grid { grid-template-columns: repeat(4,1fr); } }
  @media (max-width:900px) { .pl-grid { grid-template-columns: repeat(3,1fr); } }
  @media (max-width:640px) { .pl-grid { grid-template-columns: repeat(2,1fr); } }

  /* staggered fade-in for products */
  .pl-item { animation: pl-fadeUp 0.38s cubic-bezier(0.22,0.61,0.36,1) both; }
  .pl-item:nth-child(1){animation-delay:.02s} .pl-item:nth-child(2){animation-delay:.05s}
  .pl-item:nth-child(3){animation-delay:.08s} .pl-item:nth-child(4){animation-delay:.11s}
  .pl-item:nth-child(5){animation-delay:.14s} .pl-item:nth-child(6){animation-delay:.17s}
  .pl-item:nth-child(7){animation-delay:.20s} .pl-item:nth-child(8){animation-delay:.23s}
  .pl-item:nth-child(9){animation-delay:.26s} .pl-item:nth-child(10){animation-delay:.29s}

  /* ── Empty state ── */
  .pl-empty {
    grid-column: 1/-1;
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 80px 24px; text-align: center;
    animation: pl-fadeUp 0.4s ease both;
  }
  .pl-empty-icon {
    width: 76px; height: 76px; border-radius: 20px;
    background: #f8f8fb; border: 1.5px solid #e8e8f0;
    display: flex; align-items: center; justify-content: center;
    font-size: 34px; margin-bottom: 20px;
  }
  .pl-reset-btn {
    display: inline-flex; align-items: center; gap: 6px;
    margin-top: 18px; height: 40px; padding: 0 22px;
    background: #0d0d12; color: #fff;
    border: none; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; outline: none;
    transition: transform 0.17s ease, box-shadow 0.17s ease;
  }
  .pl-reset-btn:hover { transform:translateY(-1px); box-shadow:0 5px 16px rgba(13,13,18,0.2); }

  /* ── Pagination ── */
  .pl-paging { margin-top:40px; padding-top:24px; border-top:1px solid #e8e8f0; display:flex; justify-content:center; }
`;

/* ══════════════════════════════════════════════════════════════════
   SORT OPTIONS (no category heading needed — removed per request)
══════════════════════════════════════════════════════════════════ */
const SORT_OPTIONS = [
  { value: "bestseller", label: "🏆 Best Seller"        },
  { value: "latest",     label: "🆕 Latest"             },
  { value: "popular",    label: "⭐ Most Popular"        },
  { value: "featured",   label: "🎖️ Featured"           },
  { value: "priceAsc",   label: "💰 Price: Low → High"  },
  { value: "priceDesc",  label: "💰 Price: High → Low"  },
  { value: "nameAsc",    label: "🔤 Name: A → Z"        },
  { value: "nameDesc",   label: "🔤 Name: Z → A"        },
];

/* ══════════════════════════════════════════════════════════════════
   HOOK — scroll direction
   threshold: don't hide until user scrolled past N px from top
══════════════════════════════════════════════════════════════════ */
function useScrollDir(threshold = 90) {
  const [dir, setDir] = useState("up"); // "up" | "down"
  const lastY = useRef(typeof window !== "undefined" ? window.scrollY : 0);

  useEffect(() => {
    const handler = () => {
      const y = window.scrollY;
      const diff = y - lastY.current;
      if (Math.abs(diff) < 5) return; // dead-zone to avoid flicker
      if (y <= threshold) {
        setDir("up");
      } else {
        setDir(diff > 0 ? "down" : "up");
      }
      lastY.current = y;
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);

  return dir;
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const ProductListing = () => {
  const [anchorEl,               setAnchorEl]               = useState(null);
  const [productsData,           setProductsData]           = useState([]);
  const [isLoading,              setIsLoading]              = useState(false);
  const [totalPages,             setTotalPages]             = useState(1);
  const [selectedSortVal,        setSelectedSortVal]        = useState("🏆 Best Seller");
  const [selectedSortType,       setSelectedSortType]       = useState("bestseller");
  const [selectedBrands,         setSelectedBrands]         = useState([]);
  const [selectedSizes,          setSelectedSizes]          = useState([]);
  const [selectedProductTypes,   setSelectedProductTypes]   = useState([]);
  const [selectedPriceRanges,    setSelectedPriceRanges]    = useState([]);
  const [selectedSaleOnly,       setSelectedSaleOnly]       = useState(false);
  const [selectedStockStatus,    setSelectedStockStatus]    = useState("all");
  const [selectedDiscountRanges, setSelectedDiscountRanges] = useState([]);
  const [selectedWeights,        setSelectedWeights]        = useState([]);
  const [selectedRamOptions,     setSelectedRamOptions]     = useState([]);
  const [selectedColors,         setSelectedColors]         = useState([]);
  const [selectedRatingBands,    setSelectedRatingBands]    = useState([]);
  const [viewMode,               setViewMode]               = useState("grid");

  const context   = useAppContext();
  const dispatch  = useDispatch();
  const location  = useLocation();
  const navigate  = useNavigate();
  const scrollDir = useScrollDir(90);
  const open      = Boolean(anchorEl);

  /* page from URL */
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const page = useMemo(() => {
    const p = Number(queryParams.get("page") || 1);
    return Number.isNaN(p) || p < 1 ? 1 : p;
  }, [queryParams]);

  /* active filter count */
  const activeFiltersCount = useMemo(() => (
    selectedBrands.length + selectedSizes.length + selectedProductTypes.length +
    selectedPriceRanges.length + (selectedSaleOnly ? 1 : 0) +
    (selectedStockStatus !== "all" ? 1 : 0) + selectedDiscountRanges.length +
    selectedWeights.length + selectedRamOptions.length +
    selectedColors.length + selectedRatingBands.length
  ), [
    selectedBrands, selectedSizes, selectedProductTypes, selectedPriceRanges,
    selectedSaleOnly, selectedStockStatus, selectedDiscountRanges,
    selectedWeights, selectedRamOptions, selectedColors, selectedRatingBands,
  ]);

  /* URL updater */
  const updateUrl = useCallback((overrides = {}) => {
    const params = new URLSearchParams(location.search);
    const B  = overrides.brands      ?? selectedBrands;
    const Si = overrides.sizes       ?? selectedSizes;
    const T  = overrides.types       ?? selectedProductTypes;
    const W  = overrides.weights     ?? selectedWeights;
    const R  = overrides.ram         ?? selectedRamOptions;
    const P  = overrides.priceRanges ?? selectedPriceRanges;
    const C  = overrides.colors      ?? selectedColors;
    const St = overrides.stock       ?? selectedStockStatus;
    const Sa = overrides.sale        ?? selectedSaleOnly;
    const D  = overrides.discount    ?? selectedDiscountRanges;
    const Ra = overrides.rating      ?? selectedRatingBands;

    params.set("page", String(overrides.page ?? 1));
    B.length   ? params.set("brands",      B.join(","))  : params.delete("brands");
    Si.length  ? params.set("sizes",       Si.join(",")) : params.delete("sizes");
    T.length   ? params.set("types",       T.join(","))  : params.delete("types");
    W.length   ? params.set("weights",     W.join(","))  : params.delete("weights");
    R.length   ? params.set("ram",         R.join(","))  : params.delete("ram");
    P.length   ? params.set("priceRanges", P.join(","))  : params.delete("priceRanges");
    C.length   ? params.set("colors",      C.join(","))  : params.delete("colors");
    St !== "all" ? params.set("stock",     St)           : params.delete("stock");
    Sa           ? params.set("sale",      "1")          : params.delete("sale");
    D.length   ? params.set("discount",    D.join(","))  : params.delete("discount");
    Ra.length  ? params.set("rating",      Ra.join(",")) : params.delete("rating");

    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [
    location, navigate,
    selectedBrands, selectedSizes, selectedProductTypes, selectedWeights,
    selectedRamOptions, selectedPriceRanges, selectedColors, selectedStockStatus,
    selectedSaleOnly, selectedDiscountRanges, selectedRatingBands,
  ]);

  useEffect(() => { updateUrl({ page: 1 }); }, [
    selectedBrands, selectedSizes, selectedProductTypes, selectedWeights,
    selectedRamOptions, selectedPriceRanges, selectedColors, selectedStockStatus,
    selectedSaleOnly, selectedDiscountRanges, selectedRatingBands,
  ]);

  const handlePageChange = useCallback((_, v) => {
    dispatch(setGlobalLoading(true));
    window.scrollTo({ top: 0, behavior: "smooth" });
    updateUrl({ page: v });
  }, [updateUrl, dispatch]);

  const handleSortBy = useCallback((sortType, label) => {
    setSelectedSortType(sortType); setSelectedSortVal(label); setAnchorEl(null);
    const p = new URLSearchParams(location.search); p.set("page","1");
    navigate(`${location.pathname}?${p.toString()}`, { replace: true });
  }, [location, navigate]);

  const resetAllFilters = useCallback(() => {
    setSelectedBrands([]); setSelectedSizes([]); setSelectedProductTypes([]);
    setSelectedPriceRanges([]); setSelectedSaleOnly(false); setSelectedStockStatus("all");
    setSelectedDiscountRanges([]); setSelectedWeights([]); setSelectedRamOptions([]);
    setSelectedColors([]); setSelectedRatingBands([]);
  }, []);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  useEffect(() => { dispatch(setGlobalLoading(isLoading)); }, [isLoading, dispatch]);

  const filteredProducts = productsData?.products || [];

  /* active pills */
  const filterPills = useMemo(() => {
    const pills = [];
    selectedBrands.forEach(b         => pills.push({ label: b,           clear: () => setSelectedBrands(p => p.filter(x=>x!==b)) }));
    selectedSizes.forEach(s          => pills.push({ label: `Size: ${s}`,clear: () => setSelectedSizes(p  => p.filter(x=>x!==s)) }));
    selectedProductTypes.forEach(t   => pills.push({ label: t,           clear: () => setSelectedProductTypes(p => p.filter(x=>x!==t)) }));
    selectedColors.forEach(c         => pills.push({ label: c,           clear: () => setSelectedColors(p => p.filter(x=>x!==c)) }));
    selectedWeights.forEach(w        => pills.push({ label: w,           clear: () => setSelectedWeights(p => p.filter(x=>x!==w)) }));
    selectedRamOptions.forEach(r     => pills.push({ label:`RAM: ${r}`,  clear: () => setSelectedRamOptions(p => p.filter(x=>x!==r)) }));
    selectedPriceRanges.forEach(pr   => pills.push({ label: pr,          clear: () => setSelectedPriceRanges(p => p.filter(x=>x!==pr)) }));
    selectedDiscountRanges.forEach(d => pills.push({ label: d,           clear: () => setSelectedDiscountRanges(p => p.filter(x=>x!==d)) }));
    selectedRatingBands.forEach(rb   => pills.push({ label: `★ ${rb}`,  clear: () => setSelectedRatingBands(p => p.filter(x=>x!==rb)) }));
    if (selectedSaleOnly)            pills.push({ label:"On Sale",        clear: () => setSelectedSaleOnly(false) });
    if (selectedStockStatus !== "all") pills.push({ label: selectedStockStatus==="in"?"In Stock":"Out of Stock", clear: () => setSelectedStockStatus("all") });
    return pills;
  }, [
    selectedBrands, selectedSizes, selectedProductTypes, selectedColors,
    selectedWeights, selectedRamOptions, selectedPriceRanges, selectedDiscountRanges,
    selectedRatingBands, selectedSaleOnly, selectedStockStatus,
  ]);

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="pl-root">
      <style>{CSS}</style>

      <section style={{ background: "#f8f8fb", minHeight: "100vh", padding: "0 0 56px" }}>
        <div className="container" style={{ display: "flex", gap: "18px", alignItems: "flex-start" }}>

          {/* ══ SIDEBAR ══ */}
          <div className={`sidebarWrapper fixed -bottom-[100%] left-0 w-full lg:h-full lg:static lg:w-[22%] bg-white z-[102] lg:z-[100] p-3 lg:p-0 transition-all lg:opacity-100 opacity-0 ${context?.openFilter === true ? "open" : ""}`}>
            <Sidebar
              productsData={productsData}      setProductsData={setProductsData}
              isLoading={isLoading}            setIsLoading={setIsLoading}
              page={page}                      setTotalPages={setTotalPages}
              selectedBrands={selectedBrands}  setSelectedBrands={setSelectedBrands}
              selectedSizes={selectedSizes}    setSelectedSizes={setSelectedSizes}
              selectedProductTypes={selectedProductTypes} setSelectedProductTypes={setSelectedProductTypes}
              selectedPriceRanges={selectedPriceRanges}   setSelectedPriceRanges={setSelectedPriceRanges}
              selectedSaleOnly={selectedSaleOnly}         setSelectedSaleOnly={setSelectedSaleOnly}
              selectedStockStatus={selectedStockStatus}   setSelectedStockStatus={setSelectedStockStatus}
              selectedDiscountRanges={selectedDiscountRanges} setSelectedDiscountRanges={setSelectedDiscountRanges}
              selectedWeights={selectedWeights}   setSelectedWeights={setSelectedWeights}
              selectedRamOptions={selectedRamOptions} setSelectedRamOptions={setSelectedRamOptions}
              selectedColors={selectedColors}     setSelectedColors={setSelectedColors}
              selectedRatingBands={selectedRatingBands} setSelectedRatingBands={setSelectedRatingBands}
              selectedSortType={selectedSortType}
              activeFiltersCount={activeFiltersCount}
              onResetAllFilters={resetAllFilters}
            />
          </div>

          {/* mobile overlay */}
          {context?.windowWidth && context.windowWidth < 992 && (
            <div
              className={`filter_overlay w-full h-full bg-[rgba(0,0,0,0.5)] fixed top-0 left-0 z-[101] ${context?.openFilter === true ? "block" : "hidden"}`}
              onClick={() => context?.setOpenFilter(false)}
            />
          )}

          {/* ══ RIGHT CONTENT ══ */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: "20px" }}>

            {/* ══════════════════════════════════════════════════════
                SCROLL-AWARE TOOLBAR
                - scrollDir "down" → hide (slide up out of view)
                - scrollDir "up"   → show (slide back in)
            ══════════════════════════════════════════════════════ */}
            <div className={`pl-toolbar ${scrollDir === "down" ? "pl-tb-hide" : "pl-tb-show"}`}>
              <div className="pl-toolbar-inner">

                {/* ── ROW 1: Filter btn · count · views · sort ── */}
                <div className={`pl-tb-row1${filterPills.length > 0 ? " has-pills" : ""}`}>

                  {/* LEFT */}
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <button className="pl-filter-btn" onClick={() => context?.setOpenFilter(true)}>
                      <MdTune size={16} />
                      Filters
                      {activeFiltersCount > 0 && (
                        <span className="pl-badge">{activeFiltersCount}</span>
                      )}
                    </button>

                    {!isLoading && filteredProducts.length > 0 && (
                      <span style={{ fontSize:12, color:"#9ca3af", fontWeight:500, whiteSpace:"nowrap" }}
                        className="hidden sm:inline">
                        <strong style={{ color:"#0d0d12" }}>{filteredProducts.length}</strong> items
                      </span>
                    )}
                  </div>

                  {/* RIGHT: view toggles + sort */}
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                    <div style={{ display:"flex", gap:4 }}>
                      <button className={`pl-vbtn${viewMode==="grid"?" pl-vact":""}`}
                        onClick={() => setViewMode("grid")} title="Grid view">
                        <HiViewGrid size={15} />
                      </button>
                      <button className={`pl-vbtn${viewMode==="list"?" pl-vact":""}`}
                        onClick={() => setViewMode("list")} title="List view">
                        <HiViewList size={15} />
                      </button>
                    </div>

                    <button
                      id="sort-btn"
                      className={`pl-sort-btn${open?" pl-sort-open":""}`}
                      onClick={e => setAnchorEl(e.currentTarget)}
                    >
                      <span style={{ fontSize:11, color:"#9ca3af", fontWeight:500 }} className="hidden sm:inline">Sort:</span>
                      <span style={{ maxWidth:110, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {selectedSortVal}
                      </span>
                      <MdKeyboardArrowDown className="pl-sort-icon" size={17} style={{ color:"#9ca3af" }} />
                    </button>

                    <Menu
                      id="sort-menu"
                      anchorEl={anchorEl}
                      open={open}
                      onClose={() => setAnchorEl(null)}
                      className="pl-menu"
                      MenuListProps={{ "aria-labelledby": "sort-btn" }}
                      transformOrigin={{ horizontal:"right", vertical:"top" }}
                      anchorOrigin={{ horizontal:"right", vertical:"bottom" }}
                    >
                      {SORT_OPTIONS.map(opt => (
                        <MenuItem
                          key={opt.value}
                          selected={selectedSortType === opt.value}
                          onClick={() => handleSortBy(opt.value, opt.label)}
                        >
                          {opt.label}
                          {selectedSortType === opt.value && (
                            <span style={{ marginLeft:"auto", paddingLeft:14 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12"/>
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
                  <div className="pl-tb-row2">
                    <div className="pl-pills-wrap">
                      <div className="pl-pills">
                        <span className="pl-pills-meta">
                          {filterPills.length} filter{filterPills.length !== 1 ? "s" : ""}
                        </span>
                        {filterPills.map((pill, i) => (
                          <button
                            key={i}
                            className="pl-pill"
                            onClick={pill.clear}
                            style={{ animationDelay: `${i * 30}ms` }}
                          >
                            {pill.label}
                            <MdClose size={10} />
                          </button>
                        ))}
                        <button className="pl-pill pl-pill-clear" onClick={resetAllFilters}>
                          Clear all <MdClose size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* ══ Product Grid ══ */}
            <div
              style={{ marginTop: 14 }}
              className={`pl-grid${viewMode === "list" ? " pl-list" : ""}`}
            >
              {isLoading ? (
                <ProductLoadingGrid view={viewMode} />
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((item, index) => (
                  <div key={item?._id || item?.id || index} className="pl-item">
                    <ProductItem item={item} />
                  </div>
                ))
              ) : (
                <div className="pl-empty">
                  <div className="pl-empty-icon">🔍</div>
                  <h3 className="pl-display" style={{ fontSize:20, fontWeight:700, color:"#0d0d12", marginBottom:8 }}>
                    No Products Found
                  </h3>
                  <p style={{ fontSize:14, color:"#9ca3af", maxWidth:300, lineHeight:1.65, margin:0 }}>
                    Try different keywords or remove some filters to see more results.
                  </p>
                  {activeFiltersCount > 0 && (
                    <button className="pl-reset-btn" onClick={resetAllFilters}>
                      <MdClose size={13} /> Clear All Filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ══ Pagination ══ */}
            {totalPages > 1 && (
              <div className="pl-paging">
                <Pagination
                  showFirstButton showLastButton
                  count={totalPages} page={page}
                  onChange={handlePageChange}
                  shape="rounded"
                  sx={{
                    "& .MuiPaginationItem-root": {
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 600, fontSize: "13px",
                      borderRadius: "10px",
                      transition: "all 0.18s ease",
                    },
                    "& .Mui-selected": {
                      background: "#0d0d12 !important",
                      color: "#fff !important",
                      boxShadow: "0 3px 10px rgba(13,13,18,0.2)",
                    },
                  }}
                />
              </div>
            )}

          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductListing;