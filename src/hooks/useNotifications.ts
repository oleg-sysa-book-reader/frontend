import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";
import { ENDPOINTS } from "../api/endpoints";
import { bookNotificationHandler } from "../notifications/handlers/bookNotificationHandler";
import { bookStatusHandler } from "../notifications/handlers/bookStatusHandler";
import { vocabularyImportHandler } from "../notifications/handlers/vocabularyImportHandler";
import { NOTIFICATION_TYPES, type NotificationHandler } from "../notifications/types";

export { NOTIFICATION_TYPES };

const notificationHandlers: NotificationHandler[] = [
    bookNotificationHandler,
    bookStatusHandler,
    vocabularyImportHandler
];

type NotificationState = Record<string, unknown>;

const NotificationsContext = createContext<NotificationState>({});

function getObject(value: unknown): Record<string, unknown> | undefined {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }

    return undefined;
}

function getNotificationType(notification: Record<string, unknown>): string | number | undefined {
    const typeEntry = Object.entries(notification).find(([key]) =>
        ["type", "eventtype"].includes(key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())
    );
    if (typeof typeEntry?.[1] === "number") {
        return typeEntry[1];
    }

    return typeof typeEntry?.[1] === "string" ? typeEntry[1].toLowerCase() : undefined;
}

function getNotificationPayload(notification: Record<string, unknown>): Record<string, unknown> {
    return getObject(notification.data) ?? getObject(notification.payload) ?? notification;
}

function NotificationsStream({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<NotificationState>({});

    useEffect(() => {
        const eventSource = new EventSource(ENDPOINTS.connectNotifications(), {
            withCredentials: true
        });

        const dispatch = (data: string, sourceEventType?: string) => {
            try {
                const notification = getObject(JSON.parse(data));
                if (!notification) {
                    throw new Error("Notification data must be a JSON object");
                }

                const payload = getNotificationPayload(notification);
                const type = getNotificationType(notification) ?? sourceEventType?.toLowerCase();
                const handler = notificationHandlers.find(candidate =>
                    candidate.eventTypes.some(eventType =>
                        String(eventType).toLowerCase() === String(type).toLowerCase()
                    )
                )
                    ?? notificationHandlers.find(candidate => candidate.matches?.(payload));

                if (!handler) {
                    return;
                }

                setNotifications(current => ({
                    ...current,
                    [handler.type]: handler.handle(payload, current[handler.type])
                }));
            } catch (error) {
                console.error("Failed to process notification:", error);
            }
        };

        const onMessage = (event: MessageEvent<string>) => dispatch(event.data);
        eventSource.addEventListener("message", onMessage as EventListener);

        const typedListeners = notificationHandlers.flatMap(handler =>
            handler.eventTypes.map(eventType => {
                const eventName = String(eventType);
                const listener: EventListener = event => {
                    dispatch((event as MessageEvent<string>).data, eventName);
                };
                eventSource.addEventListener(eventName, listener);
                return { eventName, listener };
            })
        );

        eventSource.onerror = error => {
            console.error("SSE error:", error);
        };

        return () => {
            eventSource.removeEventListener("message", onMessage as EventListener);
            typedListeners.forEach(({ eventName, listener }) => {
                eventSource.removeEventListener(eventName, listener);
            });
            eventSource.close();
        };
    }, []);

    return createElement(NotificationsContext.Provider, { value: notifications }, children);
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
    return createElement(NotificationsStream, null, children);
}

export function useNotifications(): NotificationState {
    return useContext(NotificationsContext);
}

export function useNotification<T>(type: string): T | undefined {
    return useNotifications()[type] as T | undefined;
}
