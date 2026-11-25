import type { Word } from "../../api/models/word";
import { useCallback, useEffect, useState } from "react";
import { exportUserVocabulary, getUserVocabulary, importUserVocabulary } from "../../api/ApiClient";
import "./WordsList.css";
import { Download, Upload, Trash } from "lucide-react";

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 10;

export default function WordsList() {
    const [words, setWords] = useState<Word[]>([]);
    const [pageNumber, setPageNumber] = useState(DEFAULT_PAGE_NUMBER);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [totalPages, setTotalPages] = useState(1);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedWordIds, setSelectedWordIds] = useState<number[]>([]);

    const loadWords = useCallback(async () => {
        try {
            const response = await getUserVocabulary(pageNumber, pageSize);

            if (response.success) {
                const res = response.data as unknown as {
                    items?: Word[];
                    data?: Word[];
                    totalPages?: number;
                    totalCount?: number;
                };

                const items = Array.isArray(res?.items)
                    ? res.items
                    : Array.isArray(res?.data)
                        ? res.data
                        : Array.isArray(response.data)
                            ? (response.data as unknown as Word[])
                            : [];

                const totalCount = typeof res?.totalCount === "number" ? res.totalCount : items.length;
                const calculatedTotalPages =
                    typeof res?.totalPages === "number"
                        ? res.totalPages
                        : Math.ceil(totalCount / pageSize);

                setWords(items);
                setSelectedWordIds([]);
                setTotalPages(Math.max(1, calculatedTotalPages || 1));
            }
        } catch (error) {
            console.error(error);
        }
    }, [pageNumber, pageSize]);

    useEffect(() => {
        void loadWords();
    }, [loadWords]);

    const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setPageSize(Number(event.target.value));
        setPageNumber(DEFAULT_PAGE_NUMBER);
    };

    const allVisibleSelected = words.length > 0 && words.every((word) => selectedWordIds.includes(word.id));
    const someVisibleSelected = words.some((word) => selectedWordIds.includes(word.id));

    const handleToggleSelectAll = () => {
        if (allVisibleSelected) {
            setSelectedWordIds([]);
            return;
        }

        setSelectedWordIds(words.map((word) => word.id));
    };

    const handleToggleWordSelection = (wordId: number) => {
        setSelectedWordIds((currentSelectedIds) =>
            currentSelectedIds.includes(wordId)
                ? currentSelectedIds.filter((id) => id !== wordId)
                : [...currentSelectedIds, wordId]
        );
    };

    const getPageNumbers = () => {
        const pages: number[] = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, pageNumber - Math.floor(maxVisiblePages / 2));
        let endPage = startPage + maxVisiblePages - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let currentPage = startPage; currentPage <= endPage; currentPage += 1) {
            pages.push(currentPage);
        }

        return pages;
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            await exportUserVocabulary();
        } catch (error) {
            console.error(error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportOpen = () => {
        setIsImportOpen(true);
        setImportFile(null);
    };

    const handleImportClose = () => {
        if (isImporting) {
            return;
        }

        setIsImportOpen(false);
        setImportFile(null);
    };

    const handleImportSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!importFile) {
            return;
        }

        try {
            setIsImporting(true);
            await importUserVocabulary(importFile);
            setIsImportOpen(false);
            setImportFile(null);
            await loadWords();
        } catch (error) {
            console.error(error);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div>
            <div className="words-toolbar">
                <div className="bulk-actions" aria-label="Bulk actions">
                    {selectedWordIds.length > 0 && (
                        <>
                            <span className="bulk-actions-count">Selected: {selectedWordIds.length}</span>
                            <button type="button" title="Delete selected">
                                <Trash size={18} />
                            </button>
                        </>
                    )}
                </div>

                <div className="words-toolbar-group">
                    <button title="Import" onClick={handleImportOpen}>
                        <Upload size={18} />
                    </button>

                    <button title="Export" onClick={handleExport} disabled={isExporting}>
                        <Download size={18} />
                    </button>
                </div>
            </div>
            <div className="words-grid">
                <div className="grid-header grid-header-checkbox">
                    <input
                        type="checkbox"
                        aria-label="Select all words on page"
                        checked={allVisibleSelected}
                        ref={(element) => {
                            if (element) {
                                element.indeterminate = !allVisibleSelected && someVisibleSelected;
                            }
                        }}
                        onChange={handleToggleSelectAll}
                    />
                </div>
                <div className="grid-header">Word</div>
                <div className="grid-header">Translation</div>
                <div className="grid-header">Example</div>
                <div className="grid-header">Actions</div>

                {words.map((word, index) => (
                    <div className={`word-row ${index % 2 === 0 ? "even" : "odd"}`} key={word.id}>
                        <div className="grid-cell-checkbox">
                            <input
                                type="checkbox"
                                aria-label={`Select word ${word.sourceValue}`}
                                checked={selectedWordIds.includes(word.id)}
                                onChange={() => handleToggleWordSelection(word.id)}
                            />
                        </div>
                        <div>{word.sourceValue}</div>
                        <div>{word.translation}</div>
                        <div>{word.example}</div>
                        <div className="actions">
                            <button>
                                <Trash size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="pagination">
                <div className="page-buttons">
                    <button
                        onClick={() => setPageNumber((currentPage) => Math.max(1, currentPage - 1))}
                        disabled={pageNumber === 1}
                        aria-label="Previous page"
                    >
                        ←
                    </button>

                    {getPageNumbers().map((page) => (
                        <button
                            key={page}
                            className={page === pageNumber ? "active" : ""}
                            onClick={() => setPageNumber(page)}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        onClick={() => setPageNumber((currentPage) => Math.min(totalPages, currentPage + 1))}
                        disabled={pageNumber >= totalPages}
                        aria-label="Next page"
                    >
                        →
                    </button>
                </div>
                <div className="page-size">
                    <label htmlFor="pageSize">Page size:</label>
                    <select id="pageSize" value={pageSize} onChange={handlePageSizeChange}>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            {isImportOpen && (
                <div className="import-modal-overlay" onClick={handleImportClose}>
                    <div className="import-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="import-modal-header">
                            <h3>Import vocabulary</h3>
                            <button type="button" className="import-modal-close" onClick={handleImportClose}>
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleImportSubmit} className="import-modal-form">
                            <label htmlFor="importVocabularyFile">Choose file</label>
                            <input
                                id="importVocabularyFile"
                                type="file"
                                onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
                            />

                            <div className="import-modal-actions">
                                <button type="button" onClick={handleImportClose} disabled={isImporting}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={!importFile || isImporting}>
                                    {isImporting ? "Sending..." : "Send"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


