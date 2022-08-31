import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

function PrivateRoute({ children }) {
    const auth = useAuth();
    const location = useLocation();
    if (auth.isLoggedIn() && location.pathname === '/') {
        return <Navigate to="/dashboard" state={{ from: location }} replace />;
    } else if (auth.isLoggedIn() || location.pathname === '/') {
        return children;
    } else {
        return <Navigate to="/" state={{ from: location }} replace />;
    }
}

export default PrivateRoute;