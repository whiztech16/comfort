import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landing/landingpage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
    </Routes>
  );
}