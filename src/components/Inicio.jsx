import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { LogOut, ChevronRight, Banknote, Truck } from "lucide-react";

const NOMBRE = "Fede";

const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

// Convierte "2026-10-12T11:30:00Z" en partes listas para mostrar
function partesFecha(fechaHora) {
  const fecha = new Date(fechaHora);
  return {
    dia: DIAS_CORTOS[fecha.getDay()],
    numero: fecha.getDate(),
    hora: fecha.toLocaleTimeString("es-UY", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
}

// "$12.500"
function formatoPlata(numero) {
  return "$" + Math.round(numero).toLocaleString("es-UY");
}

// Suma los ingresos de un mes ("2026-10"). Si pasás hastaDia, suma solo hasta ese día.
function sumaIngresos(ingresos, prefijo, hastaDia) {
  return ingresos
    .filter((ingreso) => ingreso.fecha.startsWith(prefijo))
    .filter(
      (ingreso) => !hastaDia || Number(ingreso.fecha.slice(8, 10)) <= hastaDia,
    )
    .reduce((suma, ingreso) => suma + Number(ingreso.monto), 0);
}

// El monto sube contando desde cero (solo la primera vez que se abre la app)
let yaAnimo = false;
function useContador(objetivo) {
  const [animado, setAnimado] = useState(0);
  const reducido = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const saltear = yaAnimo || reducido || objetivo === 0;

  useEffect(() => {
    if (saltear) return;
    const inicio = performance.now();
    let cuadro;
    function paso(ahora) {
      const avance = Math.min((ahora - inicio) / 1100, 1);
      setAnimado(objetivo * (1 - Math.pow(1 - avance, 3)));
      if (avance < 1) {
        cuadro = requestAnimationFrame(paso);
      } else {
        yaAnimo = true;
      }
    }
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [objetivo, saltear]);

  return saltear ? objetivo : animado;
}

// Gráfico chico de cómo fue creciendo el mes, día por día
function GraficoMes({ ingresos, hoy, prefijoMes }) {
  const diaHoy = hoy.getDate();
  const porDia = Array(diaHoy + 1).fill(0);

  ingresos.forEach((ingreso) => {
    if (!ingreso.fecha.startsWith(prefijoMes)) return;
    const dia = Number(ingreso.fecha.slice(8, 10));
    if (dia <= diaHoy) porDia[dia] += Number(ingreso.monto);
  });

  let acumulado = 0;
  const puntos = [];
  for (let dia = 1; dia <= diaHoy; dia++) {
    acumulado += porDia[dia];
    puntos.push(acumulado);
  }

  const maximo = acumulado || 1;
  const separacion = 320 / Math.max(puntos.length - 1, 1);
  const linea = puntos
    .map((valor, i) => {
      const x = (i * separacion).toFixed(1);
      const y = (64 - (valor / maximo) * 52).toFixed(1);
      return `${i === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ");

  return (
    <svg
      className="tarjeta-mes-grafico"
      viewBox="0 0 320 70"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="degradado-mes" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#34d27b" stopOpacity="0.32" />
          <stop offset="1" stopColor="#34d27b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${linea} L320 70 L0 70Z`} fill="url(#degradado-mes)" />
      <path
        d={linea}
        fill="none"
        stroke="#34d27b"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
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

  const totalMes = sumaIngresos(ingresos, prefijoMes);
  const montoVisible = useContador(totalMes);

  // Mes anterior, hasta el mismo día, para comparar
  const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const prefijoAnterior = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, "0")}`;
  const totalAnterior = sumaIngresos(ingresos, prefijoAnterior, hoy.getDate());
  const variacion =
    totalAnterior > 0
      ? Math.round(((totalMes - totalAnterior) / totalAnterior) * 100)
      : null;
  const nombreAnterior = mesAnterior.toLocaleDateString("es-UY", {
    month: "long",
  });

  // Nombre del mes con la primera letra en mayúscula
  const nombreMes = hoy.toLocaleDateString("es-UY", { month: "long" });
  const tituloMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

  return (
    <div className="inicio">
      <header className="inicio-cabecera">
        <span>Bienvenido, {NOMBRE}</span>
        <button
          className="boton-salir"
          onClick={cerrarSesion}
          aria-label="Cerrar sesión"
        >
          <LogOut size={22} />
        </button>
      </header>

      <button className="tarjeta-mes" onClick={() => irA("historial")}>
        <div className="tarjeta-mes-fila">
          <span className="tarjeta-mes-titulo">{tituloMes}</span>
          <span className="tarjeta-mes-flecha">
            <ChevronRight size={18} />
          </span>
        </div>
        <div className="tarjeta-mes-monto">{formatoPlata(montoVisible)}</div>
        {variacion !== null && (
          <div
            className={
              variacion >= 0
                ? "tarjeta-mes-variacion variacion-sube"
                : "tarjeta-mes-variacion variacion-baja"
            }
          >
            {variacion >= 0 ? "+" : ""}
            {variacion}% frente a {nombreAnterior} en los mismos días
          </div>
        )}
        <GraficoMes ingresos={ingresos} hoy={hoy} prefijoMes={prefijoMes} />
      </button>

      <div className="seccion-fila">
        <h3 className="seccion-titulo">Próximos trabajos</h3>
        <button className="enlace-verde" onClick={() => irA("agenda")}>
          Ver agenda
        </button>
      </div>

      {error && <p>Error: {error}</p>}

      {trabajos.length === 0 ? (
        <p className="vacio">No tenés fletes agendados.</p>
      ) : (
        <ul className="lista-trabajos">
          {trabajos.map((trabajo) => {
            const fecha = partesFecha(trabajo.fecha_hora);
            return (
              <li key={trabajo.id} className="trabajo">
                <div className="trabajo-fecha">
                  <small>{fecha.dia}</small>
                  <b>{fecha.numero}</b>
                </div>
                <div>
                  <div className="trabajo-cliente">
                    {trabajo.cliente || "Sin cliente"}
                  </div>
                  {trabajo.direccion && (
                    <div className="trabajo-detalle">{trabajo.direccion}</div>
                  )}
                  {trabajo.detalle && (
                    <div className="trabajo-detalle">{trabajo.detalle}</div>
                  )}
                </div>
                <div className="trabajo-hora">{fecha.hora} h</div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="acciones">
        <button className="boton-accion" onClick={() => irA("ingresos")}>
          <span className="burbuja">
            <Banknote size={22} />
          </span>
          <span>Nuevo ingreso</span>
        </button>
        <button className="boton-accion" onClick={() => irA("nuevoFlete")}>
          <span className="burbuja">
            <Truck size={22} />
          </span>
          <span>Agendar flete</span>
        </button>
      </div>
    </div>
  );
}

export default Inicio;
