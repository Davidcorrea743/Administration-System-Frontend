import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Modal, Button, Form } from "react-bootstrap";
import DetailsModal from "../components/DetailsModal";

interface Proveedor {
  id?: number;
  fechaVencimientoRif: string;
  razonSocial: string;
  tipoRif: string;
  rif: number | string;
  noOficina: string;
  direccion: string;
  porcentaje_retencion: number;
}

interface ProveedorListItem {
  rif: string;
  descripcion: string;
}

const tipoRifOptions = [
  { label: "Persona Natural Venezolana", value: "V" },
  { label: "Persona Natural Extranjera", value: "E" },
  { label: "Persona Jurídica", value: "J" },
  { label: "Entidad Gubernamental", value: "G" },
  { label: "Pasaporte", value: "P" },
];

interface ProveedoresModuleProps {
  filterType?: "mes" | "año";
  filterValue?: string;
  searchRif?: string;
}

const formatToLocalDateTime = (isoString: string) => {
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
};

const ProveedoresModule: React.FC<ProveedoresModuleProps> = ({
  filterType,
  filterValue,
  searchRif,
}) => {
  const [allProveedores, setAllProveedores] = useState<ProveedorListItem[]>([]);
  const [displayedProveedores, setDisplayedProveedores] = useState<
    ProveedorListItem[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [newProveedor, setNewProveedor] = useState<Partial<Proveedor>>({});
  const [editProveedor, setEditProveedor] = useState<Proveedor | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchProveedores = async () => {
      setLoading(true);
      try {
        console.log("Haciendo solicitud a: /Proveedor/listAll");
        const response = await api.get("/Proveedor/listAll");
        console.log("Respuesta del backend:", response.data);

        let filteredProveedores: ProveedorListItem[] = response.data;

        if (searchRif) {
          filteredProveedores = filteredProveedores.filter((prov) =>
            prov.rif.toString().includes(searchRif)
          );
        }

        console.log("Proveedores filtrados:", filteredProveedores);
        setAllProveedores(filteredProveedores);
        updateDisplayedItems(filteredProveedores, currentPage);
      } catch (error: any) {
        console.error(
          "Error fetching proveedores:",
          error.response?.data || error.message
        );
        setErrorMessage(
          "Error al cargar los proveedores: " +
            (error.response?.data?.message || error.message)
        );
        setTimeout(() => setErrorMessage(null), 5000);
      } finally {
        setLoading(false);
      }
    };
    fetchProveedores();
  }, [searchRif]);

  const updateDisplayedItems = (items: ProveedorListItem[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedProveedores(items.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(items.length / itemsPerPage));
  };

  const handleAddProveedor = async () => {
    try {
      const response = await api.post("/Proveedor", newProveedor);
      const newProvListItem: ProveedorListItem = {
        rif: response.data.rif.toString(),
        descripcion: `N-${response.data.rif}, ${response.data.razonSocial}`,
      };
      const updatedProveedores = [...allProveedores, newProvListItem];
      setAllProveedores(updatedProveedores);
      updateDisplayedItems(updatedProveedores, currentPage);
      setShowAddModal(false);
      setNewProveedor({});
      setSuccessMessage("Proveedor agregado con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error(
        "Error adding proveedor:",
        error.response?.data || error.message
      );
      setErrorMessage(
        "Error al agregar el proveedor: " +
          (error.response?.data?.message || error.message)
      );
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleEditProveedor = async () => {
    if (!editProveedor) return;
    try {
      const response = await api.put(
        `/Proveedor/${editProveedor.id}`,
        editProveedor
      );
      const updatedProveedores = allProveedores.map((prov) =>
        prov.rif === editProveedor.rif
          ? {
              rif: prov.rif,
              descripcion: `N-${prov.rif}, ${response.data.razonSocial}`,
            }
          : prov
      );
      setAllProveedores(updatedProveedores);
      updateDisplayedItems(updatedProveedores, currentPage);
      setShowEditModal(false);
      setEditProveedor(null);
      setSuccessMessage("Proveedor editado con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error(
        "Error editing proveedor:",
        error.response?.data || error.message
      );
      setErrorMessage(
        "Error al editar el proveedor: " +
          (error.response?.data?.message || error.message)
      );
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleDeleteProveedor = async (rif: string) => {
    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas eliminar este proveedor?"
    );
    if (confirmDelete) {
      try {
        await api.delete(`/Proveedor/${rif}`); // Usamos rif como ID
        const updatedProveedores = allProveedores.filter(
          (prov) => prov.rif !== rif
        );
        setAllProveedores(updatedProveedores);
        updateDisplayedItems(updatedProveedores, currentPage);
        setSuccessMessage("Proveedor eliminado con éxito");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error: any) {
        console.error(
          "Error deleting proveedor:",
          error.response?.data || error.message
        );
        setErrorMessage(
          "Error al eliminar el proveedor: " +
            (error.response?.data?.message || error.message)
        );
        setTimeout(() => setErrorMessage(null), 3000);
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean = false
  ) => {
    const { name, value } = e.target;
    const updatedValue =
      name === "rif" || name === "porcentaje_retencion"
        ? Number(value) || 0
        : value.toUpperCase();
    if (isEdit && editProveedor) {
      setEditProveedor({ ...editProveedor, [name]: updatedValue });
    } else {
      setNewProveedor({ ...newProveedor, [name]: updatedValue });
    }
  };

  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean = false
  ) => {
    const localDate = e.target.value;
    const isoDate = new Date(localDate).toISOString();
    if (isEdit && editProveedor) {
      setEditProveedor({ ...editProveedor, fechaVencimientoRif: isoDate });
    } else {
      setNewProveedor({ ...newProveedor, fechaVencimientoRif: isoDate });
    }
  };

  const handleShowDetails = (rif: string) => {
    setSelectedId(rif);
    setShowDetailModal(true);
  };

  const openEditModal = (rif: string) => {
    const fetchProveedorDetails = async () => {
      try {
        const response = await api.get(`/Proveedor/${rif}`);
        setEditProveedor(response.data);
        setShowEditModal(true);
      } catch (error: any) {
        console.error(
          "Error fetching proveedor details:",
          error.response?.data || error.message
        );
        setErrorMessage("Error al cargar los detalles del proveedor.");
        setTimeout(() => setErrorMessage(null), 3000);
      }
    };
    fetchProveedorDetails();
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      updateDisplayedItems(allProveedores, page);
    }
  };

  return (
    <>
      <h3>Proveedores</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <button
            className="btn btn-success mb-3"
            onClick={() => setShowAddModal(true)}
          >
            <i className="bi bi-plus me-1"></i> Agregar Proveedor
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
                <th>RIF</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayedProveedores.length > 0 ? (
                displayedProveedores.map((proveedor) => (
                  <tr key={proveedor.rif}>
                    <td>{proveedor.rif}</td>
                    <td>
                      <span
                        style={{
                          cursor: "pointer",
                          color: "blue",
                          textDecoration: "underline",
                        }}
                        onClick={() => handleShowDetails(proveedor.rif)}
                      >
                        {proveedor.descripcion}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => openEditModal(proveedor.rif)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteProveedor(proveedor.rif)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center">
                    No hay proveedores disponibles
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

      {/* Modal para agregar proveedor */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar Proveedor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Fecha Vencimiento RIF</Form.Label>
              <Form.Control
                type="datetime-local"
                name="fechaVencimientoRif"
                value={
                  newProveedor.fechaVencimientoRif
                    ? formatToLocalDateTime(newProveedor.fechaVencimientoRif)
                    : ""
                }
                onChange={(e) => handleDateChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Razón Social</Form.Label>
              <Form.Control
                type="text"
                name="razonSocial"
                value={newProveedor.razonSocial || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo RIF</Form.Label>
              <Form.Select
                name="tipoRif"
                value={newProveedor.tipoRif || ""}
                onChange={(e) => handleInputChange(e)}
                required
              >
                <option value="">Seleccione un tipo de RIF</option>
                {tipoRifOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>RIF</Form.Label>
              <Form.Control
                type="number"
                name="rif"
                value={newProveedor.rif || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>No. Oficina</Form.Label>
              <Form.Control
                type="text"
                name="noOficina"
                value={newProveedor.noOficina || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Dirección</Form.Label>
              <Form.Control
                type="text"
                name="direccion"
                value={newProveedor.direccion || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Porcentaje de Retención</Form.Label>
              <Form.Control
                type="number"
                name="porcentaje_retencion"
                value={newProveedor.porcentaje_retencion || ""}
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
          <Button variant="primary" onClick={handleAddProveedor}>
            Guardar Proveedor
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para editar proveedor */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Proveedor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editProveedor && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Fecha Vencimiento RIF</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="fechaVencimientoRif"
                  value={
                    editProveedor.fechaVencimientoRif
                      ? formatToLocalDateTime(editProveedor.fechaVencimientoRif)
                      : ""
                  }
                  onChange={(e) => handleDateChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Razón Social</Form.Label>
                <Form.Control
                  type="text"
                  name="razonSocial"
                  value={editProveedor.razonSocial || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Tipo RIF</Form.Label>
                <Form.Select
                  name="tipoRif"
                  value={editProveedor.tipoRif || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                >
                  <option value="">Seleccione un tipo de RIF</option>
                  {tipoRifOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>RIF</Form.Label>
                <Form.Control
                  type="number"
                  name="rif"
                  value={editProveedor.rif || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>No. Oficina</Form.Label>
                <Form.Control
                  type="text"
                  name="noOficina"
                  value={editProveedor.noOficina || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Dirección</Form.Label>
                <Form.Control
                  type="text"
                  name="direccion"
                  value={editProveedor.direccion || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Porcentaje de Retención</Form.Label>
                <Form.Control
                  type="number"
                  name="porcentaje_retencion"
                  value={editProveedor.porcentaje_retencion || ""}
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
          <Button variant="primary" onClick={handleEditProveedor}>
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>

      <DetailsModal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        endpoint="/Proveedor"
        id={selectedId}
      />
    </>
  );
};

export default ProveedoresModule;
