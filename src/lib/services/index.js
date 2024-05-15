import { siteSessions } from "../session";
import AuthService from "./AuthService";
import DataService from "./DataService";
import PitsService from "./PitsService";

export const authService = new AuthService(siteSessions);
export const pitsService = new PitsService(siteSessions);
export const dataService = new DataService(siteSessions, pitsService);