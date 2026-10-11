import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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

// Un color por mes (siempre el mismo mes, el mismo color)
const COLORES = [
  "#34d27b",
  "#2bc4c0",
  "#4b8cff",
  "#9a7bff",
  "#ff7ab6",
  "#ffb54a",
  "#8de069",
  "#5ad1f0",
  "#7c8cff",
  "#d08bff",
  "#ffd166",
  "#6ee7b7",
];

// Medidas del gráfico circular
const RADIO = 76;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

function formatoPlata(numero) {
  return "$" + Math.round(numero).toLocaleString("es-UY");
}

function Resumen() {
  const [ingresos, setIngresos] = useState([]);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [error, setError] = useState("");

  // Al abrir la pantalla, traer solo fecha y monto de todos los ingresos
  useEffect(() => {
    async function cargarIngresos() {
      const { data, error } = await supabase
        .from("ingresos")
        .select("fecha, monto");

      if (error) {
        setError(error.message);
      } else {
        setIngresos(data);
      }
    }

    cargarIngresos();
  }, []);

  const aniosDisponibles = [
    ...new Set([
      new Date().getFullYear(),
      ...ingresos.map((ingreso) => Number(ingreso.fecha.slice(0, 4))),
    ]),
  ].sort((a, b) => b - a);

  // Quedarse solo con los ingresos del año elegido
  // (fecha viene como texto "2026-10-09", los 4 primeros caracteres son el año)
  const delAnio = ingresos.filter(
    (ingreso) => Number(ingreso.fecha.slice(0, 4)) === anio,
  );

  // Total de cada uno de los 12 meses (posición 0 = enero, 11 = diciembre)
  const totalesPorMes = MESES.map((_nombre, indice) =>
    delAnio
      // los caracteres 5 y 6 son el mes ("10" = octubre)
      .filter((ingreso) => Number(ingreso.fecha.slice(5, 7)) === indice + 1)
      .reduce((suma, ingreso) => suma + Number(ingreso.monto), 0),
  );

  const totalAnio = totalesPorMes.reduce((suma, total) => suma + total, 0);
  const mesesConIngresos = totalesPorMes.filter((total) => total > 0).length;
  const promedio = mesesConIngresos > 0 ? totalAnio / mesesConIngresos : 0;

  // Mes con más ingresos
  let mejorMes = 0;
  totalesPorMes.forEach((total, indice) => {
    if (total > totalesPorMes[mejorMes]) mejorMes = indice;
  });

  // Total del mes actual (solo tiene sentido si estamos mirando este año)
  const esEsteAnio = anio === new Date().getFullYear();
  const totalMesActual = totalesPorMes[new Date().getMonth()];

  // Cada mes con ingresos es un tramo del círculo
  let recorrido = 0;
  const tramos = [];
  totalesPorMes.forEach((total, indice) => {
    if (total === 0) return;
    const largo = (total / totalAnio) * CIRCUNFERENCIA;
    const visible = Math.max(largo - 3, 0.5); // 3 de separación entre tramos
    tramos.push({ indice, visible, inicio: recorrido });
    recorrido += largo;
  });

  // Lista de meses: del más reciente al más viejo
  const filas = totalesPorMes
    .map((total, indice) => ({ total, indice }))
    .filter((fila) => fila.total > 0)
    .reverse();

  return (
    <div>
      <header className="resumen-cabecera">
        <h2>Resumen</h2>
        <select
          className="selector-anio"
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
        >
          {aniosDisponibles.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </header>

      {error && <p>Error: {error}</p>}

      {totalAnio === 0 ? (
        <p className="vacio">No hay ingresos cargados en {anio}.</p>
      ) : (
        <>
          <div className="tarjeta-grafico">
            <div className="donut-caja">
              <svg
                className="donut"
                viewBox="0 0 200 200"
                role="img"
                aria-label={`Ingresos por mes de ${anio}`}
              >
                <circle
                  cx="100"
                  cy="100"
                  r={RADIO}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeWidth="20"
                />
                {tramos.map((tramo) => (
                  <circle
                    key={tramo.indice}
                    cx="100"
                    cy="100"
                    r={RADIO}
                    fill="none"
                    stroke={COLORES[tramo.indice]}
                    strokeWidth="20"
                    strokeDasharray={`${tramo.visible.toFixed(2)} ${(CIRCUNFERENCIA - tramo.visible).toFixed(2)}`}
                    strokeDashoffset={(-tramo.inicio).toFixed(2)}
                    transform="rotate(-90 100 100)"
                  />
                ))}
              </svg>
              <div className="donut-centro">
                <small>{anio}</small>
                <b>{formatoPlata(totalAnio)}</b>
              </div>
            </div>
          </div>

          <div className="cifras">
            {esEsteAnio && (
              <div className="tarjeta-cifra">
                <div className="tarjeta-cifra-titulo">Este mes</div>
                <div className="tarjeta-cifra-monto">
                  {formatoPlata(totalMesActual)}
                </div>
              </div>
            )}
            <div className="tarjeta-cifra">
              <div className="tarjeta-cifra-titulo">Promedio por mes</div>
              <div className="tarjeta-cifra-monto">
                {formatoPlata(promedio)}
              </div>
            </div>
            <div className="tarjeta-cifra">
              <div className="tarjeta-cifra-titulo">Ingresos registrados</div>
              <div className="tarjeta-cifra-monto">{delAnio.length}</div>
            </div>
            <div className="tarjeta-cifra">
              <div className="tarjeta-cifra-titulo">Mejor mes</div>
              <div className="tarjeta-cifra-monto">
                {formatoPlata(totalesPorMes[mejorMes])}{" "}
                <small>{MESES[mejorMes]}</small>
              </div>
            </div>
          </div>

          <div className="seccion-fila">
            <h3 className="seccion-titulo">Por mes</h3>
          </div>

          <ul className="lista-meses tarjeta">
            {filas.map((fila) => {
              const porcentaje = Math.round((fila.total / totalAnio) * 100);
              return (
                <li key={fila.indice} className="fila-mes">
                  <span
                    className="punto-mes"
                    style={{ background: COLORES[fila.indice] }}
                  ></span>
                  <div>
                    <span className="fila-mes-nombre">
                      {MESES[fila.indice]}
                    </span>
                    <div className="fila-mes-barra">
                      <span
                        className="fila-mes-relleno"
                        style={{
                          width: `${porcentaje}%`,
                          background: COLORES[fila.indice],
                        }}
                      ></span>
                    </div>
                  </div>
                  <div className="fila-mes-derecha">
                    <span className="fila-mes-monto">
                      {formatoPlata(fila.total)}
                    </span>
                    <span className="fila-mes-porcentaje">{porcentaje}%</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export default Resumen;
