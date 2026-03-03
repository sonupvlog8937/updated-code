import { useEffect, useState } from "react";
import { getMyRestaurantOrders } from "./api";

const statusClasses = {
  placed: "bg-secondary",
  confirmed: "bg-info",
  preparing: "bg-warning text-dark",
  out_for_delivery: "bg-primary",
  delivered: "bg-success",
  cancelled: "bg-danger",
};

const RestaurantMyOrders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    getMyRestaurantOrders().then((res) => setOrders(res?.data || []));
  }, []);

  return (
    <div className="container py-4">
       <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">My Restaurant Orders</h2>
        <span className="badge bg-dark">{orders.length} Orders</span>
      </div>

      {orders.length === 0 && <div className="alert alert-light border">No orders found yet.</div>}

      <div className="row g-3">
        {orders.map((order) => (
           <div key={order._id} className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 className="mb-1">{order?.shop?.name}</h5>
                    <small className="text-muted">Order ID: {order._id}</small>
                  </div>
                  <span className={`badge ${statusClasses[order.status] || "bg-secondary"}`}>{order.status}</span>
                </div>

                <div className="row g-2 small text-muted mb-2">
                  <div className="col-md-3">Payment: {order.paymentMethod?.toUpperCase()} ({order.paymentStatus})</div>
                  <div className="col-md-3">ETA: {order.estimatedDeliveryAt ? new Date(order.estimatedDeliveryAt).toLocaleTimeString() : "--"}</div>
                  <div className="col-md-3">Items: {order.items?.length || 0}</div>
                  <div className="col-md-3 fw-semibold text-dark">Total: ₹{order.totalAmount}</div>
                </div>

                <ul className="mb-2 small">
                  {(order.items || []).map((entry) => (
                    <li key={entry._id}>{entry?.item?.name} × {entry.quantity} - ₹{entry.price}</li>
                  ))}
                </ul>

                {order.pricing && (
                  <div className="small text-muted border-top pt-2">
                    Bill: Subtotal ₹{order.pricing.subtotal} • Discount ₹{order.pricing.itemDiscount} • Delivery ₹{order.pricing.deliveryFee} • GST ₹{order.pricing.gst}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RestaurantMyOrders;