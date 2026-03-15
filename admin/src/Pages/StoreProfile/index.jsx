import React, { useContext, useEffect, useState } from "react";
import { MyContext } from "../../App";
import { editData, fetchDataFromApi } from "../../utils/api";
import {
  FiPhone, FiMapPin, FiImage, FiFileText, FiInfo,
  FiSave, FiClock, FiExternalLink, FiEdit2, FiX,
  FiCheckCircle, FiAlertCircle, FiMail, FiShield,
  FiTruck, FiRefreshCw, FiEye, FiZap, FiAward
} from "react-icons/fi";
import { MdOutlineStore, MdOutlineShield, MdOutlineVerified } from "react-icons/md";
import { BsStarFill, BsCheckCircleFill } from "react-icons/bs";
import { TbTruckDelivery } from "react-icons/tb";

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  input: (hasError) => ({
    width: "100%", height: 46,
    background: hasError ? "rgba(239,68,68,0.04)" : "#F8FAFC",
    border: `1px solid ${hasError ? "rgba(239,68,68,0.4)" : "#E2E8F0"}`,
    borderRadius: 10, padding: "0 14px",
    fontFamily: "'Outfit', sans-serif", fontSize: 14, color: "#0F172A",
    outline: "none", boxSizing: "border-box", transition: "all 0.2s",
  }),
  textarea: (hasError) => ({
    width: "100%",
    background: hasError ? "rgba(239,68,68,0.04)" : "#F8FAFC",
    border: `1px solid ${hasError ? "rgba(239,68,68,0.4)" : "#E2E8F0"}`,
    borderRadius: 10, padding: "12px 14px",
    fontFamily: "'Outfit', sans-serif", fontSize: 14, color: "#0F172A",
    outline: "none", boxSizing: "border-box", transition: "all 0.2s",
    resize: "vertical", lineHeight: 1.6,
  }),
  label: {
    fontSize: 11, fontWeight: 600, color: "#64748B",
    fontFamily: "'DM Mono', monospace", letterSpacing: "0.07em",
    textTransform: "uppercase", marginBottom: 7,
    display: "flex", alignItems: "center", gap: 5,
  },
  card: {
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  viewValue: {
    fontSize: 14, color: "#0F172A", fontWeight: 500,
    padding: "10px 14px",
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: 10, minHeight: 46,
    display: "flex", alignItems: "center", lineHeight: 1.5,
    wordBreak: "break-word",
  },
  viewEmpty: {
    fontSize: 13, color: "#CBD5E1", fontStyle: "italic",
    padding: "10px 14px",
    background: "#FAFAFA",
    border: "1px dashed #E2E8F0",
    borderRadius: 10, minHeight: 46, display: "flex", alignItems: "center",
  },
};

// ─── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ icon: Icon, label, required, error, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={S.label}>
        {Icon && <Icon size={10} />}{label}
        {required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: 11, color: "#EF4444", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
          <FiAlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  );
}

// ─── View row ────────────────────────────────────────────────────────────────
function ViewRow({ icon: Icon, label, value, multiline }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={S.label}><Icon size={10} /> {label}</label>
      {value
        ? <div style={{ ...S.viewValue, ...(multiline ? { alignItems: "flex-start", paddingTop: 12 } : {}) }}>{value}</div>
        : <div style={S.viewEmpty}>Not set</div>}
    </div>
  );
}

// ─── Completion dot ───────────────────────────────────────────────────────────
function CompletionDot({ filled }) {
  return (
    <div style={{
      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
      background: filled ? "#10B981" : "#E2E8F0",
      boxShadow: filled ? "0 0 6px rgba(16,185,129,0.4)" : "none",
      transition: "all 0.3s",
    }} />
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const StoreProfile = () => {
  const context = useContext(MyContext);
  const [isLoading, setIsLoading]   = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [errors, setErrors]         = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab]   = useState("basic");

  const emptyForm = {
    storeName: "", description: "", location: "", contactNo: "",
    moreInfo: "", image: "", returnPolicy: "", shippingTime: "",
    supportEmail: "", openHours: "",
  };
  const [form, setForm]         = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  useEffect(() => {
    fetchDataFromApi("/api/user/seller/store-profile").then((res) => {
      if (res?.success) {
        const p = res?.seller?.storeProfile || {};
        const data = {
          storeName: p.storeName || "", description: p.description || "",
          location: p.location || "", contactNo: p.contactNo || "",
          moreInfo: p.moreInfo || "", image: p.image || "",
          returnPolicy: p.returnPolicy || "", shippingTime: p.shippingTime || "",
          supportEmail: p.supportEmail || "", openHours: p.openHours || "",
        };
        setForm(data); setEditForm(data);
      }
      setIsFetching(false);
    });
  }, []);

  const onChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!editForm.storeName.trim()) e.storeName = "Store name is required";
    if (editForm.contactNo && !/^\d{10}$/.test(editForm.contactNo)) e.contactNo = "Enter a valid 10-digit number";
    if (editForm.supportEmail && !/\S+@\S+\.\S+/.test(editForm.supportEmail)) e.supportEmail = "Enter a valid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openEdit   = () => { setEditForm({ ...form }); setErrors({}); setIsEditMode(true);  };
  const cancelEdit = () => { setEditForm({ ...form }); setErrors({}); setIsEditMode(false); };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res = await editData("/api/user/seller/store-profile", editForm);
      const isSuccess = res?.success === true || res?.error === false;
      if (isSuccess) {
        setForm({ ...editForm }); setIsEditMode(false); setErrors({});
        context?.alertBox("success", res?.message || "Store profile updated successfully!");
      } else {
        context?.alertBox("error", res?.message || (res === undefined ? "Network error." : "Unable to update."));
      }
    } catch { context?.alertBox("error", "Something went wrong."); }
    finally  { setIsLoading(false); }
  };

  const completionFields = ["storeName", "description", "location", "contactNo", "image", "moreInfo"];
  const filledCount      = completionFields.filter((f) => form[f]?.trim()).length;
  const completionScore  = Math.round((filledCount / completionFields.length) * 100);
  const completionColor  = completionScore >= 80 ? "#10B981" : completionScore >= 50 ? "#F59E0B" : "#EF4444";

  const tabs = [
    { id: "basic",    label: "Basic Info",          icon: MdOutlineStore  },
    { id: "policies", label: "Policies & Support",  icon: MdOutlineShield },
  ];

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isFetching) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #E2E8F0", borderTopColor: "#FF6B2B", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontSize: 14, color: "#94A3B8" }}>Loading store profile…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const data = isEditMode ? editForm : form;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder, textarea::placeholder { color: #CBD5E1; }
        input:focus, textarea:focus { border-color: #FF6B2B !important; box-shadow: 0 0 0 3px rgba(255,107,43,0.1) !important; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #F1F5F9; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 2px; }
        .tab-btn:hover    { color: #0F172A !important; background: #F1F5F9 !important; }
        .card-hover:hover { border-color: #CBD5E1 !important; box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important; }
        .edit-btn:hover   { background: rgba(255,107,43,0.14) !important; border-color: rgba(255,107,43,0.45) !important; }
        .cancel-btn:hover { background: #F1F5F9 !important; }
        .save-btn:hover   { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,107,43,0.35) !important; }
        .tip-item:hover   { color: #374151 !important; }
        .view-link:hover  { color: #FF6B2B !important; background: #F1F5F9 !important; }
      `}</style>

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "28px 20px 60px" }}>

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          marginBottom: 28, flexWrap: "wrap", gap: 12, animation: "fadeUp 0.4s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10,
              background: "rgba(255,107,43,0.1)", border: "1px solid rgba(255,107,43,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MdOutlineStore size={18} color="#FF6B2B" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}>Store Profile</h1>
              <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Manage your public seller storefront</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {form.storeName && (
              <a href={`/store/${form.storeName}`} target="_blank" rel="noreferrer" className="view-link" style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10,
                fontSize: 13, color: "#64748B", textDecoration: "none", transition: "all 0.2s",
              }}>
                <FiEye size={13} /> View Store <FiExternalLink size={11} />
              </a>
            )}
            {!isEditMode ? (
              <button onClick={openEdit} className="edit-btn" style={{
                display: "flex", alignItems: "center", gap: 7, padding: "8px 18px",
                background: "rgba(255,107,43,0.08)", border: "1px solid rgba(255,107,43,0.22)",
                borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#FF6B2B",
                cursor: "pointer", transition: "all 0.2s", fontFamily: "'Outfit', sans-serif",
              }}>
                <FiEdit2 size={13} /> Edit Profile
              </button>
            ) : (
              <button onClick={cancelEdit} className="cancel-btn" style={{
                display: "flex", alignItems: "center", gap: 7, padding: "8px 16px",
                background: "#F1F5F9", border: "1px solid #E2E8F0",
                borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#64748B",
                cursor: "pointer", transition: "all 0.2s", fontFamily: "'Outfit', sans-serif",
              }}>
                <FiX size={13} /> Cancel
              </button>
            )}
          </div>
        </div>

        {/* Edit mode banner */}
        {isEditMode && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
            background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 12, marginBottom: 20, animation: "fadeUp 0.3s ease both" }}>
            <FiEdit2 size={13} color="#F59E0B" />
            <span style={{ fontSize: 13, color: "#64748B" }}>
              You're in <strong style={{ color: "#D97706" }}>edit mode</strong>. Changes won't be saved until you click Save.
            </span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>

          {/* ── Left Sidebar ──────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Store Preview Card */}
            <div style={{ ...S.card, overflow: "hidden", animation: "fadeUp 0.4s ease both" }} className="card-hover">
              <div style={{ height: 80,
                background: "linear-gradient(135deg, rgba(255,107,43,0.2), rgba(255,180,80,0.15))",
                position: "relative", overflow: "hidden" }}>
                {data.image && (
                  <img src={data.image} alt="banner"
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }}
                    onError={(e) => { e.target.style.display = "none"; }} />
                )}
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "#fff",
                    border: "2px solid rgba(255,107,43,0.2)", display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", boxShadow: "0 4px 14px rgba(0,0,0,0.1)" }}>
                    {data.image
                      ? <img src={data.image} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => { e.target.style.display = "none"; }} />
                      : <MdOutlineStore size={22} color="#FF6B2B" />}
                  </div>
                </div>
              </div>
              <div style={{ padding: "16px 16px 14px", textAlign: "center" }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>
                  {data.storeName || <span style={{ color: "#CBD5E1", fontStyle: "italic" }}>Your Store</span>}
                </h3>
                {data.location && (
                  <p style={{ fontSize: 11, color: "#94A3B8", display: "flex",
                    alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 8 }}>
                    <FiMapPin size={9} /> {data.location}
                  </p>
                )}
                <div style={{ display: "flex", justifyContent: "center", gap: 2, marginBottom: 10 }}>
                  {[1,2,3,4,5].map(i => <BsStarFill key={i} size={11} color="#F59E0B" />)}
                </div>
                {data.storeName && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px",
                    background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
                    borderRadius: 100, fontSize: 11, color: "#059669", fontWeight: 600 }}>
                    <MdOutlineVerified size={11} /> Verified Seller
                  </div>
                )}
              </div>
            </div>

            {/* Completion Card */}
            <div style={{ ...S.card, padding: 16, animation: "fadeUp 0.45s ease both" }} className="card-hover">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Profile Completion</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: completionColor }}>{completionScore}%</span>
              </div>
              <div style={{ height: 5, background: "#F1F5F9", borderRadius: 3, marginBottom: 14, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 3, width: `${completionScore}%`,
                  background: `linear-gradient(90deg, ${completionColor}aa, ${completionColor})`,
                  transition: "width 0.6s ease" }} />
              </div>
              {[
                { field: "storeName", label: "Store Name" },
                { field: "description", label: "Description" },
                { field: "location", label: "Location" },
                { field: "contactNo", label: "Phone Number" },
                { field: "image", label: "Banner / Logo" },
                { field: "moreInfo", label: "Additional Info" },
              ].map(({ field, label }) => (
                <div key={field} style={{ display: "flex", alignItems: "center", gap: 8,
                  padding: "5px 0", borderBottom: "1px solid #F8FAFC" }}>
                  <CompletionDot filled={!!form[field]?.trim()} />
                  <span style={{ fontSize: 12, color: form[field]?.trim() ? "#374151" : "#CBD5E1" }}>{label}</span>
                  {form[field]?.trim() && <FiCheckCircle size={10} color="#10B981" style={{ marginLeft: "auto" }} />}
                </div>
              ))}
            </div>

            {/* Tips Card */}
            <div style={{ ...S.card, padding: 16,
              background: "rgba(255,107,43,0.03)", border: "1px solid rgba(255,107,43,0.12)",
              animation: "fadeUp 0.5s ease both" }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: "#FF6B2B",
                fontFamily: "'DM Mono', monospace", letterSpacing: "0.07em",
                textTransform: "uppercase", marginBottom: 12,
                display: "flex", alignItems: "center", gap: 6 }}>
                <FiZap size={11} /> Seller Tips
              </h3>
              {[
                "Complete profile gets 3× more visibility",
                "Add a clear store banner image",
                "Mention return policy to build trust",
                "Keep contact info updated",
              ].map((tip, i) => (
                <div key={i} className="tip-item" style={{ display: "flex", alignItems: "flex-start", gap: 8,
                  marginBottom: 8, fontSize: 12, color: "#94A3B8", lineHeight: 1.4 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#FF6B2B", flexShrink: 0, marginTop: 5 }} />
                  {tip}
                </div>
              ))}
            </div>
          </div>

          {/* ── Main Content ───────────────────────────────────────────────── */}
          <div style={{ animation: "fadeUp 0.4s ease 0.1s both" }}>
            <form onSubmit={onSubmit}>

              {/* Tab Bar */}
              <div style={{ display: "flex", gap: 4, marginBottom: 16,
                background: "#F1F5F9", border: "1px solid #E2E8F0",
                borderRadius: 12, padding: 4, width: "fit-content" }}>
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button key={id} type="button" onClick={() => setActiveTab(id)} className="tab-btn" style={{
                    display: "flex", alignItems: "center", gap: 7, padding: "8px 18px",
                    borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    border: "none", transition: "all 0.2s", fontFamily: "'Outfit', sans-serif",
                    background: activeTab === id ? "#FF6B2B" : "transparent",
                    color: activeTab === id ? "#fff" : "#64748B",
                  }}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>

              {/* ── BASIC INFO TAB ──────────────────────────────────────── */}
              {activeTab === "basic" && (
                <div style={{ ...S.card, padding: 24 }} className="card-hover">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22,
                    paddingBottom: 16, borderBottom: "1px solid #F1F5F9" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9,
                      background: "rgba(255,107,43,0.08)", border: "1px solid rgba(255,107,43,0.18)",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MdOutlineStore size={15} color="#FF6B2B" />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Basic Information</h2>
                      <p style={{ fontSize: 12, color: "#94A3B8" }}>Core details visible on your public storefront</p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                    <Field icon={MdOutlineStore} label="Store Name" required error={errors.storeName}>
                      {isEditMode
                        ? <input name="storeName" value={editForm.storeName} onChange={onChange}
                            placeholder="e.g. TechZone Official" style={S.input(!!errors.storeName)} />
                        : <ViewRow icon={MdOutlineStore} label="" value={form.storeName} />}
                    </Field>

                    <Field icon={FiPhone} label="Contact Number" error={errors.contactNo}>
                      {isEditMode
                        ? <input name="contactNo" value={editForm.contactNo} onChange={onChange}
                            placeholder="10-digit mobile" maxLength={10} style={S.input(!!errors.contactNo)} />
                        : <div style={form.contactNo ? S.viewValue : S.viewEmpty}>{form.contactNo || "Not set"}</div>}
                    </Field>

                    <Field icon={FiMapPin} label="Store Location">
                      {isEditMode
                        ? <input name="location" value={editForm.location} onChange={onChange}
                            placeholder="e.g. Mumbai, Maharashtra" style={S.input(false)} />
                        : <div style={form.location ? S.viewValue : S.viewEmpty}>{form.location || "Not set"}</div>}
                    </Field>

                    <Field icon={FiImage} label="Banner / Logo URL">
                      {isEditMode
                        ? <input name="image" value={editForm.image} onChange={onChange}
                            placeholder="https://cdn.example.com/logo.png" style={S.input(false)} />
                        : <div style={form.image ? { ...S.viewValue, fontSize: 12, color: "#FF6B2B" } : S.viewEmpty}>
                            {form.image
                              ? <a href={form.image} target="_blank" rel="noreferrer"
                                  style={{ color: "#FF6B2B", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                                  <FiExternalLink size={11} /> View image
                                </a>
                              : "Not set"}
                          </div>}
                    </Field>
                  </div>

                  <Field icon={FiFileText} label="Store Description">
                    {isEditMode
                      ? <textarea name="description" value={editForm.description} onChange={onChange} rows={4}
                          placeholder="Tell customers what you sell and what makes your store special…"
                          style={S.textarea(false)} />
                      : <div style={form.description ? { ...S.viewValue, alignItems: "flex-start", paddingTop: 12 } : S.viewEmpty}>
                          {form.description || "Not set"}
                        </div>}
                  </Field>

                  <Field icon={FiInfo} label="Additional Information">
                    {isEditMode
                      ? <textarea name="moreInfo" value={editForm.moreInfo} onChange={onChange} rows={3}
                          placeholder="Any extra details, highlights, or customer guarantees…"
                          style={S.textarea(false)} />
                      : <div style={form.moreInfo ? { ...S.viewValue, alignItems: "flex-start", paddingTop: 12 } : S.viewEmpty}>
                          {form.moreInfo || "Not set"}
                        </div>}
                  </Field>
                </div>
              )}

              {/* ── POLICIES TAB ─────────────────────────────────────────── */}
              {activeTab === "policies" && (
                <div style={{ ...S.card, padding: 24 }} className="card-hover">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22,
                    paddingBottom: 16, borderBottom: "1px solid #F1F5F9" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9,
                      background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MdOutlineShield size={15} color="#7C3AED" />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Policies & Support</h2>
                      <p style={{ fontSize: 12, color: "#94A3B8" }}>Build customer trust with clear policies</p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                    <Field icon={FiRefreshCw} label="Return Policy">
                      {isEditMode
                        ? <input name="returnPolicy" value={editForm.returnPolicy} onChange={onChange}
                            placeholder="e.g. 7-day easy return" style={S.input(false)} />
                        : <div style={form.returnPolicy ? S.viewValue : S.viewEmpty}>{form.returnPolicy || "Not set"}</div>}
                    </Field>

                    <Field icon={FiTruck} label="Shipping Time">
                      {isEditMode
                        ? <input name="shippingTime" value={editForm.shippingTime} onChange={onChange}
                            placeholder="e.g. 3-5 business days" style={S.input(false)} />
                        : <div style={form.shippingTime ? S.viewValue : S.viewEmpty}>{form.shippingTime || "Not set"}</div>}
                    </Field>

                    <Field icon={FiClock} label="Support Hours">
                      {isEditMode
                        ? <input name="openHours" value={editForm.openHours} onChange={onChange}
                            placeholder="e.g. Mon-Sat, 10AM – 6PM" style={S.input(false)} />
                        : <div style={form.openHours ? S.viewValue : S.viewEmpty}>{form.openHours || "Not set"}</div>}
                    </Field>

                    <Field icon={FiMail} label="Support Email" error={errors.supportEmail}>
                      {isEditMode
                        ? <input name="supportEmail" value={editForm.supportEmail} onChange={onChange}
                            placeholder="support@yourstore.com" style={S.input(!!errors.supportEmail)} />
                        : <div style={form.supportEmail ? S.viewValue : S.viewEmpty}>{form.supportEmail || "Not set"}</div>}
                    </Field>
                  </div>

                  <Field icon={FiShield} label="Policies & Guarantees">
                    {isEditMode
                      ? <textarea name="moreInfo" value={editForm.moreInfo} onChange={onChange} rows={5}
                          placeholder="Describe warranty, policies, or service guarantees in detail…"
                          style={S.textarea(false)} />
                      : <div style={form.moreInfo ? { ...S.viewValue, alignItems: "flex-start", paddingTop: 12 } : S.viewEmpty}>
                          {form.moreInfo || "Not set"}
                        </div>}
                  </Field>

                  {/* Trust Badges Preview */}
                  <div style={{ marginTop: 8 }}>
                    <p style={{ fontSize: 11, color: "#94A3B8", fontFamily: "'DM Mono', monospace",
                      letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
                      Trust Badges Preview
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                      {[
                        { icon: <FiRefreshCw size={15} />,      label: data.returnPolicy || "Easy Returns",  color: "#2563EB", bg: "rgba(37,99,235,0.06)",   border: "rgba(37,99,235,0.15)"  },
                        { icon: <TbTruckDelivery size={15} />,  label: data.shippingTime || "Fast Shipping", color: "#059669", bg: "rgba(5,150,105,0.06)",   border: "rgba(5,150,105,0.15)"  },
                        { icon: <MdOutlineShield size={15} />,  label: "Verified Seller",                   color: "#7C3AED", bg: "rgba(124,58,237,0.06)",  border: "rgba(124,58,237,0.15)" },
                        { icon: <FiAward size={15} />,          label: "Quality Assured",                   color: "#D97706", bg: "rgba(217,119,6,0.06)",   border: "rgba(217,119,6,0.15)"  },
                      ].map((b, i) => (
                        <div key={i} style={{ borderRadius: 12, padding: "12px 8px",
                          background: b.bg, border: `1px solid ${b.border}`,
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
                          <span style={{ color: b.color }}>{b.icon}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.3, color: b.color }}>{b.label}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: "#CBD5E1", marginTop: 10 }}>
                      ↑ These badges appear on your public store page
                    </p>
                  </div>
                </div>
              )}

              {/* ── Save / Edit buttons ──────────────────────────────────── */}
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", ...S.card }}>
                <div>
                  {!isEditMode
                    ? <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94A3B8" }}>
                        <FiEye size={12} /> Viewing saved profile
                      </div>
                    : <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#D97706" }}>
                        <FiEdit2 size={12} /> Editing — unsaved changes
                      </div>}
                </div>

                {isEditMode ? (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="button" onClick={cancelEdit} className="cancel-btn" style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "10px 18px", borderRadius: 10, border: "1px solid #E2E8F0",
                      background: "#F1F5F9", color: "#64748B",
                      fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                      fontFamily: "'Outfit', sans-serif",
                    }}>
                      <FiX size={13} /> Discard
                    </button>
                    <button type="submit" disabled={isLoading} className="save-btn" style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "10px 22px", borderRadius: 10, border: "none",
                      background: isLoading ? "#F1F5F9" : "linear-gradient(135deg, #FF6B2B, #FF8C55)",
                      color: isLoading ? "#94A3B8" : "#fff",
                      fontSize: 14, fontWeight: 700,
                      cursor: isLoading ? "not-allowed" : "pointer",
                      transition: "all 0.2s", fontFamily: "'Outfit', sans-serif",
                      boxShadow: isLoading ? "none" : "0 4px 14px rgba(255,107,43,0.3)",
                    }}>
                      {isLoading ? (
                        <>
                          <div style={{ width: 14, height: 14, border: "2px solid #E2E8F0",
                            borderTopColor: "#FF6B2B", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                          Saving…
                        </>
                      ) : (
                        <><FiSave size={14} /> Save Changes</>
                      )}
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={openEdit} className="edit-btn" style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "10px 20px", borderRadius: 10,
                    background: "rgba(255,107,43,0.08)", border: "1px solid rgba(255,107,43,0.22)",
                    color: "#FF6B2B", fontSize: 14, fontWeight: 700, cursor: "pointer",
                    transition: "all 0.2s", fontFamily: "'Outfit', sans-serif",
                  }}>
                    <FiEdit2 size={14} /> Edit Profile
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreProfile;