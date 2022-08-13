import { useState } from "react";
import { AlertContext } from "./AlertContext";

const TIMEOUT = 5000;

function useProviderAlerts() {
    let [ alerts, setAlerts ] = useState([]);

    const notify = alert => {
        let newAlert = {
            ...alert,
            timestamp: Date.now(),
            showing: true
        };
        let timeoutId = setTimeout(() => close(newAlert), alert.timeout || TIMEOUT);
        setAlerts([
            ...alerts, {
                ...newAlert,
                timeoutId
            }
        ]);
    };

    const close = alert => {
        clearTimeout(alert.timeout);
        setAlerts(alerts.filter(a => a.timestamp !== alert.timestamp));
    };

    const success = message => {
        notify({
            icon: 'check-circle',
            variant: 'success',
            message
        })
    };

    const error = message => {
        notify({
            icon: 'exclaimation-circle',
            variant: 'danger',
            message
        });
    };

    return {
        alerts,
        success,
        error,
        close
    }
}

function AlertNotifications({ children }) {
    let alerts = useProviderAlerts();
    return (
        <AlertContext.Provider value={alerts}>
            { children }
        </AlertContext.Provider>
    )
}

export default AlertNotifications;