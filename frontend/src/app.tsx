import { Navigate, Route, Routes } from "react-router-dom";
import { ActivitiesPage } from "./activities-page";
import { AuthPage } from "./auth-page";
import { useAuth } from "./use-auth";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  if (auth.loading) return <main className="centered-status" role="status">Vérification de la session…</main>;
  if (!auth.user) return <Navigate to="/" replace />;
  return children;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route
        path="/activities"
        element={
          <PrivateRoute>
            <ActivitiesPage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
