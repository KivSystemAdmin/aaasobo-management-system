import { useEffect, useState } from "react";

// Get the active tab from the local storage.
export function useTabSelect(key: string) {
  const [initialActiveTab, setInitialActiveTab] = useState(0);
  const [isTabInitialized, setIsTabInitialized] = useState(false);

  useEffect(() => {
    const handleTabSelection = () => {
      const tabFromSession = localStorage.getItem(key);
      if (tabFromSession) {
        setInitialActiveTab(parseInt(tabFromSession));
      }
      setIsTabInitialized(true);
    };

    handleTabSelection();
  }, [key]);

  return { initialActiveTab, isTabInitialized };
}
