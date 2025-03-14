import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Modal, Button, Form } from "react-bootstrap";
import DetailsModal from "../components/DetailsModal";

interface FacturaBackend {
  id: number;
  fecha: string;
  noFactura: string;
  rif: string;
  nombreProveedor?: string;
  nombre: string | null;
  fecha_vencimiento: string | null;
  sub_total: string;
  iva: string;
  porcentajeIva: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface Factura {
  id: string;
  fecha: string;
  numeroFactura: string;
  rif: string;
  nombre: string;
  fechaVencimiento: string;
  subtotal: number;
  iva: number;
  porcentajeIva: number;
  nombreProveedor?: string;
}

interface ProveedorListItem {
  rif: string;
  descripcion: string;
}

interface FacturasModuleProps {
  filterType: "mes" | "año";
  filterValue: string;
  searchRif: string;
}

const formatToLocalDate = (isoString: string) => {
  return isoString.slice(0, 10);
};

const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
};

const mapBackendToFrontend = (backendFactura: FacturaBackend): Factura => ({
  id: backendFactura.id.toString(),
  fecha: backendFactura.fecha,
  numeroFactura: backendFactura.noFactura,
  rif: backendFactura.rif || "",
  nombre: backendFactura.nombre || "",
  fechaVencimiento: backendFactura.fecha_vencimiento || "",
  subtotal: parseFloat(backendFactura.sub_total) || 0,
  iva: parseFloat(backendFactura.iva) || 0,
  porcentajeIva: parseFloat(backendFactura.porcentajeIva) || 16,
  nombreProveedor: backendFactura.nombreProveedor || "N/A",
});

const mapFrontendToBackend = (
  frontendFactura: Partial<Factura>
): Partial<FacturaBackend> => ({
  fecha: frontendFactura.fecha,
  noFactura: frontendFactura.numeroFactura,
  rif: frontendFactura.rif,
  nombre: frontendFactura.nombre,
  fecha_vencimiento: frontendFactura.fechaVencimiento,
  sub_total: frontendFactura.subtotal?.toString() || "0.00",
  iva: frontendFactura.iva?.toString() || "0.00",
  porcentajeIva: frontendFactura.porcentajeIva?.toString() || "16",
});

const FacturasModule: React.FC<FacturasModuleProps> = ({
  filterType,
  filterValue,
  searchRif,
}) => {
  const [allFacturas, setAllFacturas] = useState<Factura[]>([]);
  const [displayedFacturas, setDisplayedFacturas] = useState<Factura[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [newFactura, setNewFactura] = useState<Partial<Factura>>({
    porcentajeIva: 16,
    fechaVencimiento: getTomorrowDate(),
  });
  const [editFactura, setEditFactura] = useState<Factura | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchFacturas = async () => {
      setLoading(true);
      try {
        const response = await api.get("/facturas");
        console.log("Respuesta completa del backend (facturas):", response);
        console.log("Datos recibidos (response.data):", response.data);

        if (response.status === 204 || !Array.isArray(response.data)) {
          setAllFacturas([]);
          updateDisplayedItems([], currentPage);
          return;
        }

        const mappedFacturas = response.data.map(mapBackendToFrontend);
        let filteredFacturas = mappedFacturas;

        if (filterValue) {
          filteredFacturas = filteredFacturas.filter((factura: Factura) => {
            const date = new Date(factura.fecha);
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

        if (searchRif) {
          filteredFacturas = filteredFacturas.filter((factura: Factura) =>
            (factura.rif || "").toLowerCase().includes(searchRif.toLowerCase())
          );
        }

        setAllFacturas(filteredFacturas);
        updateDisplayedItems(filteredFacturas, currentPage);
      } catch (error: any) {
        console.error(
          "Error fetching facturas:",
          error.response?.data || error.message
        );
        setErrorMessage("Error al cargar las facturas.");
        setTimeout(() => setErrorMessage(null), 3000);
      } finally {
        setLoading(false);
      }
    };
    fetchFacturas();
  }, [filterType, filterValue, searchRif]);

  const fetchProveedores = async () => {
    try {
      const response = await api.get("/Proveedor/listAll");
      console.log("Proveedores recibidos:", response.data);
      setProveedores(response.data);
    } catch (error: any) {
      console.error(
        "Error fetching proveedores:",
        error.response?.data || error.message
      );
      setErrorMessage("Error al cargar los proveedores.");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleOpenAddModal = () => {
    if (proveedores.length === 0) {
      fetchProveedores(); // Solo carga proveedores si no están cargados
    }
    setShowAddModal(true);
  };

  const handleOpenEditModal = (id: string) => {
    const facturaToEdit = allFacturas.find((fact) => fact.id === id);
    if (facturaToEdit) {
      setEditFactura(facturaToEdit);
      if (proveedores.length === 0) {
        fetchProveedores(); // Solo carga proveedores si no están cargados
      }
      setShowEditModal(true);
    }
  };

  const updateDisplayedItems = (items: Factura[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedFacturas(items.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(items.length / itemsPerPage));
  };

  const handleAddFactura = async () => {
    try {
      const dataToSend = mapFrontendToBackend(newFactura);
      console.log("Datos enviados al guardar factura:", dataToSend);
      const response = await api.post("/facturas", dataToSend);
      console.log("Respuesta del POST /facturas:", response.data);
      const newFacturaMapped = mapBackendToFrontend(response.data);
      const updatedFacturas = [...allFacturas, newFacturaMapped];
      setAllFacturas(updatedFacturas);
      updateDisplayedItems(updatedFacturas, currentPage);
      setShowAddModal(false);
      setNewFactura({ porcentajeIva: 16, fechaVencimiento: getTomorrowDate() });
      setSuccessMessage("Factura agregada con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error(
        "Error adding factura:",
        error.response?.data || error.message
      );
      setErrorMessage(
        "Error al agregar la factura: " +
          (error.response?.data?.message || error.message)
      );
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleEditFactura = async () => {
    if (!editFactura) return;
    try {
      const dataToSend = mapFrontendToBackend(editFactura);
      console.log("Datos enviados al editar factura:", dataToSend);
      const response = await api.put(`/facturas/${editFactura.id}`, dataToSend);
      console.log("Respuesta del PUT /facturas:", response.data);
      const updatedFacturaMapped = mapBackendToFrontend(response.data);
      const updatedFacturas = allFacturas.map((fact) =>
        fact.id === editFactura.id ? updatedFacturaMapped : fact
      );
      setAllFacturas(updatedFacturas);
      updateDisplayedItems(updatedFacturas, currentPage);
      setShowEditModal(false);
      setEditFactura(null);
      setSuccessMessage("Factura editada con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error(
        "Error editing factura:",
        error.response?.data || error.message
      );
      setErrorMessage(
        "Error al editar la factura: " +
          (error.response?.data?.message || error.message)
      );
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleDeleteFactura = async (id: string) => {
    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas eliminar esta factura?"
    );
    if (confirmDelete) {
      try {
        await api.delete(`/facturas/${id}`);
        const updatedFacturas = allFacturas.filter((fact) => fact.id !== id);
        setAllFacturas(updatedFacturas);
        updateDisplayedItems(updatedFacturas, currentPage);
        setSuccessMessage("Factura eliminada con éxito");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error: any) {
        console.error(
          "Error deleting factura:",
          error.response?.data || error.message
        );
        setErrorMessage(
          "Error al eliminar la factura: " +
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
      name === "subtotal" || name === "iva" || name === "porcentajeIva"
        ? Number(value)
        : value;
    if (isEdit && editFactura) {
      setEditFactura({ ...editFactura, [name]: updatedValue });
    } else {
      setNewFactura({ ...newFactura, [name]: updatedValue });
    }
  };

  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean = false
  ) => {
    const localDate = e.target.value;
    const isoDate = new Date(localDate).toISOString();
    if (isEdit && editFactura) {
      setEditFactura({ ...editFactura, [e.target.name]: isoDate });
    } else {
      setNewFactura({ ...newFactura, [e.target.name]: isoDate });
    }
  };

  const handleShowDetails = (id: string) => {
    setSelectedId(id);
    setShowDetailModal(true);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      updateDisplayedItems(allFacturas, page);
    }
  };

  return (
    <>
      <h3>Facturas</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <button className="btn btn-success mb-3" onClick={handleOpenAddModal}>
            <i className="bi bi-plus me-1"></i> Agregar Factura
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
                <th>Número Factura</th>
                <th>RIF</th>
                <th>Proveedor</th>
                <th>Subtotal</th>
                <th>IVA</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayedFacturas.length > 0 ? (
                displayedFacturas.map((factura) => (
                  <tr key={factura.id}>
                    <td>
                      <span
                        style={{
                          cursor: "pointer",
                          color: "blue",
                          textDecoration: "underline",
                        }}
                        onClick={() => handleShowDetails(factura.id)}
                      >
                        {new Date(factura.fecha).toLocaleDateString()}
                      </span>
                    </td>
                    <td>{factura.numeroFactura || "N/A"}</td>
                    <td>{factura.rif || "N/A"}</td>
                    <td>{factura.nombreProveedor || "N/A"}</td>
                    <td>{factura.subtotal || "N/A"}</td>
                    <td>{factura.iva || "N/A"}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => handleOpenEditModal(factura.id)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteFactura(factura.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center">
                    No hay facturas disponibles
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

      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar Factura</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Fecha de Factura</Form.Label>
              <Form.Control
                type="date"
                name="fecha"
                value={
                  newFactura.fecha ? formatToLocalDate(newFactura.fecha) : ""
                }
                onChange={(e) => handleDateChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Fecha de Vencimiento</Form.Label>
              <Form.Control
                type="date"
                name="fechaVencimiento"
                value={
                  newFactura.fechaVencimiento
                    ? formatToLocalDate(newFactura.fechaVencimiento)
                    : getTomorrowDate()
                }
                onChange={(e) => handleDateChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Número de Factura</Form.Label>
              <Form.Control
                type="text"
                name="numeroFactura"
                value={newFactura.numeroFactura || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={newFactura.nombre || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Proveedor (RIF)</Form.Label>
              <Form.Select
                name="rif"
                value={newFactura.rif || ""}
                onChange={(e) => handleInputChange(e)}
                required
              >
                <option value="">Seleccione un proveedor</option>
                {proveedores.map((prov) => (
                  <option key={prov.rif} value={prov.rif}>
                    {prov.descripcion}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Subtotal</Form.Label>
              <Form.Control
                type="number"
                name="subtotal"
                value={newFactura.subtotal || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>IVA</Form.Label>
              <Form.Control
                type="number"
                name="iva"
                value={newFactura.iva || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Porcentaje IVA</Form.Label>
              <Form.Control
                type="number"
                name="porcentajeIva"
                value={
                  newFactura.porcentajeIva !== undefined
                    ? newFactura.porcentajeIva
                    : 16
                }
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
          <Button variant="primary" onClick={handleAddFactura}>
            Guardar Factura
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Factura</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editFactura && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Fecha de Recepción</Form.Label>
                <Form.Control
                  type="date"
                  name="fecha"
                  value={
                    editFactura.fecha
                      ? formatToLocalDate(editFactura.fecha)
                      : ""
                  }
                  onChange={(e) => handleDateChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Fecha de Vencimiento</Form.Label>
                <Form.Control
                  type="date"
                  name="fechaVencimiento"
                  value={
                    editFactura.fechaVencimiento
                      ? formatToLocalDate(editFactura.fechaVencimiento)
                      : getTomorrowDate()
                  }
                  onChange={(e) => handleDateChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Número de Factura</Form.Label>
                <Form.Control
                  type="text"
                  name="numeroFactura"
                  value={editFactura.numeroFactura || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Descripción</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre"
                  value={editFactura.nombre || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Proveedor (RIF)</Form.Label>
                <Form.Select
                  name="rif"
                  value={editFactura.rif || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                >
                  <option value="">Seleccione un proveedor</option>
                  {proveedores.map((prov) => (
                    <option key={prov.rif} value={prov.rif}>
                      {prov.descripcion}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Subtotal</Form.Label>
                <Form.Control
                  type="number"
                  name="subtotal"
                  value={editFactura.subtotal || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>IVA</Form.Label>
                <Form.Control
                  type="number"
                  name="iva"
                  value={editFactura.iva || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Porcentaje IVA</Form.Label>
                <Form.Control
                  type="number"
                  name="porcentajeIva"
                  value={
                    editFactura.porcentajeIva !== undefined
                      ? editFactura.porcentajeIva
                      : 16
                  }
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
          <Button variant="primary" onClick={handleEditFactura}>
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>

      <DetailsModal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        endpoint="/facturas"
        id={selectedId}
      />
    </>
  );
};

export default FacturasModule;
