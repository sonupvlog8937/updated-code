import React, { useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteData, editData, fetchDataFromApi, postData } from "../../utils/api";
import { MyContext } from "../../App";
import {
  MdStorefront, MdPeople, MdShoppingCart, MdRestaurant,
  MdInventory, MdMenuBook, MdFastfood, MdAdd, MdEdit,
  MdDelete, MdSearch, MdClose, MdRefresh, MdChevronLeft,
  MdChevronRight, MdSave, MdCheck, MdWarning, MdCategory
} from "react-icons/md";

/* ─── Config ────────────────────────────────────────────────────── */
const configs = {
  markets: {
    title: "Markets",
    subtitle: "Manage marketplace locations",
    icon: MdStorefront,
    color: "#6366f1",
    endpoint: "/api/go-market/markets",
    tableColumns: ["name", "city", "latitude", "longitude"],
    fields: [
      { key: "name",      label: "Market Name",  type: "text",   required: true },
      { key: "city",      label: "City",         type: "text",   required: true },
      { key: "state",     label: "State",        type: "text",   required: true },
      { key: "pincode",   label: "Pincode",      type: "text" },
      { key: "latitude",  label: "Latitude",     type: "number" },
      { key: "longitude", label: "Longitude",    type: "number" },
      { key: "banner",    label: "Banner URL",   type: "url" },
      { key: "status",    label: "Status",       type: "select", options: ["active", "inactive"] },
    ],
  },
  owners: {
    title: "Shop Owners",
    subtitle: "Manage vendor accounts",
    icon: MdPeople,
    color: "#f59e0b",
    endpoint: "/api/go-market/owners",
    fields: [
      { key: "name",   label: "Full Name",    type: "text",   required: true },
      { key: "email",  label: "Email",        type: "email",  required: true },
      { key: "mobile", label: "Mobile",       type: "tel",    required: true },
      { key: "avatar", label: "Avatar URL",   type: "url" },
      { key: "rating", label: "Rating",       type: "number" },
    ],
  },

  categories: {
    title: "Go Market Categories",
    subtitle: "Admin only — sellers select these when adding products",
    icon: MdCategory,
    color: "#14b8a6",
    endpoint: "/api/go-market/categories",
    fields: [
      { key: "type", label: "Category Type", type: "select", options: ["grocery", "restaurant", "fashion", "electronics", "medical", "beauty", "home_kitchen", "gifts_toys", "books_stationery", "jewellery", "hardware", "automobile"], required: true },
      { key: "name", label: "Category Name", type: "text", required: true },
      { key: "image", label: "Image URL", type: "url" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: ["active", "inactive"] },
    ],
  },
  subcategories: {
    title: "Go Market Sub Categories",
    subtitle: "Admin only — linked to a parent category",
    icon: MdCategory,
    color: "#0d9488",
    endpoint: "/api/go-market/subcategories",
    tableColumns: ["name", "categoryId", "status"],
    fields: [
      { key: "type", label: "Category Type", type: "select", options: ["grocery", "restaurant", "fashion", "electronics", "medical", "beauty", "home_kitchen", "gifts_toys", "books_stationery", "jewellery", "hardware", "automobile"], required: true },
      { key: "categoryId", label: "Parent Category", type: "categorySelect", required: true },
      { key: "name", label: "Sub Category Name", type: "text", required: true },
      { key: "image", label: "Image URL", type: "url" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: ["active", "inactive"] },
    ],
  },
  subsubcategories: {
    title: "Go Market Sub Sub Categories",
    subtitle: "Admin only — linked to a parent subcategory",
    icon: MdCategory,
    color: "#0f766e",
    endpoint: "/api/go-market/subsubcategories",
    tableColumns: ["name", "categoryId", "subCategoryId", "status"],
    fields: [
      { key: "type", label: "Category Type", type: "select", options: ["grocery", "restaurant", "fashion", "electronics", "medical", "beauty", "home_kitchen", "gifts_toys", "books_stationery", "jewellery", "hardware", "automobile"], required: true },
      { key: "categoryId", label: "Parent Category", type: "categorySelect", required: true },
      { key: "subCategoryId", label: "Parent Sub Category", type: "subcategorySelect", required: true },
      { key: "name", label: "Sub Sub Category Name", type: "text", required: true },
      { key: "image", label: "Image URL", type: "url" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: ["active", "inactive"] },
    ],
  },
  "grocery-shops": {
    title: "Grocery Shops",
    subtitle: "Manage grocery store listings",
    icon: MdShoppingCart,
    color: "#10b981",
    endpoint: "/api/go-market/grocery-shops",
    tableColumns: ["shopName", "address", "latitude", "longitude"],
    fields: [
      { key: "marketId",      label: "Market",         type: "marketSelect",     required: true },
      { key: "ownerId",       label: "Owner",          type: "ownerSelect",     required: true },
      { key: "shopName",      label: "Shop Name",      type: "text",     required: true },
      { key: "shopBanner",    label: "Banner URL",     type: "url" },
      { key: "shopLogo",      label: "Logo URL",       type: "url" },
      { key: "address",       label: "Address",        type: "text" },
      { key: "latitude",      label: "Latitude",       type: "number" },
      { key: "longitude",     label: "Longitude",      type: "number" },
      { key: "deliveryMinutes", label: "Delivery Minutes", type: "number" },
      { key: "rating",        label: "Rating",         type: "number" },
      { key: "totalProducts", label: "Total Products", type: "number" },
      { key: "description",   label: "Description",    type: "textarea" },
      { key: "isOpen",        label: "Is Open",        type: "toggle" },
    ],
  },
  restaurants: {
    title: "Restaurants",
    subtitle: "Manage restaurant listings",
    icon: MdRestaurant,
    color: "#ef4444",
    endpoint: "/api/go-market/restaurants",
    tableColumns: ["restaurantName", "address", "latitude", "longitude"],
    fields: [
      { key: "marketId",        label: "Market",        type: "marketSelect",     required: true },
      { key: "ownerId",         label: "Owner",         type: "ownerSelect",     required: true },
      { key: "restaurantName",  label: "Name",          type: "text",     required: true },
      { key: "restaurantBanner",label: "Banner URL",    type: "url" },
      { key: "restaurantLogo",  label: "Logo URL",      type: "url" },
      { key: "address",         label: "Address",       type: "text" },
      { key: "latitude",        label: "Latitude",      type: "number" },
      { key: "longitude",       label: "Longitude",     type: "number" },
      { key: "deliveryMinutes", label: "Delivery Minutes", type: "number" },
      { key: "rating",          label: "Rating",        type: "number" },
      { key: "totalMenus",      label: "Total Menus",   type: "number" },
      { key: "totalItems",      label: "Total Items",   type: "number" },
      { key: "description",     label: "Description",   type: "textarea" },
      { key: "isOpen",          label: "Is Open",       type: "toggle" },
    ],
  },
  products: {
    title: "Grocery Products",
    subtitle: "Manage product catalog",
    icon: MdInventory,
    color: "#3b82f6",
    endpoint: "/api/go-market/products",
    fields: [
      { key: "shopId",        label: "Shop ID",       type: "text",   required: true },
      { key: "name",          label: "Product Name",  type: "text",   required: true },
      { key: "image",         label: "Image URL",     type: "url" },
      { key: "categoryId",    label: "Category ID",  type: "text" },
      { key: "price",         label: "Price",         type: "number", required: true },
      { key: "discountPrice", label: "Discount Price",type: "number" },
      { key: "stock",         label: "Stock",         type: "number" },
      { key: "description",   label: "Description",   type: "textarea" },
    ],
  },
  menus: {
    title: "Menus",
    subtitle: "Manage restaurant menus",
    icon: MdMenuBook,
    color: "#8b5cf6",
    endpoint: "/api/go-market/menus",
    fields: [
      { key: "restaurantId", label: "Restaurant ID", type: "text",     required: true },
      { key: "menuName",     label: "Menu Name",     type: "text",     required: true },
      { key: "image",        label: "Image URL",     type: "url" },
      { key: "description",  label: "Description",   type: "textarea" },
    ],
  },
  items: {
    title: "Restaurant Items",
    subtitle: "Manage food items",
    icon: MdFastfood,
    color: "#f97316",
    endpoint: "/api/go-market/items",
    fields: [
      { key: "restaurantId", label: "Restaurant ID", type: "text",   required: true },
      { key: "menuId",       label: "Menu ID",       type: "text",   required: true },
      { key: "itemName",     label: "Item Name",     type: "text",   required: true },
      { key: "image",        label: "Image URL",     type: "url" },
      { key: "categoryId",   label: "Category ID",  type: "text" },
      { key: "price",        label: "Price",         type: "number", required: true },
      { key: "description",  label: "Description",   type: "textarea" },
    ],
  },
};

const blankFor = (fields) =>
  fields.reduce((acc, f) => ({
    ...acc,
    [f.key]: f.type === "toggle" ? true : f.type === "select" ? (f.options?.[0] ?? "") : "",
  }), {});

/* ─── Field Input ───────────────────────────────────────────────── */
const FieldInput = ({ field, value, onChange, parentCategoryOptions = [], parentSubcategories = [], filteredSubcategories = [], filteredCategories = [], marketOptions = [], ownerOptions = [], form = {} }) => {
  const base =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white placeholder:text-gray-300";

  if (field.type === "toggle") {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400/40 ${
          value ? "bg-emerald-500" : "bg-gray-200"
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    );
  }
  if (field.type === "marketSelect") {
    return (
      <select className={base} value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={field.required}>
        <option value="">Select market</option>
        {marketOptions.map((market) => (
          <option key={market._id} value={market._id}>
            {market.name} ({market.city})
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "ownerSelect") {
    return (
      <select className={base} value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={field.required}>
        <option value="">Select owner</option>
        {ownerOptions.map((owner) => (
          <option key={owner._id} value={owner._id}>
            {owner.name} ({owner.email})
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "categorySelect") {
    const optionsToUse = form.type ? filteredCategories : [];
    return (
      <select
        className={base}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        disabled={!form.type}
      >
        <option value="">Select parent category</option>
        {optionsToUse.map((cat) => (
          <option key={cat._id} value={cat._id}>
            {cat.name}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "subcategorySelect") {
    const optionsToUse = form.categoryId ? filteredSubcategories : [];
    return (
      <select
        className={base}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        disabled={!form.categoryId}
      >
        <option value="">Select parent sub category</option>
        {optionsToUse.map((sub) => (
          <option key={sub._id} value={sub._id}>
            {sub.name}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "parentCategory") {
    const selectedValue = value && typeof value === "object"
      ? JSON.stringify({ id: value.id, model: value.model, type: value.type })
      : value ?? "";

    return (
      <select
        className={base}
        value={selectedValue}
        onChange={(e) => {
          const raw = e.target.value;
          if (!raw) return onChange("");
          try {
            const parsed = JSON.parse(raw);
            return onChange(parsed);
          } catch {
            return onChange(raw);
          }
        }}
      >
        <option value="">Select parent category</option>
        {parentCategoryOptions.map((cat) => {
          const isSubcategory = Boolean(cat.parentId);
          const model = cat.parentModel || (isSubcategory ? "GoMarketSubCategory" : "GoMarketCategory");
          const optionValue = JSON.stringify({ id: cat._id, model, type: cat.type });
          return (
            <option key={`${cat._id}-${model}`} value={optionValue}>
              {isSubcategory ? "Subcategory" : "Category"}: {cat.name}
            </option>
          );
        })}
      </select>
    );
  }
  if (field.type === "select") {
    return (
      <select className={base} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {field.options.map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
      </select>
    );
  }
  if (field.type === "textarea") {
    return (
      <textarea
        className={`${base} resize-none`}
        rows={2}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${field.label.toLowerCase()}…`}
      />
    );
  }
  return (
    <input
      type={field.type}
      className={base}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`Enter ${field.label.toLowerCase()}…`}
    />
  );
};

/* ─── Delete Confirm Modal ───────────────────────────────────────── */
const DeleteModal = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-fade-in">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
        <MdWarning className="text-red-500 text-2xl" />
      </div>
      <h3 className="text-center text-[15px] font-bold text-gray-800 mb-1">Delete Record</h3>
      <p className="text-center text-sm text-gray-500 mb-5">This action cannot be undone. Are you sure?</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancel</button>
        <button onClick={onConfirm} className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition">Delete</button>
      </div>
    </div>
  </div>
);

/* ─── Main Page ──────────────────────────────────────────────────── */
const GoMarketAdminPage = () => {
  const { resource = "markets" } = useParams();
  const navigate = useNavigate();
  const config = configs[resource] || configs.markets;
  const Icon = config.icon;
  const context = useContext(MyContext);
  const userRole = context?.userData?.role || "";
  
  // Map seller role to category type
  const getRoleCategoryType = (role) => {
    const mapping = {
      GROCERY_SELLER: "grocery",
      RESTAURANT_SELLER: "restaurant",
      FASHION_SELLER: "fashion",
      ELECTRONICS_SELLER: "electronics",
      MEDICAL_SELLER: "medical",
      BEAUTY_SELLER: "beauty",
      HOME_KITCHEN_SELLER: "home_kitchen",
      GIFTS_TOYS_SELLER: "gifts_toys",
      BOOKS_STATIONERY_SELLER: "books_stationery",
      JEWELLERY_SELLER: "jewellery",
      HARDWARE_SELLER: "hardware",
      AUTOMOBILE_SELLER: "automobile",
    };
    return mapping[role] || "";
  };
  
  const sellerCategoryType = getRoleCategoryType(userRole);
  const isSpecialtySeller = Boolean(sellerCategoryType);

  useEffect(() => {
    if (isSpecialtySeller && (resource === "categories" || resource === "subcategories")) {
      navigate("/products", { replace: true });
    }
  }, [isSpecialtySeller, resource, navigate]);

  const [rows, setRows] = useState([]);
  const [parentCategories, setParentCategories] = useState([]);
  const [parentSubcategories, setParentSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [owners, setOwners] = useState([]);
  const [form, setForm] = useState(blankFor(config.fields));
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    setForm({ ...blankFor(config.fields), parentModel: "GoMarketCategory" });
    setEditingId(null);
    setPage(1);
    setFormOpen(false);
    setSearch("");
  }, [resource]);

  const load = useCallback(async () => {
    setLoading(true);
    let url = `${config.endpoint}?page=${page}&limit=10&search=${encodeURIComponent(search)}`;
    if (sellerCategoryType && (resource === "categories" || resource === "subcategories")) {
      url += `&type=${sellerCategoryType}`;
    }
    const res = await fetchDataFromApi(url);
    setRows(res?.data || []);
    setPagination(res?.pagination || null);
    setLoading(false);
  }, [config.endpoint, page, search, resource, sellerCategoryType]);

  useEffect(() => {
    if (resource !== "subcategories" && resource !== "subsubcategories") return;
    let url = "/api/go-market/categories?limit=100&status=active";
    if (sellerCategoryType) url += `&type=${sellerCategoryType}`;
    fetchDataFromApi(url).then((res) => setParentCategories(res?.data || []));

    let subUrl = "/api/go-market/subcategories?limit=1000&status=active";
    if (sellerCategoryType) subUrl += `&type=${sellerCategoryType}`;
    fetchDataFromApi(subUrl).then((res) => setParentSubcategories(res?.data || []));
  }, [resource, sellerCategoryType]);

  // Filter categories based on selected type
  useEffect(() => {
    if ((resource === "subcategories" || resource === "subsubcategories") && form.type) {
      const filtered = parentCategories.filter(cat => cat.type === form.type);
      setFilteredCategories(filtered);
      if (form.categoryId && !filtered.some((cat) => String(cat._id) === String(form.categoryId))) {
        setForm((prev) => ({ ...prev, categoryId: "", subCategoryId: "" }));
      }
    } else {
      setFilteredCategories(parentCategories);
    }
  }, [form.type, form.categoryId, parentCategories, resource]);

  // Filter subcategories based on selected category
  useEffect(() => {
    if (resource === "subsubcategories" && form.categoryId) {
      const filtered = parentSubcategories.filter(sub => 
        String(sub.categoryId) === String(form.categoryId) || String(sub.parentId) === String(form.categoryId)
      );
      setFilteredSubcategories(filtered);
      if (form.subCategoryId && !filtered.some((sub) => String(sub._id) === String(form.subCategoryId))) {
        setForm((prev) => ({ ...prev, subCategoryId: "" }));
      }
    } else {
      setFilteredSubcategories(parentSubcategories);
    }
  }, [form.categoryId, form.subCategoryId, parentSubcategories, resource]);

  useEffect(() => {
    if (resource !== "grocery-shops" && resource !== "restaurants") return;
    fetchDataFromApi("/api/go-market/markets?limit=100&status=active").then((res) => 
      setMarkets(res?.data || [])
    );
    fetchDataFromApi("/api/go-market/owners?limit=100").then((res) => 
      setOwners(res?.data || [])
    );
  }, [resource]);

  useEffect(() => { load(); }, [resource, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => {
        let value = v === "true" ? true : v === "false" ? false : v;
        if (k === "parentId" && value && typeof value === "object") {
          value = value.id;
        }
        return [k, value];
      })
    );
    if (sellerCategoryType && resource === "categories") {
      payload.type = sellerCategoryType;
    }
    if (resource === "subcategories" && sellerCategoryType) {
      payload.type = sellerCategoryType;
    }
    // For subcategories, map categoryId to parentId for backend compatibility
    if (resource === "subcategories") {
      if (payload.categoryId) {
        payload.parentId = payload.categoryId;
        // Keep categoryId as well for sub-sub-category filtering
      }
      payload.parentModel = "GoMarketCategory";
    }
    // For subsubcategories, ensure both categoryId and subCategoryId are set
    if (resource === "subsubcategories") {
      if (!payload.categoryId || !payload.subCategoryId) {
        toast.error("Please select both parent category and sub category");
        setSaving(false);
        return;
      }
    }
    const res = editingId
      ? await editData(`${config.endpoint}/${editingId}`, payload)
      : await postData(config.endpoint, payload);
    setSaving(false);
    if (res?.data?.error || res?.error) {
      toast.error(res?.message || "Save failed");
    } else {
      toast.success(res?.message || (editingId ? "Record updated" : "Record created"));
      setForm({ ...blankFor(config.fields), parentModel: "GoMarketCategory" });
      setEditingId(null);
      setFormOpen(false);
      load();
    }
  };

  const edit = (row) => {
    setEditingId(row._id);
    const formValues = Object.fromEntries(
      config.fields.map((f) => [f.key, (row[f.key]?._id ?? row[f.key]) ?? ""])
    );
    // For subcategories, ensure categoryId is set from parentId if not present
    if (resource === "subcategories" && row.parentId && !formValues.categoryId) {
      formValues.categoryId = row.parentId._id || row.parentId;
    }
    setForm({
      ...formValues,
      parentModel: row.parentModel || "GoMarketCategory",
    });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(blankFor(config.fields));
    setFormOpen(false);
  };

  const confirmDelete = async () => {
    await deleteData(`${config.endpoint}/${deleteTarget}`);
    toast.success("Record deleted");
    setDeleteTarget(null);
    load();
  };

  const visibleFields = useMemo(() => config.fields, [config.fields]);

  const displayColumns = useMemo(
    () => config.tableColumns
      ? visibleFields.filter(f => config.tableColumns.includes(f.key))
      : visibleFields.slice(0, 4),
    [visibleFields, config.tableColumns]
  );

  const getCellValue = (row, key) => {
    const v = row[key];
    if (v === null || v === undefined) return <span className="text-gray-300">—</span>;
    if (typeof v === "boolean") return v
      ? <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs"><MdCheck /> Yes</span>
      : <span className="text-gray-400 text-xs">No</span>;
    // Highlight missing/zero coordinates in red
    if ((key === "latitude" || key === "longitude") && (!v || v === 0 || v === "0")) {
      return <span className="text-red-500 font-bold text-xs">⚠ {v || "not set"}</span>;
    }
    if (key === "latitude" || key === "longitude") {
      return <span className="text-emerald-700 font-mono font-bold text-xs">📍 {v}</span>;
    }
    // For subcategories, show parent category name if populated
    if (key === "categoryId" && resource === "subcategories") {
      if (v?.name) {
        return <span className="truncate block max-w-[160px]" title={v.name}>{v.name}</span>;
      }
      if (row.parentId?.name) {
        return <span className="truncate block max-w-[160px]" title={row.parentId.name}>{row.parentId.name}</span>;
      }
    }
    // For sub-sub-categories, show parent category and subcategory names
    if (resource === "subsubcategories") {
      if (key === "categoryId" && v?.name) {
        return <span className="truncate block max-w-[160px]" title={v.name}>{v.name}</span>;
      }
      if (key === "subCategoryId" && v?.name) {
        return <span className="truncate block max-w-[160px]" title={v.name}>{v.name}</span>;
      }
    }
    const str = String(v?.name || v?.shopName || v?.restaurantName || v);
    return <span className="truncate block max-w-[160px]" title={str}>{str}</span>;
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .animate-fade-in { animation: fadeIn .18s ease; }
        .row-hover:hover { background: #f8faff; }
      `}</style>

      {deleteTarget && <DeleteModal onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}

      <div className="min-h-screen bg-[#f4f6fb] p-4 md:p-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl shadow-sm"
              style={{ background: config.color }}>
              <Icon />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Go Market Admin</p>
              <h1 className="text-xl font-bold text-gray-800 leading-tight">{config.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]" />
                <input
                  className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 w-48 transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                />
                {search && (
                  <button type="button" onClick={() => { setSearch(""); setPage(1); setTimeout(load, 0); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <MdClose size={14} />
                  </button>
                )}
              </div>
              <button type="submit" className="px-3 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition hidden sm:block">Search</button>
            </form>

            <button onClick={load} className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition text-gray-500" title="Refresh">
              <MdRefresh className={`text-[18px] ${loading ? "animate-spin" : ""}`} />
            </button>

            {!formOpen && (
              <button onClick={() => { setFormOpen(true); setEditingId(null); setForm(blankFor(config.fields)); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold shadow-sm hover:opacity-90 transition"
                style={{ background: config.color }}>
                <MdAdd className="text-[17px]" /> Add New
              </button>
            )}
          </div>
        </div>

        {/* ── Form Panel ── */}
        {formOpen && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-6 overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100"
              style={{ borderLeftColor: config.color, borderLeftWidth: 3 }}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-sm" style={{ background: config.color }}>
                  {editingId ? <MdEdit /> : <MdAdd />}
                </div>
                <span className="font-bold text-gray-700 text-sm">{editingId ? "Edit Record" : `New ${config.title.replace("Manage ", "")}`}</span>
              </div>
              <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100">
                <MdClose size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="p-5">
              {/* Get Current Location button — shown for resources that have lat/lng fields */}
              {visibleFields.some(f => f.key === "latitude") && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs font-bold text-emerald-700">📍 Location Coordinates</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">
                      Current: lat <strong>{form.latitude || "—"}</strong>, lng <strong>{form.longitude || "—"}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
                      toast.loading("Getting location…", { id: "geo" });
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setForm(f => ({
                            ...f,
                            latitude: pos.coords.latitude.toFixed(6),
                            longitude: pos.coords.longitude.toFixed(6),
                          }));
                          toast.success(`Location set: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`, { id: "geo" });
                        },
                        (err) => toast.error("Could not get location: " + err.message, { id: "geo" }),
                        { enableHighAccuracy: true, timeout: 10000 }
                      );
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                  >
                    📍 Use My Location
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-5">
                {visibleFields.map((field) => (
                  <label key={field.key} className={`flex flex-col gap-1.5 ${field.type === "textarea" ? "sm:col-span-2" : ""}`}>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                      {field.label}
                      {field.required && <span className="text-red-400 ml-0.5">*</span>}
                    </span>
                    <FieldInput
                      field={field}
                      value={form[field.key]}
                      onChange={(v) => setForm((f) => ({ ...f, [field.key]: v }))}
                      parentCategoryOptions={parentCategories}
                      parentSubcategories={parentSubcategories}
                      filteredSubcategories={filteredSubcategories}
                      filteredCategories={filteredCategories}
                      marketOptions={markets}
                      ownerOptions={owners}
                      form={form}
                    />
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-bold shadow-sm hover:opacity-90 transition disabled:opacity-60"
                  style={{ background: config.color }}>
                  <MdSave className="text-[16px]" />
                  {saving ? "Saving…" : editingId ? "Update Record" : "Create Record"}
                </button>
                <button type="button" onClick={cancelEdit}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Table ── */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-700">
              {pagination?.total != null ? `${pagination.total} records` : `${rows.length} records`}
            </p>
            <p className="text-xs text-gray-400">
              Page {pagination?.page || page} of {pagination?.totalPages || 1}
            </p>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <MdRefresh className="animate-spin text-2xl mr-2" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Icon className="text-4xl mb-2 opacity-30" />
                <p className="text-sm font-medium">No records found</p>
                <p className="text-xs mt-1 opacity-70">Try adjusting your search or add a new record</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wide text-gray-400 font-bold w-8">#</th>
                    <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wide text-gray-400 font-bold">ID</th>
                    {displayColumns.map((f) => (
                      <th key={f.key} className="text-left px-4 py-3 text-[11px] uppercase tracking-wide text-gray-400 font-bold">
                        {f.label}
                      </th>
                    ))}
                    <th className="text-right px-4 py-3 text-[11px] uppercase tracking-wide text-gray-400 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((row, idx) => (
                    <tr key={row._id} className="row-hover transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-300 font-mono">
                        {(page - 1) * 10 + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {String(row._id).slice(-6)}
                        </span>
                      </td>
                      {displayColumns.map((f) => (
                        <td key={f.key} className="px-4 py-3 text-gray-700 text-[13px]">
                          {getCellValue(row, f.key)}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => edit(row)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 text-xs font-semibold transition">
                            <MdEdit size={13} /> Edit
                          </button>
                          <button onClick={() => setDeleteTarget(row._id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 text-xs font-semibold transition">
                            <MdDelete size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Pagination ── */}
          {!loading && rows.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, pagination?.total || rows.length)} of {pagination?.total || rows.length}
              </p>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition">
                  <MdChevronLeft size={16} />
                </button>
                {Array.from({ length: pagination?.totalPages || 1 }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === (pagination?.totalPages || 1) || Math.abs(p - page) <= 1)
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - arr[i - 1] > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-gray-300 text-sm">…</span>
                    ) : (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                          p === page ? "text-white shadow-sm" : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                        }`}
                        style={p === page ? { background: config.color } : {}}>
                        {p}
                      </button>
                    )
                  )}
                <button disabled={!pagination || page >= pagination.totalPages} onClick={() => setPage(page + 1)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition">
                  <MdChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GoMarketAdminPage;