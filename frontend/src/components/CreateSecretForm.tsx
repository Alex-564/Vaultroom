import { useState } from "react";

export default function CreateSecretForm() {

    // Stateful variables
    const [message, setMessage] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [ttl, setTtl] = useState(3600);
    const [link, setLink] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Catch invalid types
        try {
        if (!message && !file) {
            throw new Error("Please provide a message or upload a file.");
        }

        // Package into form data
        const formData = new FormData();
        formData.append("ttl", ttl.toString());
        if (message) formData.append("message", message);
        if (file) formData.append("file", file);

        // Post to backend
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secrets/`, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) throw new Error("Failed to create secret");
        const data = await res.json();
        setLink(`${window.location.origin}${data.url}`);

        } catch (err: any) {
        setError(err.message || "Something went wrong.");

        } finally {
        setLoading(false);

        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4">
        <label className="block font-semibold">Secret Message</label>
        <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your secret..."
            className="w-full p-2 border rounded"
            rows={4}
        />
        
        {/* ADD FILE ACCEPTANCES HERE */}
        <label className="block font-semibold mt-4">Upload File (optional)</label>
        <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full"
        />

        {/* ADD EXPIRY TIMES HERE */}
        <label className="block font-semibold mt-4">Expire After</label>
        <select
            value={ttl}
            onChange={(e) => setTtl(Number(e.target.value))}
            className="w-full p-2 border rounded"
        >
            <option value={60}>1 Minute</option>
            <option value={600}>10 Minutes</option>
            <option value={3600}>1 Hour</option>
            <option value={86400}>1 Day</option>
        </select>

        <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded w-full mt-4"
            disabled={loading}
        >
            {loading ? "Creating..." : "Create Secret"}
        </button>

        {link && (
            <div className="mt-4">
            <p className="text-green-600">Here’s your one-time link:</p>
            <input value={link} readOnly className="w-full p-2 border rounded mt-2" />
            </div>
        )}
        {error && <p className="text-red-600">{error}</p>}
        </form>
    );
}