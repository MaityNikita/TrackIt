import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import EntryPage from "./components/EntryPage";
import CompletedEntries from "./components/CompletedEntries";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EntryPage />} />
        <Route path="/completed-entries" element={<CompletedEntries />} />
      </Routes>
    </Router>
  );
}

export default App;
