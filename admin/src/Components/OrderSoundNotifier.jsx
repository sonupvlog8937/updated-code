import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import toast from "react-hot-toast";
import { MyContext } from "../App";
import { fetchDataFromApi } from "../utils/api";

const SELLER_ROLES = ["SELLER", "GROCERY_SELLER", "RESTAURANT_SELLER", "FASHION_SELLER", "ELECTRONICS_SELLER", "MEDICAL_SELLER", "BEAUTY_SELLER", "HOME_KITCHEN_SELLER", "GIFTS_TOYS_SELLER", "BOOKS_STATIONERY_SELLER", "JEWELLERY_SELLER", "HARDWARE_SELLER", "AUTOMOBILE_SELLER"];
const NOTIFIER_ROLES = [...SELLER_ROLES, "DELIVERY_RIDER"];
const STORAGE_KEY = "orderSoundNotifications:v1";
const POLL_INTERVAL_MS = 15000;

const normalizeOrders = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.orders)) return res.orders;
  return [];
};

const orderKey = (order) => String(order?._id || order?.orderId || order?.id || "");
const orderDateMs = (order) => {
  const raw = order?.deliveryAssignment?.assignedAt || order?.createdAt || order?.updatedAt;
  const ms = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(ms) ? ms : 0;
};

const readSettings = () => {
  const fallback = { enabled: true, unlocked: false };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
};

const writeSettings = (settings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

const playProfessionalOrderTone = (audioCtxRef) => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return false;
  const ctx = audioCtxRef.current || new AudioContextClass();
  audioCtxRef.current = ctx;
  if (ctx.state === "suspended") ctx.resume();
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.28, now + 0.025);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);
  master.connect(ctx.destination);
  const notes = [659.25, 880, 1174.66, 880];
  notes.forEach((freq, idx) => {
    const start = now + idx * 0.16;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = idx === 2 ? "triangle" : "sine";
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(idx === 2 ? 0.5 : 0.35, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + 0.32);
  });
  const sparkle = ctx.createOscillator();
  const sparkleGain = ctx.createGain();
  sparkle.type = "sine";
  sparkle.frequency.setValueAtTime(1760, now + 0.52);
  sparkleGain.gain.setValueAtTime(0.0001, now + 0.52);
  sparkleGain.gain.exponentialRampToValueAtTime(0.18, now + 0.56);
  sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
  sparkle.connect(sparkleGain);
  sparkleGain.connect(master);
  sparkle.start(now + 0.52);
  sparkle.stop(now + 0.95);
  return true;
};

const OrderSoundNotifier = ({ inline = false }) => {
  const context = useContext(MyContext);
  const role = context?.userData?.role;
  const isSeller = SELLER_ROLES.includes(role);
  const isRider = role === "DELIVERY_RIDER";
  const isActive = NOTIFIER_ROLES.includes(role);
  const [settings, setSettings] = useState(() => readSettings());
  const [lastEvent, setLastEvent] = useState(null);
  const [status, setStatus] = useState("idle");
  const knownKeysRef = useRef(new Set());
  const hydratedRef = useRef(false);
  const audioCtxRef = useRef(null);
  const pollTimerRef = useRef(null);

  const endpoint = useMemo(() => {
    if (isRider) return "/api/order/rider/orders";
    if (isSeller) return "/api/order/seller/orders?page=1&limit=25";
    return "";
  }, [isRider, isSeller]);

  useEffect(() => { writeSettings(settings); }, [settings]);

  const label = isRider ? "Rider assignment sound" : "New order sound";
  const eventText = isRider ? "New delivery assigned" : "New order received";

  const unlockAudio = useCallback(() => {
    playProfessionalOrderTone(audioCtxRef);
    setSettings((prev) => ({ ...prev, unlocked: true, enabled: true }));
    setStatus("ready");
    toast.success("Order sound enabled");
  }, []);

  const toggleEnabled = () => {
    setSettings((prev) => {
      const next = { ...prev, enabled: !prev.enabled };
      if (next.enabled && !prev.unlocked) setTimeout(unlockAudio, 0);
      return next;
    });
  };

  const notifyForOrders = useCallback((orders) => {
    if (!orders.length) return;
    const sortedOrders = [...orders].sort((a, b) => orderDateMs(a) - orderDateMs(b));
    sortedOrders.forEach((order, index) => {
      window.setTimeout(() => {
        const amount = Number(order?.totalAmt || order?.amount || 0);
        const orderNo = orderKey(order).slice(-8).toUpperCase();
        setLastEvent({ text: eventText, orderNo, at: new Date() });
        if (settings.enabled) playProfessionalOrderTone(audioCtxRef);
        toast.custom((t) => (
          <div className={`order-sound-toast ${t.visible ? "order-sound-toast--show" : ""}`}>
            <div className="order-sound-toast__icon">{isRider ? "🛵" : "🔔"}</div>
            <div>
              <div className="order-sound-toast__title">{eventText}</div>
              <div className="order-sound-toast__sub">
                Order #{orderNo || "NEW"}{amount ? ` • ₹${amount.toLocaleString("en-IN")}` : ""}
              </div>
            </div>
          </div>
        ), { duration: 5000 });
      }, index * 1300);
    });
  }, [eventText, isRider, settings.enabled]);

  const poll = useCallback((silent = false) => {
    if (!endpoint || !localStorage.getItem("accessToken")) return;
    if (!silent) setStatus("checking");
    fetchDataFromApi(endpoint).then((res) => {
      const orders = normalizeOrders(res);
      const currentKeys = new Set(orders.map(orderKey).filter(Boolean));
      if (!hydratedRef.current) {
        knownKeysRef.current = currentKeys;
        hydratedRef.current = true;
        setStatus("ready");
        return;
      }
      const freshOrders = orders.filter((order) => {
        const key = orderKey(order);
        return key && !knownKeysRef.current.has(key);
      });
      currentKeys.forEach((key) => knownKeysRef.current.add(key));
      setStatus("ready");
      notifyForOrders(freshOrders);
    }).catch(() => setStatus("offline"));
  }, [endpoint, notifyForOrders]);

  useEffect(() => {
    if (!isActive) return undefined;
    hydratedRef.current = false;
    knownKeysRef.current = new Set();
    poll(true);
    pollTimerRef.current = window.setInterval(() => poll(true), POLL_INTERVAL_MS);
    return () => { if (pollTimerRef.current) window.clearInterval(pollTimerRef.current); };
  }, [isActive, poll]);

  if (!isActive) return null;

  const statusLabel =
    status === "offline" ? "Offline"
    : status === "checking" ? "Checking"
    : settings.enabled ? "On" : "Off";

  const dotColor =
    status === "offline" ? "#f44336"
    : settings.enabled ? "#4caf50"
    : "#bdbdbd";

  const handleToggleClick = (event) => {
    event.stopPropagation();
    toggleEnabled();
  };

  const widget = (
    <div
      aria-label="Order notification sound controls"
      style={{
        position: "fixed",
        top: "0px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "#ffffff",
        border: "1px solid #e0e0e0",
        borderRadius: "10px",
        padding: "7px 14px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.13)",
        minWidth: "220px",
        maxWidth: "90vw",
        whiteSpace: "nowrap",
        pointerEvents: "auto",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          flexShrink: 0,
          background: dotColor,
          boxShadow: settings.enabled && status !== "offline"
            ? "0 0 0 3px rgba(76,175,80,0.20)"
            : "none",
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "#212121", lineHeight: 1.3 }}>
          {label}
        </div>
        <div style={{ fontSize: "11px", color: "#757575", overflow: "hidden", textOverflow: "ellipsis" }}>
          {lastEvent ? `${lastEvent.text} #${lastEvent.orderNo}` : ""}
        </div>
      </div>

      <button
        onClick={handleToggleClick}
        type="button"
        style={{
          fontSize: "11px",
          fontWeight: 600,
          padding: "4px 10px",
          borderRadius: "6px",
          border: "none",
          cursor: "pointer",
          background: settings.enabled ? "#212121" : "#eeeeee",
          color: settings.enabled ? "#ffffff" : "#616161",
          transition: "background 0.2s, color 0.2s",
          flexShrink: 0,
        }}
      >
        {statusLabel}
      </button>

      {settings.enabled && !settings.unlocked && (
        <button
          onClick={(event) => { event.stopPropagation(); unlockAudio(); }}
          type="button"
          style={{
            fontSize: "11px",
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: "6px",
            border: "1px solid #212121",
            cursor: "pointer",
            background: "transparent",
            color: "#212121",
            flexShrink: 0,
          }}
        >
          Enable sound
        </button>
      )}
    </div>
  );

  if (inline) {
    return (
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "8px 12px",
          minWidth: "260px",
          color: "inherit",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
              {statusLabel}
            </div>
          </div>
          <button
            onClick={handleToggleClick}
            type="button"
            style={{
              fontSize: "11px",
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              background: settings.enabled ? "#212121" : "#eeeeee",
              color: settings.enabled ? "#ffffff" : "#616161",
            }}
          >
            {statusLabel}
          </button>
        </div>
        {settings.enabled && !settings.unlocked && (
          <button
            onClick={(event) => { event.stopPropagation(); unlockAudio(); }}
            type="button"
            style={{
              fontSize: "11px",
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #212121",
              cursor: "pointer",
              background: "transparent",
              color: "#212121",
              width: "100%",
              textAlign: "center",
            }}
          >
            Enable sound
          </button>
        )}
      </div>
    );
  }

  return ReactDOM.createPortal(widget, document.body);
};

export default OrderSoundNotifier;