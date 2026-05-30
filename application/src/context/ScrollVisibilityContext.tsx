import React, { createContext, useContext, useState } from 'react';

interface ScrollVisibilityContextType {
  isTabsVisible: boolean;
  setIsTabsVisible: (visible: boolean) => void;
}

const ScrollVisibilityContext = createContext<ScrollVisibilityContextType | undefined>(undefined);

export const ScrollVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTabsVisible, setIsTabsVisible] = useState(true);

  return (
    <ScrollVisibilityContext.Provider value={{ isTabsVisible, setIsTabsVisible }}>
      {children}
    </ScrollVisibilityContext.Provider>
  );
};

export const useTabsVisibility = () => {
  const context = useContext(ScrollVisibilityContext);
  if (!context) {
    throw new Error('useTabsVisibility must be used within ScrollVisibilityProvider');
  }
  return context;
};
