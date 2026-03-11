import React, { useContext, useEffect, useState } from "react";
import { Button } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { MyContext } from "../../App";
import { editData, fetchDataFromApi } from "../../utils/api";

const StoreProfile = () => {
  const context = useContext(MyContext);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ storeName: "", description: "", location: "", contactNo: "", moreInfo: "", image: "" });

  useEffect(() => {
    fetchDataFromApi("/api/user/seller/store-profile").then((res) => {
      if (res?.success) {
        const p = res?.seller?.storeProfile || {};
        setForm({ storeName: p.storeName || "", description: p.description || "", location: p.location || "", contactNo: p.contactNo || "", moreInfo: p.moreInfo || "", image: p.image || "" });
      }
    });
  }, []);

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await editData("/api/user/seller/store-profile", form);
    if (res?.success) context?.openAlertBox("success", "Store profile updated");
    else context?.openAlertBox("error", res?.message || "Unable to update store profile");
    setIsLoading(false);
  };

  return (
    <section className="p-3 md:p-4">
      <div className="bg-white border rounded-md p-4 md:p-6">
        <h2 className="text-[20px] font-[700] mb-1">Store Profile</h2>
        <p className="text-[13px] text-gray-500 mb-5">Yaha se aapka public store page manage hoga.</p>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="storeName" value={form.storeName} onChange={onChange} placeholder="Store Name" className="border rounded-md px-3 py-2" required />
          <input name="contactNo" value={form.contactNo} onChange={onChange} placeholder="Contact Number" className="border rounded-md px-3 py-2" />
          <input name="location" value={form.location} onChange={onChange} placeholder="Store Location" className="border rounded-md px-3 py-2" />
          <input name="image" value={form.image} onChange={onChange} placeholder="Store Banner/Image URL" className="border rounded-md px-3 py-2" />
          <textarea name="description" value={form.description} onChange={onChange} placeholder="Store Description" className="border rounded-md px-3 py-2 md:col-span-2" rows={3} />
          <textarea name="moreInfo" value={form.moreInfo} onChange={onChange} placeholder="Policies, shipping time, support details" className="border rounded-md px-3 py-2 md:col-span-2" rows={3} />
          <div className="md:col-span-2">
            <Button type="submit" className="btn-blue" disabled={isLoading}>{isLoading ? <CircularProgress size={22} /> : "Save Store Profile"}</Button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default StoreProfile;