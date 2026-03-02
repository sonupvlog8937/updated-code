import React, { useEffect, useMemo, useState } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import "../Sidebar/style.css";
import { Collapse } from "react-collapse";
import { FaAngleDown, FaAngleUp } from "react-icons/fa6";
import Button from "@mui/material/Button";
import RangeSlider from "react-range-slider-input";
import "react-range-slider-input/dist/style.css";
import Rating from "@mui/material/Rating";
import { useAppContext } from "../../hooks/useAppContext";
import { useLocation } from "react-router-dom";
import { postData } from "../../utils/api";
import { MdOutlineFilterAlt } from "react-icons/md";


export const Sidebar = (props) => {
  const [isOpenCategoryFilter, setIsOpenCategoryFilter] = useState(true);
  const [availableColors, setAvailableColors] = useState([]);
  const [isOpenBrandFilter, setIsOpenBrandFilter] = useState(true);
  const [isOpenSizeFilter, setIsOpenSizeFilter] = useState(true);
  const [isOpenProductTypeFilter, setIsOpenProductTypeFilter] = useState(true);
  const [isOpenPriceFilter, setIsOpenPriceFilter] = useState(true);
  const [isOpenSaleFilter, setIsOpenSaleFilter] = useState(true);
  const [isOpenColorFilter, setIsOpenColorFilter] = useState(true);
  const [isOpenRatingFilter, setIsOpenRatingFilter] = useState(true);
  const [isOpenStockFilter, setIsOpenStockFilter] = useState(true);
  const [isOpenDiscountFilter, setIsOpenDiscountFilter] = useState(true);
  const [isOpenWeightFilter, setIsOpenWeightFilter] = useState(true);
  const [isOpenRamFilter, setIsOpenRamFilter] = useState(true);

  const [filters, setFilters] = useState({
    catId: [],
    subCatId: [],
    thirdsubCatId: [],
    minPrice: '',
    maxPrice: '',
    rating: '',
    colors: [],
    page: 1,
    limit: 25
  })



  const [price, setPrice] = useState([0, 60000]);

  const context = useAppContext();

  const location = useLocation();

  const availableBrands = useMemo(() => {
    const items = props?.productsData?.products || [];
    return [...new Set(items.map((product) => product?.brand?.trim()).filter(Boolean))];
  }, [props?.productsData]);

  const availableSizes = useMemo(() => {
    const sizeSet = new Set();
    (props?.productsData?.products || []).forEach((product) => {
      (product?.size || []).forEach((size) => {
        if (size) sizeSet.add(size);
      });
    });
    return Array.from(sizeSet);
  }, [props?.productsData]);

  const availableProductTypes = useMemo(() => {
    const typeSet = new Set();
    (props?.productsData?.products || []).forEach((product) => {
      const typeValue = product?.productType || product?.thirdSubCatName || product?.subCatName || product?.catName;
      if (typeValue) typeSet.add(typeValue);
    });
    return Array.from(typeSet);
  }, [props?.productsData]);

  const availablePriceRanges = useMemo(() => {
    const products = props?.productsData?.products || [];
    if (products.length === 0) return [];

    const maxPrice = Math.max(...products.map((item) => Number(item?.price || 0)));
    const ranges = [];
    const step = 100;

    for (let start = 0; start <= maxPrice; start += step) {
      const end = start + step - 1;
      ranges.push({
        label: `Rs ${start} - Rs ${end}`,
        value: `${start}-${end}`
      });
    }

    return ranges;
  }, [props?.productsData]);

  const availableWeights = useMemo(() => {
    const weightSet = new Set();
    (props?.productsData?.products || []).forEach((product) => {
      (product?.productWeight || []).forEach((weight) => {
        if (weight) weightSet.add(weight);
      });
    });
    return Array.from(weightSet);
  }, [props?.productsData]);

  const availableRamOptions = useMemo(() => {
    const ramSet = new Set();
    (props?.productsData?.products || []).forEach((product) => {
      (product?.productRam || []).forEach((ram) => {
        if (ram) ramSet.add(ram);
      });
    });
    return Array.from(ramSet);
  }, [props?.productsData]);

  const discountBands = useMemo(() => ([
    { label: "10% & above", min: 10 },
    { label: "25% & above", min: 25 },
    { label: "40% & above", min: 40 }
  ]), []);

  const handleCheckboxChange = (field, value) => {
    context?.setSearchData([]);


    const currentValues = filters[field] || [];
    const updatedValues = currentValues?.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    setFilters((prev) => ({
      ...prev,
      [field]: updatedValues
    }));


    if (field === "catId") {
      setFilters((prev) => ({
        ...prev,
        subCatId: [],
        thirdsubCatId: [],
        colors: []
      }))
    };



    if (field === "subCatId" || field === "thirdsubCatId") {
      setFilters((prev) => ({
        ...prev,
        colors: []
      }))
    }

  };

   const handleMultiSelect = (selectedValues = [], setSelectedValues, value) => {
    if (typeof setSelectedValues !== "function") return;
    const updatedValues = selectedValues.includes(value)
      ? selectedValues.filter((item) => item !== value)
      : [...selectedValues, value];
    setSelectedValues(updatedValues);
  };

  const handleApplyFilters = () => {
    context?.setOpenFilter(false);
  };

  const handleResetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      catId: [],
      subCatId: [],
      thirdsubCatId: [],
      rating: "",
      colors: []
    }));
    setPrice([0, 60000]);
    props?.onResetAllFilters?.();
    context?.setOpenFilter(false);
  };


  useEffect(() => {

    const url = window.location.href;
    const queryParameters = new URLSearchParams(location.search);

    if (url.includes("catId")) {
      const categoryId = queryParameters.get("catId");
      const catArr = [];
      catArr.push(categoryId);
      filters.catId = catArr;
      filters.subCatId = [];
      filters.thirdsubCatId = [];
      filters.rating = [];
      context?.setSearchData([]);
    }

    if (url.includes("subCatId")) {
      const subcategoryId = queryParameters.get("subCatId");
      const subcatArr = [];
      subcatArr.push(subcategoryId);
      filters.subCatId = subcatArr;
      filters.catId = [];
      filters.thirdsubCatId = [];
      filters.rating = [];
      context?.setSearchData([]);
    }


    if (url.includes("thirdLavelCatId")) {
      const thirdcategoryId = queryParameters.get("thirdLavelCatId");
      const thirdcatArr = [];
      thirdcatArr.push(thirdcategoryId);
      filters.subCatId = [];
      filters.catId = [];
      filters.thirdsubCatId = thirdcatArr;
      filters.rating = [];
      context?.setSearchData([]);
    }

    filters.page = 1;

    setTimeout(() => {
      filtesData();
    }, 200);




  }, [location]);



  const filtesData = () => {
    props.setIsLoading(true);

    //console.log(context?.searchData)

    if (context?.searchData?.products?.length > 0) {
      props.setProductsData(context?.searchData);
      props.setIsLoading(false);
      props.setTotalPages(context?.searchData?.totalPages)
      window.scrollTo(0, 0);
    } else {
      postData(`/api/product/filters`, filters).then((res) => {
        props.setProductsData(res);
        props.setIsLoading(false);
        props.setTotalPages(res?.totalPages)
        window.scrollTo(0, 0);
      })
    }


  }



  useEffect(() => {
    filters.page = props.page;
    filtesData();
  }, [filters, props.page])


  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      minPrice: price[0],
      maxPrice: price[1]
    }))
  }, [price]);

  useEffect(() => {
    const colorMap = new Map();

    props?.productsData?.products?.forEach((product) => {
      product?.colorOptions?.forEach((colorItem) => {
        if (colorItem?.name && !colorMap.has(colorItem?.name)) {
          colorMap.set(colorItem?.name, colorItem?.code || "");
        }
      })
    })

    setAvailableColors(Array.from(colorMap, ([name, code]) => ({ name, code })));
  }, [props?.productsData]);




  return (
    <aside className="sidebar py-3  lg:py-5 static lg:sticky top-[130px] z-[50] pr-0 lg:pr-5">
      <div className=" max-h-[60vh]  lg:overflow-visible overflow-auto  w-full">
        <div className="box">
          <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5">
            Shop by Category
            <Button className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]" onClick={() => setIsOpenCategoryFilter(!isOpenCategoryFilter)}>
              {isOpenCategoryFilter === true ? <FaAngleUp /> : <FaAngleDown />}
            </Button>
          </h3>
          <Collapse isOpened={isOpenCategoryFilter}>
            <div className="scroll px-6 relative -left-[13px]">
              {context?.catData?.length !== 0 && context?.catData?.map((item, index) => {
                return (
                  <FormControlLabel
                    key={index}
                    value={item?._id}
                    control={<Checkbox />}
                    checked={filters?.catId?.includes(item?._id)}
                    label={item?.name}
                    onChange={() => handleCheckboxChange("catId", item?._id)}
                    className="w-full"
                  />
                );
              })}
            </div>
          </Collapse>
        </div>

        <div className="box mt-4">
          <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5">
            Filter By Brand
            <Button className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]" onClick={() => setIsOpenBrandFilter(!isOpenBrandFilter)}>
              {isOpenBrandFilter ? <FaAngleUp /> : <FaAngleDown />}
            </Button>
          </h3>
          <Collapse isOpened={isOpenBrandFilter}>
            <div className="scroll px-3">
              {availableBrands.map((brand) => (
                <FormControlLabel
                  key={brand}
                  control={<Checkbox />}
                checked={(props?.selectedBrands || []).includes(brand)}
                  onChange={() => handleMultiSelect(props?.selectedBrands, props?.setSelectedBrands, brand)}
                  label={brand}
                  className="w-full"
                />
              ))}
            </div>
          </Collapse>
        </div>

        <div className="box mt-4">
          <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5">
            Filter By Size
            <Button className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]" onClick={() => setIsOpenSizeFilter(!isOpenSizeFilter)}>
              {isOpenSizeFilter ? <FaAngleUp /> : <FaAngleDown />}
            </Button>
          </h3>
          <Collapse isOpened={isOpenSizeFilter}>
            <div className="scroll px-3">
              {availableSizes.map((size) => (
                <FormControlLabel
                  key={size}
                  control={<Checkbox />}
                  checked={(props?.selectedSizes || []).includes(size)}
                  onChange={() => handleMultiSelect(props?.selectedSizes, props?.setSelectedSizes, size)}
                  label={size}
                  className="w-full"
                />
              ))}
            </div>
          </Collapse>
        </div>

        <div className="box mt-4">
          <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5">
            Filter By Product Type
            <Button className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]" onClick={() => setIsOpenProductTypeFilter(!isOpenProductTypeFilter)}>
              {isOpenProductTypeFilter ? <FaAngleUp /> : <FaAngleDown />}
            </Button>
          </h3>
          <Collapse isOpened={isOpenProductTypeFilter}>
            <div className="scroll px-3">
              {availableProductTypes.map((type) => (
                <FormControlLabel
                  key={type}
                  control={<Checkbox />}
                  checked={(props?.selectedProductTypes || []).includes(type)}
                  onChange={() => handleMultiSelect(props?.selectedProductTypes, props?.setSelectedProductTypes, type)}
                  label={type}
                  className="w-full"
                />
              ))}
            </div>
          </Collapse>
        </div>

        <div className="box mt-4">
          <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5">
            Filter By Price
            <Button className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]" onClick={() => setIsOpenPriceFilter(!isOpenPriceFilter)}>
              {isOpenPriceFilter ? <FaAngleUp /> : <FaAngleDown />}
            </Button>
          </h3>
          <Collapse isOpened={isOpenPriceFilter}>
            <div className="px-2">
              {availablePriceRanges.map((range) => (
                <FormControlLabel
                  key={range.value}
                  control={<Checkbox />}
                  checked={(props?.selectedPriceRanges || []).includes(range.value)}
                  onChange={() => handleMultiSelect(props?.selectedPriceRanges, props?.setSelectedPriceRanges, range.value)}
                  label={range.label}
                  className="w-full"
                />
              ))}
            </div>
          </Collapse>
        </div>

        <div className="box mt-4">
          <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5">
            Sale
            <Button className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]" onClick={() => setIsOpenSaleFilter(!isOpenSaleFilter)}>
              {isOpenSaleFilter ? <FaAngleUp /> : <FaAngleDown />}
            </Button>
          </h3>
          <Collapse isOpened={isOpenSaleFilter}>
            <div className="px-2">
              <FormControlLabel
                control={<Checkbox />}
                checked={props?.selectedSaleOnly}
                onChange={() => props?.setSelectedSaleOnly(!props?.selectedSaleOnly)}
                label="On Sale"
                className="w-full"
              />

            </div>
          </Collapse>
        </div>

        {availableColors?.length !== 0 &&
          <div className="box mt-4">
            <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5">
              Filter By Colour
               <Button className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]" onClick={() => setIsOpenColorFilter(!isOpenColorFilter)}>
                {isOpenColorFilter ? <FaAngleUp /> : <FaAngleDown />}
              </Button>
            </h3>

           <Collapse isOpened={isOpenColorFilter}>
              <div className="flex flex-col px-3">
                {availableColors?.map((color) => {
                  return (
                    <FormControlLabel
                      key={color?.name}
                      value={color?.name}
                      control={<Checkbox />}
                      checked={filters?.colors?.includes(color?.name)}
                      label={
                        <span className="flex items-center gap-2">
                          {color?.code &&
                            <span className="w-[14px] h-[14px] rounded-full border border-[rgba(0,0,0,0.2)]" style={{ background: color?.code }}></span>
                          }
                          <span>{color?.name}</span>
                        </span>
                      }
                      onChange={() => handleCheckboxChange("colors", color?.name)}
                      className="w-full"
                    />
                  );
                })}
              </div>
            </Collapse>
          </div>
        }

        <div className="box mt-4">
          <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5">
            Filter By Availability
            <Button className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]" onClick={() => setIsOpenStockFilter(!isOpenStockFilter)}>
              {isOpenStockFilter ? <FaAngleUp /> : <FaAngleDown />}
            </Button>
          </h3>
          <Collapse isOpened={isOpenStockFilter}>
            <div className="px-2">
              <FormControlLabel
                control={<Checkbox />}
                checked={props?.selectedStockStatus === "inStock"}
                onChange={() => props?.setSelectedStockStatus?.(props?.selectedStockStatus === "inStock" ? "all" : "inStock")}
                label="In Stock"
                className="w-full"
              />
              <FormControlLabel
                control={<Checkbox />}
                checked={props?.selectedStockStatus === "outOfStock"}
                onChange={() => props?.setSelectedStockStatus?.(props?.selectedStockStatus === "outOfStock" ? "all" : "outOfStock")}
                label="Out Of Stock"
                className="w-full"
              />
            </div>
          </Collapse>
        </div>

        <div className="box mt-4">
          <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5">
            Filter By Discount
            <Button className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]" onClick={() => setIsOpenDiscountFilter(!isOpenDiscountFilter)}>
              {isOpenDiscountFilter ? <FaAngleUp /> : <FaAngleDown />}
            </Button>
          </h3>
          <Collapse isOpened={isOpenDiscountFilter}>
            <div className="px-2">
              {discountBands.map((band) => (
                <FormControlLabel
                  key={band.min}
                  control={<Checkbox />}
                  checked={(props?.selectedDiscountRanges || []).includes(band.min)}
                  onChange={() => handleMultiSelect(props?.selectedDiscountRanges, props?.setSelectedDiscountRanges, band.min)}
                  label={band.label}
                  className="w-full"
                />
              ))}
            </div>
          </Collapse>
        </div>

        {availableWeights.length > 0 && <div className="box mt-4">
          <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5">
            Filter By Weight
            <Button className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]" onClick={() => setIsOpenWeightFilter(!isOpenWeightFilter)}>
              {isOpenWeightFilter ? <FaAngleUp /> : <FaAngleDown />}
            </Button>
          </h3>
          <Collapse isOpened={isOpenWeightFilter}>
            <div className="scroll px-3">
              {availableWeights.map((weight) => (
                <FormControlLabel
                  key={weight}
                  control={<Checkbox />}
                  checked={(props?.selectedWeights || []).includes(weight)}
                  onChange={() => handleMultiSelect(props?.selectedWeights, props?.setSelectedWeights, weight)}
                  label={weight}
                  className="w-full"
                />
              ))}
            </div>
          </Collapse>
        </div>}

        {availableRamOptions.length > 0 && <div className="box mt-4">
          <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5">
            Filter By RAM
            <Button className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]" onClick={() => setIsOpenRamFilter(!isOpenRamFilter)}>
              {isOpenRamFilter ? <FaAngleUp /> : <FaAngleDown />}
            </Button>
          </h3>
          <Collapse isOpened={isOpenRamFilter}>
            <div className="scroll px-3">
              {availableRamOptions.map((ram) => (
                <FormControlLabel
                  key={ram}
                  control={<Checkbox />}
                  checked={(props?.selectedRamOptions || []).includes(ram)}
                  onChange={() => handleMultiSelect(props?.selectedRamOptions, props?.setSelectedRamOptions, ram)}
                  label={ram}
                  className="w-full"
                />
              ))}
            </div>
          </Collapse>
        </div>}

        <div className="box mt-4">
          <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5">
            Filter Slder
          </h3>

          <RangeSlider value={price} onInput={setPrice} min={100} max={60000} setp={5} />
          <div className="flex pt-4 pb-2 priceRange">
            <span className="text-[13px]">
              From: <strong className="text-dark">Rs: {price[0]}</strong>
            </span>
            <span className="ml-auto text-[13px]">
              To: <strong className="text-dark">Rs: {price[1]}</strong>
            </span>
          </div>
        </div>

        <div className="box mt-4">
          <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5">
            Filter By Rating
             <Button className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]" onClick={() => setIsOpenRatingFilter(!isOpenRatingFilter)}>
              {isOpenRatingFilter ? <FaAngleUp /> : <FaAngleDown />}
            </Button>
          </h3>

             <Collapse isOpened={isOpenRatingFilter}>
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center pl-2 lg:pl-1">
                <FormControlLabel
                  value={rating}
                  control={<Checkbox />}
                  checked={filters?.rating?.includes(rating)}
                  onChange={() => handleCheckboxChange("rating", rating)}
                />
                <Rating name={`rating-${rating}`} value={rating} size="small" readOnly />
              </div>
            ))}
          </Collapse>
        </div>


      </div>
      <br />
       <div className="flex items-center gap-2 py-2">
        <Button className="btn-org w-full !bg-[#ff5252] !text-white" onClick={handleApplyFilters}>Apply</Button>
        <Button className="w-full !border !border-[#ff5252] !text-[#ff5252]" onClick={handleResetFilters}>Reset</Button>
      </div>
      <Button className="btn-org w-full !flex lg:!hidden mt-2" onClick={() => context?.setOpenFilter(false)}><MdOutlineFilterAlt size={20} /> Cancel</Button>


    </aside>
  );
};
