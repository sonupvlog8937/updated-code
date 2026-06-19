import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const faqData = [
  {
    category: "General",
    icon: "fa-info-circle",
    questions: [
      {
        q: "What is Zeedaddy?",
        a: "Zeedaddy is a comprehensive e-commerce platform that connects buyers with quality sellers across India. We offer a wide range of products including fashion, electronics, home essentials, groceries, and more at competitive prices with fast delivery.",
      },
      {
        q: "How do I create an account?",
        a: "Creating an account is simple! Click on the 'Login' button, enter your email address, and we'll send you an OTP. Verify the OTP, enter your name, and you're all set. You can also sign up using your social media accounts.",
      },
      {
        q: "Is my personal information safe?",
        a: "Absolutely! We use industry-leading encryption and security measures to protect your personal information. Your data is never shared with third parties without your consent, and all transactions are processed through secure payment gateways.",
      },
      {
        q: "Which areas do you deliver to?",
        a: "We currently deliver to over 50 cities across India. Enter your pincode during checkout to check if delivery is available in your area. We're constantly expanding our delivery network to reach more customers.",
      },
    ],
  },
  {
    category: "Orders & Shipping",
    icon: "fa-truck",
    questions: [
      {
        q: "How do I track my order?",
        a: "Once your order is shipped, you'll receive a tracking number via email and SMS. You can also track your order in real-time by visiting the 'My Orders' section in your account. Click on the specific order to see its current status and estimated delivery date.",
      },
      {
        q: "What are the delivery charges?",
        a: "Delivery charges vary based on your location and order value. Orders above ₹499 qualify for free delivery. For orders below this amount, standard delivery charges of ₹40–₹80 apply depending on your pincode.",
      },
      {
        q: "How long does delivery take?",
        a: "Standard delivery typically takes 3–7 business days depending on your location. Express delivery (available in select cities) takes 1–2 business days. You'll receive an estimated delivery date at checkout.",
      },
      {
        q: "Can I change my delivery address after placing an order?",
        a: "You can change your delivery address within 2 hours of placing the order, provided it hasn't been shipped yet. Contact our customer support team immediately or update it through the 'My Orders' section.",
      },
      {
        q: "What if I'm not available during delivery?",
        a: "Our delivery partner will attempt delivery up to 3 times. If you're unavailable, you can reschedule delivery through the tracking link sent to you, or arrange for someone else to receive the package on your behalf.",
      },
    ],
  },
  {
    category: "Payments",
    icon: "fa-credit-card",
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept multiple payment methods including Credit/Debit Cards, Net Banking, UPI, Digital Wallets (Paytm, PhonePe, Google Pay), and Cash on Delivery (COD) for eligible orders.",
      },
      {
        q: "Is it safe to use my credit/debit card?",
        a: "Yes, it's completely safe. All card transactions are processed through PCI-DSS compliant payment gateways with 256-bit SSL encryption. We never store your complete card details on our servers.",
      },
      {
        q: "When will I receive my refund?",
        a: "Refunds are processed within 5–7 business days after we receive your returned item. The amount will be credited to your original payment method. For COD orders, refunds are processed via bank transfer or store credit.",
      },
      {
        q: "Do you offer Cash on Delivery (COD)?",
        a: "Yes, COD is available for most products and locations. However, some high-value items may not be eligible for COD. You'll see the COD option at checkout if it's available for your order.",
      },
      {
        q: "Are there any hidden charges?",
        a: "No, we believe in complete transparency. The total amount shown at checkout is the final amount you'll pay, including all applicable taxes and delivery charges. There are no hidden fees.",
      },
    ],
  },
  {
    category: "Returns & Refunds",
    icon: "fa-undo-alt",
    questions: [
      {
        q: "What is your return policy?",
        a: "We offer a hassle-free 7-day return policy for most products. Items must be unused, in original packaging, with all tags intact. Some categories like electronics have specific return conditions mentioned on the product page.",
      },
      {
        q: "How do I return a product?",
        a: "Go to 'My Orders', select the item you want to return, click 'Return', choose the reason, and submit. Our team will arrange a free pickup from your address. Once we receive and verify the item, your refund will be processed.",
      },
      {
        q: "What items cannot be returned?",
        a: "Perishable goods (food, flowers), intimate wear, custom-made items, personal care products that have been opened, and digital products cannot be returned for hygiene and safety reasons.",
      },
      {
        q: "Do I need to pay for return shipping?",
        a: "No, return pickup is completely free for all eligible returns. Our delivery partner will collect the item from your doorstep at no extra cost.",
      },
      {
        q: "Can I exchange a product instead of returning it?",
        a: "Yes, exchanges are available for select categories like clothing and footwear. Choose the 'Exchange' option when initiating a return, and select your preferred size/color. The new item will be shipped once we receive the original product.",
      },
    ],
  },
  {
    category: "Products",
    icon: "fa-box-open",
    questions: [
      {
        q: "How do I know if a product is genuine?",
        a: "All products on Zeedaddy are sourced directly from authorized sellers and brands. We have strict quality checks and seller verification processes. Look for the 'Verified Seller' badge and check product reviews from other customers.",
      },
      {
        q: "Can I see product reviews before buying?",
        a: "Yes! Every product page displays genuine customer reviews and ratings. You can filter reviews by rating, see photos uploaded by customers, and read detailed feedback to make an informed decision.",
      },
      {
        q: "What if I receive a damaged or defective product?",
        a: "Please report it within 48 hours of delivery through 'My Orders'. Share photos of the damage, and we'll arrange an immediate replacement or full refund without requiring you to return the item first.",
      },
      {
        q: "Do you offer warranty on products?",
        a: "Yes, all electronics and appliances come with manufacturer warranty. Warranty details are mentioned on the product page. Keep your invoice safe as it's required for warranty claims.",
      },
      {
        q: "How can I find the best deals?",
        a: "Check our 'Offers' section for ongoing deals and discounts. Subscribe to our newsletter to receive exclusive offers. Follow us on social media for flash sales and special promotions. Download our mobile app for app-only deals.",
      },
    ],
  },
  {
    category: "Account & Security",
    icon: "fa-user-shield",
    questions: [
      {
        q: "I forgot my password. What should I do?",
        a: "Click on 'Forgot Password' on the login page, enter your registered email, and we'll send you a password reset link. You can also use the OTP login option for quick access without a password.",
      },
      {
        q: "How do I update my profile information?",
        a: "Go to 'My Account', click on 'Profile', and update your name, email, phone number, or other details. Don't forget to save changes. For email or phone number updates, we'll send a verification code.",
      },
      {
        q: "Can I have multiple addresses saved?",
        a: "Yes! You can save multiple delivery addresses in your account. Go to 'My Account' > 'Addresses' to add, edit, or delete addresses. You can also set a default address for faster checkout.",
      },
      {
        q: "How do I delete my account?",
        a: "Contact our customer support team with your account deletion request. For security reasons, we'll verify your identity before processing the deletion. Note that this action is irreversible.",
      },
      {
        q: "What should I do if I suspect unauthorized access?",
        a: "Immediately change your password and enable two-factor authentication. Check your order history for any unauthorized purchases. Contact our support team right away, and we'll help secure your account.",
      },
    ],
  },
];

/* ── FAQ Item ── */
const FAQItem = ({ item, isOpen, onToggle }) => (
  <div style={styles.faqItem(isOpen)}>
    <button style={styles.faqBtn} onClick={onToggle} aria-expanded={isOpen}>
      <span style={styles.faqQ}>{item.q}</span>
      <i
        className={`fas fa-chevron-${isOpen ? "up" : "down"}`}
        style={styles.chevron(isOpen)}
      />
    </button>
    {isOpen && (
      <div style={styles.faqAns}>
        <p style={styles.faqAnsText}>{item.a}</p>
      </div>
    )}
  </div>
);

/* ── Main Component ── */
const FAQ = () => {
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggle = (id) => setActiveId((prev) => (prev === id ? null : id));

  /* Filter by tab then by search */
  const filtered = faqData
    .filter((cat) => activeTab === "All" || cat.category === activeTab)
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (q) =>
          !search ||
          q.q.toLowerCase().includes(search.toLowerCase()) ||
          q.a.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.questions.length > 0);

  return (
    <>
      <style>{cssString}</style>
      <section style={styles.section}>
        <div style={styles.container}>
          {/* Breadcrumb */}
          <nav style={styles.breadcrumb}>
            <Link to="/" style={styles.bcLink}>Home</Link>
            <i className="fas fa-chevron-right" style={styles.bcSep} />
            <span style={styles.bcCurrent}>FAQ</span>
          </nav>

          {/* Hero */}
          <div style={styles.hero}>
            <div style={styles.heroIconWrap}>
              <i className="fas fa-question-circle" style={styles.heroIcon} />
            </div>
            <h1 style={styles.heroTitle}>Frequently Asked Questions</h1>
            <p style={styles.heroSub}>
              Find answers to common questions about Zeedaddy. Can't find what
              you're looking for?{" "}
              <Link to="/contact" style={styles.heroLink}>
                Contact our support team.
              </Link>
            </p>

            {/* Search */}
            <div style={styles.searchWrap}>
              <i className="fas fa-search" style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search for answers..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setActiveId(null);
                }}
                style={styles.searchInput}
                className="faq-search-input"
              />
              {search && (
                <button
                  style={styles.clearBtn}
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div style={styles.tabs}>
            {["All", ...faqData.map((c) => c.category)].map((tab) => (
              <button
                key={tab}
                style={styles.tabBtn(activeTab === tab)}
                className={`faq-tab ${activeTab === tab ? "faq-tab-active" : ""}`}
                onClick={() => {
                  setActiveTab(tab);
                  setActiveId(null);
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* FAQ Sections */}
          {filtered.length > 0 ? (
            filtered.map((cat) => (
              <div key={cat.category} style={styles.section2}>
                <div style={styles.catHeader}>
                  <div style={styles.catIconWrap}>
                    <i className={`fas ${cat.icon}`} style={styles.catIcon} />
                  </div>
                  <h2 style={styles.catTitle}>{cat.category}</h2>
                  <span style={styles.catCount}>{cat.questions.length} questions</span>
                </div>

                <div style={styles.faqList}>
                  {cat.questions.map((item, i) => {
                    const id = `${cat.category}-${i}`;
                    return (
                      <FAQItem
                        key={id}
                        item={item}
                        isOpen={activeId === id}
                        onToggle={() => toggle(id)}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div style={styles.noResults}>
              <i className="fas fa-search" style={styles.noResultsIcon} />
              <h3 style={styles.noResultsTitle}>No results found</h3>
              <p style={styles.noResultsSub}>
                Try different keywords or browse through the categories above.
              </p>
              <button
                style={styles.clearSearchBtn}
                onClick={() => setSearch("")}
              >
                Clear Search
              </button>
            </div>
          )}

          {/* CTA */}
          <div style={styles.cta}>
            <div style={styles.ctaIconWrap}>
              <i className="fas fa-headset" style={styles.ctaIcon} />
            </div>
            <div style={styles.ctaText}>
              <h3 style={styles.ctaTitle}>Still have questions?</h3>
              <p style={styles.ctaSub}>Our support team is here to help you 24/7</p>
            </div>
            <Link to="/contact" style={styles.ctaBtn} className="faq-cta-btn">
              Contact Support <i className="fas fa-arrow-right" style={{ marginLeft: 8 }} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

/* ── Inline Styles ── */
const ORANGE = "#FF6B00";
const ORANGE_LIGHT = "rgba(255,107,0,0.08)";
const ORANGE_BORDER = "rgba(255,107,0,0.25)";

const styles = {
  section: {
    minHeight: "100vh",
    background: "#fafaf8",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    padding: "3rem 1rem 5rem",
  },
  container: {
    maxWidth: 860,
    margin: "0 auto",
  },

  /* Breadcrumb */
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: "2.5rem",
    fontSize: 13,
  },
  bcLink: { color: "#6b7280", textDecoration: "none" },
  bcSep: { color: "#d1d5db", fontSize: 11 },
  bcCurrent: { color: "#111827", fontWeight: 600 },

  /* Hero */
  hero: { textAlign: "center", marginBottom: "2.5rem" },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    background: `linear-gradient(135deg, ${ORANGE}, #FF9500)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1.25rem",
    boxShadow: `0 10px 28px rgba(255,107,0,0.28)`,
  },
  heroIcon: { fontSize: 34, color: "#fff" },
  heroTitle: {
    fontSize: "2.25rem",
    fontWeight: 800,
    color: "#0f0f0f",
    letterSpacing: "-0.03em",
    margin: "0 0 0.75rem",
  },
  heroSub: {
    fontSize: "1rem",
    color: "#6b7280",
    maxWidth: 520,
    margin: "0 auto 1.5rem",
    lineHeight: 1.6,
  },
  heroLink: { color: ORANGE, textDecoration: "none", fontWeight: 500 },

  /* Search */
  searchWrap: {
    position: "relative",
    maxWidth: 520,
    margin: "0 auto",
  },
  searchIcon: {
    position: "absolute",
    left: 16,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9ca3af",
    fontSize: 16,
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: "0.875rem 3rem 0.875rem 3rem",
    border: "1.5px solid #e5e7eb",
    borderRadius: 14,
    fontSize: "0.9375rem",
    fontFamily: "inherit",
    background: "#fff",
    color: "#111827",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  clearBtn: {
    position: "absolute",
    right: 14,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9ca3af",
    fontSize: 15,
    padding: 4,
  },

  /* Tabs */
  tabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: "2.5rem",
  },
  tabBtn: (active) => ({
    padding: "7px 16px",
    borderRadius: 999,
    border: active ? `1.5px solid ${ORANGE_BORDER}` : "1.5px solid #e5e7eb",
    background: active ? ORANGE_LIGHT : "#fff",
    color: active ? ORANGE : "#4b5563",
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.2s",
  }),

  /* Category Section */
  section2: { marginBottom: "2.5rem" },
  catHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  catIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: ORANGE_LIGHT,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  catIcon: { fontSize: 18, color: ORANGE },
  catTitle: { fontSize: "1.375rem", fontWeight: 700, color: "#0f0f0f", margin: 0 },
  catCount: {
    fontSize: 12,
    color: "#9ca3af",
    background: "#f3f4f6",
    padding: "3px 10px",
    borderRadius: 999,
    marginLeft: "auto",
  },

  /* FAQ List */
  faqList: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    overflow: "hidden",
    background: "#fff",
  },

  /* FAQ Item */
  faqItem: (isOpen) => ({
    borderBottom: "1px solid #f3f4f6",
    background: isOpen ? "#fff9f5" : "#fff",
    transition: "background 0.2s",
  }),
  faqBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "1.125rem 1.25rem",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
  },
  faqQ: {
    fontSize: "0.9375rem",
    fontWeight: 600,
    color: "#111827",
    flex: 1,
    lineHeight: 1.5,
  },
  chevron: (isOpen) => ({
    fontSize: 14,
    color: isOpen ? ORANGE : "#9ca3af",
    flexShrink: 0,
    transition: "color 0.2s",
  }),
  faqAns: {
    padding: "0 1.25rem 1.125rem",
  },
  faqAnsText: {
    fontSize: "0.9375rem",
    color: "#4b5563",
    lineHeight: 1.75,
    margin: 0,
    borderLeft: `3px solid ${ORANGE}`,
    paddingLeft: 14,
  },

  /* No Results */
  noResults: {
    textAlign: "center",
    padding: "4rem 2rem",
    background: "#fff",
    borderRadius: 20,
    border: "1px solid #e5e7eb",
  },
  noResultsIcon: { fontSize: 48, color: "#d1d5db", display: "block", marginBottom: 12 },
  noResultsTitle: { fontSize: "1.25rem", fontWeight: 700, color: "#111827", margin: "0 0 8px" },
  noResultsSub: { fontSize: "0.9375rem", color: "#6b7280", margin: "0 0 1.25rem" },
  clearSearchBtn: {
    padding: "0.625rem 1.5rem",
    background: ORANGE,
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  /* CTA */
  cta: {
    marginTop: "3rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: 20,
    padding: "2rem 2.5rem",
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
    flexWrap: "wrap",
  },
  ctaIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  ctaIcon: { fontSize: 26, color: "#fff" },
  ctaText: { flex: 1, minWidth: 180 },
  ctaTitle: { fontSize: "1.25rem", fontWeight: 700, color: "#fff", margin: "0 0 4px" },
  ctaSub: { fontSize: "0.9375rem", color: "rgba(255,255,255,0.85)", margin: 0 },
  ctaBtn: {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.75rem 1.75rem",
    background: "#fff",
    color: "#667eea",
    borderRadius: 12,
    textDecoration: "none",
    fontSize: "0.9375rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
};

/* ── Global CSS (focus styles + font import) ── */
const cssString = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .faq-search-input:focus {
    outline: none;
    border-color: #FF6B00 !important;
    box-shadow: 0 0 0 4px rgba(255,107,0,0.1);
  }
  .faq-search-input::placeholder {
    color: #9ca3af;
  }
  .faq-tab:hover {
    border-color: rgba(255,107,0,0.4) !important;
    color: #FF6B00 !important;
  }
  .faq-cta-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255,255,255,0.25);
  }

  @media (max-width: 640px) {
    .faq-section h1 { font-size: 1.75rem !important; }
    .faq-cta { flex-direction: column; text-align: center; }
    .faq-cta-btn { width: 100%; justify-content: center; }
  }
`;

export default FAQ;