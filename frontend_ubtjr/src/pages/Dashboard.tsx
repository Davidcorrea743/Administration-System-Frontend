import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useNavigate } from "react-router-dom";
import { decodeToken } from "../services/authService";
import FacturasModule from "./FacturasModule";
import CondominioModule from "./CondominioModule";
import ImpuestosModule from "./ImpuestosModule";
import NominaModule from "./NominaModule";
import SeniatModule from "./SeniatModule";
//import ElecAseoModule from "./ElecAseoModule";
import ServicioTelefModule from "./ServicioTelefModule";
import ViaticosModule from "./ViaticosModule";
import ProveedoresModule from "./ProveedoresModule";
import ServiciosBasicosModule from "./ServiciosBasicosModule"; // Nueva importación
import { Form } from "react-bootstrap";

interface DashboardProps {
  setToken: (token: string | null) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setToken }) => {
  const [selectedModule, setSelectedModule] = useState<string>("proveedores"); // Cambiado a "proveedores" como valor por defecto
  const [userName, setUserName] = useState<string>("Usuario");
  const [filterType, setFilterType] = useState<"mes" | "año">("mes");
  const [filterValue, setFilterValue] = useState<string>("");
  const [searchRif, setSearchRif] = useState<string>("");
  const [searchNoOficina, setSearchNoOficina] = useState<string>(""); // Nuevo estado para Servicios Básicos
  const navigate = useNavigate();

  const modules = [
    "Condominio",
    "Facturas",
    "Impuestos",
    "Nomina",
    "Proveedores",
    "Seniat",
    "Servicios Básicos",
    "Viaticos",
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded?.email) {
        setUserName(decoded.email);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/login");
  };

  const renderModule = () => {
    switch (selectedModule) {
      case "facturas":
        return (
          <FacturasModule
            filterType={filterType}
            filterValue={filterValue}
            searchRif={searchRif}
          />
        );
      case "condominio":
        return (
          <CondominioModule
            filterType={filterType}
            filterValue={filterValue}
            searchRif={searchRif}
          />
        );
      case "impuestos":
        return (
          <ImpuestosModule
            filterType={filterType}
            filterValue={filterValue}
            searchRif={searchRif}
          />
        );
      case "nomina":
        return (
          <NominaModule
            filterType={filterType}
            filterValue={filterValue}
            searchRif={searchRif}
          />
        );
      case "seniat":
        return (
          <SeniatModule
            filterType={filterType}
            filterValue={filterValue}
            searchRif={searchRif}
          />
        );
      // case "elec & aseo":
      //   return (
      //     <ElecAseoModule
      //       filterType={filterType}
      //       filterValue={filterValue}
      //       searchRif={searchRif}
      //     />
      //   );
      case "servicios básicos": // Nuevo caso para Servicios Básicos
        return (
          <ServiciosBasicosModule
            filterType={filterType}
            filterValue={filterValue}
            searchNoOficina={searchNoOficina} // Usamos searchNoOficina en lugar de searchRif
          />
        );
      case "servicio telef":
        return (
          <ServicioTelefModule
            filterType={filterType}
            filterValue={filterValue}
            searchRif={searchRif}
          />
        );
      case "viaticos":
        return (
          <ViaticosModule
            filterType={filterType}
            filterValue={filterValue}
            searchRif={searchRif}
          />
        );
      case "proveedores":
        return (
          <ProveedoresModule
            filterType={filterType}
            filterValue={filterValue}
            searchRif={searchRif}
          />
        );
      default:
        return <p>Selecciona un módulo</p>;
    }
  };

  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{ backgroundColor: "#f5f5f5" }}
    >
      <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            <img src="./../../public/logo.jpg" alt="Logo" height="40" />
          </a>
          <div className="ms-auto d-flex align-items-center">
            <span className="me-3">Hola, {userName.split("@")[0]}</span>
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={handleLogout}
            >
              <i className="bi bi-power me-1"></i> Cerrar sesión
            </button>
          </div>
        </div>
      </nav>
      <div className="text-center py-3 bg-secondary text-white">
        <h2>Sistema de Administración</h2>
      </div>
      <div className="container-fluid flex-grow-1">
        <div className="row">
          <div className="col-md-3 col-lg-2 bg-light border-end p-3">
            <h5>Módulos</h5>
            <div className="list-group">
              {modules.map((module) => (
                <button
                  key={module}
                  className={`list-group-item list-group-item-action ${
                    selectedModule === module.toLowerCase() ? "active" : ""
                  }`}
                  onClick={() => setSelectedModule(module.toLowerCase())}
                >
                  {module}
                </button>
              ))}
            </div>
          </div>
          <div className="col-md-9 col-lg-10 p-4">
            <div className="mb-3 d-flex justify-content-between">
              <div className="d-flex align-items-center">
                <Form.Select
                  value={filterType}
                  onChange={(e) =>
                    setFilterType(e.target.value as "mes" | "año")
                  }
                  className="me-2"
                  style={{ width: "120px" }}
                >
                  <option value="mes">Mes</option>
                  <option value="año">Año</option>
                </Form.Select>
                <Form.Control
                  type={filterType === "mes" ? "month" : "number"}
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder={
                    filterType === "mes" ? "Selecciona mes" : "Ingresa año"
                  }
                  style={{ width: "150px" }}
                />
              </div>
              <div className="input-group" style={{ width: "300px" }}>
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <Form.Control
                  type="text"
                  placeholder={
                    selectedModule === "servicios básicos"
                      ? "Buscar por No. Oficina"
                      : "Buscar por RIF"
                  }
                  value={
                    selectedModule === "servicios básicos"
                      ? searchNoOficina
                      : searchRif
                  }
                  onChange={(e) =>
                    selectedModule === "servicios básicos"
                      ? setSearchNoOficina(e.target.value)
                      : setSearchRif(e.target.value.toUpperCase())
                  }
                />
              </div>
            </div>
            {renderModule()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
