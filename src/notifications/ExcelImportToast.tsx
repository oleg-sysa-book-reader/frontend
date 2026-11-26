import { useEffect, useState } from "react";
import { NOTIFICATION_TYPES, useNotification } from "../hooks/useNotifications";
import {
    EXCEL_IMPORT_STATUS,
    type ImportNotification
} from "./handlers/vocabularyImportHandler";
import "./ExcelImportToast.css";

interface VisibleToast {
    notification: ImportNotification;
    status: number;
}

export default function ExcelImportToast() {
    const notification = useNotification<ImportNotification>(NOTIFICATION_TYPES.vocabularyImport);
    const [toast, setToast] = useState<VisibleToast | null>(null);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const status = Number(notification?.status);
        if (
            !notification
            || (status !== EXCEL_IMPORT_STATUS.success && status !== EXCEL_IMPORT_STATUS.error)
        ) {
            return;
        }

        setIsClosing(false);
        setToast({ notification, status });
        const closeTimer = window.setTimeout(() => setIsClosing(true), 3200);
        const removeTimer = window.setTimeout(() => setToast(null), 3500);
        return () => {
            window.clearTimeout(closeTimer);
            window.clearTimeout(removeTimer);
        };
    }, [notification]);

    if (!toast) {
        return null;
    }

    const isError = toast.status === EXCEL_IMPORT_STATUS.error;
    const message = isError
        ? toast.notification.error || "Excel import failed"
        : "Excel import completed";

    return (
        <aside
            className={[
                "excel-import-toast",
                isError && "excel-import-toast-error",
                isClosing && "excel-import-toast-leaving"
            ].filter(Boolean).join(" ")}
            role={isError ? "alert" : "status"}
        >
            <span>{message}</span>
        </aside>
    );
}
