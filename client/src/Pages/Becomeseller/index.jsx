import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
// React Icons Imports
import { 
  LuRocket, LuShieldCheck, LuBarChart3, LuUsers2, 
  LuArrowRight, LuCheckCircle2, LuStore, LuZap 
} from "react-icons/lu";
import { IoMdTrendingUp } from "react-icons/io";
import { RiMoneyRupeeCircleLine, RiCustomerService2Line } from "react-icons/ri";

import { postData } from "../../utils/api";
import { useAppContext } from "../../hooks/useAppContext";

const STATS = [
  { num: "2.1M+", label: "Active Buyers", icon: <LuUsers2 /> },
  { num: "₹0", label: "Setup Cost", icon: <RiMoneyRupeeCircleLine /> },
  { num: "48hr", label: "Go Live", icon: <LuZap /> },
  { num: "94%", label: "Satisfaction", icon: <LuCheckCircle2 /> },
];

const S = `
/* ... (pichle CSS variables same rahenge) ... */
:root {
  --primary: #F4611A;
  --primary-dark: #D44D0F;
  --primary-light: #FFF4EE;
  --text-main: #1A1A1A;
  --text-muted: #64748b;
  --bg-soft: #F8FAFC;
  --white: #ffffff;
  --border: #E2E8F0;
  --font-sans: 'Plus Jakarta Sans', sans-serif;
}

.bs-wrapper { background: var(--white); font-family: var(--font-sans); color: var(--text-main); }

.bs-navbar {
  position: sticky; top: 0; z-index: 1000;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  height: 72px; display: flex; align-items: center; justify-content: space-between; padding: 0 6%;
}

.bs-hero-grid {
  display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 60px;
  max-width: 1300px; margin: 0 auto; padding: 80px 6% 100px; align-items: center;
}

.bs-icon-box {
  width: 48px; height: 48px; border-radius: 12px;
  background: var(--primary-light); color: var(--primary);
  display: flex; align-items: center; justify-content: center; font-size: 22px;
}

.bs-btn-primary {
  background: var(--primary); color: white; padding: 14px 28px;
  border-radius: 12px; font-weight: 700; border: none; cursor: pointer;
  display: inline-flex; align-items: center; gap: 10px; transition: 0.3s;
}

.bs-btn-primary:hover { background: var(--primary-dark); transform: translateY(-2px); }

/* Registration Form */
.bs-form-card {
  background: white; padding: 40px; border-radius: 24px;
  border: 1px solid var(--border); box-shadow: 0 20px 40px rgba(0,0,0,0.05);
}

.bs-input-field {
  width: 100%; padding: 12px 16px; border-radius: 10px;
  border: 1.5px solid var(--border); margin-top: 6px; outline: none;
}

.bs-input-field:focus { border-color: var(--primary); }

@media (max-width: 968px) {
  .bs-hero-grid { grid-template-columns: 1fr; text-align: center; }
}
`;

export default function BecomeSeller() {
  const nav = useNavigate();
  const ctx = useAppContext();
  const [form, setForm] = useState({ name: "", store: "", email: "", phone: "", category: "" });

  return (
    <div className="bs-wrapper">
      <style>{S}</style>

      <nav className="bs-navbar">
        <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>Zee<span style={{color:"var(--primary)"}}>daddy</span></div>
        <button className="bs-btn-primary" style={{ padding: "10px 20px", fontSize: "0.9rem" }}>
          Login <LuArrowRight />
        </button>
      </nav>

      <section className="bs-hero-grid">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--primary-light)", color: "var(--primary)", padding: "6px 14px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700, marginBottom: "20px" }}>
            <LuRocket /> Start Selling Today
          </div>
          <h1 style={{ fontSize: "3.5rem", fontWeight: 800, lineHeight: 1.1, marginBottom: "24px" }}>
            Build your brand <br/>with <span style={{color:"var(--primary)"}}>Zero Investment.</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", marginBottom: "32px", maxWidth: "500px" }}>
            Join India's fastest growing marketplace. Reach millions of customers and get paid directly to your bank account.
          </p>
          <div style={{ display: "flex", gap: "16px" }}>
            <button className="bs-btn-primary">Create Store <LuStore /></button>
            <button style={{ padding: "14px 28px", borderRadius: "12px", border: "1.5px solid var(--border)", background: "none", fontWeight: 700 }}>
              Learn More
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <div style={{ background: "var(--bg-soft)", padding: "30px", borderRadius: "30px", border: "1px solid var(--border)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {STATS.map((s, i) => (
                <div key={i} style={{ background: "white", padding: "20px", borderRadius: "20px", border: "1px solid var(--border)" }}>
                  <div className="bs-icon-box" style={{ marginBottom: "12px" }}>{s.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: "1.3rem" }}>{s.num}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{s.label}</div>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: "20px", background: "var(--text-main)", color: "white", padding: "24px", borderRadius: "20px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "4px" }}>Active Revenue Growth</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px" }}>
                   +42.8% <IoMdTrendingUp style={{color: "#22c55e"}} />
                </div>
              </div>
              <LuBarChart3 style={{ position: "absolute", right: "-10px", bottom: "-10px", fontSize: "100px", opacity: 0.1 }} />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Trust Badges */}
      <section style={{ borderTop: "1px solid var(--border)", padding: "40px 6%" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "40px", opacity: 0.6, filter: "grayscale(1)" }}>
           <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 700 }}><LuShieldCheck /> Secure Payments</div>
           <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 700 }}><RiCustomerService2Line /> 24/7 Support</div>
           <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 700 }}><LuZap /> Fast Onboarding</div>
        </div>
      </section>

      {/* Registration Form */}
      <section style={{ background: "var(--bg-soft)", padding: "100px 6%" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "20px" }}>Join the Zeedaddy Family</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "30px" }}>Become a certified seller and start earning in less than 48 hours.</p>
            <div style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <LuCheckCircle2 style={{ color: "var(--primary)", flexShrink: 0, marginTop: "4px" }} />
                <div><strong>No Registration Fee</strong><br/><small>Start for free, grow without limits.</small></div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <LuCheckCircle2 style={{ color: "var(--primary)", flexShrink: 0, marginTop: "4px" }} />
                <div><strong>Daily Payouts</strong><br/><small>Get your earnings directly in your bank.</small></div>
              </div>
            </div>
          </div>

          <div className="bs-form-card">
            <h3 style={{ marginBottom: "24px" }}>Seller Registration</h3>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Full Name</label>
              <input className="bs-input-field" placeholder="Ravi Singh" />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Store Name</label>
              <input className="bs-input-field" placeholder="My Awesome Store" />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Category</label>
              <select className="bs-input-field">
                <option>Clothing & Fashion</option>
                <option>Groceries</option>
                <option>Electronics</option>
              </select>
            </div>
            <button className="bs-btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Launch My Store <LuArrowRight />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}