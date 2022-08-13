import CompositeStorage from "./CompositeStorage"
import CookieStorage from "./CookieStorage"
import LocalStorage from "./LocalStorage"

export const siteStorage = new CompositeStorage([new LocalStorage(), new CookieStorage()]);