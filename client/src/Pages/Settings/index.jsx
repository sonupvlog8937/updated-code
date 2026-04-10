import React, { useEffect, useMemo, useState } from "react";
import { Button, CircularProgress, Switch } from "@mui/material";
import { FiBell, FiCheckCircle, FiSave, FiSettings } from "react-icons/fi";
import AccountSidebar from "../../components/AccountSidebar";
import { editData, fetchDataFromApi } from "../../utils/api";
import { useAppContext } from "../../hooks/useAppContext";

const sections = [
  {
    title: "Notification categories",
    icon: <FiBell />,
    rows: [
      { key: "orderUpdates", label: "Order updates", description: "Delivery, shipping and payment status updates" },
      { key: "offersAndCoupons", label: "Offers & coupons", description: "Discounts, campaign offers and flash deals" },
      { key: "sellerProgram", label: "Become seller updates", description: "Seller approval, onboarding and account alerts" },
      { key: "productUpdates", label: "Product updates", description: "Price drop and back-in-stock notifications" },
    ],
  },
  {
    title: "Delivery channels",
    icon: <FiSettings />,
    rows: [
      { key: "pushEnabled", label: "Push notifications", description: "Receive instant app/browser alerts" },
      { key: "emailEnabled", label: "Email notifications", description: "Get important updates on email" },
    ],
  },
];

const SettingsPage = () => {
  const context = useAppContext();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const allKeys = useMemo(() => sections.flatMap((section) => section.rows.map((row) => row.key)), []);

  const enabledCount = useMemo(
    () => allKeys.filter((key) => Boolean(settings?.[key])).length,
    [allKeys, settings]
  );

  useEffect(() => {
    fetchDataFromApi("/api/notification-settings").then((res) => {
      if (res?.success) setSettings(res.data || {});
      setLoading(false);
    });
  }, []);

  const toggleField = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev?.[key] }));
  };

  const setAllValues = (value) => {
    setSettings((prev) => {
      const next = { ...prev };
      allKeys.forEach((key) => {
        next[key] = value;
      });
      return next;
    });
  };

  const saveSettings = async () => {
    setSaving(true);
    const res = await editData("/api/notification-settings", settings);
    setSaving(false);

    if (res?.data?.success) {
      context.alertBox("success", res.data.message || "Settings updated successfully");
    } else {
      context.alertBox("error", "Unable to update settings");
    }
  };

  const renderSection = (section) => (
    <div key={section.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h2 className="text-[18px] font-[700] text-slate-800 flex items-center gap-2 mb-4">
        {section.icon}
        {section.title}
      </h2>
      <div className="space-y-3">
        {section.rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3 border border-slate-100 rounded-xl px-4 py-4 hover:bg-slate-50 transition-all">
            <div>
              <h3 className="text-[15px] font-[700] text-slate-800">{row.label}</h3>
              <p className="text-[12px] text-slate-500 mt-1">{row.description}</p>
            </div>
            <Switch checked={Boolean(settings?.[row.key])} onChange={() => toggleField(row.key)} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="py-3 lg:py-10 w-full bg-[#f6f8fc] min-h-screen">
      <div className="container flex flex-col lg:flex-row gap-5">

        <div className="w-full lg:w-[80%] space-y-5">
          <div className="rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#0284c7] p-6 text-white shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/75">Settings</p>
                <h1 className="text-[28px] font-[800] mt-1">Account Settings</h1>
                <p className="text-[13px] text-white/85 mt-2">Manage your alerts and communication preferences.</p>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3">
                <p className="text-[11px] text-white/70">Enabled options</p>
                <p className="text-[24px] font-[800] leading-none mt-1">{enabledCount}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <CircularProgress />
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-wrap gap-2 justify-end">
                <Button size="small" variant="outlined" onClick={() => setAllValues(true)} startIcon={<FiCheckCircle />}>Enable all</Button>
                <Button size="small" variant="outlined" color="inherit" onClick={() => setAllValues(false)}>Disable all</Button>
                <Button size="small" variant="contained" onClick={saveSettings} disabled={saving} startIcon={!saving && <FiSave />}>
                  {saving ? <CircularProgress size={16} color="inherit" /> : "Save settings"}
                </Button>
              </div>

              {sections.map(renderSection)}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default SettingsPage;