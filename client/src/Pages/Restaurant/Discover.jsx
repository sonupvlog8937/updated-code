import { useEffect, useState } from "react";
import { getShopItems, getShopsByCity, placeRestaurantOrder } from "./api";

const DiscoverRestaurant = () => {
  const [city, setCity] = useState("delhi");
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    getShopsByCity(city).then((res) => setShops(res?.data || []));
  }, [city]);

  const loadItems = async (shop) => {
    setSelectedShop(shop);
    const res = await getShopItems(shop._id);
    setItems(res?.data || []);
  };

  const placeSampleOrder = async () => {
    if (!selectedShop || items.length === 0) return;
    const payload = {
      shopId: selectedShop._id,
      items: [{ itemId: items[0]._id, quantity: 1 }],
    };
    const result = await placeRestaurantOrder(payload);
    alert(result?.message || "Order placed");
  };

  return (
    <div className="container py-4">
      <h2>Restaurant Discovery</h2>
      <div className="my-3">
        <label>City:&nbsp;</label>
        <input value={city} onChange={(e) => setCity(e.target.value.toLowerCase())} />
      </div>

      <h5>Shops</h5>
      <div className="mb-3">
        {shops.map((shop) => (
          <button key={shop._id} className="btn btn-outline-primary btn-sm me-2 mb-2" onClick={() => loadItems(shop)}>
            {shop.name}
          </button>
        ))}
      </div>

      {selectedShop && (
        <>
          <h5>{selectedShop.name} Items</h5>
          <ul>
            {items.map((item) => (
              <li key={item._id}>
                {item.name} - ₹{item.price}
              </li>
            ))}
          </ul>
          <button className="btn btn-success btn-sm" onClick={placeSampleOrder}>
            Place Quick Order
          </button>
        </>
      )}
    </div>
  );
};

export default DiscoverRestaurant;