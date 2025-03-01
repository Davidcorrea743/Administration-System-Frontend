import api from "./api";

interface LoginResponse {
  accessToken: string;
  expiresIn: string;
  exp: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AdminLoginCredentials {
  apiKey: string;
}

// Función para decodificar el JWT
export const decodeToken = (token: string) => {
  try {
    const base64Url = token.split(".")[1]; // Obtenemos el payload del JWT
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload); // Devolvemos el objeto decodificado
  } catch (error) {
    console.error("Error decodificando el token:", error);
    return null;
  }
};

export const login = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const loginAdmin = async (
  credentials: AdminLoginCredentials
): Promise<LoginResponse> => {
  const response = await api.post("/auth/login-admin", credentials);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("token");
};
