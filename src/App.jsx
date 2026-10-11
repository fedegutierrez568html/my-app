import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Login from "./components/Login";
import Ingresos from "./components/Ingresos";
import AgendaLista from "./components/AgendaLista";
import NuevoFlete from "./components/NuevoFlete";
import Resumen from "./components/Resumen";
import BarraNavegacion from "./components/BarraNavegacion";
import Inicio from "./components/Inicio";
import Historial from "./components/Historial";
import "./App.css";

function App() {
  const [session, setSession] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [pantalla, setPantalla] = useState("inicio");

  useEffect(() => {
    // Al abrir la app, ver si ya hay una sesión guardada
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCargando(false);
    });

    // Escuchar cambios: login, logout, sesión expirada
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_evento, nuevaSesion) => {
        setSession(nuevaSesion);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (cargando) return <p>Cargando...</p>;
  if (!session) return <Login />;

  return (
    <div className="app">
      <main className="contenido">
        {pantalla === "inicio" && (
          <Inicio
            irA={setPantalla}
            cerrarSesion={() => supabase.auth.signOut()}
          />
        )}
        {pantalla === "ingresos" && <Ingresos />}
        {pantalla === "historial" && (
          <Historial volver={() => setPantalla("inicio")} />
        )}
        {pantalla === "agenda" && <AgendaLista irA={setPantalla} />}
        {pantalla === "nuevoFlete" && (
          <NuevoFlete
            volver={() => setPantalla("inicio")}
            alGuardar={() => setPantalla("agenda")}
          />
        )}
        {pantalla === "resumen" && <Resumen />}
      </main>

      <BarraNavegacion pantalla={pantalla} cambiarPantalla={setPantalla} />
    </div>
  );
}

export default App;
