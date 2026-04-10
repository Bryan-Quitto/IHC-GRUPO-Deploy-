import React, { useState, useEffect } from 'react';
import { useAuth } from '../controllers/useAuth';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const SettingsView: React.FC = () => {
  const { profile, changePassword, updateProfile, signIn } = useAuth();
  const navigate = useNavigate();
  
  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [profileMessage, setProfileMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProfileMessage(null);
    
    const { error } = await updateProfile({ full_name: fullName });
    if (error) {
      setProfileMessage({ text: 'Se ha producido un error durante la actualización del perfil.', type: 'error' });
    } else {
      setProfileMessage({ text: 'La información del perfil se ha actualizado correctamente.', type: 'success' });
    }
    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'Las nuevas contraseñas ingresadas no coinciden.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'La nueva contraseña debe contener al menos 6 caracteres.', type: 'error' });
      return;
    }
    
    setLoading(true);

    if (profile?.email) {
      const { error: authError } = await signIn(profile.email, currentPassword);
      if (authError) {
        setPasswordMessage({ text: 'La contraseña actual proporcionada es incorrecta. No se puede proceder con el cambio.', type: 'error' });
        setLoading(false);
        return;
      }
    }

    const { error } = await changePassword(newPassword);
    if (error) {
      setPasswordMessage({ text: 'Se ha producido un error al intentar modificar la contraseña.', type: 'error' });
    } else {
      setPasswordMessage({ text: 'La contraseña ha sido modificada con éxito.', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '550px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'white', color: 'var(--text-muted)',
            border: '1px solid var(--border)', borderRadius: '8px',
            padding: '10px 16px', fontWeight: 600, cursor: 'pointer',
            fontSize: '.9rem', fontFamily: 'inherit', marginBottom: '0.5rem',
            transition: 'all .2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <ArrowLeft size={16} /> Regresar al inicio
        </button>

        <div className="auth-card" style={{ maxWidth: '100%' }}>
          <h2>Configuración de Cuenta</h2>
          <p className="auth-subtitle">Gestión de la información del perfil y parámetros de seguridad del sistema.</p>
          
          <section style={{ marginBottom: '30px' }}>
            <h3 style={{ color: 'var(--primary)', borderBottom: '2px solid var(--bg-page)', paddingBottom: '10px', fontSize: '1.1rem' }}>
              Información del Perfil
            </h3>
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label>Correo Electrónico (Solo lectura)</label>
                <input type="email" value={profile?.email || ''} disabled style={{ backgroundColor: '#f8fafc' }} />
              </div>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder="Ingrese el nombre completo"
                  required 
                />
              </div>
              <button type="submit" disabled={loading} style={{ width: 'auto', padding: '10px 24px' }}>
                Actualizar Información
              </button>
              {profileMessage && (
                <p className={profileMessage.type === 'success' ? 'success-message' : 'error-message'} style={{ marginTop: '15px', marginBottom: '0' }}>
                  {profileMessage.text}
                </p>
              )}
            </form>
          </section>

          <hr style={{ margin: '30px 0', border: '0', borderTop: '1px solid #e2e8f0' }} />

          <section>
            <h3 style={{ color: 'var(--primary)', borderBottom: '2px solid var(--bg-page)', paddingBottom: '10px', fontSize: '1.1rem' }}>
              Seguridad y Acceso
            </h3>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>Contraseña Actual</label>
                <input 
                  type="password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  placeholder="Requerido para validar cambios"
                  required 
                />
              </div>
              <div className="form-group" style={{ marginTop: '15px' }}>
                <label>Nueva Contraseña</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="Mínimo 6 caracteres"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Confirmar Nueva Contraseña</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Repita la nueva contraseña"
                  required 
                />
              </div>
              <button type="submit" disabled={loading} style={{ width: 'auto', padding: '10px 24px' }}>
                Modificar Contraseña
              </button>
              {passwordMessage && (
                <p className={passwordMessage.type === 'success' ? 'success-message' : 'error-message'} style={{ marginTop: '15px', marginBottom: '0' }}>
                  {passwordMessage.text}
                </p>
              )}
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
