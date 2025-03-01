import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Modal, Button, Form } from "react-bootstrap";

interface Viatico {
  id: string;
  fecha: string;
  nombre: string;
  cedula: number;
  cargo: string;
  concepto: string;
}

interface ViaticosModuleProps {
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

const ViaticosModule: React.FC<ViaticosModuleProps> = ({
  filterType,
  filterValue,
  searchRif,
}) => {
  const [allViaticos, setAllViaticos] = useState<Viatico[]>([]);
  const [displayedViaticos, setDisplayedViaticos] = useState<Viatico[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [newViatico, setNewViatico] = useState<Partial<Viatico>>({});
  const [editViatico, setEditViatico] = useState<Viatico | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

  // Función: Carga todos los registros de Viáticos desde el backend y aplica filtros
  useEffect(() => {
    const fetchViaticos = async () => {
      setLoading(true);
      try {
        const response = await api.get("/viaticos");
        let filteredViaticos = response.data;

        // Filtra por mes o año si hay un valor seleccionado
        if (filterValue) {
          filteredViaticos = filteredViaticos.filter((viatico: Viatico) => {
            const date = new Date(viatico.fecha);
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

        // Filtra por RIF si hay un valor de búsqueda (usamos cédula como proxy, ya que no hay RIF)
        if (searchRif) {
          filteredViaticos = filteredViaticos.filter((viatico: Viatico) =>
            viatico.cedula.toString().includes(searchRif)
          );
        }

        setAllViaticos(filteredViaticos);
        updateDisplayedItems(filteredViaticos, currentPage);
      } catch (error: any) {
        console.error("Error fetching viáticos:", error);
        setErrorMessage("Error al cargar los registros de viáticos.");
        setTimeout(() => setErrorMessage(null), 3000);
      } finally {
        setLoading(false);
      }
    };
    fetchViaticos();
  }, [filterType, filterValue, searchRif]);

  // Función: Actualiza los registros de Viáticos mostrados en la tabla según la página actual
  const updateDisplayedItems = (items: Viatico[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedViaticos(items.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(items.length / itemsPerPage));
  };

  // Función: Agrega un nuevo registro de Viáticos al backend y actualiza la lista
  const handleAddViatico = async () => {
    try {
      const response = await api.post("/viaticos", newViatico);
      const updatedViaticos = [...allViaticos, response.data];
      setAllViaticos(updatedViaticos);
      updateDisplayedItems(updatedViaticos, currentPage);
      setShowAddModal(false);
      setNewViatico({});
      setSuccessMessage("Registro de Viáticos agregado con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Error adding viático:", error);
      setErrorMessage(
        "Error al agregar el registro de Viáticos. Intenta nuevamente."
      );
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Función: Edita un registro de Viáticos existente y actualiza la lista
  const handleEditViatico = async () => {
    if (!editViatico) return;
    try {
      const response = await api.put(
        `/viaticos/${editViatico.id}`,
        editViatico
      );
      const updatedViaticos = allViaticos.map((viat) =>
        viat.id === editViatico.id ? response.data : viat
      );
      setAllViaticos(updatedViaticos);
      updateDisplayedItems(updatedViaticos, currentPage);
      setShowEditModal(false);
      setEditViatico(null);
      setSuccessMessage("Registro de Viáticos editado con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Error editing viático:", error);
      setErrorMessage(
        "Error al editar el registro de Viáticos. Intenta nuevamente."
      );
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Función: Elimina un registro de Viáticos con confirmación y actualiza la lista
  const handleDeleteViatico = async (id: string) => {
    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas eliminar este registro de Viáticos?"
    );
    if (confirmDelete) {
      try {
        await api.delete(`/viaticos/${id}`);
        const updatedViaticos = allViaticos.filter((viat) => viat.id !== id);
        setAllViaticos(updatedViaticos);
        updateDisplayedItems(updatedViaticos, currentPage);
        setSuccessMessage("Registro de Viáticos eliminado con éxito");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error: any) {
        console.error("Error deleting viático:", error);
        setErrorMessage(
          "Error al eliminar el registro de Viáticos. Contacta al administrador."
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
    if (isEdit && editViatico) {
      setEditViatico({ ...editViatico, [name]: updatedValue });
    } else {
      setNewViatico({ ...newViatico, [name]: updatedValue });
    }
  };

  // Función: Maneja el cambio de fecha en el formulario ajustando a ISO
  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean = false
  ) => {
    const localDate = e.target.value;
    const isoDate = new Date(localDate).toISOString();
    if (isEdit && editViatico) {
      setEditViatico({ ...editViatico, fecha: isoDate });
    } else {
      setNewViatico({ ...newViatico, fecha: isoDate });
    }
  };

  // Función: Abre el modal de edición con los datos del registro de Viáticos seleccionado
  const openEditModal = (id: string) => {
    const viaticoToEdit = allViaticos.find((viat) => viat.id === id);
    if (viaticoToEdit) {
      setEditViatico(viaticoToEdit);
      setShowEditModal(true);
    }
  };

  // Función: Cambia la página actual y actualiza los registros de Viáticos mostrados
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      updateDisplayedItems(allViaticos, page);
    }
  };

  return (
    <>
      <h3>Viáticos</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <button
            className="btn btn-success mb-3"
            onClick={() => setShowAddModal(true)}
          >
            <i className="bi bi-plus me-1"></i> Agregar Registro Viáticos
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
                <th>Cédula</th>
                <th>Cargo</th>
                <th>Concepto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayedViaticos.length > 0 ? (
                displayedViaticos.map((viatico) => (
                  <tr key={viatico.id}>
                    <td>{viatico.id}</td>
                    <td>{viatico.nombre}</td>
                    <td>{viatico.cedula}</td>
                    <td>{viatico.cargo}</td>
                    <td>{viatico.concepto}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => openEditModal(viatico.id)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteViatico(viatico.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center">
                    No hay registros de Viáticos disponibles
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

      {/* Modal para agregar registro de Viáticos */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar Registro Viáticos</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Fecha</Form.Label>
              <Form.Control
                type="datetime-local"
                name="fecha"
                value={
                  newViatico.fecha
                    ? formatToLocalDateTime(newViatico.fecha)
                    : ""
                }
                onChange={(e) => handleDateChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={newViatico.nombre || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Cédula</Form.Label>
              <Form.Control
                type="number"
                name="cedula"
                value={newViatico.cedula || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Cargo</Form.Label>
              <Form.Control
                type="text"
                name="cargo"
                value={newViatico.cargo || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Concepto</Form.Label>
              <Form.Control
                type="text"
                name="concepto"
                value={newViatico.concepto || ""}
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
          <Button variant="primary" onClick={handleAddViatico}>
            Guardar Registro
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para editar registro de Viáticos */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Registro Viáticos</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editViatico && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Fecha</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="fecha"
                  value={
                    editViatico.fecha
                      ? formatToLocalDateTime(editViatico.fecha)
                      : ""
                  }
                  onChange={(e) => handleDateChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre"
                  value={editViatico.nombre || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Cédula</Form.Label>
                <Form.Control
                  type="number"
                  name="cedula"
                  value={editViatico.cedula || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Cargo</Form.Label>
                <Form.Control
                  type="text"
                  name="cargo"
                  value={editViatico.cargo || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Concepto</Form.Label>
                <Form.Control
                  type="text"
                  name="concepto"
                  value={editViatico.concepto || ""}
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
          <Button variant="primary" onClick={handleEditViatico}>
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ViaticosModule;
