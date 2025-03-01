import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Modal, Button, Form } from "react-bootstrap";

interface Invoice {
  id: string;
  tipoRif: string;
  rifProveedor: number;
  nombre: string;
  noFactura: number;
  fecha: string;
  base: number;
  iva: number;
  total: number;
  retieneIva: boolean;
  retencionIva: number;
  retieneIslr: boolean;
  retencionIslr: number;
  retiene1xMil: boolean;
  retencion1xMil: number;
  retiene115: boolean;
  retencion115: number;
}

interface FacturasModuleProps {
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

const FacturasModule: React.FC<FacturasModuleProps> = ({
  filterType,
  filterValue,
  searchRif,
}) => {
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [displayedInvoices, setDisplayedInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({});
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

  // Función: Carga todas las facturas desde el backend y aplica filtros
  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const response = await api.get("/facturas");
        let filteredInvoices = response.data;

        // Filtra por mes o año si hay un valor seleccionado
        if (filterValue) {
          filteredInvoices = filteredInvoices.filter((invoice: Invoice) => {
            const date = new Date(invoice.fecha);
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

        // Filtra por RIF si hay un valor de búsqueda
        if (searchRif) {
          filteredInvoices = filteredInvoices.filter((invoice: Invoice) =>
            invoice.rifProveedor.toString().includes(searchRif)
          );
        }

        setAllInvoices(filteredInvoices);
        updateDisplayedItems(filteredInvoices, currentPage);
      } catch (error: any) {
        console.error("Error fetching invoices:", error);
        setErrorMessage("Error al cargar las facturas.");
        setTimeout(() => setErrorMessage(null), 3000);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [filterType, filterValue, searchRif]);

  // Función: Actualiza las facturas mostradas en la tabla según la página actual
  const updateDisplayedItems = (items: Invoice[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedInvoices(items.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(items.length / itemsPerPage));
  };

  // Función: Agrega una nueva factura al backend y actualiza la lista
  const handleAddInvoice = async () => {
    try {
      const response = await api.post("/facturas", newInvoice);
      const updatedInvoices = [...allInvoices, response.data];
      setAllInvoices(updatedInvoices);
      updateDisplayedItems(updatedInvoices, currentPage);
      setShowAddModal(false);
      setNewInvoice({});
      setSuccessMessage("Factura agregada con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Error adding invoice:", error);
      setErrorMessage("Error al agregar la factura. Intenta nuevamente.");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Función: Edita una factura existente y actualiza la lista
  const handleEditInvoice = async () => {
    if (!editInvoice) return;
    try {
      const response = await api.put(
        `/facturas/${editInvoice.id}`,
        editInvoice
      );
      const updatedInvoices = allInvoices.map((inv) =>
        inv.id === editInvoice.id ? response.data : inv
      );
      setAllInvoices(updatedInvoices);
      updateDisplayedItems(updatedInvoices, currentPage);
      setShowEditModal(false);
      setEditInvoice(null);
      setSuccessMessage("Factura editada con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Error editing invoice:", error);
      setErrorMessage("Error al editar la factura. Intenta nuevamente.");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Función: Elimina una factura con confirmación y actualiza la lista
  const handleDeleteInvoice = async (id: string) => {
    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas eliminar esta factura?"
    );
    if (confirmDelete) {
      try {
        await api.delete(`/facturas/${id}`);
        const updatedInvoices = allInvoices.filter((inv) => inv.id !== id);
        setAllInvoices(updatedInvoices);
        updateDisplayedItems(updatedInvoices, currentPage);
        setSuccessMessage("Factura eliminada con éxito");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error: any) {
        console.error("Error deleting invoice:", error);
        setErrorMessage(
          "Error al eliminar la factura. Contacta al administrador."
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
    if (isEdit && editInvoice) {
      setEditInvoice({ ...editInvoice, [name]: updatedValue });
    } else {
      setNewInvoice({ ...newInvoice, [name]: updatedValue });
    }
  };

  // Función: Maneja el cambio de fecha en el formulario ajustando a ISO
  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean = false
  ) => {
    const localDate = e.target.value;
    const isoDate = new Date(localDate).toISOString();
    if (isEdit && editInvoice) {
      setEditInvoice({ ...editInvoice, fecha: isoDate });
    } else {
      setNewInvoice({ ...newInvoice, fecha: isoDate });
    }
  };

  // Función: Abre el modal de edición con los datos de la factura seleccionada
  const openEditModal = (id: string) => {
    const invoiceToEdit = allInvoices.find((inv) => inv.id === id);
    if (invoiceToEdit) {
      setEditInvoice(invoiceToEdit);
      setShowEditModal(true);
    }
  };

  // Función: Cambia la página actual y actualiza las facturas mostradas
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      updateDisplayedItems(allInvoices, page);
    }
  };

  return (
    <>
      <h3>Facturas</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <button
            className="btn btn-success mb-3"
            onClick={() => setShowAddModal(true)}
          >
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
                <th>ID</th>
                <th>Nombre</th>
                <th>RIF Proveedor</th>
                {/* Puedes descomentar No. Factura si decides mantenerlo */}
                {/* <th>No. Factura</th> */}
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayedInvoices.length > 0 ? (
                displayedInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.id}</td>
                    <td>{invoice.nombre}</td>
                    <td>{invoice.rifProveedor}</td>
                    {/* <td>{invoice.noFactura}</td> */}
                    <td>{invoice.total}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => openEditModal(invoice.id)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteInvoice(invoice.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center">
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

      {/* Modal para agregar factura */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar Factura</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tipo RIF</Form.Label>
              <Form.Control
                type="text"
                name="tipoRif"
                value={newInvoice.tipoRif || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>RIF Proveedor</Form.Label>
              <Form.Control
                type="number"
                name="rifProveedor"
                value={newInvoice.rifProveedor || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={newInvoice.nombre || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>No. Factura</Form.Label>
              <Form.Control
                type="number"
                name="noFactura"
                value={newInvoice.noFactura || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Fecha</Form.Label>
              <Form.Control
                type="datetime-local"
                name="fecha"
                value={
                  newInvoice.fecha
                    ? formatToLocalDateTime(newInvoice.fecha)
                    : ""
                }
                onChange={(e) => handleDateChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Base</Form.Label>
              <Form.Control
                type="number"
                name="base"
                value={newInvoice.base || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>IVA</Form.Label>
              <Form.Control
                type="number"
                name="iva"
                value={newInvoice.iva || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Total</Form.Label>
              <Form.Control
                type="number"
                name="total"
                value={newInvoice.total || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Retiene IVA"
                name="retieneIva"
                checked={newInvoice.retieneIva || false}
                onChange={(e) => handleInputChange(e)}
              />
              <Form.Control
                type="number"
                name="retencionIva"
                value={newInvoice.retencionIva || ""}
                onChange={(e) => handleInputChange(e)}
                disabled={!newInvoice.retieneIva}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Retiene ISLR"
                name="retieneIslr"
                checked={newInvoice.retieneIslr || false}
                onChange={(e) => handleInputChange(e)}
              />
              <Form.Control
                type="number"
                name="retencionIslr"
                value={newInvoice.retencionIslr || ""}
                onChange={(e) => handleInputChange(e)}
                disabled={!newInvoice.retieneIslr}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Retiene 1xMil"
                name="retiene1xMil"
                checked={newInvoice.retiene1xMil || false}
                onChange={(e) => handleInputChange(e)}
              />
              <Form.Control
                type="number"
                name="retencion1xMil"
                value={newInvoice.retencion1xMil || ""}
                onChange={(e) => handleInputChange(e)}
                disabled={!newInvoice.retiene1xMil}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Retiene 115"
                name="retiene115"
                checked={newInvoice.retiene115 || false}
                onChange={(e) => handleInputChange(e)}
              />
              <Form.Control
                type="number"
                name="retencion115"
                value={newInvoice.retencion115 || ""}
                onChange={(e) => handleInputChange(e)}
                disabled={!newInvoice.retiene115}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleAddInvoice}>
            Guardar Factura
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para editar factura */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Factura</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editInvoice && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Tipo RIF</Form.Label>
                <Form.Control
                  type="text"
                  name="tipoRif"
                  value={editInvoice.tipoRif || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>RIF Proveedor</Form.Label>
                <Form.Control
                  type="number"
                  name="rifProveedor"
                  value={editInvoice.rifProveedor || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre"
                  value={editInvoice.nombre || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>No. Factura</Form.Label>
                <Form.Control
                  type="number"
                  name="noFactura"
                  value={editInvoice.noFactura || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Fecha</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="fecha"
                  value={
                    editInvoice.fecha
                      ? formatToLocalDateTime(editInvoice.fecha)
                      : ""
                  }
                  onChange={(e) => handleDateChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Base</Form.Label>
                <Form.Control
                  type="number"
                  name="base"
                  value={editInvoice.base || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>IVA</Form.Label>
                <Form.Control
                  type="number"
                  name="iva"
                  value={editInvoice.iva || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Total</Form.Label>
                <Form.Control
                  type="number"
                  name="total"
                  value={editInvoice.total || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Retiene IVA"
                  name="retieneIva"
                  checked={editInvoice.retieneIva || false}
                  onChange={(e) => handleInputChange(e, true)}
                />
                <Form.Control
                  type="number"
                  name="retencionIva"
                  value={editInvoice.retencionIva || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  disabled={!editInvoice.retieneIva}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Retiene ISLR"
                  name="retieneIslr"
                  checked={editInvoice.retieneIslr || false}
                  onChange={(e) => handleInputChange(e, true)}
                />
                <Form.Control
                  type="number"
                  name="retencionIslr"
                  value={editInvoice.retencionIslr || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  disabled={!editInvoice.retieneIslr}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Retiene 1xMil"
                  name="retiene1xMil"
                  checked={editInvoice.retiene1xMil || false}
                  onChange={(e) => handleInputChange(e, true)}
                />
                <Form.Control
                  type="number"
                  name="retencion1xMil"
                  value={editInvoice.retencion1xMil || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  disabled={!editInvoice.retiene1xMil}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Retiene 115"
                  name="retiene115"
                  checked={editInvoice.retiene115 || false}
                  onChange={(e) => handleInputChange(e, true)}
                />
                <Form.Control
                  type="number"
                  name="retencion115"
                  value={editInvoice.retencion115 || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  disabled={!editInvoice.retiene115}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleEditInvoice}>
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default FacturasModule;
