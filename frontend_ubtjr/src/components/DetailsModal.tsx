import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap"; // Asegúrate de importar Button si no estaba
import api from "../services/api";

interface DetailsModalProps {
  show: boolean;
  onHide: () => void;
  endpoint: string;
  id: string;
}

const DetailsModal: React.FC<DetailsModalProps> = ({
  show,
  onHide,
  endpoint,
  id,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show && id) {
      const fetchDetails = async () => {
        setLoading(true);
        try {
          const response = await api.get(`${endpoint}/${id}`);
          setData(response.data);
        } catch (err: any) {
          setError("Error al cargar los detalles: " + err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    }
  }, [show, endpoint, id]);

  // Campos a excluir
  const excludedFields = ["id", "createdAt", "updatedAt", "deletedAt"];

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Detalles</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <p>Cargando...</p>
        ) : error ? (
          <p className="text-danger">{error}</p>
        ) : data ? (
          <div>
            {Object.entries(data)
              .filter(([key]) => !excludedFields.includes(key)) // Filtramos los campos excluidos
              .map(([key, value]) => (
                <p key={key}>
                  <strong>{key}:</strong> {value?.toString()}
                </p>
              ))}
          </div>
        ) : (
          <p>No hay datos disponibles</p>
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
