import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Campo from '../components/Campo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const CAMPOS = [
  { nombre: 'email', etiqueta: 'Email', tipo: 'email', requerido: true, autoComplete: 'username' },
  { nombre: 'password', etiqueta: 'Contraseña', tipo: 'password', requerido: true, autoComplete: 'current-password' },
];

export default function Login() {
  const { usuario, sesionVencida, iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const { state } = useLocation();
  const [valores, setValores] = useState({ email: '', password: '' });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const formulario = useRef(null);

  useEffect(() => {
    if (intentosFallidos > 0) formulario.current?.querySelector('[aria-invalid="true"], .alerta')?.focus();
  }, [intentosFallidos]);

  if (usuario) return <Navigate to={state?.desde ?? '/'} replace />;

  const enviar = async (evento) => {
    evento.preventDefault();
    const faltantes = {};
    CAMPOS.forEach((c) => {
      if (!valores[c.nombre].trim()) faltantes[c.nombre] = 'Este campo es obligatorio';
    });
    setErrores(faltantes);
    setError(null);
    if (Object.keys(faltantes).length > 0) {
      setIntentosFallidos((n) => n + 1);
      return;
    }

    setEnviando(true);
    try {
      await iniciarSesion(valores.email.trim(), valores.password);
      navegar(state?.desde ?? '/', { replace: true });
    } catch (e) {
      setError(e.message);
      setEnviando(false);
      setIntentosFallidos((n) => n + 1);
    }
  };

  return (
    <main className="pagina-login">
      <form ref={formulario} className="caja-login" onSubmit={enviar} noValidate>
        <p className="marca marca-oscura">PowerFit</p>
        <h1>Iniciar sesión</h1>
        {sesionVencida && <div className="alerta" role="alert">Tu sesión venció. Vuelve a ingresar.</div>}
        {CAMPOS.map((c) => (
          <Campo
            key={c.nombre}
            campo={c}
            valor={valores[c.nombre]}
            error={errores[c.nombre]}
            onCambio={(valor) => setValores((v) => ({ ...v, [c.nombre]: valor }))}
          />
        ))}
        {error && <div className="alerta" role="alert" tabIndex={-1}>{error}</div>}
        <button type="submit" className="boton boton-principal boton-ancho" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
}
