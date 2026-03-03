import { useEffect, useMemo, useState } from "react";
import { getShopItems, getShopsByCity, placeRestaurantOrder } from "./api";

const SORT_OPTIONS = [
    { label: "Recommended", value: "recommended" },
    { label: "Rating", value: "rating" },
    { label: "Fast Delivery", value: "delivery_time" },
    { label: "Budget Friendly", value: "cost_low_to_high" },
];

const ITEM_SORT_OPTIONS = [
    { label: "Recommended", value: "recommended" },
    { label: "Price: Low to High", value: "price_low_to_high" },
    { label: "Price: High to Low", value: "price_high_to_low" },
    { label: "Fast to Prepare", value: "prep_time" },
];

const DiscoverRestaurant = () => {
    const [city, setCity] = useState("delhi");
    const [cityInput, setCityInput] = useState("Delhi");
    const [shopSort, setShopSort] = useState("recommended");
    const [shopSearch, setShopSearch] = useState("");
    const [shops, setShops] = useState([]);
    const [selectedShop, setSelectedShop] = useState(null);
    const [items, setItems] = useState([]);
    const [cart, setCart] = useState({});
    const [itemSort, setItemSort] = useState("recommended");
    const [itemSearch, setItemSearch] = useState("");
    const [notes, setNotes] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("upi");
    const [isLoadingShops, setIsLoadingShops] = useState(false);
    const [isPlacing, setIsPlacing] = useState(false);

    useEffect(() => {
        const loadShops = async () => {
            setIsLoadingShops(true);
            const res = await getShopsByCity(city, { q: shopSearch, sortBy: shopSort });
            setShops(res?.data || []);
            setIsLoadingShops(false);
        };

        loadShops();
    }, [city, shopSearch, shopSort]);

    const loadItems = async (shop) => {
        setSelectedShop(shop);
        setCart({});
        const res = await getShopItems(shop._id, { sortBy: itemSort, q: itemSearch });
        setItems(res?.data || []);
    };

    useEffect(() => {
        if (!selectedShop) return;

        getShopItems(selectedShop._id, { sortBy: itemSort, q: itemSearch }).then((res) => setItems(res?.data || []));
    }, [selectedShop, itemSort, itemSearch]);

    const updateCartQty = (item, delta) => {
        setCart((prev) => {
            const current = prev[item._id] || { ...item, quantity: 0 };
            const quantity = Math.max(0, Math.min(10, current.quantity + delta));
            if (!quantity) {
                const { [item._id]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [item._id]: { ...current, quantity } };
        });
    };

    const cartItems = useMemo(() => Object.values(cart), [cart]);

    const pricing = useMemo(() => {
        const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const itemDiscount = cartItems.reduce(
            (sum, item) => sum + ((item.discountPercent || 0) * item.price * item.quantity) / 100,
            0
        );
        const discountedSubtotal = Math.max(subtotal - itemDiscount, 0);
        const deliveryFee = discountedSubtotal >= 399 ? 0 : selectedShop?.deliveryFee || 0;
        const platformFee = discountedSubtotal > 0 ? 6 : 0;
        const gst = discountedSubtotal * 0.05;
        const total = discountedSubtotal + deliveryFee + platformFee + gst;

        return { subtotal, itemDiscount, deliveryFee, platformFee, gst, total };
    }, [cartItems, selectedShop]);

    const placeOrder = async () => {
        if (!selectedShop || cartItems.length === 0) return;

        setIsPlacing(true);
        const payload = {
            shopId: selectedShop._id,
            paymentMethod,
            notes,
            items: cartItems.map((item) => ({ itemId: item._id, quantity: item.quantity })),
        };
        const result = await placeRestaurantOrder(payload);
        alert(result?.message || "Order placed");
        if (result?.success) {
            setCart({});
            setNotes("");
        }
        setIsPlacing(false);
    };

    const isMinOrderMet = pricing.subtotal - pricing.itemDiscount >= (selectedShop?.minOrderAmount || 0);

    return (
        <div className="container py-4">
            <div className="p-4 rounded-4 bg-dark text-white mb-4">
                <h2 className="mb-2">Discover restaurants near you</h2>
                <p className="mb-3 text-light">Premium food ordering experience inspired by top commerce and quick-delivery apps.</p>
                <div className="row g-2 align-items-center">
                    <div className="col-md-4">
                        <input
                            className="form-control"
                            placeholder="Enter city"
                            value={cityInput}
                            onChange={(e) => setCityInput(e.target.value)}
                        />
                    </div>
                    <div className="col-md-2">
                        <button className="btn btn-warning w-100" onClick={() => setCity(cityInput.toLowerCase().trim())}>
                            Update City
                        </button>
                    </div>
                    <div className="col-md-3">
                        <input
                            className="form-control"
                            placeholder="Search restaurant"
                            value={shopSearch}
                            onChange={(e) => setShopSearch(e.target.value)}
                        />
                    </div>
                    <div className="col-md-3">
                        <select className="form-select" value={shopSort} onChange={(e) => setShopSort(e.target.value)}>
                            {SORT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-lg-5">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h5 className="mb-3">Top picks in {city}</h5>
                            {isLoadingShops && <p className="text-muted mb-0">Loading restaurants...</p>}
                            {!isLoadingShops &&
                                shops.map((shop) => (
                                    <div
                                        key={shop._id}
                                        className={`border rounded-3 p-3 mb-2 ${selectedShop?._id === shop._id ? "border-primary" : ""}`}
                                    >
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <h6 className="mb-1">{shop.name}</h6>
                                                <small className="text-muted d-block">{shop.address}</small>
                                                <small className="text-muted d-block">
                                                    ⭐ {shop.rating?.toFixed?.(1) || shop.rating} • {shop.serviceability}
                                                </small>
                                                <small className="text-success">{shop.offerText}</small>
                                            </div>
                                            <button className="btn btn-sm btn-outline-primary" onClick={() => loadItems(shop)}>
                                                View Menu
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>

                <div className="col-lg-7">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0">{selectedShop ? `${selectedShop.name} Menu` : "Select a restaurant"}</h5>
                                {selectedShop && (
                                    <div className="d-flex gap-2">
                                        <input
                                            className="form-control"
                                            placeholder="Search item"
                                            value={itemSearch}
                                            onChange={(e) => setItemSearch(e.target.value)}
                                        />
                                        <select className="form-select" value={itemSort} onChange={(e) => setItemSort(e.target.value)}>
                                            {ITEM_SORT_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {selectedShop && (
                                <div className="row g-3">
                                    {items.map((item) => (
                                        <div key={item._id} className="col-md-6">
                                            <div className="border rounded-3 p-3 h-100 d-flex flex-column justify-content-between">
                                                <div>
                                                    <div className="d-flex justify-content-between">
                                                        <h6 className="mb-1">{item.name}</h6>
                                                        <span className="badge bg-light text-dark text-uppercase">{item.vegType || "veg"}</span>
                                                    </div>
                                                    <small className="text-muted d-block mb-2">{item.category || "Chef Specials"}</small>
                                                    <p className="mb-2 small text-muted">{item.description || "Freshly prepared and delivered hot."}</p>
                                                    <small className="d-block">⭐ {item.rating?.toFixed?.(1) || item.rating} • ⏱ {item.prepTimeMins || 20} mins</small>
                                                    <div className="mt-2">
                                                        <strong>₹{item.finalPrice || item.price}</strong>
                                                        {item.discountPercent > 0 && <small className="text-muted text-decoration-line-through ms-2">₹{item.price}</small>}
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center justify-content-between mt-3">
                                                    <button className="btn btn-sm btn-outline-secondary" onClick={() => updateCartQty(item, -1)}>
                                                        -
                                                    </button>
                                                    <span>{cart[item._id]?.quantity || 0}</span>
                                                    <button className="btn btn-sm btn-primary" onClick={() => updateCartQty(item, 1)}>
                                                        + Add
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedShop && (
                        <div className="card border-0 shadow-sm mt-4">
                            <div className="card-body">
                                <h5>Checkout</h5>
                                <small className="text-muted d-block mb-2">Minimum order: ₹{selectedShop.minOrderAmount || 0}</small>
                                <textarea
                                    className="form-control mb-2"
                                    rows="2"
                                    value={notes}
                                    placeholder="Delivery instructions (e.g., less spicy)"
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                                <select className="form-select mb-3" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                    <option value="upi">UPI</option>
                                    <option value="card">Card</option>
                                    <option value="wallet">Wallet</option>
                                    <option value="cod">Cash on Delivery</option>
                                </select>

                                <div className="small mb-3">
                                    <div className="d-flex justify-content-between"><span>Subtotal</span><span>₹{pricing.subtotal.toFixed(2)}</span></div>
                                    <div className="d-flex justify-content-between"><span>Discount</span><span>- ₹{pricing.itemDiscount.toFixed(2)}</span></div>
                                    <div className="d-flex justify-content-between"><span>Delivery Fee</span><span>₹{pricing.deliveryFee.toFixed(2)}</span></div>
                                    <div className="d-flex justify-content-between"><span>Platform Fee</span><span>₹{pricing.platformFee.toFixed(2)}</span></div>
                                    <div className="d-flex justify-content-between"><span>GST</span><span>₹{pricing.gst.toFixed(2)}</span></div>
                                    <div className="d-flex justify-content-between fw-bold mt-1"><span>Total</span><span>₹{pricing.total.toFixed(2)}</span></div>
                                </div>

                                {!isMinOrderMet && <p className="text-danger small mb-2">Please add more items to reach minimum order amount.</p>}

                                <button className="btn btn-success w-100" onClick={placeOrder} disabled={!cartItems.length || !isMinOrderMet || isPlacing}>
                                    {isPlacing ? "Placing order..." : `Place Order (${cartItems.length} items)`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiscoverRestaurant;