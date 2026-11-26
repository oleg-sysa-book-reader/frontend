import { BACKEND_EVENT_TYPES, NOTIFICATION_TYPES, type NotificationHandler } from "../types";

export const bookNotificationHandler: NotificationHandler<Record<string, unknown>> = {
    type: NOTIFICATION_TYPES.bookNotification,
    eventTypes: [BACKEND_EVENT_TYPES.bookNotification],
    handle: payload => payload
};
