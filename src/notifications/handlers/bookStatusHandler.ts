import {
    BACKEND_EVENT_TYPES,
    getField,
    NOTIFICATION_TYPES,
    type NotificationHandler
} from "../types";

export const bookStatusHandler: NotificationHandler<Record<number, number>> = {
    type: NOTIFICATION_TYPES.bookStatus,
    eventTypes: [BACKEND_EVENT_TYPES.bookProcessing],
    matches: payload =>
        typeof getField(payload, ["BookId"]) === "number"
        && typeof getField(payload, ["Status"]) === "number",
    handle: (payload, currentState) => {
        const bookId = getField(payload, ["BookId"]);
        const status = getField(payload, ["Status"]);

        if (typeof bookId !== "number" || typeof status !== "number") {
            throw new Error("Book status notification requires numeric BookId and Status");
        }

        return {
            ...(currentState as Record<number, number> | undefined),
            [bookId]: status
        };
    }
};
