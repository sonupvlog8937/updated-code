import React, { useEffect } from "react";
import { Link } from "react-router-dom";

// ─── Contact Info ─────────────────────────────────────────────────
const CONTACT_INFO = {
  email: "sonupvlog8937@gmail.com",
  phone: "+91 8969737537",
  whatsapp: "+91 8969737537",
  address: "Paibigha, Makhdumpur, Jehnabad, Bihar 804424, India",
  website: "https://zeedaddy.in",
  businessHours: "Mon - Sat: 9:00 AM - 6:00 PM",
};

// ─── Social Links ─────────────────────────────────────────────────
const SOCIAL_LINKS = [
  {
    icon: "instagram",
    label: "Instagram",
    url: "https://www.instagram.com/zeedaddy15?utm_source=qr&igsh=MXFvZnRyemk2bXJxNA==",
    gradient: "linear-gradient(135deg, #f953c6, #b91d73)",
    shadow: "rgba(249,83,198,0.35)",
  },
  {
    icon: "facebook",
    label: "Facebook",
    url: "https://www.facebook.com/share/18omUEzwUR/",
    gradient: "linear-gradient(135deg, #2193b0, #1565c0)",
    shadow: "rgba(33,147,176,0.35)",
  },
  {
    icon: "youtube",
    label: "YouTube",
    url: "https://www.youtube.com/@zeedaddy",
    gradient: "linear-gradient(135deg, #ff416c, #c0392b)",
    shadow: "rgba(255,65,108,0.35)",
  },
  {
    icon: "x-twitter",      // Font Awesome 6 ka X icon
    label: "X",
    url: "https://x.com/zeedaddy15",
    gradient: "linear-gradient(135deg, #000000, #333333)",
    shadow: "rgba(0,0,0,0.35)",
  },
  {
    icon: "linkedin-in",
    label: "LinkedIn",
    url: "https://www.linkedin.com/in/zee-daddy-046732392?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    gradient: "linear-gradient(135deg, #0077b5, #004c7f)",
    shadow: "rgba(0,119,181,0.35)",
  },
  {
    icon: "whatsapp",
    label: "WA Channel",
    url: "https://whatsapp.com/channel/0029Vb8db7hIXnlpJPX3hf43", // ← apna link daal do
    gradient: "linear-gradient(135deg, #25d366, #128c7e)",
    shadow: "rgba(37,211,102,0.35)",
  },
];

// ─── Contact Card Component ──────────────────────────────────────
const ContactCard = ({ icon, title, subtitle, onClick, delay = 0, gradient }) => {
  return (
    <div
      className="contact-card"
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="contact-icon" style={{ background: gradient || "linear-gradient(135deg, #FF6B00, #FF9500)" }}>
        <i className={`fa-brands fa-${icon} fa-solid fa-${icon}`} />
      </div>
      <div className="contact-content">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <i className="fas fa-chevron-right contact-arrow" />
    </div>
  );
};

// ─── Social Button Component ──────────────────────────────────────
const SocialButton = ({ icon, label, gradient, shadow, url, delay = 0 }) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="social-button"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="social-icon"
        style={{ background: gradient, boxShadow: `0 6px 16px ${shadow}` }}
      >
        <i className={`fab fa-${icon}`} />
      </div>
      <span className="social-label">{label}</span>
    </a>
  );
};

// ─── Main Contact Component ──────────────────────────────────────
const Contact = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleEmail = () => {
    window.location.href = `mailto:${CONTACT_INFO.email}`;
  };

  const handlePhone = () => {
    window.location.href = `tel:${CONTACT_INFO.phone}`;
  };

  const handleWhatsApp = () => {
    const message = "Hi Zeedaddy, I need support with...";
    const whatsappNumber = CONTACT_INFO.whatsapp.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleWebsite = () => {
    window.open(CONTACT_INFO.website, "_blank");
  };

  const handleAddress = () => {
    const addressEncoded = encodeURIComponent(CONTACT_INFO.address);
    window.open(`https://www.google.com/maps/search/${addressEncoded}`, "_blank");
  };

  return (
    <>
      <style>{contactStyles}</style>
      <section className="contact-section">
        {/* Background Effects */}
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div className="contact-container">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <Link to="/" className="breadcrumb-link">Home</Link>
            <i className="fas fa-chevron-right breadcrumb-separator" />
            <span className="breadcrumb-current">Contact & Support</span>
          </div>

          {/* Hero Section */}
          <div className="hero-section">
            <div className="logo-container">
              <div className="logo-gradient">
                <i className="fas fa-shopping-bag" />
              </div>
            </div>
            <h1 className="hero-title">Zeedaddy</h1>
            <p className="hero-subtitle">
              We're here to help! Get in touch with us
            </p>
          </div>

          {/* Contact Cards */}
          <div className="contact-grid">
            <ContactCard
              icon="envelope"
              title="Email Us"
              subtitle={CONTACT_INFO.email}
              onClick={handleEmail}
              delay={100}
            />
            <ContactCard
              icon="phone"
              title="Call Us"
              subtitle={CONTACT_INFO.phone}
              onClick={handlePhone}
              delay={200}
            />
            <ContactCard
              icon="whatsapp"
              title="WhatsApp"
              subtitle={CONTACT_INFO.whatsapp}
              onClick={handleWhatsApp}
              delay={300}
              gradient="linear-gradient(135deg, #25d366, #128c7e)"
            />
            <ContactCard
              icon="globe"
              title="Visit Website"
              subtitle={CONTACT_INFO.website}
              onClick={handleWebsite}
              delay={400}
              gradient="linear-gradient(135deg, #667eea, #764ba2)"
            />
            <ContactCard
              icon="map-marker-alt"
              title="Office Address"
              subtitle={CONTACT_INFO.address}
              onClick={handleAddress}
              delay={500}
              gradient="linear-gradient(135deg, #f7971e, #ffd200)"
            />
          </div>

          {/* Social Media Section */}
          <div className="section-header" style={{ animationDelay: "550ms" }}>
            <i className="fas fa-share-nodes section-header-icon" />
            <h2 className="section-title">Follow Us</h2>
          </div>

          <div className="social-grid">
            {SOCIAL_LINKS.map((s, i) => (
              <SocialButton
                key={s.label}
                icon={s.icon}
                label={s.label}
                gradient={s.gradient}
                shadow={s.shadow}
                url={s.url}
                delay={600 + i * 80}
              />
            ))}
          </div>

          {/* Info Cards */}
          <div className="info-cards">
            <div className="info-card" style={{ animationDelay: "1100ms" }}>
              <div className="info-header">
                <i className="fas fa-clock" />
                <h3>Business Hours</h3>
              </div>
              <p>{CONTACT_INFO.businessHours}</p>
              <p className="info-subtext">Sunday: Closed</p>
            </div>

            <div className="info-card" style={{ animationDelay: "1200ms" }}>
              <div className="info-header">
                <i className="fas fa-info-circle" />
                <h3>Quick Support</h3>
              </div>
              <p>
                For urgent queries, WhatsApp us for instant support. We
                typically respond within 30 minutes during business hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────
const contactStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css');

  .contact-section {
    min-height: 100vh;
    background: #fafaf8;
    font-family: 'Plus Jakarta Sans', sans-serif;
    position: relative;
    overflow: hidden;
    padding: 3rem 1rem;
  }

  /* Background Effects */
  .blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    z-index: 0;
  }
  .blob-1 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(255,107,0,0.12) 0%, transparent 70%);
    top: -100px; right: -100px;
    animation: blobFloat 8s ease-in-out infinite alternate;
  }
  .blob-2 {
    width: 350px; height: 350px;
    background: radial-gradient(circle, rgba(255,149,0,0.1) 0%, transparent 70%);
    bottom: -80px; left: -80px;
    animation: blobFloat 10s ease-in-out infinite alternate-reverse;
  }
  .blob-3 {
    width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(102,126,234,0.08) 0%, transparent 70%);
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    animation: blobFloat 12s ease-in-out infinite alternate;
  }
  @keyframes blobFloat {
    from { transform: translate(0,0) scale(1); }
    to   { transform: translate(30px,20px) scale(1.08); }
  }

  .contact-container {
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  /* Breadcrumb */
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 2rem;
    font-size: 0.875rem;
  }
  .breadcrumb-link {
    color: #6b7280;
    text-decoration: none;
    transition: color 0.2s;
  }
  .breadcrumb-link:hover { color: #FF6B00; }
  .breadcrumb-separator { color: #d1d5db; font-size: 0.75rem; }
  .breadcrumb-current { color: #111827; font-weight: 600; }

  /* Hero */
  .hero-section {
    text-align: center;
    margin-bottom: 3rem;
    animation: fadeInUp 0.6s ease-out;
  }
  .logo-container { display: inline-flex; margin-bottom: 1.5rem; }
  .logo-gradient {
    width: 80px; height: 80px;
    border-radius: 24px;
    background: linear-gradient(135deg, #FF6B00, #FF9500);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 12px 32px rgba(255,107,0,0.35);
    animation: logoBounce 0.8s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  .logo-gradient i { font-size: 36px; color: #fff; }
  @keyframes logoBounce {
    from { opacity: 0; transform: scale(0.5) rotate(-10deg); }
    to   { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  .hero-title {
    font-size: 2.5rem; font-weight: 700;
    color: #0f0f0f; letter-spacing: -0.03em;
    margin: 0 0 0.75rem;
  }
  .hero-subtitle { font-size: 1rem; color: #6b7280; margin: 0; }

  /* Contact Grid */
  .contact-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
    margin-bottom: 2.5rem;
  }
  .contact-card {
    background: #ffffff;
    border-radius: 16px; padding: 1.5rem;
    display: flex; align-items: center; gap: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    border: 1px solid rgba(0,0,0,0.05);
    animation: fadeInUp 0.5s ease-out both;
    text-decoration: none;
  }
  .contact-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(255,107,0,0.15);
    border-color: rgba(255,107,0,0.2);
  }
  .contact-icon {
    width: 56px; height: 56px;
    border-radius: 14px;
    background: linear-gradient(135deg, #FF6B00, #FF9500);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .contact-icon i { font-size: 24px; color: #fff; }
  .contact-content { flex: 1; }
  .contact-content h3 {
    font-size: 1rem; font-weight: 600;
    color: #111827; margin: 0 0 0.25rem;
  }
  .contact-content p { font-size: 0.875rem; color: #6b7280; margin: 0; }
  .contact-arrow {
    color: #d1d5db; font-size: 1rem;
    transition: transform 0.3s ease;
  }
  .contact-card:hover .contact-arrow {
    transform: translateX(4px);
    color: #FF6B00;
  }

  /* Section Header */
  .section-header {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 1.25rem;
    animation: fadeInUp 0.5s ease-out both;
  }
  .section-header-icon { font-size: 1rem; color: #FF6B00; }
  .section-title {
    font-size: 1.125rem; font-weight: 600;
    color: #111827; margin: 0;
  }

  /* Social Grid */
  .social-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 1rem;
    margin-bottom: 2.5rem;
  }
  .social-button {
    display: flex; flex-direction: column;
    align-items: center; gap: 0.6rem;
    background: #ffffff;
    border-radius: 16px; padding: 1.25rem 0.5rem;
    cursor: pointer; text-decoration: none;
    border: 1px solid rgba(0,0,0,0.05);
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    transition: all 0.3s ease;
    animation: fadeInUp 0.5s ease-out both;
  }
  .social-button:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
  .social-icon {
    width: 48px; height: 48px;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.3s ease;
  }
  .social-button:hover .social-icon { transform: scale(1.1); }
  .social-icon i { font-size: 22px; color: #fff; }
  .social-label {
    font-size: 0.8rem; font-weight: 500;
    color: #374151; text-align: center;
  }

  /* Info Cards */
  .info-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
  }
  .info-card {
    background: #ffffff;
    border-radius: 16px; padding: 1.75rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    border: 1px solid rgba(0,0,0,0.05);
    animation: fadeInUp 0.5s ease-out both;
  }
  .info-header {
    display: flex; align-items: center; gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .info-header i { font-size: 1.25rem; color: #FF6B00; }
  .info-header h3 {
    font-size: 1.125rem; font-weight: 600;
    color: #111827; margin: 0;
  }
  .info-card p {
    font-size: 0.9375rem; color: #6b7280;
    line-height: 1.6; margin: 0 0 0.5rem;
  }
  .info-card p:last-child { margin-bottom: 0; }
  .info-subtext {
    font-size: 0.875rem !important;
    color: #9ca3af !important;
    margin-top: 0.5rem !important;
  }

  /* Animations */
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .social-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 768px) {
    .contact-section { padding: 2rem 1rem; }
    .hero-title { font-size: 2rem; }
    .contact-grid { grid-template-columns: 1fr; }
    .info-cards { grid-template-columns: 1fr; }
    .social-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 480px) {
    .social-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;

export default Contact;