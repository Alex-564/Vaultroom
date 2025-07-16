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


return (
  <div className={`min-h-screen font-mono flex items-center justify-center bg-gray-900 text-white p-4 transition-all duration-300 ${isBlurred ? "pointer-events-none select-none blur-sm" : ""}`}>
    <div className="w-full max-w-2xl space-y-6 bg-gray-800 p-6 rounded-xl shadow-lg">
      <label className="block font-semibold mb-1">Secret Message</label>
      {/* Secret message */}
      {secret?.message && (
        <div className="p-4 border border-gray-600 rounded bg-gray-700 text-white">
          <p>{secret.message}</p>
        </div>
      )}

      {/* PDF Viewer */}
      {secret?.fileData && secret.fileMime?.includes("pdf") && (
        <iframe
          src={`data:application/pdf;base64,${secret.fileData}`}
          title="Secure File"
          className="w-full h-[80vh] border border-gray-600 rounded shadow bg-gray-900"
          sandbox="allow-same-origin"
        />
      )}

      {/* Unsupported preview fallback */}
      {secret?.fileData && !secret.fileMime?.includes("pdf") && (
        <div className="text-gray-400 italic text-center">
          Document preview not supported.
        </div>
      )}

      {/* Blur Overlay */}
      {isBlurred && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 text-xl text-gray-300">
          🔒 Content hidden while inactive
        </div>
      )}
    </div>
  </div>
);
}
