import { useEffect, useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const TITULO = "¡Bienvenido!";
  const [letras, setLetras] = useState(0);

  // Cada vez que cambia "letras", esperar un momento y mostrar una más
  useEffect(() => {
    if (letras >= TITULO.length) return;

    const temporizador = setTimeout(() => setLetras(letras + 1), 120);

    return () => clearTimeout(temporizador);
  }, [letras]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setCargando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setCargando(false);

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos."
          : error.message,
      );
    }
  }

  return (
    <div className="login">
      <h1 className="login-titulo" aria-label={TITULO}>
        <span className="titulo-escrito">{TITULO.slice(0, letras)}</span>
        <span className="titulo-pendiente">{TITULO.slice(letras)}</span>
      </h1>

      <form className="formulario login-tarjeta" onSubmit={handleSubmit}>
        <div className="campo">
          <Mail size={20} aria-hidden="true" />
          <input
            type="email"
            placeholder="Email"
            aria-label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="campo">
          <Lock size={20} aria-hidden="true" />
          <input
            type={mostrarPassword ? "text" : "password"}
            placeholder="Contraseña"
            aria-label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="boton-icono"
            onClick={() => setMostrarPassword(!mostrarPassword)}
            aria-label={
              mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button type="submit" className="boton-principal" disabled={cargando}>
          {cargando ? "Ingresando..." : "Iniciar sesión"}
        </button>

        {error && <p className="mensaje-error">{error}</p>}
      </form>
    </div>
  );
}
