import React, { useState, type ReactHTMLElement } from "react";

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
        console.log("Successfully posted secret to backend.")

        // if (!res.ok) throw new Error("Failed to create secret");
        // const data = await res.json();
        // setLink(`${window.location.origin}${data.url}`);

        // } catch (err: any) {
        // setError(err.message || "Something went wrong.");

        // } finally {
        // setLoading(false);

        // };

        // catch and distinguish error messages
        if (!res.ok){
          const rawError = await res.text();
          let backendMessage =  `Server responded with status ${res.status}`;

          try {
            const parsed = JSON.parse(rawError);
            backendMessage = parsed.error || parsed.message || backendMessage;

          } catch {
            if (rawError) backendMessage = rawError;
          }
          throw new Error(backendMessage);
        }
        
        const data = await res.json();
        setLink(`${window.location.origin}${data.url}`);

      } catch (err: unknown){
        console.error("Error creating secret:", err);

        if (err instanceof TypeError) {
          setError("Unable to contact server. Please try again later.");
        
        } else if (err instanceof Error) {
          setError(err.message || "Failed to create secret.");

        } else {
          setError("Failed to create secret.");
        }

      } finally {
        setLoading(false);
      }
    };

    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];

      if (selected && selected.size > MAX_FILE_SIZE){
        alert("File is too large. Max size is 5MB");
        setFile(null);

      } else {
        setFile(selected || null);
      }
    }


return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4 font-mono">
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-lg bg-gray-800 text-white rounded-xl shadow-2xl p-6 space-y-6"
    >
      <h2 className="text-2xl font-bold text-center">Create a Secret</h2>

      {/* Secret Message */}
      <div>
        <label className="block font-semibold mb-1">Secret Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your secret..."
          className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
      </div>

      {/* Upload File */}
      <div>
        <label className="block font-semibold mb-1">Upload File (optional)</label>
        <div className="relative">
          <input
            type="file"
            accept=".pdf,.txt, .jpeg, .jpg"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 z-50 cursor-pointer"
          />
          <div className="bg-gray-700 text-white px-4 py-2 rounded w-full text-center cursor-pointer hover:bg-gray-600 transition-all">
            {file ? file.name : "Choose File"}
          </div>
        </div>
      </div>

      {/* Expire After */}
      <div>
        <label className="block font-semibold mb-1">Expire After</label>
        <select
          value={ttl}
          onChange={(e) => setTtl(Number(e.target.value))}
          className="w-full p-3 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={60}>1 Minute</option>
          <option value={600}>10 Minutes</option>
          <option value={3600}>1 Hour</option>
          <option value={86400}>1 Day</option>
        </select>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded w-full transition-all disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Secret"}
      </button>

      {/* Output */}
      {link && (
        <div className="mt-4">
          <p className="text-green-400">Here’s your one-time link:</p>
          <input
            value={link}
            readOnly
            className="w-full p-2 border border-gray-600 rounded mt-2 bg-gray-700 text-white"
          />
        </div>
      )}

      {error && <p className="text-red-500">{error}</p>}
    </form>
    </div>
);
}