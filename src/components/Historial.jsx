import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { ChevronLeft } from "lucide-react";

function Historial({ volver }) {
  const [ingresos, setIngresos] = useState([]);
  const [error, setError] = useState("");

  // Al abrir la pantalla, traer todos los ingresos, del más nuevo al más viejo
  useEffect(() => {
    async function cargarIngresos() {
      const { data, error } = await supabase
        .from("ingresos")
        .select("*")
        .order("fecha", { ascending: false })
        .order("creado_en", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setIngresos(data);
      }
    }

    cargarIngresos();
  }, []);

  return (
    <div>
      <header className="historial-cabecera">
        <button className="boton-icono" onClick={volver} aria-label="Volver">
          <ChevronLeft size={24} />
        </button>
        <h2>Historial de ingresos</h2>
      </header>

      {error && <p>Error: {error}</p>}

      {ingresos.length === 0 ? (
        <p className="vacio">Todavía no hay ingresos registrados.</p>
      ) : (
        <ul className="lista-tarjetas">
          {ingresos.map((ingreso) => (
            <li key={ingreso.id} className="tarjeta">
              <div className="tarjeta-cabecera">
                <span className="tarjeta-titulo">
                  {ingreso.cliente || "Sin cliente"}
                </span>
                <span className="tarjeta-monto">
                  ${Number(ingreso.monto).toLocaleString("es-UY")}
                </span>
              </div>
              <div className="tarjeta-detalle">
                {ingreso.fecha.split("-").reverse().join("/")} ·{" "}
                {ingreso.forma_pago}
              </div>
              {(ingreso.origen || ingreso.destino) && (
                <div className="tarjeta-detalle">
                  {ingreso.origen} → {ingreso.destino}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Historial;
