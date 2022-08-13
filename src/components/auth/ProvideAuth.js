import { useState } from "react";
import { AuthContext } from "./AuthContext";
import { siteSessions } from "../../lib/session";

const TIMEOUT = 1000;

function useProvideAuth() {
    const [ user, setUser ] = useState({
        session: siteSessions.sessionToken()
    });

    let logout = () => {
        siteSessions.clear();
        setUser({
            session: null
        });
    };

    let login = (clientToken) => {
        siteSessions.update(clientToken);
        setUser({
            session: siteSessions.sessionToken()
        });
    };

    setInterval(() => {
        let session = siteSessions.sessionToken()
        if (user.session !== session) {
            setUser({
                session
            });
        }
    }, TIMEOUT);

    return {
        user,
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