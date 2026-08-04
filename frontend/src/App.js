import "@/index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Landing from "@/pages/Landing";
import Inscription from "@/pages/Inscription";
import Admin from "@/pages/Admin";

function App() {
  return (
    <div className="App bg-brand-ink min-h-screen">
      <div className="noise-overlay" />
      <Toaster theme="dark" position="top-center" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/login" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
