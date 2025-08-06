//import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


// Components
import CreateSecretForm from "./components/CreateSecretForm";
import SecretViewer from "./components/SecretViewer";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CreateSecretForm />} />
        <Route path="/secrets/:id" element={<SecretViewer />} />
        <Route path="/expired" element={<div className="flex items-center text-center justify-center p-4">💥 This secret has expired or been viewed.</div>} />
      </Routes>
    </Router>
  );
}

export default App
