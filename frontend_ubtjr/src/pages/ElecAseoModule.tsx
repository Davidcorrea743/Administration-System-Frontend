import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Modal, Button, Form } from "react-bootstrap";

interface ElecAseo {
  id: string;
  fecha: string;
  mesPagar: string;
  noOficina: string;
  montoPagar: number;
}

interface ElecAseoModuleProps {
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

const ElecAseoModule: React.FC<ElecAseoModuleProps> = ({
  filterType,
  filterValue,
  searchRif,
}) => {
  const [allElecAseo, setAllElecAseo] = useState<ElecAseo[]>([]);
  const [displayedElecAseo, setDisplayedElecAseo] = useState<ElecAseo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [newElecAseo, setNewElecAseo] = useState<Partial<ElecAseo>>({});
  const [editElecAseo, setEditElecAseo] = useState<ElecAseo | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

  // Función: Carga todos los registros de Elec & Aseo desde el backend y aplica filtros
  useEffect(() => {
    const fetchElecAseo = async () => {
      setLoading(true);
      try {
        const response = await api.get("/elec_aseo");
        let filteredElecAseo = response.data;

        // Filtra por mes o año si hay un valor seleccionado
        if (filterValue) {
          filteredElecAseo = filteredElecAseo.filter((elecAseo: ElecAseo) => {
            const date = new Date(elecAseo.fecha);
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
          filteredElecAseo = filteredElecAseo.filter((elecAseo: ElecAseo) =>
            elecAseo.id.toString().includes(searchRif)
          );
        }

        setAllElecAseo(filteredElecAseo);
        updateDisplayedItems(filteredElecAseo, currentPage);
      } catch (error: any) {
        console.error("Error fetching Elec & Aseo:", error);
        setErrorMessage("Error al cargar los registros de Elec & Aseo.");
        setTimeout(() => setErrorMessage(null), 3000);
      } finally {
        setLoading(false);
      }
    };
    fetchElecAseo();
  }, [filterType, filterValue, searchRif]);

  // Función: Actualiza los registros de Elec & Aseo mostrados en la tabla según la página actual
  const updateDisplayedItems = (items: ElecAseo[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedElecAseo(items.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(items.length / itemsPerPage));
  };

  // Función: Agrega un nuevo registro de Elec & Aseo al backend y actualiza la lista
  const handleAddElecAseo = async () => {
    try {
      const response = await api.post("/elec_aseo", newElecAseo);
      const updatedElecAseo = [...allElecAseo, response.data];
      setAllElecAseo(updatedElecAseo);
      updateDisplayedItems(updatedElecAseo, currentPage);
      setShowAddModal(false);
      setNewElecAseo({});
      setSuccessMessage("Registro de Elec & Aseo agregado con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Error adding Elec & Aseo:", error);
      setErrorMessage(
        "Error al agregar el registro de Elec & Aseo. Intenta nuevamente."
      );
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Función: Edita un registro de Elec & Aseo existente y actualiza la lista
  const handleEditElecAseo = async () => {
    if (!editElecAseo) return;
    try {
      const response = await api.put(
        `/elec_aseo/${editElecAseo.id}`,
        editElecAseo
      );
      const updatedElecAseo = allElecAseo.map((elec) =>
        elec.id === editElecAseo.id ? response.data : elec
      );
      setAllElecAseo(updatedElecAseo);
      updateDisplayedItems(updatedElecAseo, currentPage);
      setShowEditModal(false);
      setEditElecAseo(null);
      setSuccessMessage("Registro de Elec & Aseo editado con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Error editing Elec & Aseo:", error);
      setErrorMessage(
        "Error al editar el registro de Elec & Aseo. Intenta nuevamente."
      );
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Función: Elimina un registro de Elec & Aseo con confirmación y actualiza la lista
  const handleDeleteElecAseo = async (id: string) => {
    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas eliminar este registro de Elec & Aseo?"
    );
    if (confirmDelete) {
      try {
        await api.delete(`/elec_aseo/${id}`);
        const updatedElecAseo = allElecAseo.filter((elec) => elec.id !== id);
        setAllElecAseo(updatedElecAseo);
        updateDisplayedItems(updatedElecAseo, currentPage);
        setSuccessMessage("Registro de Elec & Aseo eliminado con éxito");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error: any) {
        console.error("Error deleting Elec & Aseo:", error);
        setErrorMessage(
          "Error al eliminar el registro de Elec & Aseo. Contacta al administrador."
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
    if (isEdit && editElecAseo) {
      setEditElecAseo({ ...editElecAseo, [name]: updatedValue });
    } else {
      setNewElecAseo({ ...newElecAseo, [name]: updatedValue });
    }
  };

  // Función: Maneja el cambio de fecha en el formulario ajustando a ISO
  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean = false
  ) => {
    const localDate = e.target.value;
    const isoDate = new Date(localDate).toISOString();
    if (isEdit && editElecAseo) {
      setEditElecAseo({ ...editElecAseo, fecha: isoDate });
    } else {
      setNewElecAseo({ ...newElecAseo, fecha: isoDate });
    }
  };

  // Función: Abre el modal de edición con los datos del registro de Elec & Aseo seleccionado
  const openEditModal = (id: string) => {
    const elecAseoToEdit = allElecAseo.find((elec) => elec.id === id);
    if (elecAseoToEdit) {
      setEditElecAseo(elecAseoToEdit);
      setShowEditModal(true);
    }
  };

  // Función: Cambia la página actual y actualiza los registros de Elec & Aseo mostrados
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      updateDisplayedItems(allElecAseo, page);
    }
  };

  return (
    <>
      <h3>Elec & Aseo</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <button
            className="btn btn-success mb-3"
            onClick={() => setShowAddModal(true)}
          >
            <i className="bi bi-plus me-1"></i> Agregar Registro Elec & Aseo
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
                <th>Mes a Pagar</th>
                <th>No. Oficina</th>
                <th>Monto a Pagar</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayedElecAseo.length > 0 ? (
                displayedElecAseo.map((elecAseo) => (
                  <tr key={elecAseo.id}>
                    <td>{elecAseo.id}</td>
                    <td>{elecAseo.mesPagar}</td>
                    <td>{elecAseo.noOficina}</td>
                    <td>{elecAseo.montoPagar}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => openEditModal(elecAseo.id)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteElecAseo(elecAseo.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center">
                    No hay registros de Elec & Aseo disponibles
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

      {/* Modal para agregar registro de Elec & Aseo */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar Registro Elec & Aseo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Fecha</Form.Label>
              <Form.Control
                type="datetime-local"
                name="fecha"
                value={
                  newElecAseo.fecha
                    ? formatToLocalDateTime(newElecAseo.fecha)
                    : ""
                }
                onChange={(e) => handleDateChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mes a Pagar</Form.Label>
              <Form.Control
                type="text"
                name="mesPagar"
                value={newElecAseo.mesPagar || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>No. Oficina</Form.Label>
              <Form.Control
                type="text"
                name="noOficina"
                value={newElecAseo.noOficina || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Monto a Pagar</Form.Label>
              <Form.Control
                type="number"
                name="montoPagar"
                value={newElecAseo.montoPagar || ""}
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
          <Button variant="primary" onClick={handleAddElecAseo}>
            Guardar Registro
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para editar registro de Elec & Aseo */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Registro Elec & Aseo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editElecAseo && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Fecha</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="fecha"
                  value={
                    editElecAseo.fecha
                      ? formatToLocalDateTime(editElecAseo.fecha)
                      : ""
                  }
                  onChange={(e) => handleDateChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Mes a Pagar</Form.Label>
                <Form.Control
                  type="text"
                  name="mesPagar"
                  value={editElecAseo.mesPagar || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>No. Oficina</Form.Label>
                <Form.Control
                  type="text"
                  name="noOficina"
                  value={editElecAseo.noOficina || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Monto a Pagar</Form.Label>
                <Form.Control
                  type="number"
                  name="montoPagar"
                  value={editElecAseo.montoPagar || ""}
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
          <Button variant="primary" onClick={handleEditElecAseo}>
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ElecAseoModule;
