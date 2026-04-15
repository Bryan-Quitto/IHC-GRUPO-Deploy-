import React, { useState } from 'react';
import { useAuth } from '../controllers/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { FieldWarning } from '../components/FieldWarning';

const isEmailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const RegisterView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const touch = (f: string) => setTouched(prev => ({ ...prev, [f]: true }));

  const warnFullName        = touched.fullName       && (!fullName || fullName.trim() === '');
  const warnEmail           = touched.email          && (!email || email.trim() === '');
  const warnEmailFormat     = touched.email          && email.trim() !== '' && !isEmailValid(email);
  const warnPassword        = touched.password       && password.length < 6;
  const warnConfirmPassword = touched.confirmPassword && (confirmPassword !== password || confirmPassword === '');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    touch('fullName'); touch('email'); touch('password'); touch('confirmPassword');
    setError(null);
    setMessage(null);

    if (!fullName.trim()) return;
    if (!email.trim() || !isEmailValid(email)) return;
    if (password.length < 6) return;
    if (password !== confirmPassword) return;

    setLoading(true);
    const { data, error } = await signUp(email, password, fullName);
    
    if (error) {
      setError(error.message);
    } else {
      if (data?.session) {
        setMessage('Cuenta creada con éxito. Redirigiendo al sistema...');
        setTimeout(() => navigate('/'), 1500);
      } else {
        setMessage('El proceso de registro se ha iniciado con éxito. Por favor, verifique su correo electrónico para activar la cuenta.');
      }
    }
    setLoading(false);
  };

  return (
    <main className="flex justify-center items-center min-h-screen p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-sky-100">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl shadow-navy/5 w-full max-w-[450px] border border-navy/5 animate-in zoom-in-95 duration-300">
        <h1 className="mt-0 mb-2 text-center text-navy font-black text-2xl uppercase tracking-tight">Crear Cuenta</h1>
        <p className="text-center text-slate-500 text-sm mb-8 font-medium italic">Se solicita el ingreso de los datos requeridos para completar el registro.</p>
        <form onSubmit={handleRegister} className="space-y-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="full-name" className="text-sm font-bold text-slate-700">Nombre Completo *</label>
            <input id="full-name" type="text" maxLength={100}
              className={`w-full p-2.5 border rounded-lg text-base transition-all focus:outline-none focus:ring-2 focus:ring-navy/5 ${warnFullName ? 'border-amber-400 bg-amber-50' : 'border-slate-200 focus:border-navy'}`}
              value={fullName} onChange={e => setFullName(e.target.value)}
              onBlur={() => touch('fullName')}
              placeholder="Ingrese su nombre completo" required />
            <FieldWarning show={warnFullName} message="El nombre completo es obligatorio." />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email-register" className="text-sm font-bold text-slate-700">Correo Electrónico *</label>
            <input id="email-register" type="email"
              className={`w-full p-2.5 border rounded-lg text-base transition-all focus:outline-none focus:ring-2 focus:ring-navy/5 ${(warnEmail || warnEmailFormat) ? 'border-amber-400 bg-amber-50' : 'border-slate-200 focus:border-navy'}`}
              value={email} onChange={e => setEmail(e.target.value)}
              onBlur={() => touch('email')}
              placeholder="ejemplo@correo.com" required />
            <FieldWarning show={warnEmail} message="El correo electrónico es obligatorio." />
            <FieldWarning show={warnEmailFormat} message="Ingrese un correo válido (ej. usuario@dominio.com)." />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password-register" className="text-sm font-bold text-slate-700">Contraseña * <span className="text-slate-400 font-normal text-xs">(mín. 6 caracteres)</span></label>
            <input id="password-register" type="password"
              className={`w-full p-2.5 border rounded-lg text-base transition-all focus:outline-none focus:ring-2 focus:ring-navy/5 ${warnPassword ? 'border-amber-400 bg-amber-50' : 'border-slate-200 focus:border-navy'}`}
              value={password} onChange={e => setPassword(e.target.value)}
              onBlur={() => touch('password')}
              placeholder="Mínimo 6 caracteres" required />
            <FieldWarning show={warnPassword} message="La contraseña debe tener al menos 6 caracteres." />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm-password" className="text-sm font-bold text-slate-700">Confirmar Contraseña *</label>
            <input id="confirm-password" type="password"
              className={`w-full p-2.5 border rounded-lg text-base transition-all focus:outline-none focus:ring-2 focus:ring-navy/5 ${warnConfirmPassword ? 'border-amber-400 bg-amber-50' : 'border-slate-200 focus:border-navy'}`}
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              onBlur={() => touch('confirmPassword')}
              placeholder="Repita su contraseña" required />
            <FieldWarning show={warnConfirmPassword} message="Las contraseñas no coinciden. Verifique e intente de nuevo." />
          </div>
          {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100 font-medium" role="alert">{error}</div>}
          {message && <div className="text-green-700 bg-green-50 p-3 rounded-lg text-sm border border-green-100 font-medium leading-relaxed" role="alert">{message}</div>}
          <button type="submit" disabled={loading}
            className="w-full p-3.5 bg-navy text-white border-none rounded-xl text-base font-black cursor-pointer transition-all hover:bg-navy-light disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-navy/20 active:scale-[0.98] mt-4">
            {loading ? 'Procesando...' : 'Registrar Cuenta'}
          </button>
        </form>
        <p className="text-center mt-6 text-sm text-slate-500 font-medium">
          ¿Posee una cuenta registrada? <Link to="/login" className="text-navy font-bold no-underline hover:underline ml-1">Iniciar Sesión</Link>
        </p>
      </div>
    </main>
  );
};

export default RegisterView;
