import { useState } from "react";
import { AuthContext } from "./AuthContext";
import { siteSessions } from "../../lib/session";
import { authService } from "../../lib/services";

function useProvideAuth() {
    const [ user, setUser ] = useState({
        session: siteSessions.sessionToken(),
        loading: true,
    });

    if (user.loading) {
        if (user.session) {
            authService.userInfo()
                .then(resp => {
                    setUser({
                        ...user,
                        ...resp,
                        loading: false
                    });
                })
                .catch(e => {
                    setUser({
                        ...user,
                        loading: false
                    });
                })
        } else {
            setUser({
                ...user,
                loading: false
            });
        }
    }

    let logout = () => {
        siteSessions.clear();
        setUser({
            loading: false,
            session: null
        });
    };

    let login = async (clientToken) => {
        siteSessions.update(clientToken);
        setUser({
            loading: true,
            session: siteSessions.sessionToken(),
        });
    };

    let isLoggedIn = () => {
        return !!siteSessions.sessionToken();
    };

    return {
        user,
        isLoggedIn,
        login,
        logout
    }
}

function ProvideAuth({ children }) {
    const auth = useProvideAuth();
    return (
        <AuthContext.Provider value={auth}>
            { children }
        </AuthContext.Provider>
    );
}

export default ProvideAuth;