import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import { fetchDataFromApi } from "../../utils/api";
import { useAppContext } from "../../hooks/useAppContext";

/* ─── Static configuration ──────────────── */
const TABS = ["All Offers", "Coupons", "Flash Sales", "Bank Offers", "App Only"];
const CATS = [
  { e: "👗", l: "Fashion" },
  { e: "📱", l: "Electronics" },
  { e: "🏠", l: "Home" },
  { e: "💄", l: "Beauty" },
  { e: "🥗", l: "Food" },
  { e: "🏋️", l: "Sports" }
];

// Helper to assign visual styles to dynamic coupons
const STYLES_POOL = [
  { tag: "👗 Fashion", tagCls: "to", accentCls: "ao", category: "Coupons" },
  { tag: "📱 App Only", tagCls: "tp", accentCls: "ap", category: "App Only" },
  { tag: "🏦 Bank Offers", tagCls: "tb", accentCls: "ab", category: "Bank Offers" },
  { tag: "🏠 Home", tagCls: "tg", accentCls: "ag", category: "Coupons" },
  { tag: "⚡ Flash Sale", tagCls: "to", accentCls: "ao", category: "Flash Sales" },
  { tag: "💄 Beauty", tagCls: "tpk", accentCls: "apk", category: "Coupons" }
];

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const S = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --o:#F4611A;--ol:#FF7A35;--op:#FFF4EE;--om:#FFE4D4;
  --td:#0F0F0F;--tm:#555;--tl:#999;--br:#F0EBE6;
  --bg:#FDFAF7;--wh:#fff;--su:#12A150;--er:#EF4444;--wa:#F59E0B;
  --fn:'Plus Jakarta Sans',sans-serif;
  --ss:0 2px 12px rgba(244,97,26,.07);--sm:0 8px 32px rgba(244,97,26,.12);
}
.op{min-height:100vh;background:var(--bg);font-family:var(--fn);color:var(--td);}

/* HEADER */
.op-hd{background:var(--wh);border-bottom:1px solid var(--br);position:sticky;top:0;z-index:50;}
.op-ht{padding:18px 20px 14px;display:flex;align-items:center;gap:13px;}
.op-back{width:38px;height:38px;border-radius:12px;background:var(--bg);border:1px solid var(--br);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;color:var(--tm);flex-shrink:0;}
.op-back svg{width:16px;height:16px;}
.op-back:hover{background:var(--op);color:var(--o);border-color:var(--om);}
.op-htit{flex:1;}
.op-htit h1{font-size:1.2rem;font-weight:800;letter-spacing:-.02em;line-height:1;}
.op-htit .sub{font-size:11px;color:var(--tl);margin-top:3px;}
.op-abadge{display:flex;align-items:center;gap:6px;padding:5px 12px;background:var(--op);border:1px solid var(--om);border-radius:99px;font-size:12px;font-weight:700;color:var(--o);white-space:nowrap;}
.op-adot{width:6px;height:6px;border-radius:50%;background:var(--o);animation:od 2s infinite;}
@keyframes od{0%,100%{opacity:1}50%{opacity:.3}}

/* TABS */
.op-tabs{display:flex;overflow-x:auto;padding:0 16px;border-top:1px solid var(--br);scrollbar-width:none;}
.op-tabs::-webkit-scrollbar{display:none;}
.op-tab{padding:12px 18px;white-space:nowrap;font-size:13px;font-weight:600;color:var(--tl);border:none;background:none;cursor:pointer;border-bottom:2.5px solid transparent;transition:all .15s;font-family:var(--fn);}
.op-tab.on{color:var(--o);border-bottom-color:var(--o);}

/* WELCOME BANNER */
.op-wb{background:linear-gradient(135deg,var(--o),#FF8C38);margin:20px 20px 0;border-radius:20px;padding:20px 22px;display:flex;align-items:center;justify-content:space-between;gap:14px;position:relative;overflow:hidden;}
.op-wb::before{content:'🎊';position:absolute;right:80px;top:-20px;font-size:80px;opacity:.06;transform:rotate(15deg);}
.op-wbl h3{font-size:1rem;font-weight:800;color:#fff;margin-bottom:4px;}
.op-wbl p{font-size:12.5px;color:rgba(255,255,255,.75);}
.op-wcode{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.18);border:1.5px dashed rgba(255,255,255,.5);border-radius:12px;padding:10px 15px;cursor:pointer;transition:background .15s;flex-shrink:0;}
.op-wcode:hover{background:rgba(255,255,255,.27);}
.op-wctext{font-size:14px;font-weight:800;color:#fff;letter-spacing:.08em;}
.op-wclbl{font-size:9px;color:rgba(255,255,255,.65);font-weight:600;letter-spacing:.08em;display:block;margin-top:2px;}

/* FLASH SALE */
.op-fw{padding:16px 20px 0;}
.op-flash{background:var(--td);border-radius:20px;padding:22px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;position:relative;overflow:hidden;color:#fff;}
.op-flash::before{content:'⚡';position:absolute;right:-10px;top:-20px;font-size:130px;opacity:.04;}
.op-fey{display:flex;align-items:center;gap:8px;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--o);margin-bottom:8px;}
.op-fedot{width:6px;height:6px;border-radius:50%;background:var(--o);animation:od 2s infinite;}
.op-ftit{font-size:1.2rem;font-weight:800;margin-bottom:4px;letter-spacing:-.01em;}
.op-fsub{font-size:12.5px;color:rgba(255,255,255,.5);margin-bottom:16px;}
.op-timer{display:flex;align-items:center;gap:6px;}
.op-tb{background:rgba(255,255,255,.1);border-radius:10px;padding:8px 12px;text-align:center;min-width:52px;border:1px solid rgba(255,255,255,.08);}
.op-tn{font-size:1.4rem;font-weight:800;display:block;line-height:1;letter-spacing:-.02em;}
.op-tl{font-size:9px;color:rgba(255,255,255,.4);letter-spacing:.06em;margin-top:3px;display:block;}
.op-tsep{font-size:1.2rem;font-weight:800;color:rgba(255,255,255,.3);}
.op-fr{display:flex;flex-direction:column;align-items:flex-end;gap:12px;}
.op-fnum{font-size:2.5rem;font-weight:800;color:var(--o);line-height:1;letter-spacing:-.03em;}
.op-fbtn{padding:11px 22px;background:var(--o);color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--fn);transition:all .2s;box-shadow:0 4px 16px rgba(244,97,26,.35);}
.op-fbtn:hover{background:var(--ol);transform:translateY(-1px);}

/* FLASH PRODUCTS */
.op-fprods{padding:0 20px;margin-top:16px;}
.op-fphead{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.op-fphead h3{font-size:14px;font-weight:800;}
.op-fphead a{font-size:12px;color:var(--o);font-weight:600;cursor:pointer;text-decoration:none;}
.op-fscroll{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none;}
.op-fscroll::-webkit-scrollbar{display:none;}
.op-fprod{min-width:140px;background:var(--wh);border:1px solid var(--br);border-radius:14px;overflow:hidden;cursor:pointer;transition:all .2s;flex-shrink:0;}
.op-fprod:hover{transform:translateY(-3px);box-shadow:var(--sm);}
.op-fprod-img{height:100px;background:var(--bg);overflow:hidden;}
.op-fprod-img img{width:100%;height:100%;object-fit:contain;padding:8px;}
.op-fprod-body{padding:10px 10px 12px;}
.op-fprod-name{font-size:12px;font-weight:600;margin-bottom:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.op-fprod-price{font-size:13px;font-weight:800;color:var(--o);}
.op-fprod-old{font-size:11px;color:var(--tl);text-decoration:line-through;margin-left:5px;}
.op-fprod-sk{min-width:140px;height:196px;flex-shrink:0;}

/* SECTION HEAD */
.op-sh{display:flex;align-items:center;justify-content:space-between;padding:20px 20px 12px;}
.op-sh h2{font-size:1rem;font-weight:800;}
.op-sh span{font-size:12px;color:var(--tl);font-weight:600;}

/* CAT FILTER */
.op-cf{padding:0 20px;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin-bottom:4px;}
.op-cf::-webkit-scrollbar{display:none;}
.op-catbtn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:12.5px;font-weight:600;border:1.5px solid var(--br);background:var(--wh);color:var(--tm);cursor:pointer;white-space:nowrap;transition:all .15s;font-family:var(--fn);}
.op-catbtn.on{background:var(--op);border-color:var(--om);color:var(--o);}

/* OFFER GRID */
.op-grid{padding:0 20px 90px;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-top:14px;}

/* OFFER CARD */
.op-card{background:var(--wh);border:1.5px solid var(--br);border-radius:20px;overflow:hidden;transition:all .22s;}
.op-card:hover{transform:translateY(-4px);box-shadow:var(--sm);border-color:var(--om);}
.op-card.saved{border-color:var(--o);}
.op-ct{padding:22px 22px 16px;position:relative;}
.op-ch{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;}
.op-tag{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:7px;}
.op-svbtn{width:32px;height:32px;border-radius:10px;background:var(--bg);border:1.5px solid var(--br);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;transition:all .15s;}
.op-svbtn:hover,.op-svbtn.sv{background:var(--op);border-color:var(--om);}
.op-disc{font-size:2rem;font-weight:800;line-height:1;letter-spacing:-.02em;margin-bottom:6px;}
.op-min{font-size:11px;color:var(--tl);margin-bottom:6px;}
.op-title{font-size:13.5px;font-weight:500;color:var(--tm);line-height:1.5;}
.op-exp{position:absolute;top:18px;right:18px;font-size:10px;font-weight:700;padding:3px 9px;border-radius:6px;}
.op-exp.n{background:#F5F5F5;color:var(--tl);}
.op-exp.u{background:#FFF0F0;color:var(--er);}
.op-ubwrap{margin-top:14px;}
.op-ubtop{display:flex;justify-content:space-between;font-size:10.5px;color:var(--tl);margin-bottom:5px;font-weight:500;}
.op-ubbar{height:4px;background:var(--br);border-radius:2px;overflow:hidden;}
.op-ubfill{height:100%;border-radius:2px;background:var(--o);transition:width .5s ease;}
.op-cb{padding:14px 22px 18px;border-top:1px dashed var(--br);display:flex;align-items:center;gap:10px;}
.op-code{flex:1;background:var(--op);border:1.5px dashed var(--o);border-radius:10px;padding:10px 14px;font-size:13px;font-weight:800;letter-spacing:.1em;color:var(--o);cursor:pointer;text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .15s;}
.op-code:hover{background:var(--om);}
.op-cpy{font-size:10px;font-weight:600;opacity:.6;}
.op-apply{padding:11px 20px;background:var(--o);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;white-space:nowrap;font-family:var(--fn);}
.op-apply:hover{background:var(--ol);transform:translateY(-1px);}

/* tag/accent colors */
.to{background:var(--op);color:var(--o);} .tb{background:#EFF6FF;color:#3B82F6;} .tp{background:#F5F3FF;color:#8B5CF6;}
.tg{background:#ECFDF5;color:#10B981;} .tpk{background:#FDF2F8;color:#EC4899;}
.ao{color:var(--o);} .ab{color:#3B82F6;} .ap{color:#8B5CF6;} .ag{color:#10B981;} .apk{color:#EC4899;}

/* SKELETON */
.sk{border-radius:10px;background:linear-gradient(90deg,#F5F0EB 25%,#EDE7E0 50%,#F5F0EB 75%);background-size:200% 100%;animation:sh 1.4s infinite;}
@keyframes sh{to{background-position:-200% 0}}

/* EMPTY / LOADING */
.op-empty{text-align:center;padding:56px 24px;grid-column:1/-1;}
.op-empty .ico{font-size:48px;margin-bottom:14px;}
.op-empty h3{font-size:1.05rem;font-weight:800;margin-bottom:8px;}
.op-empty p{font-size:13px;color:var(--tl);}

/* TOAST */
.op-toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#1A1A1A;color:#fff;padding:12px 22px;border-radius:12px;font-size:13px;font-weight:600;z-index:9999;animation:tup .3s ease;white-space:nowrap;display:flex;align-items:center;gap:8px;box-shadow:0 8px 32px rgba(0,0,0,.2);}
@keyframes tup{from{opacity:0;transform:translateX(-50%) translateY(14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

@media(max-width:640px){
  .op-grid{grid-template-columns:1fr;padding:0 14px 90px;}
  .op-flash{flex-direction:column;align-items:flex-start;}
  .op-fr{align-items:flex-start;flex-direction:row;align-items:center;}
  .op-wb{flex-direction:column;align-items:flex-start;}
}
`;

/* ─── Component ────────────────────────────────────────────────────────────── */
export default function Offers() {
  const nav = useNavigate();
  const ctx = useAppContext();

  const [activeTab, setActiveTab] = useState("All Offers");
  const [activeCat, setActiveCat] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [copied, setCopied] = useState(null);
  const [timer, setTimer] = useState({ h: 2, m: 34, s: 17 });

  // Dynamic Offers/Coupons state
  const [offersData, setOffersData] = useState([]);
  const [offersLoading, setOffersLoading] = useState(true);

  // Flash sale products state
  const [flashProducts, setFlashProducts] = useState([]);
  const [flashLoading, setFlashLoading] = useState(true);

  // User info for personalisation
  const isLoggedIn = !!ctx?.userData;
  const userName = ctx?.userData?.name?.split(" ")[0] || "You";

  // Countdown timer
  useEffect(() => {
    const t = setInterval(() => {
      setTimer(p => {
        let { h, m, s } = p;
        s--; if (s < 0) { s = 59; m--; } if (m < 0) { m = 59; h--; } if (h < 0) return p;
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // 1. Fetch Dynamic Coupons
  useEffect(() => {
    setOffersLoading(true);
    fetchDataFromApi("/api/coupon/active").then((res) => {
      if (res?.success && res?.data) {
        // Map API data to the UI format required by your beautiful design
        const formattedOffers = res.data.map((coupon, idx) => {
          // Rotate through predefined UI styles to keep it colorful
          const style = STYLES_POOL[idx % STYLES_POOL.length]; 
          return {
            id: coupon._id,
            tag: style.tag,
            tagCls: style.tagCls,
            discount: coupon.type === "percentage" ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`,
            minOrder: `Min. order ₹${coupon.minOrderAmount || 0}`,
            title: coupon.title || coupon.description || "Limited period offer",
            code: coupon.code,
            expires: "Ongoing",
            urgent: false,
            accentCls: style.accentCls,
            category: style.category,
            usage: Math.floor(Math.random() * 40) + 40 // Simulate usage stat
          };
        });
        setOffersData(formattedOffers);
      }
      setOffersLoading(false);
    }).catch(() => {
      setOffersData([]);
      setOffersLoading(false);
    });
  }, []);

  // 2. Fetch flash sale products
  useEffect(() => {
    setFlashLoading(true);
    fetchDataFromApi("/api/product/getAllProducts?page=1&limit=8")
      .then(res => {
        const prods = res?.products || [];
        const sorted = [...prods].sort((a, b) => (b.discount || 0) - (a.discount || 0));
        setFlashProducts(sorted.slice(0, 6));
      })
      .catch(() => setFlashProducts([]))
      .finally(() => setFlashLoading(false));
  }, []);

  const pad = (n) => String(n).padStart(2, "0");

  const copyCode = useCallback((code) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2400);
  }, []);

  const toggleSave = (id) => {
    setSavedIds(p => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // Filter the dynamically fetched offers
  let filtered = activeTab === "All Offers" ? offersData : offersData.filter(o => o.category === activeTab);
  if (activeCat) filtered = filtered.filter(o => o.tag.toLowerCase().includes(activeCat.toLowerCase()));

  const showFlash = activeTab === "All Offers" || activeTab === "Flash Sales";

  return (
    <div className="op">
      <style>{S}</style>

      {/* HEADER */}
      <div className="op-hd">
        <div className="op-ht">
          <button className="op-back" onClick={() => nav(-1)}>
            <svg viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="op-htit">
            <h1>Deals & Offers</h1>
            <div className="sub">Save more on every order</div>
          </div>
          <div className="op-abadge"><span className="op-adot"/>{offersData.length} Active</div>
        </div>
        <div className="op-tabs">
          {TABS.map(t => <button key={t} className={`op-tab${activeTab === t ? " on" : ""}`} onClick={() => setActiveTab(t)}>{t}</button>)}
        </div>
      </div>

      {/* WELCOME COUPON */}
      <div className="op-wb">
        <div className="op-wbl">
          <h3>🎉 {isLoggedIn ? `Hey ${userName}, here's your exclusive deal!` : "New User Exclusive"}</h3>
          <p>50% off your first order above ₹499 — no catch, just savings</p>
        </div>
        <div className="op-wcode" onClick={() => copyCode("WELCOME50")}>
          <div><div className="op-wctext">WELCOME50</div><span className="op-wclbl">TAP TO COPY</span></div>
          <span style={{fontSize:18}}>📋</span>
        </div>
      </div>

      {/* FLASH SALE */}
      {showFlash && (
        <>
          <div className="op-fw">
            <div className="op-flash">
              <div>
                <div className="op-fey"><span className="op-fedot"/>Live Now</div>
                <div className="op-ftit">⚡ Flash Sale</div>
                <div className="op-fsub">Electronics — limited stock, hurry!</div>
                <div className="op-timer">
                  {[["h","HRS"],["m","MIN"],["s","SEC"]].map(([k,l], i) => (
                    <React.Fragment key={l}>
                      {i > 0 && <span className="op-tsep">:</span>}
                      <div className="op-tb"><span className="op-tn">{pad(timer[k])}</span><span className="op-tl">{l}</span></div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div className="op-fr">
                <div className="op-fnum">70%<br/>OFF</div>
                <button className="op-fbtn" onClick={() => nav("/products?tag=flash")}>Shop Now →</button>
              </div>
            </div>
          </div>

          <div className="op-fprods">
            <div className="op-fphead">
              <h3>🔥 Flash Deals</h3>
              <span onClick={() => nav("/products")} style={{fontSize:12,color:"var(--o)",fontWeight:600,cursor:"pointer"}}>View all →</span>
            </div>
            <div className="op-fscroll">
              {flashLoading
                ? [...Array(5)].map((_, i) => <div key={i} className="sk op-fprod-sk"/>)
                : flashProducts.map(p => (
                    <div key={p._id} className="op-fprod" onClick={() => nav(`/product/${p._id}`)}>
                      <div className="op-fprod-img">
                        <img src={p.images?.[0] || ""} alt={p.name} loading="lazy"
                          onError={e => { e.target.style.display="none"; e.target.parentNode.style.background="#F5F5F5"; }} />
                      </div>
                      <div className="op-fprod-body">
                        <div className="op-fprod-name">{p.name}</div>
                        <div>
                          <span className="op-fprod-price">₹{p.price?.toLocaleString("en-IN")}</span>
                          {p.oldPrice > p.price && <span className="op-fprod-old">₹{p.oldPrice?.toLocaleString("en-IN")}</span>}
                        </div>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
        </>
      )}

      {/* SECTION HEADER + CATEGORY FILTER */}
      <div className="op-sh">
        <h2>Available Coupons</h2>
        <span>{savedIds.size > 0 ? `${savedIds.size} saved` : `${filtered.length} offers`}</span>
      </div>
      <div className="op-cf">
        {CATS.map(c => (
          <button key={c.l} className={`op-catbtn${activeCat === c.l ? " on" : ""}`}
            onClick={() => setActiveCat(activeCat === c.l ? null : c.l)}>
            {c.e} {c.l}
          </button>
        ))}
      </div>

      {/* OFFERS GRID */}
      <div className="op-grid">
        {offersLoading ? (
          <div className="op-empty">
            <CircularProgress color="inherit" size={40} style={{ color: "var(--o)", marginBottom: "14px" }} />
            <h3>Fetching Deals...</h3>
            <p>Gathering the best discounts for you</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="op-empty">
            <div className="ico">🔍</div>
            <h3>No offers found</h3>
            <p>Try a different filter or tab</p>
          </div>
        ) : filtered.map(o => (
          <div key={o.id} className={`op-card${savedIds.has(o.id) ? " saved" : ""}`}>
            <div className="op-ct">
              <div className="op-ch">
                <div className={`op-tag ${o.tagCls}`}>{o.tag}</div>
                <button className={`op-svbtn${savedIds.has(o.id) ? " sv" : ""}`} onClick={() => toggleSave(o.id)}>
                  {savedIds.has(o.id) ? "🧡" : "🤍"}
                </button>
              </div>
              <div className={`op-disc ${o.accentCls}`}>{o.discount}</div>
              <div className="op-min">{o.minOrder}</div>
              <div className="op-title">{o.title}</div>
              <span className={`op-exp ${o.urgent ? "u" : "n"}`}>{o.expires}</span>
              <div className="op-ubwrap">
                <div className="op-ubtop"><span>{o.usage}% claimed</span><span>{100 - o.usage}% left</span></div>
                <div className="op-ubbar"><div className="op-ubfill" style={{width:`${o.usage}%`}}/></div>
              </div>
            </div>
            <div className="op-cb">
              <div className="op-code" onClick={() => copyCode(o.code)}>
                <span>{o.code}</span>
                <span className="op-cpy">📋 COPY</span>
              </div>
              <button className="op-apply" onClick={() => { copyCode(o.code); nav("/cart"); }}>Apply</button>
            </div>
          </div>
        ))}
      </div>

      {/* COPIED TOAST */}
      {copied && (
        <div className="op-toast">
          <span>✓</span> "{copied}" copied to clipboard!
        </div>
      )}
    </div>
  );
}