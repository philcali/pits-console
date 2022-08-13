import { siteSessions } from "../session";
import AuthService from "./AuthService";
import PitsService from "./PitsService";

export const authService = new AuthService(siteSessions);
export const pitsService = new PitsService(siteSessions);