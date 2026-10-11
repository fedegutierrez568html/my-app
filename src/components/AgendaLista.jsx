import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";

const FILTROS = [
  { id: "pendiente", texto: "Pendientes" },
  { id: "hecho", texto: "Hechos" },
];

const TEXTO_ESTADO = {
  pendiente: "Pendiente",
  hecho: "Hecho",
};

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
const DIAS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

function dos(numero) {
  return String(numero).padStart(2, "0");
}

// Convierte una fecha en una clave como "2026-10-12", usando la hora local
function claveDia(fecha) {
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

// Convierte la fecha guardada en el formato que usa el campo datetime-local ("2026-10-12T09:30")
function aValorLocal(fechaHora) {
  const fecha = new Date(fechaHora);
  return `${claveDia(fecha)}T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}

// "09:30"
function horaDe(fechaHora) {
  return new Date(fechaHora).toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// De "2026-10-12" a "Hoy, lunes 12 de octubre" (o "lunes 12 de octubre")
function tituloDia(clave) {
  const [anio, mes, dia] = clave.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  const prefijo = clave === claveDia(new Date()) ? "Hoy, " : "";
  return `${prefijo}${DIAS[fecha.getDay()]} ${dia} de ${MESES[mes - 1]}`;
}

// Junta los fletes que caen el mismo día (la lista ya viene ordenada)
function agruparPorDia(lista) {
  const grupos = [];
  lista.forEach((turno) => {
    const clave = claveDia(new Date(turno.fecha_hora));
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.clave === clave) {
      ultimo.items.push(turno);
    } else {
      grupos.push({ clave, items: [turno] });
    }
  });
  return grupos;
}

// Una fila de flete (sirve para la lista y para el día elegido del calendario)
function ItemFlete({ turno, alAbrir }) {
  return (
    <li
      className="trabajo trabajo-tocable"
      role="button"
      tabIndex={0}
      onClick={() => alAbrir(turno.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          alAbrir(turno.id);
        }
      }}
    >
      <div className="trabajo-fecha trabajo-fecha-hora">
        <b>{horaDe(turno.fecha_hora)}</b>
      </div>
      <div>
        <div className="trabajo-cliente">{turno.cliente || "Sin cliente"}</div>
        {turno.direccion && (
          <div className="trabajo-detalle">{turno.direccion}</div>
        )}
        {turno.detalle && (
          <div className="trabajo-detalle">{turno.detalle}</div>
        )}
      </div>
      <span className={`chip-estado chip-${turno.estado}`}>
        {TEXTO_ESTADO[turno.estado]}
      </span>
    </li>
  );
}

function AgendaLista({ irA }) {
  const hoy = new Date();
  const hoyClave = claveDia(hoy);

  const [turnos, setTurnos] = useState([]);
  const [filtro, setFiltro] = useState("pendiente");
  const [vista, setVista] = useState("lista");
  const [mesVisto, setMesVisto] = useState(
    new Date(hoy.getFullYear(), hoy.getMonth(), 1),
  );
  const [diaElegido, setDiaElegido] = useState(hoyClave);
  const [abiertoId, setAbiertoId] = useState(null);
  const [editando, setEditando] = useState(false);
  const [formulario, setFormulario] = useState({
    fechaHora: "",
    cliente: "",
    direccion: "",
    detalle: "",
  });
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
        // Los cancelados ya no existen: si quedó alguno viejo en la base, lo ignoramos
        setTurnos(data.filter((turno) => turno.estado !== "cancelado"));
      }
    }

    cargarTurnos();
  }, []);

  // Cerrar la hoja de detalle con la tecla Escape
  useEffect(() => {
    if (abiertoId === null) return;
    function alTeclear(e) {
      if (e.key === "Escape") cerrarHoja();
    }
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abiertoId]);

  // Abrir y cerrar la hoja de detalle
  function abrirHoja(id) {
    setAbiertoId(id);
    setEditando(false);
  }

  function cerrarHoja() {
    setAbiertoId(null);
    setEditando(false);
    setError("");
  }

  // Cambiar el estado de un flete (pendiente o hecho)
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
    cerrarHoja();
  }

  // Borrar un flete de la agenda (también sirve para "cancelar": un flete cancelado se borra)
  async function borrarTurno(id, pregunta) {
    const seguro = window.confirm(pregunta);
    if (!seguro) return;

    setError("");

    const { error } = await supabase.from("agenda").delete().eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setTurnos(turnos.filter((turno) => turno.id !== id));
    cerrarHoja();
  }

  // Pasar la hoja al modo "editar" con los datos actuales del flete
  function empezarEdicion(turno) {
    setError("");
    setFormulario({
      fechaHora: aValorLocal(turno.fecha_hora),
      cliente: turno.cliente || "",
      direccion: turno.direccion || "",
      detalle: turno.detalle || "",
    });
    setEditando(true);
  }

  // Guardar los cambios de la edición
  async function guardarEdicion(e) {
    e.preventDefault();
    setError("");

    const { data, error } = await supabase
      .from("agenda")
      .update({
        fecha_hora: new Date(formulario.fechaHora).toISOString(),
        cliente: formulario.cliente,
        direccion: formulario.direccion,
        detalle: formulario.detalle,
      })
      .eq("id", abiertoId)
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    setTurnos(turnos.map((turno) => (turno.id === abiertoId ? data : turno)));
    setEditando(false);
  }

  // Cambiar de mes en el calendario
  function moverMes(cambio) {
    const nuevo = new Date(
      mesVisto.getFullYear(),
      mesVisto.getMonth() + cambio,
      1,
    );
    setMesVisto(nuevo);
    // Si volvemos al mes de hoy, elegir hoy; si no, el día 1
    const esMesActual =
      nuevo.getFullYear() === hoy.getFullYear() &&
      nuevo.getMonth() === hoy.getMonth();
    setDiaElegido(esMesActual ? hoyClave : claveDia(nuevo));
  }

  // ----- Datos para la lista -----
  const cuentas = { pendiente: 0, hecho: 0 };
  turnos.forEach((turno) => {
    if (cuentas[turno.estado] !== undefined) cuentas[turno.estado]++;
  });

  // Quedarse solo con los del filtro elegido.
  // Los hechos se muestran del más reciente al más viejo.
  const visibles = turnos.filter((turno) => turno.estado === filtro);
  if (filtro !== "pendiente") visibles.reverse();
  const grupos = agruparPorDia(visibles);

  // ----- Datos para el calendario -----
  const anio = mesVisto.getFullYear();
  const mes = mesVisto.getMonth();
  const huecos = (new Date(anio, mes, 1).getDay() + 6) % 7; // la semana empieza en lunes
  const diasDelMes = new Date(anio, mes + 1, 0).getDate();

  const porDia = {};
  turnos.forEach((turno) => {
    const clave = claveDia(new Date(turno.fecha_hora));
    if (!porDia[clave]) porDia[clave] = [];
    porDia[clave].push(turno);
  });

  const prefijoMes = `${anio}-${dos(mes + 1)}-`;
  const pendientesDelMes = turnos.filter(
    (turno) =>
      turno.estado === "pendiente" &&
      claveDia(new Date(turno.fecha_hora)).startsWith(prefijoMes),
  ).length;
  const textoPendientes =
    pendientesDelMes === 0
      ? "Sin fletes pendientes"
      : pendientesDelMes === 1
        ? "1 flete pendiente"
        : `${pendientesDelMes} fletes pendientes`;

  const delDia = porDia[diaElegido] || [];
  const abierto = turnos.find((turno) => turno.id === abiertoId);

  const celdas = [];
  for (let i = 0; i < huecos; i++) celdas.push(null);
  for (let dia = 1; dia <= diasDelMes; dia++) celdas.push(dia);

  return (
    <div>
      <header className="agenda-cabecera">
        <h2>Agenda</h2>
        <button
          className="boton-mas"
          onClick={() => irA("nuevoFlete")}
          aria-label="Agendar flete"
        >
          <Plus size={22} />
        </button>
      </header>

      <div className="segmento">
        <button
          className={vista === "lista" ? "segmento-activo" : ""}
          onClick={() => setVista("lista")}
        >
          Lista
        </button>
        <button
          className={vista === "calendario" ? "segmento-activo" : ""}
          onClick={() => setVista("calendario")}
        >
          Calendario
        </button>
      </div>

      {error && <p>Error: {error}</p>}

      {vista === "lista" && (
        <>
          <div className="filtros">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                className={filtro === f.id ? "filtro filtro-activo" : "filtro"}
                onClick={() => setFiltro(f.id)}
              >
                {f.texto}
                <span className="filtro-cuenta">{cuentas[f.id]}</span>
              </button>
            ))}
          </div>

          {visibles.length === 0 ? (
            <p className="vacio">No hay fletes en esta categoría.</p>
          ) : (
            grupos.map((grupo) => (
              <section key={grupo.clave}>
                <h3 className="agenda-dia">
                  {capitalizar(tituloDia(grupo.clave))}
                </h3>
                <ul className="lista-trabajos">
                  {grupo.items.map((turno) => (
                    <ItemFlete
                      key={turno.id}
                      turno={turno}
                      alAbrir={abrirHoja}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}
        </>
      )}

      {vista === "calendario" && (
        <>
          <div className="tarjeta calendario">
            <div className="calendario-cabecera">
              <div>
                <b className="calendario-mes">
                  {MESES[mes]} {anio}
                </b>
                <small>{textoPendientes}</small>
              </div>
              <div className="calendario-flechas">
                <button
                  className="flecha"
                  onClick={() => moverMes(-1)}
                  aria-label="Mes anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className="flecha"
                  onClick={() => moverMes(1)}
                  aria-label="Mes siguiente"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="calendario-semana" aria-hidden="true">
              {["L", "M", "M", "J", "V", "S", "D"].map((letra, i) => (
                <span key={i}>{letra}</span>
              ))}
            </div>

            <div className="calendario-grilla">
              {celdas.map((dia, i) => {
                if (dia === null)
                  return <span key={`vacio-${i}`} className="dia-vacio" />;
                const clave = `${prefijoMes}${dos(dia)}`;
                let clases = "dia";
                if (clave === hoyClave) clases += " dia-hoy";
                if (clave === diaElegido) clases += " dia-elegido";
                return (
                  <button
                    key={clave}
                    className={clases}
                    onClick={() => setDiaElegido(clave)}
                    aria-label={`${dia} de ${MESES[mes]}`}
                  >
                    <span className="dia-numero">{dia}</span>
                    <span className="puntos">
                      {(porDia[clave] || []).slice(0, 3).map((turno) => (
                        <i
                          key={turno.id}
                          className={`punto-estado punto-${turno.estado}`}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="calendario-leyenda">
              <span>
                <i className="punto-estado punto-pendiente" />
                Pendiente
              </span>
              <span>
                <i className="punto-estado punto-hecho" />
                Hecho
              </span>
            </div>
          </div>

          <div className="seccion-fila">
            <h3 className="seccion-titulo">
              {capitalizar(tituloDia(diaElegido))}
            </h3>
          </div>

          {delDia.length === 0 ? (
            <>
              <p className="vacio">No hay fletes agendados este día.</p>
              <button
                className="boton-principal"
                onClick={() => irA("nuevoFlete")}
              >
                Agendar flete
              </button>
            </>
          ) : (
            <ul className="lista-trabajos">
              {delDia.map((turno) => (
                <ItemFlete key={turno.id} turno={turno} alAbrir={abrirHoja} />
              ))}
            </ul>
          )}
        </>
      )}

      {abierto && (
        <div className="hoja-fondo" onClick={cerrarHoja}>
          <div
            className="hoja"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hoja-agarre" />

            {editando ? (
              <form onSubmit={guardarEdicion}>
                <h3 className="hoja-titulo">Editar flete</h3>

                <div className="hoja-formulario">
                  <label className="hoja-campo">
                    <span>Fecha y hora</span>
                    <input
                      type="datetime-local"
                      value={formulario.fechaHora}
                      onChange={(e) =>
                        setFormulario({
                          ...formulario,
                          fechaHora: e.target.value,
                        })
                      }
                      required
                    />
                  </label>
                  <label className="hoja-campo">
                    <span>Cliente</span>
                    <input
                      type="text"
                      value={formulario.cliente}
                      onChange={(e) =>
                        setFormulario({
                          ...formulario,
                          cliente: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="hoja-campo">
                    <span>Dirección</span>
                    <input
                      type="text"
                      value={formulario.direccion}
                      onChange={(e) =>
                        setFormulario({
                          ...formulario,
                          direccion: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="hoja-campo">
                    <span>Detalle (qué se transporta)</span>
                    <input
                      type="text"
                      value={formulario.detalle}
                      onChange={(e) =>
                        setFormulario({
                          ...formulario,
                          detalle: e.target.value,
                        })
                      }
                    />
                  </label>
                </div>

                {error && <p className="mensaje-error">Error: {error}</p>}

                <div className="hoja-acciones">
                  <button type="submit" className="boton-principal">
                    Guardar cambios
                  </button>
                  <button
                    type="button"
                    className="hoja-cerrar"
                    onClick={() => setEditando(false)}
                  >
                    Volver
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h3 className="hoja-titulo">
                  {abierto.cliente || "Sin cliente"}
                </h3>
                <span className={`chip-estado chip-${abierto.estado}`}>
                  {TEXTO_ESTADO[abierto.estado]}
                </span>

                <dl className="detalle-lista">
                  <div>
                    <dt>Fecha</dt>
                    <dd>
                      {capitalizar(
                        tituloDia(claveDia(new Date(abierto.fecha_hora))),
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Hora</dt>
                    <dd>{horaDe(abierto.fecha_hora)} h</dd>
                  </div>
                  {abierto.direccion && (
                    <div>
                      <dt>Dirección</dt>
                      <dd>{abierto.direccion}</dd>
                    </div>
                  )}
                  {abierto.detalle && (
                    <div>
                      <dt>Detalle</dt>
                      <dd>{abierto.detalle}</dd>
                    </div>
                  )}
                </dl>

                {error && <p className="mensaje-error">Error: {error}</p>}

                <div className="hoja-acciones">
                  {abierto.estado === "pendiente" ? (
                    <button
                      className="boton-principal"
                      onClick={() => cambiarEstado(abierto.id, "hecho")}
                    >
                      Marcar como hecho
                    </button>
                  ) : (
                    <button
                      className="boton-principal"
                      onClick={() => cambiarEstado(abierto.id, "pendiente")}
                    >
                      Volver a pendiente
                    </button>
                  )}
                  <button
                    className="boton-secundario"
                    onClick={() => empezarEdicion(abierto)}
                  >
                    <Pencil size={18} />
                    Editar
                  </button>
                  {abierto.estado === "pendiente" ? (
                    <button
                      className="boton-secundario boton-peligro"
                      onClick={() =>
                        borrarTurno(
                          abierto.id,
                          "¿Cancelar este flete? Se va a borrar de la agenda.",
                        )
                      }
                    >
                      <Trash2 size={18} />
                      Cancelar flete
                    </button>
                  ) : (
                    <button
                      className="boton-secundario boton-peligro"
                      onClick={() =>
                        borrarTurno(
                          abierto.id,
                          "¿Seguro que querés borrar este flete?",
                        )
                      }
                    >
                      <Trash2 size={18} />
                      Borrar flete
                    </button>
                  )}
                  <button className="hoja-cerrar" onClick={cerrarHoja}>
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AgendaLista;
