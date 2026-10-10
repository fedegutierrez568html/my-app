import { useState } from "react";
import { supabase } from "../lib/supabase";
import { ChevronLeft } from "lucide-react";

function NuevoFlete({ volver, alGuardar }) {
  const [fechaHora, setFechaHora] = useState("");
  const [cliente, setCliente] = useState("");
  const [direccion, setDireccion] = useState("");
  const [detalle, setDetalle] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const { error } = await supabase.from("agenda").insert({
      // Convertir la hora local a un formato con zona horaria
      fecha_hora: new Date(fechaHora).toISOString(),
      cliente: cliente,
      direccion: direccion,
      detalle: detalle,
    });

    if (error) {
      setError(error.message);
      return;
    }

    // Avisarle a App que ya se guardó, para que cambie de pantalla
    alGuardar();
  }

  return (
    <div>
      <header className="historial-cabecera">
        <button className="boton-icono" onClick={volver} aria-label="Volver">
          <ChevronLeft size={24} />
        </button>
        <h2>Agendar flete</h2>
      </header>

      <form className="formulario" onSubmit={handleSubmit}>
        <input
          type="datetime-local"
          value={fechaHora}
          onChange={(e) => setFechaHora(e.target.value)}
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
          placeholder="Dirección"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
        />
        <input
          type="text"
          placeholder="Detalle (qué se transporta)"
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
        />
        <button type="submit" className="boton-principal">
          Agendar flete
        </button>
      </form>

      {error && <p>Error: {error}</p>}
    </div>
  );
}

export default NuevoFlete;
