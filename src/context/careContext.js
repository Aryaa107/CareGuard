import { createContext, useContext } from "react";

export const CareContext = createContext(null);

export function useCare() {
  const ctx = useContext(CareContext);
  if (!ctx) throw new Error("useCare must be used inside CareProvider");
  return ctx;
}
