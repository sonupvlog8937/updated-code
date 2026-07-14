import React, { useState } from 'react'
import { Button } from '@mui/material';
import { FaCloudUploadAlt } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useContext } from 'react';
import { MyContext } from '../../App';
import CircularProgress from '@mui/material/CircularProgress';
import { postData, deleteImages } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import UploadBox from '../../Components/UploadBox';

const AddSubCategory = () => {
    const [productCat, setProductCat] = useState('');
    const [productCat2, setProductCat2] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoading2, setIsLoading2] = useState(false);

    const [formFields, setFormFields] = useState({
        name: "",
        images: [],
        parentCatName: null,
        parentId: null
    })


    const [formFields2, setFormFields2] = useState({
        name: "",
        images: [],
        parentCatName: null,
        parentId: null

    })

    const [previews, setPreviews] = useState([]);
    const [previews2, setPreviews2] = useState([]);

    const context = useContext(MyContext);
    const history = useNavigate();

    const handleChangeProductCat = (event) => {
        setProductCat(event.target.value);
        formFields.parentId = event.target.value
    };

    const handleChangeProductCat2 = (event) => {
        setProductCat2(event.target.value);
        formFields2.parentId = event.target.value
    };


    const selecteCatFun = (catName) => {
        formFields.parentCatName = catName
    }

    const selecteCatFun2 = (catName) => {
        formFields2.parentCatName = catName
    }

    const onChangeInput = (e) => {
        const { name, value } = e.target;

        const catId = productCat
        setProductCat(catId);

        setFormFields(() => {
            return {
                ...formFields,
                [name]: value
            }
        })
    }


    const onChangeInput2 = (e) => {
        const { name, value } = e.target;
        const catId = productCat2
        setProductCat2(catId);

        setFormFields2(() => {
            return {
                ...formFields2,
                [name]: value
            }
        })
    }

    const setPreviewsFun = (previewsArr) => {
        const imgArr = previews;
        for (let i = 0; i < previewsArr.length; i++) {
            imgArr.push(previewsArr[i])
        }

        setPreviews([])
        setTimeout(() => {
            setPreviews(imgArr)
            formFields.images = imgArr
        }, 10);
    }

    const removeImg = (image, index) => {
        var imageArr = [];
        imageArr = previews;
        deleteImages(`/api/category/deteleImage?img=${image}`).then((res) => {
            imageArr.splice(index, 1);

            setPreviews([]);
            setTimeout(() => {
                setPreviews(imageArr);
                formFields.images = imageArr
            }, 100);

        })
    }

    const setPreviewsFun2 = (previewsArr) => {
        const imgArr = previews2;
        for (let i = 0; i < previewsArr.length; i++) {
            imgArr.push(previewsArr[i])
        }

        setPreviews2([])
        setTimeout(() => {
            setPreviews2(imgArr)
            formFields2.images = imgArr
        }, 10);
    }

    const removeImg2 = (image, index) => {
        var imageArr = [];
        imageArr = previews2;
        deleteImages(`/api/category/deteleImage?img=${image}`).then((res) => {
            imageArr.splice(index, 1);

            setPreviews2([]);
            setTimeout(() => {
                setPreviews2(imageArr);
                formFields2.images = imageArr
            }, 100);

        })
    }


    const handleSubmit = (e) => {
        e.preventDefault();

        setIsLoading(true);

        if (formFields.name === "") {
            context.alertBox("error", "Please enter category name");
            setIsLoading(false);
            return false
        }

        if (productCat === "") {
            context.alertBox("error", "Please select parent category");
            setIsLoading(false);
            return false
        }

        if (previews?.length === 0) {
            context.alertBox("error", "Please select category image");
            setIsLoading(false);
            return false
        }

        postData("/api/category/create", formFields).then((res) => {
            setTimeout(() => {
                setIsLoading(false);
                context.setIsOpenFullScreenPanel({
                    open: false,
                })
                context?.getCat();
                history("/subCategory/list")
            }, 2500);
        })
    }




    const handleSubmit2 = (e) => {
        e.preventDefault();

        setIsLoading2(true);

        console.log(formFields2)

        if (formFields2.name === "") {
            context.alertBox("error", "Please enter category name");
            setIsLoading2(false);
            return false
        }

        if (productCat2 === "") {
            context.alertBox("error", "Please select parent category");
            setIsLoading2(false);
            return false
        }

        if (previews2?.length === 0) {
            context.alertBox("error", "Please select category image");
            setIsLoading2(false);
            return false
        }

        postData("/api/category/create", formFields2).then((res) => {
            setTimeout(() => {
                setIsLoading2(false);
                context.setIsOpenFullScreenPanel({
                    open: false,
                })
                context?.getCat();
            }, 2500);
        })
    }


    return (
        <section className='p-5 bg-gray-50 grid grid-cols-1 md:grid-cols-2  gap-10'>
            <form className='form py-1 p-1 md:p-8 md:py-1' onSubmit={handleSubmit}>
                <h4 className="font-[600]">Add Sub Category</h4>
                <div className='scroll max-h-[72vh] overflow-y-scroll pr-4 pt-4'>
                    <div className='grid grid-cols-1 md:grid-cols-1 mb-3 gap-5'>
                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Product Category</h3>
                            <Select
                                labelId="demo-simple-select-label"
                                id="productCatDrop"
                                size="small"
                                className='w-full'
                                value={productCat}
                                label="Category"
                                onChange={handleChangeProductCat}
                            >
                                {
                                    context?.catData?.length !== 0 && context?.catData?.map((item, index) => {
                                        return (
                                            <MenuItem key={index} value={item?._id} onClick={selecteCatFun(item?.name)}>{item?.name}</MenuItem>
                                        )
                                    })
                                }

                            </Select>
                        </div>

                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Sub Category  Name</h3>
                            <input type="text" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm' name="name" value={formFields.name} onChange={onChangeInput} />
                        </div>


                    </div>

                    <br />

                    <h3 className='text-[14px] font-[500] mb-2 text-black'>Sub Category Image</h3>
                 
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                        {
                            previews?.length !== 0 && previews?.map((image, index) => {
                                return (
                                    <div className="uploadBoxWrapper mr-3 relative" key={index}>

                                        <span className='absolute w-[20px] h-[20px] rounded-full  overflow-hidden bg-red-700 -top-[5px] -right-[5px] flex items-center justify-center z-50 cursor-pointer' onClick={() => removeImg(image, index)}><IoMdClose className='text-white text-[17px]' /></span>


                                        <div className='uploadBox p-0 rounded-md overflow-hidden border border-dashed border-[rgba(0,0,0,0.3)] h-[150px] w-[100%] bg-gray-100 cursor-pointer hover:bg-gray-200 flex items-center justify-center flex-col relative'>

                                            <img src={image} className='w-100' />
                                        </div>
                                    </div>
                                )
                            })
                        }


                        <UploadBox multiple={true} name="images" url="/api/category/uploadImages" setPreviewsFun={setPreviewsFun} />
                    </div>

                    <br />
                    <br />

                </div>


                <div className='w-[250px]'>
                    <Button type="submit" className="btn-blue btn-lg w-full flex gap-2">
                        {
                            isLoading === true ? <CircularProgress color="inherit" />
                                :
                                <>
                                    <FaCloudUploadAlt className='text-[25px] text-white' />
                                    Publish and View
                                </>
                        }
                    </Button>
                </div>


            </form>




            <form className='form py-1 p-1 md:p-8 md:py-1' onSubmit={handleSubmit2}>
                <h4 className="font-[600]">Add Third Lavel Category</h4>
                <div className='scroll max-h-[72vh] overflow-y-scroll pr-4 pt-4'>
                    <div className='grid grid-cols-1 md:grid-cols-1 mb-3 gap-5'>
                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Product Category</h3>
                            <Select
                                labelId="demo-simple-select-label"
                                id="productCatDrop"
                                size="small"
                                className='w-full'
                                value={productCat2}
                                label="Category"
                                onChange={handleChangeProductCat2}
                            >
                                {
                                    context?.catData?.length !== 0 && context?.catData?.map((item, index) => {
                                       return(
                                        item?.children?.length !== 0 && item?.children?.map((item2, index) => {
                                            return (
                                                <MenuItem key={index} value={item2?._id} onClick={selecteCatFun2(item2?.name)}>{item2?.name}</MenuItem>
                                            )
                                        })
                                       )                                      

                                    })
                                }

                            </Select>
                        </div>

                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Sub Category  Name</h3>
                            <input type="text" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm' name="name" value={formFields2.name} onChange={onChangeInput2} />
                        </div>


                    </div>

                    <br />

                    <h3 className='text-[14px] font-[500] mb-2 text-black'>Third Level Category Image</h3>
                 
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                        {
                            previews2?.length !== 0 && previews2?.map((image, index) => {
                                return (
                                    <div className="uploadBoxWrapper mr-3 relative" key={index}>

                                        <span className='absolute w-[20px] h-[20px] rounded-full  overflow-hidden bg-red-700 -top-[5px] -right-[5px] flex items-center justify-center z-50 cursor-pointer' onClick={() => removeImg2(image, index)}><IoMdClose className='text-white text-[17px]' /></span>


                                        <div className='uploadBox p-0 rounded-md overflow-hidden border border-dashed border-[rgba(0,0,0,0.3)] h-[150px] w-[100%] bg-gray-100 cursor-pointer hover:bg-gray-200 flex items-center justify-center flex-col relative'>

                                            <img src={image} className='w-100' />
                                        </div>
                                    </div>
                                )
                            })
                        }


                        <UploadBox multiple={true} name="images" url="/api/category/uploadImages" setPreviewsFun={setPreviewsFun2} />
                    </div>

                    <br />
                    <br />

                </div>


                <div className='w-[250px]'>
                    <Button type="submit" className="btn-blue btn-lg w-full flex gap-2">
                     {
                            isLoading2 === true ? <CircularProgress color="inherit" />
                                :
                                <>
                                    <FaCloudUploadAlt className='text-[25px] text-white' />
                                    Publish and View
                                </>
                        }
                    </Button>
                </div>


            </form>


        </section>
    )
}

export default AddSubCategory;
