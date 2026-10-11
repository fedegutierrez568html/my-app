import { House, Calendar, ChartPie } from "lucide-react";

const OPCIONES = [
  { id: "inicio", texto: "Inicio", Icono: House },
  { id: "agenda", texto: "Agenda", Icono: Calendar },
  { id: "resumen", texto: "Resumen", Icono: ChartPie },
];

function BarraNavegacion({ pantalla, cambiarPantalla }) {
  const SUBPANTALLAS_DE_INICIO = ["ingresos", "historial", "nuevoFlete"];
  // Ingresos es una subpantalla del inicio: ahí se marca "Inicio"
  const activa = SUBPANTALLAS_DE_INICIO.includes(pantalla)
    ? "inicio"
    : pantalla;

  // Posición de la pastilla de vidrio que se desliza bajo el ícono activo
  const indice = OPCIONES.findIndex((opcion) => opcion.id === activa);

  return (
    <nav className="barra-navegacion">
      <span
        className="pastilla"
        style={{ transform: `translateX(${indice * 100}%)` }}
      />
      {OPCIONES.map(({ id, texto, Icono }) => (
        <button
          key={id}
          className={activa === id ? "tab tab-activa" : "tab"}
          onClick={() => cambiarPantalla(id)}
          aria-label={texto}
          aria-current={activa === id ? "page" : undefined}
        >
          <Icono size={28} />
        </button>
      ))}
    </nav>
  );
}

export default BarraNavegacion;
