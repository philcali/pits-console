import { useEffect, useState } from "react";
import { useAlerts } from "../notifications/AlertContext";
import { ConnectionContext } from "./ConnectionContext";
import { dataService } from "../../lib/services";
import { useAuth } from "../auth/AuthContext";

const STATUS_INTERVAL = 10000;

function useConnection() {
    const alerts = useAlerts();
    const auth = useAuth();
    const [ content, setContent ] = useState({
        connecting: true,
        connected: false,
    });

    if (auth.user.username) {
        if (content.connecting) {
            dataService.manager()
                .then(manager => {
                    if (content.manager) {
                        manager.close();
                        return
                    }
                    setContent({
                        ...content,
                        connecting: false,
                        connected: true,
                        manager,
                    });
                    manager.onRequest(
                        response => {
                            if (response.action !== 'status') {
                                alerts.success(`Successfully sent ${response.action} action`)
                            }
                        },
                        error => {
                            alerts.error(`Failed to send command: ${error.message}`);
                        });
                })
                .catch(error => {
                    alerts.error(`Failed to connect: ${error.message}`);
                    setContent({
                        ...content,
                        connecting: false,
                    });
                });
        }
    }

    useEffect(() => {
        let statusInterval;
        if (content.connected && content.manager) {
            statusInterval = setInterval(() => {
                content.manager.send('status', {});
            }, STATUS_INTERVAL);
        }
        return () => {
            if (statusInterval) {
                clearInterval(statusInterval);
            }
        }
    });

    const managerInvoke = input => {
        return new Promise((resolve, reject) => {
            if (!content.connected || content.manager === undefined) {
                reject('Connection is not active.');
            }
            const invokeId = `${input.camera}-${input.event['name']}-${new Date().getTime()}`;
            const onInvoke = invoke => {
                if (invoke.connection.invoke_id === invokeId) {
                    content.manager.offInvoke(onInvoke);
                    resolve(invoke);
                }
            };

            content.manager.onInvoke(onInvoke);
            content.manager.invoke({
                invokeId,
                camera: input.camera,
                event: input.event,
                connectionId: input.connectionId,
            });
        });
    }

    const isConnected = () => {
        return content.connected;
    }

    return {
        ...content,
        managerInvoke,
        isConnected,
    }
}

function ProvideConnection({ children }) {
    return (
        <ConnectionContext.Provider value={useConnection()}>
            { children }
        </ConnectionContext.Provider>
    )
}

export default ProvideConnection;