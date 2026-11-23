import type { Word } from "../../api/models/word";
import { useEffect, useState } from "react";
import { getUserVocabulary } from "../../api/ApiClient";
import "./WordsList.css";
import { Download, Upload, Trash } from "lucide-react";

const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 10;

export default function WordsList() {
    const [words, setWords] = useState<Word[]>([]);
    const [pageNumber, setPageNumber] = useState(DEFAULT_PAGE_NUMBER);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const loadWords = async () => {
            try {
                const response = await getUserVocabulary(pageNumber, pageSize);

                if (response.success) {
                    const res = response.data as unknown as {
                        data?: Word[];
                        totalPages?: number;
                        totalCount?: number;
                    };

                    const items = Array.isArray(res?.data)
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
                    setTotalPages(Math.max(1, calculatedTotalPages || 1));
                }
            } catch (error) {
                console.error(error);
            }
        };

        loadWords();
    }, [pageNumber, pageSize]);

    const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setPageSize(Number(event.target.value));
        setPageNumber(DEFAULT_PAGE_NUMBER);
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

    return (
        <div>
            <div className="words-toolbar">
                <button title="Import">
                    <Upload size={18} />
                </button>

                <button title="Export">
                    <Download size={18} />
                </button>
            </div>
            <div className="words-grid">
                <div className="grid-header">Word</div>
                <div className="grid-header">Translation</div>
                <div className="grid-header">Example</div>
                <div className="grid-header">Actions</div>

                {words.map((word) => (
                    <div className="word-row" key={word.id}>
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
        </div>
    );
}


