import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Modal, Button, Form } from "react-bootstrap";

interface Nomina {
  id: string;
  fecha: string;
  sueldo: number;
  primas: number;
  complementos: number;
  asistenciaSE: number;
  aguinaldos: number;
  bonoVacacional: number;
  otrasSubvenciones: number;
  prestacionesSociales: number;
  retencionesIVSS: number;
  retencionSPF: number;
  retencionFAOV: number;
  comisionesBancarias: number;
}

interface NominaModuleProps {
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

const NominaModule: React.FC<NominaModuleProps> = ({
  filterType,
  filterValue,
  searchRif,
}) => {
  const [allNominas, setAllNominas] = useState<Nomina[]>([]);
  const [displayedNominas, setDisplayedNominas] = useState<Nomina[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [newNomina, setNewNomina] = useState<Partial<Nomina>>({});
  const [editNomina, setEditNomina] = useState<Nomina | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

  // Función: Carga todas las nóminas desde el backend y aplica filtros
  useEffect(() => {
    const fetchNominas = async () => {
      setLoading(true);
      try {
        const response = await api.get("/nomina");
        let filteredNominas = response.data;

        // Filtra por mes o año si hay un valor seleccionado
        if (filterValue) {
          filteredNominas = filteredNominas.filter((nomina: Nomina) => {
            const date = new Date(nomina.fecha);
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
          filteredNominas = filteredNominas.filter((nomina: Nomina) =>
            nomina.id.toString().includes(searchRif)
          );
        }

        setAllNominas(filteredNominas);
        updateDisplayedItems(filteredNominas, currentPage);
      } catch (error: any) {
        console.error("Error fetching nóminas:", error);
        setErrorMessage("Error al cargar las nóminas.");
        setTimeout(() => setErrorMessage(null), 3000);
      } finally {
        setLoading(false);
      }
    };
    fetchNominas();
  }, [filterType, filterValue, searchRif]);

  // Función: Actualiza las nóminas mostradas en la tabla según la página actual
  const updateDisplayedItems = (items: Nomina[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedNominas(items.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(items.length / itemsPerPage));
  };

  // Función: Agrega una nueva nómina al backend y actualiza la lista
  const handleAddNomina = async () => {
    try {
      const response = await api.post("/nomina", newNomina);
      const updatedNominas = [...allNominas, response.data];
      setAllNominas(updatedNominas);
      updateDisplayedItems(updatedNominas, currentPage);
      setShowAddModal(false);
      setNewNomina({});
      setSuccessMessage("Nómina agregada con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Error adding nómina:", error);
      setErrorMessage("Error al agregar la nómina. Intenta nuevamente.");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Función: Edita una nómina existente y actualiza la lista
  const handleEditNomina = async () => {
    if (!editNomina) return;
    try {
      const response = await api.put(`/nomina/${editNomina.id}`, editNomina);
      const updatedNominas = allNominas.map((nom) =>
        nom.id === editNomina.id ? response.data : nom
      );
      setAllNominas(updatedNominas);
      updateDisplayedItems(updatedNominas, currentPage);
      setShowEditModal(false);
      setEditNomina(null);
      setSuccessMessage("Nómina editada con éxito");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error("Error editing nómina:", error);
      setErrorMessage("Error al editar la nómina. Intenta nuevamente.");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Función: Elimina una nómina con confirmación y actualiza la lista
  const handleDeleteNomina = async (id: string) => {
    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas eliminar esta nómina?"
    );
    if (confirmDelete) {
      try {
        await api.delete(`/nomina/${id}`);
        const updatedNominas = allNominas.filter((nom) => nom.id !== id);
        setAllNominas(updatedNominas);
        updateDisplayedItems(updatedNominas, currentPage);
        setSuccessMessage("Nómina eliminada con éxito");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error: any) {
        console.error("Error deleting nómina:", error);
        setErrorMessage(
          "Error al eliminar la nómina. Contacta al administrador."
        );
        setTimeout(() => setErrorMessage(null), 3000);
      }
    }
  };

  // Función: Maneja los cambios en los inputs del formulario, no hay strings para uppercase aquí
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean = false
  ) => {
    const { name, value, type, checked } = e.target;
    const updatedValue = type === "checkbox" ? checked : value;
    if (isEdit && editNomina) {
      setEditNomina({ ...editNomina, [name]: updatedValue });
    } else {
      setNewNomina({ ...newNomina, [name]: updatedValue });
    }
  };

  // Función: Maneja el cambio de fecha en el formulario ajustando a ISO
  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean = false
  ) => {
    const localDate = e.target.value;
    const isoDate = new Date(localDate).toISOString();
    if (isEdit && editNomina) {
      setEditNomina({ ...editNomina, fecha: isoDate });
    } else {
      setNewNomina({ ...newNomina, fecha: isoDate });
    }
  };

  // Función: Abre el modal de edición con los datos de la nómina seleccionada
  const openEditModal = (id: string) => {
    const nominaToEdit = allNominas.find((nom) => nom.id === id);
    if (nominaToEdit) {
      setEditNomina(nominaToEdit);
      setShowEditModal(true);
    }
  };

  // Función: Cambia la página actual y actualiza las nóminas mostradas
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      updateDisplayedItems(allNominas, page);
    }
  };

  return (
    <>
      <h3>Nómina</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <button
            className="btn btn-success mb-3"
            onClick={() => setShowAddModal(true)}
          >
            <i className="bi bi-plus me-1"></i> Agregar Nómina
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
                <th>Fecha</th>
                <th>Sueldo</th>
                <th>Monto Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayedNominas.length > 0 ? (
                displayedNominas.map((nomina) => (
                  <tr key={nomina.id}>
                    <td>{nomina.id}</td>
                    <td>{new Date(nomina.fecha).toLocaleDateString()}</td>
                    <td>{nomina.sueldo}</td>
                    <td>
                      {nomina.sueldo +
                        nomina.primas +
                        nomina.complementos +
                        nomina.asistenciaSE +
                        nomina.aguinaldos +
                        nomina.bonoVacacional +
                        nomina.otrasSubvenciones +
                        nomina.prestacionesSociales -
                        nomina.retencionesIVSS -
                        nomina.retencionSPF -
                        nomina.retencionFAOV -
                        nomina.comisionesBancarias}
                    </td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => openEditModal(nomina.id)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteNomina(nomina.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center">
                    No hay nóminas disponibles
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

      {/* Modal para agregar nómina */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar Nómina</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Fecha</Form.Label>
              <Form.Control
                type="datetime-local"
                name="fecha"
                value={
                  newNomina.fecha ? formatToLocalDateTime(newNomina.fecha) : ""
                }
                onChange={(e) => handleDateChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Sueldo</Form.Label>
              <Form.Control
                type="number"
                name="sueldo"
                value={newNomina.sueldo || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Primas</Form.Label>
              <Form.Control
                type="number"
                name="primas"
                value={newNomina.primas || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Complementos</Form.Label>
              <Form.Control
                type="number"
                name="complementos"
                value={newNomina.complementos || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Asistencia SE</Form.Label>
              <Form.Control
                type="number"
                name="asistenciaSE"
                value={newNomina.asistenciaSE || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Aguinaldos</Form.Label>
              <Form.Control
                type="number"
                name="aguinaldos"
                value={newNomina.aguinaldos || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Bono Vacacional</Form.Label>
              <Form.Control
                type="number"
                name="bonoVacacional"
                value={newNomina.bonoVacacional || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Otras Subvenciones</Form.Label>
              <Form.Control
                type="number"
                name="otrasSubvenciones"
                value={newNomina.otrasSubvenciones || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Prestaciones Sociales</Form.Label>
              <Form.Control
                type="number"
                name="prestacionesSociales"
                value={newNomina.prestacionesSociales || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Retenciones IVSS</Form.Label>
              <Form.Control
                type="number"
                name="retencionesIVSS"
                value={newNomina.retencionesIVSS || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Retención SPF</Form.Label>
              <Form.Control
                type="number"
                name="retencionSPF"
                value={newNomina.retencionSPF || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Retención FAOV</Form.Label>
              <Form.Control
                type="number"
                name="retencionFAOV"
                value={newNomina.retencionFAOV || ""}
                onChange={(e) => handleInputChange(e)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Comisiones Bancarias</Form.Label>
              <Form.Control
                type="number"
                name="comisionesBancarias"
                value={newNomina.comisionesBancarias || ""}
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
          <Button variant="primary" onClick={handleAddNomina}>
            Guardar Nómina
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para editar nómina */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Nómina</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editNomina && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Fecha</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="fecha"
                  value={
                    editNomina.fecha
                      ? formatToLocalDateTime(editNomina.fecha)
                      : ""
                  }
                  onChange={(e) => handleDateChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Sueldo</Form.Label>
                <Form.Control
                  type="number"
                  name="sueldo"
                  value={editNomina.sueldo || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Primas</Form.Label>
                <Form.Control
                  type="number"
                  name="primas"
                  value={editNomina.primas || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Complementos</Form.Label>
                <Form.Control
                  type="number"
                  name="complementos"
                  value={editNomina.complementos || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Asistencia SE</Form.Label>
                <Form.Control
                  type="number"
                  name="asistenciaSE"
                  value={editNomina.asistenciaSE || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Aguinaldos</Form.Label>
                <Form.Control
                  type="number"
                  name="aguinaldos"
                  value={editNomina.aguinaldos || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Bono Vacacional</Form.Label>
                <Form.Control
                  type="number"
                  name="bonoVacacional"
                  value={editNomina.bonoVacacional || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Otras Subvenciones</Form.Label>
                <Form.Control
                  type="number"
                  name="otrasSubvenciones"
                  value={editNomina.otrasSubvenciones || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Prestaciones Sociales</Form.Label>
                <Form.Control
                  type="number"
                  name="prestacionesSociales"
                  value={editNomina.prestacionesSociales || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Retenciones IVSS</Form.Label>
                <Form.Control
                  type="number"
                  name="retencionesIVSS"
                  value={editNomina.retencionesIVSS || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Retención SPF</Form.Label>
                <Form.Control
                  type="number"
                  name="retencionSPF"
                  value={editNomina.retencionSPF || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Retención FAOV</Form.Label>
                <Form.Control
                  type="number"
                  name="retencionFAOV"
                  value={editNomina.retencionFAOV || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Comisiones Bancarias</Form.Label>
                <Form.Control
                  type="number"
                  name="comisionesBancarias"
                  value={editNomina.comisionesBancarias || ""}
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
          <Button variant="primary" onClick={handleEditNomina}>
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default NominaModule;
