import React, { useContext, useEffect, useState } from "react";
import { 
  Button, 
  CircularProgress, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip
} from "@mui/material";
import { Edit, Delete, Tag, Info } from "@mui/icons-material";
import { MyContext } from "../../App";
import { deleteData, editData, fetchDataFromApi, postData } from "../../utils/api";

const GO_MARKET_SHOP_SELLERS = [
  "GROCERY_SELLER", "FASHION_SELLER", "ELECTRONICS_SELLER", "MEDICAL_SELLER",
  "BEAUTY_SELLER", "HOME_KITCHEN_SELLER", "GIFTS_TOYS_SELLER",
  "BOOKS_STATIONERY_SELLER", "JEWELLERY_SELLER", "HARDWARE_SELLER", "AUTOMOBILE_SELLER"
];

const initialForm = {
  code: "",
  title: "",
  description: "",
  type: "percentage",
  value: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  usageLimit: "",
  isActive: true,
  audience: "global",
  startsAt: "",
  expiresAt: "",
};

const CouponsPage = () => {
  const context = useContext(MyContext);
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const userRole = localStorage.getItem("userRole") || context?.userData?.role || "";
  const isSellerCoupon = GO_MARKET_SHOP_SELLERS.includes(userRole) || userRole === "RESTAURANT_SELLER";
  const endpointBase = isSellerCoupon ? "/api/coupon/seller" : "/api/coupon/admin";

  const fetchCoupons = () => {
    setLoading(true);
    fetchDataFromApi(endpointBase).then((res) => {
      console.log("✅ Fetch Coupons Response:", res);
      if (res?.success || Array.isArray(res?.data)) {
        setCoupons(res.data || res || []);
      } else {
        console.error("❌ Invalid response format:", res);
        setCoupons([]);
      }
      setLoading(false);
    }).catch(err => {
      console.error("❌ Fetch error:", err);
      context.alertBox("error", "Failed to load coupons");
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchCoupons();
  }, [endpointBase]);

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.code.trim()) {
      context.alertBox("error", "Coupon code is required");
      return;
    }
    if (!form.title.trim()) {
      context.alertBox("error", "Title is required");
      return;
    }
    if (!form.value || Number(form.value) <= 0) {
      context.alertBox("error", "Value must be greater than 0");
      return;
    }

    setSaving(true);

    const payload = {
      code: form.code.trim().toUpperCase(),
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      value: Number(form.value),
      minOrderAmount: form.minOrderAmount === "" ? 0 : Number(form.minOrderAmount),
      maxDiscountAmount: form.maxDiscountAmount === "" ? null : Number(form.maxDiscountAmount),
      usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
      isActive: form.isActive,
      audience: form.audience,
      startsAt: form.startsAt || null,
      expiresAt: form.expiresAt || null,
    };

    console.log("📤 Submitting payload:", payload);

    try {
      const res = editingId
        ? await editData(`${endpointBase}/${editingId}`, payload)
        : await postData(endpointBase, payload);

      console.log("📥 Submit response:", res);

      setSaving(false);

      const isSuccess = res?.success || res?.data?.success;
      if (isSuccess) {
        context.alertBox("success", editingId ? "Coupon updated successfully!" : "Coupon created successfully!");
        setForm(initialForm);
        setEditingId("");
        fetchCoupons();
      } else {
        const errorMsg = res?.message || res?.data?.message || res?.error || "Failed to save coupon";
        context.alertBox("error", errorMsg);
        console.error("❌ Save failed:", res);
      }
    } catch (error) {
      setSaving(false);
      console.error("❌ Submit error:", error);
      context.alertBox("error", error.message || "Network error. Please try again.");
    }
  };

  const onEdit = (coupon) => {
    setEditingId(coupon._id);
    setForm({
      code: coupon.code,
      title: coupon.title,
      description: coupon.description || "",
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount || "",
      maxDiscountAmount: coupon.maxDiscountAmount ?? "",
      usageLimit: coupon.usageLimit ?? "",
      isActive: coupon.isActive,
      audience: coupon.audience || "global",
      startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString().slice(0, 16) : "",
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    
    try {
      await deleteData(`${endpointBase}/${id}`);
      context.alertBox("success", "Coupon deleted successfully");
      fetchCoupons();
    } catch (error) {
      context.alertBox("error", "Failed to delete coupon");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <section className="p-5">
      {/* Create/Edit Form */}
      <div className="card bg-white rounded-md shadow-md p-6 mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Tag className="text-primary" />
          <h2 className="text-[22px] font-[700]">
            {editingId ? "Edit Coupon" : "Create New Coupon"}
          </h2>
        </div>
        <p className="text-[13px] text-gray-500 mb-5">
          {isSellerCoupon 
            ? "Create shop-specific coupons for your products. Coupons will only apply to orders from your shop." 
            : "Create global coupons or target specific audiences (grocery/restaurant)."}
        </p>
        
        <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={onSubmit}>
          {/* Code */}
          <TextField 
            label="Coupon Code *" 
            size="small" 
            value={form.code} 
            onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} 
            placeholder="e.g., SAVE20"
            helperText="Unique code customers will enter"
            required 
          />

          {/* Title */}
          <TextField 
            label="Title *" 
            size="small" 
            value={form.title} 
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} 
            placeholder="e.g., 20% off on orders"
            helperText="Display name for the coupon"
            required 
          />

          {/* Description */}
          <TextField 
            label="Description" 
            size="small" 
            value={form.description} 
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} 
            placeholder="e.g., Valid on orders above ₹500"
            helperText="Additional details"
          />

          {/* Type */}
          <FormControl size="small" required>
            <InputLabel>Discount Type *</InputLabel>
            <Select
              value={form.type}
              label="Discount Type *"
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            >
              <MenuItem value="percentage">Percentage (%)</MenuItem>
              <MenuItem value="fixed">Fixed Amount (₹)</MenuItem>
            </Select>
          </FormControl>

          {/* Value */}
          <TextField 
            label={form.type === "percentage" ? "Discount Percentage *" : "Discount Amount *"}
            type="number" 
            size="small" 
            value={form.value} 
            onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} 
            placeholder={form.type === "percentage" ? "e.g., 20" : "e.g., 100"}
            helperText={form.type === "percentage" ? "Enter percentage (1-100)" : "Enter amount in ₹"}
            required 
            inputProps={{ min: 0, max: form.type === "percentage" ? 100 : undefined }}
          />

          {/* Min Order Amount */}
          <TextField 
            label="Minimum Order Amount" 
            type="number" 
            size="small" 
            value={form.minOrderAmount} 
            onChange={(e) => setForm((p) => ({ ...p, minOrderAmount: e.target.value }))} 
            placeholder="e.g., 500"
            helperText="Min cart value required (₹)"
            inputProps={{ min: 0 }}
          />

          {/* Max Discount (for percentage) */}
          {form.type === "percentage" && (
            <TextField 
              label="Max Discount Cap" 
              type="number" 
              size="small" 
              value={form.maxDiscountAmount} 
              onChange={(e) => setForm((p) => ({ ...p, maxDiscountAmount: e.target.value }))} 
              placeholder="e.g., 200"
              helperText="Maximum discount in ₹ (optional)"
              inputProps={{ min: 0 }}
            />
          )}

          {/* Usage Limit */}
          <TextField 
            label="Usage Limit" 
            type="number" 
            size="small" 
            value={form.usageLimit} 
            onChange={(e) => setForm((p) => ({ ...p, usageLimit: e.target.value }))} 
            placeholder="e.g., 100"
            helperText="Max total uses (optional)"
            inputProps={{ min: 0 }}
          />

          {/* Audience (Admin only) */}
          {!isSellerCoupon && (
            <FormControl size="small">
              <InputLabel>Audience</InputLabel>
              <Select
                value={form.audience}
                label="Audience"
                onChange={(e) => setForm((p) => ({ ...p, audience: e.target.value }))}
              >
                <MenuItem value="global">Global (All)</MenuItem>
                <MenuItem value="grocery">Grocery Only</MenuItem>
                <MenuItem value="restaurant">Restaurant Only</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Start Date */}
          <TextField 
            label="Start Date (Optional)" 
            type="datetime-local" 
            size="small" 
            value={form.startsAt} 
            onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))} 
            InputLabelProps={{ shrink: true }}
            helperText="Leave empty for immediate"
          />

          {/* Expiry Date */}
          <TextField 
            label="Expiry Date (Optional)" 
            type="datetime-local" 
            size="small" 
            value={form.expiresAt} 
            onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))} 
            InputLabelProps={{ shrink: true }}
            helperText="Leave empty for no expiry"
          />

          {/* Active Toggle */}
          <div className="flex items-center">
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  color="primary"
                />
              }
              label={form.isActive ? "Active" : "Inactive"}
            />
          </div>

          {/* Submit Buttons */}
          <div className="md:col-span-3 flex gap-3 pt-2">
            <Button 
              type="submit" 
              variant="contained" 
              disabled={saving}
              size="large"
              startIcon={saving && <CircularProgress size={18} color="inherit" />}
            >
              {saving ? "Saving..." : editingId ? "Update Coupon" : "Create Coupon"}
            </Button>
            {editingId && (
              <Button 
                variant="outlined" 
                onClick={() => { 
                  setEditingId(""); 
                  setForm(initialForm); 
                }}
                size="large"
              >
                Cancel Edit
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Coupons List */}
      <div className="card bg-white rounded-md shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[20px] font-[700]">
            {isSellerCoupon ? "My Coupons" : "All Coupons"}
          </h3>
          <Chip 
            label={`${coupons.length} Total`} 
            color="primary" 
            size="small" 
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <CircularProgress />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Tag style={{ fontSize: 48, opacity: 0.3 }} />
            <p className="mt-2">No coupons created yet</p>
            <p className="text-sm">Create your first coupon above</p>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="py-3 px-3 font-semibold">Code</th>
                  <th className="py-3 px-3 font-semibold">Title</th>
                  <th className="py-3 px-3 font-semibold">Type</th>
                  <th className="py-3 px-3 font-semibold">Value</th>
                  <th className="py-3 px-3 font-semibold">Min Order</th>
                  <th className="py-3 px-3 font-semibold">Usage</th>
                  <th className="py-3 px-3 font-semibold">Expires</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <code className="bg-primary/10 text-primary px-2 py-1 rounded font-mono font-bold text-[12px]">
                          {coupon.code}
                        </code>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div>
                        <div className="font-medium">{coupon.title}</div>
                        {coupon.description && (
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            {coupon.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <Chip 
                        label={coupon.type === "percentage" ? "Percentage" : "Fixed"} 
                        size="small" 
                        variant="outlined"
                      />
                    </td>
                    <td className="py-3 px-3 font-semibold text-green-600">
                      {coupon.type === "percentage" ? `${coupon.value}%` : `₹${coupon.value}`}
                      {coupon.type === "percentage" && coupon.maxDiscountAmount && (
                        <Tooltip title="Max discount cap">
                          <span className="text-[11px] text-gray-500 ml-1">(max ₹{coupon.maxDiscountAmount})</span>
                        </Tooltip>
                      )}
                    </td>
                    <td className="py-3 px-3">₹{coupon.minOrderAmount || 0}</td>
                    <td className="py-3 px-3">
                      {coupon.usageLimit ? (
                        <span>{coupon.usedCount || 0}/{coupon.usageLimit}</span>
                      ) : (
                        <span className="text-gray-400">Unlimited</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[11px]">
                      {formatDate(coupon.expiresAt)}
                    </td>
                    <td className="py-3 px-3">
                      <Chip 
                        label={coupon.isActive ? "Active" : "Inactive"} 
                        color={coupon.isActive ? "success" : "default"}
                        size="small"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex justify-center gap-1">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => onEdit(coupon)} color="primary">
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => onDelete(coupon._id)} color="error">
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Note for Sellers */}
      {isSellerCoupon && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4 flex gap-3">
          <Info className="text-blue-600 flex-shrink-0" />
          <div className="text-[13px] text-blue-900">
            <p className="font-semibold mb-1">Seller Coupon Restrictions</p>
            <p>Coupons you create will only apply to orders from your shop/restaurant. Customers shopping from other sellers won't see or be able to use your coupons.</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default CouponsPage;