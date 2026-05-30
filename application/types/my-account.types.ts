export interface AddressData {
  _id: string;
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  mobile: string;
  userId: string;
  addressType: 'Home' | 'Office' | '';
  landmark: string;
}

export interface UserData {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  signUpWithGoogle: boolean;
  address_details: AddressData[];
}

export interface AppContextType {
  userData: UserData | null;
  isLogin: boolean;
  setIsLogin: (val: boolean) => void;
  setUserData: (val: UserData | null) => void;
  setCartData: (val: any[]) => void;
  setMyListData: (val: any[]) => void;
  getUserDetails: (data?: any) => void;
  alertBox: (type: 'success' | 'error', message: string) => void;
  openAddressPanel: boolean;
  setOpenAddressPanel: (val: boolean) => void;
  addressMode: 'add' | 'edit';
  setAddressMode: (val: 'add' | 'edit') => void;
  addressId: string;
  setAddressId: (val: string) => void;
}

export interface AddressFormFields {
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  mobile: string;
  userId: string;
  addressType: 'Home' | 'Office' | '';
  landmark: string;
}

export interface ProfileFormFields {
  name: string;
  email: string;
  mobile: string;
}

export interface ChangePasswordFields {
  email: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface DeleteAccountForm {
  email: string;
  password: string;
  confirmText: string;
}