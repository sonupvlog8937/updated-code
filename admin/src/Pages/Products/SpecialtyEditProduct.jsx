import React, { useContext, useEffect, useState } from "react";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import CircularProgress from "@mui/material/CircularProgress";
import { MyContext } from "../../App";
import { editData, fetchDataFromApi } from "../../utils/api";
import UploadBox from "../../Components/UploadBox";
import ProductSpecsEditor from "../../Components/ProductSpecsEditor";

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
  });

  useEffect(() => {
    if (!productId) return;
    const catType = isGrocery ? "grocery" : "restaurant";
    Promise.all([
      fetchDataFromApi(`/api/product/${productId}`),
      fetchDataFromApi(`/api/go-market/categories?type=${catType}&limit=100&status=active`),
    ]).then(([prodRes, catRes]) => {
      const p = prodRes?.product;
      if (p) {
        setForm({
          name: p.name || "",
          title: p.title || "",
          description: p.description || "",
          price: p.price || "",
          oldPrice: p.oldPrice || p.price || "",
          countInStock: isGrocery ? String(p.countInStock ?? 0) : "",
          categoryId: p.categoryId || "",
          subCategoryId: p.subCategoryId || "",
          isAvailable: p.isAvailable !== false,
        });
        setSpecifications(
          p.specifications?.length ? p.specifications : [{ key: "", value: "" }],
        );
        if (p.images?.[0]) setPreviews([p.images[0]]);
      }
      setCategories(catRes?.data || []);
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

  const onSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      title: form.title || form.name,
      description: form.description,
      specifications: specifications.filter((s) => s.key?.trim() && s.value?.trim()),
      price: Number(form.price),
      oldPrice: Number(form.oldPrice || form.price),
      images: previews,
      goMarketCategoryId: form.categoryId,
      goMarketSubCategoryId: form.subCategoryId,
    };
    if (isGrocery) payload.countInStock = Number(form.countInStock);
    else payload.isAvailable = form.isAvailable;

    editData(`/api/product/updateProduct/${productId}`, payload).then((res) => {
      if (res?.data?.error === false) {
        context.alertBox("success", res?.data?.message || "Updated");
        context.setIsOpenFullScreenPanel({ open: false });
      } else {
        context.alertBox("error", res?.data?.message || "Update failed");
      }
    }).finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <CircularProgress style={{ color: accent }} />
      </div>
    );
  }

  const inputStyle = { width: "100%", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", fontSize: 14 };

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px 40px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 4 }}>
        {isGrocery ? "Edit grocery item" : "Edit menu item"}
      </h2>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        Update title, description, specifications, pricing, and stock for your storefront.
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Name</label>
        <input name="name" value={form.name} onChange={onChange} required style={inputStyle} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Display title (product page)</label>
        <input name="title" value={form.title} onChange={onChange} placeholder="Leave blank to use name" style={inputStyle} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Description</label>
        <textarea name="description" value={form.description} onChange={onChange} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
      </div>

      <ProductSpecsEditor value={specifications} onChange={setSpecifications} accent={accent} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>MRP (₹)</label>
          <input name="oldPrice" type="number" value={form.oldPrice} onChange={onChange} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Selling price (₹)</label>
          <input name="price" type="number" value={form.price} onChange={onChange} required style={inputStyle} />
        </div>
      </div>

      {isGrocery ? (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Stock units</label>
          <input name="countInStock" type="number" min={0} value={form.countInStock} onChange={onChange} style={inputStyle} />
        </div>
      ) : (
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
          <input type="checkbox" name="isAvailable" checked={form.isAvailable} onChange={onChange} />
          Available on menu (customers can order)
        </label>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Category</label>
          <Select size="small" fullWidth value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value, subCategoryId: "" }))}>
            <MenuItem value="">Select</MenuItem>
            {categories.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
          </Select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Sub category</label>
          <Select size="small" fullWidth value={form.subCategoryId} onChange={(e) => setForm((f) => ({ ...f, subCategoryId: e.target.value }))} disabled={!form.categoryId}>
            <MenuItem value="">Select</MenuItem>
            {subCategories.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
          </Select>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>Image</label>
        {previews[0] && (
          <img src={previews[0]} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, marginBottom: 10, border: "1px solid #e5e7eb" }} />
        )}
        <UploadBox name="images" url="/api/product/uploadImages" setPreviewsFun={(arr) => setPreviews(arr)} />
      </div>

      <button type="submit" disabled={saving} style={{
        background: accent, color: "#fff", border: "none", borderRadius: 10,
        padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: saving ? 0.7 : 1,
      }}>
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
};

export default SpecialtyEditProduct;
