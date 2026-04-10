import React, { useState } from 'react';
import { useAuth } from '../controllers/useAuth';
import { useNavigate, Link } from 'react-router-dom';

const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      setError('Las credenciales proporcionadas son incorrectas o la cuenta no ha sido activada.');
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-140px)] p-6 bg-gradient-to-br from-blue-50 to-sky-100 -mx-4 md:-mx-8 -mb-12">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl shadow-navy/5 w-full max-w-[450px] border border-navy/5 animate-in zoom-in-95 duration-300">
        <h2 className="mt-0 mb-2 text-center text-navy font-black text-2xl uppercase tracking-tight">Inicio de Sesión</h2>
        <p className="text-center text-slate-500 text-sm mb-8 font-medium italic">Bienvenido ingrese sus datos.</p>
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700">Correo Electrónico</label>
            <input 
              type="email" 
              className="w-full p-3 border border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/5"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Ingrese su dirección de correo"
              required 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700">Contraseña</label>
            <input 
              type="password" 
              className="w-full p-3 border border-slate-200 rounded-lg text-base transition-all focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/5"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Ingrese su contraseña"
              required 
            />
          </div>
          {error && (
            <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100 font-medium">
              {error}
            </div>
          )}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full p-3.5 bg-navy text-white border-none rounded-xl text-base font-black cursor-pointer transition-all hover:bg-navy-light disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-navy/20 active:scale-[0.98]"
          >
            {loading ? 'Validando...' : 'Acceder al Sistema'}
          </button>
        </form>
        <p className="text-center mt-8 text-sm text-slate-500 font-medium">
          ¿No dispone de una cuenta? <Link to="/register" className="text-navy font-bold no-underline hover:underline ml-1">Solicitar Registro</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginView;
