import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Modal, Button, Form } from "react-bootstrap";
import DetailsModal from "../components/DetailsModal";

interface ServicioBasicoBackend {
  id: number;
  fecha: string;
  mesPagar: string;
  noOficina: string;
  montoPagar: string;
  iva: string;
  serviciosBasicos: string;
  contratoControlTelefono: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface ServicioBasico {
  id: string;
  fecha: string;
  mesPagar: string;
  noOficina: string;
  montoPagar: number;
  iva: number;
  serviciosBasicos: string;
  contratoControlTelefono: string;
}

interface ServiciosBasicosModuleProps {
  filterType: "mes" | "año";
  filterValue: string;
  searchNoOficina: string;
}

// Opciones para los dropdowns
const mesPagarOptions = [
  { label: "ENERO", value: "ENE" },
  { label: "FEBRERO", value: "FEB" },
  { label: "MARZO", value: "MAR" },
  { label: "ABRIL", value: "ABR" },
  { label: "MAYO", value: "MAY" },
  { label: "JUNIO", value: "JUN" },
  { label: "JULIO", value: "JUL" },
  { label: "AGOSTO", value: "AGO" },
  { label: "SEPTIEMBRE", value: "SEP" },
  { label: "OCTUBRE", value: "OCT" },
  { label: "NOVIEMBRE", value: "NOV" },
  { label: "DICIEMBRE", value: "DIC" },
];

const serviciosBasicosOptions = [
  { label: "Hidrocapital", value: "HIDROCAPITAL" },
  { label: "Corpoelec", value: "CORPOELEC" },
  { label: "Aseo", value: "ASEO" },
  { label: "CANTV", value: "CANTV" },
  { label: "Movistar", value: "MOVISTAR" },
  { label: "Movilnet", value: "MOVILNET" },
  { label: "Digitel", value: "DIGITEL" },
];

// Función para formatear la fecha sin horas
const formatToLocalDate = (isoString: string) => {
  return isoString.slice(0, 10); // Devuelve solo YYYY-MM-DD
};

// Función para mapear datos del backend al frontend
const mapBackendToFrontend = (
  backendServicio: ServicioBasicoBackend
): ServicioBasico => ({
  id: backendServicio.id.toString(),
  fecha: backendServicio.fecha,
  mesPagar: backendServicio.mesPagar,
  noOficina: backendServicio.noOficina,
  montoPagar: parseFloat(backendServicio.montoPagar) || 0,
  iva: parseFloat(backendServicio.iva) || 0,
  serviciosBasicos: backendServicio.serviciosBasicos,
  contratoControlTelefono: backendServicio.contratoControlTelefono,
});

// Función para mapear datos del frontend al backend
const mapFrontendToBackend = (
  frontendServicio: Partial<ServicioBasico>
): Partial<ServicioBasicoBackend> => ({
  fecha: frontendServicio.fecha,
  mesPagar: frontendServicio.mesPagar,
  noOficina: frontendServicio.noOficina,
  montoPagar: frontendServicio.montoPagar?.toString() || "0",
  iva: frontendServicio.iva?.toString() || "0",
  serviciosBasicos: frontendServicio.serviciosBasicos,
  contratoControlTelefono: frontendServicio.contratoControlTelefono || "",
});

const ServiciosBasicosModule: React.FC<ServiciosBasicosModuleProps> = ({
  filterType,
  filterValue,
  searchNoOficina,
}) => {
  const [allServicios, setAllServicios] = useState<ServicioBasico[]>([]);
  const [displayedServicios, setDisplayedServicios] = useState<
    ServicioBasico[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [newServicio, setNewServicio] = useState<Partial<ServicioBasico>>({
    contratoControlTelefono: "", // Valor por defecto
  });
  const [editServicio, setEditServicio] = useState<ServicioBasico | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchServicios = async () => {
      setLoading(true);
      try {
        const response = await api.get("/serv_basicos"); // Cambia de "/api/v1/serv_basicos"
        console.log("Servicios recibidos del backend:", response.data);
        const mappedServicios = response.data.map(mapBackendToFrontend);
        let filteredServicios = mappedServicios;

        if (filterValue) {
          filteredServicios = filteredServicios.filter(
            (servicio: ServicioBasico) => {
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

        if (searchNoOficina) {
          filteredServicios = filteredServicios.filter(
            (servicio: ServicioBasico) =>
              servicio.noOficina
                .toLowerCase()
                .includes(searchNoOficina.toLowerCase())
          );
        }

        setAllServicios(filteredServicios);
        updateDisplayedItems(filteredServicios, currentPage);
      } catch (error: any) {
        console.error(
          "Error fetching servicios:",
          error.response?.data || error.message
        );
        setErrorMessage("Error al cargar los servicios básicos.");
        setTimeout(() => setErrorMessage(null), 3000);
      } finally {
        setLoading(false);
      }
    };
    fetchServicios();
  }, [filterType, filterValue, searchNoOficina]);

  const updateDisplayedItems = (items: ServicioBasico[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedServicios(items.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(items.length / itemsPerPage));
  };

  const handleAddServicio = async () => {
    try {
      const dataToSend = mapFrontendToBackend(newServicio);
      console.log("Datos enviados al guardar servicio:", dataToSend);
      const response = await api.post("/serv_basicos", dataToSend); // Cambia de "/api/v1/serv_basicos"
      console.log("Respuesta del POST /serv_basicos:", response.data);
      const newServicioMapped = mapBackendToFrontend(response.data);
      const updatedServicios = [...allServicios, newServicioMapped];
      setAllServicios(updatedServicios);
      updateDisplayedItems(updatedServicios, currentPage);
      setShowAddModal(false);
      setNewServicio({});
      setSuccessMessage("Servicio básico agregado con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error(
        "Error adding servicio:",
        error.response?.data || error.message
      );
      setErrorMessage(
        "Error al agregar el servicio: " +
          (error.response?.data?.message || error.message)
      );
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleEditServicio = async () => {
    if (!editServicio) return;
    try {
      const dataToSend = mapFrontendToBackend(editServicio);
      console.log("Datos enviados al editar servicio:", dataToSend);
      const response = await api.put(
        `/serv_basicos/${editServicio.id}`,
        dataToSend
      ); // Cambia de "/api/v1/serv_basicos/${editServicio.id}"
      console.log("Respuesta del PUT /serv_basicos:", response.data);
      const updatedServicioMapped = mapBackendToFrontend(response.data);
      const updatedServicios = allServicios.map((serv) =>
        serv.id === editServicio.id ? updatedServicioMapped : serv
      );
      setAllServicios(updatedServicios);
      updateDisplayedItems(updatedServicios, currentPage);
      setShowEditModal(false);
      setEditServicio(null);
      setSuccessMessage("Servicio básico editado con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error(
        "Error editing servicio:",
        error.response?.data || error.message
      );
      setErrorMessage(
        "Error al editar el servicio: " +
          (error.response?.data?.message || error.message)
      );
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleDeleteServicio = async (id: string) => {
    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas eliminar este servicio básico?"
    );
    if (confirmDelete) {
      try {
        await api.delete(`/serv_basicos/${id}`); // Cambia de "/api/v1/serv_basicos/${id}"
        const updatedServicios = allServicios.filter((serv) => serv.id !== id);
        setAllServicios(updatedServicios);
        updateDisplayedItems(updatedServicios, currentPage);
        setSuccessMessage("Servicio básico eliminado con éxito");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error: any) {
        console.error(
          "Error deleting servicio:",
          error.response?.data || error.message
        );
        setErrorMessage(
          "Error al eliminar el servicio: " +
            (error.response?.data?.message || error.message)
        );
        setTimeout(() => setErrorMessage(null), 3000);
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    isEdit: boolean = false
  ) => {
    const { name, value } = e.target;
    const updatedValue =
      name === "montoPagar" || name === "iva" ? Number(value) : value;
    if (isEdit && editServicio) {
      setEditServicio({ ...editServicio, [name]: updatedValue });
    } else {
      setNewServicio({ ...newServicio, [name]: updatedValue });
    }
  };

  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean = false
  ) => {
    const localDate = e.target.value; // YYYY-MM-DD
    if (isEdit && editServicio) {
      setEditServicio({ ...editServicio, fecha: localDate });
    } else {
      setNewServicio({ ...newServicio, fecha: localDate });
    }
  };

  const handleShowDetails = (id: string) => {
    setSelectedId(id);
    setShowDetailModal(true);
  };

  const openEditModal = (id: string) => {
    const servicioToEdit = allServicios.find((serv) => serv.id === id);
    console.log("Servicio seleccionado para editar:", servicioToEdit);
    if (servicioToEdit) {
      setEditServicio(servicioToEdit);
      setShowEditModal(true);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      updateDisplayedItems(allServicios, page);
    }
  };

  return (
    <>
      <h3>Servicios Básicos</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <button
            className="btn btn-success mb-3"
            onClick={() => setShowAddModal(true)}
          >
            <i className="bi bi-plus me-1"></i> Agregar Servicio Básico
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
                <th>Fecha</th>
                <th>Mes a Pagar</th>
                <th>No. Oficina</th>
                <th>Monto a Pagar</th>
                <th>IVA</th>
                <th>Servicio</th>
                <th>Contrato/Control Teléfono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayedServicios.length > 0 ? (
                displayedServicios.map((servicio) => (
                  <tr key={servicio.id}>
                    <td>
                      <span
                        style={{
                          cursor: "pointer",
                          color: "blue",
                          textDecoration: "underline",
                        }}
                        onClick={() => handleShowDetails(servicio.id)}
                      >
                        {new Date(servicio.fecha).toLocaleDateString()}
                      </span>
                    </td>
                    <td>{servicio.mesPagar || "N/A"}</td>
                    <td>{servicio.noOficina || "N/A"}</td>
                    <td>{servicio.montoPagar || "N/A"}</td>
                    <td>{servicio.iva || "N/A"}</td>
                    <td>{servicio.serviciosBasicos || "N/A"}</td>
                    <td>{servicio.contratoControlTelefono || "N/A"}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => openEditModal(servicio.id)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteServicio(servicio.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center">
                    No hay servicios básicos disponibles
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

      {/* Modal para agregar servicio básico */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar Servicio Básico</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Fecha</Form.Label>
              <Form.Control
                type="date"
                name="fecha"
                value={
                  newServicio.fecha ? formatToLocalDate(newServicio.fecha) : ""
                }
                onChange={(e) => handleDateChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mes a Pagar</Form.Label>
              <Form.Select
                name="mesPagar"
                value={newServicio.mesPagar || ""}
                onChange={(e) => handleInputChange(e)}
                required
              >
                <option value="">Seleccione un mes</option>
                {mesPagarOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>No. Oficina</Form.Label>
              <Form.Control
                type="text"
                name="noOficina"
                value={newServicio.noOficina || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Monto a Pagar</Form.Label>
              <Form.Control
                type="number"
                name="montoPagar"
                value={newServicio.montoPagar || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>IVA</Form.Label>
              <Form.Control
                type="number"
                name="iva"
                value={newServicio.iva || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Servicio Básico</Form.Label>
              <Form.Select
                name="serviciosBasicos"
                value={newServicio.serviciosBasicos || ""}
                onChange={(e) => handleInputChange(e)}
                required
              >
                <option value="">Seleccione un servicio</option>
                {serviciosBasicosOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contrato/Control Teléfono</Form.Label>
              <Form.Control
                type="text"
                name="contratoControlTelefono"
                value={newServicio.contratoControlTelefono || ""}
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
          <Button variant="primary" onClick={handleAddServicio}>
            Guardar Servicio
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para editar servicio básico */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Servicio Básico</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editServicio && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Fecha</Form.Label>
                <Form.Control
                  type="date"
                  name="fecha"
                  value={
                    editServicio.fecha
                      ? formatToLocalDate(editServicio.fecha)
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
                  value={editServicio.mesPagar || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                >
                  <option value="">Seleccione un mes</option>
                  {mesPagarOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>No. Oficina</Form.Label>
                <Form.Control
                  type="text"
                  name="noOficina"
                  value={editServicio.noOficina || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Monto a Pagar</Form.Label>
                <Form.Control
                  type="number"
                  name="montoPagar"
                  value={editServicio.montoPagar || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>IVA</Form.Label>
                <Form.Control
                  type="number"
                  name="iva"
                  value={editServicio.iva || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Servicio Básico</Form.Label>
                <Form.Select
                  name="serviciosBasicos"
                  value={editServicio.serviciosBasicos || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                >
                  <option value="">Seleccione un servicio</option>
                  {serviciosBasicosOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Contrato/Control Teléfono</Form.Label>
                <Form.Control
                  type="text"
                  name="contratoControlTelefono"
                  value={editServicio.contratoControlTelefono || ""}
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
          <Button variant="primary" onClick={handleEditServicio}>
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>

      <DetailsModal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        endpoint="/serv_basicos"
        id={selectedId}
      />
    </>
  );
};

export default ServiciosBasicosModule;
