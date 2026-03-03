import { fetchDataFromApi, postData } from "../../utils/api";

export const getShopsByCity = (city) => fetchDataFromApi(`/api/restaurant/shop/get-by-city/${city}`);
export const getShopItems = (shopId) => fetchDataFromApi(`/api/restaurant/item/get/${shopId}`);
export const placeRestaurantOrder = (payload) => postData(`/api/restaurant/order/place-order`, payload);
export const getMyRestaurantOrders = () => fetchDataFromApi(`/api/restaurant/order/my-orders`);