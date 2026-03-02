import React from "react";
import "../bannerBoxV2/style.css";
import { Link } from "react-router-dom";

const BannerBoxV2 = ({ image, item }) => {
  if (!item) return null;

             const destination =
    item?.subCatId !== undefined && item?.subCatId !== null && item?.subCatId !== ""
      ? `/products?subCatId=${item?.subCatId}`
      : `/products?catId=${item?.catId}`;

  return (
    <Link
      to={destination}
      className="bannerBoxV2 box group w-full rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="bannerBoxV2__media">
        <img
          src={image}
          alt={item?.bannerTitle || "Promotional banner"}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="bannerBoxV2__content">
        <p className="bannerBoxV2__label">Limited offer</p>
        <h2 className="bannerBoxV2__title">{item?.bannerTitle}</h2>
        <div className="bannerBoxV2__meta">
          <span className="bannerBoxV2__price">₹{item?.price}</span>
          <span className="bannerBoxV2__cta">Shop now</span>


        </div>
      </div>
    </Link>
  );
};

export default BannerBoxV2;
