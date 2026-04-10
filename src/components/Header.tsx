import React from 'react';
import { useAuth } from '../controllers/useAuth';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="main-header-nav">
      <div className={`header-container ${!profile ? 'centered' : ''}`}>
        <div className="header-left" onClick={() => navigate('/')}>
          <h1 className="header-logo">Gestión de Pruebas de Usabilidad</h1>
        </div>
        
        {profile && (
          <div className="header-right">
            <div className="user-menu">
              <span className="user-email">{profile.full_name || profile.email}</span>
              <button 
                className="header-icon-button" 
                onClick={() => navigate('/settings')}
                title="Configuración"
              >
                ⚙️
              </button>
              <button 
                className="logout-button" 
                onClick={handleLogout}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
