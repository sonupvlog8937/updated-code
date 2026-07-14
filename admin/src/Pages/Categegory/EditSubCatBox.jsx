import React, { useContext, useEffect, useState } from "react";
import { MdOutlineModeEdit } from "react-icons/md";
import { FaRegTrashAlt } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { Button } from "@mui/material";
import { MyContext } from "../../App";
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import { deleteData, editData, deleteImages } from "../../utils/api";
import UploadBox from '../../Components/UploadBox';

export const EditSubCatBox = (props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectVal, setSelectVal] = useState('');
  const [previews, setPreviews] = useState([]);
  const [formFields, setFormFields] = useState({
    name: "",
    images: [],
    parentCatName: null,
    parentId: null
  })

  const context = useContext(MyContext);


  useEffect(() => {
    formFields.name = props?.name;
    formFields.parentCatName = props?.selectedCatName;
    formFields.parentId = props?.selectedCat;
    formFields.images = props?.images || [];
    setSelectVal(props?.selectedCat);
    setPreviews(props?.images || []);
  }, [])


  const onChangeInput = (e) => {
    const { name, value } = e.target;

    const catId = selectVal
    setSelectVal(catId);

    setFormFields(() => {
      return {
        ...formFields,
        [name]: value
      }
    })
  }

  const handleChange = (event) => {
    setSelectVal(event.target.value);
    formFields.parentId = event.target.value;
  };

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


  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (formFields.name === "") {
      context.alertBox("error", "Please enter category name");
      return false
    }


    editData(`/api/category/${props?.id}`, formFields).then((res) => {
      setTimeout(() => {
        context.alertBox("success", res?.data?.message);
        context?.getCat();
        setIsLoading(false);
      }, 1000);
    });

  }


  const deleteCat = (id) => {
    if (context?.userData?.role === "ADMIN") {
      deleteData(`/api/category/${id}`).then((res) => {
        context?.getCat();
      })
    } else {
      context.alertBox("error", "Only admin can delete data");
    }
  }

  return (
    <form className="w-100  flex items-center gap-3 p-0 px-4" onSubmit={handleSubmit}>

      {
        editMode === true &&
        <>
          <div className="flex items-center justify-between py-2 gap-4 whitespace-nowrap overflow-x-scroll">
            <div className="w-[180px] md:w-[150px]">
              <Select
                style={{ zoom: '75%' }}
                className="w-full"
                size="small"
                value={selectVal}
                onChange={handleChange}
                displayEmpty
                inputProps={{ 'aria-label': 'Without label' }}
              >
                {
                  props?.catData?.length !== 0 && props?.catData?.map((item, index) => {
                    return (
                      <MenuItem value={item?._id} key={index} onClick={() => {
                        formFields.parentCatName = item?.name
                      }}>{item?.name}</MenuItem>
                    )
                  })
                }

              </Select>
            </div>

            <input type="text" className='w-[150px] md:w-full h-[30px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm' name="name" value={formFields?.name} onChange={onChangeInput} />

            <div className="flex items-center gap-2">
              <Button size="small" className="btn-sml" type="submit" variant="contained">
                {
                  isLoading === true ? <CircularProgress color="inherit" />
                    :
                    <>
                      Edit
                    </>
                }
              </Button>
              <Button size="small" variant="outlined" onClick={() => setEditMode(false)}>Cancel</Button>
            </div>


          </div>

          <div className="w-full px-4 pb-4">
            <h3 className='text-[12px] font-[500] mb-2 text-black'>Category Image</h3>
            <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
              {
                previews?.length !== 0 && previews?.map((image, index) => {
                  return (
                    <div className="uploadBoxWrapper mr-3 relative" key={index}>
                      <span className='absolute w-[20px] h-[20px] rounded-full overflow-hidden bg-red-700 -top-[5px] -right-[5px] flex items-center justify-center z-50 cursor-pointer' onClick={() => removeImg(image, index)}>
                        <IoMdClose className='text-white text-[17px]' />
                      </span>
                      <div className='uploadBox p-0 rounded-md overflow-hidden border border-dashed border-[rgba(0,0,0,0.3)] h-[100px] w-[100%] bg-gray-100 cursor-pointer hover:bg-gray-200 flex items-center justify-center flex-col relative'>
                        <img src={image} className='w-100' />
                      </div>
                    </div>
                  )
                })
              }
              <UploadBox multiple={true} name="images" url="/api/category/uploadImages" setPreviewsFun={setPreviewsFun} />
            </div>
          </div>
        </>
      }


      {
        editMode === false &&
        <>
          <span className="font-[500] text-[14px]">{props?.name}</span>
          <div className="flex items-center ml-auto gap-2">
            <Button className="!min-w-[35px] !w-[35px] !h-[35px] !rounded-full !text-black"
              onClick={() => {
                setEditMode(true);
              }}
            >
              <MdOutlineModeEdit />
            </Button>
            <Button className="!min-w-[35px] !w-[35px] !h-[35px] !rounded-full !text-black"
              onClick={() => deleteCat(props?.id)}
            ><FaRegTrashAlt /></Button>
          </div>
        </>
      }

    </form>
  )
}


export default EditSubCatBox;