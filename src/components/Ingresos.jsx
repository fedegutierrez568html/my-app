import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Pencil, Trash2 } from "lucide-react";

function Ingresos() {
  const [ingresos, setIngresos] = useState([]);

  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [cliente, setCliente] = useState("");
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [monto, setMonto] = useState("");
  const [formaPago, setFormaPago] = useState("Efectivo");

  const [error, setError] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    async function cargarIngresos() {
      const { data, error } = await supabase
        .from("ingresos")
        .select("*")
        .order("fecha", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setIngresos(data);
      }

      // Fecha actual en formato YYYY-MM-DD
    }

    cargarIngresos();
  }, []);

  // Al enviar el formulario, guardar el ingreso nuevo
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const datos = {
      fecha: fecha,
      cliente: cliente,
      origen: origen,
      destino: destino,
      monto: Number(monto),
      forma_pago: formaPago,
    };

    if (editandoId === null) {
      const { data, error } = await supabase
        .from("ingresos")
        .insert(datos)
        .select()
        .single();

      if (error) {
        setError(error.message);
        return;
      }

      setIngresos([data, ...ingresos]);
    } else {
      const { data, error } = await supabase
        .from("ingresos")
        .update(datos)
        .eq("id", editandoId)
        .select()
        .single();

      if (error) {
        setError(error.message);
        return;
      }

      setIngresos(
        ingresos.map((ingreso) => (ingreso.id === editandoId ? data : ingreso)),
      );
    }

    limpiarFormulario();
  }

  async function borrarIngreso(id) {
    // Pedir confirmación antes de borrar
    const seguro = window.confirm("¿Seguro que querés borrar este ingreso?");
    if (!seguro) return;

    setError("");

    // Borrar de la base de datos la fila cuyo id coincida
    const { error } = await supabase.from("ingresos").delete().eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    // Sacar el ingreso de la lista en pantalla
    setIngresos(ingresos.filter((ingreso) => ingreso.id !== id));
  }

  // Vaciar el formulario y volver al modo "ingreso nuevo"
  function limpiarFormulario() {
    setCliente("");
    setOrigen("");
    setDestino("");
    setMonto("");
    setEditandoId(null);
  }

  // Cargar los datos de un ingreso en el formulario para editarlo
  function empezarEdicion(ingreso) {
    setEditandoId(ingreso.id);
    setFecha(ingreso.fecha);
    setCliente(ingreso.cliente || "");
    setOrigen(ingreso.origen || "");
    setDestino(ingreso.destino || "");
    setMonto(String(ingreso.monto));
    setFormaPago(ingreso.forma_pago || "Efectivo");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const total = ingresos.reduce(
    (suma, ingreso) => suma + Number(ingreso.monto),
    0,
  );

  return (
    <div>
      <h2>Ingresos</h2>

      <form className="formulario" onSubmit={handleSubmit}>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Cliente"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
        />
        <input
          type="text"
          placeholder="Origen"
          value={origen}
          onChange={(e) => setOrigen(e.target.value)}
        />
        <input
          type="text"
          placeholder="Destino"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
        />
        <input
          type="number"
          placeholder="Monto"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          required
        />
        <select
          value={formaPago}
          onChange={(e) => setFormaPago(e.target.value)}
        >
          <option>Efectivo</option>
          <option>Transferencia</option>
          <option>Otro</option>
        </select>
        <button type="submit" className="boton-principal">
          {editandoId === null ? "Guardar ingreso" : "Guardar cambios"}
        </button>
        {editandoId !== null && (
          <button
            type="button"
            className="boton-secundario"
            onClick={limpiarFormulario}
          >
            Cancelar
          </button>
        )}
      </form>

      {error && <p>Error: {error}</p>}

      <div className="total-ingresos">
        <span>Total</span>
        <strong>${total.toLocaleString("es-UY")}</strong>
      </div>

      {ingresos.length === 0 ? (
        <p className="vacio">Todavía no cargaste ningún ingreso.</p>
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
              <div className="tarjeta-acciones">
                <button
                  className="boton-icono"
                  onClick={() => empezarEdicion(ingreso)}
                  aria-label="Editar"
                >
                  <Pencil size={20} />
                </button>
                <button
                  className="boton-icono boton-peligro"
                  onClick={() => borrarIngreso(ingreso.id)}
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

export default Ingresos;
