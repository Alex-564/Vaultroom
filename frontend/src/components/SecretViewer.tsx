import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

type SecretResponse = {
    message?: string;
    fileName?: string;
    fileMime?: string;
    fileData?: string; // base64 string
};

export default function SecretViewer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const hasFetched = useRef(false); 

    const [secret, setSecret] = useState<SecretResponse | null>(null);
    const [error, setError] = useState("");
    const [isBlurred, setIsBlurred] = useState(false);

    // API call to return secret
    const fetchSecret = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secrets/${id}`);
            if (!res.ok) throw new Error("Expired or already viewed");
            const data = await res.json();
            setSecret(data);
        } catch (err) {
            setError("This secret has expired or been viewed already.");
            setTimeout(() => navigate("/expired"), 3000);
        }
    };

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchSecret();

        // Security: disable right-click and key combos
        const blockActions = (e: any) => {
            if (e.button === 2 || e.ctrlKey || e.metaKey) e.preventDefault();
        };


        // Blur listeners
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

    }, []);

    if (error) return <p className="text-red-600 text-center">{error}</p>;

    return (
        <div className={`p-4 max-w-2xl mx-auto space-y-4 transition-all duration-300 ${isBlurred ? "filter blur-md pointer-events-none select-none" : ""}`}>
            {secret?.message && (
                <div className="p-4 border rounded bg-gray-100">
                    <p>{secret.message}</p>
                </div>
            )}

            {secret?.fileData && secret.fileMime?.includes("pdf") && (
                <iframe
                    src={`data:application/pdf;base64,${secret.fileData}`}
                    title="Secure File"
                    className="w-full h-[80vh] border rounded shadow"
                    sandbox="allow-same-origin"
                />
            )}

            {secret?.fileData && !secret.fileMime?.includes("pdf") && (
                <div>
                    <p className="text-gray-500 italic">Document preview not supported.</p>
                </div>
            )}

            {/* BLUR MESSAGE */}
            {isBlurred && (
                <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50 text-xl text-gray-600">
                    🔒 Content hidden while inactive
                </div>
            )}
        </div>
    );
}
