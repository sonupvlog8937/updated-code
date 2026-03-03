import { useEffect, useState } from "react";
import { getMyRestaurantOrders } from "./api";

const RestaurantMyOrders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    getMyRestaurantOrders().then((res) => setOrders(res?.data || []));
  }, []);

  return (
    <div className="container py-4">
      <h2>My Restaurant Orders</h2>
      <ul>
        {orders.map((order) => (
          <li key={order._id}>
            {order?.shop?.name} | ₹{order.totalAmount} | {order.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RestaurantMyOrders;