import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { LogOut, ChevronRight, Banknote, Truck } from "lucide-react";

const NOMBRE = "Fede";

// Convierte una fecha con hora en un texto como "Hoy 09:30" o "Mañana 14:00"
function formatearFecha(fechaHora) {
  const fecha = new Date(fechaHora);
  const hoy = new Date();
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);

  const hora = fecha.toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (fecha.toDateString() === hoy.toDateString()) return `Hoy ${hora}`;
  if (fecha.toDateString() === manana.toDateString()) return `Mañana ${hora}`;

  const dia = fecha.toLocaleDateString("es-UY", {
    day: "2-digit",
    month: "2-digit",
  });
  return `${dia} ${hora}`;
}

function Inicio({ irA, cerrarSesion }) {
  const [ingresos, setIngresos] = useState([]);
  const [trabajos, setTrabajos] = useState([]);
  const [error, setError] = useState("");

  // Al abrir la pantalla, traer los ingresos y los próximos trabajos
  useEffect(() => {
    async function cargarDatos() {
      // Todos los ingresos (solo fecha y monto)
      const respuestaIngresos = await supabase
        .from("ingresos")
        .select("fecha, monto");

      if (respuestaIngresos.error) {
        setError(respuestaIngresos.error.message);
      } else {
        setIngresos(respuestaIngresos.data);
      }

      // Los 3 próximos fletes pendientes, desde el comienzo de hoy
      const inicioDeHoy = new Date();
      inicioDeHoy.setHours(0, 0, 0, 0);

      const respuestaTrabajos = await supabase
        .from("agenda")
        .select("*")
        .eq("estado", "pendiente")
        .gte("fecha_hora", inicioDeHoy.toISOString())
        .order("fecha_hora", { ascending: true })
        .limit(3);

      if (respuestaTrabajos.error) {
        setError(respuestaTrabajos.error.message);
      } else {
        setTrabajos(respuestaTrabajos.data);
      }
    }

    cargarDatos();
  }, []);

  // Mes actual en formato "2026-10", para comparar con el inicio de cada fecha
  const hoy = new Date();
  const prefijoMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

  const totalMes = ingresos
    .filter((ingreso) => ingreso.fecha.startsWith(prefijoMes))
    .reduce((suma, ingreso) => suma + Number(ingreso.monto), 0);

  // Nombre del mes con la primera letra en mayúscula
  const nombreMes = hoy.toLocaleDateString("es-UY", { month: "long" });
  const tituloMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

  return (
    <div className="inicio">
      <header className="inicio-cabecera">
        <span>Bienvenido, {NOMBRE}</span>
        <button
          className="boton-icono"
          onClick={cerrarSesion}
          aria-label="Cerrar sesión"
        >
          <LogOut size={24} />
        </button>
      </header>

      <button className="tarjeta-mes" onClick={() => irA("historial")}>
        <div>
          <div className="tarjeta-mes-titulo">{tituloMes}</div>
          <div className="tarjeta-mes-monto">
            ${totalMes.toLocaleString("es-UY")}
          </div>
        </div>
        <ChevronRight size={24} />
      </button>

      <h3 className="seccion-titulo">Próximos trabajos</h3>

      {error && <p>Error: {error}</p>}

      {trabajos.length === 0 ? (
        <p className="vacio">No tenés fletes agendados.</p>
      ) : (
        <ul className="lista-trabajos">
          {trabajos.map((trabajo) => (
            <li key={trabajo.id} className="trabajo">
              <div className="trabajo-hora">
                {formatearFecha(trabajo.fecha_hora)}
              </div>
              <div>
                <div className="trabajo-cliente">{trabajo.cliente}</div>
                <div className="trabajo-detalle">{trabajo.direccion}</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="acciones">
        <button className="boton-accion" onClick={() => irA("ingresos")}>
          <Banknote size={28} />
          <span>Nuevo ingreso</span>
        </button>
        <button className="boton-accion" onClick={() => irA("nuevoFlete")}>
          <Truck size={28} />
          <span>Agendar flete</span>
        </button>
      </div>
    </div>
  );
}

export default Inicio;
