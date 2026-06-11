import React, { useState, useEffect } from 'react'
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import { useContext } from 'react';
import { useAppContext } from "../../hooks/useAppContext";
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import 'react-international-phone/style.css';
import { Button } from '@mui/material';
import { deleteData, editData, fetchDataFromApi, postData } from '../../utils/api';
import CircularProgress from '@mui/material/CircularProgress';

const AddAddress = () => {

    const [phone, setPhone] = useState('');
    const [addressType, setAddressType] = useState("");

    const [formFields, setFormsFields] = useState({
        address_line1: '',
        city: '',
        state: '',
        pincode: '',
        country: '',
        mobile: '',
        userId: '',
        addressType: '',
        landmark: '',
        latitude: null,
        longitude: null
    });

    const [isLoading, setIsLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationCaptured, setLocationCaptured] = useState(false);
    const [showPermissionDialog, setShowPermissionDialog] = useState(false);

    const context = useAppContext();

    useEffect(() => {
        if (context?.userData?._id !== undefined) {


            setFormsFields((prevState) => ({
                ...prevState,
                userId: context?.userData?._id
            }))

        }

    }, [context?.userData]);


    const onChangeInput = (e) => {
        const { name, value } = e.target;
        setFormsFields(() => {
            return {
                ...formFields,
                [name]: value
            }
        })

    }



    const handleChangeAddressType = (event) => {
        setAddressType(event.target.value)
        setFormsFields(() => ({
            ...formFields,
            addressType: event.target.value
        }))
    }

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            context.alertBox("error", "Geolocation is not supported by your browser");
            return;
        }

        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setFormsFields((prevState) => ({
                    ...prevState,
                    latitude: latitude,
                    longitude: longitude
                }));
                setLocationCaptured(true);
                setLocationLoading(false);
                context.alertBox("success", "Location captured successfully!");
            },
            (error) => {
                setLocationLoading(false);
                let errorMessage = "Unable to get location";
                
                if (error.code === error.PERMISSION_DENIED) {
                    // Show permission help dialog
                    setShowPermissionDialog(true);
                    return;
                }
                
                switch (error.code) {
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out.";
                        break;
                }
                context.alertBox("error", errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };



    useEffect(()=>{

        if(context?.addressMode === "edit"){
            fetchAddress(context?.addressId)
        }
        
    },[context?.addressMode]);


    const handleSubmit = (e) => {
        e.preventDefault();
        if (formFields.address_line1 === "") {
            context.alertBox("error", "Please enter Address Line 1");
            return false
        }


        if (formFields.city === "") {
            context.alertBox("error", "Please enter Your city name");
            return false
        }


        if (formFields.state === "") {
            context.alertBox("error", "Please enter your state");
            return false
        }


        if (formFields.pincode === "") {
            context.alertBox("error", "Please enter your pincode");
            return false
        }


        if (formFields.country === "") {
            context.alertBox("error", "Please enter your country");
            return false
        }


        if (phone === "" || phone?.length < 5) {
            context.alertBox("error", "Please enter your 10 digit mobile number a");
            return false
        }

        if (formFields.landmark === "") {
            context.alertBox("error", "Please enter landmark");
            return false
        }

        if (formFields.addressType === "") {
            context.alertBox("error", "Please select address type");
            return false
        }

        if (!formFields.latitude || !formFields.longitude) {
            context.alertBox("error", "Please capture your current location");
            return false
        }

      

        if (context?.addressMode === "add") {
            setIsLoading(true);
            postData(`/api/address/add`, formFields, { withCredentials: true }).then((res) => {
                console.log(res)
                if (res?.error !== true) {

                    context.alertBox("success", res?.message);
                    setTimeout(() => {
                        context.setOpenAddressPanel(false)
                        setIsLoading(false);
                    }, 500)


                    context.getUserDetails();

                    setFormsFields({
                        address_line1: '',
                        city: '',
                        state: '',
                        pincode: '',
                        country: '',
                        mobile: '',
                        userId: '',
                        addressType: '',
                        landmark: '',
                        latitude: null,
                        longitude: null
                    })

                    setAddressType("");
                    setPhone("");
                    setLocationCaptured(false);



                } else {
                    context.alertBox("error", res?.message);
                    setIsLoading(false);
                }

            })
        }



        if (context?.addressMode  === "edit") {
            setIsLoading(true);
            editData(`/api/address/${context?.addressId}`, formFields, { withCredentials: true }).then((res) => {

                fetchDataFromApi(`/api/address/get?userId=${context?.userData?._id}`).then((res) => {
                    setTimeout(() => {
                        setIsLoading(false);
                        context.setOpenAddressPanel(false);
                    }, 500)
                    context?.getUserDetails(res.data);

                    setFormsFields({
                        address_line1: '',
                        city: '',
                        state: '',
                        pincode: '',
                        country: '',
                        mobile: '',
                        userId: '',
                        addressType: '',
                        landmark: '',
                        latitude: null,
                        longitude: null
                    })

                    setAddressType("");
                    setPhone("");
                    setLocationCaptured(false);
                })
            })
        }


    }



    const fetchAddress = (id) => {

        fetchDataFromApi(`/api/address/${id}`).then((res) => {

            setFormsFields({
                address_line1: res?.address?.address_line1,
                city: res?.address?.city,
                state: res?.address?.state,
                pincode: res?.address?.pincode,
                country: res?.address?.country,
                mobile: res?.address?.mobile,
                userId: res?.address?.userId,
                addressType: res?.address?.addressType,
                landmark: res?.address?.landmark,
                latitude: res?.address?.latitude,
                longitude: res?.address?.longitude
            })

            if (res?.address?.latitude && res?.address?.longitude) {
                setLocationCaptured(true);
            }

            const ph = `"${res?.address?.mobile}"`
            setPhone(ph)
            setAddressType(res?.address?.addressType)

        })

    }

    return (
        <>
            {/* Permission Help Dialog */}
            <Dialog 
                open={showPermissionDialog} 
                onClose={() => setShowPermissionDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle style={{ 
                    fontWeight: 700, 
                    fontSize: '18px', 
                    color: '#ef4444',
                    borderBottom: '2px solid #fee2e2',
                    paddingBottom: '12px'
                }}>
                    🔒 Location Permission Required
                </DialogTitle>
                <DialogContent style={{ padding: '24px 24px 16px' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px', lineHeight: '1.6' }}>
                            <strong>आपने location permission deny कर दी है।</strong> Address add करने के लिए location access जरूरी है।
                        </p>
                        
                        <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e40af', marginBottom: '12px' }}>
                                📱 Permission कैसे allow करें:
                            </p>
                            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#1e3a8a', lineHeight: '1.8' }}>
                                <li>Browser के address bar में <strong>lock icon (🔒)</strong> पर click करें</li>
                                <li>"Location" या "Site Settings" option ढूंढें</li>
                                <li>Location को <strong>"Allow"</strong> में change करें</li>
                                <li>Page refresh करें और फिर से "Get Location" button click करें</li>
                            </ol>
                        </div>

                        <div style={{ marginTop: '16px', padding: '12px', background: '#fef3c7', borderRadius: '6px', border: '1px solid #fcd34d' }}>
                            <p style={{ fontSize: '12px', color: '#92400e', margin: 0, lineHeight: '1.5' }}>
                                💡 <strong>Note:</strong> आपकी location सिर्फ delivery के लिए use होगी। हम इसे safe रखते हैं।
                            </p>
                        </div>
                    </div>
                </DialogContent>
                <DialogActions style={{ padding: '12px 24px 20px', gap: '8px' }}>
                    <Button 
                        onClick={() => setShowPermissionDialog(false)}
                        style={{
                            background: '#f3f4f6',
                            color: '#374151',
                            fontWeight: 600,
                            padding: '8px 20px',
                            borderRadius: '8px',
                            textTransform: 'none'
                        }}
                    >
                        Close
                    </Button>
                    <Button 
                        onClick={() => {
                            setShowPermissionDialog(false);
                            // Try again after user understands
                            setTimeout(() => getCurrentLocation(), 300);
                        }}
                        style={{
                            background: '#2563eb',
                            color: '#fff',
                            fontWeight: 600,
                            padding: '8px 20px',
                            borderRadius: '8px',
                            textTransform: 'none'
                        }}
                    >
                        Try Again
                    </Button>
                </DialogActions>
            </Dialog>

            <form className="p-8 py-3 pb-8 px-4" onSubmit={handleSubmit}>
            <div className="col w-[100%] mb-4">
                <TextField
                    className="w-full"
                    label="Address Line 1"
                    variant="outlined"
                    size="small"
                    name="address_line1"
                    onChange={onChangeInput} value={formFields.address_line1}
                />
            </div>


            <div className="col w-[100%] mb-4">
                <TextField
                    className="w-full"
                    label="City"
                    variant="outlined"
                    size="small"
                    name="city" onChange={onChangeInput} value={formFields.city}
                />
            </div>

            <div className="col w-[100%] mb-4">
                <TextField
                    className="w-full"
                    label="State"
                    variant="outlined"
                    size="small"
                    name="state" onChange={onChangeInput} value={formFields.state}
                />
            </div>

            <div className="col w-[100%] mb-4">
                <TextField
                    className="w-full"
                    label="Pincode"
                    variant="outlined"
                    size="small"
                    name="pincode" onChange={onChangeInput} value={formFields.pincode}
                />
            </div>

            <div className="col w-[100%] mb-4">
                <TextField
                    className="w-full"
                    label="Country"
                    variant="outlined"
                    size="small"
                    name="country" onChange={onChangeInput} value={formFields.country}
                />
            </div>


            <div className="col w-[100%] mb-4">
                <PhoneInput
                    defaultCountry="in"
                    value={phone}
                    onChange={(phone) => {
                        setPhone(phone);
                        setFormsFields((prevState) => ({
                            ...prevState,
                            mobile: phone
                        }))
                    }}
                />
            </div>




            <div className="col w-[100%] mb-4">
                <TextField
                    className="w-full"
                    label="Landmark"
                    variant="outlined"
                    size="small"
                    name="landmark" onChange={onChangeInput} value={formFields.landmark}
                />
            </div>

            <div className="col w-[100%] mb-4">
                <Button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="w-full"
                    variant="outlined"
                    style={{
                        borderColor: locationCaptured ? '#4caf50' : '#ff6b6b',
                        color: locationCaptured ? '#4caf50' : '#ff6b6b',
                        textTransform: 'none'
                    }}
                >
                    {locationLoading ? (
                        <>
                            <CircularProgress size={20} style={{ marginRight: 8 }} />
                            Capturing Location...
                        </>
                    ) : locationCaptured ? (
                        <>
                            ✓ Update Current Location
                        </>
                    ) : (
                        <>
                            📍 Get Current Location (Required)
                        </>
                    )}
                </Button>
                {locationCaptured && formFields.latitude && formFields.longitude && (
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                        Location: {formFields.latitude.toFixed(6)}, {formFields.longitude.toFixed(6)}
                    </p>
                )}
            </div>


            <div className="flex gap-5 pb-5 flex-col">
                <FormControl>
                    <FormLabel id="demo-row-radio-buttons-group-label">Address Type</FormLabel>
                    <RadioGroup
                        row
                        aria-labelledby="demo-row-radio-buttons-group-label"
                        name="row-radio-buttons-group"
                        className="flex items-center gap-5"
                        value={addressType}
                        onChange={handleChangeAddressType}
                    >
                        <FormControlLabel value="Home" control={<Radio />} label="Home" />
                        <FormControlLabel value="Office" control={<Radio />} label="Office" />

                    </RadioGroup>
                </FormControl>
            </div>


            <div className='flex items-center gap-5'>
                <Button type="submit" className="btn-org btn-lg w-full flex gap-2 items-center">
                    {
                        isLoading === true ?
                            <CircularProgress color="inherit" />
                            :

                            'Save'

                    }
                </Button>

            </div>
        </form>
        </>
    )
}

export default AddAddress