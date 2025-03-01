import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginAdmin } from "../services/authService";

interface AdminLoginProps {
  setToken: (token: string | null) => void; // Añadimos la prop setToken
}

const AdminLogin: React.FC<AdminLoginProps> = ({ setToken }) => {
  const [apiKey, setApiKey] = useState(""); // Cambiamos email/password por apiKey
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const { accessToken } = await loginAdmin({ apiKey }); // Usamos el endpoint real
      localStorage.setItem("token", accessToken); // Guardamos el token real
      setToken(accessToken); // Actualizamos el estado en App.tsx
      navigate("/dashboard"); // Redirigimos a Dashboard
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Error al iniciar sesión como administrador."
      );
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4" style={{ width: "400px" }}>
        <h2 className="text-center mb-4">Admin Login</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="apiKey" className="form-label">
              Clave API
            </label>
            <input
              type="text"
              className="form-control"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Ingrese su clave API"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Iniciar Sesión
          </button>
          {/* Enlace para volver al login */}
          <p className="text-center mt-3">
            ¿No eres Administrador? <Link to="/login">Volver al inicio</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
