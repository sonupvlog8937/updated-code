import React, { useState, useEffect, useContext } from 'react';
import SearchBox from '../../Components/SearchBox';
import { deleteData, editData, fetchDataFromApi, postData } from '../../utils/api';
import Pagination from "@mui/material/Pagination";
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { MyContext } from "../../App.jsx";

/* ─────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');

/* ── Root ── */
.ao { font-family: 'DM Sans', sans-serif; color: #111; }
.ao *, .ao *::before, .ao *::after { box-sizing: border-box; }

/* ── Page card ── */
.ao-page {
  background: #fff;
  border-radius: 20px;
  border: 1px solid #eaebf2;
  box-shadow: 0 2px 20px rgba(0,0,0,0.06);
  overflow: hidden;
  margin: 12px 0;
}

/* ── Top bar ── */
.ao-topbar {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f7;
}
.ao-topbar-left { flex: 1; min-width: 0; }
.ao-topbar-title {
  font-family: 'Sora', sans-serif;
  font-size: 17px; font-weight: 800;
  color: #0c0c14; letter-spacing: -0.025em;
  margin: 0 0 2px;
}
.ao-topbar-sub { font-size: 12px; color: #9ca3af; font-weight: 500; margin: 0; }
.ao-search-wrap { flex: 1; max-width: 320px; min-width: 200px; }
.ao-refresh-btn {
  background: #f0f0f7;
  border: 1px solid #e0e0e7;
  border-radius: 10px;
  padding: 10px 18px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}
.ao-refresh-btn:hover {
  background: #e8e8ef;
  border-color: #d0d0d7;
  transform: translateY(-1px);
}
.ao-refresh-btn:active {
  transform: translateY(0);
}
.ao-refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
.ao-refresh-icon {
  font-size: 16px;
  display: inline-flex;
}
.ao-refresh-icon.spinning {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Pulse animation for live location indicator */
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

/* ── Stats strip ── */
.ao-stats {
  display: flex; gap: 1px;
  background: #f0f0f7;
  border-bottom: 1px solid #f0f0f7;
}
.ao-stat {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px; padding: 12px 8px; background: #fafafa;
}
.ao-stat-n { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 800; line-height: 1; }
.ao-stat-l { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #9ca3af; }

/* ── Table ── */
.ao-scroll { overflow-x: auto; }
.ao-tbl { width: 100%; border-collapse: collapse; }
.ao-tbl thead tr { background: #f7f7fb; }
.ao-tbl th {
  padding: 10px 14px; text-align: left;
  font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: #6b7280;
  white-space: nowrap; border-bottom: 2px solid #eeeff8;
}
.ao-tbl td {
  padding: 12px 14px;
  border-bottom: 1px solid #f4f4f9;
  vertical-align: middle;
  font-size: 13px;
}
.ao-tbl tbody tr.ao-main-row { transition: background 0.12s; }
.ao-tbl tbody tr.ao-main-row:hover > td { background: #fafafd; }
.ao-tbl tbody tr.ao-main-row.expanded > td { background: #f7f7fb; }

/* Expand btn */
.ao-xbtn {
  width: 28px; height: 28px; border-radius: 8px;
  border: none; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  background: #f0f0f7; color: #6b7280;
  transition: all 0.15s; flex-shrink: 0;
}
.ao-xbtn:hover { background: #e4e4ef; }
.ao-xbtn.open { background: #111; color: #fff; }

/* ID */
.ao-oid { font-size: 11px; font-weight: 700; color: #6366f1; font-family: 'Sora', sans-serif; display: block; }
.ao-oid-full { font-size: 10px; color: #bbb; display: block; margin-top: 1px; white-space: nowrap; max-width: 110px; overflow: hidden; text-overflow: ellipsis; }

/* Payment badges */
.ao-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 5px;
  white-space: nowrap; letter-spacing: 0.03em;
}
.ao-badge-cod    { background: #fef3c7; color: #92400e; }
.ao-badge-online { background: #d1fae5; color: #065f46; }
.ao-badge-pid    { font-size: 10px; color: #9ca3af; display: block; margin-top: 2px; }

/* Customer cell */
.ao-cust-name  { font-weight: 600; color: #111; font-size: 13px; white-space: nowrap; }
.ao-cust-email { font-size: 11px; color: #9ca3af; margin-top: 1px; }
.ao-cust-phone { font-size: 11px; color: #6b7280; margin-top: 1px; }

/* Address cell */
.ao-addr-type { display: inline-block; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; padding: 2px 6px; border-radius: 3px; background: #f0f0f7; color: #374151; margin-bottom: 3px; }
.ao-addr-text { font-size: 12px; color: #374151; max-width: 160px; line-height: 1.4; }
.ao-addr-pin  { font-size: 11px; color: #9ca3af; margin-top: 1px; }

/* Amount */
.ao-amt { font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 800; color: #0c0c14; }

/* Delete btn */
.ao-del {
  display: inline-flex; align-items: center; gap: 4px;
  background: #fff0f0; color: #dc2626; border: 1px solid #fecaca;
  font-size: 11px; font-weight: 700; padding: 5px 10px; border-radius: 7px;
  cursor: pointer; font-family: 'DM Sans', sans-serif;
  transition: all 0.15s; white-space: nowrap;
}
.ao-del:hover { background: #fee2e2; border-color: #fca5a5; }

/* ── Expanded products panel ── */
.ao-panel-row > td {
  padding: 0 !important;
  border-bottom: 2px solid #e8e8f2 !important;
}
.ao-panel {
  background: #f7f7fb;
  padding: 16px 20px 20px 24px;
  animation: panelOpen 0.2s ease both;
}
@keyframes panelOpen {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.ao-panel-hdr {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
}
.ao-panel-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #374151; }
.ao-panel-count { font-size: 10px; font-weight: 700; background: #e4e4ef; color: #374151; padding: 2px 8px; border-radius: 20px; }
.ao-panel-hint  { font-size: 11px; color: #aaa; margin-bottom: 12px; }

/* Product cards */
.ao-prod-list { display: flex; flex-direction: column; gap: 7px; }
.ao-prod-card {
  display: flex; align-items: center; gap: 12px;
  background: #fff; border: 1.5px solid #eaebf2; border-radius: 12px;
  padding: 10px 14px; cursor: pointer;
  transition: all 0.18s ease;
  position: relative;
}
.ao-prod-card:hover {
  border-color: #6366f1;
  box-shadow: 0 4px 18px rgba(99,102,241,0.1);
  transform: translateX(4px);
}
.ao-prod-card::after {
  content: '↗';
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  font-size: 13px; color: #c7c7d6;
  transition: color 0.15s;
}
.ao-prod-card:hover::after { color: #6366f1; }
.ao-prod-img {
  width: 52px; height: 52px; border-radius: 10px;
  object-fit: cover; flex-shrink: 0;
  border: 1px solid #eaebf2;
}
.ao-prod-noimg {
  width: 52px; height: 52px; border-radius: 10px; flex-shrink: 0;
  background: #f0f0f7; display: flex; align-items: center; justify-content: center;
  color: #bbb; font-size: 20px;
}
.ao-prod-info { flex: 1; min-width: 0; }
.ao-prod-name { font-size: 13px; font-weight: 600; color: #111; margin-bottom: 5px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; max-width: 260px; }
.ao-prod-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.ao-prod-tag  { font-size: 10px; font-weight: 600; background: #f0f0f7; color: #6b7280; padding: 2px 7px; border-radius: 4px; }
.ao-prod-right { text-align: right; flex-shrink: 0; margin-right: 20px; }
.ao-prod-subtotal { font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 800; color: #111; }
.ao-prod-unit     { font-size: 10px; color: #9ca3af; margin-top: 1px; }

/* Order total row inside panel */
.ao-panel-total {
  display: flex; align-items: center; justify-content: flex-end; gap: 12px;
  padding-top: 12px; border-top: 2px solid #e8e8f2; margin-top: 10px;
}
.ao-panel-total-lbl { font-size: 12px; font-weight: 600; color: #6b7280; }
.ao-panel-total-amt { font-family: 'Sora', sans-serif; font-size: 17px; font-weight: 800; color: #0c0c14; }

/* ─────────────────────────────────────────
   PRODUCT DETAIL MODAL
───────────────────────────────────────── */
.ao-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(8, 8, 20, 0.55);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  animation: overlayIn 0.18s ease both;
}
@keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

.ao-modal {
  background: #fff; border-radius: 24px;
  width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 40px 100px rgba(0,0,0,0.22);
  animation: modalIn 0.28s cubic-bezier(0.34, 1.4, 0.64, 1) both;
  outline: none;
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.85) translateY(24px); }
  to   { opacity: 1; transform: scale(1)    translateY(0); }
}

/* Modal image area */
.ao-modal-imgbox {
  position: relative; height: 230px;
  background: #f0f0f7; border-radius: 24px 24px 0 0; overflow: hidden;
}
.ao-modal-imgbox img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.4s ease;
}
.ao-modal-imgbox:hover img { transform: scale(1.04); }
.ao-modal-noimg {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 56px; color: #ddd;
}
.ao-modal-close {
  position: absolute; top: 12px; right: 12px;
  width: 34px; height: 34px; border-radius: 50%;
  background: rgba(0,0,0,0.45); border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 16px;
  transition: background 0.15s;
}
.ao-modal-close:hover { background: rgba(0,0,0,0.7); }

/* Subtotal chip over image */
.ao-modal-chip {
  position: absolute; bottom: 12px; left: 12px;
  background: rgba(0,0,0,0.65); backdrop-filter: blur(4px);
  color: #fff; font-family: 'Sora', sans-serif;
  font-size: 15px; font-weight: 800;
  padding: 6px 14px; border-radius: 20px;
}

/* Modal body */
.ao-modal-body { padding: 22px 24px 28px; }
.ao-modal-name {
  font-family: 'Sora', sans-serif;
  font-size: 18px; font-weight: 800; color: #0c0c14;
  letter-spacing: -0.025em; margin: 0 0 4px; line-height: 1.3;
}
.ao-modal-pid { font-size: 11px; color: #9ca3af; font-weight: 500; margin: 0 0 18px; font-family: 'DM Sans', sans-serif; }

/* Price row */
.ao-modal-pricerow { display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px; }
.ao-modal-price { font-family: 'Sora', sans-serif; font-size: 26px; font-weight: 800; color: #0c0c14; }
.ao-modal-per   { font-size: 12px; color: #9ca3af; }

/* Qty × price math */
.ao-modal-math {
  display: inline-flex; align-items: center; gap: 6px;
  background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;
  padding: 5px 12px; margin-bottom: 20px;
  font-size: 12px; font-weight: 600; color: #065f46;
}

.ao-modal-divider { height: 1px; background: #f0f0f7; margin: 18px 0; }

/* Attributes grid */
.ao-modal-attrs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.ao-modal-attr { background: #f7f7fb; border-radius: 10px; padding: 10px 14px; }
.ao-modal-attr-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #9ca3af; margin-bottom: 4px; }
.ao-modal-attr-val { font-size: 13px; font-weight: 600; color: #111; display: flex; align-items: center; gap: 6px; }
.ao-modal-color-dot { width: 13px; height: 13px; border-radius: 50%; border: 1px solid #e5e7eb; flex-shrink: 0; }

/* Footer buttons */
.ao-modal-footer { display: flex; gap: 8px; }
.ao-modal-btn-p {
  flex: 1; height: 44px; border-radius: 12px;
  background: #0c0c14; color: #fff; border: none; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  text-decoration: none; transition: all 0.18s;
}
.ao-modal-btn-p:hover { background: #1f1f2e; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(12,12,20,0.2); }
.ao-modal-btn-s {
  height: 44px; padding: 0 18px; border-radius: 12px;
  background: #f0f0f7; color: #374151; border: none; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
  transition: all 0.15s;
}
.ao-modal-btn-s:hover { background: #e4e4ef; }

/* ── Empty state ── */
.ao-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 56px 24px; gap: 8px; text-align: center;
}
.ao-empty-icon { font-size: 44px; margin-bottom: 4px; }
.ao-empty h3 { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 700; color: #374151; margin: 0; }
.ao-empty p  { font-size: 12px; color: #9ca3af; margin: 0; }

/* ── Pagination ── */
.ao-page-footer { display: flex; justify-content: center; padding: 18px 24px 20px; }


/* ── Receipt button ── */
.ao-receipt-btn {
  display: inline-flex; align-items: center; gap: 4px;
  background: #f0f7ff; color: #2563eb; border: 1px solid #bfdbfe;
  font-size: 11px; font-weight: 700; padding: 5px 10px; border-radius: 7px;
  cursor: pointer; font-family: 'DM Sans', sans-serif;
  transition: all 0.15s; white-space: nowrap;
}
.ao-receipt-btn:hover { background: #dbeafe; border-color: #93c5fd; }

/* ═══════════════════════════════════
   RECEIPT MODAL
═══════════════════════════════════ */
.ao-rcpt-overlay {
  position: fixed; inset: 0; z-index: 9998;
  background: rgba(4,6,15,0.65);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  animation: overlayIn 0.2s ease both;
}
.ao-rcpt-sheet {
  background: #fff;
  border-radius: 20px;
  width: 100%; max-width: 640px; max-height: 92vh;
  overflow-y: auto; overflow-x: hidden;
  box-shadow: 0 32px 80px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.05);
  animation: modalIn 0.3s cubic-bezier(0.34,1.4,0.64,1) both;
  position: relative;
}

/* header gradient */
.ao-rcpt-head {
  background: linear-gradient(135deg, #0c0c14 0%, #1e1b4b 60%, #312e81 100%);
  padding: 28px 28px 22px;
  position: relative; overflow: hidden;
}
.ao-rcpt-head::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at top right, rgba(99,102,241,0.3) 0%, transparent 60%);
}
.ao-rcpt-head-top {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  position: relative; z-index: 1;
}
.ao-rcpt-brand { display: flex; align-items: center; gap: 10px; }
.ao-rcpt-brand-icon {
  width: 40px; height: 40px; background: rgba(255,255,255,0.12);
  border-radius: 10px; border: 1px solid rgba(255,255,255,0.18);
  display: flex; align-items: center; justify-content: center; font-size: 20px;
}
.ao-rcpt-brand-name { font-family:'Sora',sans-serif; font-size:15px; font-weight:800; color:#fff; letter-spacing:-0.02em; }
.ao-rcpt-brand-sub  { font-size:10px; color:rgba(255,255,255,0.5); margin-top:1px; }
.ao-rcpt-close-btn {
  width:32px; height:32px; border-radius:50%;
  background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15);
  cursor:pointer; color:#fff; font-size:15px;
  display:flex; align-items:center; justify-content:center;
  transition:background .15s; flex-shrink:0;
}
.ao-rcpt-close-btn:hover { background:rgba(255,255,255,0.22); }

.ao-rcpt-head-mid {
  margin-top: 22px; position: relative; z-index: 1;
}
.ao-rcpt-title { font-family:'Sora',sans-serif; font-size:22px; font-weight:800; color:#fff; letter-spacing:-0.03em; margin:0 0 6px; }
.ao-rcpt-meta-row { display:flex; flex-wrap:wrap; gap:10px; margin-top:6px; }
.ao-rcpt-meta-chip {
  display:inline-flex; align-items:center; gap:5px;
  background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15);
  border-radius:99px; padding:4px 10px; font-size:11px; color:rgba(255,255,255,0.8); font-weight:600;
}
.ao-rcpt-status-chip {
  display:inline-flex; align-items:center; gap:5px;
  border-radius:99px; padding:4px 12px; font-size:11px; font-weight:700;
}

/* tear edge */
.ao-rcpt-tear {
  width:100%; height:14px; background:#fff; position:relative; overflow:hidden;
}
.ao-rcpt-tear::before {
  content:''; position:absolute; top:-14px; left:0; right:0; height:28px;
  background: radial-gradient(circle at 50% 0%, #fff 10px, transparent 10px);
  background-size: 28px 28px; background-repeat: repeat-x;
}

/* body */
.ao-rcpt-body { padding: 20px 28px 28px; }

/* section labels */
.ao-rcpt-sec-lbl {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;
  color: #9ca3af; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;
}
.ao-rcpt-sec-lbl::after { content:''; flex:1; height:1px; background:#f0f0f7; }

/* customer + address cards */
.ao-rcpt-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
@media(max-width:500px){ .ao-rcpt-2col { grid-template-columns:1fr; } }

.ao-rcpt-info-card {
  background: #f8fafc; border: 1px solid #e8e8f2; border-radius: 12px; padding: 14px 16px;
}
.ao-rcpt-info-title {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
  color: #9ca3af; margin-bottom: 8px; display: flex; align-items: center; gap: 5px;
}
.ao-rcpt-info-name { font-size: 14px; font-weight: 700; color: #0c0c14; margin-bottom: 3px; }
.ao-rcpt-info-line { font-size: 12px; color: #4b5563; margin-bottom: 2px; line-height: 1.5; }
.ao-rcpt-info-muted { font-size: 11px; color: #9ca3af; }

/* products table */
.ao-rcpt-prod-table { width:100%; border-collapse:collapse; margin-bottom:0; }
.ao-rcpt-prod-table th {
  padding: 8px 10px; font-size:10px; font-weight:700; letter-spacing:0.08em;
  text-transform:uppercase; color:#9ca3af; border-bottom:2px solid #f0f0f7;
  text-align:left;
}
.ao-rcpt-prod-table th:last-child { text-align:right; }
.ao-rcpt-prod-table td { padding:11px 10px; border-bottom:1px solid #f7f7fb; vertical-align:middle; }
.ao-rcpt-prod-table tr:last-child td { border-bottom:none; }
.ao-rcpt-prod-table tr:hover td { background:#fafafd; }

.ao-rcpt-prod-img {
  width:42px; height:42px; border-radius:8px; object-fit:cover; border:1px solid #e8e8f2; flex-shrink:0;
}
.ao-rcpt-prod-noimg {
  width:42px; height:42px; border-radius:8px; background:#f0f0f7;
  display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;
}
.ao-rcpt-prod-name { font-size:13px; font-weight:600; color:#111; margin-bottom:3px; }
.ao-rcpt-prod-attr { font-size:10px; color:#9ca3af; }
.ao-rcpt-prod-amt  { font-family:'Sora',sans-serif; font-size:13px; font-weight:800; color:#0c0c14; text-align:right; white-space:nowrap; }
.ao-rcpt-prod-unit { font-size:10px; color:#9ca3af; text-align:right; white-space:nowrap; }

/* totals */
.ao-rcpt-totals {
  background:#f8fafc; border:1px solid #e8e8f2; border-radius:12px; padding:14px 16px; margin-top:14px;
}
.ao-rcpt-total-row { display:flex; justify-content:space-between; align-items:center; padding:4px 0; font-size:13px; }
.ao-rcpt-total-row.sub { color:#6b7280; }
.ao-rcpt-total-row.grand { border-top:2px solid #e8e8f2; margin-top:8px; padding-top:10px; }
.ao-rcpt-total-row.grand .ao-rcpt-total-lbl { font-family:'Sora',sans-serif; font-size:14px; font-weight:800; color:#0c0c14; }
.ao-rcpt-total-row.grand .ao-rcpt-total-val { font-family:'Sora',sans-serif; font-size:18px; font-weight:800; color:#0c0c14; }

/* payment info */
.ao-rcpt-pay-row {
  display:flex; align-items:center; gap:8px; padding:12px 14px;
  background:#f8fafc; border:1px solid #e8e8f2; border-radius:10px; margin-top:14px;
}
.ao-rcpt-pay-icon { font-size:18px; }
.ao-rcpt-pay-label { font-size:12px; font-weight:600; color:#374151; }
.ao-rcpt-pay-sub   { font-size:10px; color:#9ca3af; }

/* footer */
.ao-rcpt-footer {
  display:flex; gap:8px; padding:16px 28px 24px; border-top:1px solid #f0f0f7; flex-wrap:wrap;
}
.ao-rcpt-btn-print {
  flex:1; min-width:120px; height:44px; border-radius:12px;
  background:linear-gradient(135deg,#2563eb,#1d4ed8); color:#fff;
  border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:700;
  display:flex; align-items:center; justify-content:center; gap:7px;
  transition:all .18s; box-shadow:0 4px 14px rgba(37,99,235,.3);
}
.ao-rcpt-btn-print:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(37,99,235,.4); }
.ao-rcpt-btn-close {
  height:44px; padding:0 20px; border-radius:12px;
  background:#f0f0f7; color:#374151; border:none; cursor:pointer;
  font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; transition:all .15s;
}
.ao-rcpt-btn-close:hover { background:#e4e4ef; }

/* ── PRINT STYLES ── */
@media print {
  body * { visibility: hidden !important; }
  .ao-rcpt-printable, .ao-rcpt-printable * { visibility: visible !important; }
  .ao-rcpt-printable {
    position: fixed !important; inset: 0 !important; z-index: 99999 !important;
    background: #fff !important; padding: 24px !important;
    max-height: none !important; overflow: visible !important;
    border-radius: 0 !important; box-shadow: none !important;
  }
  .ao-rcpt-footer { display: none !important; }
  .ao-rcpt-close-btn { display: none !important; }
  .ao-rcpt-head { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .ao-rcpt-tear { display:none; }
}

/* ── Status select override ── */
.ao-status-sel .MuiOutlinedInput-root { border-radius: 8px !important; font-size: 12px !important; font-family: 'DM Sans', sans-serif !important; font-weight: 600 !important; }
.ao-status-sel .MuiSelect-select { padding: 6px 10px !important; font-size: 12px !important; font-weight: 600 !important; }
.ao-status-sel fieldset { border-color: #eaebf2 !important; }
`;

/* ── helpers ── */
const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }) : "—";

/* ── Status badge ── */
const STATUS_COLORS = {
  pending:    { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
  confirm:    { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
  processing: { bg: "#ede9fe", color: "#5b21b6", dot: "#8b5cf6" },
  shipped:    { bg: "#e0f2fe", color: "#0369a1", dot: "#0ea5e9" },
  delivered:  { bg: "#d1fae5", color: "#065f46", dot: "#16a34a" },
  cancelled:  { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
  refunded:   { bg: "#ccfbf1", color: "#0f766e", dot: "#14b8a6" },
};
const getStatusStyle = (s = "") => STATUS_COLORS[s.toLowerCase()] || { bg: "#f0f0f7", color: "#374151", dot: "#9ca3af" };

/* ═══════════════════════════════════════════════════════
   PRODUCT DETAIL MODAL sonu
═══════════════════════════════════════════════════════ */
const ProductModal = ({ item, onClose }) => {
  // close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (!item) return null;

  const subtotal = (item.price || 0) * (item.quantity || 1);
  const attrs = [
    item.quantity  && { label: "Quantity", value: `× ${item.quantity}` },
    item.color     && { label: "Color",    value: item.color, isColor: true },
    item.size      && { label: "Size",     value: item.size },
    item.weight    && { label: "Weight",   value: item.weight },
    item.ram       && { label: "RAM",      value: item.ram },
    item.brand     && { label: "Brand",    value: item.brand },
  ].filter(Boolean);

  // Add selected options to attrs if they exist
  if (item.selectedOptions && typeof item.selectedOptions === 'object') {
    Object.entries(item.selectedOptions).forEach(([key, value]) => {
      if (value) {
        attrs.push({ label: key.charAt(0).toUpperCase() + key.slice(1), value: String(value) });
      }
    });
  }

  return (
    <div className="ao-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ao-modal" role="dialog" aria-modal="true">
        {/* Image */}
        <div className="ao-modal-imgbox">
          {item.image
            ? <img src={item.image} alt={item.productTitle} />
            : <div className="ao-modal-noimg">🖼️</div>
          }
          <button className="ao-modal-close" onClick={onClose} aria-label="Close">✕</button>
          <div className="ao-modal-chip">{fmt(subtotal)}</div>
        </div>

        {/* Body */}
        <div className="ao-modal-body">
          <h3 className="ao-modal-name">{item.productTitle || "—"}</h3>
          <p className="ao-modal-pid">
            Product ID: {item.productId || item._id || "—"}
          </p>

          {/* Price */}
          <div className="ao-modal-pricerow">
            <span className="ao-modal-price">{fmt(item.price)}</span>
            <span className="ao-modal-per">per unit</span>
          </div>
          <div className="ao-modal-math">
            <span>{fmt(item.price)}</span>
            <span style={{ color: "#9ca3af" }}>×</span>
            <span>{item.quantity} qty</span>
            <span style={{ color: "#9ca3af", margin: "0 2px" }}>=</span>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 800 }}>{fmt(subtotal)}</span>
          </div>

          {/* Attributes */}
          {attrs.length > 0 && (
            <>
              <div className="ao-modal-divider" />
              <div className="ao-modal-attrs">
                {attrs.map((a, i) => (
                  <div className="ao-modal-attr" key={i}>
                    <div className="ao-modal-attr-lbl">{a.label}</div>
                    <div className="ao-modal-attr-val">
                      {a.isColor && (
                        <span className="ao-modal-color-dot" style={{ background: a.value }} />
                      )}
                      {a.value}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="ao-modal-divider" />

          {/* Footer */}
          <div className="ao-modal-footer">
            <a
              href={`/product/${item.productId || item._id}`}
              target="_blank"
              rel="noreferrer"
              className="ao-modal-btn-p"
            >
              <span>↗</span> View Product Page
            </a>
            <button className="ao-modal-btn-s" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════
   RECEIPT MODAL
═══════════════════════════════════════════════════════ */
const ReceiptModal = ({ order, onClose }) => {
  const printRef = React.useRef();
  const [commerceSettings, setCommerceSettings] = useState({ shippingFee: 0, deliveryFee: 0, freeShippingAbove: 0 });
  const context = useContext(MyContext);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Fetch commerce settings for fallback pricing
  useEffect(() => {
    fetchDataFromApi("/api/settings/commerce")
      .then((res) => {
        if (res?.data) {
          setCommerceSettings(res.data);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch commerce settings:", error);
      });
  }, []);

  if (!order) return null;

  const addr      = order?.delivery_address || {};
  const user      = order?.userId || {};
  const allProducts = order?.products || [];
  const isCOD     = !order?.paymentId;
  const sc        = getStatusStyle(order?.order_status);

  // Filter products for seller view - only show products that belong to this seller
  const isSellerView = SELLER_ROLES.includes(context?.userData?.role);
  const isDeliveryRider = context?.userData?.role === "DELIVERY_RIDER";
  const currentSellerId = context?.userData?._id || context?.userData?.id;
  
  const products = isSellerView && currentSellerId
    ? allProducts.filter((p) => {
        // Handle different sellerId structures
        const productSellerId = p.sellerId?._id || p.sellerId;
        return String(productSellerId) === String(currentSellerId);
      })
    : allProducts;
  
  console.log('ReceiptModal Debug:', {
    isSellerView,
    currentSellerId,
    allProductsCount: allProducts.length,
    filteredProductsCount: products.length,
    sampleProduct: allProducts[0],
  });

  // Subtotal = sum of (price × qty)
  const subtotal  = products.reduce((s, p) => s + (p.price || 0) * (p.quantity || 1), 0);
  const discount = order?.discount_amount || 0;
  const baseAfterDiscount = Math.max(subtotal - discount, 0);
  
  // Use order's fees if available, otherwise use commerce settings
  const hasOrderFees = (order?.shippingFee !== undefined && order?.shippingFee !== null) || 
                       (order?.deliveryFee !== undefined && order?.deliveryFee !== null);
  
  let shippingFee = 0;
  let deliveryFee = 0;
  
  if (hasOrderFees) {
    // Order has fees saved - use them
    shippingFee = order?.shippingFee || 0;
    deliveryFee = order?.deliveryFee || 0;
  } else if (commerceSettings.shippingFee > 0 || commerceSettings.deliveryFee > 0) {
    // Fallback to commerce settings for old orders
    const freeByRule = commerceSettings.freeShippingAbove > 0 && baseAfterDiscount >= commerceSettings.freeShippingAbove;
    shippingFee = freeByRule ? 0 : Number(commerceSettings.shippingFee || 0);
    deliveryFee = freeByRule ? 0 : Number(commerceSettings.deliveryFee || 0);
  }
  
  // For sellers: show their product subtotal + full order fees
  // For admin: show full order total
  const total = isSellerView 
    ? (subtotal + shippingFee + deliveryFee) 
    : (order?.totalAmt || (subtotal - discount + shippingFee + deliveryFee));

  const orderId   = order._id?.slice(-10).toUpperCase();
  const orderDate = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" })
    : "—";

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    el.classList.add("ao-rcpt-printable");
    window.print();
    el.classList.remove("ao-rcpt-printable");
  };

  return (
    <div className="ao-rcpt-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ao-rcpt-sheet" ref={printRef} role="dialog" aria-modal="true">

        {/* ── HEADER ── */}
        <div className="ao-rcpt-head">
          <div className="ao-rcpt-head-top">
            <div className="ao-rcpt-brand">
              <div className="ao-rcpt-brand-icon">🛍️</div>
              <div>
                <div className="ao-rcpt-brand-name">Zeedaddy</div>
                <div className="ao-rcpt-brand-sub">Order Receipt</div>
              </div>
            </div>
            <button className="ao-rcpt-close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="ao-rcpt-head-mid">
            <p className="ao-rcpt-title">Order #{orderId}</p>
            <div className="ao-rcpt-meta-row">
              <span className="ao-rcpt-meta-chip">📅 {orderDate}</span>
              <span className="ao-rcpt-meta-chip">📦 {products.length} item{products.length !== 1 ? "s" : ""}</span>
              <span
                className="ao-rcpt-status-chip"
                style={{ background: sc.bg, color: sc.color }}
              >
                <span style={{ width:6, height:6, borderRadius:"50%", background:sc.dot, display:"inline-block" }}></span>
                {(order?.order_status || "pending").toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* tear edge */}
        <div className="ao-rcpt-tear" />

        {/* ── BODY ── */}
        <div className="ao-rcpt-body">

          {/* Customer + Address */}
          <div className="ao-rcpt-2col">

            {/* Customer */}
            <div className="ao-rcpt-info-card">
              <div className="ao-rcpt-info-title">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                Customer
              </div>
              <div className="ao-rcpt-info-name">{user?.name || "—"}</div>
              {user?.email && <div className="ao-rcpt-info-line">✉ {user.email}</div>}
              {addr?.mobile && <div className="ao-rcpt-info-line">📞 {addr.mobile}</div>}
              {user?.createdAt && (
                <div className="ao-rcpt-info-muted">
                  Member since {new Date(user.createdAt).getFullYear()}
                </div>
              )}
            </div>

            {/* Delivery Address */}
            <div className="ao-rcpt-info-card">
              <div className="ao-rcpt-info-title">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                Delivery Address
              </div>
              {addr?.addressType && (
                <div style={{ display:"inline-block", fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", background:"#ede9fe", color:"#5b21b6", padding:"2px 7px", borderRadius:4, marginBottom:6 }}>
                  {addr.addressType}
                </div>
              )}
              {addr?.address   && <div className="ao-rcpt-info-line">{addr.address}</div>}
              {addr?.landmark  && <div className="ao-rcpt-info-line">{addr.landmark}</div>}
              <div className="ao-rcpt-info-line">
                {[addr.city, addr.state].filter(Boolean).join(", ")}
                {addr.pincode && ` – ${addr.pincode}`}
              </div>
              {addr?.country && <div className="ao-rcpt-info-muted">{addr.country}</div>}
              {addr?.latitude && addr?.longitude && (
                <div style={{ marginTop: '8px' }}>
                  <a
                    href={`https://www.google.com/maps?q=${addr.latitude},${addr.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#2563eb',
                      textDecoration: 'none',
                      padding: '4px 10px',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '6px',
                      transition: 'all 0.15s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#dbeafe';
                      e.currentTarget.style.borderColor = '#93c5fd';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#eff6ff';
                      e.currentTarget.style.borderColor = '#bfdbfe';
                    }}
                  >
                    📍 View on Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* User's Current Location (Go Market) - Show if user clicked "Use Current Location" */}
          {order?.goMarketData?.userLocation?.coordinates && order.goMarketData.userLocation.coordinates[0] !== 0 && order.goMarketData.userLocation.coordinates[1] !== 0 && (
            <div style={{ marginTop: '16px' }}>
              <div className="ao-rcpt-info-card" style={{ background: '#ecfdf5', border: '1.5px solid #86efac' }}>
                <div className="ao-rcpt-info-title" style={{ color: '#15803d' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  Customer's Current Location (Go Market)
                </div>
                <div style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  background: '#d1fae5',
                  color: '#065f46',
                  padding: '3px 8px',
                  borderRadius: 5,
                  marginBottom: 8
                }}>
                  <span style={{ 
                    width: 6, 
                    height: 6, 
                    background: '#10b981', 
                    borderRadius: '50%',
                    display: 'inline-block'
                  }} />
                  Live GPS Location
                </div>
                <div className="ao-rcpt-info-line" style={{ fontWeight: 600, color: '#065f46', fontSize: '12px' }}>
                  📍 {order.goMarketData.userLocation.coordinates[1].toFixed(6)}, {order.goMarketData.userLocation.coordinates[0].toFixed(6)}
                </div>
                {order.goMarketData.distanceDisplay && (
                  <div className="ao-rcpt-info-line" style={{ color: '#059669', fontSize: '11px', marginTop: '4px' }}>
                    📏 Distance: {order.goMarketData.distanceDisplay}
                  </div>
                )}
                {order.goMarketData.userLocation.address && (
                  <div className="ao-rcpt-info-line" style={{ color: '#047857', fontSize: '11px', marginTop: '4px' }}>
                    {order.goMarketData.userLocation.address}
                  </div>
                )}
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <a
                    href={`https://www.google.com/maps?q=${order.goMarketData.userLocation.coordinates[1]},${order.goMarketData.userLocation.coordinates[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#15803d',
                      textDecoration: 'none',
                      padding: '5px 12px',
                      background: '#bbf7d0',
                      border: '1px solid #86efac',
                      borderRadius: '6px',
                      transition: 'all 0.15s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#a7f3d0';
                      e.currentTarget.style.borderColor = '#6ee7b7';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#bbf7d0';
                      e.currentTarget.style.borderColor = '#86efac';
                    }}
                  >
                    🗺️ View on Map
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${order.goMarketData.userLocation.coordinates[1]},${order.goMarketData.userLocation.coordinates[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#2563eb',
                      textDecoration: 'none',
                      padding: '5px 12px',
                      background: '#dbeafe',
                      border: '1px solid #93c5fd',
                      borderRadius: '6px',
                      transition: 'all 0.15s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#bfdbfe';
                      e.currentTarget.style.borderColor = '#60a5fa';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#dbeafe';
                      e.currentTarget.style.borderColor = '#93c5fd';
                    }}
                  >
                    🧭 Get Directions
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Products */}
          <div className="ao-rcpt-sec-lbl">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            Order Items
          </div>

          <div style={{ border:"1px solid #e8e8f2", borderRadius:12, overflow:"hidden" }}>
            {products.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#9ca3af" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>📦</div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280" }}>
                  {isSellerView ? "No products from your store in this order" : "No products found"}
                </div>
              </div>
            ) : (
              <table className="ao-rcpt-prod-table">
                <thead style={{ background:"#f8fafc" }}>
                  <tr>
                    <th style={{ paddingLeft:14 }}>Product</th>
                    <th style={{ textAlign:"center", width:60 }}>Qty</th>
                    <th style={{ textAlign:"right", paddingRight:14 }}>Amount</th>
                  </tr>
                </thead>
              <tbody>
                {products.map((item, i) => {
                  const attrParts = [item.color, item.size, item.weight, item.ram].filter(Boolean);
                  
                  // Add selected options if they exist
                  if (item.selectedOptions && typeof item.selectedOptions === 'object') {
                    Object.entries(item.selectedOptions).forEach(([key, value]) => {
                      if (value) {
                        attrParts.push(`${key}: ${value}`);
                      }
                    });
                  }
                  
                  const attrs = attrParts.join(" · ");
                  
                  // Get seller info for this product (for delivery riders)
                  const seller = item.sellerId;
                  const sellerProfile = seller?.sellerProfile || seller?.storeProfile || {};
                  const storeName = sellerProfile?.storeName || seller?.name || 'N/A';
                  const storeAddress = sellerProfile?.storeAddress || sellerProfile?.address || '';
                  const phone = seller?.mobile || seller?.phone || sellerProfile?.mobile || '';
                  const storeLatitude = sellerProfile?.latitude || sellerProfile?.storeLatitude;
                  const storeLongitude = sellerProfile?.longitude || sellerProfile?.storeLongitude;
                  
                  // Current/live location (if available, different from store address)
                  const currentLatitude = seller?.currentLatitude || seller?.liveLatitude;
                  const currentLongitude = seller?.currentLongitude || seller?.liveLongitude;
                  const hasCurrentLocation = currentLatitude && currentLongitude;
                  const locationUpdatedAt = seller?.locationUpdatedAt;
                  
                  return (
                    <React.Fragment key={i}>
                      <tr>
                        <td style={{ paddingLeft:14 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            {item.image
                              ? <img src={item.image} alt={item.productTitle} className="ao-rcpt-prod-img" />
                              : <div className="ao-rcpt-prod-noimg">🖼️</div>
                            }
                            <div>
                              <div className="ao-rcpt-prod-name">{item.productTitle || "—"}</div>
                              {attrs && <div className="ao-rcpt-prod-attr">{attrs}</div>}
                              <div className="ao-rcpt-prod-attr" style={{ marginTop:2 }}>{fmt(item.price)} / unit</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign:"center", fontWeight:700, fontSize:13 }}>×{item.quantity || 1}</td>
                        <td style={{ paddingRight:14 }}>
                          <div className="ao-rcpt-prod-amt">{fmt((item.price || 0) * (item.quantity || 1))}</div>
                        </td>
                      </tr>
                      
                      {/* Seller info row - only for delivery riders */}
                      {isDeliveryRider && seller && (
                        <tr>
                          <td colSpan="3" style={{ paddingLeft:14, paddingRight:14, paddingTop:4, paddingBottom:10, background:"#fffbeb", borderBottom:"1px solid #fef3c7" }}>
                            <div style={{ 
                              display:"flex", 
                              alignItems:"center", 
                              gap:10, 
                              background:"#fff", 
                              border:"1px solid #fde68a", 
                              borderRadius:8, 
                              padding:"8px 12px"
                            }}>
                              {/* Store icon */}
                              <div style={{ 
                                width:32, 
                                height:32, 
                                background:"#fef3c7", 
                                borderRadius:6, 
                                display:"flex", 
                                alignItems:"center", 
                                justifyContent:"center", 
                                fontSize:16,
                                flexShrink:0
                              }}>
                                🏪
                              </div>
                              
                              {/* Seller details */}
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ 
                                  fontSize:12, 
                                  fontWeight:700, 
                                  color:"#92400e", 
                                  marginBottom:3,
                                  display:"flex",
                                  alignItems:"center",
                                  gap:6
                                }}>
                                  <span>Pickup from: {storeName}</span>
                                  {storeLatitude && storeLongitude && (
                                    <a
                                      href={`https://www.google.com/maps?q=${storeLatitude},${storeLongitude}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display:"inline-flex",
                                        alignItems:"center",
                                        gap:3,
                                        fontSize:10,
                                        fontWeight:600,
                                        color:"#2563eb",
                                        textDecoration:"none",
                                        padding:"2px 6px",
                                        background:"#dbeafe",
                                        border:"1px solid #93c5fd",
                                        borderRadius:4,
                                        transition:"all 0.15s"
                                      }}
                                      onMouseOver={(e) => {
                                        e.currentTarget.style.background = "#bfdbfe";
                                      }}
                                      onMouseOut={(e) => {
                                        e.currentTarget.style.background = "#dbeafe";
                                      }}
                                    >
                                      📍 Navigate
                                    </a>
                                  )}
                                </div>
                                <div style={{ 
                                  fontSize:11, 
                                  color:"#78716c",
                                  display:"flex",
                                  flexWrap:"wrap",
                                  gap:8,
                                  alignItems:"center"
                                }}>
                                  {storeAddress && (
                                    <span>📍 {storeAddress}</span>
                                  )}
                                  {phone && (
                                    <span>
                                      📞 <a 
                                        href={`tel:${phone}`} 
                                        style={{ 
                                          color:"#2563eb", 
                                          textDecoration:"none", 
                                          fontWeight:600 
                                        }}
                                      >
                                        {phone}
                                      </a>
                                    </span>
                                  )}
                                </div>
                                
                                {/* Current Location - Live location of seller */}
                                {hasCurrentLocation && (
                                  <div style={{ 
                                    marginTop: 8,
                                    padding: "6px 10px",
                                    background: "#dcfce7",
                                    border: "1px solid #86efac",
                                    borderRadius: 6,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    fontSize: 11
                                  }}>
                                    <span style={{ 
                                      width: 6, 
                                      height: 6, 
                                      background: "#16a34a", 
                                      borderRadius: "50%",
                                      display: "inline-block",
                                      animation: "pulse 2s infinite"
                                    }} />
                                    <span style={{ fontWeight: 600, color: "#15803d" }}>
                                      Current Location:
                                    </span>
                                    <a
                                      href={`https://www.google.com/maps?q=${currentLatitude},${currentLongitude}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        color: "#15803d",
                                        textDecoration: "none",
                                        fontWeight: 600
                                      }}
                                    >
                                      {currentLatitude.toFixed(6)}, {currentLongitude.toFixed(6)}
                                    </a>
                                    <a
                                      href={`https://www.google.com/maps?q=${currentLatitude},${currentLongitude}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display:"inline-flex",
                                        alignItems:"center",
                                        gap:3,
                                        fontSize:10,
                                        fontWeight:600,
                                        color:"#15803d",
                                        textDecoration:"none",
                                        padding:"2px 6px",
                                        background:"#bbf7d0",
                                        border:"1px solid #86efac",
                                        borderRadius:4,
                                        transition:"all 0.15s",
                                        marginLeft: "auto"
                                      }}
                                      onMouseOver={(e) => {
                                        e.currentTarget.style.background = "#a7f3d0";
                                      }}
                                      onMouseOut={(e) => {
                                        e.currentTarget.style.background = "#bbf7d0";
                                      }}
                                    >
                                      🚀 Track Live
                                    </a>
                                    {locationUpdatedAt && (
                                      <span style={{ 
                                        fontSize: 9, 
                                        color: "#16a34a",
                                        marginLeft: 4
                                      }}>
                                        {(() => {
                                          const now = new Date();
                                          const updated = new Date(locationUpdatedAt);
                                          const diffMinutes = Math.floor((now - updated) / (1000 * 60));
                                          if (diffMinutes < 1) return "Just now";
                                          if (diffMinutes < 60) return `${diffMinutes}m ago`;
                                          const diffHours = Math.floor(diffMinutes / 60);
                                          return `${diffHours}h ago`;
                                        })()}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            )}
          </div>

          {/* Totals */}
          <div className="ao-rcpt-totals">
            <div className="ao-rcpt-total-row sub">
              <span style={{ fontWeight:500 }}>Subtotal</span>
              <span style={{ fontWeight:600 }}>{fmt(subtotal)}</span>
            </div>
            {!isSellerView && discount > 0 && (
              <div className="ao-rcpt-total-row sub">
                <span style={{ fontWeight:500, color:"#16a34a" }}>Discount</span>
                <span style={{ fontWeight:600, color:"#16a34a" }}>-{fmt(discount)}</span>
              </div>
            )}
            {shippingFee > 0 ? (
              <div className="ao-rcpt-total-row sub">
                <span style={{ fontWeight:500 }}>Shipping Fee</span>
                <span style={{ fontWeight:600 }}>{fmt(shippingFee)}</span>
              </div>
            ) : (
              <div className="ao-rcpt-total-row sub">
                <span style={{ fontWeight:500 }}>Shipping Fee</span>
                <span style={{ fontWeight:600, color:"#16a34a" }}>FREE</span>
              </div>
            )}
            {deliveryFee > 0 ? (
              <div className="ao-rcpt-total-row sub">
                <span style={{ fontWeight:500 }}>Delivery Fee</span>
                <span style={{ fontWeight:600 }}>{fmt(deliveryFee)}</span>
              </div>
            ) : (
              <div className="ao-rcpt-total-row sub">
                <span style={{ fontWeight:500 }}>Delivery Fee</span>
                <span style={{ fontWeight:600, color:"#16a34a" }}>FREE</span>
              </div>
            )}
            <div className="ao-rcpt-total-row grand">
              <span className="ao-rcpt-total-lbl">{isSellerView ? "Your Total (with fees)" : "Grand Total"}</span>
              <span className="ao-rcpt-total-val">{fmt(total)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="ao-rcpt-pay-row">
            <div className="ao-rcpt-pay-icon">{isCOD ? "💵" : "💳"}</div>
            <div style={{ flex:1 }}>
              <div className="ao-rcpt-pay-label">{isCOD ? "Cash on Delivery" : "Online Payment"}</div>
              {!isCOD && order?.paymentId && (
                <div className="ao-rcpt-pay-sub">Txn ID: {order.paymentId}</div>
              )}
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:11, fontWeight:700, color: isCOD ? "#92400e" : "#065f46", background: isCOD ? "#fef3c7" : "#d1fae5", padding:"3px 9px", borderRadius:6 }}>
                {isCOD ? "PAY ON DELIVERY" : "PAID"}
              </div>
            </div>
          </div>

          {/* Thank you note */}
          <div style={{ textAlign:"center", padding:"22px 0 4px" }}>
            <div style={{ fontSize:20, marginBottom:6 }}>🎉</div>
            <p style={{ fontFamily:"'Sora',sans-serif", fontSize:13, fontWeight:700, color:"#0c0c14", margin:"0 0 3px" }}>
              Thank you for your order!
            </p>
            <p style={{ fontSize:11, color:"#9ca3af", margin:0 }}>
              Keep this receipt for your records. For support, contact us with Order ID #{orderId}.
            </p>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="ao-rcpt-footer">
          <button className="ao-rcpt-btn-print" onClick={handlePrint}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print Receipt
          </button>
          <button className="ao-rcpt-btn-close" onClick={onClose}>Close</button>
        </div>

      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN ORDERS COMPONENT
═══════════════════════════════════════════════════════ */
const GO_MARKET_SHOP_SELLERS = ["GROCERY_SELLER", "FASHION_SELLER", "ELECTRONICS_SELLER", "MEDICAL_SELLER", "BEAUTY_SELLER", "HOME_KITCHEN_SELLER", "GIFTS_TOYS_SELLER", "BOOKS_STATIONERY_SELLER", "JEWELLERY_SELLER", "HARDWARE_SELLER", "AUTOMOBILE_SELLER"];
const SELLER_ROLES = ["SELLER", "GROCERY_SELLER", "RESTAURANT_SELLER", "FASHION_SELLER", "ELECTRONICS_SELLER", "MEDICAL_SELLER", "BEAUTY_SELLER", "HOME_KITCHEN_SELLER", "GIFTS_TOYS_SELLER", "BOOKS_STATIONERY_SELLER", "JEWELLERY_SELLER", "HARDWARE_SELLER", "AUTOMOBILE_SELLER"];
const isSellerRole = (role) => SELLER_ROLES.includes(role);

const Orders = () => {
  const [openOrderId,      setOpenOrderId]       = useState(null);
  const [orderStatus,      setOrderStatus]        = useState("");
  const [riderFilter,      setRiderFilter]        = useState("available");
  const [ordersData,       setOrdersData]         = useState([]);
  const [orders,           setOrders]             = useState([]);
  const [pageOrder,        setPageOrder]          = useState(1);
  const [searchQuery,      setSearchQuery]        = useState("");
  const [totalOrdersData,  setTotalOrdersData]    = useState({});
  const [selectedProduct,  setSelectedProduct]    = useState(null);
  const [receiptOrder,     setReceiptOrder]       = useState(null);
  const [riders,           setRiders]             = useState([]);
  const [assigningOrderId, setAssigningOrderId]   = useState(null);
  const [isRefreshing,    setIsRefreshing]      = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);

  const context = useContext(MyContext);
const isSellerView = isSellerRole(context?.userData?.role);
  const isDeliveryRider = context?.userData?.role === "DELIVERY_RIDER";
  const isGoMarketShopSeller = GO_MARKET_SHOP_SELLERS.includes(context?.userData?.role);
  const isRestaurantSeller = context?.userData?.role === "RESTAURANT_SELLER";
  const ordersListEndpoint = isDeliveryRider
    ? "/api/order/rider/orders"
    : isSellerView 
      ? "/api/order/seller/orders" 
      : "/api/order/order-list";
  const ordersTitle = isDeliveryRider
    ? riderFilter === "available"
      ? "Available Orders"
      : "My Assigned Orders"
     : isGoMarketShopSeller ? "Live Shop Orders" : isRestaurantSeller ? "Live Kitchen Orders" : isSellerView ? "Store Orders" : "Orders";
  const ordersSubtitle = isDeliveryRider
    ? riderFilter === "available"
      ? "Browse open rider orders in your market"
      : "Orders you have accepted or confirmed"
    : isGoMarketShopSeller
    ? "Accept, pack, and dispatch quick-commerce orders"
    : isRestaurantSeller
      ? "Accept and prepare orders for minutes delivery"
      : isSellerView
        ? "Track orders for your own products"
        : "Manage and track all customer orders";
  /* toggle expand */
  const toggleOrder = (id) => setOpenOrderId((prev) => (prev === id ? null : id));

  /* status change */
  const handleChange = (e, id) => {
    const val = e.target.value;
    setOrderStatus(val);
    editData(`/api/order/order-status/${id}`, { id, order_status: val }).then((res) => {
      if (res?.data?.error === false) context.alertBox("success", res?.data?.message);
    });
  };

  useEffect(() => {
    if (isGoMarketShopSeller || isRestaurantSeller || context?.userData?.role === "ADMIN") {
      fetchDataFromApi('/api/order/delivery-riders').then((res) => setRiders(res?.riders || res?.data || []));
    }
  }, [isGoMarketShopSeller, isRestaurantSeller, context?.userData?.role]);

  const assignRider = (orderId, riderId) => {
    if (!riderId) return;
    setAssigningOrderId(orderId);
    editData(`/api/order/assign-rider/${orderId}`, { riderId }).then((res) => {
      if (res?.data?.success || res?.data?.error === false) {
        context.alertBox('success', res?.data?.message || 'Order assigned');
        fetchDataFromApi(`${ordersListEndpoint}?page=${pageOrder}&limit=20`).then((next) => {
          if (next?.error === false) setOrdersData(next?.data || []);
        });
      } else context.alertBox('error', res?.data?.message || 'Could not assign order');
    }).finally(() => setAssigningOrderId(null));
  };

  const broadcastOrder = (orderId) => {
    setAssigningOrderId(orderId);
    editData(`/api/order/broadcast-order/${orderId}`, {}).then((res) => {
      if (res?.data?.success || res?.data?.error === false) {
        context.alertBox('success', res?.data?.message || 'Order broadcast to market riders');
        refreshOrders();
      } else {
        context.alertBox('error', res?.data?.message || 'Could not broadcast order');
      }
    }).finally(() => setAssigningOrderId(null));
  };

  const buildOrdersListUrl = (includeTotals = false, filterValue = riderFilter) => {
    if (!isDeliveryRider) {
      return includeTotals ? ordersListEndpoint : `${ordersListEndpoint}?page=${pageOrder}&limit=20`;
    }

    const params = new URLSearchParams();
    if (!includeTotals) {
      params.set('page', pageOrder);
      params.set('limit', 20);
    }
    if (filterValue === 'available') {
      params.set('status', 'broadcast');
    } else if (filterValue === 'assigned') {
      params.set('status', 'assigned');
    }
    const queryString = params.toString();
    return `${ordersListEndpoint}${queryString ? `?${queryString}` : ''}`;
  };

  const refreshOrders = (filterValue = riderFilter) => {
    setIsRefreshing(true);
    fetchDataFromApi(buildOrdersListUrl(false, filterValue)).then((res) => {
      if (res?.error === false) { setOrdersData(res?.data || []); setOrders(res); }
    });
    // For rider, we don't need separate totals call since pagination is included in the same response
    if (!isDeliveryRider) {
      fetchDataFromApi(buildOrdersListUrl(true, filterValue)).then((res) => {
        if (res?.error === false) setTotalOrdersData(res);
      }).finally(() => setIsRefreshing(false));
    } else {
      // For rider, use the same response for totals
      fetchDataFromApi(buildOrdersListUrl(false, filterValue)).then((res) => {
        if (res?.error === false) setTotalOrdersData(res);
      }).finally(() => setIsRefreshing(false));
    }
  };

  const handleRiderFilterChange = (nextFilter) => {
    setRiderFilter(nextFilter);
    setPageOrder(1);
    refreshOrders(nextFilter);
  };

  const startOrderProcessing = (orderId, action) => {
    setProcessingOrderId(orderId);
    setProcessingAction(action);
  };

  const finishOrderProcessing = () => {
    setProcessingOrderId(null);
    setProcessingAction(null);
  };

  const isProcessingAction = (orderId, action) => processingOrderId === orderId && processingAction === action;

  const confirmAssignedOrder = (orderId) => {
    startOrderProcessing(orderId, 'confirm');
    editData(`/api/order/rider/orders/${orderId}/confirm`, {}).then((res) => {
      if (res?.data?.success || res?.data?.error === false) {
        context.alertBox('success', res?.data?.message || 'Order confirmed for delivery');
        setRiderFilter('assigned');
        refreshOrders('assigned');
      } else context.alertBox('error', res?.data?.message || 'Could not confirm order');
    }).finally(() => finishOrderProcessing());
  };

  const sendOtpAndDeliver = async (orderId) => {
    startOrderProcessing(orderId, 'deliver');
    const sent = await postData(`/api/order/rider/orders/${orderId}/send-otp`, {});
    if (sent?.error === true) {
      finishOrderProcessing();
      return context.alertBox('error', sent?.message || 'Could not send delivery OTP');
    }
    context.alertBox('success', sent?.message || 'OTP sent to customer email');
    const otp = window.prompt('Enter the OTP received by customer to mark this order delivered');
    if (!otp) {
      finishOrderProcessing();
      return;
    }
    editData(`/api/order/rider/orders/${orderId}/deliver`, { otp }).then((res) => {
      if (res?.data?.success || res?.data?.error === false) {
        context.alertBox('success', res?.data?.message || 'Order delivered and ₹20 earning credited');
        refreshOrders();
      } else context.alertBox('error', res?.data?.message || 'Delivery OTP verification failed');
    }).finally(() => finishOrderProcessing());
  };

  const callCustomer = (order) => {
    const phone = order?.delivery_address?.mobile || order?.userId?.mobile;
    if (!phone) return context.alertBox('error', 'Customer phone number is not available');
    window.location.href = `tel:${phone}`;
  };

  const cancelRiderOrder = (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? This will remove it from your assignments and the order will be available for other riders.')) {
      return;
    }
    startOrderProcessing(orderId, 'cancel');
    editData(`/api/order/rider/orders/${orderId}/cancel`, {}).then((res) => {
      if (res?.data?.success || res?.data?.error === false) {
        context.alertBox('success', res?.data?.message || 'Order cancelled successfully');
        refreshOrders();
      } else context.alertBox('error', res?.data?.message || 'Could not cancel order');
    }).finally(() => finishOrderProcessing());
  };

  const handleReturnRefundUpdate = (id, mode) => {
    const payload = mode === "approve"
      ? { returnStatus: "approved", refundStatus: "processing" }
      : { returnStatus: "approved", refundStatus: "processed", refundMethod: "original", refundAmount: 0 };

    editData(`/api/order/return-refund-status/${id}`, payload).then((res) => {
      if (res?.data?.success) {
        context.alertBox("success", res?.data?.message || "Updated");
        fetchDataFromApi(`${ordersListEndpoint}?page=${pageOrder}&limit=20`).then((next) => {
          if (next?.error === false) setOrdersData(next?.data || []);
        });
        fetchDataFromApi(`${ordersListEndpoint}`).then((all) => {
          if (all?.error === false) setTotalOrdersData(all);
        });
      }
    });
  };

  /* delete */
  const deleteOrder = (id) => {
    if (context?.userData?.role !== "ADMIN") {
      context.alertBox("error", "Delete is allowed only for admin");
      return;
    }
    deleteData(`/api/order/deleteOrder/${id}`).then(() => {
      fetchDataFromApi(`${ordersListEndpoint}?page=${pageOrder}&limit=20`).then((res) => {
        if (res?.error === false) {
          setOrdersData(res?.data);
          context?.setProgress(100);
          context.alertBox("success", "Order deleted successfully!");
        }
      });
      fetchDataFromApi(`${ordersListEndpoint}`).then((res) => {
        if (res?.error === false) setTotalOrdersData(res);
      });
    });
  };

  /* fetch on page / status change */
  useEffect(() => {
    context?.setProgress(50);
    fetchDataFromApi(buildOrdersListUrl()).then((res) => {
      if (res?.error === false) { setOrdersData(res?.data); setOrders(res); context?.setProgress(100); }
    });
    fetchDataFromApi(buildOrdersListUrl(true)).then((res) => {
      if (res?.error === false) setTotalOrdersData(res);
    });
  }, [orderStatus, pageOrder, riderFilter]);

  /* search filter */
  useEffect(() => {
    if (searchQuery !== "") {
      const q = searchQuery.toLowerCase();
      const filtered = (totalOrdersData?.data || []).filter((o) =>
        o._id?.toLowerCase().includes(q) ||
        o?.userId?.name?.toLowerCase().includes(q) ||
        o?.userId?.email?.toLowerCase().includes(q) ||
        o?.createdAt?.includes(q)
      );
      setOrdersData(filtered);
    } else {
      fetchDataFromApi(buildOrdersListUrl()).then((res) => {
        if (res?.error === false) { setOrders(res); setOrdersData(res?.data); }
      });
    }
  }, [searchQuery, riderFilter, pageOrder]);

  /* stats */
  const allOrders   = totalOrdersData?.data || [];
  const totalCount  = totalOrdersData?.total || allOrders.length; // Use backend total count
  const pendingCnt  = allOrders.filter((o) => (o.order_status || "").toLowerCase() === "pending").length;
  const deliveredCnt= allOrders.filter((o) => (o.order_status || "").toLowerCase() === "delivered").length;
  const cancelledCnt= allOrders.filter((o) => (o.order_status || "").toLowerCase() === "cancelled").length;

  return (
    <div className="ao">
      <style>{STYLES}</style>

      {/* Product detail modal */}
      {selectedProduct && (
        <ProductModal item={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      {/* Receipt modal */}
      {receiptOrder && (
        <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
      )}

      <div className="ao-page">

        {/* ── Top bar ── */}
        <div className="ao-topbar">
          <div className="ao-topbar-left">
           <h2 className="ao-topbar-title">{ordersTitle}</h2>
            <p className="ao-topbar-sub">{ordersSubtitle}</p>
            {isDeliveryRider && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleRiderFilterChange('available')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: riderFilter === 'available' ? '1px solid #2563eb' : '1px solid #d1d5db',
                    background: riderFilter === 'available' ? '#eff6ff' : '#ffffff',
                    color: riderFilter === 'available' ? '#1d4ed8' : '#374151',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Available Orders
                </button>
                <button
                  type="button"
                  onClick={() => handleRiderFilterChange('assigned')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: riderFilter === 'assigned' ? '1px solid #2563eb' : '1px solid #d1d5db',
                    background: riderFilter === 'assigned' ? '#eff6ff' : '#ffffff',
                    color: riderFilter === 'assigned' ? '#1d4ed8' : '#374151',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  My Orders
                </button>
              </div>
            )}
          </div>
          <button 
            className="ao-refresh-btn" 
            onClick={() => refreshOrders(riderFilter)}
            disabled={isRefreshing}
            title="Refresh orders"
          >
            <span className={`ao-refresh-icon${isRefreshing ? ' spinning' : ''}`}>🔄</span>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <div className="ao-search-wrap">
            <SearchBox
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setPageOrder={setPageOrder}
            />
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="ao-stats">
          <div className="ao-stat">
            <span className="ao-stat-n" style={{ color: "#0c0c14" }}>{totalCount}</span>
            <span className="ao-stat-l">Total</span>
          </div>
          <div className="ao-stat">
            <span className="ao-stat-n" style={{ color: "#f59e0b" }}>{pendingCnt}</span>
            <span className="ao-stat-l">Pending</span>
          </div>
          <div className="ao-stat">
            <span className="ao-stat-n" style={{ color: "#16a34a" }}>{deliveredCnt}</span>
            <span className="ao-stat-l">Delivered</span>
          </div>
          <div className="ao-stat">
            <span className="ao-stat-n" style={{ color: "#ef4444" }}>{cancelledCnt}</span>
            <span className="ao-stat-l">Cancelled</span>
          </div>
        </div>

        {/* ── Empty ── */}
        {(!ordersData || ordersData.length === 0) && (
          <div className="ao-empty">
            <div className="ao-empty-icon">📦</div>
            <h3>No orders found</h3>
            <p>Try adjusting your search query</p>
          </div>
        )}

        {/* ── Table ── */}
        {ordersData?.length > 0 && (
          <div className="ao-scroll">
            <table className="ao-tbl">
              <thead>
                <tr>
                  <th style={{ width: 44 }}></th>
                  <th>Order ID</th>
                  <th>Payment</th>
                  <th>Customer</th>
                  <th>Address</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {ordersData.map((order) => {
                  const isOpen = openOrderId === order._id;
                  const addr   = order?.delivery_address || {};
                  const isCOD  = !order?.paymentId;
                  const sc     = getStatusStyle(order?.order_status);

                  // Calculate seller-specific total
                  const currentSellerId = context?.userData?._id || context?.userData?.id;
                  const allProducts = order?.products || [];
                  const sellerProducts = isSellerView && currentSellerId
                    ? allProducts.filter((p) => {
                        const productSellerId = p.sellerId?._id || p.sellerId;
                        return String(productSellerId) === String(currentSellerId);
                      })
                    : allProducts;
                  
                  // Calculate subtotal for seller's products only
                  const sellerSubtotal = sellerProducts.reduce((s, p) => s + (p.price || 0) * (p.quantity || 1), 0);
                  
                  // For sellers, show only their product total; for admin, show full order total
                  const displayAmount = isSellerView ? sellerSubtotal : (order?.totalAmt || 0);

                  return (
                    <React.Fragment key={order._id}>
                      {/* ── Main row ── */}
                      <tr className={`ao-main-row${isOpen ? " expanded" : ""}`}>

                        {/* Expand */}
                        <td>
                          <button
                            className={`ao-xbtn${isOpen ? " open" : ""}`}
                            onClick={() => toggleOrder(order._id)}
                            title={isOpen ? "Collapse" : "Show products"}
                          >
                            {isOpen ? "▲" : "▼"}
                          </button>
                        </td>

                        {/* Order ID */}
                        <td>
                          <span className="ao-oid">#{order._id?.slice(-8).toUpperCase()}</span>
                          <span className="ao-oid-full" title={order._id}>{order._id}</span>
                        </td>

                        {/* Payment */}
                        <td>
                          {isCOD ? (
                            <span className="ao-badge ao-badge-cod">💵 Cash on Delivery</span>
                          ) : (
                            <>
                              <span className="ao-badge ao-badge-online">✓ Online</span>
                              <span className="ao-badge-pid">{order.paymentId?.slice(-12)}</span>
                            </>
                          )}
                        </td>

                        {/* Customer */}
                        <td>
                          <div className="ao-cust-name">{order?.userId?.name}</div>
                          <div className="ao-cust-phone">📞 {addr?.mobile}</div>
                          <div className="ao-cust-email">✉ {order?.userId?.email?.substr(0, 5)}***</div>
                        </td>

                        {/* Address */}
                        <td>
                          {addr?.addressType && <span className="ao-addr-type">{addr.addressType}</span>}
                          <div className="ao-addr-text">
                            {[addr.city, addr.state].filter(Boolean).join(", ")}
                          </div>
                          <div className="ao-addr-pin">PIN {addr.pincode}</div>
                          
                          {/* DEBUG: Log goMarketData */}
                          {console.log('Order goMarketData:', order._id, order?.goMarketData)}
                          
                          {/* User's Current Location (Go Market) - Show if coordinates are valid */}
                          {order?.goMarketData?.userLocation?.coordinates && 
                           Array.isArray(order.goMarketData.userLocation.coordinates) &&
                           order.goMarketData.userLocation.coordinates.length >= 2 &&
                           order.goMarketData.userLocation.coordinates[0] !== 0 && 
                           order.goMarketData.userLocation.coordinates[1] !== 0 && (
                            <div style={{ marginTop: '6px' }}>
                              <a
                                href={`https://www.google.com/maps?q=${order.goMarketData.userLocation.coordinates[1]},${order.goMarketData.userLocation.coordinates[0]}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  color: '#059669',
                                  textDecoration: 'none',
                                  background: '#d1fae5',
                                  padding: '3px 7px',
                                  borderRadius: '5px',
                                  border: '1px solid #86efac',
                                  transition: 'all 0.15s'
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.background = '#bbf7d0';
                                  e.currentTarget.style.borderColor = '#6ee7b7';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.background = '#d1fae5';
                                  e.currentTarget.style.borderColor = '#86efac';
                                }}
                                title={`GPS Location: ${order.goMarketData.userLocation.coordinates[1].toFixed(6)}, ${order.goMarketData.userLocation.coordinates[0].toFixed(6)}`}
                              >
                                <span style={{ 
                                  width: 5, 
                                  height: 5, 
                                  background: '#10b981', 
                                  borderRadius: '50%',
                                  display: 'inline-block',
                                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                                }} />
                                📍 Live GPS
                              </a>
                            </div>
                          )}
                          
                          {addr?.latitude && addr?.longitude && (
                            <div style={{ marginTop: '6px' }}>
                              <a
                                href={`https://www.google.com/maps?q=${addr.latitude},${addr.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#2563eb',
                                  textDecoration: 'none',
                                  padding: '3px 8px',
                                  background: '#eff6ff',
                                  border: '1px solid #bfdbfe',
                                  borderRadius: '5px',
                                  transition: 'all 0.15s'
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.background = '#dbeafe';
                                  e.currentTarget.style.borderColor = '#93c5fd';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.background = '#eff6ff';
                                  e.currentTarget.style.borderColor = '#bfdbfe';
                                }}
                              >
                                📍 View Location
                              </a>
                            </div>
                          )}
                        </td>

                        {/* Amount */}
                        <td><span className="ao-amt">{fmt(displayAmount)}</span></td>

                        {/* Status select */}
                        <td>
                          <Select
                            value={order?.order_status || "pending"}
                            size="small"
                            className="ao-status-sel"
                            disabled={isDeliveryRider}
                            onChange={(e) => handleChange(e, order._id)}
                            sx={{
                              minWidth: 120,
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontFamily: "'DM Sans', sans-serif",
                              fontWeight: 600,
                              background: sc.bg,
                              color: sc.color,
                              "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
                              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0ef" },
                              "& .MuiSvgIcon-root": { color: sc.color },
                            }}
                          >
                            <MenuItem value="pending">⏳ Pending</MenuItem>
                            <MenuItem value="confirm">✅ Confirm</MenuItem>
                            <MenuItem value="processing">⚙️ Processing</MenuItem>
                            <MenuItem value="shipped">🚚 Shipped</MenuItem>
                            <MenuItem value="delivered">📬 Delivered</MenuItem>
                            <MenuItem value="cancelled">❌ Cancelled</MenuItem>
                            <MenuItem value="refunded">💸 Refunded</MenuItem>
                          </Select>
                        </td>

                        {/* Date */}
                        <td style={{ whiteSpace: "nowrap", fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
                          📅 {fmtDate(order?.createdAt)}
                           {(order?.returnRequest?.requested || order?.refund?.status === "processed") && (
                            <div style={{ marginTop: 4, fontSize: 10 }}>
                              ↩ {order?.returnRequest?.status || "requested"} • 💸 {order?.refund?.status || "none"}
                            </div>
                          )}
                        </td>

                        {/* Delete + Receipt */}
                        <td>
                          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                            <button
                              className="ao-receipt-btn"
                              onClick={() => setReceiptOrder(order)}
                            >
                              🧾 Receipt
                            </button>
                             {(isGoMarketShopSeller || isRestaurantSeller || context?.userData?.role === "ADMIN") && order?.order_status !== "delivered" && (
                              <>
                                {(isGoMarketShopSeller || isRestaurantSeller || context?.userData?.role === "ADMIN") && (
                                  <button className="ao-receipt-btn" onClick={() => broadcastOrder(order._id)} disabled={assigningOrderId === order._id || order?.deliveryAssignment?.status === 'broadcast'}>
                                    {assigningOrderId === order._id ? (
                                      <>
                                        <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>🔄</span>
                                        {' Broadcasting...'}
                                      </>
                                    ) : order?.deliveryAssignment?.status === 'broadcast' ? 'Broadcasted to riders' : 'Broadcast to market riders'}
                                  </button>
                                )}
                                {context?.userData?.role === "ADMIN" && (
                                  <Select size="small" displayEmpty value={order?.deliveryAssignment?.riderId?._id || order?.deliveryAssignment?.riderId || ""} onChange={(e) => assignRider(order._id, e.target.value)} disabled={assigningOrderId === order._id} sx={{ minWidth: 150, fontSize: 11, background: '#eef2ff', borderRadius: '8px' }}>
                                    <MenuItem value="" disabled>{order?.deliveryAssignment?.riderId ? 'Assigned rider' : 'Assign rider'}</MenuItem>
                                    {riders.map((r) => <MenuItem key={r._id} value={r._id}>{r.name}</MenuItem>)}
                                  </Select>
                                )}
                              </>
                            )}
                            {order?.deliveryAssignment?.status && <span className="ao-badge ao-badge-online">Rider: {order.deliveryAssignment.status}</span>}
                            {isDeliveryRider && (
                              <>
                                {order?.deliveryAssignment?.status === "broadcast" && (
                                  <button className="ao-receipt-btn" onClick={() => confirmAssignedOrder(order._id)} disabled={isProcessingAction(order._id, 'confirm')}>
                                    {isProcessingAction(order._id, 'confirm') ? (
                                      <>
                                        <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>🔄</span>
                                        {' Confirming...'}
                                      </>
                                    ) : '✅ Confirm Order'}
                                  </button>
                                )}
                                {order?.deliveryAssignment?.status === "assigned" && (
                                  <>
                                    <button className="ao-receipt-btn" onClick={() => confirmAssignedOrder(order._id)} disabled={isProcessingAction(order._id, 'confirm')}>
                                      {isProcessingAction(order._id, 'confirm') ? (
                                        <>
                                          <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>🔄</span>
                                          {' Confirming...'}
                                        </>
                                      ) : '✅ Confirm Order'}
                                    </button>
                                    <button className="ao-receipt-btn" onClick={() => cancelRiderOrder(order._id)} disabled={isProcessingAction(order._id, 'cancel')} style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}>
                                      {isProcessingAction(order._id, 'cancel') ? (
                                        <>
                                          <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>🔄</span>
                                          {' Cancelling...'}
                                        </>
                                      ) : '❌ Cancel Order'}
                                    </button>
                                  </>
                                )}
                                {order?.deliveryAssignment?.status === "confirmed" && (
                                  <>
                                    <button className="ao-receipt-btn" onClick={() => callCustomer(order)}>📞 Call Customer</button>
                                    <button className="ao-receipt-btn" onClick={() => sendOtpAndDeliver(order._id)} disabled={isProcessingAction(order._id, 'deliver')}>
                                      {isProcessingAction(order._id, 'deliver') ? (
                                        <>
                                          <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>🔄</span>
                                          {' Delivering...'}
                                        </>
                                      ) : '📬 Deliver with OTP'}
                                    </button>
                                    <button className="ao-receipt-btn" onClick={() => cancelRiderOrder(order._id)} disabled={isProcessingAction(order._id, 'cancel')} style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}>
                                      {isProcessingAction(order._id, 'cancel') ? (
                                        <>
                                          <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>🔄</span>
                                          {' Cancelling...'}
                                        </>
                                      ) : '❌ Cancel Order'}
                                    </button>
                                  </>
                                )}
                                {order?.deliveryAssignment?.status === "otp_sent" && (
                                  <>
                                    <button className="ao-receipt-btn" onClick={() => callCustomer(order)}>📞 Call Customer</button>
                                    <button className="ao-receipt-btn" onClick={() => sendOtpAndDeliver(order._id)} disabled={isProcessingAction(order._id, 'deliver')}>
                                      {isProcessingAction(order._id, 'deliver') ? (
                                        <>
                                          <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>🔄</span>
                                          {' Delivering...'}
                                        </>
                                      ) : '📬 Deliver with OTP'}
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                            {order?.returnRequest?.requested && order?.refund?.status !== "processed" && (
                              <>
                                <button className="ao-receipt-btn" onClick={() => handleReturnRefundUpdate(order._id, "approve")}>↩️ Approve Return</button>
                                <button className="ao-receipt-btn" onClick={() => handleReturnRefundUpdate(order._id, "refund")}>💸 Mark Refund</button>
                              </>
                            )}
                            {context?.userData?.role === "ADMIN" && (
                              <button className="ao-del" onClick={() => deleteOrder(order._id)}>
                                🗑 Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* ── Expanded products panel ── */}
                      {isOpen && (
                        <tr className="ao-panel-row">
                          <td colSpan={9}>
                            <div className="ao-panel">
                              {(() => {
                                // Filter products for seller view - only show products that belong to this seller
                                const currentSellerId = context?.userData?._id || context?.userData?.id;
                                const productsToShow = isSellerView && currentSellerId
                                  ? (order?.products || []).filter((p) => {
                                      const productSellerId = p.sellerId?._id || p.sellerId;
                                      return String(productSellerId) === String(currentSellerId);
                                    })
                                  : (order?.products || []);
                                
                                return (
                                  <>
                                    <div className="ao-panel-hdr">
                                      <span className="ao-panel-title">📦 Products in this order</span>
                                      <span className="ao-panel-count">{productsToShow.length} items</span>
                                    </div>
                                    <p className="ao-panel-hint">
                                      Click any product card to see full details
                                    </p>
                                    <div className="ao-prod-list">
                                      {productsToShow.map((item, i) => (
                                  <div
                                    className="ao-prod-card"
                                    key={i}
                                    onClick={() => setSelectedProduct(item)}
                                    title="Click to view product details"
                                  >
                                    {/* Image */}
                                    {item.image
                                      ? <img src={item.image} alt={item.productTitle} className="ao-prod-img" />
                                      : <div className="ao-prod-noimg">🖼️</div>
                                    }

                                    {/* Info */}
                                    <div className="ao-prod-info">
                                      <div className="ao-prod-name">{item.productTitle}</div>
                                      <div className="ao-prod-tags">
                                        {/* Show selectedOptions if available, else show weight/size/color/ram */}
                                        {item.selectedOptions && typeof item.selectedOptions === 'object' && Object.keys(item.selectedOptions).length > 0 ? (
                                          Object.entries(item.selectedOptions).map(([key, value]) => 
                                            value ? <span key={key} className="ao-prod-tag">✓ {key.charAt(0).toUpperCase() + key.slice(1)}: {value}</span> : null
                                          )
                                        ) : (
                                          <>
                                            {item.weight && <span className="ao-prod-tag">📦 {item.weight}</span>}
                                            {item.color  && <span className="ao-prod-tag">🎨 {item.color}</span>}
                                            {item.size   && <span className="ao-prod-tag">📐 {item.size}</span>}
                                            {item.ram    && <span className="ao-prod-tag">💾 {item.ram}</span>}
                                          </>
                                        )}
                                        <span className="ao-prod-tag">Qty {item.quantity}</span>
                                      </div>
                                    </div>

                                    {/* Price */}
                                    <div className="ao-prod-right">
                                      <div className="ao-prod-subtotal">{fmt(item.price * item.quantity)}</div>
                                      <div className="ao-prod-unit">{fmt(item.price)} per</div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Total footer */}
                              <div className="ao-panel-total">
                                <span className="ao-panel-total-lbl">Order Total</span>
                                <span className="ao-panel-total-amt">{fmt(displayAmount)}</span>
                              </div>
                            </>
                          );
                        })()}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {orders?.totalPages > 1 && (
          <div className="ao-page-footer">
            <Pagination
              showFirstButton
              showLastButton
              count={orders?.totalPages}
              page={pageOrder}
              onChange={(_, v) => setPageOrder(v)}
              sx={{
                "& .MuiPaginationItem-root": {
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  borderRadius: "8px",
                },
                "& .Mui-selected": {
                  background: "#0c0c14 !important",
                  color: "#fff !important",
                },
              }}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export { Orders };
export default Orders;