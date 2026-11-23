import { ENDPOINTS } from "./endpoints";
import type { BookModel } from "./models/book";
import type { Word } from "./models/word";
import type { PagedResult } from "./models/paged-result";
import type { PageContent } from "./models/page-content";
import type { ApiResponse } from "./models/http";

async function apiFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const response = await fetch(url, {
        ...options,
        credentials: "include"
    });

    if (response.status === 401) {
        window.location.href = "/";
        throw new Error("Unauthorized");
    }

    return response;
}

export async function getPageContent(
    bookId: number,
    pageNumber: number,
    useBookmark: boolean
): Promise<ApiResponse<PageContent>> {
    const response = await apiFetch(
        ENDPOINTS.getPageContent(bookId, pageNumber, useBookmark)
    );

    if (!response.ok) {
        throw new Error("Failed to load page");
    }

    return await response.json();
}

export async function getWordTranslation(
    value: string
): Promise<ApiResponse<string>> {
    const response = await apiFetch(
        ENDPOINTS.translation(value)
    );

    if (!response.ok) {
        throw new Error("Failed to load word translation");
    }

    return await response.json();
}

export async function getSentenceTranslation(
    sentenceId: string,
    value: string
): Promise<ApiResponse<string>> {
    const response = await apiFetch(
        ENDPOINTS.sentenceTranslation(sentenceId, value)
    );

    if (!response.ok) {
        throw new Error("Failed to load sentence translation");
    }

    return await response.json();
}

export async function getAllUserBooks(): Promise<ApiResponse<BookModel[]>> {
    const response = await apiFetch(
        ENDPOINTS.getUserBooks());

    if (!response.ok) {
        throw new Error("Failed to load books");
    }

    return await response.json();
}

export async function deleteBook(bookId: number): Promise<ApiResponse<boolean>> {
    const response = await apiFetch(
        ENDPOINTS.deleteBook(bookId), {
        method: "DELETE"
    });

    if (!response.ok) {
        throw new Error("Failed to delete book");
    }

    return await response.json();
}

export async function uploadBook(file: File, title: string, author: string) {
    const formData = new FormData();
    formData.append("File", file);
    formData.append("Title", title);
    formData.append("Author", author);

    const response = await apiFetch(ENDPOINTS.uploadBook(), {
        method: "POST",
        body: formData,
        credentials: "include"
    });

    if (!response.ok) {
        throw new Error("Failed to upload book");
    }

    return response.json();
}

export const addWordToLearning = async (value: string) => {
    const response = await apiFetch(ENDPOINTS.learnWord(), {
        headers: {
            "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify(value),
        credentials: "include"
    });

    if (!response.ok) {
        throw new Error("Failed to add word to learning");
    }

    return response.json();
};

export async function getUserVocabulary(
    pageNumber: number = 1,
    pageSize: number = 10
): Promise<ApiResponse<PagedResult<Word>>> {
    const response = await apiFetch(
        ENDPOINTS.getUserVocabulary(pageNumber, pageSize)
    );

    if (!response.ok) {
        throw new Error("Failed to load user vocabulary");
    }

    return await response.json();
}

export async function exportUserVocabulary(): Promise<void> {
    const response = await apiFetch(ENDPOINTS.exportUserVocabulary());

    if (!response.ok) {
        throw new Error("Failed to export vocabulary");
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get("content-disposition");
    const fileNameMatch = contentDisposition?.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i);
    const fileName = fileNameMatch?.[1]
        ? decodeURIComponent(fileNameMatch[1])
        : "vocabulary-export";

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

export async function importUserVocabulary(file: File): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiFetch(ENDPOINTS.importUserVocabulary(), {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        throw new Error("Failed to import vocabulary");
    }
}
