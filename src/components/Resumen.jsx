import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const NOMBRES_MESES = [
  "Ene",
  "Feb",
  "Mar",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const COLORES = [
  "#4cff91",
  "#c4a7e7",
  "#f6c177",
  "#eb6f92",
  "#ebbcba",
  "#31748f",
  "#a6a5d6",
  "#8ab4f8",
  "#e0af68",
  "#bb9af7",
  "#7dcfff",
  "#f7768e",
];

function Resumen() {
  const [Ingresos, setIngresos] = useState([]);
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
      ...Ingresos.map((ingreso) => Number(ingreso.fecha.slice(0, 4))),
    ]),
  ].sort((a, b) => b - a);

  // Quedarse solo con los ingresos del año elegido
  // (fecha viene como texto "2026-10-09", los 4 primeros caracteres son el año)
  const delAnio = Ingresos.filter(
    (ingreso) => Number(ingreso.fecha.slice(0, 4)) === anio,
  );

  // Armar una lista de 12 meses, cada uno con su total
  const datosPorMes = NOMBRES_MESES.map((nombre, indice) => {
    const total = delAnio
      // los caracteres 5 y 6 son el mes ("10" = octubre)
      .filter((ingreso) => Number(ingreso.fecha.slice(5, 7)) === indice + 1)
      .reduce((suma, ingreso) => suma + Number(ingreso.monto), 0);

    return { mes: nombre, total: total };
  });

  const totalAnio = datosPorMes.reduce((suma, mes) => suma + mes.total, 0);
  const mesesConIngresos = datosPorMes.filter((mes) => mes.total > 0);

  // Total del mes actual (solo tiene sentido si estamos mirando este año)
  const esEsteAnio = anio === new Date().getFullYear();
  const totalMesActual = datosPorMes[new Date().getMonth()].total;

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

      <div className="cifras">
        <div className="tarjeta-cifra">
          <div className="tarjeta-cifra-titulo">Total {anio}</div>
          <div className="tarjeta-cifra-monto">
            ${totalAnio.toLocaleString("es-UY")}
          </div>
        </div>
        {esEsteAnio && (
          <div className="tarjeta-cifra">
            <div className="tarjeta-cifra-titulo">Este mes</div>
            <div className="tarjeta-cifra-monto">
              ${totalMesActual.toLocaleString("es-UY")}
            </div>
          </div>
        )}
      </div>

      {mesesConIngresos.length === 0 ? (
        <p className="vacio">No hay ingresos cargados en {anio}.</p>
      ) : (
        <>
          <div className="tarjeta-grafico">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={mesesConIngresos}
                  dataKey="total"
                  nameKey="mes"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  stroke="none"
                >
                  {mesesConIngresos.map((mes, indice) => (
                    <Cell
                      key={mes.mes}
                      fill={COLORES[indice % COLORES.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#1c1c1c",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    borderRadius: "0.75rem",
                  }}
                  itemStyle={{ color: "#f5f5f5" }}
                  formatter={(valor) => `$${valor.toLocaleString("es-UY")}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="lista-meses">
            {mesesConIngresos.map((mes, indice) => (
              <li key={mes.mes} className="fila-mes">
                <span
                  className="punto-mes"
                  style={{ background: COLORES[indice % COLORES.length] }}
                ></span>
                <span className="fila-mes-nombre">{mes.mes}</span>
                <span className="fila-mes-porcentaje">
                  {Math.round((mes.total / totalAnio) * 100)}%
                </span>
                <span className="fila-mes-monto">
                  ${mes.total.toLocaleString("es-UY")}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default Resumen;
