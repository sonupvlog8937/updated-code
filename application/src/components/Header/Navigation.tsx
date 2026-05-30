import React, { useEffect, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { useAppContext } from "../../hooks/useAppContext";
import { useGlobalHeader } from "./GlobalHeaderContext";
import CategoryPanel from "./CategoryPanel";
import MobileNav from "./MobileNav";

const Navigation: React.FC = () => {
  const [catData, setCatData] = useState<any[]>([]);
  const context = useAppContext();
  const { width: windowWidth } = useWindowDimensions();
  const headerState = useGlobalHeader();

  useEffect(() => {
    setCatData(context?.catData ?? []);
  }, [context?.catData]);

  return (
    <View>
      {/* Category Panel */}
      {catData?.length !== 0 && (
        <CategoryPanel
          isOpenCatPanel={headerState.isOpenCatPanel}
          setIsOpenCatPanel={headerState.setIsOpenCatPanel}
          data={catData}
        />
      )}

      {/* Mobile Bottom Nav — only on narrow screens */}
      {windowWidth < 992 && <MobileNav />}
    </View>
  );
};

export default Navigation;
