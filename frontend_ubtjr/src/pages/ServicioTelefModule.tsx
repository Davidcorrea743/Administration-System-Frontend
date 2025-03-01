import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Modal, Button, Form } from "react-bootstrap";

interface ServicioTelef {
  id: string;
  fecha: string;
  mesPagar: string;
  rif: number;
  nombre: string;
  montoPagar: number;
  noOficina: string;
  noLinea: string;
}

interface ServicioTelefModuleProps {
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

const ServicioTelefModule: React.FC<ServicioTelefModuleProps> = ({
  filterType,
  filterValue,
  searchRif,
}) => {
  const [allServicioTelef, setAllServicioTelef] = useState<ServicioTelef[]>([]);
  const [displayedServicioTelef, setDisplayedServicioTelef] = useState<
    ServicioTelef[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [newServicioTelef, setNewServicioTelef] = useState<
    Partial<ServicioTelef>
  >({});
  const [editServicioTelef, setEditServicioTelef] =
    useState<ServicioTelef | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

  // Función: Carga todos los registros de Servicio Telef desde el backend y aplica filtros
  useEffect(() => {
    const fetchServicioTelef = async () => {
      setLoading(true);
      try {
        const response = await api.get("/telef");
        let filteredServicioTelef = response.data;

        // Filtra por mes o año si hay un valor seleccionado
        if (filterValue) {
          filteredServicioTelef = filteredServicioTelef.filter(
            (servicio: ServicioTelef) => {
              const date = new Date(servicio.fecha);
              if (filterType === "mes") {
                const [year, month] = filterValue.split("-");
                return (
                  date.getFullYear() === parseInt(year) &&
                  date.getMonth() === parseInt(month) - 1
                );
              } else {
                return date.getFullYear() === parseInt(filterValue);
              }
            }
          );
        }

        // Filtra por RIF si hay un valor de búsqueda
        if (searchRif) {
          filteredServicioTelef = filteredServicioTelef.filter(
            (servicio: ServicioTelef) =>
              servicio.rif.toString().includes(searchRif)
          );
        }

        setAllServicioTelef(filteredServicioTelef);
        updateDisplayedItems(filteredServicioTelef, currentPage);
      } catch (error: any) {
        console.error("Error fetching Servicio Telef:", error);
        setErrorMessage("Error al cargar los registros de Servicio Telef.");
        setTimeout(() => setErrorMessage(null), 3000);
      } finally {
        setLoading(false);
      }
    };
    fetchServicioTelef();
  }, [filterType, filterValue, searchRif]);

  // Función: Actualiza los registros de Servicio Telef mostrados en la tabla según la página actual
  const updateDisplayedItems = (items: ServicioTelef[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedServicioTelef(items.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(items.length / itemsPerPage));
  };

  // Función: Agrega un nuevo registro de Servicio Telef al backend y actualiza la lista
  const handleAddServicioTelef = async () => {
    try {
      const response = await api.post("/telef", newServicioTelef);
      const updatedServicioTelef = [...allServicioTelef, response.data];
      setAllServicioTelef(updatedServicioTelef);
      updateDisplayedItems(updatedServicioTelef, currentPage);
      setShowAddModal(false);
      setNewServicioTelef({});
      setSuccessMessage("Registro de Servicio Telef agregado con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Error adding Servicio Telef:", error);
      setErrorMessage(
        "Error al agregar el registro de Servicio Telef. Intenta nuevamente."
      );
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Función: Edita un registro de Servicio Telef existente y actualiza la lista
  const handleEditServicioTelef = async () => {
    if (!editServicioTelef) return;
    try {
      const response = await api.put(
        `/telef/${editServicioTelef.id}`,
        editServicioTelef
      );
      const updatedServicioTelef = allServicioTelef.map((serv) =>
        serv.id === editServicioTelef.id ? response.data : serv
      );
      setAllServicioTelef(updatedServicioTelef);
      updateDisplayedItems(updatedServicioTelef, currentPage);
      setShowEditModal(false);
      setEditServicioTelef(null);
      setSuccessMessage("Registro de Servicio Telef editado con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Error editing Servicio Telef:", error);
      setErrorMessage(
        "Error al editar el registro de Servicio Telef. Intenta nuevamente."
      );
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Función: Elimina un registro de Servicio Telef con confirmación y actualiza la lista
  const handleDeleteServicioTelef = async (id: string) => {
    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas eliminar este registro de Servicio Telef?"
    );
    if (confirmDelete) {
      try {
        await api.delete(`/telef/${id}`);
        const updatedServicioTelef = allServicioTelef.filter(
          (serv) => serv.id !== id
        );
        setAllServicioTelef(updatedServicioTelef);
        updateDisplayedItems(updatedServicioTelef, currentPage);
        setSuccessMessage("Registro de Servicio Telef eliminado con éxito");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error: any) {
        console.error("Error deleting Servicio Telef:", error);
        setErrorMessage(
          "Error al eliminar el registro de Servicio Telef. Contacta al administrador."
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
    if (isEdit && editServicioTelef) {
      setEditServicioTelef({ ...editServicioTelef, [name]: updatedValue });
    } else {
      setNewServicioTelef({ ...newServicioTelef, [name]: updatedValue });
    }
  };

  // Función: Maneja el cambio de fecha en el formulario ajustando a ISO
  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean = false
  ) => {
    const localDate = e.target.value;
    const isoDate = new Date(localDate).toISOString();
    if (isEdit && editServicioTelef) {
      setEditServicioTelef({ ...editServicioTelef, fecha: isoDate });
    } else {
      setNewServicioTelef({ ...newServicioTelef, fecha: isoDate });
    }
  };

  // Función: Abre el modal de edición con los datos del registro de Servicio Telef seleccionado
  const openEditModal = (id: string) => {
    const servicioTelefToEdit = allServicioTelef.find((serv) => serv.id === id);
    if (servicioTelefToEdit) {
      setEditServicioTelef(servicioTelefToEdit);
      setShowEditModal(true);
    }
  };

  // Función: Cambia la página actual y actualiza los registros de Servicio Telef mostrados
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      updateDisplayedItems(allServicioTelef, page);
    }
  };

  return (
    <>
      <h3>Servicio Telef</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <button
            className="btn btn-success mb-3"
            onClick={() => setShowAddModal(true)}
          >
            <i className="bi bi-plus me-1"></i> Agregar Registro Servicio Telef
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
                <th>Nombre</th>
                <th>RIF</th>
                <th>Mes a Pagar</th>
                <th>Monto a Pagar</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayedServicioTelef.length > 0 ? (
                displayedServicioTelef.map((servicio) => (
                  <tr key={servicio.id}>
                    <td>{servicio.id}</td>
                    <td>{servicio.nombre}</td>
                    <td>{servicio.rif}</td>
                    <td>{servicio.mesPagar}</td>
                    <td>{servicio.montoPagar}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => openEditModal(servicio.id)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteServicioTelef(servicio.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center">
                    No hay registros de Servicio Telef disponibles
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

      {/* Modal para agregar registro de Servicio Telef */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar Registro Servicio Telef</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Fecha</Form.Label>
              <Form.Control
                type="datetime-local"
                name="fecha"
                value={
                  newServicioTelef.fecha
                    ? formatToLocalDateTime(newServicioTelef.fecha)
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
                value={newServicioTelef.mesPagar || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>RIF</Form.Label>
              <Form.Control
                type="number"
                name="rif"
                value={newServicioTelef.rif || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={newServicioTelef.nombre || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Monto a Pagar</Form.Label>
              <Form.Control
                type="number"
                name="montoPagar"
                value={newServicioTelef.montoPagar || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>No. Oficina</Form.Label>
              <Form.Control
                type="text"
                name="noOficina"
                value={newServicioTelef.noOficina || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>No. Línea</Form.Label>
              <Form.Control
                type="text"
                name="noLinea"
                value={newServicioTelef.noLinea || ""}
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
          <Button variant="primary" onClick={handleAddServicioTelef}>
            Guardar Registro
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para editar registro de Servicio Telef */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Registro Servicio Telef</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editServicioTelef && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Fecha</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="fecha"
                  value={
                    editServicioTelef.fecha
                      ? formatToLocalDateTime(editServicioTelef.fecha)
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
                  value={editServicioTelef.mesPagar || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>RIF</Form.Label>
                <Form.Control
                  type="number"
                  name="rif"
                  value={editServicioTelef.rif || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre"
                  value={editServicioTelef.nombre || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Monto a Pagar</Form.Label>
                <Form.Control
                  type="number"
                  name="montoPagar"
                  value={editServicioTelef.montoPagar || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>No. Oficina</Form.Label>
                <Form.Control
                  type="text"
                  name="noOficina"
                  value={editServicioTelef.noOficina || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>No. Línea</Form.Label>
                <Form.Control
                  type="text"
                  name="noLinea"
                  value={editServicioTelef.noLinea || ""}
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
          <Button variant="primary" onClick={handleEditServicioTelef}>
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ServicioTelefModule;
