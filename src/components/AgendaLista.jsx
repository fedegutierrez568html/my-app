import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Trash2 } from "lucide-react";

const FILTROS = [
  { id: "pendiente", texto: "Pendientes" },
  { id: "hecho", texto: "Hechos" },
  { id: "cancelado", texto: "Cancelados" },
];

function AgendaLista() {
  const [turnos, setTurnos] = useState([]);
  const [filtro, setFiltro] = useState("pendiente");
  const [error, setError] = useState("");

  // Al abrir la pantalla, traer todos los fletes agendados, del más próximo al más lejano
  useEffect(() => {
    async function cargarTurnos() {
      const { data, error } = await supabase
        .from("agenda")
        .select("*")
        .order("fecha_hora", { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        setTurnos(data);
      }
    }

    cargarTurnos();
  }, []);

  // Cambiar el estado de un flete (pendiente, hecho, cancelado)
  async function cambiarEstado(id, nuevoEstado) {
    setError("");

    const { data, error } = await supabase
      .from("agenda")
      .update({ estado: nuevoEstado })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    setTurnos(turnos.map((turno) => (turno.id === id ? data : turno)));
  }

  // Borrar un flete de la agenda
  async function borrarTurno(id) {
    const seguro = window.confirm("¿Seguro que querés borrar este flete?");
    if (!seguro) return;

    setError("");

    const { error } = await supabase.from("agenda").delete().eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setTurnos(turnos.filter((turno) => turno.id !== id));
  }

  // Quedarse solo con los del filtro elegido.
  // Hechos y cancelados se muestran del más reciente al más viejo.
  const visibles = turnos.filter((turno) => turno.estado === filtro);
  if (filtro !== "pendiente") visibles.reverse();

  return (
    <div>
      <h2>Agenda</h2>

      <div className="filtros">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            className={filtro === f.id ? "filtro filtro-activo" : "filtro"}
            onClick={() => setFiltro(f.id)}
          >
            {f.texto}
          </button>
        ))}
      </div>

      {error && <p>Error: {error}</p>}

      {visibles.length === 0 ? (
        <p className="vacio">No hay fletes en esta categoría.</p>
      ) : (
        <ul className="lista-tarjetas">
          {visibles.map((turno) => (
            <li key={turno.id} className="tarjeta">
              <div className="tarjeta-cabecera">
                <span className="tarjeta-titulo">
                  {turno.cliente || "Sin cliente"}
                </span>
                <span className="tarjeta-detalle">
                  {new Date(turno.fecha_hora).toLocaleString("es-UY", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </span>
              </div>
              {turno.direccion && (
                <div className="tarjeta-detalle">{turno.direccion}</div>
              )}
              {turno.detalle && (
                <div className="tarjeta-detalle">{turno.detalle}</div>
              )}
              <div className="tarjeta-acciones">
                <select
                  className="selector-estado"
                  value={turno.estado}
                  onChange={(e) => cambiarEstado(turno.id, e.target.value)}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="hecho">Hecho</option>
                  <option value="cancelado">Cancelado</option>
                </select>
                <button
                  className="boton-icono boton-peligro"
                  onClick={() => borrarTurno(turno.id)}
                  aria-label="Borrar"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AgendaLista;
