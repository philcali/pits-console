import { useState } from "react";
import { AlertContext } from "./AlertContext";

const TIMEOUT = 5000;

function useProviderAlerts() {
    let [ alerts, setAlerts ] = useState([]);

    const notify = alert => {
        let timestamp = Date.now();
        let newAlert = {
            ...alert,
            timestamp,
            timeout: timestamp + (alert.timeout || TIMEOUT),
            showing: true
        };
        setAlerts([
            ...alerts, {
                ...newAlert
            }
        ]);
    };

    const close = alert => {
        setAlerts(alerts.filter(a => a !== alert));
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
            icon: 'exclamation-circle',
            variant: 'danger',
            message
        });
    };

    const sweep = () => {
        let alert = alerts[0];
        if (alert) {
            let now = Date.now();
            return setTimeout(() => close(alert), alert.timeout - now);
        }
        return null;
    }

    return {
        alerts,
        success,
        error,
        close,
        sweep
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