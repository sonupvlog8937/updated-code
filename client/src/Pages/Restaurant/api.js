import { fetchDataFromApi, postData } from "../../utils/api";

export const getShopsByCity = (city, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchDataFromApi(`/api/restaurant/shop/get-by-city/${city}${query ? `?${query}` : ""}`);
};

export const getShopItems = (shopId, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchDataFromApi(`/api/restaurant/item/get/${shopId}${query ? `?${query}` : ""}`);
};
export const placeRestaurantOrder = (payload) => postData(`/api/restaurant/order/place-order`, payload);
export const getMyRestaurantOrders = () => fetchDataFromApi(`/api/restaurant/order/my-orders`);