export const NOTIFICATION_TYPES = {
    bookNotification: "book.notification",
    bookStatus: "book.status",
    vocabularyImport: "vocabulary.import"
} as const;

export const BACKEND_EVENT_TYPES = {
    bookNotification: 1,
    bookProcessing: 2,
    excelImportNotification: 3
} as const;

export interface NotificationHandler<TState = unknown> {
    type: string;
    eventTypes: readonly (string | number)[];
    matches?: (payload: Record<string, unknown>) => boolean;
    handle: (payload: Record<string, unknown>, currentState: unknown) => TState;
}

export function getField(
    payload: Record<string, unknown>,
    names: string[]
): unknown {
    const normalizedNames = names.map(name => name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase());
    const entry = Object.entries(payload).find(([key]) =>
        normalizedNames.includes(key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())
    );
    return entry?.[1];
}
