import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/Forgot-password";
import AdminLogin from "./components/AdminLogin";
import Dashboard from "./pages/Dashboard";

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login setToken={setToken} />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/admin-login" element={<AdminLogin setToken={setToken} />} />

      {/* Ruta protegida */}
      <Route
        path="/dashboard"
        element={
          token ? <Dashboard setToken={setToken} /> : <Navigate to="/login" />
        }
      />

      {/* Ruta por defecto: redirige al login si no hay token, o al dashboard si lo hay */}
      <Route
        path="/"
        element={
          token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
        }
      />

      {/* Redirigir cualquier otra ruta no encontrada */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default App;
