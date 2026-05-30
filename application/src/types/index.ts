// ─── Core Types ──────────────────────────────────────────────
export interface SlideItem {
  _id?: string;
  images?: string[];
  title?: string;
  subtitle?: string;
  badge?: string;
  link?: string;
  url?: string;
  redirectUrl?: string;
  href?: string;
  cta?: string;
}

export interface Category {
  _id: string;
  name: string;
  images?: string[];
  color?: string;
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  brand?: string;
  price: number;
  oldPrice?: number;
  image?: string;
  images?: string[];
  catId?: string;
  catName?: string;
  countInStock: number;
  rating?: number;
  isFeatured?: boolean;
  discount?: number;
  size?: string[];
  weight?: string;
  ram?: string;
  color?: string;
  soldCount?: number;
}

export interface BannerItem {
  _id?: string;
  title?: string;
  subtitle?: string;
  image?: string;
  images?: string[];
  badge?: string;
  link?: string;
  catId?: string;
  ctaText?: string;
}

export interface DualBannerData {
  leftBanner: BannerItem;
  rightBanner: BannerItem;
}

export interface DealData {
  title: string;
  subtitle?: string;
  image: string;
  badge?: string;
  discount?: number;
  endTime?: string;
  ctaText?: string;
  link?: string;
}

export interface Review {
  text: string;
  author: string;
  location: string;
  avatar: string;
  rating: number;
}

export interface FAQ {
  q: string;
  a: string;
}

export interface BlogItem {
  _id?: string;
  title?: string;
  image?: string;
  description?: string;
  createdAt?: string;
}

export interface RandomCatProduct {
  catName: string;
  data: Product[];
}

// ─── API Response Types ────────────────────────────────────────
export interface ApiResponse<T = any> {
  error?: boolean;
  success?: boolean;
  data?: T;
  message?: string;
  products?: Product[];
  totalProducts?: number;
  total?: number;
  page?: number;
  totalPages?: number;
}

// ─── Redux State Types ────────────────────────────────────────
export interface AppState {
  isLogin: boolean;
  userData: UserData | null;
  catData: Category[];
  cartData: CartItem[];
  myListData: Product[];
}

export interface UserData {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface CartItem {
  _id: string;
  productTitle: string;
  image: string;
  rating: number;
  price: number;
  oldPrice?: number;
  quantity: number;
  countInStock?: number;
  subTotal?: number;
  productId?: string;
  userId?: string;
  brand?: string;
}

// ─── Navigation Types ─────────────────────────────────────────
export type RootStackParamList = {
  Home: undefined;
  Products: { catId?: string };
  ProductDetails: { productId: string };
  Login: undefined;
  Register: undefined;
  Cart: undefined;
  MyAccount: undefined;
};
