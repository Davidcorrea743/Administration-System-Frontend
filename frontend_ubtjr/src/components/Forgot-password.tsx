// ForgotPassword.tsx
import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/forgot-password`,
        { email }
      );
      setMessage(
        "Si el correo está registrado, recibirás un enlace de recuperación."
      );
    } catch (error) {
      setMessage("Hubo un error. Intenta nuevamente.");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4" style={{ width: "400px" }}>
        <h2 className="text-center mb-4">Recuperar Contraseña</h2>
        {message && <div className="alert alert-info">{message}</div>}
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
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Enviar
          </button>

          {/* Enlace para volver al login */}
          <p className="text-center mt-3">
            ¿Ya tienes una cuenta? <Link to="/">Inicia Sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
