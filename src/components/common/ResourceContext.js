import { createContext, useContext } from "react";

export const ResourceContext = createContext();

export function useResource() {
    return useContext(ResourceContext);
}