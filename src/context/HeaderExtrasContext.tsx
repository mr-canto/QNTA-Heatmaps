import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface HeaderExtrasContextValue {
  extras: ReactNode | null;
  setExtras: (extras: ReactNode | null) => void;
}

const HeaderExtrasContext = createContext<HeaderExtrasContextValue | undefined>(
  undefined
);

export function HeaderExtrasProvider({ children }: { children: ReactNode }) {
  const [extras, setExtras] = useState<ReactNode | null>(null);
  const value = useMemo(() => ({ extras, setExtras }), [extras]);

  return (
    <HeaderExtrasContext.Provider value={value}>
      {children}
    </HeaderExtrasContext.Provider>
  );
}

export function useHeaderExtras() {
  const context = useContext(HeaderExtrasContext);
  if (!context) {
    throw new Error("useHeaderExtras must be used within HeaderExtrasProvider");
  }
  return context;
}
