import React, { useContext, useEffect, useState } from "react";
import { Button, CircularProgress, TextField } from "@mui/material";
import { MyContext } from "../../App";
import { deleteData, editData, fetchDataFromApi, postData } from "../../utils/api";

const initialForm = {
  code: "",
  title: "",
  description: "",
  type: "percentage",
  value: 0,
  minOrderAmount: 0,
  maxDiscountAmount: "",
  usageLimit: "",
  isActive: true,
};

const CouponsPage = () => {
  const context = useContext(MyContext);
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = () => {
    setLoading(true);
    fetchDataFromApi("/api/coupon/admin").then((res) => {
      if (res?.success) setCoupons(res.data || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      value: Number(form.value),
      minOrderAmount: Number(form.minOrderAmount || 0),
      maxDiscountAmount: form.maxDiscountAmount === "" ? null : Number(form.maxDiscountAmount),
      usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
    };

    const res = editingId
      ? await editData(`/api/coupon/admin/${editingId}`, payload)
      : await postData("/api/coupon/admin", payload);

    setSaving(false);

    const isSuccess = editingId ? res?.data?.success : res?.success;
    if (isSuccess) {
      context.alertBox("success", editingId ? "Coupon updated" : "Coupon created");
      setForm(initialForm);
      setEditingId("");
      fetchCoupons();
    } else {
      context.alertBox("error", res?.message || res?.data?.message || "Action failed");
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
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount ?? "",
      usageLimit: coupon.usageLimit ?? "",
      isActive: coupon.isActive,
    });
  };

  const onDelete = async (id) => {
    await deleteData(`/api/coupon/admin/${id}`);
    context.alertBox("success", "Coupon deleted");
    fetchCoupons();
  };

  return (
    <section className="p-5">
      <div className="card bg-white rounded-md shadow-md p-5 mb-5">
        <h2 className="text-[22px] font-[700] mb-1">Coupon Management</h2>
        <p className="text-[13px] text-gray-500 mb-4">Create, edit and manage dynamic offers for customers.</p>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={onSubmit}>
          <TextField label="Code" size="small" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required />
          <TextField label="Title" size="small" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <TextField label="Description" size="small" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <TextField label="Type (percentage/fixed)" size="small" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} required />
          <TextField label="Value" type="number" size="small" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} required />
          <TextField label="Min Order Amount" type="number" size="small" value={form.minOrderAmount} onChange={(e) => setForm((p) => ({ ...p, minOrderAmount: e.target.value }))} />
          <TextField label="Max Discount Amount" type="number" size="small" value={form.maxDiscountAmount} onChange={(e) => setForm((p) => ({ ...p, maxDiscountAmount: e.target.value }))} />
          <TextField label="Usage Limit" type="number" size="small" value={form.usageLimit} onChange={(e) => setForm((p) => ({ ...p, usageLimit: e.target.value }))} />
          <TextField label="Active (true/false)" size="small" value={String(form.isActive)} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.value === "true" }))} />
          <div className="md:col-span-3 flex gap-2">
            <Button type="submit" variant="contained" disabled={saving}>{saving ? <CircularProgress size={18} color="inherit" /> : editingId ? "Update Coupon" : "Create Coupon"}</Button>
            {editingId && <Button variant="outlined" onClick={() => { setEditingId(""); setForm(initialForm); }}>Cancel Edit</Button>}
          </div>
        </form>
      </div>

      <div className="card bg-white rounded-md shadow-md p-5">
        <h3 className="text-[18px] font-[700] mb-3">All Coupons</h3>
        {loading ? <CircularProgress /> : (
          <div className="overflow-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="border-b">
                    <td className="py-2 font-[700]">{coupon.code}</td>
                    <td>{coupon.type}</td>
                    <td>{coupon.type === "percentage" ? `${coupon.value}%` : `₹${coupon.value}`}</td>
                    <td>₹{coupon.minOrderAmount || 0}</td>
                    <td>{coupon.isActive ? "Active" : "Inactive"}</td>
                    <td className="space-x-2">
                      <Button size="small" onClick={() => onEdit(coupon)}>Edit</Button>
                      <Button size="small" color="error" onClick={() => onDelete(coupon._id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default CouponsPage;