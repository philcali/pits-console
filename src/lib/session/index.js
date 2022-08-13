import SessionStorage from "./SessionStorage";
import { siteStorage } from "../storage";

export const siteSessions = new SessionStorage(siteStorage);