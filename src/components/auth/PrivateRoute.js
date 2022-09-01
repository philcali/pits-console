import { Navigate, useLocation } from "react-router-dom";
import { authService } from "../../lib/services";
import { useAuth } from "./AuthContext";

function PrivateRoute({ children }) {
    const auth = useAuth();
    const location = useLocation();
    if (auth.isLoggedIn() && location.pathname === '/') {
        return <Navigate to="/dashboard" state={{ from: location }} replace />;
    } else if (auth.isLoggedIn() || location.pathname === '/') {
        return children;
    } else {
        window.location.href = authService.loginEndpoint(window.location.origin, location.pathname);
    }
}

export default PrivateRoute;