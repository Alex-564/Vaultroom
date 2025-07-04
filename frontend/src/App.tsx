import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


// Components
import CreateSecretForm from "./components/CreateSecretForm";
import SecretViewer from "./components/SecretViewer";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CreateSecretForm />} />
        <Route path="/secret/:id" element={<SecretViewer />} />
        <Route path="/expired" element={<div className="text-center p-4">💥 This secret has expired or been viewed.</div>} />
      </Routes>
    </Router>
  );
}

export default App
