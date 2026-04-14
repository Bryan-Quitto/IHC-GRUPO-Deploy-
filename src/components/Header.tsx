import React from 'react';
import { useAuth } from '../controllers/useAuth';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut } from 'lucide-react';

const Header: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 w-full h-[60px] bg-white border-b border-slate-200 z-[1000] flex items-center">
      <div className={`w-full px-6 md:px-12 flex items-center ${!profile ? 'justify-center' : 'justify-between'}`}>
        <div className="cursor-pointer" onClick={() => navigate('/')}>
          <h1 className="text-lg md:text-xl font-black text-navy tracking-tight m-0 uppercase">Gestión de Pruebas de Usabilidad</h1>
        </div>
        
        {profile && (
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[0.85rem] text-slate-500 font-semibold">{profile.full_name || profile.email}</span>
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
  );
};

export default Header;
