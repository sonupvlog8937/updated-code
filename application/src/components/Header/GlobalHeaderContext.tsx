import { createContext, useContext, useState, ReactNode } from 'react';

export interface GlobalHeaderContextType {
  isOpenCatPanel: boolean;
  setIsOpenCatPanel: (val: boolean) => void;
  quickMenuOpen: boolean;
  setQuickMenuOpen: (val: boolean) => void;
  showSearchBar: boolean;
  setShowSearchBar: (val: boolean) => void;
  isFilterBtnShow: boolean;
  setIsFilterBtnShow: (val: boolean) => void;
  openFilter: boolean;
  setOpenFilter: (val: boolean) => void;
}

const GlobalHeaderContext = createContext<GlobalHeaderContextType | undefined>(undefined);

export const GlobalHeaderProvider = ({ children }: { children: ReactNode }) => {
  const [isOpenCatPanel, setIsOpenCatPanel] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [isFilterBtnShow, setIsFilterBtnShow] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);

  const value: GlobalHeaderContextType = {
    isOpenCatPanel,
    setIsOpenCatPanel,
    quickMenuOpen,
    setQuickMenuOpen,
    showSearchBar,
    setShowSearchBar,
    isFilterBtnShow,
    setIsFilterBtnShow,
    openFilter,
    setOpenFilter,
  };

  return (
    <GlobalHeaderContext.Provider value={value}>
      {children}
    </GlobalHeaderContext.Provider>
  );
};

export const useGlobalHeader = (): GlobalHeaderContextType => {
  const context = useContext(GlobalHeaderContext);
  if (!context) {
    throw new Error('useGlobalHeader must be used within GlobalHeaderProvider');
  }
  return context;
};
