import React, { useContext, useEffect, useState } from "react";
import { MyContext } from "../../App";
import { editData, fetchDataFromApi, uploadImages } from "../../utils/api";
import {
  FiPhone, FiMapPin, FiImage, FiFileText, FiInfo,
  FiSave, FiClock, FiExternalLink, FiEdit2, FiX,
  FiCheckCircle, FiAlertCircle, FiMail, FiShield,
  FiTruck, FiRefreshCw, FiEye, FiZap, FiAward, FiUpload,
  FiCamera
} from "react-icons/fi";
import { MdOutlineStore, MdOutlineShield, MdOutlineVerified } from "react-icons/md";
import { BsStarFill, BsCheckCircleFill } from "react-icons/bs";
import { TbTruckDelivery } from "react-icons/tb";
import toast from "react-hot-toast";

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
};

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

function ImageUploadField({ label, value, onChange, isUploading, setIsUploading }) {
  const fileInputRef = React.useRef(null);
  const [preview, setPreview] = useState(value || "");

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, GIF, WebP, etc.)");
      return;
    }

    // Validate file size (max 50MB for flexibility)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    // Create FormData and upload
    const formData = new FormData();
    formData.append("images", file);

    try {
      setIsUploading?.(true);
      const toastId = toast.loading("Uploading image...");
      const response = await uploadImages("/api/product/uploadImages", formData);
      const urls = response?.data?.images || response?.data?.imageUrls || response?.data?.urls || [];
      const url = response?.data?.url || urls?.[0];
      if (response?.data?.success !== false && url) {
        setPreview(url);
        onChange(url);
        toast.success("Image uploaded successfully!", { id: toastId });
      } else {
        toast.error(response?.data?.message || "Upload failed", { id: toastId });
      }
    } catch (error) {
      toast.error("Upload failed: " + error.message);
      } finally {
      setIsUploading?.(false);
    }
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <label style={S.label}>
        <FiCamera size={10} />{label}
      </label>
      
      <div style={{
        border: "2px dashed #E2E8F0",
        borderRadius: 10,
        padding: 16,
        textAlign: "center",
        background: "#F8FAFC",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#FF6B2B"; e.currentTarget.style.background = "rgba(255,107,43,0.02)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = "#F8FAFC"; }}
      onClick={() => fileInputRef.current?.click()}>
        
        {preview ? (
          <>
            <img src={preview} alt="Preview" style={{
              maxWidth: "100%", maxHeight: 120, borderRadius: 8, marginBottom: 12
            }} />
            <p style={{ fontSize: 12, color: "#FF6B2B", fontWeight: 600, marginBottom: 8 }}>
              Image selected
            </p>
            <button type="button" onClick={(e) => {
              e.stopPropagation();
              setPreview("");
              onChange("");
              if (fileInputRef.current) fileInputRef.current.value = "";
            }} style={{
              fontSize: 12, color: "#EF4444", textDecoration: "underline", background: "none", border: "none", cursor: "pointer"
            }}>
              Remove image
            </button>
          </>
        ) : (
          <>
            <FiUpload size={28} style={{ margin: "0 auto 8px", color: "#94A3B8" }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>
              Click or drag image here
            </p>
            <p style={{ fontSize: 11, color: "#94A3B8" }}>
              Any image format • Up to 50MB
            </p>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}

const GoMarketStoreProfile = () => {
  const context = useContext(MyContext);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const userRole = context?.userData?.role || "";
  
  const isGrocerySeller = userRole === "GROCERY_SELLER";
  const isRestaurantSeller = userRole === "RESTAURANT_SELLER";
  
  if (!isGrocerySeller && !isRestaurantSeller) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <FiAlertCircle size={40} color="#EF4444" style={{ margin: "0 auto 16px" }} />
          <p style={{ fontSize: 16, color: "#374151" }}>Access Denied</p>
          <p style={{ fontSize: 13, color: "#94A3B8" }}>Only GoMarket sellers can edit this page</p>
        </div>
      </div>
    );
  }

  const emptyForm = {
    shopName: "",
    shopBanner: "",
    shopLogo: "",
    address: "",
    description: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  useEffect(() => {
    const endpoint = isGrocerySeller ? "/api/go-market/seller/grocery-shop" : "/api/go-market/seller/restaurant";
    fetchDataFromApi(endpoint).then((res) => {
      if (res?.success) {
        const shop = res?.shop || {};
        const data = {
          shopName: shop.shopName || "",
          shopBanner: shop.shopBanner || "",
          shopLogo: shop.shopLogo || "",
          address: shop.address || "",
          description: shop.description || "",
        };
        setForm(data);
        setEditForm(data);
      }
      setIsFetching(false);
    }).catch(() => setIsFetching(false));
  }, [isGrocerySeller]);

  const onChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const onImageChange = (field, url) => {
    setEditForm((prev) => ({ ...prev, [field]: url }));
  };

  const validate = () => {
    const e = {};
    if (!editForm.shopName.trim()) e.shopName = "Shop name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openEdit = () => {
    setEditForm({ ...form });
    setErrors({});
    setIsEditMode(true);
  };

  const cancelEdit = () => {
    setEditForm({ ...form });
    setErrors({});
    setIsEditMode(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    try {
      const endpoint = isGrocerySeller ? "/api/go-market/seller/grocery-shop" : "/api/go-market/seller/restaurant";
      const res = await editData(endpoint, editForm);
      const payload = res?.data || res;
      const isSuccess = payload?.success === true || payload?.error === false;
      
      if (isSuccess) {
        setForm({ ...editForm });
        setIsEditMode(false);
        setErrors({});
        context?.alertBox("success", payload?.message || "Shop profile updated successfully!");
      } else {
        context?.alertBox("error", payload?.message || "Unable to update shop profile.");
      }
    } catch (error) {
      context?.alertBox("error", "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #E2E8F0", borderTopColor: "#FF6B2B", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontSize: 14, color: "#94A3B8" }}>Loading shop profile…</p>
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
        .card-hover:hover { border-color: #CBD5E1 !important; box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important; }
        .edit-btn:hover   { background: rgba(255,107,43,0.14) !important; border-color: rgba(255,107,43,0.45) !important; }
        .save-btn:hover   { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,107,43,0.35) !important; }
      `}</style>

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "28px 20px 60px" }}>

        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12, animation: "fadeUp 0.4s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,107,43,0.1)", border: "1px solid rgba(255,107,43,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MdOutlineStore size={18} color="#FF6B2B" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}>
                {isGrocerySeller ? "Grocery Shop" : "Restaurant"} Profile
              </h1>
              <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Update your shop banner, logo, and details</p>
            </div>
          </div>

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
            <button onClick={cancelEdit} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "8px 16px",
              background: "#F1F5F9", border: "1px solid #E2E8F0",
              borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#64748B",
              cursor: "pointer", transition: "all 0.2s", fontFamily: "'Outfit', sans-serif",
            }}>
              <FiX size={13} /> Cancel
            </button>
          )}
        </div>

        {isEditMode && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, marginBottom: 20 }}>
            <FiEdit2 size={13} color="#F59E0B" />
            <span style={{ fontSize: 13, color: "#64748B" }}>
              You're in <strong style={{ color: "#D97706" }}>edit mode</strong>. Changes won't be saved until you click Save.
            </span>
          </div>
        )}

        <form onSubmit={onSubmit}>
          {/* Shop Info Card */}
          <div style={{ ...S.card, padding: 24, marginBottom: 24 }} className="card-hover">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22, paddingBottom: 16, borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,107,43,0.08)", border: "1px solid rgba(255,107,43,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MdOutlineStore size={15} color="#FF6B2B" />
              </div>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Shop Information</h2>
                <p style={{ fontSize: 12, color: "#94A3B8" }}>Core details visible on market listings</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
              <Field icon={MdOutlineStore} label="Shop Name" required error={errors.shopName}>
                {isEditMode
                  ? <input name="shopName" value={editForm.shopName} onChange={onChange} placeholder="Your shop name" style={S.input(!!errors.shopName)} />
                  : <div style={S.viewValue}>{form.shopName || "Not set"}</div>}
              </Field>

              <Field icon={FiMapPin} label="Address">
                {isEditMode
                  ? <input name="address" value={editForm.address} onChange={onChange} placeholder="Shop address" style={S.input(false)} />
                  : <div style={S.viewValue}>{form.address || "Not set"}</div>}
              </Field>
            </div>

            <Field icon={FiFileText} label="Description">
              {isEditMode
                ? <textarea name="description" value={editForm.description} onChange={onChange} rows={3} placeholder="Tell customers about your shop..." style={S.textarea(false)} />
                : <div style={{...S.viewValue, alignItems: "flex-start", paddingTop: 12}}>{form.description || "Not set"}</div>}
            </Field>
          </div>

          {/* Banner & Logo Card */}
          <div style={{ ...S.card, padding: 24, marginBottom: 24 }} className="card-hover">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22, paddingBottom: 16, borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FiImage size={15} color="#3B82F6" />
              </div>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Shop Images</h2>
                <p style={{ fontSize: 12, color: "#94A3B8" }}>Upload banner and logo to enhance shop appearance</p>
              </div>
            </div>

            {isEditMode ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <ImageUploadField
                  label="Shop Banner"
                  value={editForm.shopBanner}
                  onChange={(url) => onImageChange("shopBanner", url)}
                  isUploading={isUploading}
                  setIsUploading={setIsUploading}
                />
                <ImageUploadField
                  label="Shop Logo"
                  value={editForm.shopLogo}
                  onChange={(url) => onImageChange("shopLogo", url)}
                  isUploading={isUploading}
                  setIsUploading={setIsUploading}
                />
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  <label style={S.label}><FiImage size={10} />Shop Banner</label>
                  {form.shopBanner ? (
                    <div>
                      <img src={form.shopBanner} alt="banner" style={{ width: "100%", maxHeight: 200, borderRadius: 10, objectFit: "contain", marginBottom: 8, background: "#F8FAFC" }} />
                      <a href={form.shopBanner} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#FF6B2B", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                        <FiExternalLink size={11} /> View full size
                      </a>
                    </div>
                  ) : (
                    <div style={{ padding: 20, borderRadius: 10, background: "#F8FAFC", border: "1px dashed #E2E8F0", textAlign: "center", color: "#94A3B8" }}>
                      No banner uploaded
                    </div>
                  )}
                </div>

                <div>
                  <label style={S.label}><FiImage size={10} />Shop Logo</label>
                  {form.shopLogo ? (
                    <div>
                      <img src={form.shopLogo} alt="logo" style={{ maxWidth: 150, maxHeight: 150, borderRadius: 10, objectFit: "contain", marginBottom: 8, background: "#F8FAFC" }} />
                      <a href={form.shopLogo} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#FF6B2B", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                        <FiExternalLink size={11} /> View full size
                      </a>
                    </div>
                  ) : (
                    <div style={{ width: "100%", minHeight: 150, borderRadius: 10, background: "#F8FAFC", border: "1px dashed #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: 12, textAlign: "center" }}>
                      No logo
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", ...S.card }}>
            <div>
              {isEditMode
                ? <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#D97706" }}>
                    <FiEdit2 size={12} /> Editing — unsaved changes
                  </div>
                : <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94A3B8" }}>
                    <FiEye size={12} /> Viewing saved profile
                  </div>}
            </div>

            {isEditMode ? (
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={cancelEdit} style={{
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
                      <div style={{ width: 14, height: 14, border: "2px solid #E2E8F0", borderTopColor: "#FF6B2B", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
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
  );
};

export default GoMarketStoreProfile;
