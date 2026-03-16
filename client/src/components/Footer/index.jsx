import React, { lazy, Suspense, useCallback, useState } from "react";
import { LiaShippingFastSolid } from "react-icons/lia";
import { PiKeyReturnLight } from "react-icons/pi";
import { BsWallet2 } from "react-icons/bs";
import { LiaGiftSolid } from "react-icons/lia";
import { BiSupport } from "react-icons/bi";
import { Link } from "react-router-dom";
import { IoChatboxOutline } from "react-icons/io5";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { FaFacebookF, FaPinterestP, FaInstagram, FaTwitter, FaLinkedinIn } from "react-icons/fa";
import { AiOutlineYoutube } from "react-icons/ai";
import Drawer from "@mui/material/Drawer";
import { useAppContext } from "../../hooks/useAppContext";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import { IoCloseSharp, IoLocationOutline, IoMailOutline, IoCallOutline, IoArrowForward, IoCheckmarkCircle } from "react-icons/io5";
import { MdVerified } from "react-icons/md";

const CartPanel           = lazy(() => import("../CartPanel"));
const AddAddress          = lazy(() => import("../../Pages/MyAccount/addAddress"));
const ProductZoom         = lazy(() => import("../ProductZoom").then(m => ({ default: m.ProductZoom })));
const ProductDetailsComponent = lazy(() =>
  import("../ProductDetails").then(m => ({ default: m.ProductDetailsComponent }))
);

// ── Inline styles (no Tailwind conflicts) ────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --zd-primary:   #ff6b00;
    --zd-secondary: #ff8c00;
    --zd-accent:    #ff6b00;
    --zd-dark:      #ffffff;
    --zd-dark2:     #fff8f2;
    --zd-muted:     #888888;
    --zd-border:    rgba(255,107,0,0.12);
    --zd-text:      #1a1a1a;
    --zd-subtext:   #555555;
    --ff-display:   'Playfair Display', Georgia, serif;
    --ff-body:      'DM Sans', sans-serif;
  }

  .zd-footer * { box-sizing: border-box; }

  /* ── Trust Bar ── */
  .zd-trust-bar {
    background: #ff6b00;
    border-bottom: 1px solid rgba(255,107,0,0.2);
    padding: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .zd-trust-bar::-webkit-scrollbar { display: none; }
  .zd-trust-bar__inner {
    display: flex;
    align-items: stretch;
    max-width: 1280px;
    margin: 0 auto;
    min-width: max-content;
  }
  .zd-trust-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 22px 32px;
    border-right: 1px solid rgba(255,255,255,0.2);
    flex: 1;
    min-width: 180px;
    transition: background 0.3s;
    cursor: default;
  }
  .zd-trust-item:last-child { border-right: none; }
  .zd-trust-item:hover { background: rgba(0,0,0,0.08); }
  .zd-trust-item__icon {
    font-size: 32px;
    color: #fff;
    flex-shrink: 0;
    transition: transform 0.3s;
  }
  .zd-trust-item:hover .zd-trust-item__icon { transform: translateY(-3px); }
  .zd-trust-item__text h3 {
    font-family: var(--ff-body);
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 2px;
    white-space: nowrap;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .zd-trust-item__text p {
    font-family: var(--ff-body);
    font-size: 11px;
    color: rgba(255,255,255,0.75);
    margin: 0;
    white-space: nowrap;
  }

  /* ── Main Footer Body ── */
  .zd-footer__body {
    background: var(--zd-dark);
    padding: 64px 0 40px;
  }
  .zd-footer__body-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 32px;
    display: grid;
    grid-template-columns: 1.4fr 1fr 1fr 1.5fr;
    gap: 40px;
  }
  @media (max-width: 1024px) {
    .zd-footer__body-inner { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 640px) {
    .zd-footer__body-inner { grid-template-columns: 1fr; padding: 0 20px; }
    .zd-footer__body { padding: 40px 0 24px; }
  }

  /* Brand column */
  .zd-brand__logo {
    font-family: var(--ff-display);
    font-size: 28px;
    font-weight: 700;
    color: var(--zd-text);
    margin: 0 0 4px;
    letter-spacing: -0.5px;
  }
  .zd-brand__logo span { color: var(--zd-primary); }
  .zd-brand__tagline {
    font-family: var(--ff-body);
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--zd-muted);
    margin: 0 0 20px;
  }
  .zd-brand__desc {
    font-family: var(--ff-body);
    font-size: 13px;
    line-height: 1.7;
    color: var(--zd-subtext);
    margin: 0 0 24px;
  }
  .zd-contact-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
  .zd-contact-list li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-family: var(--ff-body);
    font-size: 13px;
    color: var(--zd-subtext);
    line-height: 1.5;
  }
  .zd-contact-list li svg { color: var(--zd-primary); font-size: 16px; flex-shrink: 0; margin-top: 1px; }
  .zd-contact-list a { color: var(--zd-subtext); text-decoration: none; transition: color 0.2s; }
  .zd-contact-list a:hover { color: var(--zd-primary); }
  .zd-phone {
    font-family: var(--ff-display);
    font-size: 20px;
    font-weight: 600;
    color: var(--zd-primary) !important;
    letter-spacing: -0.5px;
  }

  /* Nav columns */
  .zd-nav-col h4 {
    font-family: var(--ff-body);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #1a1a1a;
    margin: 0 0 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--zd-border);
    position: relative;
  }
  .zd-nav-col h4::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0;
    width: 24px; height: 2px;
    background: var(--zd-primary);
  }
  .zd-nav-col ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
  .zd-nav-col ul li a {
    font-family: var(--ff-body);
    font-size: 13px;
    color: var(--zd-subtext);
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: color 0.2s, gap 0.2s;
  }
  .zd-nav-col ul li a::before {
    content: '→';
    opacity: 0;
    font-size: 10px;
    transition: opacity 0.2s, transform 0.2s;
    transform: translateX(-4px);
    color: var(--zd-primary);
  }
  .zd-nav-col ul li a:hover { color: var(--zd-primary); }
  .zd-nav-col ul li a:hover::before { opacity: 1; transform: translateX(0); }
  .zd-badge {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.08em;
    padding: 2px 6px;
    border-radius: 3px;
    text-transform: uppercase;
  }
  .zd-badge--new { background: var(--zd-primary); color: white; }
  .zd-badge--hot { background: var(--zd-accent); color: white; }

  /* Newsletter */
  .zd-newsletter h4 {
    font-family: var(--ff-body);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--zd-text);
    margin: 0 0 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--zd-border);
    position: relative;
  }
  .zd-newsletter h4::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0;
    width: 24px; height: 2px;
    background: var(--zd-primary);
  }
  .zd-newsletter__desc {
    font-family: var(--ff-body);
    font-size: 13px;
    color: var(--zd-subtext);
    line-height: 1.6;
    margin: 0 0 20px;
  }
  .zd-newsletter__form { display: flex; flex-direction: column; gap: 10px; }
  .zd-input-wrap { position: relative; }
  .zd-input-wrap input {
    width: 100%;
    height: 46px;
    background: #fff;
    border: 1px solid rgba(255,107,0,0.2);
    border-radius: 6px;
    padding: 0 48px 0 16px;
    font-family: var(--ff-body);
    font-size: 13px;
    color: #1a1a1a;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
  }
  .zd-input-wrap input::placeholder { color: #aaa; }
  .zd-input-wrap input:focus {
    border-color: var(--zd-primary);
    background: rgba(255,107,0,0.05);
  }
  .zd-sub-btn {
    position: absolute !important;
    right: 6px; top: 6px;
    width: 34px !important; height: 34px !important;
    min-width: 34px !important;
    border-radius: 5px !important;
    background: var(--zd-primary) !important;
    color: white !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: background 0.2s, transform 0.2s !important;
  }
  .zd-sub-btn:hover { background: #c1121f !important; transform: scale(1.05) !important; }
  .zd-sub-btn svg { font-size: 16px; }
  .zd-checkbox-label {
    font-family: var(--ff-body) !important;
    font-size: 11px !important;
    color: var(--zd-muted) !important;
  }
  .zd-checkbox-label .MuiCheckbox-root { color: var(--zd-muted) !important; padding: 4px !important; }
  .zd-checkbox-label .MuiCheckbox-root.Mui-checked { color: var(--zd-primary) !important; }
  .zd-sub-success {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--ff-body);
    font-size: 13px;
    color: #3fb950;
    padding: 10px 14px;
    background: rgba(63,185,80,0.1);
    border: 1px solid rgba(63,185,80,0.2);
    border-radius: 6px;
  }

  /* Divider */
  .zd-footer__divider {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 32px;
    border: none;
    border-top: 1px solid var(--zd-border);
  }

  /* Bottom strip */
  .zd-footer__bottom {
    background: #fff4ee;
    border-top: 1px solid rgba(255,107,0,0.12);
    padding: 20px 0 80px;
  }
  @media (min-width: 768px) { .zd-footer__bottom { padding: 20px 0; } }
  .zd-footer__bottom-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
  }
  @media (max-width: 640px) { .zd-footer__bottom-inner { flex-direction: column; text-align: center; padding: 0 20px; } }

  .zd-social { display: flex; align-items: center; gap: 8px; }
  .zd-social a {
    width: 34px; height: 34px;
    border-radius: 50%;
    border: 1px solid rgba(0,0,0,0.12);
    display: flex; align-items: center; justify-content: center;
    color: #555;
    text-decoration: none;
    transition: border-color 0.2s, background 0.2s, color 0.2s, transform 0.2s;
    font-size: 14px;
  }
  .zd-social a:hover {
    border-color: var(--zd-primary);
    background: var(--zd-primary);
    color: white;
    transform: translateY(-2px);
  }

  .zd-copyright {
    font-family: var(--ff-body);
    font-size: 12px;
    color: var(--zd-muted);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .zd-copyright svg { color: var(--zd-primary); font-size: 14px; }

  .zd-payments { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .zd-pay-chip {
    background: #fff4ee;
    border: 1px solid rgba(255,107,0,0.15);
    border-radius: 5px;
    padding: 4px 10px;
    font-family: var(--ff-body);
    font-size: 10px;
    font-weight: 600;
    color: #888;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    transition: border-color 0.2s, color 0.2s;
  }
  .zd-pay-chip:hover { border-color: var(--zd-primary); color: var(--zd-primary); }

  /* Drawers & Modal overrides */
  .cartPanel .MuiDrawer-paper,
  .addressPanel .MuiDrawer-paper {
    width: min(420px, 100vw) !important;
    background: #ffffff !important;
    color: #1a1a1a !important;
  }
  .productDetailsModal .MuiDialog-paper {
    background: #ffffff !important;
    color: #1a1a1a !important;
    border-radius: 12px !important;
    overflow: hidden !important;
  }

  /* Live chat floating button */
  .zd-chat-bubble {
    position: fixed;
    bottom: 24px; right: 24px;
    z-index: 9999;
    background: var(--zd-primary);
    color: white;
    width: 52px; height: 52px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
    box-shadow: 0 4px 24px rgba(230,57,70,0.4);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    border: none;
    outline: none;
  }
  .zd-chat-bubble:hover { transform: scale(1.1); box-shadow: 0 6px 32px rgba(230,57,70,0.5); }

  /* Scroll-to-top */
  .zd-scroll-top {
    position: fixed;
    bottom: 84px; right: 24px;
    z-index: 9998;
    background: rgba(255,107,0,0.1);
    backdrop-filter: blur(8px);
    color: #111;
    width: 40px; height: 40px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    cursor: pointer;
    border: 1px solid rgba(255,107,0,0.2);
    transition: background 0.2s, transform 0.2s;
    outline: none;
  }
  .zd-scroll-top:hover { background: rgba(255,107,0,0.18); transform: translateY(-2px); }
`;

const PaymentChips = () => (
  <div className="zd-payments">
    {["Visa","Mastercard","PayPal","Amex","UPI","RuPay"].map(m => (
      <span key={m} className="zd-pay-chip">{m}</span>
    ))}
  </div>
);

const Footer = () => {
  const context = useAppContext();
  const [email, setEmail]           = useState("");
  const [agreed, setAgreed]         = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subError, setSubError]     = useState("");

  const handleCartClose    = useCallback(() => context.toggleCartPanel(false),    [context]);
  const handleAddressClose = useCallback(() => context.toggleAddressPanel(false), [context]);

  const handleSubscribe = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSubError("Please enter a valid email address.");
      return;
    }
    if (!agreed) {
      setSubError("Please agree to the terms first.");
      return;
    }
    setSubError("");
    setSubscribed(true);
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const trustItems = [
    { Icon: LiaShippingFastSolid, title: "Free Shipping",    sub: "Orders over ₹100" },
    { Icon: PiKeyReturnLight,     title: "30 Days Returns",  sub: "Hassle-free exchange" },
    { Icon: BsWallet2,            title: "Secure Payment",   sub: "100% protected" },
    { Icon: LiaGiftSolid,         title: "Special Gifts",    sub: "On your first order" },
    { Icon: BiSupport,            title: "24/7 Support",     sub: "Always here for you" },
  ];

  const productLinks    = ["Prices drop","New products","Best sales","Contact us","Sitemap","Stores"];
  const companyLinks    = ["Delivery","Legal Notice","Terms & Conditions","About us","Secure payment","Login"];
  const socialLinks     = [
    { Icon: FaFacebookF,  href: "#" },
    { Icon: FaInstagram,  href: "#" },
    { Icon: AiOutlineYoutube, href: "#" },
    { Icon: FaTwitter,    href: "#" },
    { Icon: FaPinterestP, href: "#" },
    { Icon: FaLinkedinIn, href: "#" },
  ];

  return (
    <>
      <style>{css}</style>

      <div className="zd-footer">

        {/* ── Trust bar ───────────────────────────────────────────────── */}
        <div className="zd-trust-bar">
          <div className="zd-trust-bar__inner">
            {trustItems.map(({ Icon, title, sub }) => (
              <div key={title} className="zd-trust-item">
                <Icon className="zd-trust-item__icon" />
                <div className="zd-trust-item__text">
                  <h3>{title}</h3>
                  <p>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main body ───────────────────────────────────────────────── */}
        <footer className="zd-footer__body">
          <div className="zd-footer__body-inner">

            {/* Brand + Contact */}
            <div>
              <p className="zd-brand__logo">Zee<span>daddy</span></p>
              <p className="zd-brand__tagline">Mega Super Store · Est. 2020</p>
              <p className="zd-brand__desc">
                Bihar's premier destination for quality products at unbeatable prices.
                Serving over 50,000 happy customers across India.
              </p>
              <ul className="zd-contact-list">
                <li>
                  <IoLocationOutline />
                  <span>Makhdumpur, Jehanabad, Bihar, India – 804424</span>
                </li>
                <li>
                  <IoMailOutline />
                  <a href="mailto:sonuee15@gmail.com">sonuee15@gmail.com</a>
                </li>
                <li>
                  <IoCallOutline />
                  <a href="tel:+918969737537" className="zd-phone">(+91) 89697 37537</a>
                </li>
                <li>
                  <IoChatboxOutline />
                  <span>Live Chat – <a href="#">Start a conversation</a></span>
                </li>
              </ul>
            </div>

            {/* Products */}
            <div className="zd-nav-col">
              <h4>Products</h4>
              <ul>
                {productLinks.map((t, i) => (
                  <li key={t}>
                    <Link to="/" className="link">
                      {t}
                      {i === 1 && <span className="zd-badge zd-badge--new">New</span>}
                      {i === 2 && <span className="zd-badge zd-badge--hot">Hot</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div className="zd-nav-col">
              <h4>Our Company</h4>
              <ul>
                {companyLinks.map(t => (
                  <li key={t}><Link to="/" className="link">{t}</Link></li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="zd-newsletter">
              <h4>Newsletter</h4>
              <p className="zd-newsletter__desc">
                Get early access to deals, exclusive offers, and new arrivals — straight to your inbox.
              </p>
              {subscribed ? (
                <div className="zd-sub-success">
                  <IoCheckmarkCircle style={{ fontSize: 18 }} />
                  You're subscribed! Watch your inbox.
                </div>
              ) : (
                <div className="zd-newsletter__form">
                  <div className="zd-input-wrap">
                    <input
                      type="email"
                      placeholder="Your email address"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setSubError(""); }}
                      onKeyDown={e => e.key === "Enter" && handleSubscribe()}
                    />
                    <button className="zd-sub-btn" onClick={handleSubscribe} title="Subscribe">
                      <IoArrowForward />
                    </button>
                  </div>
                  {subError && (
                    <p style={{ fontFamily: "var(--ff-body)", fontSize: 11, color: "var(--zd-primary)", margin: 0 }}>
                      {subError}
                    </p>
                  )}
                  <FormControlLabel
                    className="zd-checkbox-label"
                    control={
                      <Checkbox
                        size="small"
                        checked={agreed}
                        onChange={e => setAgreed(e.target.checked)}
                      />
                    }
                    label="I agree to the terms and privacy policy"
                    style={{ marginLeft: 0 }}
                  />
                </div>
              )}

              {/* Trust badges */}
              <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 6 }}>
                <MdVerified style={{ color: "#3fb950", fontSize: 16 }} />
                <span style={{ fontFamily: "var(--ff-body)", fontSize: 11, color: "#888" }}>
                  SSL Secured &amp; DPDP Compliant
                </span>
              </div>
            </div>

          </div>

          {/* Divider */}
          <div style={{ padding: "32px 0 0" }}>
            <hr className="zd-footer__divider" />
          </div>
        </footer>

        {/* ── Bottom strip ────────────────────────────────────────────── */}
        <div className="zd-footer__bottom">
          <div className="zd-footer__bottom-inner">

            {/* Social */}
            <nav className="zd-social" aria-label="Social media">
              {socialLinks.map(({ Icon, href }, i) => (
                <a key={i} href={href} target="_blank" rel="noreferrer">
                  <Icon />
                </a>
              ))}
            </nav>

            {/* Copyright */}
            <p className="zd-copyright">
              <MdVerified />
              © 2026 Zeedaddy Online Shopping. All rights reserved.
            </p>

            {/* Payments */}
            <PaymentChips />

          </div>
        </div>

      </div>

      {/* ── Floating Chat Bubble ─────────────────────────────────────── */}
      {/* <button className="zd-chat-bubble" title="Live Chat" aria-label="Open live chat">
        <IoChatboxOutline />
      </button> */}

      {/* ── Scroll to Top ────────────────────────────────────────────── */}
      <button className="zd-scroll-top" onClick={scrollTop} title="Back to top" aria-label="Scroll to top">
        ↑
      </button>

      {/* ── Cart Panel ────────────────────────────────────────────────── */}
      <Drawer
        open={context.openCartPanel}
        onClose={handleCartClose}
        anchor="right"
        className="cartPanel"
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid rgba(255,107,0,0.12)"
        }}>
          <h4 style={{ margin: 0, fontFamily: "var(--ff-body)", fontSize: 15, color: "#1a1a1a" }}>
            Shopping Cart <span style={{ color: "var(--zd-primary)" }}>({context?.cartData?.length})</span>
          </h4>
          <IoCloseSharp
            style={{ fontSize: 20, cursor: "pointer", color: "#888" }}
            onClick={handleCartClose}
          />
        </div>
        <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#888" }}>Loading…</div>}>
          {context?.cartData?.length !== 0 ? (
            <CartPanel data={context?.cartData} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 80, gap: 16 }}>
              <img src="/empty-cart.png" style={{ width: 130, opacity: 0.6 }} loading="lazy" alt="empty cart" />
              <p style={{ fontFamily: "var(--ff-body)", color: "#888", margin: 0 }}>Your cart is empty</p>
              <button
                style={{
                  background: "var(--zd-primary)", color: "white", border: "none", borderRadius: 6,
                  padding: "10px 20px", fontFamily: "var(--ff-body)", fontSize: 13, cursor: "pointer"
                }}
                onClick={handleCartClose}
              >
                Continue Shopping
              </button>
            </div>
          )}
        </Suspense>
      </Drawer>

      {/* ── Address Panel ─────────────────────────────────────────────── */}
      <Drawer
        open={context.openAddressPanel}
        onClose={handleAddressClose}
        anchor="right"
        className="addressPanel"
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid rgba(255,107,0,0.12)"
        }}>
          <h4 style={{ margin: 0, fontFamily: "var(--ff-body)", fontSize: 15, color: "#1a1a1a" }}>
            {context?.addressMode === "add" ? "Add" : "Edit"} Delivery Address
          </h4>
          <IoCloseSharp
            style={{ fontSize: 20, cursor: "pointer", color: "#888" }}
            onClick={handleAddressClose}
          />
        </div>
        <div style={{ overflowY: "auto", maxHeight: "100vh" }}>
          <Suspense fallback={<div style={{ padding: 32, textAlign: "center", color: "#888" }}>Loading…</div>}>
            {context.openAddressPanel && <AddAddress />}
          </Suspense>
        </div>
      </Drawer>

      {/* ── Product Details Modal ─────────────────────────────────────── */}
      <Dialog
        open={context?.openProductDetailsModal?.open}
        fullWidth={context?.fullWidth}
        maxWidth={context?.maxWidth}
        onClose={context?.handleCloseProductDetailsModal}
        className="productDetailsModal"
      >
        <DialogContent style={{ padding: 0 }}>
          <div style={{ display: "flex", width: "100%", position: "relative" }}>
            <Button
              style={{
                position: "absolute", top: 12, right: 12,
                minWidth: 36, width: 36, height: 36, borderRadius: "50%",
                background: "rgba(0,0,0,0.06)", color: "#1a1a1a"
              }}
              onClick={context?.handleCloseProductDetailsModal}
            >
              <IoCloseSharp style={{ fontSize: 18 }} />
            </Button>
            {context?.openProductDetailsModal?.item && (
              <Suspense fallback={<div style={{ padding: 64, textAlign: "center", width: "100%", color: "#888" }}>Loading…</div>}>
                <div style={{ width: "40%", padding: "32px 12px" }}>
                  <ProductZoom images={context?.openProductDetailsModal?.item?.images} />
                </div>
                <div style={{ width: "60%", padding: "32px 48px 32px 20px" }}>
                  <ProductDetailsComponent item={context?.openProductDetailsModal?.item} />
                </div>
              </Suspense>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Footer;