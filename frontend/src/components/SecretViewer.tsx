import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";


type SecretResponse = {
    message?: string;
    fileName?: string;
    fileMime?: string;
    fileData?: string; // base64 string
};

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function SecretViewer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const hasFetched = useRef(false);

    const [secret, setSecret] = useState<SecretResponse | null>(null);

    const [error, setError] = useState("");
    const [errorDetails, setErrorDetails] = useState<string | null>(null);

    const [isBlurred, setIsBlurred] = useState(false);
    const [numPages, setNumPages] = useState<number | null>(null);

    const [pdfData, setPdfData] = useState<string | null>(null);

    // Fetch secret from backend
    const fetchSecret = async () => {
        try {
            setError("");
            setErrorDetails(null);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secrets/${id}`);
            
            //if (!res.ok) throw new Error("Expired or already viewed");
            if (res.status === 404) {
                navigate("/expired");
                return;
            }
            if (!res.ok) {
                throw new Error(`Request failed with status ${res.status}`);
            }
            

            const data = await res.json();
            console.log("[DEBUG] Secret response successfully fetched:", data);
            setSecret(data);

            // process PDF data
            if (data.fileData && data.fileMime?.includes("pdf")) {
                const base64Data = data.fileData.startsWith('data:') ? data.fileData : `data:application/pdf;base64,${data.fileData}`;
                setPdfData(base64Data);
            }

        } catch (err) {
            // Catch and display unknown/unexpected errors
            console.error("Error fetching secret:", err);

            setError("Failed to retrieve the secret. Please check your connection and try again.");
            if (err instanceof Error) {
                setErrorDetails(err.message);
            } else {
                setErrorDetails(String(err));
            }
        }
    };

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchSecret();

        const base64Data = secret?.fileData
        console.log("[DEBUG] Secret response:", base64Data);


        // basic security to disable print screens
        const blockActions = (e: MouseEvent | KeyboardEvent) => {
            if ((e as MouseEvent).button === 2 || e.ctrlKey || e.metaKey) {
                e.preventDefault();
            }
        };

        // listeners to blur screen on unfocus
        const handleBlur = () => setIsBlurred(true);
        const handleFocus = () => setIsBlurred(false);

        window.addEventListener("contextmenu", blockActions);
        window.addEventListener("keydown", blockActions);
        window.addEventListener("blur", handleBlur);
        window.addEventListener("focus", handleFocus);

        return () => {
            window.removeEventListener("contextmenu", blockActions);
            window.removeEventListener("keydown", blockActions);
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("focus", handleFocus);
        };
    }, [navigate]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        console.log("[DEBUG] PDF loaded successfully with", numPages, "pages");
    };

    const onDocumentLoadError = (error: Error) => {
        console.error("[DEBUG] PDF load error:", error);
    };

    const isImage = secret?.fileMime?.startsWith("image/");
    const isPdf = secret?.fileMime?.includes("pdf")
    const isText = secret?.fileMime === "text/plain";
    const isSupported = isImage || isPdf || isText


    return (
        <div className={`min-h-screen font-mono flex items-center justify-center bg-gray-900 text-white p-4 transition-all duration-300 ${isBlurred ? "pointer-events-none select-none blur-sm" : ""}`}>
            <div className="w-full max-w-2xl space-y-6 bg-gray-800 p-6 rounded-xl shadow-lg">
                <label className="block font-semibold mb-1">Secret Message</label>

                {/* Secret text message (textual section) */}
                {secret?.message && (
                    <div className="p-4 border border-gray-600 rounded bg-gray-700 text-white">
                        <p>{secret.message}</p>
                    </div>
                )}

                <label className="block font-semibold mb-1">Attached File</label>

                {/* PDF File Viewer */}
                {pdfData && (
                    <div className="w-full border border-gray-600 rounded bg-black shadow">
                        <Document
                            file={pdfData}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={<p className="text-gray-400 p-4">Loading PDF...</p>}
                            error={<p className="text-red-500 p-4">Failed to load PDF. Please try again.</p>}
                        >
                            {numPages && Array.from({ length: numPages }, (_, i) => (
                                <Page
                                    key={`page_${i + 1}`}
                                    pageNumber={i + 1}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    className="border-b border-gray-700"
                                    width={600} // Add explicit width for better rendering
                                />
                            ))}
                        </Document>
                    </div>
                )}

                {/* Image Viewer */}
                {secret?.fileData && isImage && (
                    <div className = "">
                        <img src={`data:${secret?.fileMime};base64,${secret?.fileData}`} alt="Secret file" />
                    </div>
                )}

                {/* Plaintext viewer */}
                {secret?.fileData && isText && (
                    <pre className = "p-4 border border-gray-600 rounded bg-gray-700 text-white overflow-x-auto text-wrap">
                        {atob(secret?.fileData)}
                    </pre>
                )}

                {/* Unsupported file fallback */}
                {secret?.fileData && !isSupported && (
                    <div className="text-gray-400 italic text-center">
                        Document preview not supported.
                    </div>
                )}

                {/* Error display */}
                {error && (
                    <div className="text-red-500 text-center p-4 space-y-2">
                        <p>{error}</p>
                        {errorDetails && (
                            <p className="text-xs text-gray-400">{errorDetails}</p>
                        )}
                    </div>
                )}

                {/* Blur Overlay */}
                {isBlurred && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 text-xl text-gray-300">
                         Content hidden while inactive
                    </div>
                )}
            </div>
        </div>
    );
}
