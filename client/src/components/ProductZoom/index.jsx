import React, { useEffect, useRef, useState, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { useAppContext } from "../../hooks/useAppContext";

/* ─────────────────────────────────────────────
   Instagram-style Zoom Overlay
───────────────────────────────────────────── */
const ZoomOverlay = ({ src, onClose }) => {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const dragStart = useRef(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef(null);
  const lastScale = useRef(1);
  const lastScalePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const lastTap = useRef(0);

  const resetZoom = () => {
    setScale(1); setPos({ x: 0, y: 0 }); setIsZoomed(false);
    lastScale.current = 1; lastPos.current = { x: 0, y: 0 };
  };

  const handleDoubleAction = useCallback((cx, cy) => {
    if (isZoomed) {
      resetZoom();
    } else {
      const newScale = 2.8;
      const rect = containerRef.current?.getBoundingClientRect();
      let ox = 0, oy = 0;
      if (rect) {
        ox = (rect.width / 2 - cx) * (newScale - 1);
        oy = (rect.height / 2 - cy) * (newScale - 1);
      }
      setScale(newScale); setPos({ x: ox, y: oy });
      lastScale.current = newScale; lastPos.current = { x: ox, y: oy };
      setIsZoomed(true);
    }
  }, [isZoomed]);

  /* Mouse */
  const onMouseDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - lastPos.current.x, y: e.clientY - lastPos.current.y };
  };
  const onMouseMove = (e) => {
    if (!isDragging) return;
    const nx = e.clientX - dragStart.current.x;
    const ny = e.clientY - dragStart.current.y;
    setPos({ x: nx, y: ny }); lastPos.current = { x: nx, y: ny };
  };
  const onMouseUp = () => setIsDragging(false);
  const onDblClick = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    handleDoubleAction(e.clientX - (rect?.left || 0), e.clientY - (rect?.top || 0));
  };

  /* Touch */
  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
      lastScalePos.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < 280) {
        const rect = containerRef.current?.getBoundingClientRect();
        handleDoubleAction(e.touches[0].clientX - (rect?.left || 0), e.touches[0].clientY - (rect?.top || 0));
      }
      lastTap.current = now;
      if (scale > 1) {
        dragStart.current = { x: e.touches[0].clientX - lastPos.current.x, y: e.touches[0].clientY - lastPos.current.y };
        setIsDragging(true);
      }
    }
  };
  const onTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (lastTouchDist.current) {
        const ratio = dist / lastTouchDist.current;
        const newScale = Math.min(Math.max(lastScale.current * ratio, 1), 5);
        setScale(newScale);
        setIsZoomed(newScale > 1.05);
        if (newScale <= 1) { setPos({ x: 0, y: 0 }); lastPos.current = { x: 0, y: 0 }; }
        lastScale.current = newScale;
      }
      lastTouchDist.current = dist;
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      const nx = e.touches[0].clientX - dragStart.current.x;
      const ny = e.touches[0].clientY - dragStart.current.y;
      setPos({ x: nx, y: ny }); lastPos.current = { x: nx, y: ny };
    }
  };
  const onTouchEnd = () => { lastTouchDist.current = null; setIsDragging(false); };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.97)",
      display: "flex", alignItems: "center", justifyContent: "center",
      touchAction: "none",
    }}>
      {/* Close */}
      <button onClick={onClose} style={{
        position: "absolute", top: 16, right: 16,
        background: "rgba(255,255,255,0.1)", border: "none",
        borderRadius: "50%", width: 40, height: 40,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", color: "#fff", zIndex: 10,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {/* Hint text */}
      <div style={{
        position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)",
        color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: "0.1em",
        textTransform: "uppercase", fontFamily: "sans-serif", whiteSpace: "nowrap",
        pointerEvents: "none",
      }}>
        {scale > 1.05 ? "Drag to pan  ·  Double-tap to reset" : "Double-tap or pinch to zoom"}
      </div>

      {/* Image */}
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onDoubleClick={onDblClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          width: "100vw", height: "100vh",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
          overflow: "hidden", userSelect: "none",
        }}
      >
        <img
          src={src}
          draggable={false}
          style={{
            maxWidth: "92vw", maxHeight: "92vh",
            objectFit: "contain",
            transform: `scale(${scale}) translate(${pos.x / scale}px, ${pos.y / scale}px)`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)",
            willChange: "transform",
            pointerEvents: "none", userSelect: "none",
          }}
        />
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Styles
───────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500&display=swap');

  .pz-wrapper {
    font-family: 'Outfit', sans-serif;
    --accent: #222222;
    background: #fff;
    width: 100%;
  }

  /* ── STAGE ── */
  .pz-stage {
    position: relative;
    width: 100%;
    overflow: hidden;
    background: #f5f5f5;
    cursor: zoom-in;
    aspect-ratio: 1 / 1;
  }

  @media (min-width: 640px) {
    .pz-stage { aspect-ratio: unset; height: 520px; }
  }
  @media (min-width: 1024px) {
    .pz-stage { height: 640px; }
  }

  .pz-stage .swiper,
  .pz-stage .swiper-wrapper,
  .pz-stage .swiper-slide {
    width: 100% !important;
    height: 100% !important;
  }

  .pz-main-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94);
    user-select: none;
    pointer-events: none;
  }

  .pz-stage:hover .pz-main-img {
    transform: scale(1.04);
  }

  /* ── COUNTER ── */
  .pz-counter {
    position: absolute; top: 14px; right: 14px; z-index: 10;
    background: rgba(0,0,0,0.38); backdrop-filter: blur(6px);
    border-radius: 20px; padding: 3px 10px;
    font-size: 11px; letter-spacing: 0.05em;
    color: rgba(255,255,255,0.9);
    font-weight: 300;
  }

  /* ── ZOOM ICON ── */
  .pz-zoom-icon {
    position: absolute; bottom: 14px; right: 14px; z-index: 10;
    background: rgba(255,255,255,0.82); backdrop-filter: blur(6px);
    border-radius: 50%; width: 34px; height: 34px;
    display: flex; align-items: center; justify-content: center;
    color: rgba(0,0,0,0.5);
    box-shadow: 0 1px 8px rgba(0,0,0,0.1);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .pz-stage:hover .pz-zoom-icon { opacity: 1; }

  /* ── NAV ARROWS ── */
  .pz-arrow {
    position: absolute; top: 50%; transform: translateY(-50%);
    z-index: 10; background: rgba(255,255,255,0.92);
    border: none; border-radius: 50%;
    width: 40px; height: 40px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 14px rgba(0,0,0,0.14);
    color: rgba(0,0,0,0.65);
    opacity: 0; pointer-events: none;
    transition: opacity 0.2s ease, background 0.15s ease, transform 0.15s ease;
  }
  .pz-stage:hover .pz-arrow { opacity: 1; pointer-events: all; }
  .pz-arrow:hover { background: #fff; color: #000; transform: translateY(-50%) scale(1.06); }
  .pz-arrow.left  { left: 14px; }
  .pz-arrow.right { right: 56px; }

  /* ── DOT RAIL ── */
  .pz-dots {
    display: flex; align-items: center; justify-content: center;
    gap: 5px;
    padding: 12px 0 4px;
  }
  .pz-dot {
    height: 3px; border-radius: 2px;
    background: rgba(0,0,0,0.15);
    cursor: pointer;
    transition: width 0.35s cubic-bezier(0.4,0,0.2,1), background 0.35s ease;
  }
  .pz-dot.active { background: #111; }

  /* ── FADE ANIMATION ── */
  .pz-fade { animation: pz-in 0.3s ease forwards; }
  @keyframes pz-in { from { opacity: 0; } to { opacity: 1; } }
`;

/* ─────────────────────────────────────────────
   ProductZoom
───────────────────────────────────────────── */
export const ProductZoom = (props) => {
  const [slideIndex, setSlideIndex] = useState(0);
  const [zoomSrc, setZoomSrc] = useState(null);
  const swiperRef = useRef();

  const total = props?.images?.length || 0;

  const goTo = (index) => {
    if (index === slideIndex) return;
    setSlideIndex(index);
    swiperRef.current?.swiper?.slideTo(index);
  };

  const goPrev = (e) => { e.stopPropagation(); goTo(Math.max(0, slideIndex - 1)); };
  const goNext = (e) => { e.stopPropagation(); goTo(Math.min(total - 1, slideIndex + 1)); };

  const openZoom = () => {
    if (props?.images?.[slideIndex]) setZoomSrc(props.images[slideIndex]);
  };

  useEffect(() => {
    setSlideIndex(0);
    swiperRef?.current?.swiper?.slideTo(0);
  }, [props?.images]);

  const dotWidth = (i) => {
    const d = Math.abs(i - slideIndex);
    if (d === 0) return 22;
    if (d === 1) return 8;
    return 5;
  };

  return (
    <>
      <style>{styles}</style>

      {zoomSrc && <ZoomOverlay src={zoomSrc} onClose={() => setZoomSrc(null)} />}

      <div className="pz-wrapper">

        {/* Stage */}
        <div className="pz-stage" onClick={openZoom}>

          {total > 1 && <div className="pz-counter">{slideIndex + 1} / {total}</div>}

          <div className="pz-zoom-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </div>

          {total > 1 && slideIndex > 0 && (
            <button className="pz-arrow left" onClick={goPrev}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          )}
          {total > 1 && slideIndex < total - 1 && (
            <button className="pz-arrow right" onClick={goNext}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          )}

          <Swiper
            ref={swiperRef}
            slidesPerView={1}
            spaceBetween={0}
            onSlideChange={(s) => {
              if (s.activeIndex !== slideIndex) {
                setSlideIndex(s.activeIndex);
              }
            }}
            style={{ width: "100%", height: "100%" }}
          >
            {props?.images?.map((item, i) => (
              <SwiperSlide key={i}>
                <div className={i === slideIndex ? "pz-fade" : ""} style={{ width: "100%", height: "100%" }}>
                  <img className="pz-main-img" src={item} alt={`Product ${i + 1}`} draggable={false} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Dot indicators */}
        {total > 1 && (
          <div className="pz-dots">
            {props.images.map((_, i) => (
              <div
                key={i}
                className={`pz-dot${i === slideIndex ? " active" : ""}`}
                style={{ width: dotWidth(i) }}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        )}

      </div>
    </>
  );
};