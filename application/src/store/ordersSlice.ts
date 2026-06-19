import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchDataFromApi, postData } from "@/src/utils/api";

export interface OrderProduct {
  _id?: string;
  productTitle: string;
  image?: string;
  size?: string;
  color?: string;
  weight?: string;
  ram?: string;
  quantity: number;
  price: number;
  subTotal?: number;
}

export interface DeliveryAddress {
  address_line1?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  mobile?: string;
  addressType?: string;
}

export interface ReturnRequest {
  requested?: boolean;
  requestedAt?: string;
  reason?: string;
  status?: string;
}

export interface RefundRequest {
  requested?: boolean;
  requestedAt?: string;
  reason?: string;
  status?: string;
}

export interface Order {
  _id: string;
  order_status: string;
  createdAt: string;
  updatedAt?: string;
  products: OrderProduct[];
  totalAmt: number;
  delivery_address?: DeliveryAddress;
  userId?: {
    _id?: string;
    name?: string;
    email?: string;
  };
  paymentId?: string;
  paymentMethod?: string;
  discount_amount?: number;
  shipping_charge?: number;
  returnRequest?: ReturnRequest;
  refundRequest?: RefundRequest;
  trackingId?: string;
  notes?: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out for delivery"
  | "delivered"
  | "cancelled"
  | "refunded";

export type SortOption = "newest" | "oldest" | "highestPrice" | "lowestPrice";

export interface OrdersState {
  orders: Order[];
  filteredOrders: Order[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  page: number;
  limit: number;
  totalCount: number;
  hasMore: boolean;
  
  // Filters & Sorting
  selectedStatus: OrderStatus | "all";
  sortBy: SortOption;
  searchQuery: string;
  dateRange: {
    from: string | null;
    to: string | null;
  };
  
  // Single order detail
  selectedOrder: Order | null;
  loadingOrderDetail: boolean;
  
  // Return requests
  returningOrderId: string | null;
  returnLoading: boolean;
  
  // Refund requests
  refundingOrderId: string | null;
  refundLoading: boolean;
}

const initialState: OrdersState = {
  orders: [],
  filteredOrders: [],
  loading: false,
  loadingMore: false,
  error: null,
  page: 1,
  limit: 10,
  totalCount: 0,
  hasMore: true,
  
  selectedStatus: "all",
  sortBy: "newest",
  searchQuery: "",
  dateRange: {
    from: null,
    to: null,
  },
  
  selectedOrder: null,
  loadingOrderDetail: false,
  
  returningOrderId: null,
  returnLoading: false,
  
  refundingOrderId: null,
  refundLoading: false,
};

// Async Thunks
export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (
    { page = 1, limit = 10 }: { page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      console.log(`📦 Fetching orders - page: ${page}, limit: ${limit}`);
      const res = await fetchDataFromApi(
        `/api/order/order-list/orders?page=${page}&limit=${limit}`
      );

      console.log("📦 Orders API Response:", JSON.stringify(res, null, 2));

      if (res?.error === false || res?.success === true) {
        const orders = res?.data || [];
        const totalCount = res?.totalCount || res?.total || 0;
        
        console.log(`✅ Orders fetched successfully: ${orders.length} orders, total: ${totalCount}`);
        console.log(`📋 Response keys:`, Object.keys(res));
        console.log(`📋 Total variations check:`, {
          totalCount: res?.totalCount,
          total: res?.total,
          count: res?.count,
          totalPages: res?.totalPages
        });
        
        return {
          orders,
          totalCount,
          page,
        };
      } else {
        console.error("❌ Orders fetch failed:", res?.message);
        return rejectWithValue(res?.message || "Failed to fetch orders");
      }
    } catch (error: any) {
      console.error("❌ Orders fetch error:", error);
      return rejectWithValue(error?.message || "Error fetching orders");
    }
  }
);

export const fetchOrderDetail = createAsyncThunk(
  "orders/fetchOrderDetail",
  async (orderId: string, { rejectWithValue }) => {
    try {
      const res = await fetchDataFromApi(`/api/order/${orderId}`);

      if (res?.error === false || res?.success === true) {
        return res?.order || res?.data;
      } else {
        return rejectWithValue(res?.message || "Failed to fetch order");
      }
    } catch (error: any) {
      return rejectWithValue(error?.message || "Error fetching order");
    }
  }
);

export const submitReturnRequest = createAsyncThunk(
  "orders/submitReturnRequest",
  async (
    { orderId, reason }: { orderId: string; reason: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await postData(`/api/order/return-request/${orderId}`, {
        reason,
      });

      if (res?.error === false) {
        return { orderId, status: res?.status || "requested" };
      } else {
        return rejectWithValue(res?.message || "Failed to submit return request");
      }
    } catch (error: any) {
      return rejectWithValue(error?.message || "Error submitting return request");
    }
  }
);

export const submitRefundRequest = createAsyncThunk(
  "orders/submitRefundRequest",
  async (
    { orderId, reason }: { orderId: string; reason: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await postData(`/api/order/refund-request/${orderId}`, {
        reason,
      });

      if (res?.error === false) {
        return { orderId, status: res?.status || "requested" };
      } else {
        return rejectWithValue(res?.message || "Failed to submit refund request");
      }
    } catch (error: any) {
      return rejectWithValue(error?.message || "Error submitting refund request");
    }
  }
);

export const cancelOrder = createAsyncThunk(
  "orders/cancelOrder",
  async (
    { orderId, reason }: { orderId: string; reason?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await postData(`/api/order/cancel/${orderId}`, { reason });

      if (res?.error === false) {
        return orderId;
      } else {
        return rejectWithValue(res?.message || "Failed to cancel order");
      }
    } catch (error: any) {
      return rejectWithValue(error?.message || "Error cancelling order");
    }
  }
);

// Slice
const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    // Filter & Sort Actions
    setSelectedStatus: (state, action) => {
      state.selectedStatus = action.payload;
      state.page = 1;
      ordersSlice.caseReducers.applyFilters(state);
    },

    setSortBy: (state, action) => {
      state.sortBy = action.payload;
      ordersSlice.caseReducers.applyFilters(state);
    },

    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.page = 1;
      ordersSlice.caseReducers.applyFilters(state);
    },

    setDateRange: (state, action) => {
      state.dateRange = action.payload;
      state.page = 1;
      ordersSlice.caseReducers.applyFilters(state);
    },

    resetFilters: (state) => {
      state.selectedStatus = "all";
      state.sortBy = "newest";
      state.searchQuery = "";
      state.dateRange = { from: null, to: null };
      state.page = 1;
      ordersSlice.caseReducers.applyFilters(state);
    },

    applyFilters: (state) => {
      let filtered = [...state.orders];

      // Filter by status
      if (state.selectedStatus !== "all") {
        filtered = filtered.filter(
          (order) =>
            order.order_status?.toLowerCase() === state.selectedStatus.toLowerCase()
        );
      }

      // Filter by search query (order ID, product name, address)
      if (state.searchQuery.trim()) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(
          (order) =>
            order._id?.toLowerCase().includes(query) ||
            order.products?.some((p) =>
              p.productTitle?.toLowerCase().includes(query)
            ) ||
            order.delivery_address?.address_line1
              ?.toLowerCase()
              .includes(query) ||
            order.delivery_address?.city?.toLowerCase().includes(query)
        );
      }

      // Filter by date range
      if (state.dateRange.from || state.dateRange.to) {
        filtered = filtered.filter((order) => {
          const orderDate = new Date(order.createdAt).getTime();
          const fromDate = state.dateRange.from
            ? new Date(state.dateRange.from).getTime()
            : 0;
          const toDate = state.dateRange.to
            ? new Date(state.dateRange.to).getTime()
            : Date.now();

          return orderDate >= fromDate && orderDate <= toDate;
        });
      }

      // Apply sorting
      switch (state.sortBy) {
        case "newest":
          filtered.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          );
          break;
        case "oldest":
          filtered.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()
          );
          break;
        case "highestPrice":
          filtered.sort((a, b) => b.totalAmt - a.totalAmt);
          break;
        case "lowestPrice":
          filtered.sort((a, b) => a.totalAmt - b.totalAmt);
          break;
      }

      state.filteredOrders = filtered;
    },

    setSelectedOrder: (state, action) => {
      state.selectedOrder = action.payload;
    },

    clearOrders: (state) => {
      state.orders = [];
      state.filteredOrders = [];
      state.page = 1;
      state.totalCount = 0;
      state.hasMore = true;
    },
  },

  extraReducers: (builder) => {
    // fetchOrders
    builder
      .addCase(fetchOrders.pending, (state, action) => {
        if (action.meta.arg?.page === 1) {
          state.loading = true;
        } else {
          state.loadingMore = true;
        }
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        const { orders, totalCount, page } = action.payload;

        console.log(`✅ Redux: Received ${orders.length} orders for page ${page}`);

        if (page === 1) {
          // Replace orders on first page
          state.orders = orders;
          console.log("📝 Redux: Replaced orders (page 1)");
        } else {
          // Append orders for pagination, avoid duplicates
          const existingIds = new Set(state.orders.map(o => o._id));
          const newOrders = orders.filter((o: Order) => !existingIds.has(o._id));
          state.orders = [...state.orders, ...newOrders];
          console.log(`📝 Redux: Appended ${newOrders.length} new orders`);
        }

        state.totalCount = totalCount;
        state.hasMore = state.orders.length < totalCount;
        state.page = page;
        state.loading = false;
        state.loadingMore = false;

        console.log(`📊 Redux State: ${state.orders.length}/${totalCount} orders, hasMore: ${state.hasMore}`);

        // Apply filters after loading
        ordersSlice.caseReducers.applyFilters(state);
        
        console.log(`🔍 After filters: ${state.filteredOrders.length} filtered orders`);
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload as string;
      });

    // fetchOrderDetail
    builder
      .addCase(fetchOrderDetail.pending, (state) => {
        state.loadingOrderDetail = true;
        state.error = null;
      })
      .addCase(fetchOrderDetail.fulfilled, (state, action) => {
        state.selectedOrder = action.payload;
        state.loadingOrderDetail = false;
      })
      .addCase(fetchOrderDetail.rejected, (state, action) => {
        state.loadingOrderDetail = false;
        state.error = action.payload as string;
      });

    // submitReturnRequest
    builder
      .addCase(submitReturnRequest.pending, (state, action) => {
        state.returningOrderId = action.meta.arg.orderId;
        state.returnLoading = true;
        state.error = null;
      })
      .addCase(submitReturnRequest.fulfilled, (state, action) => {
        const { orderId } = action.payload;
        
        // Update in orders list
        const order = state.orders.find((o) => o._id === orderId);
        if (order) {
          order.returnRequest = {
            requested: true,
            requestedAt: new Date().toISOString(),
            status: "pending",
          };
        }

        // Update in filtered orders
        const filteredOrder = state.filteredOrders.find((o) => o._id === orderId);
        if (filteredOrder) {
          filteredOrder.returnRequest = {
            requested: true,
            requestedAt: new Date().toISOString(),
            status: "pending",
          };
        }

        // Update selected order
        if (state.selectedOrder?._id === orderId) {
          state.selectedOrder.returnRequest = {
            requested: true,
            requestedAt: new Date().toISOString(),
            status: "pending",
          };
        }

        state.returningOrderId = null;
        state.returnLoading = false;
      })
      .addCase(submitReturnRequest.rejected, (state, action) => {
        state.returningOrderId = null;
        state.returnLoading = false;
        state.error = action.payload as string;
      });

    // cancelOrder
    builder
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const orderId = action.payload;

        // Update in orders list
        const order = state.orders.find((o) => o._id === orderId);
        if (order) {
          order.order_status = "cancelled";
        }

        // Update in filtered orders
        const filteredOrder = state.filteredOrders.find((o) => o._id === orderId);
        if (filteredOrder) {
          filteredOrder.order_status = "cancelled";
        }

        // Update selected order
        if (state.selectedOrder?._id === orderId) {
          state.selectedOrder.order_status = "cancelled";
        }

        state.loading = false;
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // submitRefundRequest
    builder
      .addCase(submitRefundRequest.pending, (state, action) => {
        state.refundingOrderId = action.meta.arg.orderId;
        state.refundLoading = true;
        state.error = null;
      })
      .addCase(submitRefundRequest.fulfilled, (state, action) => {
        const { orderId } = action.payload;
        
        // Update in orders list
        const order = state.orders.find((o) => o._id === orderId);
        if (order) {
          order.refundRequest = {
            requested: true,
            requestedAt: new Date().toISOString(),
            status: "pending",
          };
        }

        // Update in filtered orders
        const filteredOrder = state.filteredOrders.find((o) => o._id === orderId);
        if (filteredOrder) {
          filteredOrder.refundRequest = {
            requested: true,
            requestedAt: new Date().toISOString(),
            status: "pending",
          };
        }

        // Update selected order
        if (state.selectedOrder?._id === orderId) {
          state.selectedOrder.refundRequest = {
            requested: true,
            requestedAt: new Date().toISOString(),
            status: "pending",
          };
        }

        state.refundingOrderId = null;
        state.refundLoading = false;
      })
      .addCase(submitRefundRequest.rejected, (state, action) => {
        state.refundingOrderId = null;
        state.refundLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSelectedStatus,
  setSortBy,
  setSearchQuery,
  setDateRange,
  resetFilters,
  applyFilters,
  setSelectedOrder,
  clearOrders,
} = ordersSlice.actions;

export default ordersSlice.reducer;
