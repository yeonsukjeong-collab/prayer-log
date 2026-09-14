import { Navigate, Route, Routes } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { PrayerRequestsPage } from "./pages/PrayerRequestsPage";
import { PrayerTextsPage } from "./pages/PrayerTextsPage";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
        불러오는 중...
      </div>
    );
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
