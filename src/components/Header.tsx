import React, { useState } from 'react';
import { useAuth } from '../controllers/useAuth';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, AlertTriangle, X } from 'lucide-react';
import { useAIAnalysisContext } from '../controllers/AIAnalysisContext';

const Header: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { isLoading: isAnalyzing, cancelAnalysis } = useAIAnalysisContext();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    if (isAnalyzing) {
      setShowLogoutModal(true);
      return;
    }
    await signOut();
    navigate('/login');
  };

  const handleConfirmLogout = async () => {
    cancelAnalysis();
    setShowLogoutModal(false);
    await signOut();
    navigate('/login');
  };

  return (
    <>
      <header className="fixed top-0 w-full h-[60px] bg-white border-b border-slate-200 z-[1000] flex items-center">
        <div className={`w-full px-6 md:px-12 flex items-center ${!profile ? 'justify-center' : 'justify-between'}`}>
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <h1 className="text-xl md:text-2xl font-black text-navy tracking-tight m-0 uppercase">Gestión de Pruebas de Usabilidad</h1>
          </div>
          
          {profile && (
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[0.85rem] text-slate-600 font-semibold">{profile.full_name || profile.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  className="bg-transparent border-none text-slate-500 p-2 rounded-full cursor-pointer transition-all hover:bg-slate-100 hover:text-navy flex items-center justify-center" 
                  onClick={() => navigate('/settings')}
                  aria-label="Abrir configuración"
                  title="Configuración"
                >
                  <Settings size={20} aria-hidden="true" />
                </button>
                <button 
                  className="bg-red-600 text-white border-none px-4 py-2 rounded-lg cursor-pointer text-[0.85rem] font-bold transition-all hover:bg-red-700 flex items-center gap-2" 
                  onClick={handleLogout}
                  aria-label="Cerrar sesión"
                >
                  <LogOut size={16} aria-hidden="true" /> <span className="hidden sm:inline">Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Modal de confirmación: análisis en curso */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)}
          />
          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-2xl border-2 border-amber-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} className="text-amber-600" />
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-lg leading-tight">Análisis en curso</h2>
                <p className="text-amber-700 text-xs font-bold uppercase tracking-widest mt-0.5">IA procesando observaciones</p>
              </div>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Hay un análisis de IA en progreso. Si cierras sesión ahora, el análisis se <strong className="text-red-600">cancelará</strong> y perderás los resultados.
              <br /><br />
              ¿Deseas salir de todas formas?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer"
              >
                Continuar esperando
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-black text-sm uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200 cursor-pointer"
              >
                Salir de todas formas
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
