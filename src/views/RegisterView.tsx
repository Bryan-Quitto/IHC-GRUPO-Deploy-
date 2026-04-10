import React, { useState } from 'react';
import { useAuth } from '../controllers/useAuth';
import { Link } from 'react-router-dom';

const RegisterView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas ingresadas no coinciden.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe contener al menos 6 caracteres.');
      setLoading(false);
      return;
    }
    
    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      setError(error.message);
    } else {
      setMessage('El proceso de registro se ha iniciado con éxito. Se requiere la revisión del correo electrónico para proceder con la activación de la cuenta.');
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-140px)] p-6 bg-gradient-to-br from-blue-50 to-sky-100 -mx-4 md:-mx-8 -mb-12">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl shadow-navy/5 w-full max-w-[450px] border border-navy/5 animate-in zoom-in-95 duration-300">
        <h2 className="mt-0 mb-2 text-center text-navy font-black text-2xl uppercase tracking-tight">Crear Cuenta</h2>
        <p className="text-center text-slate-500 text-sm mb-8 font-medium italic italic">Se solicita el ingreso de los datos requeridos para completar el registro.</p>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700">Nombre Completo</label>
            <input 
              type="text" 
              className="w-full p-2.5 border border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/5"
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              placeholder="Ingrese su nombre completo"
              required 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700">Correo Electrónico</label>
            <input 
              type="email" 
              className="w-full p-2.5 border border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/5"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="ejemplo@correo.com"
              required 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700">Contraseña</label>
            <input 
              type="password" 
              className="w-full p-2.5 border border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/5"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Mínimo 6 caracteres"
              required 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700">Confirmar Contraseña</label>
            <input 
              type="password" 
              className="w-full p-2.5 border border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/5"
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="Repita su contraseña"
              required 
            />
          </div>
          {error && (
            <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100 font-medium">
              {error}
            </div>
          )}
          {message && (
            <div className="text-green-700 bg-green-50 p-3 rounded-lg text-sm border border-green-100 font-medium leading-relaxed">
              {message}
            </div>
          )}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full p-3.5 bg-navy text-white border-none rounded-xl text-base font-black cursor-pointer transition-all hover:bg-navy-light disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-navy/20 active:scale-[0.98] mt-4"
          >
            {loading ? 'Procesando...' : 'Registrar Cuenta'}
          </button>
        </form>
        <p className="text-center mt-6 text-sm text-slate-500 font-medium">
          ¿Posee una cuenta registrada? <Link to="/login" className="text-navy font-bold no-underline hover:underline ml-1">Iniciar Sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterView;