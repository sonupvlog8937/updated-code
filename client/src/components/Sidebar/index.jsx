import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import "../Sidebar/style.css";
import { Collapse } from "react-collapse";
import { FaAngleDown, FaAngleRight, FaAngleUp } from "react-icons/fa6";
import RangeSlider from "react-range-slider-input";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import "react-range-slider-input/dist/style.css";
import Rating from "@mui/material/Rating";
import { useAppContext } from "../../hooks/useAppContext";
import { useLocation } from "react-router-dom";
import { postData } from "../../utils/api";
import { MdOutlineFilterAlt, MdRefresh, MdCheck, MdClose, MdSearch, MdFilterList } from "react-icons/md";
import { FiSearch, FiX, FiChevronDown, FiChevronUp, FiCheck } from "react-icons/fi";

/* ═══════════════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
  .sb-root { font-family:'DM Sans',sans-serif; }
  .sb-root * { box-sizing:border-box; font-family:'DM Sans',sans-serif; }

  .sb-box { border-bottom:1px solid #f0f0f5; padding:14px 0; }
  .sb-box:last-child { border-bottom:none; }

  .sb-head { display:flex; align-items:center; justify-content:space-between; cursor:pointer; padding:0 4px 0 0; gap:8px; -webkit-tap-highlight-color:transparent; user-select:none; }
  .sb-head-title { font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#374151; }
  .sb-head-arrow { width:24px; height:24px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#9ca3af; flex-shrink:0; transition:all 0.2s ease; background:#f8f8fb; }
  .sb-head:hover .sb-head-arrow { background:#f0f0f5; color:#374151; }

  .sb-root .MuiFormControlLabel-root { margin:0 !important; width:100%; }
  .sb-root .MuiFormControlLabel-label { font-size:13px !important; font-weight:500 !important; color:#374151 !important; font-family:'DM Sans',sans-serif !important; line-height:1.4 !important; }
  .sb-root .MuiCheckbox-root { padding:5px 8px 5px 4px !important; color:#d1d5db !important; }
  .sb-root .MuiCheckbox-root.Mui-checked { color:#0d0d12 !important; }
  .sb-root .MuiFormControlLabel-root:hover .MuiFormControlLabel-label { color:#0d0d12 !important; }

  /* Category */
  .sb-cat-row { display:flex; align-items:center; gap:2px; border-radius:8px; transition:background 0.15s; padding:1px 2px; }
  .sb-cat-row:hover { background:#f7f7fb; }
  .sb-cat-btn { text-align:left; font-size:13px; font-weight:500; color:#6b7280; background:none; border:none; cursor:pointer; padding:5px 2px; line-height:1.4; font-family:'DM Sans',sans-serif; transition:color 0.15s ease; flex:1; -webkit-tap-highlight-color:transparent; }
  .sb-cat-btn:hover { color:#0d0d12; }
  .sb-cat-btn.active { color:#0d0d12; font-weight:700; }
  .sb-cat-expand { width:22px; height:22px; border-radius:6px; display:inline-flex; align-items:center; justify-content:center; background:none; border:none; cursor:pointer; color:#9ca3af; flex-shrink:0; transition:all 0.18s ease; -webkit-tap-highlight-color:transparent; }
  .sb-cat-expand:hover { background:#e8e8f0; color:#374151; }
  .sb-cat-expand.open { color:#0d0d12; background:#ebebf5; }
  .sb-subcat-wrap { border-left:2px solid #f0f0f5; margin-left:10px; padding-left:8px; margin-top:2px; overflow:hidden; }
  .sb-selected-dot { display:inline-block; width:6px; height:6px; border-radius:50%; background:#E8362A; margin-left:6px; vertical-align:middle; }

  .sb-color-option { display:flex; align-items:center; gap:8px; padding:2px 0; }
  .sb-color-swatch { width:16px; height:16px; border-radius:50%; border:1.5px solid rgba(0,0,0,0.12); flex-shrink:0; }

  /* Price presets */
  .sb-price-presets { display:flex; flex-direction:column; gap:3px; margin-bottom:14px; max-height:280px; overflow-y:auto; padding-right:2px; }
  .sb-price-presets::-webkit-scrollbar { width:4px; }
  .sb-price-presets::-webkit-scrollbar-track { background:#f8f8fb; border-radius:4px; }
  .sb-price-presets::-webkit-scrollbar-thumb { background:#e0e0ea; border-radius:4px; }
  .sb-price-opt { display:flex; align-items:center; gap:10px; padding:7px 10px; border-radius:9px; cursor:pointer; border:1.5px solid transparent; transition:all 0.14s ease; -webkit-tap-highlight-color:transparent; }
  .sb-price-opt:hover { background:#f7f7fb; border-color:#e8e8f3; }
  .sb-price-opt.active { background:#f0f0fa; border-color:#c7c7ef; }
  .sb-price-radio { width:16px; height:16px; border-radius:50%; border:2px solid #d1d5db; flex-shrink:0; display:flex; align-items:center; justify-content:center; transition:all 0.14s ease; }
  .sb-price-opt.active .sb-price-radio { border-color:#0d0d12; background:#0d0d12; }
  .sb-price-radio-dot { width:6px; height:6px; border-radius:50%; background:#fff; opacity:0; transition:opacity 0.14s ease; }
  .sb-price-opt.active .sb-price-radio-dot { opacity:1; }
  .sb-price-lbl { font-size:13px; font-weight:500; color:#374151; flex:1; line-height:1.3; }
  .sb-price-opt.active .sb-price-lbl { color:#0d0d12; font-weight:700; }
  .sb-price-divider { display:flex; align-items:center; gap:8px; margin:10px 0 8px; font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#9ca3af; }
  .sb-price-divider::before, .sb-price-divider::after { content:''; flex:1; height:1px; background:#f0f0f5; }
  .sb-price-values { display:flex; align-items:center; justify-content:space-between; margin-top:14px; }
  .sb-price-val { background:#f8f8fb; border:1px solid #e8e8f0; border-radius:8px; padding:4px 10px; font-size:12px; font-weight:700; color:#0d0d12; }
  .sb-price-divider-line { font-size:11px; color:#9ca3af; }
  .sb-root .range-slider { height:4px !important; }
  .sb-root .range-slider .range-slider__thumb { width:18px !important; height:18px !important; background:#0d0d12 !important; border:2px solid #fff !important; box-shadow:0 2px 8px rgba(0,0,0,0.2) !important; }
  .sb-root .range-slider .range-slider__range { background:#0d0d12 !important; }
  .sb-price-active-tag { display:inline-flex; align-items:center; gap:5px; background:#0d0d12; color:#fff; font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px; margin-bottom:10px; }
  .sb-price-active-tag button { background:none; border:none; color:rgba(255,255,255,0.7); cursor:pointer; padding:0; font-size:13px; line-height:1; display:flex; align-items:center; }
  .sb-price-active-tag button:hover { color:#fff; }

  .sb-rating-row { display:flex; align-items:center; gap:4px; padding:2px 0; cursor:pointer; }

  .sb-more-btn { display:inline-flex; align-items:center; gap:4px; margin-top:4px; padding:3px 0; font-size:12px; font-weight:600; color:#2563eb; background:none; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; transition:color 0.15s ease; -webkit-tap-highlight-color:transparent; }
  .sb-more-btn:hover { color:#1d4ed8; }

  .sb-actions { display:flex; gap:8px; padding:14px 0 8px; border-top:1px solid #f0f0f5; margin-top:4px; }
  .sb-apply-btn { flex:1; height:40px; border-radius:10px; background:#0d0d12; color:#fff; border:none; cursor:pointer; outline:none; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.18s ease; -webkit-tap-highlight-color:transparent; }
  .sb-apply-btn:hover { background:#1d1d28; transform:translateY(-1px); box-shadow:0 4px 14px rgba(13,13,18,0.2); }
  .sb-apply-btn .sb-count { display:inline-flex; align-items:center; justify-content:center; min-width:18px; height:18px; padding:0 5px; background:rgba(255,255,255,0.2); border-radius:20px; font-size:11px; font-weight:800; }
  .sb-reset-btn { height:40px; padding:0 14px; border-radius:10px; background:#fff; color:#374151; border:1.5px solid #e8e8f0; cursor:pointer; outline:none; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; display:flex; align-items:center; gap:5px; transition:all 0.18s ease; -webkit-tap-highlight-color:transparent; }
  .sb-reset-btn:hover { border-color:#E8362A; color:#E8362A; }
  .sb-cancel-btn { width:100%; height:38px; border-radius:10px; background:#f8f8fb; color:#374151; border:1.5px solid #e8e8f0; cursor:pointer; outline:none; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:5px; margin-top:6px; transition:all 0.18s ease; -webkit-tap-highlight-color:transparent; }
  .sb-cancel-btn:hover { background:#f0f0f5; }

  .sb-total-badge { display:flex; align-items:center; gap:8px; padding:10px 12px; background:linear-gradient(135deg,#0d0d12,#1a1a2e); border-radius:12px; margin-bottom:16px; }
  .sb-total-num { font-size:22px; font-weight:800; color:#fff; font-family:'Syne',sans-serif; line-height:1; }
  .sb-total-label { font-size:11px; color:rgba(255,255,255,0.5); font-weight:500; line-height:1.3; }
  .sb-total-dot { width:8px; height:8px; border-radius:50%; background:#E8362A; flex-shrink:0; margin-left:auto; animation:sb-pulse 1.4s ease infinite; }
  @keyframes sb-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }

  /* ═══════════════════════════════════════════
     DIALOG — professional redesign
  ═══════════════════════════════════════════ */
  .sbd-overlay .MuiDialog-paper {
    border-radius: 20px !important;
    box-shadow: 0 24px 64px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08) !important;
    max-height: 88vh !important;
    overflow: hidden !important;
    margin: 16px !important;
  }

  /* search input inside dialog */
  .sbd-search-wrap { position:relative; }
  .sbd-search-input {
    width:100%; padding:10px 36px 10px 38px;
    border:1.5px solid #e8e8f2; border-radius:11px;
    background:#f9f9fc; color:#1a1a2e; font-size:13px;
    font-family:'DM Sans',sans-serif; outline:none;
    transition:all 0.2s ease;
  }
  .sbd-search-input:focus { border-color:#6366f1; background:#fff; box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
  .sbd-search-input::placeholder { color:#aaa; }
  .sbd-search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#9ca3af; pointer-events:none; }
  .sbd-clear-btn {
    position:absolute; right:10px; top:50%; transform:translateY(-50%);
    width:20px; height:20px; border-radius:5px; border:none;
    background:#e8e8f0; color:#6b7280; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition:all 0.15s ease;
  }
  .sbd-clear-btn:hover { background:#d1d5db; color:#374151; }

  /* option rows inside dialog */
  .sbd-opt-list { display:flex; flex-direction:column; gap:2px; }
  .sbd-opt-row {
    display:flex; align-items:center; gap:10px;
    padding:9px 12px; border-radius:10px; cursor:pointer;
    border:1.5px solid transparent;
    transition:all 0.15s ease;
    -webkit-tap-highlight-color:transparent;
  }
  .sbd-opt-row:hover { background:#f7f7fb; border-color:#ebebf5; }
  .sbd-opt-row.sbd-checked { background:#f0f0fa; border-color:#c7c7ef; }

  /* custom checkbox */
  .sbd-checkbox {
    width:18px; height:18px; border-radius:5px;
    border:2px solid #d1d5db; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    transition:all 0.15s ease; background:#fff;
  }
  .sbd-opt-row.sbd-checked .sbd-checkbox { background:#0d0d12; border-color:#0d0d12; }
  .sbd-opt-row:hover .sbd-checkbox { border-color:#9ca3af; }

  .sbd-opt-label { font-size:13px; font-weight:500; color:#374151; flex:1; line-height:1.4; }
  .sbd-opt-row.sbd-checked .sbd-opt-label { color:#0d0d12; font-weight:600; }

  /* no results */
  .sbd-no-results { padding:32px 20px; text-align:center; }
  .sbd-no-results-icon { font-size:32px; margin-bottom:8px; }
  .sbd-no-results-text { font-size:13px; color:#9ca3af; font-family:'DM Sans',sans-serif; line-height:1.6; }

  /* dialog footer buttons */
  .sbd-footer { display:flex; gap:8px; padding:14px 20px 18px; border-top:1px solid #f0f0f5; }
  .sbd-footer-apply {
    flex:1; height:42px; border-radius:11px; background:#0d0d12; color:#fff;
    border:none; cursor:pointer; font-family:'DM Sans',sans-serif;
    font-size:13px; font-weight:700;
    display:flex; align-items:center; justify-content:center; gap:7px;
    transition:all 0.18s ease;
  }
  .sbd-footer-apply:hover { background:#1d1d28; transform:translateY(-1px); box-shadow:0 6px 18px rgba(13,13,18,0.2); }
  .sbd-footer-cancel {
    height:42px; padding:0 18px; border-radius:11px;
    background:#fff; color:#374151; border:1.5px solid #e8e8f0;
    cursor:pointer; font-family:'DM Sans',sans-serif;
    font-size:13px; font-weight:600;
    display:flex; align-items:center; gap:5px;
    transition:all 0.18s ease;
  }
  .sbd-footer-cancel:hover { border-color:#374151; }

  /* selected count badge in dialog */
  .sbd-sel-badge {
    display:inline-flex; align-items:center; justify-content:center;
    min-width:20px; height:20px; padding:0 6px;
    background:#0d0d12; color:#fff;
    border-radius:20px; font-size:11px; font-weight:800;
  }

  /* highlight matched text */
  .sbd-match { background:rgba(99,102,241,0.15); color:#4338ca; border-radius:2px; padding:0 1px; font-weight:700; }
`;

/* ── PRICE PRESET RANGES ── */
const PRICE_RANGES = [
  { label: "Under ₹99",          min: 0,     max: 99 },
  { label: "₹99 – ₹199",        min: 99,    max: 199 },
  { label: "₹199 – ₹299",       min: 199,   max: 299 },
  { label: "₹299 – ₹499",       min: 299,   max: 499 },
  { label: "₹499 – ₹699",       min: 499,   max: 699 },
  { label: "₹699 – ₹999",       min: 699,   max: 999 },
  { label: "₹999 – ₹1,499",     min: 999,   max: 1499 },
  { label: "₹1,499 – ₹1,999",   min: 1499,  max: 1999 },
  { label: "₹1,999 – ₹2,999",   min: 1999,  max: 2999 },
  { label: "₹2,999 – ₹4,999",   min: 2999,  max: 4999 },
  { label: "₹4,999 – ₹9,999",   min: 4999,  max: 9999 },
  { label: "Above ₹9,999",       min: 9999,  max: 60000 },
];

/* ── Collapsible Section ── */
const Section = ({ title, open, onToggle, children }) => (
  <div className="sb-box">
    <div className="sb-head" onClick={onToggle} role="button" tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onToggle()}>
      <span className="sb-head-title">{title}</span>
      <span className="sb-head-arrow">{open ? <FaAngleUp size={11} /> : <FaAngleDown size={11} />}</span>
    </div>
    <Collapse isOpened={open}>
      <div style={{ paddingTop: 10 }}>{children}</div>
    </Collapse>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   FILTER DIALOG — with search, custom checkboxes, professional UI
══════════════════════════════════════════════════════════════ */
const FilterDialog = ({ open, onClose, title, options, selectedValues, onApplySelection, getOptionKey, getOptionLabel }) => {
  const [query,       setQuery]       = useState("");
  const [selections,  setSelections]  = useState([]);
  const searchRef = useRef(null);

  /* Sync selections when dialog opens */
  useEffect(() => {
    if (open) {
      setSelections(selectedValues || []);
      setQuery("");
      setTimeout(() => searchRef.current?.focus(), 120);
    }
  }, [open, selectedValues]);

  /* Highlight matching text */
  const highlightText = (text, q) => {
    if (!q || typeof text !== "string") return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="sbd-match">{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
      </>
    );
  };

  /* Filter options by query */
  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter(opt => {
      const key   = getOptionKey(opt);
      const label = typeof key === "string" ? key : String(key ?? "");
      return label.toLowerCase().includes(q);
    });
  }, [query, options, getOptionKey]);

  const toggle = (key) =>
    setSelections(p => p.includes(key) ? p.filter(x => x !== key) : [...p, key]);

  const handleApply = () => {
    onApplySelection(selections);
    onClose();
  };

  const handleClearAll = () => setSelections([]);

  const selectedCount = selections.length;
  const totalCount    = options.length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="sbd-overlay"
      fullWidth
      maxWidth="xs"
      TransitionProps={{ timeout: 220 }}
    >
      <DialogContent style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "88vh" }}>

        {/* ── Header ── */}
        <div style={{
          padding: "20px 20px 14px",
          borderBottom: "1px solid #f0f0f5",
          flexShrink: 0,
        }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: "linear-gradient(135deg,#0d0d12,#1a1a2e)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MdFilterList size={16} color="#fff" />
              </div>
              <div>
                <div style={{
                  fontSize: 15, fontWeight: 800, color: "#0d0d12",
                  fontFamily: "'Syne',sans-serif", lineHeight: 1.2,
                }}>
                  {title}
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
                  {totalCount} option{totalCount !== 1 ? "s" : ""} available
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {selectedCount > 0 && (
                <button
                  onClick={handleClearAll}
                  style={{
                    fontSize: 11, fontWeight: 600, color: "#E8362A",
                    background: "rgba(232,54,42,0.07)", border: "1px solid rgba(232,54,42,0.2)",
                    borderRadius: 7, padding: "4px 9px", cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s",
                  }}
                >
                  Clear all
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: "#f3f4f6", border: "1px solid #e5e7eb",
                  color: "#6b7280", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}
              >
                <FiX size={15} />
              </button>
            </div>
          </div>

          {/* Search input */}
          <div className="sbd-search-wrap">
            <FiSearch className="sbd-search-icon" size={14} />
            <input
              ref={searchRef}
              type="text"
              className="sbd-search-input"
              placeholder={`Search ${title.toLowerCase()}…`}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className="sbd-clear-btn" onClick={() => setQuery("")}>
                <FiX size={11} />
              </button>
            )}
          </div>

          {/* Live result count */}
          {query && (
            <div style={{
              fontSize: 11, color: "#9ca3af", marginTop: 8,
              display: "flex", alignItems: "center", gap: 5,
            }}>
              {filtered.length > 0 ? (
                <><span style={{ color: "#6366f1", fontWeight: 700 }}>{filtered.length}</span> result{filtered.length !== 1 ? "s" : ""} for "<strong style={{ color: "#374151" }}>{query}</strong>"</>
              ) : (
                <>No results for "<strong style={{ color: "#374151" }}>{query}</strong>"</>
              )}
            </div>
          )}
        </div>

        {/* ── Selected chips strip ── */}
        {selectedCount > 0 && !query && (
          <div style={{
            padding: "10px 16px 0",
            display: "flex", flexWrap: "wrap", gap: 6,
            flexShrink: 0,
          }}>
            {selections.map(sel => {
              const opt = options.find(o => getOptionKey(o) === sel);
              if (!opt) return null;
              const lbl = getOptionKey(opt);
              return (
                <span key={sel} style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "3px 8px 3px 10px",
                  background: "#0d0d12", color: "#fff",
                  borderRadius: 20, fontSize: 11, fontWeight: 600,
                }}>
                  {typeof lbl === "string" ? lbl : lbl}
                  <button
                    onClick={() => toggle(sel)}
                    style={{
                      background: "rgba(255,255,255,0.2)", border: "none",
                      borderRadius: "50%", width: 16, height: 16,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", color: "#fff", padding: 0,
                      transition: "background 0.15s",
                    }}
                  >
                    <FiX size={9} />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* ── Options list ── */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "10px 12px 4px",
          scrollbarWidth: "thin",
          scrollbarColor: "#e0e0ea transparent",
        }}>
          {filtered.length === 0 ? (
            <div className="sbd-no-results">
              <div className="sbd-no-results-icon">🔍</div>
              <div className="sbd-no-results-text">
                No options match<br />
                <strong style={{ color: "#374151" }}>"{query}"</strong>
              </div>
            </div>
          ) : (
            <div className="sbd-opt-list">
              {filtered.map((opt, i) => {
                const key     = getOptionKey(opt);
                const checked = selections.includes(key);
                const rawLabel = getOptionKey(opt);
                const displayLabel = getOptionLabel(opt);

                return (
                  <div
                    key={key ?? i}
                    className={`sbd-opt-row${checked ? " sbd-checked" : ""}`}
                    onClick={() => toggle(key)}
                    style={{ animationDelay: `${i * 18}ms` }}
                  >
                    {/* Custom checkbox */}
                    <div className="sbd-checkbox">
                      {checked && <FiCheck size={11} color="#fff" strokeWidth={3} />}
                    </div>

                    {/* Label — highlight if search active */}
                    <span className="sbd-opt-label">
                      {query && typeof rawLabel === "string"
                        ? highlightText(rawLabel, query)
                        : displayLabel
                      }
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="sbd-footer">
          <button className="sbd-footer-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="sbd-footer-apply" onClick={handleApply}>
            <FiCheck size={14} strokeWidth={2.5} />
            Apply
            {selectedCount > 0 && (
              <span className="sbd-sel-badge">{selectedCount}</span>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR COMPONENT
═══════════════════════════════════════════════════════════════ */
export const Sidebar = (props) => {
  /* ── Section toggles ── */
  const [openSections, setOpenSections] = useState({
    category: true, brand: true, size: true, type: true,
    price: true, sale: false, color: true, stock: false,
    discount: false, weight: false, ram: false, rating: true,
  });
  const toggleSection = (k) => setOpenSections(p => ({ ...p, [k]: !p[k] }));

  /* ── Stable filter options ── */
  const [stableOptions,   setStableOptions]   = useState({ brands: [], sizes: [], productTypes: [], weights: [], ramOptions: [] });
  const [availableColors, setAvailableColors] = useState([]);
  const [expandedCatIds,  setExpandedCatIds]  = useState([]);

  /* ── Internal state ── */
  const [internalCat,    setInternalCat]    = useState({ catId: [], subCatId: [], thirdsubCatId: [] });
  const [internalRating, setInternalRating] = useState([]);
  const [internalColors, setInternalColors] = useState([]);
  const [price,          setPrice]          = useState([0, 60000]);
  const [activePricePreset, setActivePricePreset] = useState(null);

  /* ── Dialog state — single dialog driven by config object ── */
  const [dialogCfg, setDialogCfg] = useState(null); // null = closed

  const context  = useAppContext();
  const location = useLocation();

  /* ── FETCH (debounced) ── */
  const timerRef  = useRef(null);
  const latestRef = useRef({});
  latestRef.current = { props, internalCat, internalRating, internalColors, price };

  const fetchProducts = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const { props: p, internalCat: cat, internalRating: rat, internalColors: col, price: pr } = latestRef.current;
      p.setIsLoading(true);
      const minPrice = (p.selectedMinPrice !== null && p.selectedMinPrice !== undefined) ? p.selectedMinPrice : pr[0];
      const maxPrice = (p.selectedMaxPrice !== null && p.selectedMaxPrice !== undefined) ? p.selectedMaxPrice : pr[1];
      const payload = {
        catId: cat.catId, subCatId: cat.subCatId, thirdsubCatId: cat.thirdsubCatId,
        rating: rat, colors: col, minPrice, maxPrice,
        brands: p.selectedBrands || [], sizes: p.selectedSizes || [],
        productTypes: p.selectedProductTypes || [], priceRanges: p.selectedPriceRanges || [],
        saleOnly: p.selectedSaleOnly || false, stockStatus: p.selectedStockStatus || "all",
        discountRanges: p.selectedDiscountRanges || [], weights: p.selectedWeights || [],
        ramOptions: p.selectedRamOptions || [], ratingBands: p.selectedRatingBands || [],
        sortType: p.selectedSortType || "bestseller", query: p.searchQuery || "",
        page: p.page ?? 1, limit: 25,
      };
      const apiUrl = p.searchQuery ? `/api/product/search/get` : `/api/product/filters`;
      postData(apiUrl, payload)
        .then((res) => {
          p.setProductsData(res); p.setIsLoading(false);
          p.setTotalPages(res?.totalPages || 1);
          if (p.setTotalProducts) p.setTotalProducts(res?.totalProducts || res?.total || 0);
          window.scrollTo({ top: 0, behavior: "smooth" });
        })
        .catch(() => p.setIsLoading(false));
    }, 150);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [
    props.page, props.selectedBrands, props.selectedSizes, props.selectedProductTypes,
    props.selectedPriceRanges, props.selectedSaleOnly, props.selectedStockStatus,
    props.selectedDiscountRanges, props.selectedWeights, props.selectedRamOptions,
    props.selectedRatingBands, props.selectedSortType, props.searchQuery,
    internalCat, internalRating, internalColors, price, fetchProducts,
  ]);

  useEffect(() => {
    const min = props.selectedMinPrice, max = props.selectedMaxPrice;
    if (min !== null && min !== undefined && max !== null && max !== undefined) {
      setPrice([min, max]);
      const idx = PRICE_RANGES.findIndex(r => r.min === min && r.max === max);
      setActivePricePreset(idx !== -1 ? idx : null);
    } else { setPrice([0, 60000]); setActivePricePreset(null); }
  }, [props.selectedMinPrice, props.selectedMaxPrice]);

  useEffect(() => { fetchProducts(); }, [props.selectedMinPrice, props.selectedMaxPrice, fetchProducts]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    setInternalCat(() => {
     const catId = params.get("catId");
      const subCatId = params.get("subCatId");
      const thirdLavelCatId = params.get("thirdLavelCatId");

      if (thirdLavelCatId) return { catId: [], subCatId: [], thirdsubCatId: [thirdLavelCatId] };
      if (subCatId) return { catId: [], subCatId: [subCatId], thirdsubCatId: [] };
      if (catId) return { catId: [catId], subCatId: [], thirdsubCatId: [] };

      return { catId: [], subCatId: [], thirdsubCatId: [] };
    });
    context?.setSearchData?.([]);
  }, [location.search]);

  useEffect(() => {
    const products      = props?.productsData?.products     || [];
    const filterOptions = props?.productsData?.filterOptions || {};
    if (products.length === 0 && Object.keys(filterOptions).length === 0) return;
    setStableOptions(prev => {
      if (prev.brands.length > 0 || prev.sizes.length > 0) return prev;
      const brands = Array.isArray(filterOptions.brands) && filterOptions.brands.length > 0
        ? filterOptions.brands
        : [...new Set(products.map(p => p?.brand?.trim()).filter(Boolean))];
      const sizeSet = new Set();
      (filterOptions.sizes?.length ? filterOptions.sizes : []).forEach(s => sizeSet.add(s));
      products.forEach(p => (p?.size || []).forEach(s => s && sizeSet.add(s)));
      const typeSet = new Set();
      (filterOptions.productTypes?.length ? filterOptions.productTypes : []).forEach(t => typeSet.add(t));
      products.forEach(p => { const t = p?.productType || p?.thirdSubCatName || p?.subCatName || p?.catName; if (t) typeSet.add(t); });
      const weightSet = new Set();
      (filterOptions.weights?.length ? filterOptions.weights : []).forEach(w => weightSet.add(w));
      products.forEach(p => (p?.productWeight || []).forEach(w => w && weightSet.add(w)));
      const ramSet = new Set();
      (filterOptions.ramOptions?.length ? filterOptions.ramOptions : []).forEach(r => ramSet.add(r));
      products.forEach(p => (p?.productRam || []).forEach(r => r && ramSet.add(r)));
      const colorMap = new Map();
      if (filterOptions.colors?.length) {
        filterOptions.colors.forEach(name => colorMap.set(name, ""));
      } else {
        products.forEach(p => (p?.colorOptions || []).forEach(c => { if (c?.name && !colorMap.has(c.name)) colorMap.set(c.name, c.code || ""); }));
      }
      setAvailableColors(Array.from(colorMap, ([name, code]) => ({ name, code })));
      return { brands, sizes: Array.from(sizeSet), productTypes: Array.from(typeSet), weights: Array.from(weightSet), ramOptions: Array.from(ramSet) };
    });
  }, [props?.productsData]);

  /* ══════ HANDLERS ══════ */
  const totalProducts = props?.productsData?.totalProducts || props?.productsData?.total || 0;
  const discountBands = useMemo(() => [
    { label: "10% & above", min: 10 }, { label: "25% & above", min: 25 },
    { label: "40% & above", min: 40 }, { label: "60% & above", min: 60 },
  ], []);

  const handleMultiSelect = useCallback((selectedValues, setFn, value) => {
    if (typeof setFn !== "function") return;
    setFn(selectedValues.includes(value) ? selectedValues.filter(x => x !== value) : [...selectedValues, value]);
  }, []);

  const handleCategorySelect = useCallback(({ level, categoryId }) => {
    if (!categoryId) return;
    context?.setSearchData?.([]);
    if (level === 0) setInternalCat({ catId: [categoryId], subCatId: [], thirdsubCatId: [] });
    else if (level === 1) setInternalCat({ catId: [], subCatId: [categoryId], thirdsubCatId: [] });
    else setInternalCat({ catId: [], subCatId: [], thirdsubCatId: [categoryId] });
  }, [context]);

  const toggleCatExpand = useCallback((id) => {
    if (!id) return;
    setExpandedCatIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }, []);

  const handlePricePreset = useCallback((idx) => {
    if (activePricePreset === idx) {
      setActivePricePreset(null); setPrice([0, 60000]);
      props.setSelectedMinPrice?.(null); props.setSelectedMaxPrice?.(null);
    } else {
      const range = PRICE_RANGES[idx];
      setActivePricePreset(idx); setPrice([range.min, range.max]);
      props.setSelectedMinPrice?.(range.min); props.setSelectedMaxPrice?.(range.max);
    }
  }, [activePricePreset, props]);

  const handleSliderInput = useCallback((val) => {
    setPrice(val); setActivePricePreset(null);
    props.setSelectedMinPrice?.(val[0]); props.setSelectedMaxPrice?.(val[1]);
  }, [props]);

  const handleResetFilters = useCallback(() => {
    setInternalCat({ catId: [], subCatId: [], thirdsubCatId: [] });
    setInternalRating([]); setInternalColors([]); setPrice([0, 60000]); setActivePricePreset(null);
    props.setSelectedMinPrice?.(null); props.setSelectedMaxPrice?.(null);
    props?.onResetAllFilters?.(); context?.setOpenFilter?.(false);
  }, [props, context]);

  const handleApplyFilters = useCallback(() => { context?.setOpenFilter?.(false); }, [context]);

  /* ── Open dialog helper ── */
  const openDialog = useCallback((cfg) => setDialogCfg(cfg), []);
  const closeDialog = useCallback(() => setDialogCfg(null), []);

  /* ── Render category tree ── */
  const renderCategoryTree = (categories = [], level = 0) => {
    if (!Array.isArray(categories) || categories.length === 0) return null;
    return categories.map(cat => {
      const hasChildren = (cat?.children || []).length > 0;
      const isExpanded  = expandedCatIds.includes(cat?._id);
      const isSelected  =
        (level === 0 && internalCat.catId?.includes(cat?._id)) ||
        (level === 1 && internalCat.subCatId?.includes(cat?._id)) ||
        (level >= 2 && internalCat.thirdsubCatId?.includes(cat?._id));
      return (
        <div key={cat?._id} style={{ paddingLeft: level > 0 ? 0 : 0 }}>
          <div className="sb-cat-row">
            
            <Checkbox
              size="small" checked={isSelected}
              onChange={() => {
                if (isSelected) {
                  if (level === 0) setInternalCat(p => ({ ...p, catId: [] }));
                  else if (level === 1) setInternalCat(p => ({ ...p, subCatId: [] }));
                  else setInternalCat(p => ({ ...p, thirdsubCatId: [] }));
                } else {
                  handleCategorySelect({ level, categoryId: cat?._id });
                  if (hasChildren && !isExpanded) toggleCatExpand(cat?._id);
                }
              }}
              style={{ padding: "3px 5px 3px 0", color: isSelected ? "#0d0d12" : "#d1d5db", flexShrink: 0 }}
            />
            <button
              className={`sb-cat-btn${isSelected ? " active" : ""}`}
              onClick={() => {
                if (isSelected) {
                  if (level === 0) setInternalCat(p => ({ ...p, catId: [] }));
                  else if (level === 1) setInternalCat(p => ({ ...p, subCatId: [] }));
                  else setInternalCat(p => ({ ...p, thirdsubCatId: [] }));
                } else {
                  handleCategorySelect({ level, categoryId: cat?._id });
                  if (hasChildren && !isExpanded) toggleCatExpand(cat?._id);
                }
              }}
            >
              {cat?.name}
              {isSelected && <span className="sb-selected-dot" />}
            </button>
            {hasChildren && (
              <button className={`sb-cat-expand${isExpanded ? " open" : ""}`} onClick={() => toggleCatExpand(cat?._id)}>
                {isExpanded ? <FaAngleDown size={10} /> : <FaAngleRight size={10} />}
              </button>
            )}
          </div>
          {hasChildren && (
            <Collapse isOpened={isExpanded}>
              <div className="sb-subcat-wrap">{renderCategoryTree(cat?.children, level + 1)}</div>
            </Collapse>
          )}
        </div>
      );
    });
  };

  /* ── Render limited options with "more" button → opens new dialog ── */
  const renderOptions = ({ title, options = [], selectedValues = [], onToggle, onApplySelection, getOptionKey, getOptionLabel, limit = 6 }) => {
    const visible = options.slice(0, limit);
    const hasMore = options.length > limit;
    return (
      <>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {visible.map(opt => {
            const key = getOptionKey(opt);
            return (
              <FormControlLabel
                key={key}
                control={<Checkbox size="small" />}
                checked={selectedValues.includes(key)}
                onChange={() => onToggle(opt)}
                label={getOptionLabel(opt)}
              />
            );
          })}
        </div>
        {hasMore && (
          <button
            className="sb-more-btn"
            onClick={() => openDialog({ title, options, selectedValues, onApplySelection, getOptionKey, getOptionLabel })}
          >
            +{options.length - limit} more
          </button>
        )}
      </>
    );
  };

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <aside className="sb-root sidebar py-3 lg:py-5 static lg:sticky top-[130px] z-[50] pr-0 lg:pr-4">
      <style>{CSS}</style>

      {totalProducts > 0 && (
        <div className="sb-total-badge">
          <div>
            <div className="sb-total-num">{totalProducts.toLocaleString("en-IN")}</div>
            <div className="sb-total-label">Total Products<br />across all pages</div>
          </div>
          <div className="sb-total-dot" />
        </div>
      )}

      <div className="sidebarFiltersScroll max-h-[60vh] lg:max-h-[calc(100vh-220px)] overflow-y-auto overflow-x-hidden w-full pr-1">

        {/* Category */}
        <Section title="Category" open={openSections.category} onToggle={() => toggleSection("category")}>
          <div style={{ maxHeight: 240, overflowY: "auto", paddingRight: 4 }}>
            {renderCategoryTree(context?.catData || [])}
          </div>
        </Section>

        {/* Brand */}
        {stableOptions.brands.length > 0 && (
          <Section title="Brand" open={openSections.brand} onToggle={() => toggleSection("brand")}>
            {renderOptions({
              title: "Brand", options: stableOptions.brands,
              selectedValues: props.selectedBrands || [],
              onToggle: b => handleMultiSelect(props.selectedBrands, props.setSelectedBrands, b),
              onApplySelection: v => props.setSelectedBrands?.(v),
              getOptionKey: b => b, getOptionLabel: b => b,
            })}
          </Section>
        )}

        {/* Size */}
        {stableOptions.sizes.length > 0 && (
          <Section title="Size" open={openSections.size} onToggle={() => toggleSection("size")}>
            {renderOptions({
              title: "Size", options: stableOptions.sizes,
              selectedValues: props.selectedSizes || [],
              onToggle: s => handleMultiSelect(props.selectedSizes, props.setSelectedSizes, s),
              onApplySelection: v => props.setSelectedSizes?.(v),
              getOptionKey: s => s, getOptionLabel: s => s,
            })}
          </Section>
        )}

        {/* Product Type */}
        {stableOptions.productTypes.length > 0 && (
          <Section title="Type" open={openSections.type} onToggle={() => toggleSection("type")}>
            {renderOptions({
              title: "Product Type", options: stableOptions.productTypes,
              selectedValues: props.selectedProductTypes || [],
              onToggle: t => handleMultiSelect(props.selectedProductTypes, props.setSelectedProductTypes, t),
              onApplySelection: v => props.setSelectedProductTypes?.(v),
              getOptionKey: t => t, getOptionLabel: t => t,
            })}
          </Section>
        )}

        {/* Price */}
        <Section title="Price" open={openSections.price} onToggle={() => toggleSection("price")}>
          {(activePricePreset !== null) && (
            <div className="sb-price-active-tag">
              {PRICE_RANGES[activePricePreset]?.label}
              <button onClick={() => { setActivePricePreset(null); setPrice([0, 60000]); props.setSelectedMinPrice?.(null); props.setSelectedMaxPrice?.(null); }}>×</button>
            </div>
          )}
          <div className="sb-price-presets">
            {PRICE_RANGES.map((r, i) => (
              <div key={i} className={`sb-price-opt${activePricePreset === i ? " active" : ""}`} onClick={() => handlePricePreset(i)}>
                <div className="sb-price-radio"><div className="sb-price-radio-dot" /></div>
                <span className="sb-price-lbl">{r.label}</span>
              </div>
            ))}
          </div>
          <div className="sb-price-divider">or set custom range</div>
          <RangeSlider min={0} max={60000} step={100} value={price} onInput={handleSliderInput} />
          <div className="sb-price-values">
            <span className="sb-price-val">₹{price[0].toLocaleString("en-IN")}</span>
            <span className="sb-price-divider-line">—</span>
            <span className="sb-price-val">₹{price[1].toLocaleString("en-IN")}</span>
          </div>
        </Section>

        {/* Colour */}
        {availableColors.length > 0 && (
          <Section title="Colour" open={openSections.color} onToggle={() => toggleSection("color")}>
            {renderOptions({
              title: "Colour", options: availableColors,
              selectedValues: internalColors,
              onToggle: c => setInternalColors(p => p.includes(c?.name) ? p.filter(x => x !== c.name) : [...p, c.name]),
              onApplySelection: v => setInternalColors(v),
              getOptionKey: c => c?.name,
              getOptionLabel: c => (
                <span className="sb-color-option">
                  {c?.code && <span className="sb-color-swatch" style={{ background: c.code }} />}
                  <span>{c?.name}</span>
                </span>
              ),
            })}
          </Section>
        )}

        {/* Availability */}
        <Section title="Availability" open={openSections.stock} onToggle={() => toggleSection("stock")}>
          <FormControlLabel
            control={<Checkbox size="small" />}
            checked={props.selectedStockStatus === "inStock"}
            onChange={() => props.setSelectedStockStatus?.(props.selectedStockStatus === "inStock" ? "all" : "inStock")}
            label="In Stock"
          />
          <FormControlLabel
            control={<Checkbox size="small" />}
            checked={props.selectedStockStatus === "outOfStock"}
            onChange={() => props.setSelectedStockStatus?.(props.selectedStockStatus === "outOfStock" ? "all" : "outOfStock")}
            label="Out of Stock"
          />
        </Section>

        {/* Discount */}
        <Section title="Discount" open={openSections.discount} onToggle={() => toggleSection("discount")}>
          {renderOptions({
            title: "Discount", options: discountBands,
            selectedValues: props.selectedDiscountRanges || [],
            onToggle: b => handleMultiSelect(props.selectedDiscountRanges, props.setSelectedDiscountRanges, b.min),
            onApplySelection: v => props.setSelectedDiscountRanges?.(v),
            getOptionKey: b => b.min, getOptionLabel: b => b.label,
          })}
        </Section>

        {/* Weight */}
        {stableOptions.weights.length > 0 && (
          <Section title="Weight" open={openSections.weight} onToggle={() => toggleSection("weight")}>
            {renderOptions({
              title: "Weight", options: stableOptions.weights,
              selectedValues: props.selectedWeights || [],
              onToggle: w => handleMultiSelect(props.selectedWeights, props.setSelectedWeights, w),
              onApplySelection: v => props.setSelectedWeights?.(v),
              getOptionKey: w => w, getOptionLabel: w => w,
            })}
          </Section>
        )}

        {/* RAM */}
        {stableOptions.ramOptions.length > 0 && (
          <Section title="RAM" open={openSections.ram} onToggle={() => toggleSection("ram")}>
            {renderOptions({
              title: "RAM", options: stableOptions.ramOptions,
              selectedValues: props.selectedRamOptions || [],
              onToggle: r => handleMultiSelect(props.selectedRamOptions, props.setSelectedRamOptions, r),
              onApplySelection: v => props.setSelectedRamOptions?.(v),
              getOptionKey: r => r, getOptionLabel: r => r,
            })}
          </Section>
        )}

        {/* Rating */}
        <Section title="Rating" open={openSections.rating} onToggle={() => toggleSection("rating")}>
          {[5, 4, 3, 2, 1].map(star => (
            <div key={star} className="sb-rating-row"
              onClick={() => setInternalRating(p => p.includes(star) ? p.filter(x => x !== star) : [...p, star])}>
              <Checkbox
                size="small" checked={internalRating.includes(star)}
                onChange={() => {}}
                style={{ padding: "4px 8px 4px 4px", color: internalRating.includes(star) ? "#0d0d12" : "#d1d5db" }}
              />
              <Rating value={star} size="small" readOnly />
              <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 4, fontWeight: 500 }}>& up</span>
            </div>
          ))}
        </Section>

      </div>

      {/* Action buttons */}
      <div className="sb-actions">
        <button className="sb-apply-btn" onClick={handleApplyFilters}>
          Apply
          {props.activeFiltersCount > 0 && <span className="sb-count">{props.activeFiltersCount}</span>}
        </button>
        <button className="sb-reset-btn" onClick={handleResetFilters}>
          <MdRefresh size={15} /> Reset
        </button>
      </div>

      {/* Mobile cancel */}
      <button className="sb-cancel-btn lg:!hidden" onClick={() => context?.setOpenFilter?.(false)}>
        <MdOutlineFilterAlt size={16} /> Close Filters
      </button>

      {/* ── Single unified FilterDialog ── */}
      {dialogCfg && (
        <FilterDialog
          open={Boolean(dialogCfg)}
          onClose={closeDialog}
          title={dialogCfg.title}
          options={dialogCfg.options}
          selectedValues={dialogCfg.selectedValues}
          onApplySelection={dialogCfg.onApplySelection}
          getOptionKey={dialogCfg.getOptionKey}
          getOptionLabel={dialogCfg.getOptionLabel}
        />
      )}
    </aside>
  );
};