import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import api from "../services/api";

interface DetailsModalProps {
  show: boolean;
  onHide: () => void;
  endpoint: string; // Ejemplo: "/condominio/{id}"
  id: string; // ID del registro seleccionado
}

const DetailsModal: React.FC<DetailsModalProps> = ({
  show,
  onHide,
  endpoint,
  id,
}) => {
  const [details, setDetails] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Función: Obtiene los detalles del registro desde el backend
  useEffect(() => {
    if (show && id) {
      const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await api.get(`${endpoint}/${id}`);
          setDetails(response.data);
        } catch (err: any) {
          console.error("Error fetching details:", err);
          setError("Error al cargar los detalles.");
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    }
  }, [show, id, endpoint]);

  // Función: Formatea las claves para mostrarlas legiblemente
  const formatKey = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace("Rif", "RIF")
      .replace("No ", "No. ");
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Detalles</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <p>Cargando...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : details ? (
          <div>
            {Object.entries(details).map(([key, value]) => (
              <p key={key}>
                <strong>{formatKey(key)}:</strong>{" "}
                {key === "fecha" ? new Date(value).toLocaleString() : value}
              </p>
            ))}
          </div>
        ) : (
          <p>No hay datos disponibles.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DetailsModal;
