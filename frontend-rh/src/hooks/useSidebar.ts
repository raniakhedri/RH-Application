import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isExpanded: boolean;
  isMobileOpen: boolean;
  isHovered: boolean;
  openSubmenu: string | null;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setIsHovered: (hovered: boolean) => void;
  setOpenSubmenu: (submenu: string | null) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [openSubmenu, setOpenSubmenuState] = useState<string | null>(null);

  const toggleSidebar = useCallback(() => setIsExpanded((prev) => !prev), []);
  const toggleMobileSidebar = useCallback(() => setIsMobileOpen((prev) => !prev), []);

  const setOpenSubmenu = useCallback(
    (submenu: string | null) =>
      setOpenSubmenuState((prev) => (prev === submenu ? null : submenu)),
    []
  );

  // Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsExpanded(false);
        setIsMobileOpen(false);
      } else {
        setIsExpanded(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return React.createElement(SidebarContext.Provider, {
    value: {
      isExpanded,
      isMobileOpen,
      isHovered,
      openSubmenu,
      toggleSidebar,
      toggleMobileSidebar,
      setIsHovered,
      setOpenSubmenu,
    },
    children,
  });
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within SidebarProvider');
  return context;
};
