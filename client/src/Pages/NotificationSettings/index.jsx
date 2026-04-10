import React, { useEffect, useState } from "react";
import { Button, CircularProgress, Switch } from "@mui/material";
import AccountSidebar from "../../components/AccountSidebar";
import { editData, fetchDataFromApi } from "../../utils/api";
import { useAppContext } from "../../hooks/useAppContext";

const settingRows = [
  { key: "orderUpdates", label: "Order updates", description: "Delivery, shipping and payment status updates" },
  { key: "offersAndCoupons", label: "Offers & coupons", description: "New discount and promo offers" },
  { key: "sellerProgram", label: "Become a seller updates", description: "Seller onboarding and approval alerts" },
  { key: "productUpdates", label: "Product updates", description: "Back in stock and price drop notifications" },
  { key: "pushEnabled", label: "Push notifications", description: "Receive real-time alerts on your device" },
  { key: "emailEnabled", label: "Email notifications", description: "Receive important updates by email" },
];

const NotificationSettings = () => {
  const context = useAppContext();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDataFromApi("/api/notification-settings").then((res) => {
      if (res?.success) {
        setForm(res.data || {});
      }
      setLoading(false);
    });
  }, []);

  const toggleField = (key) => setForm((prev) => ({ ...prev, [key]: !prev?.[key] }));

  const onSave = async () => {
    setSaving(true);
    const res = await editData("/api/notification-settings", form);
    setSaving(false);
    if (res?.data?.success) {
      context.alertBox("success", res.data.message || "Settings updated");
    } else {
      context.alertBox("error", "Failed to update settings");
    }
  };

  return (
    <section className="py-3 lg:py-10 w-full bg-[#f8fafc] min-h-screen">
      <div className="container flex flex-col lg:flex-row gap-5">
        <div className="w-full lg:w-[70%]">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 lg:p-8">
            <h1 className="text-[24px] font-[700] text-slate-800 mb-1">Notification Preferences</h1>
            <p className="text-[14px] text-slate-500 mb-6">Manage alerts for offers, orders and seller program updates.</p>

            {loading ? (
              <div className="py-12 text-center"><CircularProgress /></div>
            ) : (
              <div className="space-y-3">
                {settingRows.map((row) => (
                  <div key={row.key} className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl px-4 py-4 hover:bg-slate-50 transition-all">
                    <div>
                      <h3 className="text-[15px] font-[600] text-slate-800">{row.label}</h3>
                      <p className="text-[12px] text-slate-500 mt-1">{row.description}</p>
                    </div>
                    <Switch checked={Boolean(form?.[row.key])} onChange={() => toggleField(row.key)} />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button variant="contained" onClick={onSave} disabled={saving}>
                {saving ? <CircularProgress size={18} color="inherit" /> : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotificationSettings;