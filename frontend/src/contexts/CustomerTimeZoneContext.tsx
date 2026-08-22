"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

const CustomerTimeZoneContext = createContext<string | null>(null);

export function CustomerTimeZoneProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const timeZone = useSyncExternalStore(
    () => () => undefined,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => null,
  );

  return (
    <CustomerTimeZoneContext.Provider value={timeZone}>
      {children}
    </CustomerTimeZoneContext.Provider>
  );
}

export const useCustomerTimeZone = () => useContext(CustomerTimeZoneContext);
