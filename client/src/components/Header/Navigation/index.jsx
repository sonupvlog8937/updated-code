import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { GoRocket } from "react-icons/go";
import CategoryPanel from "./CategoryPanel";

import "../Navigation/style.css";
import { useAppContext } from "../../../hooks/useAppContext";
import MobileNav from "./MobileNav";

const Navigation = (props) => {
  const [isOpenCatPanel, setIsOpenCatPanel] = useState(false);
  const [catData, setCatData] = useState([]);

  const context = useAppContext();

  useEffect(() => {
    setCatData(context?.catData);
  }, [context?.catData]);

  useEffect(() => {
    setIsOpenCatPanel(props.isOpenCatPanel);
  }, [props.isOpenCatPanel])


  return (
    <>
      

      {/* category panel component */}
      {
        catData?.length !== 0 &&
        <CategoryPanel
          isOpenCatPanel={isOpenCatPanel}
          setIsOpenCatPanel={setIsOpenCatPanel}
          propsSetIsOpenCatPanel={props.setIsOpenCatPanel}
          data={catData}
        />
      }


      {
        context?.windowWidth < 992 && <MobileNav />
      }



    </>
  );
};

export default Navigation;
