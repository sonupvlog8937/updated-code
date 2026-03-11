import React, { useContext, useEffect, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { MyContext } from "../../App";
import { editData, fetchDataFromApi } from "../../utils/api";
import { FiPhone, FiMapPin, FiImage, FiFileText, FiInfo, FiChevronRight, FiSave, FiClock, FiExternalLink } from "react-icons/fi";
import { MdOutlineStore, MdOutlineShield, MdOutlineVerified } from "react-icons/md";
import { BsCheckCircle, BsExclamationCircle, BsStarFill } from "react-icons/bs";
import { TbTruckDelivery, TbRefresh } from "react-icons/tb";

const InputField = ({ icon: Icon, label, required, error, children }) => (
  <div className="group">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
      {Icon && <Icon size={11} className="text-gray-400" />}
      {label}
      {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><BsExclamationCircle size={10} /> {error}</p>}
  </div>
);

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2874f0] focus:border-transparent transition-all bg-white hover:border-gray-300";

const StoreProfile = () => {
  const context = useContext(MyContext);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [form, setForm] = useState({
    storeName: "",
    description: "",
    location: "",
    contactNo: "",
    moreInfo: "",
    image: "",
    returnPolicy: "",
    shippingTime: "",
    supportEmail: "",
    openHours: "",
  });

  useEffect(() => {
    fetchDataFromApi("/api/user/seller/store-profile").then((res) => {
      if (res?.success) {
        const p = res?.seller?.storeProfile || {};
        setForm({
          storeName: p.storeName || "",
          description: p.description || "",
          location: p.location || "",
          contactNo: p.contactNo || "",
          moreInfo: p.moreInfo || "",
          image: p.image || "",
          returnPolicy: p.returnPolicy || "",
          shippingTime: p.shippingTime || "",
          supportEmail: p.supportEmail || "",
          openHours: p.openHours || "",
        });
      }
      setIsFetching(false);
    });
  }, []);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setSaved(false);
  };

  const validate = () => {
    const e = {};
    if (!form.storeName.trim()) e.storeName = "Store name is required";
    if (form.contactNo && !/^\d{10}$/.test(form.contactNo)) e.contactNo = "Enter a valid 10-digit number";
    if (form.supportEmail && !/\S+@\S+\.\S+/.test(form.supportEmail)) e.supportEmail = "Enter a valid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    const res = await editData("/api/user/seller/store-profile", form);
    if (res?.success) {
      context?.openAlertBox("success", "Store profile updated successfully!");
      setSaved(true);
    } else {
      context?.openAlertBox("error", res?.message || "Unable to update store profile");
    }
    setIsLoading(false);
  };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: MdOutlineStore },
    { id: "policies", label: "Policies & Support", icon: MdOutlineShield },
  ];

  const completionFields = ["storeName", "description", "location", "contactNo", "image", "moreInfo"];
  const completionScore = Math.round(
    (completionFields.filter((f) => form[f]?.trim()).length / completionFields.length) * 100
  );

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <CircularProgress size={36} style={{ color: "#2874f0" }} />
          <p className="text-sm text-gray-400">Loading store profile...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MdOutlineStore size={24} className="text-[#2874f0]" /> Store Profile
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your public seller storefront</p>
        </div>

        {form.storeName && (
          <a
            href={`/store/${form.storeName}`}
            className="flex items-center gap-1.5 text-sm text-[#2874f0] hover:underline font-medium"
            target="_blank"
            rel="noreferrer"
          >
            View Public Store <FiExternalLink size={13} />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Store Preview Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="relative h-24 bg-gradient-to-r from-[#2874f0] to-blue-400">
              {form.image && (
                <img src={form.image} alt="banner" className="w-full h-full object-cover opacity-30" />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center">
                  {form.image
                    ? <img src={form.image} alt="logo" className="w-full h-full object-cover rounded-2xl" onError={(e) => { e.target.onerror = null; }} />
                    : <MdOutlineStore size={24} className="text-[#2874f0]" />}
                </div>
              </div>
            </div>
            <div className="p-4 text-center">
              <h3 className="font-bold text-gray-800 text-sm">{form.storeName || "Your Store Name"}</h3>
              {form.location && <p className="text-xs text-gray-400 flex items-center justify-center gap-1 mt-1"><FiMapPin size={10} /> {form.location}</p>}
              <div className="flex items-center justify-center gap-1 mt-2">
                {[1,2,3,4,5].map(i => <BsStarFill key={i} size={10} className="fill-amber-400 text-amber-400" />)}
                <span className="text-[10px] text-gray-400 ml-1">New Store</span>
              </div>
            </div>
          </div>

          {/* Profile Completeness */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Profile Strength</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-gray-800">{completionScore}%</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                completionScore >= 80 ? "bg-emerald-100 text-emerald-700" :
                completionScore >= 50 ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-600"}`}>
                {completionScore >= 80 ? "Strong" : completionScore >= 50 ? "Medium" : "Weak"}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${completionScore}%`,
                  background: completionScore >= 80 ? "#10b981" : completionScore >= 50 ? "#f59e0b" : "#ef4444"
                }}
              />
            </div>
            <div className="space-y-1.5">
              {[
                { field: "storeName", label: "Store Name" },
                { field: "description", label: "Description" },
                { field: "location", label: "Location" },
                { field: "contactNo", label: "Phone" },
                { field: "image", label: "Banner/Logo" },
                { field: "moreInfo", label: "More Info" },
              ].map(({ field, label }) => (
                <div key={field} className="flex items-center gap-2 text-xs">
                  {form[field]?.trim()
                    ? <BsCheckCircle size={12} className="text-emerald-500 flex-shrink-0" />
                    : <BsExclamationCircle size={12} className="text-gray-300 flex-shrink-0" />}
                  <span className={form[field]?.trim() ? "text-gray-600" : "text-gray-300"}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
            <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <FiInfo size={11} /> Seller Tips
            </h3>
            <ul className="space-y-1.5 text-xs text-blue-600">
              {[
                "Complete profile gets 3x more visibility",
                "Add a clear store banner image",
                "Mention return policy to build trust",
                "Keep contact info updated",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <FiChevronRight size={10} className="mt-0.5 flex-shrink-0" /> {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Form */}
        <div className="lg:col-span-3">
          <form onSubmit={onSubmit}>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-5 bg-white rounded-t-2xl px-2 pt-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px mr-1 ${
                    activeTab === id
                      ? "border-[#2874f0] text-[#2874f0]"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {activeTab === "basic" && (
              <div className="bg-white rounded-b-2xl rounded-tr-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField icon={MdOutlineStore} label="Store Name" required error={errors.storeName}>
                    <input name="storeName" value={form.storeName} onChange={onChange} placeholder="e.g. TechZone Official" className={inputClass} />
                  </InputField>
                  <InputField icon={FiPhone} label="Contact Number" error={errors.contactNo}>
                    <input name="contactNo" value={form.contactNo} onChange={onChange} placeholder="10-digit mobile number" className={inputClass} maxLength={10} />
                  </InputField>
                  <InputField icon={FiMapPin} label="Store Location">
                    <input name="location" value={form.location} onChange={onChange} placeholder="e.g. Mumbai, Maharashtra" className={inputClass} />
                  </InputField>
                  <InputField icon={FiImage} label="Banner / Logo URL">
                    <input name="image" value={form.image} onChange={onChange} placeholder="https://..." className={inputClass} />
                  </InputField>
                </div>
                <InputField icon={FiFileText} label="Store Description">
                  <textarea name="description" value={form.description} onChange={onChange} placeholder="Tell customers what you sell and what makes your store special..." className={`${inputClass} resize-none`} rows={4} />
                </InputField>
                <InputField icon={FiInfo} label="Additional Information">
                  <textarea name="moreInfo" value={form.moreInfo} onChange={onChange} placeholder="Any extra details, highlights, or customer guarantees..." className={`${inputClass} resize-none`} rows={3} />
                </InputField>
              </div>
            )}

            {activeTab === "policies" && (
              <div className="bg-white rounded-b-2xl rounded-tr-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField icon={TbRefresh} label="Return Policy">
                    <input name="returnPolicy" value={form.returnPolicy} onChange={onChange} placeholder="e.g. 7-day easy return" className={inputClass} />
                  </InputField>
                  <InputField icon={TbTruckDelivery} label="Shipping Time">
                    <input name="shippingTime" value={form.shippingTime} onChange={onChange} placeholder="e.g. 3-5 business days" className={inputClass} />
                  </InputField>
                  <InputField icon={FiClock} label="Support Hours">
                    <input name="openHours" value={form.openHours} onChange={onChange} placeholder="e.g. Mon-Sat, 10AM – 6PM" className={inputClass} />
                  </InputField>
                  <InputField icon={FiInfo} label="Support Email" error={errors.supportEmail}>
                    <input name="supportEmail" value={form.supportEmail} onChange={onChange} placeholder="support@yourstore.com" className={inputClass} />
                  </InputField>
                </div>
                <InputField icon={MdOutlineShield} label="Policies & Guarantees">
                  <textarea name="moreInfo" value={form.moreInfo} onChange={onChange} placeholder="Describe your warranty, policies, or service guarantees in detail..." className={`${inputClass} resize-none`} rows={5} />
                </InputField>

                {/* Trust Badges Preview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {[
                    { icon: <TbRefresh size={16} />, label: form.returnPolicy || "Easy Returns", color: "text-blue-600 bg-blue-50" },
                    { icon: <TbTruckDelivery size={16} />, label: form.shippingTime || "Fast Shipping", color: "text-green-600 bg-green-50" },
                    { icon: <MdOutlineShield size={16} />, label: "Verified Seller", color: "text-purple-600 bg-purple-50" },
                    { icon: <BsStarFill size={16} />, label: "Quality Assured", color: "text-amber-600 bg-amber-50" },
                  ].map((badge, i) => (
                    <div key={i} className={`rounded-xl p-3 flex flex-col items-center gap-1.5 text-center ${badge.color}`}>
                      {badge.icon}
                      <span className="text-[11px] font-semibold leading-tight">{badge.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400">↑ These badges will appear on your public store page</p>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {saved ? (
                  <span className="flex items-center gap-1.5 text-emerald-600"><BsCheckCircle size={13} /> All changes saved</span>
                ) : (
                  "Unsaved changes"
                )}
              </p>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 bg-[#2874f0] hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-all disabled:opacity-60 shadow-sm"
              >
                {isLoading
                  ? <><CircularProgress size={16} style={{ color: "#fff" }} /> Saving...</>
                  : <><FiSave size={15} /> Save Profile</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default StoreProfile;