import React, { useContext, useEffect, useState } from "react";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import CircularProgress from "@mui/material/CircularProgress";
import { MyContext } from "../../App";
import { deleteImages, editData, fetchDataFromApi } from "../../utils/api";
import { IoMdClose } from "react-icons/io";
import UploadBox from "../../Components/UploadBox";
import ProductSpecsEditor from "../../Components/ProductSpecsEditor";
import ProductOptionsEditor, { normalizeProductOptionsForSubmit } from "../../Components/ProductOptionsEditor";

const SpecialtyEditProduct = () => {
  const context = useContext(MyContext);
  const productId = context?.isOpenFullScreenPanel?.id;
  const isGrocery = context?.userData?.role === "GROCERY_SELLER";
  const accent = isGrocery ? "#059669" : "#ea580c";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [specifications, setSpecifications] = useState([{ key: "", value: "" }]);
  const [productOptions, setProductOptions] = useState([{ name: "", label: "", values: [] }]);
  const [form, setForm] = useState({
    name: "",
    title: "",
    description: "",
    price: "",
    oldPrice: "",
    countInStock: "",
    categoryId: "",
    subCategoryId: "",
    isAvailable: true,
    isFeatured: false,
  });

  useEffect(() => {
    if (!productId) return;
    const catType = isGrocery ? "grocery" : "restaurant";
    
    Promise.all([
      fetchDataFromApi(`/api/go-market/products/${productId}`).catch(() => 
        fetchDataFromApi(`/api/product/${productId}`)
      ),
      fetchDataFromApi(`/api/go-market/categories?type=${catType}&limit=100&status=active`),
    ]).then(([prodRes, catRes]) => {
      let p = prodRes?.data || prodRes?.product || prodRes;
      
      if (p?.data && typeof p.data === 'object' && !Array.isArray(p.data)) {
        p = p.data;
      }
      
      console.log("Product data loaded:", p);
      
      if (p && typeof p === 'object') {
        setForm({
          name: p.name || "",
          title: p.title || "",
          description: p.description || "",
          price: p.price || p.discountPrice || "",
          oldPrice: p.oldPrice || p.price || p.discountPrice || "",
          countInStock: isGrocery ? String(p.countInStock ?? p.stock ?? 0) : "",
          categoryId: p.categoryId || p.goMarketCategoryId || "",
          subCategoryId: p.subCategoryId || p.goMarketSubCategoryId || "",
          isAvailable: p.isAvailable !== false,
          isFeatured: p.isFeatured || false,
        });

        const specs = p.specifications || p.specs || [];
        if (Array.isArray(specs) && specs.length > 0) {
          setSpecifications(specs);
        }

        const opts = p.productOptions || p.options || [];
        if (Array.isArray(opts) && opts.length > 0) {
          setProductOptions(opts);
        }

        let imgs = [];
        if (Array.isArray(p.images)) {
          imgs = p.images;
        } else if (p.image && typeof p.image === 'string') {
          imgs = [p.image];
        }
        
        if (imgs.length > 0) {
          setPreviews(imgs);
        }
      }
      
      setCategories(catRes?.data || []);
      setLoading(false);
    }).catch((err) => {
      console.error("Error loading product:", err);
      context.alertBox("error", "Could not load product details");
      setLoading(false);
    });
  }, [productId, isGrocery]);

  useEffect(() => {
    if (!form.categoryId) {
      setSubCategories([]);
      return;
    }
    fetchDataFromApi(`/api/go-market/subcategories?parentId=${form.categoryId}&limit=100&status=active`).then((res) => {
      setSubCategories(res?.data || []);
    });
  }, [form.categoryId]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const setPreviewsFun = (arr) => {
    setPreviews((prev) => [...new Set([...prev, ...arr])]);
  };

  const removeImg = (image, index) => {
    deleteImages(`/api/category/deteleImage?img=${image}`).finally(() => {
      setPreviews((prev) => prev.filter((_, i) => i !== index));
    });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      context.alertBox("error", "Product name is required");
      return;
    }
    if (!form.description.trim()) {
      context.alertBox("error", "Product description is required");
      return;
    }
    if (!form.categoryId) {
      context.alertBox("error", "Please select a category");
      return;
    }
    if (!form.price) {
      context.alertBox("error", "Price is required");
      return;
    }
    if (isGrocery && !form.countInStock) {
      context.alertBox("error", "Stock quantity is required");
      return;
    }

    setSaving(true);
    
    const payload = {
      name: form.name.trim(),
      title: (form.title || form.name).trim(),
      description: form.description.trim(),
      specifications: specifications.filter((s) => s.key?.trim() && s.value?.trim()),
      productOptions: normalizeProductOptionsForSubmit(productOptions),
      price: Number(form.price),
      oldPrice: Number(form.oldPrice || form.price),
      images: previews,
      categoryId: form.categoryId,
      subCategoryId: form.subCategoryId,
      isFeatured: form.isFeatured,
      goMarketCategoryId: form.categoryId,
      goMarketSubCategoryId: form.subCategoryId,
    };
    
    if (isGrocery) {
      payload.countInStock = Number(form.countInStock);
      payload.stock = Number(form.countInStock);
    } else {
      payload.isAvailable = form.isAvailable;
    }

    editData(`/api/go-market/products/${productId}`, payload)
      .then((res) => {
        if (res?.error === false || res?.success === true) {
          context.alertBox("success", res?.message || "Product updated successfully!");
          setTimeout(() => {
            context.setIsOpenFullScreenPanel({ open: false });
          }, 1000);
        } else if (res?.data?.error === false) {
          context.alertBox("success", res?.data?.message || "Product updated successfully!");
          setTimeout(() => {
            context.setIsOpenFullScreenPanel({ open: false });
          }, 1000);
        } else {
          throw new Error(res?.message || res?.data?.message || "Update failed");
        }
      })
      .catch((err) => {
        console.error("Update error:", err);
        editData(`/api/product/updateProduct/${productId}`, payload)
          .then((res) => {
            if (res?.data?.error === false) {
              context.alertBox("success", res?.data?.message || "Product updated successfully!");
              setTimeout(() => {
                context.setIsOpenFullScreenPanel({ open: false });
              }, 1000);
            } else {
              context.alertBox("error", res?.data?.message || res?.message || "Update failed");
            }
          })
          .catch((fallbackErr) => {
            context.alertBox("error", fallbackErr?.message || "Could not update product");
          })
          .finally(() => setSaving(false));
      })
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 60, flexDirection: "column" }}>
        <CircularProgress style={{ color: accent }} size={50} />
        <p style={{ marginTop: 16, color: "#6b7280", fontSize: 13 }}>Loading product details...</p>
      </div>
    );
  }

  const inputStyle = { 
    width: "100%", 
    border: "1px solid #e5e7eb", 
    borderRadius: 10, 
    padding: "10px 12px", 
    fontSize: 14, 
    boxSizing: "border-box",
    fontFamily: "inherit"
  };
  
  const cardStyle = { 
    background: "#fff", 
    border: "1px solid #e5e7eb", 
    borderRadius: 16, 
    padding: 18, 
    marginBottom: 16, 
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)" 
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
    marginBottom: 6,
    display: "block"
  };

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px 40px", background: "linear-gradient(180deg,#f8fafc,#fff)" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 4 }}>
        {isGrocery ? "📦 Edit Grocery Item" : "🍽️ Edit Menu Item"}
      </h2>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        Update all product details including specifications, options, pricing, and stock.
      </p>

      {/* Basic Info */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 700, color: "#111827" }}>Basic Information</h3>
        
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Product Name *</label>
          <input 
            name="name" 
            value={form.name} 
            onChange={onChange} 
            required 
            placeholder="e.g. Fresh Tomatoes, Biryani"
            style={inputStyle} 
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Display Title (for product page)</label>
          <input 
            name="title" 
            value={form.title} 
            onChange={onChange} 
            placeholder="Leave blank to use product name" 
            style={inputStyle} 
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Description *</label>
          <textarea 
            name="description" 
            value={form.description} 
            onChange={onChange} 
            rows={4}
            placeholder="Describe the product in detail..."
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} 
          />
        </div>
      </div>

      {/* Specifications */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 700, color: "#111827" }}>📋 Specifications</h3>
        <ProductSpecsEditor value={specifications} onChange={setSpecifications} accent={accent} />
      </div>

      {/* Product Options */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 700, color: "#111827" }}>⚙️ Product Options (Size, Color, Weight, etc.)</h3>
        <ProductOptionsEditor value={productOptions} onChange={setProductOptions} accent={accent} />
      </div>

      {/* Pricing */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 700, color: "#111827" }}>💰 Pricing</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>MRP / Original Price (₹) *</label>
            <input 
              name="oldPrice" 
              type="number" 
              value={form.oldPrice} 
              onChange={onChange} 
              placeholder="100"
              style={inputStyle} 
            />
          </div>
          <div>
            <label style={labelStyle}>Selling Price (₹) *</label>
            <input 
              name="price" 
              type="number" 
              value={form.price} 
              onChange={onChange} 
              required 
              placeholder="85"
              style={inputStyle} 
            />
          </div>
        </div>
      </div>

      {/* Stock / Availability */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 700, color: "#111827" }}>📦 Stock & Availability</h3>
        
        {isGrocery ? (
          <div>
            <label style={labelStyle}>Stock Quantity *</label>
            <input 
              name="countInStock" 
              type="number" 
              min={0}
              value={form.countInStock} 
              onChange={onChange}
              placeholder="50"
              style={inputStyle} 
            />
          </div>
        ) : (
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <input 
              type="checkbox" 
              name="isAvailable" 
              checked={form.isAvailable} 
              onChange={onChange}
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />
            <span>Available on menu (customers can order)</span>
          </label>
        )}
      </div>

      {/* Featured Product */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: 12, fontSize: 14, fontWeight: 700, color: "#111827" }}>⭐ Featured</h3>
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <input 
            type="checkbox" 
            name="isFeatured" 
            checked={form.isFeatured} 
            onChange={onChange}
            style={{ width: 18, height: 18, cursor: "pointer" }}
          />
          <span>Yes - Featured Product (show on homepage)</span>
        </label>
      </div>

      {/* Categories */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 700, color: "#111827" }}>🏷️ Categories</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Category *</label>
            <Select 
              size="small" 
              fullWidth 
              value={form.categoryId} 
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value, subCategoryId: "" }))}
              displayEmpty
            >
              <MenuItem value="">Select Category</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
              ))}
            </Select>
          </div>
          <div>
            <label style={labelStyle}>Sub Category</label>
            <Select 
              size="small" 
              fullWidth 
              value={form.subCategoryId} 
              onChange={(e) => setForm((f) => ({ ...f, subCategoryId: e.target.value }))} 
              disabled={!form.categoryId}
              displayEmpty
            >
              <MenuItem value="">Optional</MenuItem>
              {subCategories.map((c) => (
                <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Images */}
      <div style={cardStyle}>
        <label style={{ fontSize: 12, fontWeight: 800, color: "#374151", display: "block", marginBottom: 8 }}>
          📸 Product Gallery ({previews.length} images)
        </label>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "#6b7280" }}>
          First image is used as cover. All images appear in the product slider.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 12 }}>
          {previews.map((image, index) => (
            <div key={`${image}-${index}`} style={{ position: "relative" }}>
              <button 
                type="button" 
                onClick={() => removeImg(image, index)}
                style={{ 
                  position: "absolute", 
                  top: -6, 
                  right: -6, 
                  width: 24, 
                  height: 24, 
                  borderRadius: "50%", 
                  background: "#dc2626", 
                  border: "none", 
                  color: "#fff", 
                  cursor: "pointer", 
                  zIndex: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <IoMdClose size={15} />
              </button>
              <div style={{ 
                borderRadius: 12, 
                overflow: "hidden", 
                height: 110, 
                border: `3px solid ${index === 0 ? accent : "#e5e7eb"}` 
              }}>
                <img src={image} alt={`Product ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              {index === 0 && (
                <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: accent }}>
                  ⭐ Cover Image
                </div>
              )}
            </div>
          ))}
          <UploadBox multiple name="images" url="/api/product/uploadImages" setPreviewsFun={setPreviewsFun} />
        </div>
      </div>

      {/* Submit */}
      <button 
        type="submit" 
        disabled={saving} 
        style={{
          width: "100%",
          background: accent, 
          color: "#fff", 
          border: "none", 
          borderRadius: 10,
          padding: "14px 24px", 
          fontWeight: 700, 
          fontSize: 15, 
          cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? 0.7 : 1,
          transition: "all 0.3s ease"
        }}
        onMouseEnter={(e) => !saving && (e.target.style.opacity = "0.9")}
        onMouseLeave={(e) => !saving && (e.target.style.opacity = "1")}
      >
        {saving ? (
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <CircularProgress size={18} style={{ color: "#fff" }} />
            Saving...
          </span>
        ) : (
          "✅ Save Changes"
        )}
      </button>
    </form>
  );
};

export default SpecialtyEditProduct;
