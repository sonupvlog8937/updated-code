import React, { useEffect } from "react";
import { Link } from "react-router-dom";

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <style>{aboutStyles}</style>
      <section className="about-section">
        {/* Background Effects */}
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div className="about-container">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <Link to="/" className="breadcrumb-link">
              Home
            </Link>
            <i className="fas fa-chevron-right breadcrumb-separator" />
            <span className="breadcrumb-current">About Us</span>
          </div>

          {/* Hero Section */}
          <div className="hero-section">
            <div className="hero-badge">
              <i className="fas fa-star" />
              <span>Your Trusted Shopping Partner</span>
            </div>
            <h1 className="hero-title">
              Welcome to <span className="brand-highlight">Zeedaddy</span>
            </h1>
            <p className="hero-subtitle">
              Revolutionizing the way you shop online with quality products,
              unbeatable prices, and exceptional service.
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="mission-vision-grid">
            <div className="card mission-card">
              <div className="card-icon">
                <i className="fas fa-bullseye" />
              </div>
              <h3>Our Mission</h3>
              <p>
                To provide customers with a seamless shopping experience by
                offering high-quality products at competitive prices, backed by
                world-class customer service and fast delivery.
              </p>
            </div>

            <div className="card vision-card">
              <div className="card-icon">
                <i className="fas fa-rocket" />
              </div>
              <h3>Our Vision</h3>
              <p>
                To become India's most trusted and innovative e-commerce
                platform, empowering millions of customers and sellers to
                connect, trade, and grow together.
              </p>
            </div>
          </div>

          {/* Story Section */}
          <div className="story-section">
            <div className="section-header">
              <h2>Our Story</h2>
              <div className="section-divider" />
            </div>
            <div className="story-content">
              <p>
                Founded with a vision to transform online shopping in India,
                Zeedaddy started as a small initiative to connect quality
                sellers with discerning buyers. Today, we've grown into a
                comprehensive marketplace serving thousands of customers across
                the country.
              </p>
              <p>
                Our journey began with a simple belief: everyone deserves access
                to quality products at fair prices. We've built our platform
                on the pillars of trust, transparency, and customer
                satisfaction.
              </p>
              <p>
                From fashion and electronics to home essentials and groceries,
                we've expanded our offerings to meet every need. Our commitment
                to innovation drives us to constantly improve and deliver the
                best shopping experience possible.
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="features-section">
            <div className="section-header">
              <h2>Why Choose Zeedaddy?</h2>
              <div className="section-divider" />
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-shield-alt" />
                </div>
                <h4>100% Secure</h4>
                <p>
                  Your transactions are protected with industry-leading
                  encryption and security measures.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-shipping-fast" />
                </div>
                <h4>Fast Delivery</h4>
                <p>
                  Get your orders delivered quickly with our reliable logistics
                  network across India.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-hand-holding-usd" />
                </div>
                <h4>Best Prices</h4>
                <p>
                  Enjoy competitive pricing, exclusive deals, and regular
                  discounts on all products.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-headset" />
                </div>
                <h4>24/7 Support</h4>
                <p>
                  Our dedicated customer support team is always ready to assist
                  you with any queries.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-undo-alt" />
                </div>
                <h4>Easy Returns</h4>
                <p>
                  Hassle-free returns and refunds within 7 days if you're not
                  satisfied with your purchase.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-check-circle" />
                </div>
                <h4>Quality Assured</h4>
                <p>
                  Every product is verified and quality-checked before being
                  listed on our platform.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="stats-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">50K+</div>
                <div className="stat-label">Happy Customers</div>
              </div>

              <div className="stat-card">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Products</div>
              </div>

              <div className="stat-card">
                <div className="stat-number">500+</div>
                <div className="stat-label">Trusted Sellers</div>
              </div>

              <div className="stat-card">
                <div className="stat-number">50+</div>
                <div className="stat-label">Cities Covered</div>
              </div>
            </div>
          </div>

          {/* Values Section */}
          <div className="values-section">
            <div className="section-header">
              <h2>Our Core Values</h2>
              <div className="section-divider" />
            </div>

            <div className="values-grid">
              <div className="value-item">
                <div className="value-icon">
                  <i className="fas fa-heart" />
                </div>
                <h4>Customer First</h4>
                <p>
                  Our customers are at the heart of everything we do. Their
                  satisfaction is our priority.
                </p>
              </div>

              <div className="value-item">
                <div className="value-icon">
                  <i className="fas fa-handshake" />
                </div>
                <h4>Trust & Integrity</h4>
                <p>
                  We build lasting relationships through honest business
                  practices and transparency.
                </p>
              </div>

              <div className="value-item">
                <div className="value-icon">
                  <i className="fas fa-lightbulb" />
                </div>
                <h4>Innovation</h4>
                <p>
                  We continuously innovate to provide better solutions and
                  enhance user experience.
                </p>
              </div>

              <div className="value-item">
                <div className="value-icon">
                  <i className="fas fa-users" />
                </div>
                <h4>Community</h4>
                <p>
                  We believe in empowering local businesses and creating
                  opportunities for growth.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="cta-section">
            <div className="cta-content">
              <h2>Ready to Start Shopping?</h2>
              <p>
                Join thousands of satisfied customers and experience the
                Zeedaddy difference today.
              </p>
              <div className="cta-buttons">
                <Link to="/products" className="btn btn-primary">
                  <span>Explore Products</span>
                  <i className="fas fa-arrow-right" />
                </Link>
                <Link to="/contact" className="btn btn-secondary">
                  <span>Contact Us</span>
                  <i className="fas fa-envelope" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────
const aboutStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

  .about-section {
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
    filter: blur(100px);
    pointer-events: none;
    z-index: 0;
    opacity: 0.6;
  }
  .blob-1 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(255, 107, 0, 0.15) 0%, transparent 70%);
    top: -150px;
    right: -150px;
    animation: blobFloat 10s ease-in-out infinite alternate;
  }
  .blob-2 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(255, 149, 0, 0.12) 0%, transparent 70%);
    bottom: -100px;
    left: -100px;
    animation: blobFloat 12s ease-in-out infinite alternate-reverse;
  }
  .blob-3 {
    width: 350px;
    height: 350px;
    background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: blobFloat 15s ease-in-out infinite alternate;
  }
  @keyframes blobFloat {
    from {
      transform: translate(0, 0) scale(1);
    }
    to {
      transform: translate(40px, 30px) scale(1.1);
    }
  }

  .about-container {
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
    margin-bottom: 3rem;
    font-size: 0.875rem;
  }
  .breadcrumb-link {
    color: #6b7280;
    text-decoration: none;
    transition: color 0.2s;
  }
  .breadcrumb-link:hover {
    color: #FF6B00;
  }
  .breadcrumb-separator {
    color: #d1d5db;
    font-size: 0.75rem;
  }
  .breadcrumb-current {
    color: #111827;
    font-weight: 600;
  }

  /* Hero Section */
  .hero-section {
    text-align: center;
    margin-bottom: 5rem;
    animation: fadeInUp 0.8s ease-out;
  }
  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, rgba(255, 107, 0, 0.1), rgba(255, 149, 0, 0.1));
    border: 1px solid rgba(255, 107, 0, 0.2);
    border-radius: 50px;
    padding: 8px 20px;
    font-size: 0.875rem;
    font-weight: 600;
    color: #FF6B00;
    margin-bottom: 1.5rem;
  }
  .hero-badge i {
    font-size: 0.875rem;
  }
  .hero-title {
    font-size: 3rem;
    font-weight: 800;
    color: #0f0f0f;
    letter-spacing: -0.03em;
    margin: 0 0 1rem;
    line-height: 1.2;
  }
  .brand-highlight {
    background: linear-gradient(135deg, #FF6B00, #FF9500);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .hero-subtitle {
    font-size: 1.125rem;
    color: #6b7280;
    max-width: 700px;
    margin: 0 auto;
    line-height: 1.7;
  }

  /* Section Header */
  .section-header {
    text-align: center;
    margin-bottom: 3rem;
  }
  .section-header h2 {
    font-size: 2.25rem;
    font-weight: 700;
    color: #0f0f0f;
    margin: 0 0 1rem;
  }
  .section-divider {
    width: 60px;
    height: 4px;
    background: linear-gradient(90deg, #FF6B00, #FF9500);
    margin: 0 auto;
    border-radius: 2px;
  }

  /* Mission & Vision */
  .mission-vision-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-bottom: 5rem;
  }
  .card {
    background: #fff;
    border-radius: 20px;
    padding: 2.5rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    animation: fadeInUp 0.8s ease-out both;
  }
  .card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 32px rgba(255, 107, 0, 0.15);
  }
  .mission-card {
    animation-delay: 0.1s;
  }
  .vision-card {
    animation-delay: 0.2s;
  }
  .card-icon {
    width: 60px;
    height: 60px;
    border-radius: 16px;
    background: linear-gradient(135deg, #FF6B00, #FF9500);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
  }
  .card-icon i {
    font-size: 28px;
    color: #fff;
  }
  .card h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0f0f0f;
    margin: 0 0 1rem;
  }
  .card p {
    font-size: 1rem;
    color: #6b7280;
    line-height: 1.7;
    margin: 0;
  }

  /* Story Section */
  .story-section {
    margin-bottom: 5rem;
    animation: fadeInUp 0.8s ease-out 0.3s both;
  }
  .story-content {
    background: #fff;
    border-radius: 20px;
    padding: 3rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.05);
  }
  .story-content p {
    font-size: 1.0625rem;
    color: #4b5563;
    line-height: 1.8;
    margin: 0 0 1.5rem;
  }
  .story-content p:last-child {
    margin-bottom: 0;
  }

  /* Features Grid */
  .features-section {
    margin-bottom: 5rem;
  }
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }
  .feature-card {
    background: #fff;
    border-radius: 16px;
    padding: 2rem;
    text-align: center;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.05);
    animation: fadeInUp 0.6s ease-out both;
  }
  .feature-card:nth-child(1) { animation-delay: 0.1s; }
  .feature-card:nth-child(2) { animation-delay: 0.2s; }
  .feature-card:nth-child(3) { animation-delay: 0.3s; }
  .feature-card:nth-child(4) { animation-delay: 0.4s; }
  .feature-card:nth-child(5) { animation-delay: 0.5s; }
  .feature-card:nth-child(6) { animation-delay: 0.6s; }
  .feature-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(255, 107, 0, 0.12);
    border-color: rgba(255, 107, 0, 0.2);
  }
  .feature-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(255, 107, 0, 0.1), rgba(255, 149, 0, 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
  }
  .feature-icon i {
    font-size: 24px;
    color: #FF6B00;
  }
  .feature-card h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #0f0f0f;
    margin: 0 0 0.75rem;
  }
  .feature-card p {
    font-size: 0.9375rem;
    color: #6b7280;
    line-height: 1.6;
    margin: 0;
  }

  /* Stats Section */
  .stats-section {
    margin-bottom: 5rem;
    animation: fadeInUp 0.8s ease-out 0.4s both;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
    background: linear-gradient(135deg, #FF6B00, #FF9500);
    border-radius: 20px;
    padding: 3rem 2rem;
  }
  .stat-card {
    text-align: center;
  }
  .stat-number {
    font-size: 3rem;
    font-weight: 800;
    color: #fff;
    margin-bottom: 0.5rem;
    line-height: 1;
  }
  .stat-label {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
  }

  /* Values Section */
  .values-section {
    margin-bottom: 5rem;
  }
  .values-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
  }
  .value-item {
    text-align: center;
    animation: fadeInUp 0.6s ease-out both;
  }
  .value-item:nth-child(1) { animation-delay: 0.1s; }
  .value-item:nth-child(2) { animation-delay: 0.2s; }
  .value-item:nth-child(3) { animation-delay: 0.3s; }
  .value-item:nth-child(4) { animation-delay: 0.4s; }
  .value-icon {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255, 107, 0, 0.1), rgba(255, 149, 0, 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    transition: all 0.3s ease;
  }
  .value-item:hover .value-icon {
    transform: scale(1.1);
    background: linear-gradient(135deg, #FF6B00, #FF9500);
  }
  .value-icon i {
    font-size: 28px;
    color: #FF6B00;
    transition: color 0.3s ease;
  }
  .value-item:hover .value-icon i {
    color: #fff;
  }
  .value-item h4 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #0f0f0f;
    margin: 0 0 0.75rem;
  }
  .value-item p {
    font-size: 0.9375rem;
    color: #6b7280;
    line-height: 1.6;
    margin: 0;
  }

  /* CTA Section */
  .cta-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 24px;
    padding: 4rem 2rem;
    text-align: center;
    animation: fadeInUp 0.8s ease-out 0.5s both;
  }
  .cta-content h2 {
    font-size: 2.25rem;
    font-weight: 700;
    color: #fff;
    margin: 0 0 1rem;
  }
  .cta-content p {
    font-size: 1.125rem;
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 2rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
  .cta-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
  }
  .btn-primary {
    background: #fff;
    color: #667eea;
  }
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255, 255, 255, 0.3);
  }
  .btn-secondary {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    border: 2px solid rgba(255, 255, 255, 0.3);
  }
  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
  }

  /* Animations */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .about-section {
      padding: 2rem 1rem;
    }
    .hero-title {
      font-size: 2rem;
    }
    .hero-subtitle {
      font-size: 1rem;
    }
    .section-header h2 {
      font-size: 1.75rem;
    }
    .story-content {
      padding: 2rem;
    }
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    .stat-number {
      font-size: 2.5rem;
    }
    .cta-content h2 {
      font-size: 1.75rem;
    }
    .cta-buttons {
      flex-direction: column;
      align-items: center;
    }
    .btn {
      width: 100%;
      max-width: 300px;
      justify-content: center;
    }
  }
`;

export default About;
