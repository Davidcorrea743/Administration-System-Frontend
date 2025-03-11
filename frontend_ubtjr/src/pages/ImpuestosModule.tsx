import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Modal, Button, Form } from "react-bootstrap";
import DetailsModal from "../components/DetailsModal"; // Importamos DetailsModal

interface Impuesto {
  id: string;
  fecha: string;
  noFactura: number;
  montoPagar: number;
  tipo: string; // Ejemplo: "1XMIL"
}

interface ImpuestosModuleProps {
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

const ImpuestosModule: React.FC<ImpuestosModuleProps> = ({
  filterType,
  filterValue,
  searchRif,
}) => {
  const [allImpuestos, setAllImpuestos] = useState<Impuesto[]>([]);
  const [displayedImpuestos, setDisplayedImpuestos] = useState<Impuesto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false); // Estado para el modal de detalles
  const [selectedId, setSelectedId] = useState<string>(""); // ID del impuesto seleccionado
  const [newImpuesto, setNewImpuesto] = useState<Partial<Impuesto>>({});
  const [editImpuesto, setEditImpuesto] = useState<Impuesto | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

  // Función: Carga todos los impuestos desde el backend y aplica filtros
  useEffect(() => {
    const fetchImpuestos = async () => {
      setLoading(true);
      try {
        const response = await api.get("/Impuestos");
        let filteredImpuestos = response.data;

        // Filtra por mes o año si hay un valor seleccionado
        if (filterValue) {
          filteredImpuestos = filteredImpuestos.filter((impuesto: Impuesto) => {
            const date = new Date(impuesto.fecha);
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

        // Filtra por RIF si hay un valor de búsqueda (usamos noFactura como proxy, ajustar si hay RIF)
        if (searchRif) {
          filteredImpuestos = filteredImpuestos.filter((impuesto: Impuesto) =>
            impuesto.noFactura.toString().includes(searchRif)
          );
        }

        setAllImpuestos(filteredImpuestos);
        updateDisplayedItems(filteredImpuestos, currentPage);
      } catch (error: any) {
        console.error("Error fetching impuestos:", error);
        setErrorMessage("Error al cargar los impuestos.");
        setTimeout(() => setErrorMessage(null), 3000);
      } finally {
        setLoading(false);
      }
    };
    fetchImpuestos();
  }, [filterType, filterValue, searchRif]);

  // Función: Actualiza los impuestos mostrados en la tabla según la página actual
  const updateDisplayedItems = (items: Impuesto[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedImpuestos(items.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(items.length / itemsPerPage));
  };

  // Función: Agrega un nuevo impuesto al backend y actualiza la lista
  const handleAddImpuesto = async () => {
    try {
      const response = await api.post("/Impuestos", newImpuesto);
      const updatedImpuestos = [...allImpuestos, response.data];
      setAllImpuestos(updatedImpuestos);
      updateDisplayedItems(updatedImpuestos, currentPage);
      setShowAddModal(false);
      setNewImpuesto({});
      setSuccessMessage("Impuesto agregado con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Error adding impuesto:", error);
      setErrorMessage("Error al agregar el impuesto. Intenta nuevamente.");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Función: Abre el modal de detalles
  const handleShowDetails = (id: string) => {
    setSelectedId(id);
    setShowDetailModal(true);
  };

  // Función: Edita un impuesto existente y actualiza la lista
  const handleEditImpuesto = async () => {
    if (!editImpuesto) return;
    try {
      const response = await api.put(
        `/Impuestos/${editImpuesto.id}`,
        editImpuesto
      );
      const updatedImpuestos = allImpuestos.map((imp) =>
        imp.id === editImpuesto.id ? response.data : imp
      );
      setAllImpuestos(updatedImpuestos);
      updateDisplayedItems(updatedImpuestos, currentPage);
      setShowEditModal(false);
      setEditImpuesto(null);
      setSuccessMessage("Impuesto editado con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Error editing impuesto:", error);
      setErrorMessage("Error al editar el impuesto. Intenta nuevamente.");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Función: Elimina un impuesto con confirmación y actualiza la lista
  const handleDeleteImpuesto = async (id: string) => {
    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas eliminar este impuesto?"
    );
    if (confirmDelete) {
      try {
        await api.delete(`/Impuestos/${id}`);
        const updatedImpuestos = allImpuestos.filter((imp) => imp.id !== id);
        setAllImpuestos(updatedImpuestos);
        updateDisplayedItems(updatedImpuestos, currentPage);
        setSuccessMessage("Impuesto eliminado con éxito");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error: any) {
        console.error("Error deleting impuesto:", error);
        setErrorMessage(
          "Error al eliminar el impuesto. Contacta al administrador."
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
        : Number(value); // Convertimos a número para campos numéricos
    if (isEdit && editImpuesto) {
      setEditImpuesto({ ...editImpuesto, [name]: updatedValue });
    } else {
      setNewImpuesto({ ...newImpuesto, [name]: updatedValue });
    }
  };

  // Función: Maneja el cambio de fecha en el formulario ajustando a ISO
  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean = false
  ) => {
    const localDate = e.target.value;
    const isoDate = new Date(localDate).toISOString();
    if (isEdit && editImpuesto) {
      setEditImpuesto({ ...editImpuesto, fecha: isoDate });
    } else {
      setNewImpuesto({ ...newImpuesto, fecha: isoDate });
    }
  };

  // Función: Abre el modal de edición con los datos del impuesto seleccionado
  const openEditModal = (id: string) => {
    const impuestoToEdit = allImpuestos.find((imp) => imp.id === id);
    if (impuestoToEdit) {
      setEditImpuesto(impuestoToEdit);
      setShowEditModal(true);
    }
  };

  // Función: Cambia la página actual y actualiza los impuestos mostrados
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      updateDisplayedItems(allImpuestos, page);
    }
  };

  return (
    <>
      <h3>Impuestos</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <button
            className="btn btn-success mb-3"
            onClick={() => setShowAddModal(true)}
          >
            <i className="bi bi-plus me-1"></i> Agregar Impuesto
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
                <th>No. Factura</th>
                <th>Monto a Pagar</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayedImpuestos.length > 0 ? (
                displayedImpuestos.map((impuesto) => (
                  <tr key={impuesto.id}>
                    <td>{impuesto.id}</td>
                    <td>
                      <span
                        style={{
                          cursor: "pointer",
                          color: "blue",
                          textDecoration: "underline",
                        }}
                        onClick={() => handleShowDetails(impuesto.id)}
                      >
                        {impuesto.tipo}
                      </span>
                    </td>
                    <td>{impuesto.noFactura}</td>
                    <td>{impuesto.montoPagar}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => openEditModal(impuesto.id)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteImpuesto(impuesto.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center">
                    No hay impuestos disponibles
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

      {/* Modal para agregar impuesto */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar Impuesto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Fecha</Form.Label>
              <Form.Control
                type="datetime-local"
                name="fecha"
                value={
                  newImpuesto.fecha
                    ? formatToLocalDateTime(newImpuesto.fecha)
                    : ""
                }
                onChange={(e) => handleDateChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>No. Factura</Form.Label>
              <Form.Control
                type="number"
                name="noFactura"
                value={newImpuesto.noFactura || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Monto a Pagar</Form.Label>
              <Form.Control
                type="number"
                name="montoPagar"
                value={newImpuesto.montoPagar || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo</Form.Label>
              <Form.Control
                type="text"
                name="tipo"
                value={newImpuesto.tipo || ""}
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
          <Button variant="primary" onClick={handleAddImpuesto}>
            Guardar Impuesto
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para editar impuesto */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Impuesto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editImpuesto && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Fecha</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="fecha"
                  value={
                    editImpuesto.fecha
                      ? formatToLocalDateTime(editImpuesto.fecha)
                      : ""
                  }
                  onChange={(e) => handleDateChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>No. Factura</Form.Label>
                <Form.Control
                  type="number"
                  name="noFactura"
                  value={editImpuesto.noFactura || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Monto a Pagar</Form.Label>
                <Form.Control
                  type="number"
                  name="montoPagar"
                  value={editImpuesto.montoPagar || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Tipo</Form.Label>
                <Form.Control
                  type="text"
                  name="tipo"
                  value={editImpuesto.tipo || ""}
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
          <Button variant="primary" onClick={handleEditImpuesto}>
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de detalles */}
      <DetailsModal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        endpoint="/Impuestos"
        id={selectedId}
      />
    </>
  );
};

export default ImpuestosModule;
