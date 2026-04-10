import { useEffect, useMemo, useState } from "react";
import { Button } from "@mui/material";
import TextField from "@mui/material/TextField";
import AccountSidebar from "../../components/AccountSidebar";
import { useAppContext } from "../../hooks/useAppContext";
import { useNavigate } from "react-router-dom";
import { deleteData, editData, postData } from "../../utils/api";
import CircularProgress from '@mui/material/CircularProgress';
import { Collapse } from "react-collapse";
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

const initialDeleteForm = {
  email: "",
  password: "",
  confirmText: "",
};

const MyAccount = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [isChangePasswordFormShow, setisChangePasswordFormShow] = useState(false);
  const [phone, setPhone] = useState('');
const [deleteForm, setDeleteForm] = useState(initialDeleteForm);

  const [formFields, setFormsFields] = useState({
    name: '',
    email: '',
    mobile: ''
  });

  const [changePassword, setChangePassword] = useState({
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const context = useAppContext();
  const history = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (token === null) {
      history("/");
    }


 }, [context?.isLogin, history]);


  useEffect(() => {
     if (context?.userData?._id) {
      setUserId(context?.userData?._id);
      setFormsFields({
        name: context?.userData?.name || '',
        email: context?.userData?.email || '',
        mobile: context?.userData?.mobile || ''
      });
      setPhone(context?.userData?.mobile ? String(context?.userData?.mobile) : '');

      setChangePassword((prev) => ({
        ...prev,
        email: context?.userData?.email || ''
      }));

      setDeleteForm((prev) => ({
        ...prev,
        email: context?.userData?.email || ''
      }));
    }

  }, [context?.userData]);



  const onChangeInput = (e) => {
    const { name, value } = e.target;
    setFormsFields((prev) => ({
      ...prev,
      [name]: value
    }));

    setChangePassword((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const onDeleteInputChange = (e) => {
    const { name, value } = e.target;
    setDeleteForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const valideValue = Object.values(formFields).every((el) => el !== "" && el !== null && el !== undefined);
  const canDeleteAccount = useMemo(() => {
    const hasEmail = deleteForm.email.trim() !== "";
    const hasConfirmText = deleteForm.confirmText.trim() === "DELETE";
    const hasPassword = context?.userData?.signUpWithGoogle ? true : deleteForm.password.trim() !== "";

    return hasEmail && hasConfirmText && hasPassword;
  }, [context?.userData?.signUpWithGoogle, deleteForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);

    if (formFields.name === "") {
      context.alertBox("error", "Please enter full name");
      setIsLoading(false);
      return;
    }


    if (formFields.email === "") {
      context.alertBox("error", "Please enter email id");
      setIsLoading(false);
      return;
    }


    if (formFields.mobile === "") {
      context.alertBox("error", "Please enter mobile number");
      setIsLoading(false);
      return;
    }

    try {
      const res = await editData(`/api/user/${userId}`, formFields);
      context.alertBox("success", res?.data?.message || "Profile updated successfully");
      context.getUserDetails();
    } catch (error) {
      context.alertBox("error", error?.response?.data?.message || "Unable to update profile");
    } finally {
      setIsLoading(false);
    }
  };


    const handleSubmitChangePassword = async (e) => {
    e.preventDefault();

    setIsLoading2(true);

    if (changePassword.oldPassword === "" && context?.userData?.signUpWithGoogle === false) {
      context.alertBox("error", "Please enter old password");
      setIsLoading2(false);
      return;
    }


    if (changePassword.newPassword === "") {
      context.alertBox("error", "Please enter new password");
      setIsLoading2(false);
      return;
    }


    if (changePassword.confirmPassword === "") {
      context.alertBox("error", "Please enter confirm password");
      setIsLoading2(false);
      return;
    }

    if (changePassword.confirmPassword !== changePassword.newPassword) {
      context.alertBox("error", "password and confirm password not match");
      setIsLoading2(false);
      return;
    }

    const res = await postData(`/api/user/reset-password`, changePassword);


     if (res?.error !== true) {
      context.alertBox("success", res?.message);
      setChangePassword((prev) => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' }));
    } else {
      context.alertBox("error", res?.message);
    }
    setIsLoading2(false);
  };

      const handleDeleteAccount = async (e) => {
    e.preventDefault();

     if (!canDeleteAccount) {
      context.alertBox("error", "Please complete all delete account confirmation fields");
      return;
    }

    const shouldDelete = window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.");
    if (!shouldDelete) return;

    setIsDeleteLoading(true);

    try {
      const res = await deleteData('/api/user/delete-account', deleteForm);
      if (res?.error) {
        context.alertBox("error", res?.message || "Unable to delete account");
        return;
      }

      context.alertBox("success", res?.message || "Account deleted successfully");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      context.setIsLogin(false);
      context.setUserData(null);
      context.setCartData([]);
      context.setMyListData([]);
      history('/');
    } catch (error) {
      context.alertBox("error", error?.response?.data?.message || "Unable to delete account");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  return (
    <section className="py-3 lg:py-10 w-full">
      <div className="container flex flex-col lg:flex-row gap-5">
        <div className="w-full lg:w-[20%]">

          <AccountSidebar />
        </div>

       <div className="col2 w-full lg:w-[50%] space-y-5">
          <div className="card bg-white p-5 shadow-md rounded-md">
            <div className="flex items-center pb-3">
              <h2 className="pb-0">My Profile</h2>
              <Button className="!ml-auto" onClick={() => setisChangePasswordFormShow(!isChangePasswordFormShow)}>Change Password</Button>
            </div>
            <hr />

            <form className="mt-8" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 ">
                <div className="col">
                  <TextField label="Full Name" variant="outlined" size="small" className="w-full" name="name" value={formFields.name} disabled={isLoading} onChange={onChangeInput} />
                </div>

                <div className="col">
                   <TextField type="email" label="Email" variant="outlined" size="small" className="w-full" name="email" value={formFields.email} disabled onChange={onChangeInput} />
                </div>


                
               <div className="col sm:col-span-2">
                  <PhoneInput
                    defaultCountry="in"
                    value={phone}
                    disabled={isLoading}
                    onChange={(updatedPhone) => {
                      setPhone(updatedPhone);
                      setFormsFields((prev) => ({
                        ...prev,
                        mobile: updatedPhone
                      }));
                    }}
                  />

                </div>

              </div>


              <br />

              <div className="flex items-center gap-4">
                 <Button type="submit" disabled={!valideValue || isLoading} className="btn-org btn-sm w-[150px]">
                  {isLoading ? <CircularProgress color="inherit" size={24} /> : 'Update Profile'}
                </Button>

              </div>
            </form>
          </div>





          <Collapse isOpened={isChangePasswordFormShow}>
            <div className="card bg-white p-5 shadow-md rounded-sm">
              <div className="flex items-center pb-3">
                <h2 className="pb-0">Change Password</h2>
              </div>
              <hr />


              <form className="mt-8" onSubmit={handleSubmitChangePassword}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  {context?.userData?.signUpWithGoogle === false && (
                    <div className="col">
                      <TextField label="Old Password" variant="outlined" size="small" className="w-full" name="oldPassword" value={changePassword.oldPassword} disabled={isLoading2} onChange={onChangeInput} />
                    </div>
                   )}



                  <div className="col">
                    <TextField type="text" label="New Password" variant="outlined" size="small" className="w-full" name="newPassword" value={changePassword.newPassword} onChange={onChangeInput} />
                  </div>

                  <div className="col">
                     <TextField label="Confirm Password" variant="outlined" size="small" className="w-full" name="confirmPassword" value={changePassword.confirmPassword} onChange={onChangeInput} />
                  </div>


                </div>


                <br />

                <div className="flex items-center gap-4">
                  <Button type="submit" className="btn-org btn-sm w-[200px]" disabled={isLoading2}>
                    {isLoading2 ? <CircularProgress color="inherit" size={24} /> : 'Change Password'}
                  </Button>

                </div>
              </form>



            </div>
            
          </Collapse>

<div className="card bg-white p-5 shadow-md rounded-md border border-red-100">
            <div className="flex items-center pb-3">
              <h2 className="pb-0 text-red-600">Delete Account</h2>
            </div>
            <hr />

            <div className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
              Account delete karne ke baad aapka profile, address, cart, wishlist, reviews aur related order data database se permanently remove ho jayega.
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleDeleteAccount}>
              <TextField
                label="Confirm your email"
                variant="outlined"
                size="small"
                className="w-full"
                name="email"
                value={deleteForm.email}
                onChange={onDeleteInputChange}
                disabled={isDeleteLoading}
              />

              {context?.userData?.signUpWithGoogle === false && (
                <TextField
                  label="Enter password"
                  type="password"
                  variant="outlined"
                  size="small"
                  className="w-full"
                  name="password"
                  value={deleteForm.password}
                  onChange={onDeleteInputChange}
                  disabled={isDeleteLoading}
                />
              )}

              <TextField
                label='Type "DELETE" to confirm'
                variant="outlined"
                size="small"
                className="w-full"
                name="confirmText"
                value={deleteForm.confirmText}
                onChange={onDeleteInputChange}
                disabled={isDeleteLoading}
              />

              <Button
                type="submit"
                disabled={!canDeleteAccount || isDeleteLoading}
                className="!bg-red-600 !text-white hover:!bg-red-700 !px-6 !py-2.5 !capitalize"
              >
                {isDeleteLoading ? <CircularProgress color="inherit" size={24} /> : 'Delete My Account'}
              </Button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
};

export default MyAccount;
