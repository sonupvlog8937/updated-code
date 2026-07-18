import React, { useContext, useEffect, useState } from "react";
import { MyContext } from "../../App";
import { editData, fetchDataFromApi, postData, deleteData, uploadImages } from "../../utils/api";
import {
  FiPhone, FiMapPin, FiImage, FiFileText, FiInfo,
  FiSave, FiClock, FiExternalLink, FiEdit2, FiX,
  FiCheckCircle, FiAlertCircle, FiMail, FiShield,
  FiTruck, FiRefreshCw, FiEye, FiZap, FiAward, FiUpload,
  FiCamera, FiPlus, FiTrash2, FiMenu
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
  
  // Check if user is a GoMarket seller (any type except restaurant)
  const GO_MARKET_SELLER_ROLES = [
    "GROCERY_SELLER", "FASHION_SELLER", "ELECTRONICS_SELLER", "MEDICAL_SELLER",
    "BEAUTY_SELLER", "HOME_KITCHEN_SELLER", "GIFTS_TOYS_SELLER", "BOOKS_STATIONERY_SELLER",
    "JEWELLERY_SELLER", "HARDWARE_SELLER", "AUTOMOBILE_SELLER"
  ];
  
  const isRestaurantSeller = userRole === "RESTAURANT_SELLER";
  const isGoMarketSeller = GO_MARKET_SELLER_ROLES.includes(userRole);
  
  if (!isGoMarketSeller && !isRestaurantSeller) {
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
    latitude: "",
    longitude: "",
    deliveryMinutes: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [isLocating, setIsLocating] = useState(false);
  const [menus, setMenus] = useState([]);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editMenuId, setEditMenuId] = useState(null);
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuDescription, setNewMenuDescription] = useState("");
  const [newMenuImage, setNewMenuImage] = useState("");
  const [newMenuImageFile, setNewMenuImageFile] = useState(null);
  const [isAddingMenu, setIsAddingMenu] = useState(false);
  const [isUploadingMenuImage, setIsUploadingMenuImage] = useState(false);

  useEffect(() => {
    const endpoint = isGoMarketSeller ? "/api/go-market/seller/grocery-shop" : "/api/go-market/seller/restaurant";
    fetchDataFromApi(endpoint).then((res) => {
      if (res?.success) {
        const shop = res?.shop || {};
        const data = {
          shopName: shop.shopName || "",
          shopBanner: shop.shopBanner || "",
          shopLogo: shop.shopLogo || "",
          address: shop.address || "",
          description: shop.description || "",
          latitude: shop.latitude != null ? String(shop.latitude) : "",
          longitude: shop.longitude != null ? String(shop.longitude) : "",
          deliveryMinutes: shop.deliveryMinutes != null ? String(shop.deliveryMinutes) : "",
        };
        setForm(data);
        setEditForm(data);
        
        // Fetch menus if restaurant seller
        if (isRestaurantSeller && shop._id) {
          fetchDataFromApi(`/api/go-market/menus/restaurant/${shop._id}?limit=100`).then((menuRes) => {
            setMenus(menuRes?.data || []);
          });
        }
      }
      setIsFetching(false);
    }).catch(() => setIsFetching(false));
  }, [isGoMarketSeller, isRestaurantSeller]);

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

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEditForm((prev) => ({
          ...prev,
          latitude: String(pos.coords.latitude.toFixed(6)),
          longitude: String(pos.coords.longitude.toFixed(6)),
        }));
        toast.success("Location captured successfully!");
        setIsLocating(false);
      },
      (err) => {
        toast.error("Could not get location: " + err.message);
        setIsLocating(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleAddMenu = async () => {
    if (!newMenuName.trim()) {
      toast.error("Menu name is required");
      return;
    }
    
    setIsAddingMenu(true);
    try {
      const shopData = await fetchDataFromApi("/api/go-market/seller/restaurant");
      const restaurantId = shopData?.shop?._id;
      
      if (!restaurantId) {
        toast.error("Restaurant not found");
        setIsAddingMenu(false);
        return;
      }
      
      let imageUrl = newMenuImage;
      
      // Upload image if file is selected
      if (newMenuImageFile) {
        setIsUploadingMenuImage(true);
        try {
          const formData = new FormData();
          formData.append("images", newMenuImageFile);
          const uploadRes = await uploadImages("/api/category/upload-image", formData);
          imageUrl = uploadRes?.data?.[0] || uploadRes?.images?.[0] || "";
          setIsUploadingMenuImage(false);
        } catch (uploadError) {
          setIsUploadingMenuImage(false);
          toast.error("Failed to upload image");
          setIsAddingMenu(false);
          return;
        }
      }
      
      const payload = {
        restaurantId,
        menuName: newMenuName.trim(),
        description: newMenuDescription.trim(),
        image: imageUrl,
      };
      
      let res;
      if (editMenuId) {
        // Update existing menu
        res = await putData(`/api/go-market/menus/${editMenuId}`, payload);
      } else {
        // Create new menu
        res = await postData("/api/go-market/menus", payload);
      }
      
      if (res?.error === false || res?.success === true) {
        toast.success(editMenuId ? "Menu updated successfully!" : "Menu created successfully!");
        setNewMenuName("");
        setNewMenuDescription("");
        setNewMenuImage("");
        setNewMenuImageFile(null);
        setEditMenuId(null);
        setShowMenuModal(false);
        
        // Refresh menus
        fetchDataFromApi(`/api/go-market/menus/restaurant/${restaurantId}?limit=100`).then((menuRes) => {
          setMenus(menuRes?.data || []);
        });
      } else {
        toast.error(res?.message || (editMenuId ? "Failed to update menu" : "Failed to create menu"));
      }
    } catch (error) {
      toast.error(editMenuId ? "Failed to update menu" : "Failed to create menu");
    } finally {
      setIsAddingMenu(false);
    }
  };

  const handleDeleteMenu = async (menuId) => {
    if (!window.confirm("Are you sure you want to delete this menu?")) return;
    
    try {
      const res = await deleteData(`/api/go-market/menus/${menuId}`);
      if (res?.error === false || res?.success === true) {
        toast.success("Menu deleted successfully!");
        setMenus(menus.filter(m => m._id !== menuId));
      } else {
        toast.error(res?.message || "Failed to delete menu");
      }
    } catch (error) {
      toast.error("Failed to delete menu");
    }
  };

  const handleEditMenu = (menu) => {
    setEditMenuId(menu._id);
    setNewMenuName(menu.menuName);
    setNewMenuDescription(menu.description || "");
    setNewMenuImage(menu.image || "");
    setNewMenuImageFile(null);
    setShowMenuModal(true);
  };

  const handleOpenAddMenu = () => {
    setEditMenuId(null);
    setNewMenuName("");
    setNewMenuDescription("");
    setNewMenuImage("");
    setNewMenuImageFile(null);
    setShowMenuModal(true);
  };

  const handleCloseMenuModal = () => {
    setEditMenuId(null);
    setNewMenuName("");
    setNewMenuDescription("");
    setNewMenuImage("");
    setNewMenuImageFile(null);
    setShowMenuModal(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    try {
      const endpoint = isGoMarketSeller ? "/api/go-market/seller/grocery-shop" : "/api/go-market/seller/restaurant";
      const payload = { ...editForm };
      // Convert numeric fields
      if (payload.latitude !== "") payload.latitude = parseFloat(payload.latitude);
      else delete payload.latitude;
      if (payload.longitude !== "") payload.longitude = parseFloat(payload.longitude);
      else delete payload.longitude;
      delete payload.deliveryMinutes;
      const res = await editData(endpoint, payload);
      const resData = res?.data || res;
      const isSuccess = resData?.success === true || resData?.error === false;
      
      if (isSuccess) {
        setForm({ ...editForm });
        setIsEditMode(false);
        setErrors({});
        context?.alertBox("success", resData?.message || "Shop profile updated successfully!");
      } else {
        context?.alertBox("error", resData?.message || "Unable to update shop profile.");
      }
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || "";
      if (error?.response?.status === 403) {
        context?.alertBox("error", "Access denied. Please make sure your seller account is fully set up and try again.");
      } else if (error?.response?.status === 404 || msg.toLowerCase().includes("not found")) {
        context?.alertBox("error", "Shop not found. Please contact support to set up your shop.");
      } else {
        context?.alertBox("error", msg || "Could not update shop profile. Please try again.");
      }
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
                {isGoMarketSeller ? "Shop" : "Restaurant"} Profile
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

          {/* Location & Delivery Card */}
          <div style={{ ...S.card, padding: 24, marginBottom: 24 }} className="card-hover">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22, paddingBottom: 16, borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FiMapPin size={15} color="#10B981" />
              </div>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Location & Delivery</h2>
                <p style={{ fontSize: 12, color: "#94A3B8" }}>Set your shop's coordinates for distance & ETA display</p>
              </div>
            </div>

            {isEditMode ? (
              <>
                {/* Get Location Button */}
                <div style={{ marginBottom: 18 }}>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isLocating}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 18px", borderRadius: 10,
                      background: isLocating ? "#F1F5F9" : "rgba(16,185,129,0.1)",
                      border: "1px solid rgba(16,185,129,0.3)",
                      color: isLocating ? "#94A3B8" : "#059669",
                      fontSize: 13, fontWeight: 700, cursor: isLocating ? "not-allowed" : "pointer",
                      transition: "all 0.2s", fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    {isLocating ? (
                      <>
                        <div style={{ width: 14, height: 14, border: "2px solid #E2E8F0", borderTopColor: "#10B981", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        Getting location…
                      </>
                    ) : (
                      <><FiMapPin size={14} /> 📍 Get Current Location</>
                    )}
                  </button>
                  <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 6 }}>
                    Click to auto-fill latitude & longitude from your browser location. Make sure you're at your shop.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 20px" }}>
                  <Field icon={FiMapPin} label="Latitude">
                    <input
                      name="latitude"
                      value={editForm.latitude}
                      onChange={onChange}
                      placeholder="e.g. 28.613939"
                      type="number"
                      step="any"
                      style={S.input(false)}
                    />
                  </Field>
                  <Field icon={FiMapPin} label="Longitude">
                    <input
                      name="longitude"
                      value={editForm.longitude}
                      onChange={onChange}
                      placeholder="e.g. 77.209023"
                      type="number"
                      step="any"
                      style={S.input(false)}
                    />
                  </Field>
                  <Field icon={FiTruck} label="Shipping Minutes">
                    <input
                      name="deliveryMinutes"
                      value="0"
                      disabled
                      type="number"
                      style={S.input(false)}
                    />
                    <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 6 }}>
                      Shipping time is managed by the platform and cannot be edited.
                    </p>
                  </Field>
                </div>
              </>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 20px" }}>
                <div>
                  <label style={S.label}><FiMapPin size={10} />Latitude</label>
                  <div style={S.viewValue}>{form.latitude || "Not set"}</div>
                </div>
                <div>
                  <label style={S.label}><FiMapPin size={10} />Longitude</label>
                  <div style={S.viewValue}>{form.longitude || "Not set"}</div>
                </div>
                <div>
                  <label style={S.label}><FiTruck size={10} />Shipping Minutes</label>
                  <div style={S.viewValue}>0 min</div>
                </div>
              </div>
            )}
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
                    <img src={form.shopBanner} alt="Banner" style={{ width: "100%", borderRadius: 10, maxHeight: 120, objectFit: "cover" }} />
                  ) : (
                    <div style={{ ...S.viewValue, justifyContent: "center", color: "#94A3B8" }}>No banner uploaded</div>
                  )}
                </div>
                <div>
                  <label style={S.label}><FiImage size={10} />Shop Logo</label>
                  {form.shopLogo ? (
                    <img src={form.shopLogo} alt="Logo" style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover" }} />
                  ) : (
                    <div style={{ ...S.viewValue, justifyContent: "center", color: "#94A3B8" }}>No logo uploaded</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Menu Management Card - Restaurant Only */}
          {isRestaurantSeller && (
            <div style={{ ...S.card, padding: 24, marginBottom: 24 }} className="card-hover">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, paddingBottom: 16, borderBottom: "1px solid #F1F5F9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FiMenu size={15} color="#8B5CF6" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Menu Management</h2>
                    <p style={{ fontSize: 12, color: "#94A3B8" }}>Create and manage restaurant menus</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddMenu}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                    background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)",
                    borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#8B5CF6",
                    cursor: "pointer", transition: "all 0.2s", fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  <FiPlus size={12} /> Add Menu
                </button>
              </div>

              {menus.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", background: "#F8FAFC", borderRadius: 10 }}>
                  <FiMenu size={32} color="#CBD5E1" style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 13, color: "#64748B", marginBottom: 0 }}>No menus created yet</p>
                  <p style={{ fontSize: 11, color: "#94A3B8" }}>Create menus to organize your dishes</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                  {menus.map((menu) => (
                    <div key={menu._id} style={{
                      border: "1px solid #E2E8F0", borderRadius: 12, padding: 16,
                      background: "#F8FAFC", transition: "all 0.2s",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: 0 }}>{menu.menuName}</h3>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => handleEditMenu(menu)}
                            style={{
                              padding: 4, background: "rgba(59,130,246,0.1)", border: "none",
                              borderRadius: 6, cursor: "pointer", color: "#3B82F6",
                            }}
                          >
                            <FiEdit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMenu(menu._id)}
                            style={{
                              padding: 4, background: "rgba(239,68,68,0.1)", border: "none",
                              borderRadius: 6, cursor: "pointer", color: "#EF4444",
                            }}
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      </div>
                      {menu.description && (
                        <p style={{ fontSize: 11, color: "#64748B", margin: "0 0 8px 0", lineHeight: 1.4 }}>{menu.description}</p>
                      )}
                      {menu.image && (
                        <img src={menu.image} alt={menu.menuName} style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8 }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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

        {/* Add Menu Modal */}
        {showMenuModal && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.5)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              background: "#fff", borderRadius: 16, padding: 24,
              width: "100%", maxWidth: 480, maxHeight: "90vh",
              overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: 0 }}>{editMenuId ? "Edit Menu" : "Create New Menu"}</h2>
                <button
                  type="button"
                  onClick={handleCloseMenuModal}
                  style={{ padding: 8, background: "#F1F5F9", border: "none", borderRadius: 8, cursor: "pointer" }}
                >
                  <FiX size={16} color="#64748B" />
                </button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={S.label}><FiMenu size={10} />Menu Name *</label>
                <input
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  placeholder="e.g. Breakfast Menu, Lunch Specials"
                  style={S.input(false)}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={S.label}><FiFileText size={10} />Description</label>
                <textarea
                  value={newMenuDescription}
                  onChange={(e) => setNewMenuDescription(e.target.value)}
                  placeholder="Describe this menu..."
                  rows={3}
                  style={S.textarea(false)}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={S.label}><FiImage size={10} />Menu Image</label>
                <div style={{
                  border: "2px dashed #E2E8F0",
                  borderRadius: 10,
                  padding: 16,
                  textAlign: "center",
                  background: "#F8FAFC",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#8B5CF6"; e.currentTarget.style.background = "rgba(139,92,246,0.02)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = "#F8FAFC"; }}
                onClick={() => document.getElementById('menuImageInput')?.click()}>
                  
                  {newMenuImageFile ? (
                    <>
                      <img src={URL.createObjectURL(newMenuImageFile)} alt="Preview" style={{
                        maxWidth: "100%", maxHeight: 120, borderRadius: 8, marginBottom: 12
                      }} />
                      <p style={{ fontSize: 12, color: "#8B5CF6", fontWeight: 600, marginBottom: 8 }}>
                        Image selected
                      </p>
                      <button type="button" onClick={(e) => {
                        e.stopPropagation();
                        setNewMenuImageFile(null);
                        const input = document.getElementById('menuImageInput');
                        if (input) input.value = "";
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
                    id="menuImageInput"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (!file.type.startsWith("image/")) {
                          toast.error("Please select an image file");
                          return;
                        }
                        if (file.size > 50 * 1024 * 1024) {
                          toast.error("File size must be less than 50MB");
                          return;
                        }
                        setNewMenuImageFile(file);
                      }
                    }}
                    disabled={isUploadingMenuImage}
                    style={{ display: "none" }}
                  />
                </div>
                {isUploadingMenuImage && (
                  <p style={{ fontSize: 11, color: "#8B5CF6", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 12, height: 12, border: "2px solid #E2E8F0", borderTopColor: "#8B5CF6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Uploading image...
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowMenuModal(false)}
                  style={{
                    flex: 1, padding: "10px 18px", borderRadius: 10,
                    background: "#F1F5F9", border: "1px solid #E2E8F0",
                    color: "#64748B", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddMenu}
                  disabled={isAddingMenu}
                  style={{
                    flex: 1, padding: "10px 18px", borderRadius: 10,
                    background: isAddingMenu ? "#F1F5F9" : "linear-gradient(135deg, #8B5CF6, #A78BFA)",
                    border: "none", color: isAddingMenu ? "#94A3B8" : "#fff",
                    fontSize: 13, fontWeight: 700, cursor: isAddingMenu ? "not-allowed" : "pointer",
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  {isAddingMenu ? "Creating..." : "Create Menu"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoMarketStoreProfile;
