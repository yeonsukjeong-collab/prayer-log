import { Navigate, Route, Routes } from "react-router-dom";
import { ChurchPage } from "./pages/ChurchPage";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { NavBar } from "./components/NavBar";
import { useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { MemoriesPage } from "./pages/MemoriesPage";
import { PrayerRequestsPage } from "./pages/PrayerRequestsPage";
import { PrayerTextsPage } from "./pages/PrayerTextsPage";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <Routes>
        <Route path="/" element={<PrayerRequestsPage />} />
        <Route path="/prayers" element={<PrayerTextsPage />} />
        <Route path="/memories" element={<MemoriesPage />} />
        <Route path="/church" element={<ChurchPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
