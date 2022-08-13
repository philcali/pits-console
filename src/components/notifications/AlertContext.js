import { createContext, useContext } from "react";


export const AlertContext = createContext();

export function useAlerts() {
    return useContext(AlertContext);
}