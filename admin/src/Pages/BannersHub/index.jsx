import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, Chip } from "@mui/material";
import { RiGalleryLine } from "react-icons/ri";
import { TbCategoryPlus } from "react-icons/tb";
import { MdLocalOffer, MdSlideshow } from "react-icons/md";
import { PiLinkSimpleBold } from "react-icons/pi";

const items = [
  {
    title: "Sidebar Banners",
    description: "Manage sidebar promotional banners and placements.",
    tag: "Navigation",
    link: "/bannerV1/list",
    icon: <RiGalleryLine className="text-[22px] text-indigo-600" />,
  },
  {
    title: "Category Banners",
    description: "Configure category section banners for discovery pages.",
    tag: "Catalog",
    link: "/bannerlist2/List",
    icon: <TbCategoryPlus className="text-[22px] text-emerald-600" />,
  },
  {
    title: "Offer Banners",
    description: "Setup seasonal offers and discount campaign visuals.",
    tag: "Campaign",
    link: "/bannerV1/list",
    icon: <MdLocalOffer className="text-[22px] text-rose-600" />,
  },
  {
    title: "Footer Banners",
    description: "Control footer trust and CTA banner sections.",
    tag: "Branding",
    link: "/bannerlist2/List",
    icon: <PiLinkSimpleBold className="text-[22px] text-amber-600" />,
  },
  {
    title: "Deals Slider",
    description: "Curate deal cards for dynamic slider components.",
    tag: "Conversion",
    link: "/homeSlider/list",
    icon: <MdSlideshow className="text-[22px] text-cyan-600" />,
  },
  {
    title: "Featured Slider",
    description: "Manage hero featured slider for home experience.",
    tag: "Homepage",
    link: "/homeSlider/list",
    icon: <MdSlideshow className="text-[22px] text-violet-600" />,
  },
];

const BannersHub = () => {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-[22px] font-[700] text-slate-800">Banner Management</h2>
        <p className="text-[13px] text-slate-500">Professional control center for all visual merchandising surfaces.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => (
          <Link to={item.link} key={item.title}>
            <Card className="!rounded-xl !border !border-slate-200 hover:!border-indigo-300 !shadow-sm hover:!shadow-md !transition-all !duration-200 h-full">
              <CardContent>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-[44px] h-[44px] rounded-lg bg-slate-100 flex items-center justify-center">{item.icon}</div>
                  <Chip size="small" label={item.tag} className="!bg-slate-100" />
                </div>
                <h3 className="text-[16px] font-[700] text-slate-800 mb-1">{item.title}</h3>
                <p className="text-[13px] text-slate-600">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BannersHub;