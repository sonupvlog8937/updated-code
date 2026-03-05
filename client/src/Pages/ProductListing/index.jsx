import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import ProductItem from "../../components/ProductItem";
import ProductItemListView from "../../components/ProductItemListView";
import Button from "@mui/material/Button";
import { IoGridSharp } from "react-icons/io5";
import { LuMenu } from "react-icons/lu";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import ProductLoadingGrid from "../../components/ProductLoading/productLoadingGrid";
import { postData } from "../../utils/api";
import { useAppContext } from "../../hooks/useAppContext";
import { MdOutlineFilterAlt } from "react-icons/md";

const ProductListing = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const [productsData, setProductsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedSortVal, setSelectedSortVal] = useState("Best Seller");
  const [selectedSortType, setSelectedSortType] = useState("bestSeller");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const [selectedSaleOnly, setSelectedSaleOnly] = useState(false);
  const [selectedStockStatus, setSelectedStockStatus] = useState("all");
  const [selectedDiscountRanges, setSelectedDiscountRanges] = useState([]);
  const [selectedWeights, setSelectedWeights] = useState([]);
  const [selectedRamOptions, setSelectedRamOptions] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedRatingBands, setSelectedRatingBands] = useState([]);
  const context = useAppContext();
  const activeFiltersCount = useMemo(() => (
    selectedBrands.length +
    selectedSizes.length +
    selectedProductTypes.length +
    selectedPriceRanges.length +
    (selectedSaleOnly ? 1 : 0) +
    (selectedStockStatus !== "all" ? 1 : 0) +
    selectedDiscountRanges.length +
    selectedWeights.length +
    selectedRamOptions.length +
    selectedColors.length +
    selectedRatingBands.length
  ), [
    selectedBrands,
    selectedSizes,
    selectedProductTypes,
    selectedPriceRanges,
    selectedSaleOnly,
    selectedStockStatus,
    selectedDiscountRanges,
    selectedWeights,
    selectedRamOptions,
    selectedColors,
    selectedRatingBands,
  ]);
  const resetAllFilters = () => {
    setSelectedBrands([]);
    setSelectedSizes([]);
    setSelectedProductTypes([]);
    setSelectedPriceRanges([]);
    setSelectedSaleOnly(false);
    setSelectedStockStatus("all");
    setSelectedDiscountRanges([]);
    setSelectedWeights([]);
    setSelectedRamOptions([]);
    setSelectedColors([]);
    setSelectedRatingBands([]);
  };

  const getProductType = (product) => {
    return product?.productType || product?.thirdSubCatName || product?.subCatName || product?.catName || "";
  };

  const getProductTimestamp = (product) => {
    const dateString = product?.createdAt || product?.updatedAt || product?.date;
    const parsed = new Date(dateString).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  };



  const filteredProducts = useMemo(() => {
    const allProducts = productsData?.products || [];

    const productsAfterFilters = allProducts.filter((product) => {
      if (selectedBrands.length > 0) {
        const productBrand = product?.brand?.trim();
        if (!selectedBrands.includes(productBrand)) {
          return false;
        }
      }

      if (selectedSizes.length > 0) {
        const productSizes = product?.size || [];
        const hasMatchingSize = productSizes.some((size) => selectedSizes.includes(size));

        if (!hasMatchingSize) {
          return false;
        }
      }

      if (selectedProductTypes.length > 0) {
        const productType = getProductType(product);

        if (!selectedProductTypes.includes(productType)) {
          return false;
        }
      }

      if (selectedPriceRanges.length > 0) {
        const productPrice = Number(product?.price || 0);
        const hasMatchingPriceRange = selectedPriceRanges.some((range) => {
          const [minPrice, maxPrice] = range.split("-").map(Number);
          return productPrice >= minPrice && productPrice <= maxPrice;
        });

        if (!hasMatchingPriceRange) {
          return false;
        }
      }

      if (selectedSaleOnly && !Number(product?.discount || 0)) {
        return false;
      }

      if (selectedStockStatus === "inStock" && Number(product?.countInStock || 0) <= 0) {
        return false;
      }

      if (selectedStockStatus === "outOfStock" && Number(product?.countInStock || 0) > 0) {
        return false;
      }

      if (selectedDiscountRanges.length > 0) {
        const productDiscount = Number(product?.discount || 0);
        const matchesDiscountBand = selectedDiscountRanges.some((minimumDiscount) => productDiscount >= minimumDiscount);
        if (!matchesDiscountBand) {
          return false;
        }
      }

      if (selectedWeights.length > 0) {
        const productWeights = product?.productWeight || [];
        const hasMatchingWeight = productWeights.some((weight) => selectedWeights.includes(weight));
        if (!hasMatchingWeight) {
          return false;
        }
      }

      if (selectedRamOptions.length > 0) {
        const productRamOptions = product?.productRam || [];
        const hasMatchingRam = productRamOptions.some((ram) => selectedRamOptions.includes(ram));
        if (!hasMatchingRam) {
          return false;
        }
      }

      if (selectedColors.length > 0) {
        const productColors = Array.isArray(product?.colorOptions)
          ? product.colorOptions.map((colorItem) => colorItem?.name?.toLowerCase().trim()).filter(Boolean)
          : [];
        const hasMatchingColor = selectedColors.some((colorName) => productColors.includes(colorName.toLowerCase()));
        if (!hasMatchingColor) {
          return false;
        }
      }

      if (selectedRatingBands.length > 0) {
        const productRating = Number(product?.rating || 0);
        const hasMatchingRatingBand = selectedRatingBands.some(({ min, max }) =>
          max === null ? productRating >= min : productRating >= min && productRating < max,
        );
        if (!hasMatchingRatingBand) {
          return false;
        }
      }


      return true;
    });

    return [...productsAfterFilters].sort((a, b) => {

      if (selectedSortType === "bestSeller") {
        return Number(b?.sale || 0) - Number(a?.sale || 0);
      }

      if (selectedSortType === "latest") {
        return getProductTimestamp(b) - getProductTimestamp(a);
      }

      if (selectedSortType === "popular") {
        const ratingDifference = Number(b?.rating || 0) - Number(a?.rating || 0);

        if (ratingDifference !== 0) {
          return ratingDifference;
        }

        return Number(b?.sale || 0) - Number(a?.sale || 0);
      }

      if (selectedSortType === "featured") {
        const featuredDifference =
          Number(Boolean(b?.isFeatured)) - Number(Boolean(a?.isFeatured));

        if (featuredDifference !== 0) {
          return featuredDifference;
        }

        return Number(b?.sale || 0) - Number(a?.sale || 0);
      } 

      return 0;
    });
  }, [productsData, selectedSortType, selectedBrands, selectedSizes, selectedProductTypes, selectedPriceRanges, selectedSaleOnly, selectedStockStatus, selectedDiscountRanges, selectedWeights, selectedRamOptions, selectedColors, selectedRatingBands]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };



  const handleSortBy = (value, type) => {
    setSelectedSortVal(value);
    setSelectedSortType(type);
    setAnchorEl(null);
  };

  return (
    <section className=" pb-0">

      <div className="bg-white p-2">
        <div className="container flex gap-3">
          <div className={`sidebarWrapper fixed -bottom-[100%] left-0 w-full lg:h-full lg:static lg:w-[20%] bg-white z-[102] lg:z-[100] p-3 lg:p-0  transition-all lg:opacity-100 opacity-0 ${context?.openFilter === true ? 'open' : ''}`}>
            <Sidebar
              productsData={productsData}
              setProductsData={setProductsData}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              page={page}
              setTotalPages={setTotalPages}
              selectedBrands={selectedBrands}
              setSelectedBrands={setSelectedBrands}
              selectedSizes={selectedSizes}
              setSelectedSizes={setSelectedSizes}
              selectedProductTypes={selectedProductTypes}
              setSelectedProductTypes={setSelectedProductTypes}
              selectedPriceRanges={selectedPriceRanges}
              setSelectedPriceRanges={setSelectedPriceRanges}
              selectedSaleOnly={selectedSaleOnly}
              setSelectedSaleOnly={setSelectedSaleOnly}
              selectedStockStatus={selectedStockStatus}
              setSelectedStockStatus={setSelectedStockStatus}
              selectedDiscountRanges={selectedDiscountRanges}
              setSelectedDiscountRanges={setSelectedDiscountRanges}
              selectedWeights={selectedWeights}
              setSelectedWeights={setSelectedWeights}
              selectedRamOptions={selectedRamOptions}
              setSelectedRamOptions={setSelectedRamOptions}
              activeFiltersCount={activeFiltersCount}
              onResetAllFilters={resetAllFilters}
            />
          </div>

          {
            context?.windowWidth < 992 &&
            <div className={`filter_overlay w-full h-full bg-[rgba(0,0,0,0.5)] fixed top-0 left-0 z-[101]  ${context?.openFilter === true ? 'block' : 'hidden'}`}
              onClick={() => context?.setOpenFilter(false)}
            ></div>
          }


          <div className="rightContent w-full lg:w-[80%] py-3">
            <div className="bg-[#f1f1f1] p-2 w-full mb-4 rounded-md flex items-center justify-between sticky top-[135px] z-[99]">
              <div className="col1 flex items-center itemViewActions gap-2">
                <Button
                  onClick={() => context?.setOpenFilter(true)}
                  className="!text-[12px] !capitalize !rounded-full !bg-[#ff5252] !text-white !border-[#ff5252]"
                >
                  <MdOutlineFilterAlt className="mr-1" size={20} />
                  <b className="text-[14px]">Filters</b>
                  {activeFiltersCount > 0 && <span className="ml-1 text-[13px]">({activeFiltersCount})</span>}
                </Button>

              </div>

              <div className="col2 ml-auto flex items-center justify-end gap-3 pr-4">
                <span className="text-[14px] font-[500] pl-3 text-[rgba(0,0,0,0.7)]">
                  Sort By
                </span>

                <Button
                  id="basic-button"
                  aria-controls={open ? "basic-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? "true" : undefined}
                  onClick={handleClick}
                  className="!bg-white !text-[12px] !text-[#000] !capitalize !border-2 
                  !border-[#000]"
                >
                  {selectedSortVal}
                </Button>

                <Menu
                  id="basic-menu"
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  MenuListProps={{
                    "aria-labelledby": "basic-button",
                  }}
                >
                  <MenuItem
                    onClick={() => handleSortBy('Best Seller', 'bestSeller')}
                    className="!text-[13px] !text-[#000] !capitalize"
                  >
                    Best Seller
                  </MenuItem>


                  <MenuItem
                    onClick={() => handleSortBy('Latest', 'latest')}
                    className="!text-[13px] !text-[#000] !capitalize"
                  >
                    Latest
                  </MenuItem>


                  <MenuItem
                    onClick={() => handleSortBy('Popular', 'popular')}
                    className="!text-[13px] !text-[#000] !capitalize"
                  >
                    Popular
                  </MenuItem>


                  <MenuItem
                    onClick={() => handleSortBy('Featured', 'featured')}
                    className="!text-[13px] !text-[#000] !capitalize"
                  >
                    Featured
                  </MenuItem>

                </Menu>
              </div>
            </div>




            <div

              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            >
              {
                isLoading === true ? <ProductLoadingGrid view="grid" />
                  :
                  filteredProducts?.length !== 0 && filteredProducts?.map((item, index) => {
                    return (
                      <ProductItem key={item?._id || item?.id || index} item={item} />
                    )
                  })

              }
            </div>

            {
              totalPages > 1 &&
              <div className="flex items-center justify-center mt-10">
                <Pagination
                  showFirstButton showLastButton
                  count={totalPages}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                />
              </div>
            }


          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductListing;
