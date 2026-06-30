import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MdArrowRightAlt, 
  MdLocationOn, 
  MdDeliveryDining,
  MdStorefront,
  MdStar
} from "react-icons/md";

const GoMarketHeroSection = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const rect = e.currentTarget?.getBoundingClientRect?.();
      if (rect) {
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };

    const hero = document.getElementById("go-market-hero");
    if (hero) {
      hero.addEventListener("mousemove", handleMouseMove);
      return () => hero.removeEventListener("mousemove", handleMouseMove);
    }
  }, []);

  return (
    <>
      <style>{`
        @keyframes fadeUpHero {
          from { opacity: 0; transform: translateY(48px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideInFromLeft {
          from { opacity: 0; transform: translateX(-48px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(48px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-16px) rotate(2deg); }
        }

        @keyframes glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @keyframes pulse-ring {
          0% { 
            box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.7);
          }
          70% {
            box-shadow: 0 0 0 20px rgba(255, 107, 53, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 107, 53, 0);
          }
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        @keyframes mesh-shift {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
        }

        .go-market-hero {
          animation: fadeUpHero 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          background: linear-gradient(135deg, rgba(255, 107, 53, 0.08) 0%, rgba(255, 138, 0, 0.06) 50%, rgba(255, 200, 55, 0.04) 100%);
          position: relative;
          overflow: hidden;
        }

        .go-market-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at 20% 50%, rgba(255, 107, 53, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 138, 0, 0.08) 0%, transparent 50%);
          pointer-events: none;
          animation: mesh-shift 15s ease-in-out infinite;
          background-size: 200% 200%;
        }

        .go-market-hero::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(circle at 2px 2px, rgba(255, 107, 53, 0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .hero-content-wrapper {
          position: relative;
          z-10;
        }

        .badge-hero {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 107, 53, 0.2);
          border-radius: 50px;
          font-size: 13px;
          font-weight: 600;
          color: #FF6B35;
          animation: slideInFromLeft 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
          opacity: 0;
        }

        .hero-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(32px, 5vw, 56px);
          font-weight: 800;
          line-height: 1.1;
          background: linear-gradient(135deg, #FF6B35 0%, #FF8A00 50%, #FFC837 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: slideInFromLeft 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
          opacity: 0;
          margin: 16px 0;
        }

        .hero-subtitle {
          font-size: clamp(15px, 2vw, 18px);
          line-height: 1.6;
          color: #6B7280;
          max-width: 520px;
          animation: slideInFromLeft 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
          opacity: 0;
        }

        .feature-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin: 32px 0;
          animation: slideInFromLeft 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
          opacity: 0;
        }

        .chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 107, 53, 0.15);
          border-radius: 24px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          transition: all 0.3s ease;
        }

        .chip:hover {
          background: rgba(255, 107, 53, 0.08);
          border-color: rgba(255, 107, 53, 0.3);
          transform: translateY(-2px);
        }

        .cta-button-hero {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 16px 36px;
          background: linear-gradient(135deg, #FF6B35 0%, #FF8A00 100%);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 
            0 8px 32px rgba(255, 107, 53, 0.3),
            0 0 0 0 rgba(255, 107, 53, 0.2);
          position: relative;
          overflow: hidden;
          animation: slideInFromLeft 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
          opacity: 0;
        }

        .cta-button-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }

        .cta-button-hero:hover {
          transform: translateY(-4px);
          box-shadow: 
            0 16px 48px rgba(255, 107, 53, 0.4),
            0 0 0 8px rgba(255, 107, 53, 0.1);
        }

        .cta-button-hero:hover::before {
          transform: translateX(100%);
        }

        .cta-button-hero:active {
          transform: translateY(-2px);
        }

        .secondary-text {
          font-size: 13px;
          color: #9CA3AF;
          margin-top: 16px;
          animation: slideInFromLeft 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards;
          opacity: 0;
          letter-spacing: 0.3px;
        }

        .illustration-wrapper {
          position: relative;
          height: 500px;
          animation: slideInFromRight 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
          opacity: 0;
        }

        .floating-cards-container {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .floating-card {
          position: absolute;
          padding: 20px 24px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
          animation: floatSlow 4s ease-in-out infinite;
        }

        .floating-card:hover {
          background: rgba(255, 255, 255, 0.85);
          transform: translateY(-6px);
          box-shadow: 0 16px 48px rgba(255, 107, 53, 0.15);
        }

        .floating-card-1 {
          bottom: 80px;
          left: 20px;
          animation-delay: 0s;
        }

        .floating-card-2 {
          top: 100px;
          right: 40px;
          animation-delay: 1s;
        }

        .floating-card-3 {
          bottom: 200px;
          right: 30px;
          animation-delay: 2s;
        }

        .card-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .card-value {
          font-size: 18px;
          font-weight: 700;
          color: #FF6B35;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .card-label {
          font-size: 12px;
          color: #9CA3AF;
          margin-top: 4px;
        }

        .pulse-ring-element {
          position: absolute;
          width: 120px;
          height: 120px;
          border: 2px solid #FF6B35;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: pulse-ring 2.5s ease-out infinite;
          opacity: 0;
        }

        .illustration-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 280px;
          height: 280px;
          background: linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(34, 197, 94, 0.1));
          border-radius: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 140px;
          animation: floatSlow 5s ease-in-out infinite;
        }

        @media (max-width: 1024px) {
          .illustration-wrapper {
            height: 350px;
          }

          .floating-card {
            padding: 16px 20px;
          }

          .card-value {
            font-size: 16px;
          }
        }

        @media (max-width: 768px) {
          .go-market-hero {
            padding: 48px 20px;
          }

          .illustration-wrapper {
            height: 300px;
            margin-top: 32px;
          }

          .floating-card {
            padding: 14px 18px;
            border-radius: 16px;
          }

          .feature-chips {
            gap: 10px;
          }

          .chip {
            padding: 8px 14px;
            font-size: 12px;
          }

          .cta-button-hero {
            padding: 14px 28px;
            font-size: 14px;
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <section 
        id="go-market-hero"
        className="go-market-hero"
        style={{ paddingTop: 80, paddingBottom: 80 }}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left Content */}
            <div className="hero-content-wrapper">
              <div className="badge-hero">
                <MdLocationOn size={16} />
                Nearby Markets
              </div>

              <h1 className="hero-title">
                🏪 Go Market
              </h1>

              <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-4" style={{ animation: "slideInFromLeft 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards", opacity: 0 }}>
                Shop From Your Nearby Local Market
              </p>

              <p className="hero-subtitle">
                Everything your local market offers is now available online. Shop from nearby Grocery, Fashion, Electronics, Pharmacy, Restaurants, Gift Shops and more with quick delivery.
              </p>

              <div className="feature-chips">
                <div className="chip">
                  <span>⚡</span>
                  <span>15–30 Min Delivery</span>
                </div>
                <div className="chip">
                  <span>🏪</span>
                  <span>Local Shops</span>
                </div>
                <div className="chip">
                  <span>⭐</span>
                  <span>Trusted Sellers</span>
                </div>
                <div className="chip">
                  <span>📍</span>
                  <span>Nearby Markets</span>
                </div>
              </div>

              <button 
                className="cta-button-hero"
                onClick={() => navigate("/go-market")}
              >
                <span>Explore Nearby Market</span>
                <MdArrowRightAlt size={20} />
              </button>

              {/* <p className="secondary-text">
                Choose Market → Select Shop → Order → Fast Delivery
              </p> */}
            </div>

            
          </div>
        </div>
      </section>
    </>
  );
};

export default GoMarketHeroSection;