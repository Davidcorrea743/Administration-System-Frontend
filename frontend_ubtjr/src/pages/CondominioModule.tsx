import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Modal, Button, Form } from "react-bootstrap";
import DetailsModal from "../components/DetailsModal"; // Importa el componente

interface Condominio {
  id: string;
  fecha: string;
  mesPagar: string;
  nombre: string;
  rifCondominio: number;
  noOficina: string;
  montoPagar: number;
}

interface CondominioModuleProps {
  filterType: "mes" | "año";
  filterValue: string;
  searchRif: string;
}

const meses = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

const formatToLocalDateTime = (isoString: string) => {
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
};

const CondominioModule: React.FC<CondominioModuleProps> = ({
  filterType,
  filterValue,
  searchRif,
}) => {
  const [allCondominios, setAllCondominios] = useState<Condominio[]>([]);
  const [displayedCondominios, setDisplayedCondominios] = useState<
    Condominio[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false); // Controla el modal de detalles
  const [selectedId, setSelectedId] = useState<string>(""); // ID del registro seleccionado
  const [newCondominio, setNewCondominio] = useState<Partial<Condominio>>({});
  const [editCondominio, setEditCondominio] = useState<Condominio | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchCondominios = async () => {
      setLoading(true);
      try {
        const response = await api.get("/condominio", {
          headers: {
            "ngrok-skip-browser-warning": "true", // Agrega este encabezado para omitir la advertencia de Ngrok
          },
        });
        let filteredCondominios = response.data;

        if (filterValue) {
          filteredCondominios = filteredCondominios.filter(
            (condominio: Condominio) => {
              const date = new Date(condominio.fecha);
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

        if (searchRif) {
          filteredCondominios = filteredCondominios.filter(
            (condominio: Condominio) =>
              condominio.rifCondominio.toString().includes(searchRif)
          );
        }

        setAllCondominios(filteredCondominios);
        updateDisplayedItems(filteredCondominios, currentPage);
      } catch (error: any) {
        console.error("Error fetching condominios:", error);
        setErrorMessage("Error al cargar los registros de Condominio.");
        setTimeout(() => setErrorMessage(null), 3000);
      } finally {
        setLoading(false);
      }
    };
    fetchCondominios();
  }, [filterType, filterValue, searchRif]);

  const updateDisplayedItems = (items: Condominio[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedCondominios(items.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(items.length / itemsPerPage));
  };

  const handleAddCondominio = async () => {
    try {
      const response = await api.post("/condominio", newCondominio);
      const updatedCondominios = [...allCondominios, response.data];
      setAllCondominios(updatedCondominios);
      updateDisplayedItems(updatedCondominios, currentPage);
      setShowAddModal(false);
      setNewCondominio({});
      setSuccessMessage("Registro de Condominio agregado con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Error adding condominio:", error);
      setErrorMessage(
        "Error al agregar el registro de Condominio. Intenta nuevamente."
      );
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleEditCondominio = async () => {
    if (!editCondominio) return;
    try {
      const response = await api.put(
        `/condominio/${editCondominio.id}`,
        editCondominio
      );
      const updatedCondominios = allCondominios.map((cond) =>
        cond.id === editCondominio.id ? response.data : cond
      );
      setAllCondominios(updatedCondominios);
      updateDisplayedItems(updatedCondominios, currentPage);
      setShowEditModal(false);
      setEditCondominio(null);
      setSuccessMessage("Registro de Condominio editado con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Error editing condominio:", error);
      setErrorMessage(
        "Error al editar el registro de Condominio. Intenta nuevamente."
      );
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleDeleteCondominio = async (id: string) => {
    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas eliminar este registro?"
    );
    if (confirmDelete) {
      try {
        await api.delete(`/condominio/${id}`);
        const updatedCondominios = allCondominios.filter(
          (cond) => cond.id !== id
        );
        setAllCondominios(updatedCondominios);
        updateDisplayedItems(updatedCondominios, currentPage);
        setSuccessMessage("Registro de Condominio eliminado con éxito");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error: any) {
        console.error("Error deleting condominio:", error);
        setErrorMessage("Error al eliminar el registro de Condominio.");
        setTimeout(() => setErrorMessage(null), 3000);
      }
    }
  };

  // Función: Abre el modal de detalles
  const handleShowDetails = (id: string) => {
    setSelectedId(id);
    setShowDetailModal(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    isEdit: boolean = false
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    const updatedValue =
      type === "checkbox"
        ? checked
        : type === "text"
        ? value.toUpperCase()
        : value;
    if (isEdit && editCondominio) {
      setEditCondominio({ ...editCondominio, [name]: updatedValue });
    } else {
      setNewCondominio({ ...newCondominio, [name]: updatedValue });
    }
  };

  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean = false
  ) => {
    const localDate = e.target.value;
    const isoDate = new Date(localDate).toISOString();
    if (isEdit && editCondominio) {
      setEditCondominio({ ...editCondominio, fecha: isoDate });
    } else {
      setNewCondominio({ ...newCondominio, fecha: isoDate });
    }
  };

  const openEditModal = (id: string) => {
    const condominioToEdit = allCondominios.find((cond) => cond.id === id);
    if (condominioToEdit) {
      setEditCondominio(condominioToEdit);
      setShowEditModal(true);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      updateDisplayedItems(allCondominios, page);
    }
  };

  return (
    <>
      <h3>Condominio</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <button
            className="btn btn-success mb-3"
            onClick={() => setShowAddModal(true)}
          >
            <i className="bi bi-plus me-1"></i> Agregar Registro Condominio
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
                <th>RIF Condominio</th>
                <th>Mes a Pagar</th>
                <th>Monto a Pagar</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayedCondominios.length > 0 ? (
                displayedCondominios.map((condominio) => (
                  <tr key={condominio.id}>
                    <td>{condominio.id}</td>
                    <td>
                      <span
                        style={{
                          cursor: "pointer",
                          color: "blue",
                          textDecoration: "underline",
                        }}
                        onClick={() => handleShowDetails(condominio.id)}
                      >
                        {condominio.nombre}
                      </span>
                    </td>
                    <td>{condominio.rifCondominio}</td>
                    <td>{condominio.mesPagar}</td>
                    <td>{condominio.montoPagar}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => openEditModal(condominio.id)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteCondominio(condominio.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center">
                    No hay registros de Condominio disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <nav aria-label="Page navigation">
            <ul className="pagination justify-content-end">
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

      {/* Modal para agregar */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar Registro Condominio</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Fecha</Form.Label>
              <Form.Control
                type="datetime-local"
                name="fecha"
                value={
                  newCondominio.fecha
                    ? formatToLocalDateTime(newCondominio.fecha)
                    : ""
                }
                onChange={(e) => handleDateChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mes a Pagar</Form.Label>
              <Form.Select
                name="mesPagar"
                value={newCondominio.mesPagar || ""}
                onChange={(e) => handleInputChange(e)}
                required
              >
                <option value="">Selecciona un mes</option>
                {meses.map((mes) => (
                  <option key={mes} value={mes}>
                    {mes}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={newCondominio.nombre || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>RIF Condominio</Form.Label>
              <Form.Control
                type="number"
                name="rifCondominio"
                value={newCondominio.rifCondominio || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>No. Oficina</Form.Label>
              <Form.Control
                type="text"
                name="noOficina"
                value={newCondominio.noOficina || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Monto a Pagar</Form.Label>
              <Form.Control
                type="number"
                name="montoPagar"
                value={newCondominio.montoPagar || ""}
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
          <Button variant="primary" onClick={handleAddCondominio}>
            Guardar Registro
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para editar */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Registro Condominio</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editCondominio && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Fecha</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="fecha"
                  value={
                    editCondominio.fecha
                      ? formatToLocalDateTime(editCondominio.fecha)
                      : ""
                  }
                  onChange={(e) => handleDateChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Mes a Pagar</Form.Label>
                <Form.Select
                  name="mesPagar"
                  value={editCondominio.mesPagar || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                >
                  <option value="">Selecciona un mes</option>
                  {meses.map((mes) => (
                    <option key={mes} value={mes}>
                      {mes}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre"
                  value={editCondominio.nombre || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>RIF Condominio</Form.Label>
                <Form.Control
                  type="number"
                  name="rifCondominio"
                  value={editCondominio.rifCondominio || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>No. Oficina</Form.Label>
                <Form.Control
                  type="text"
                  name="noOficina"
                  value={editCondominio.noOficina || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Monto a Pagar</Form.Label>
                <Form.Control
                  type="number"
                  name="montoPagar"
                  value={editCondominio.montoPagar || ""}
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
          <Button variant="primary" onClick={handleEditCondominio}>
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de detalles reusable */}
      <DetailsModal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        endpoint="/condominio"
        id={selectedId}
      />
    </>
  );
};

export default CondominioModule;
