import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, loginAdmin } from "../services/authService";

interface LoginProps {
  setToken: (token: string | null) => void;
}

const Login: React.FC<LoginProps> = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const { accessToken } = await login({ email, password });
      localStorage.setItem("token", accessToken);
      setToken(accessToken);
      navigate("/dashboard"); // Cambiado de /welcome a /dashboard
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al iniciar sesión.");
      console.error("Detalles del error:", err.response);
    }
  };

  const handleAdminLogin = async () => {
    setError(null);
    try {
      const { accessToken } = await loginAdmin({
        apiKey: "j6Ttx62XsfrD+fUyavtZpN+",
      });
      localStorage.setItem("token", accessToken);
      setToken(accessToken);
      navigate("/dashboard"); // Cambiado de /welcome a /dashboard
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Error al iniciar sesión como administrador."
      );
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div
        className="card p-3 shadow-lg"
        style={{
          maxWidth: "450px",
          width: "90%",
          borderRadius: "20px",
          maxHeight: "630px",
          minHeight: "300px",
          margin: "40px auto",
          overflow: "hidden",
        }}
      >
        <div className="text-center mb-1">
          <img
            src="./../../public/logo.jpg"
            alt="Logo"
            className="img-fluid"
            style={{ maxWidth: "150px" }}
          />
        </div>
        <h3 className="text-center">Iniciar Sesión</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Correo Electrónico
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingrese su correo electrónico"
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese su contraseña"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Iniciar Sesión
          </button>

          {error && (
            <div className="alert alert-danger mt-3 text-center" role="alert">
              {error}
            </div>
          )}
        </form>

        <p className="text-center mt-2">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
        <p className="text-center">
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </p>
        <p className="text-center">
          <button
            onClick={handleAdminLogin}
            className="btn btn-link text-danger p-0"
            style={{ background: "none", border: "none" }}
          >
            Iniciar sesión como administrador
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
