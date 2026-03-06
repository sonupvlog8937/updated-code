import React, { useEffect, useMemo, useState } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import "../Sidebar/style.css";
import { Collapse } from "react-collapse";
import { FaAngleDown, FaAngleRight, FaAngleUp } from "react-icons/fa6";
import Button from "@mui/material/Button";
import RangeSlider from "react-range-slider-input";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
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
  const [activeMoreFilter, setActiveMoreFilter] = useState(null);
  const [moreFilterSelections, setMoreFilterSelections] = useState([]);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState([]);
  const [showMoreFilters, setShowMoreFilters] = useState(false);


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



  const [price, setPrice] = useState([0, 60000]);const [applyVersion, setApplyVersion] = useState(0);
  const [draftSelectedBrands, setDraftSelectedBrands] = useState([]);
  const [draftSelectedSizes, setDraftSelectedSizes] = useState([]);
  const [draftSelectedProductTypes, setDraftSelectedProductTypes] = useState([]);
  const [draftSelectedPriceRanges, setDraftSelectedPriceRanges] = useState([]);
  const [draftSelectedSaleOnly, setDraftSelectedSaleOnly] = useState(false);
  const [draftSelectedStockStatus, setDraftSelectedStockStatus] = useState("all");
  const [draftSelectedDiscountRanges, setDraftSelectedDiscountRanges] = useState([]);
  const [draftSelectedWeights, setDraftSelectedWeights] = useState([]);
  const [draftSelectedRamOptions, setDraftSelectedRamOptions] = useState([]);
  const [draftSelectedColors, setDraftSelectedColors] = useState([]);
  const [draftSelectedRatingBands, setDraftSelectedRatingBands] = useState([]);


  const context = useAppContext();

  const location = useLocation();

  const availableBrands = useMemo(() => {
    if (Array.isArray(props?.productsData?.filterOptions?.brands) && props?.productsData?.filterOptions?.brands?.length > 0) {
      return props.productsData.filterOptions.brands;
    }
    const items = props?.productsData?.products || [];
    return [...new Set(items.map((product) => product?.brand?.trim()).filter(Boolean))];
  }, [props?.productsData]);

  const availableSizes = useMemo(() => {
     if (Array.isArray(props?.productsData?.filterOptions?.sizes) && props?.productsData?.filterOptions?.sizes?.length > 0) {
      return props.productsData.filterOptions.sizes;
    }
    const sizeSet = new Set();
    (props?.productsData?.products || []).forEach((product) => {
      (product?.size || []).forEach((size) => {
        if (size) sizeSet.add(size);
      });
    });
    return Array.from(sizeSet);
  }, [props?.productsData]);

  const availableProductTypes = useMemo(() => {
     if (Array.isArray(props?.productsData?.filterOptions?.productTypes) && props?.productsData?.filterOptions?.productTypes?.length > 0) {
      return props.productsData.filterOptions.productTypes;
    }
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
     if (Array.isArray(props?.productsData?.filterOptions?.weights) && props?.productsData?.filterOptions?.weights?.length > 0) {
      return props.productsData.filterOptions.weights;
    }
    const weightSet = new Set();
    (props?.productsData?.products || []).forEach((product) => {
      (product?.productWeight || []).forEach((weight) => {
        if (weight) weightSet.add(weight);
      });
    });
    return Array.from(weightSet);
  }, [props?.productsData]);

  const availableRamOptions = useMemo(() => {
     if (Array.isArray(props?.productsData?.filterOptions?.ramOptions) && props?.productsData?.filterOptions?.ramOptions?.length > 0) {
      return props.productsData.filterOptions.ramOptions;
    }
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

  const toggleCategoryExpand = (categoryId) => {
    if (!categoryId) return;

    setExpandedCategoryIds((prev) => (
      prev.includes(categoryId)
        ? prev.filter((item) => item !== categoryId)
        : [...prev, categoryId]
    ));
  };

  const handleCategorySelect = ({ level, categoryId }) => {
    if (!categoryId) return;

    if (level === 0) {
      setFilters((prev) => ({
        ...prev,
        catId: [categoryId],
        subCatId: [],
        thirdsubCatId: [],
        colors: []
      }));
      return;
    }

    if (level === 1) {
      setFilters((prev) => ({
        ...prev,
        catId: [],
        subCatId: [categoryId],
        thirdsubCatId: [],
        colors: []
      }));
      return;
    }

    setFilters((prev) => ({
      ...prev,
      catId: [],
      subCatId: [],
      thirdsubCatId: [categoryId],
      colors: []
    }));
  };

  const renderCategoryTree = (categories = [], level = 0) => {
    if (!Array.isArray(categories) || categories.length === 0) return null;

    return categories.map((category) => {
      const hasChildren = (category?.children || []).length > 0;
      const isExpanded = expandedCategoryIds.includes(category?._id);
      const isSelected =
        (level === 0 && filters?.catId?.includes(category?._id)) ||
        (level === 1 && filters?.subCatId?.includes(category?._id)) ||
        (level >= 2 && filters?.thirdsubCatId?.includes(category?._id));

      return (
        <div key={category?._id} className={`${level > 0 ? "pl-4" : ""} py-1`}>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleCategoryExpand(category?._id)}
                className="text-[#777]"
              >
                {isExpanded ? <FaAngleDown size={12} /> : <FaAngleRight size={12} />}
              </button>
            ) : (
              <span className="w-3" />
            )}

            <button
              type="button"
              onClick={() => handleCategorySelect({ level, categoryId: category?._id })}
              className={`text-left text-[15px] ${isSelected ? "font-[700] text-[#111]" : "text-[#555]"}`}
            >
              {category?.name}
            </button>
          </div>

          {hasChildren && isExpanded && (
            <div className="mt-1">{renderCategoryTree(category?.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };


  const handleApplyFilters = () => {
    props?.setSelectedBrands?.(draftSelectedBrands);
    props?.setSelectedSizes?.(draftSelectedSizes);
    props?.setSelectedProductTypes?.(draftSelectedProductTypes);
    props?.setSelectedPriceRanges?.(draftSelectedPriceRanges);
    props?.setSelectedSaleOnly?.(draftSelectedSaleOnly);
    props?.setSelectedStockStatus?.(draftSelectedStockStatus);
    props?.setSelectedDiscountRanges?.(draftSelectedDiscountRanges);
    props?.setSelectedWeights?.(draftSelectedWeights);
    props?.setSelectedRamOptions?.(draftSelectedRamOptions);
    props?.setSelectedColors?.(draftSelectedColors);
    props?.setSelectedRatingBands?.(draftSelectedRatingBands);
    setApplyVersion((prev) => prev + 1);
    context?.setOpenFilter(false);
  };

  const openMoreFilterModal = (config) => {
    setActiveMoreFilter(config);
    setMoreFilterSelections(config?.selectedValues || []);
  };

  const closeMoreFilterModal = () => {
    setActiveMoreFilter(null);
    setMoreFilterSelections([]);
  };

  const toggleMoreFilterSelection = (optionKey) => {
    setMoreFilterSelections((prev) => (
      prev.includes(optionKey)
        ? prev.filter((item) => item !== optionKey)
        : [...prev, optionKey]
    ));
  };

  const applyMoreFilterSelection = () => {
    activeMoreFilter?.onApplySelection?.(moreFilterSelections);
    closeMoreFilterModal();
    context?.setOpenFilter(false);
  };

  const renderLimitedOptions = ({
    title,
    options = [],
    selectedValues = [],
    onToggle,
    onApplySelection,
    getOptionKey,
    getOptionLabel,
    containerClassName = "scroll px-3"
  }) => {
    

    return (
      <>
        <div className={containerClassName}>
            {options.map((option) => {
            const optionKey = getOptionKey(option);
            return (
              <FormControlLabel
                key={optionKey}
                control={<Checkbox />}
                checked={selectedValues.includes(optionKey)}
                onChange={() => onToggle(option)}
                label={getOptionLabel(option)}
                className="w-full"
              />
            );
          })}
        </div>

        
      </>
    );
  };


  const handleResetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      catId: [],
      subCatId: [],
      thirdsubCatId: [],
      rating: [],
      colors: []
    }));
    setPrice([0, 60000]);
    props?.onResetAllFilters?.();
    context?.setOpenFilter(false);
  };


  useEffect(() => {

    
    const queryParameters = new URLSearchParams(location.search);
    const categoryId = queryParameters.get("catId");
    const subcategoryId = queryParameters.get("subCatId");
    const thirdcategoryId = queryParameters.get("thirdLavelCatId");

    if (!categoryId && !subcategoryId && !thirdcategoryId) return;


     setFilters((prev) => ({
      ...prev,
      catId: categoryId ? [categoryId] : [],
      subCatId: subcategoryId ? [subcategoryId] : [],
      thirdsubCatId: thirdcategoryId ? [thirdcategoryId] : [],
      rating: [],
      page: 1,
    }));
    context?.setSearchData([]);
  }, [location.search]);



  const filtesData = () => {
    const hasSearchProp = typeof props?.searchQuery === "string";
    const queryValue = (props?.searchQuery || "").trim();

    if (hasSearchProp && !queryValue) {
      props?.setProductsData?.({ products: [], totalPages: 1, totalPost: 0, currentPage: 1 });
      props?.setTotalPages?.(1);
      props?.setIsLoading?.(false);
      return;
    }
    props.setIsLoading(true);

    //console.log(context?.searchData)

     const requestPayload = {
      ...filters,
      page: props?.page || 1,
      brands: draftSelectedBrands || [],
      sizes: draftSelectedSizes || [],
      productTypes: draftSelectedProductTypes || [],
      priceRanges: draftSelectedPriceRanges || [],
      saleOnly: draftSelectedSaleOnly || false,
      stockStatus: draftSelectedStockStatus || "all",
      discountRanges: draftSelectedDiscountRanges || [],
      weights: draftSelectedWeights || [],
      ramOptions: draftSelectedRamOptions || [],
      ratingBands: (draftSelectedRatingBands || []).map((rating) => ({
        min: Number(rating),
        max: Number(rating) >= 5 ? null : Number(rating) + 1,
      })),
      sortType: props?.selectedSortType || "bestSeller",
      query: queryValue,
    };

    const apiUrl = props?.searchQuery ? `/api/product/search/get` : `/api/product/filters`;

     postData(apiUrl, requestPayload).then((res) => {
      if (hasSearchProp) {
        context?.setSearchData?.(res);
      }
      props.setProductsData(res);
      props.setIsLoading(false);
      props.setTotalPages(res?.totalPages || 1)
      window.scrollTo(0, 0);
     })


  }



  useEffect(() => {
    filtesData();
  }, [props.page, props.selectedSortType, props.searchQuery, applyVersion])


  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      minPrice: price[0],
      maxPrice: price[1]
    }))
  }, [price]);

   useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      page: props?.page || 1,
    }));
  }, [props?.page]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      colors: draftSelectedColors || [],
      rating: draftSelectedRatingBands || [],
    }));
  }, [draftSelectedColors, draftSelectedRatingBands]);

  useEffect(() => {
    setDraftSelectedBrands(props?.selectedBrands || []);
    setDraftSelectedSizes(props?.selectedSizes || []);
    setDraftSelectedProductTypes(props?.selectedProductTypes || []);
    setDraftSelectedPriceRanges(props?.selectedPriceRanges || []);
    setDraftSelectedSaleOnly(props?.selectedSaleOnly || false);
    setDraftSelectedStockStatus(props?.selectedStockStatus || "all");
    setDraftSelectedDiscountRanges(props?.selectedDiscountRanges || []);
    setDraftSelectedWeights(props?.selectedWeights || []);
    setDraftSelectedRamOptions(props?.selectedRamOptions || []);
    setDraftSelectedColors(props?.selectedColors || []);
    setDraftSelectedRatingBands(props?.selectedRatingBands || []);
  }, [
    props?.selectedBrands,
    props?.selectedSizes,
    props?.selectedProductTypes,
    props?.selectedPriceRanges,
    props?.selectedSaleOnly,
    props?.selectedStockStatus,
    props?.selectedDiscountRanges,
    props?.selectedWeights,
    props?.selectedRamOptions,
    props?.selectedColors,
    props?.selectedRatingBands,
  ]);

  useEffect(() => {
    const colorMap = new Map();

    const availableColorOptions = props?.productsData?.filterOptions?.colors;
    if (Array.isArray(availableColorOptions) && availableColorOptions.length > 0) {
      setAvailableColors(availableColorOptions.map((name) => ({ name, code: "" })));
      return;
    }

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
      <div className="sidebarFiltersScroll max-h-[60vh] lg:max-h-[calc(100vh-190px)] overflow-y-auto overflow-x-hidden w-full pr-1">
        <div className="box">
          <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5">
            Shop by Category
            <Button className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]" onClick={() => setIsOpenCategoryFilter(!isOpenCategoryFilter)}>
              {isOpenCategoryFilter === true ? <FaAngleUp /> : <FaAngleDown />}
            </Button>
          </h3>
          <Collapse isOpened={isOpenCategoryFilter}>
            <div className="max-h-[260px] overflow-y-auto pr-2">
              {renderCategoryTree(context?.catData || [])}
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
            {renderLimitedOptions({
              title: "Filter By Brand",
              options: availableBrands,
              selectedValues: draftSelectedBrands || [],
              onToggle: (brand) => handleMultiSelect(draftSelectedBrands, setDraftSelectedBrands, brand),
              onApplySelection: (values) => setDraftSelectedBrands(values),
              getOptionKey: (brand) => brand,
              getOptionLabel: (brand) => brand
            })}
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
            {renderLimitedOptions({
              title: "Filter By Size",
              options: availableSizes,
              selectedValues: draftSelectedSizes || [],
              onToggle: (size) => handleMultiSelect(draftSelectedSizes, setDraftSelectedSizes, size),
              onApplySelection: (values) => setDraftSelectedSizes(values),
              getOptionKey: (size) => size,
              getOptionLabel: (size) => size
            })}
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
            {renderLimitedOptions({
              title: "Filter By Product Type",
              options: availableProductTypes,
              selectedValues: draftSelectedProductTypes || [],
              onToggle: (type) => handleMultiSelect(draftSelectedProductTypes, setDraftSelectedProductTypes, type),
              onApplySelection: (values) => setDraftSelectedProductTypes(values),
              getOptionKey: (type) => type,
              getOptionLabel: (type) => type
            })}
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
            {renderLimitedOptions({
              title: "Filter By Price",
              options: availablePriceRanges,
              selectedValues: props?.selectedPriceRanges || [],
              onToggle: (range) => handleMultiSelect(props?.selectedPriceRanges, props?.setSelectedPriceRanges, range.value),
              onApplySelection: (values) => props?.setSelectedPriceRanges?.(values), selectedValues: draftSelectedPriceRanges || [],
              onToggle: (range) => handleMultiSelect(draftSelectedPriceRanges, setDraftSelectedPriceRanges, range.value),
              onApplySelection: (values) => setDraftSelectedPriceRanges(values),
              getOptionKey: (range) => range.value,
              getOptionLabel: (range) => range.label,
              containerClassName: "px-2"
            })}
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
                checked={draftSelectedSaleOnly}
                onChange={() => setDraftSelectedSaleOnly(!draftSelectedSaleOnly)}
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
              {renderLimitedOptions({
                title: "Filter By Colour",
                options: availableColors,
                selectedValues: draftSelectedColors || [],
                onToggle: (color) => handleMultiSelect(draftSelectedColors || [], setDraftSelectedColors, color?.name),
                onApplySelection: (values) => setDraftSelectedColors(values),
                getOptionKey: (color) => color?.name,
                getOptionLabel: (color) => (
                  <span className="flex items-center gap-2">
                    {color?.code && <span className="w-[14px] h-[14px] rounded-full border border-[rgba(0,0,0,0.2)]" style={{ background: color?.code }}></span>}
                    <span>{color?.name}</span>
                  </span>
                ),
                containerClassName: "flex flex-col px-3"
              })}
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
                checked={draftSelectedStockStatus === "inStock"}
                onChange={() => setDraftSelectedStockStatus(draftSelectedStockStatus === "inStock" ? "all" : "inStock")}
                label="In Stock"
                className="w-full"
              />
              <FormControlLabel
                control={<Checkbox />}
                checked={draftSelectedStockStatus === "outOfStock"}
                onChange={() => setDraftSelectedStockStatus(draftSelectedStockStatus === "outOfStock" ? "all" : "outOfStock")}
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
            {renderLimitedOptions({
              title: "Filter By Discount",
              options: discountBands,
             selectedValues: draftSelectedDiscountRanges || [],
              onToggle: (band) => handleMultiSelect(draftSelectedDiscountRanges, setDraftSelectedDiscountRanges, band.min),
              onApplySelection: (values) => setDraftSelectedDiscountRanges(values),
              getOptionKey: (band) => band.min,
              getOptionLabel: (band) => band.label,
              containerClassName: "px-2"
            })}
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
            {renderLimitedOptions({
              title: "Filter By Weight",
              options: availableWeights,
              selectedValues: draftSelectedWeights || [],
              onToggle: (weight) => handleMultiSelect(draftSelectedWeights, setDraftSelectedWeights, weight),
              onApplySelection: (values) => setDraftSelectedWeights(values),
              getOptionKey: (weight) => weight,
              getOptionLabel: (weight) => weight
            })}
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
            {renderLimitedOptions({
              title: "Filter By RAM",
              options: availableRamOptions,
              selectedValues: draftSelectedRamOptions || [],
              onToggle: (ram) => handleMultiSelect(draftSelectedRamOptions, setDraftSelectedRamOptions, ram),
              onApplySelection: (values) => setDraftSelectedRamOptions(values),
              getOptionKey: (ram) => ram,
              getOptionLabel: (ram) => ram
            })}
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
                  checked={(draftSelectedRatingBands || []).includes(rating)}
                  onChange={() => handleMultiSelect(draftSelectedRatingBands || [], setDraftSelectedRatingBands, rating)}
                />
                <Rating name={`rating-${rating}`} value={rating} size="small" readOnly />
              </div>
            ))}
          </Collapse>
        </div>
         

        {/* <div className="flex items-center gap-2 py-3 mt-3">
          <Button className="btn-org w-full !bg-[#ff5252] !text-white" onClick={handleApplyFilters}>
            Applya {props?.activeFiltersCount > 0 && <span className="ml-1">({props.activeFiltersCount})</span>}
          </Button>
          <Button className="w-full !border !border-[#ff5252] !text-[#ff5252]" onClick={handleResetFilters}>Reset</Button>
        </div> */}


      </div>
      <br />
      <div className="flex items-center gap-2 py-2">
        <Button className="btn-org w-full !bg-[#ff5252] !text-white" onClick={handleApplyFilters}>
          Apply  <span className="ml-1">({props.activeFiltersCount})</span>
        </Button>
        <Button className="w-full !border !border-[#ff5252] !text-[#ff5252]" onClick={handleResetFilters}>Reset</Button>
      </div>
      <Button className="btn-org w-full !flex lg:!hidden mt-2" onClick={() => context?.setOpenFilter(false)}><MdOutlineFilterAlt size={20} /> Cancel</Button>

      <Dialog open={Boolean(activeMoreFilter)} onClose={closeMoreFilterModal} fullWidth maxWidth="sm">
        <DialogTitle className="!font-[700] !text-[18px] !pb-2">{activeMoreFilter?.title}</DialogTitle>
        <DialogContent>
          <p className="text-[13px] text-[#666] mb-3">Select filters and apply directly from this list.</p>
          <div className="max-h-[60vh] overflow-auto px-4">
            {(activeMoreFilter?.options || []).map((option) => {
              const optionKey = activeMoreFilter?.getOptionKey?.(option);
              return (
                <FormControlLabel
                  key={optionKey}
                  control={<Checkbox />}
                  checked={moreFilterSelections.includes(optionKey)}
                  onChange={() => toggleMoreFilterSelection(optionKey)}
                  label={activeMoreFilter?.getOptionLabel?.(option)}
                  className="w-full"
                />
              );
            })}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={closeMoreFilterModal} className="!text-[#555]">Cancel</Button>
            <Button onClick={applyMoreFilterSelection} className="!bg-[#111] !text-white !px-5">Apply</Button>
          </div>
        </DialogContent>
      </Dialog>

    </aside>
  );
};
