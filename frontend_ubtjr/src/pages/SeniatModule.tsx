import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Modal, Button, Form } from "react-bootstrap";

interface Seniat {
  id: string;
  fecha: string;
  periodoPagar: string;
  montoPagar: number;
  tipo: string; // Ejemplo: "IVA"
}

interface SeniatModuleProps {
  filterType: "mes" | "año";
  filterValue: string;
  searchRif: string;
}

// Función para convertir fecha ISO a formato datetime-local
const formatToLocalDateTime = (isoString: string) => {
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
};

const SeniatModule: React.FC<SeniatModuleProps> = ({
  filterType,
  filterValue,
  searchRif,
}) => {
  const [allSeniat, setAllSeniat] = useState<Seniat[]>([]);
  const [displayedSeniat, setDisplayedSeniat] = useState<Seniat[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [newSeniat, setNewSeniat] = useState<Partial<Seniat>>({});
  const [editSeniat, setEditSeniat] = useState<Seniat | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

  // Función: Carga todos los registros de SENIAT desde el backend y aplica filtros
  useEffect(() => {
    const fetchSeniat = async () => {
      setLoading(true);
      try {
        const response = await api.get("/seniat");
        let filteredSeniat = response.data;

        // Filtra por mes o año si hay un valor seleccionado
        if (filterValue) {
          filteredSeniat = filteredSeniat.filter((seniat: Seniat) => {
            const date = new Date(seniat.fecha);
            if (filterType === "mes") {
              const [year, month] = filterValue.split("-");
              return (
                date.getFullYear() === parseInt(year) &&
                date.getMonth() === parseInt(month) - 1
              );
            } else {
              return date.getFullYear() === parseInt(filterValue);
            }
          });
        }

        // Filtra por RIF si hay un valor de búsqueda (usamos id como proxy, ajustar si hay RIF)
        if (searchRif) {
          filteredSeniat = filteredSeniat.filter((seniat: Seniat) =>
            seniat.id.toString().includes(searchRif)
          );
        }

        setAllSeniat(filteredSeniat);
        updateDisplayedItems(filteredSeniat, currentPage);
      } catch (error: any) {
        console.error("Error fetching SENIAT:", error);
        setErrorMessage("Error al cargar los registros de SENIAT.");
        setTimeout(() => setErrorMessage(null), 3000);
      } finally {
        setLoading(false);
      }
    };
    fetchSeniat();
  }, [filterType, filterValue, searchRif]);

  // Función: Actualiza los registros de SENIAT mostrados en la tabla según la página actual
  const updateDisplayedItems = (items: Seniat[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedSeniat(items.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(items.length / itemsPerPage));
  };

  // Función: Agrega un nuevo registro de SENIAT al backend y actualiza la lista
  const handleAddSeniat = async () => {
    try {
      const response = await api.post("/seniat", newSeniat);
      const updatedSeniat = [...allSeniat, response.data];
      setAllSeniat(updatedSeniat);
      updateDisplayedItems(updatedSeniat, currentPage);
      setShowAddModal(false);
      setNewSeniat({});
      setSuccessMessage("Registro de SENIAT agregado con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Error adding SENIAT:", error);
      setErrorMessage(
        "Error al agregar el registro de SENIAT. Intenta nuevamente."
      );
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Función: Edita un registro de SENIAT existente y actualiza la lista
  const handleEditSeniat = async () => {
    if (!editSeniat) return;
    try {
      const response = await api.put(`/seniat/${editSeniat.id}`, editSeniat);
      const updatedSeniat = allSeniat.map((sen) =>
        sen.id === editSeniat.id ? response.data : sen
      );
      setAllSeniat(updatedSeniat);
      updateDisplayedItems(updatedSeniat, currentPage);
      setShowEditModal(false);
      setEditSeniat(null);
      setSuccessMessage("Registro de SENIAT editado con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Error editing SENIAT:", error);
      setErrorMessage(
        "Error al editar el registro de SENIAT. Intenta nuevamente."
      );
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Función: Elimina un registro de SENIAT con confirmación y actualiza la lista
  const handleDeleteSeniat = async (id: string) => {
    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas eliminar este registro de SENIAT?"
    );
    if (confirmDelete) {
      try {
        await api.delete(`/seniat/${id}`);
        const updatedSeniat = allSeniat.filter((sen) => sen.id !== id);
        setAllSeniat(updatedSeniat);
        updateDisplayedItems(updatedSeniat, currentPage);
        setSuccessMessage("Registro de SENIAT eliminado con éxito");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error: any) {
        console.error("Error deleting SENIAT:", error);
        setErrorMessage(
          "Error al eliminar el registro de SENIAT. Contacta al administrador."
        );
        setTimeout(() => setErrorMessage(null), 3000);
      }
    }
  };

  // Función: Maneja los cambios en los inputs del formulario, convirtiendo strings a mayúsculas
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean = false
  ) => {
    const { name, value, type, checked } = e.target;
    const updatedValue =
      type === "checkbox"
        ? checked
        : type === "text"
        ? value.toUpperCase()
        : value;
    if (isEdit && editSeniat) {
      setEditSeniat({ ...editSeniat, [name]: updatedValue });
    } else {
      setNewSeniat({ ...newSeniat, [name]: updatedValue });
    }
  };

  // Función: Maneja el cambio de fecha en el formulario ajustando a ISO
  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean = false
  ) => {
    const localDate = e.target.value;
    const isoDate = new Date(localDate).toISOString();
    if (isEdit && editSeniat) {
      setEditSeniat({ ...editSeniat, fecha: isoDate });
    } else {
      setNewSeniat({ ...newSeniat, fecha: isoDate });
    }
  };

  // Función: Abre el modal de edición con los datos del registro de SENIAT seleccionado
  const openEditModal = (id: string) => {
    const seniatToEdit = allSeniat.find((sen) => sen.id === id);
    if (seniatToEdit) {
      setEditSeniat(seniatToEdit);
      setShowEditModal(true);
    }
  };

  // Función: Cambia la página actual y actualiza los registros de SENIAT mostrados
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      updateDisplayedItems(allSeniat, page);
    }
  };

  return (
    <>
      <h3>SENIAT</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <button
            className="btn btn-success mb-3"
            onClick={() => setShowAddModal(true)}
          >
            <i className="bi bi-plus me-1"></i> Agregar Registro SENIAT
          </button>
          {successMessage && (
            <div className="alert alert-success" role="alert">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="alert alert-danger" role="alert">
              {errorMessage}
            </div>
          )}
          <table className="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo</th>
                <th>Período a Pagar</th>
                <th>Monto a Pagar</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayedSeniat.length > 0 ? (
                displayedSeniat.map((seniat) => (
                  <tr key={seniat.id}>
                    <td>{seniat.id}</td>
                    <td>{seniat.tipo}</td>
                    <td>{seniat.periodoPagar}</td>
                    <td>{seniat.montoPagar}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => openEditModal(seniat.id)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteSeniat(seniat.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center">
                    No hay registros de SENIAT disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <nav aria-label="Page navigation">
            <ul className="pagination justify-content-center">
              <li
                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Anterior
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <li
                    key={page}
                    className={`page-item ${
                      currentPage === page ? "active" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  </li>
                )
              )}
              <li
                className={`page-item ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Siguiente
                </button>
              </li>
            </ul>
          </nav>
        </>
      )}

      {/* Modal para agregar registro de SENIAT */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar Registro SENIAT</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Fecha</Form.Label>
              <Form.Control
                type="datetime-local"
                name="fecha"
                value={
                  newSeniat.fecha ? formatToLocalDateTime(newSeniat.fecha) : ""
                }
                onChange={(e) => handleDateChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Período a Pagar</Form.Label>
              <Form.Control
                type="text"
                name="periodoPagar"
                value={newSeniat.periodoPagar || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Monto a Pagar</Form.Label>
              <Form.Control
                type="number"
                name="montoPagar"
                value={newSeniat.montoPagar || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo</Form.Label>
              <Form.Control
                type="text"
                name="tipo"
                value={newSeniat.tipo || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleAddSeniat}>
            Guardar Registro
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para editar registro de SENIAT */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Registro SENIAT</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editSeniat && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Fecha</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="fecha"
                  value={
                    editSeniat.fecha
                      ? formatToLocalDateTime(editSeniat.fecha)
                      : ""
                  }
                  onChange={(e) => handleDateChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Período a Pagar</Form.Label>
                <Form.Control
                  type="text"
                  name="periodoPagar"
                  value={editSeniat.periodoPagar || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Monto a Pagar</Form.Label>
                <Form.Control
                  type="number"
                  name="montoPagar"
                  value={editSeniat.montoPagar || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Tipo</Form.Label>
                <Form.Control
                  type="text"
                  name="tipo"
                  value={editSeniat.tipo || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleEditSeniat}>
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SeniatModule;
