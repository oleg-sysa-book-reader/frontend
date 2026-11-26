import {
    BACKEND_EVENT_TYPES,
    getField,
    NOTIFICATION_TYPES,
    type NotificationHandler
} from "../types";

export interface ImportNotification {
    userId: number;
    status: number;
    error: string | null;
}

export const EXCEL_IMPORT_STATUS = {
    success: 1,
    error: 2
} as const;

export const vocabularyImportHandler: NotificationHandler<ImportNotification> = {
    type: NOTIFICATION_TYPES.vocabularyImport,
    eventTypes: [BACKEND_EVENT_TYPES.excelImportNotification],
    handle: payload => {
        const userId = getField(payload, ["UserId"]);
        const status = getField(payload, ["Status"]);
        const error = getField(payload, ["Error"]);

        if (typeof userId !== "number" || typeof status !== "number") {
            throw new Error("Excel import notification requires numeric UserId and status");
        }

        if (error !== null && typeof error !== "string") {
            throw new Error("Excel import notification error must be a string or null");
        }

        return {
            userId,
            status,
            error
        };
    }
};
