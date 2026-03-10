import React, { useState, useEffect, useRef, useCallback } from "react";
import Drawer from "@mui/material/Drawer";
import { IoCloseSharp } from "react-icons/io5";
import { FiChevronRight, FiChevronDown, FiSearch, FiX, FiGrid, FiPackage } from "react-icons/fi";
import { useAppContext } from "../../../hooks/useAppContext";
import { Link, useNavigate } from "react-router-dom";

/* ═══════════════════════════════════════════════════════════
   URL BUILDER
   Generates: /products/category/<slug>?catId=<id>&catName=<n>&level=<main|sub|subsub>
   Fallback:  /products?category=<id>&catName=<n>&level=<...>
════════════════════════════════════════════════════════════ */
function buildProductUrl(item, level = "main", parentId = null, grandParentId = null) {
  const id = item?._id || item?.id || "";

  const params = new URLSearchParams();
  if (!id) return "/products";

  params.set("catName", item?.name || "");
  params.set("level", level);

  if (level === "main") {
    params.set("catId", id);
  } else if (level === "sub") {
    params.set("subCatId", id);
    if (parentId) params.set("catId", parentId);
  } else {
    params.set("thirdLavelCatId", id);
    if (parentId) params.set("subCatId", parentId);
    if (grandParentId) params.set("catId", grandParentId);
  }
  return `/products?${params.toString()}`;
}

/* ═══════════════════════════════════════════════════════════
   GLOBAL CSS INJECTION
════════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Syne:wght@700;800&display=swap');

  .cpanel-scroll::-webkit-scrollbar { width: 3px; }
  .cpanel-scroll::-webkit-scrollbar-track { background: transparent; }
  .cpanel-scroll::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); border-radius: 10px; }

  @keyframes cpSlideIn  { from { opacity:0; transform:translateX(-16px); } to { opacity:1; transform:translateX(0); } }
  @keyframes cpFadeUp   { from { opacity:0; transform:translateY(7px);   } to { opacity:1; transform:translateY(0); } }
  @keyframes cpSubSlide { from { opacity:0; transform:translateX(-8px);  } to { opacity:1; transform:translateX(0); } }
  @keyframes cpPulse    { 0%,100%{transform:scale(1);opacity:.7;} 50%{transform:scale(1.55);opacity:1;} }
  @keyframes cpShimmer  { 0%{background-position:-400px 0;} 100%{background-position:400px 0;} }
  @keyframes cpRipple   { 0%{transform:scale(0);opacity:.45;} 100%{transform:scale(3);opacity:0;} }
  @keyframes cpFlash    { 0%{background:rgba(99,102,241,0.18);} 100%{background:transparent;} }

  /* ── top-level row ── */
  .cp-cat-row { animation: cpFadeUp 0.26s ease both; position:relative; overflow:hidden; }
  .cp-cat-inner { border-radius:10px; margin:0 8px; transition:background 0.2s; cursor:pointer; }
  .cp-cat-inner:hover { background: rgba(99,102,241,0.07) !important; }
  .cp-cat-inner:hover .cp-cat-label { color:#818cf8 !important; }
  .cp-cat-inner:hover .cp-cat-iconbox { background:rgba(99,102,241,0.18)!important; border-color:rgba(99,102,241,0.4)!important; }
  .cp-cat-inner:hover .cp-cat-chevron { color:#818cf8 !important; }
  .cp-cat-inner:active { animation: cpFlash 0.3s ease forwards; }
  .cp-cat-inner.is-expanded { background: rgba(99,102,241,0.07) !important; }
  .cp-cat-inner.is-expanded .cp-cat-label { color:#a5b4fc !important; font-weight:600 !important; }
  .cp-cat-inner.is-expanded .cp-cat-iconbox { background:rgba(99,102,241,0.2)!important; border-color:rgba(165,180,252,0.45)!important; }

  /* ── sub row ── */
  .cp-sub-row { border-radius:8px; margin:1px 8px; transition:background 0.18s; cursor:pointer; }
  .cp-sub-row:hover { background: rgba(99,102,241,0.08) !important; }
  .cp-sub-row:hover .cp-sub-label { color:#a5b4fc !important; }
  .cp-sub-row:active { background: rgba(99,102,241,0.16) !important; }

  /* ── sub-sub row ── */
  .cp-subsub-row { border-radius:7px; margin:1px 8px; transition:background 0.18s; }
  .cp-subsub-row:hover { background: rgba(165,180,252,0.07) !important; }
  .cp-subsub-row:hover .cp-subsub-label { color:#c7d2fe !important; }
  .cp-subsub-row:active { background: rgba(99,102,241,0.13) !important; }

  /* ── search ── */
  .cp-search:focus {
    border-color: rgba(99,102,241,0.55) !important;
    background: rgba(99,102,241,0.06) !important;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important;
  }

  /* ── close btn ── */
  .cp-close:hover { background:rgba(99,102,241,0.15)!important; border-color:rgba(99,102,241,0.45)!important; color:#a5b4fc!important; }

  /* ── ripple ── */
  .cp-ripple { position:absolute; border-radius:50%; background:rgba(99,102,241,0.22); pointer-events:none; animation:cpRipple 0.5s ease-out forwards; transform-origin:center; }

  /* ── skeleton ── */
  .cp-skel { background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 75%); background-size:400px 100%; animation:cpShimmer 1.4s infinite linear; border-radius:6px; }

  /* ── search result row ── */
  .cp-result-row { border-radius:9px; margin:2px 8px; transition:background 0.18s; }
  .cp-result-row:hover { background:rgba(99,102,241,0.08)!important; }
  .cp-result-row:hover .cp-result-label { color:#a5b4fc !important; }
  .cp-result-row:active { background:rgba(99,102,241,0.16)!important; }

  .cp-viewall:hover { color:#a5b4fc !important; }

  /* ── auth button ── */
  .cp-auth-btn {
    position: relative; overflow: hidden;
    transition: all 0.2s ease;
  }
  .cp-auth-btn::before {
    content:''; position:absolute; inset:0;
    background: rgba(255,255,255,0.04);
    opacity:0; transition: opacity 0.2s;
    border-radius: inherit;
  }
  .cp-auth-btn:hover::before { opacity:1; }
  .cp-auth-btn.logout:hover { border-color: rgba(239,68,68,0.5) !important; color: #fca5a5 !important; box-shadow: 0 0 14px rgba(239,68,68,0.15) !important; }
  .cp-auth-btn.login:hover  { border-color: rgba(99,102,241,0.7) !important; color: #a5b4fc !important; box-shadow: 0 0 14px rgba(99,102,241,0.2) !important; background: rgba(99,102,241,0.08) !important; }

  @keyframes cpAuthIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .cp-auth-section { animation: cpAuthIn 0.3s ease 0.15s both; }
`;

function injectStyles(id, css) {
  if (typeof document !== "undefined" && !document.getElementById(id)) {
    const el = document.createElement("style");
    el.id = id; el.textContent = css;
    document.head.appendChild(el);
  }
}

/* ═══════════════════════════════════════════
   RIPPLE HOOK
════════════════════════════════════════════ */
function useRipple(ref) {
  const trigger = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const circle = document.createElement("span");
    circle.className = "cp-ripple";
    circle.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
    el.appendChild(circle);
    setTimeout(() => circle.remove(), 520);
  }, [ref]);
  return trigger;
}

/* ═══════════════════════════════════════════
   FLATTEN CATEGORIES for search
   Recursively walks ALL levels so every
   sub / sub-sub category appears in results.
════════════════════════════════════════════ */
function flattenCategories(
  cats,
  result = [],
  depth = 0,
  parent = null,   // parent display name
  parentId = null,   // parent _id
  grandParentId = null   // grandparent _id
) {
  if (!Array.isArray(cats)) return result;
  cats.forEach((cat) => {
    const id = cat?._id || cat?.id || "";
    result.push({
      ...cat,
      _depth: depth,
      _parent: parent,
      _parentId: parentId,
      _grandParentId: grandParentId,
    });
    if (cat.children?.length) {
      flattenCategories(
        cat.children,
        result,
        depth + 1,
        cat.name,          // this cat becomes the parent name
        id,                // this cat's id becomes parentId
        parentId           // previous parentId becomes grandParentId
      );
    }
  });
  return result;
}

function highlight(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "rgba(99,102,241,0.28)", color: "#c7d2fe", borderRadius: 3, padding: "0 2px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

/* ═══════════════════════════════════════════
   SUB-SUB CATEGORY ROW
════════════════════════════════════════════ */
const SubSubRow = ({ item, parentId, grandParentId, onNavigate, delay = 0 }) => {
  const rowRef = useRef(null);
  const triggerRipple = useRipple(rowRef);
  const url = buildProductUrl(item, "subsub", parentId, grandParentId);

  return (
    <Link
      ref={rowRef}
      to={url}
      onClick={(e) => { triggerRipple(e); onNavigate(); }}
      className="cp-subsub-row"
      style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "7px 14px 7px 56px",
        textDecoration: "none",
        animation: `cpSubSlide 0.2s ease ${delay}ms both`,
        position: "relative", overflow: "hidden",
      }}
    >
      <span style={{
        width: 5, height: 5, borderRadius: "50%",
        border: "1.5px solid rgba(148,163,184,0.3)",
        flexShrink: 0,
      }} />
      <span className="cp-subsub-label" style={{
        fontSize: 12, color: "#5a6a85",
        fontFamily: "'DM Sans',sans-serif",
        transition: "color 0.18s",
        flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {item?.name}
      </span>
      <FiChevronRight size={10} style={{ color: "#2d3748", flexShrink: 0 }} />
    </Link>
  );
};

/* ═══════════════════════════════════════════
   SUB CATEGORY ROW
════════════════════════════════════════════ */
const SubRow = ({ item, parentId, onNavigate, delay = 0 }) => {
  const [open, setOpen] = useState(false);
  const rowRef = useRef(null);
  const triggerRipple = useRipple(rowRef);
  const hasSubs = item?.children?.length > 0;
  const url = buildProductUrl(item, "sub", parentId);

  const handleClick = (e) => {
    triggerRipple(e);
    if (hasSubs) {
      setOpen((p) => !p);
    } else {
      onNavigate();
    }
  };

  return (
    <div style={{ animation: `cpSubSlide 0.22s ease ${delay}ms both` }}>
      {hasSubs ? (
        /* Has children → toggle expand; label navigates */
        <div
          ref={rowRef}
          className="cp-sub-row"
          style={{
            display: "flex", alignItems: "center",
            padding: "8px 13px 8px 46px",
            position: "relative", overflow: "hidden",
          }}
        >
          {/* Dot indicator */}
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: open ? "rgba(99,102,241,0.65)" : "rgba(255,255,255,0.1)",
            flexShrink: 0, transition: "background 0.18s",
          }} />

          {/* Clickable name → products */}
          <Link
            to={url}
            onClick={(e) => { e.stopPropagation(); triggerRipple(e); onNavigate(); }}
            className="cp-sub-label"
            style={{
              flex: 1, fontSize: 13, color: "#8392a8",
              fontFamily: "'DM Sans',sans-serif",
              transition: "color 0.18s",
              textDecoration: "none",
              marginLeft: 8,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {item?.name}
          </Link>

          {/* Toggle chevron */}
          <FiChevronDown
            size={12}
            onClick={() => setOpen((p) => !p)}
            style={{
              color: "#334155", flexShrink: 0,
              transition: "transform 0.22s",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              cursor: "pointer", padding: "2px",
            }}
          />
        </div>
      ) : (
        /* No children → full row is a link */
        <Link
          ref={rowRef}
          to={url}
          onClick={(e) => { triggerRipple(e); onNavigate(); }}
          className="cp-sub-row"
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 13px 8px 46px",
            textDecoration: "none",
            position: "relative", overflow: "hidden",
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "rgba(255,255,255,0.1)", flexShrink: 0,
          }} />
          <span className="cp-sub-label" style={{
            flex: 1, fontSize: 13, color: "#8392a8",
            fontFamily: "'DM Sans',sans-serif",
            transition: "color 0.18s",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {item?.name}
          </span>
          <FiChevronRight size={11} style={{ color: "#2d3748", flexShrink: 0 }} />
        </Link>
      )}

      {/* Sub-sub-categories */}
      {hasSubs && open && (
        <div style={{ borderLeft: "1px solid rgba(99,102,241,0.1)", marginLeft: 52 }}>
          {item.children.map((ssub, i) => (
            <SubSubRow
              key={ssub?._id || i}
              item={ssub}
              parentId={item?._id || item?.id}
              grandParentId={parentId}
              onNavigate={onNavigate}
              delay={i * 25}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   CATEGORY ROW (top-level)
════════════════════════════════════════════ */
const CategoryRow = ({ item, index, onNavigate }) => {
  const [expanded, setExpanded] = useState(false);
  const innerRef = useRef(null);
  const triggerRipple = useRipple(innerRef);
  const hasSubs = item?.children?.length > 0;
  const url = buildProductUrl(item, "main");

  const handleRowClick = (e) => {
    triggerRipple(e);
    if (hasSubs) {
      setExpanded((p) => !p);
    } else {
      onNavigate();
    }
  };

  return (
    <div
      className="cp-cat-row"
      style={{ animationDelay: `${index * 38}ms`, marginBottom: 1 }}
    >
      <div
        ref={innerRef}
        className={`cp-cat-inner ${expanded ? "is-expanded" : ""}`}
        style={{
          display: "flex", alignItems: "center", gap: 11,
          padding: "9px 12px",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Accent bar */}
        {expanded && (
          <span style={{
            position: "absolute", left: 0, top: "50%",
            transform: "translateY(-50%)",
            width: 3, height: "58%",
            background: "linear-gradient(180deg, #6366f1, #818cf8)",
            borderRadius: "0 3px 3px 0",
          }} />
        )}

        {/* Icon box */}
        <div
          className="cp-cat-iconbox"
          style={{
            width: 34, height: 34, borderRadius: 9,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, flexShrink: 0,
            transition: "all 0.22s",
          }}
        >
          {item?.icon ? <span>{item.icon}</span> : <FiGrid size={13} style={{ color: "#475569" }} />}
        </div>

        {/* Name — always navigates to products */}
        <Link
          to={url}
          onClick={(e) => { e.stopPropagation(); triggerRipple(e); onNavigate(); }}
          className="cp-cat-label"
          style={{
            flex: 1, fontSize: 14, fontWeight: 500,
            color: "#c8d3e0",
            fontFamily: "'DM Sans',sans-serif",
            transition: "color 0.2s",
            letterSpacing: "0.005em",
            textDecoration: "none",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
        >
          {item?.name}
        </Link>

        {/* Sub count + toggle chevron */}
        {hasSubs && (
          <div
            onClick={handleRowClick}
            style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, cursor: "pointer" }}
          >
            <span style={{
              fontSize: 10, color: "#2d3748",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8, padding: "2px 6px",
              fontFamily: "'DM Sans',sans-serif",
            }}>
              {item.children.length}
            </span>
            <FiChevronDown
              className="cp-cat-chevron"
              size={14}
              style={{
                color: "#475569",
                transition: "transform 0.25s, color 0.2s",
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </div>
        )}

        {/* Arrow for leaf categories */}
        {!hasSubs && (
          <FiChevronRight size={13} style={{ color: "#2d3748", flexShrink: 0 }} />
        )}
      </div>

      {/* Sub-categories */}
      {hasSubs && expanded && (
        <div style={{
          borderLeft: "1px solid rgba(99,102,241,0.12)",
          marginLeft: 33, paddingBottom: 4,
        }}>
          {item.children.map((sub, i) => (
            <SubRow
              key={sub?._id || i}
              item={sub}
              parentId={item?._id || item?.id}
              onNavigate={onNavigate}
              delay={i * 28}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   SEARCH RESULTS
════════════════════════════════════════════ */
const SearchResults = ({ results, query, onNavigate }) => {
  if (!results.length) return (
    <div style={{ padding: "38px 20px", textAlign: "center" }}>
      <FiPackage size={28} style={{ color: "#1e2535", marginBottom: 10 }} />
      <div style={{ fontSize: 13, color: "#334155", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.7 }}>
        No categories found for<br />
        <strong style={{ color: "#6366f1" }}>"{query}"</strong>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "6px 0" }}>
      {results.map((item, i) => {
        const level = item._depth === 0 ? "main" : item._depth === 1 ? "sub" : "subsub";
        const url = buildProductUrl(item, level, item._parentId, item._grandParentId);
        return (
          <Link
            key={i}
            to={url}
            onClick={onNavigate}
            className="cp-result-row"
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 13px", textDecoration: "none",
              animation: `cpFadeUp 0.2s ease ${i * 26}ms both`,
            }}
          >
            {/* Depth indicator dot */}
            <span style={{
              width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
              background: item._depth === 0
                ? "#6366f1"
                : item._depth === 1
                  ? "rgba(99,102,241,0.45)"
                  : "rgba(99,102,241,0.2)",
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="cp-result-label" style={{
                fontSize: 13, color: "#8a9ab8",
                fontFamily: "'DM Sans',sans-serif",
                transition: "color 0.18s",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {highlight(item?.name, query)}
              </div>
              {item._parent && (
                <div style={{ fontSize: 11, color: "#2d3748", marginTop: 2 }}>
                  {item._depth === 1 ? "in " : "sub of "}{item._parent}
                </div>
              )}
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 10, color: "#334155",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 7, padding: "2px 7px",
              fontFamily: "'DM Sans',sans-serif",
              flexShrink: 0,
            }}>
              <FiPackage size={9} />
              Products
            </div>
          </Link>
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════════════
   SKELETON LOADER
════════════════════════════════════════════ */
const SkeletonLoader = () => (
  <div style={{ padding: "10px 16px" }}>
    {[90, 68, 82, 55, 76, 63, 88].map((w, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 13 }}>
        <div className="cp-skel" style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0 }} />
        <div className="cp-skel" style={{ width: `${w * 0.7}%`, height: 13 }} />
      </div>
    ))}
  </div>
);

/* ═══════════════════════════════════════════
   MAIN — CategoryPanel
════════════════════════════════════════════ */
const CategoryPanel = (props) => {
  injectStyles("cpanel-styles-v3", GLOBAL_CSS);


  const context = useAppContext();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [allFlat, setAllFlat] = useState([]);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  /* Flatten ALL levels whenever data arrives/changes */
  useEffect(() => {
    const data = props?.data;
    if (Array.isArray(data) && data.length > 0) {
      const flat = flattenCategories(data);

      setAllFlat(flat);
    }
  }, [props?.data]);

  /* Reset + autofocus on open */
  useEffect(() => {
    if (props.isOpenCatPanel) {
      setSearchQuery(""); setSearchResults([]); setSearching(false);
      setTimeout(() => inputRef.current?.focus(), 340);
    }
  }, [props.isOpenCatPanel]);

  /* Debounced search */
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) { setSearching(false); setSearchResults([]); return; }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      const q = searchQuery.toLowerCase();
      const results = allFlat.filter((c) => {
        // Match on own name OR parent name (so typing "mobiles" also finds sub-items under Mobiles)
        const nameMatch = c?.name?.toLowerCase().includes(q);
        const parentMatch = c?._parent?.toLowerCase().includes(q);
        return nameMatch || parentMatch;
      });
      setSearchResults(results);
      setSearching(false);
    }, 210);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, allFlat]);

  /* Close panel */
  const closePanel = useCallback(() => {
    props.setIsOpenCatPanel(false);
    props.propsSetIsOpenCatPanel(false);
  }, [props]);

  /* Logout handler */
  const handleLogout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    context.setIsLogin(false);
    context.setUserData({});
    context.setCartData([]);
    context.setMyListData([]);
    closePanel();
    navigate("/login");
  }, [context, navigate, closePanel]);

  /* Called by any category/sub/subsub click → close panel */
  const handleNavigate = useCallback(() => {
    closePanel();
  }, [closePanel]);

  const isLoading = !props?.data || props?.data?.length === 0;
  const hasSearch = searchQuery.trim().length > 0;
  const totalCats = props?.data?.length || 0;

  return (
    <Drawer
      open={props.isOpenCatPanel}
      onClose={closePanel}
      PaperProps={{ style: { width: 308, background: "transparent", boxShadow: "none", border: "none" } }}
    >
      <div style={{
        width: 308, height: "100%",
        display: "flex", flexDirection: "column",
        background: "#0b0d12",
        fontFamily: "'DM Sans',sans-serif",
        animation: "cpSlideIn 0.3s cubic-bezier(0.22,1,0.36,1) both",
        position: "relative", overflow: "hidden",
      }}>

        {/* ── Ambient Background ── */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          background:
            "radial-gradient(ellipse 260px 180px at 105% -5%, rgba(99,102,241,0.10) 0%, transparent 65%)," +
            "radial-gradient(ellipse 180px 280px at -5% 105%, rgba(99,102,241,0.06) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: "radial-gradient(rgba(99,102,241,0.05) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }} />

        {/* ══════════════ HEADER ══════════════ */}
        <div style={{
          position: "relative", zIndex: 2, flexShrink: 0,
          height: 58, padding: "0 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            {localStorage.getItem("logo") ? (
              <img src={localStorage.getItem("logo")} alt="logo"
                style={{ maxHeight: 28, maxWidth: 100, objectFit: "contain" }} />
            ) : (
              <>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: "linear-gradient(135deg,#4f46e5,#818cf8)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 14px rgba(99,102,241,0.35)",
                }}>
                  <FiGrid size={14} color="#fff" />
                </div>
                <span style={{
                  fontSize: 15, fontWeight: 800,
                  fontFamily: "'Syne',sans-serif",
                  color: "#e2e8f0", letterSpacing: "0.02em",
                }}>
                  Categories
                </span>
              </>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            {!isLoading && (
              <span style={{
                fontSize: 10, color: "#2d3748",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 9, padding: "3px 8px",
              }}>
                {totalCats} depts
              </span>
            )}
            <button
              className="cp-close"
              onClick={closePanel}
              aria-label="Close menu"
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "#475569", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.18s", padding: 0, fontSize: 17,
              }}
            >
              <IoCloseSharp />
            </button>
          </div>
        </div>

        {/* ══════════════ SEARCH ══════════════ */}
        <div style={{ position: "relative", zIndex: 2, padding: "11px 13px 7px", flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <FiSearch style={{
              position: "absolute", left: 11, top: "50%",
              transform: "translateY(-50%)",
              color: "#334155", fontSize: 13, pointerEvents: "none",
            }} />
            <input
              ref={inputRef}
              type="text"
              className="cp-search"
              placeholder="Search categories…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "9px 32px 9px 32px",
                borderRadius: 9,
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.03)",
                color: "#e2e8f0", fontSize: 13, outline: "none",
                fontFamily: "'DM Sans',sans-serif",
                transition: "all 0.2s",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute", right: 9, top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(255,255,255,0.07)", border: "none",
                  borderRadius: 5, color: "#475569", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 20, height: 20, padding: 0,
                }}
              >
                <FiX size={11} />
              </button>
            )}
          </div>

          {hasSearch && !searching && (
            <div style={{ fontSize: 11, color: "#2d3748", marginTop: 7, paddingLeft: 2 }}>
              {searchResults.length > 0 ? (
                <><span style={{ color: "#6366f1" }}>{searchResults.length}</span> result{searchResults.length !== 1 ? "s" : ""}</>
              ) : "No matches"}
            </div>
          )}
        </div>

        {/* ══════════════ SECTION LABEL ══════════════ */}
        {!hasSearch && (
          <div style={{
            padding: "5px 20px 8px",
            display: "flex", alignItems: "center", gap: 8,
            flexShrink: 0, position: "relative", zIndex: 2,
          }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.04)" }} />
            <span style={{
              fontSize: 9, fontWeight: 700,
              letterSpacing: "0.14em", textTransform: "uppercase",
              color: "#1a2030",
            }}>All Departments</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.04)" }} />
          </div>
        )}

        {/* ══════════════ SCROLL AREA ══════════════ */}
        <div
          className="cpanel-scroll"
          style={{
            flex: 1, overflowY: "auto", overflowX: "hidden",
            position: "relative", zIndex: 2,
            padding: "2px 0 16px",
          }}
        >
          {isLoading ? (
            <SkeletonLoader />
          ) : hasSearch ? (
            searching
              ? <SkeletonLoader />
              : <SearchResults results={searchResults} query={searchQuery} onNavigate={handleNavigate} />
          ) : (
            props.data.map((cat, i) => (
              <CategoryRow
                key={cat?._id || i}
                item={cat}
                index={i}
                onNavigate={handleNavigate}
              />
            ))
          )}
        </div>

        {/* ══════════════ AUTH SECTION ══════════════ */}
        <div className="cp-auth-section" style={{
          padding: "10px 13px 0",
          flexShrink: 0,
          position: "relative", zIndex: 2,
        }}>
          {context?.isLogin ? (
            /* ── LOGGED IN: show user info + logout ── */
            <div style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 11,
              padding: "10px 12px",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              {/* Avatar */}
              <div style={{
                width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #4f46e5, #818cf8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: "#fff",
                boxShadow: "0 0 12px rgba(99,102,241,0.35)",
                userSelect: "none",
              }}>
                {context?.userData?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>

              {/* Name + email */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: "#c8d3e0",
                  fontFamily: "'DM Sans',sans-serif",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {context?.userData?.name || "User"}
                </div>
                <div style={{
                  fontSize: 11, color: "#334155",
                  fontFamily: "'DM Sans',sans-serif",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  marginTop: 1,
                }}>
                  {context?.userData?.email || ""}
                </div>
              </div>

              {/* Logout button */}
              <button
                className="cp-auth-btn logout"
                onClick={handleLogout}
                title="Logout"
                style={{
                  flexShrink: 0,
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 11px",
                  borderRadius: 8,
                  border: "1px solid rgba(239,68,68,0.28)",
                  background: "rgba(239,68,68,0.07)",
                  color: "#f87171",
                  fontSize: 12, fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                  letterSpacing: "0.01em",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </button>
            </div>
          ) : (
            /* ── NOT LOGGED IN: login prompt ── */
            <div style={{
              background: "rgba(99,102,241,0.04)",
              border: "1px solid rgba(99,102,241,0.12)",
              borderRadius: 11,
              padding: "12px 13px",
            }}>
              {/* Prompt text */}
              <div style={{ marginBottom: 9 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: "#c8d3e0",
                  fontFamily: "'DM Sans',sans-serif",
                }}>
                  Sign in to your account
                </div>
                <div style={{
                  fontSize: 11, color: "#334155",
                  fontFamily: "'DM Sans',sans-serif",
                  marginTop: 2, lineHeight: 1.5,
                }}>
                  Track orders, save addresses & more
                </div>
              </div>

              {/* Login button */}
              <button
                className="cp-auth-btn login"
                onClick={() => { closePanel(); navigate("/login"); }}
                style={{
                  width: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  padding: "9px 14px",
                  borderRadius: 9,
                  border: "1px solid rgba(99,102,241,0.35)",
                  background: "rgba(99,102,241,0.1)",
                  color: "#818cf8",
                  fontSize: 13, fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                  letterSpacing: "0.01em",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Login to Continue
              </button>

              {/* Register link */}
              <div style={{
                marginTop: 8, textAlign: "center",
                fontSize: 11, color: "#1e2535",
                fontFamily: "'DM Sans',sans-serif",
              }}>
                New here?{" "}
                <span
                  onClick={() => { closePanel(); navigate("/register"); }}
                  style={{ color: "#6366f1", fontWeight: 600, cursor: "pointer" }}
                >
                  Create account
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════ FOOTER ══════════════ */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "11px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0, position: "relative", zIndex: 2,
          marginTop: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#22c55e",
              display: "inline-block",
              animation: "cpPulse 2.2s ease infinite",
              boxShadow: "0 0 6px rgba(34,197,94,0.5)",
            }} />
            <span style={{ fontSize: 11, color: "#1e2535", fontFamily: "'DM Sans',sans-serif" }}>
              All categories live
            </span>
          </div>
          <Link
            to="/products"
            onClick={closePanel}
            className="cp-viewall"
            style={{
              fontSize: 11, color: "#6366f1",
              textDecoration: "none", fontWeight: 600,
              display: "flex", alignItems: "center", gap: 3,
              fontFamily: "'DM Sans',sans-serif",
              transition: "color 0.18s",
            }}
          >
            All Products <FiChevronRight size={12} />
          </Link>
        </div>
      </div>
    </Drawer>
  );
};

export default CategoryPanel;