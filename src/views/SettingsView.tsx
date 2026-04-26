import React, { useState, useEffect } from 'react';
import { useAuth } from '../controllers/useAuth';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const SettingsView: React.FC = () => {
  const { profile, updateProfile, changePassword, session } = useAuth();
  const navigate = useNavigate();
  
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (profile) setFullName(profile.full_name || '');
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);
    
    const { error } = await updateProfile({ full_name: fullName });
    
    if (error) {
      setProfileMessage({ type: 'error', text: 'Error al actualizar el perfil.' });
    } else {
      setProfileMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
    }
    setProfileLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
      setPasswordLoading(false);
      return;
    }
    
    const { error } = await changePassword(newPassword, currentPassword);
    
    if (error) {
      const errorMsg = error.status === 400 ? 'La contraseña actual es incorrecta.' : error.message;
      setPasswordMessage({ type: 'error', text: errorMsg });
    } else {
      setPasswordMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setPasswordLoading(false);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto pb-12 pt-24 px-4">
      <header className="flex items-center gap-4 mb-8 flex-wrap">
        <button 
          onClick={() => navigate('/')}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
          aria-label="Volver al inicio"
        >
          <ArrowLeft size={24} aria-hidden="true" />
        </button>
        <h1 className="text-2xl font-black text-navy uppercase tracking-tight m-0">Configuración de Cuenta</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Perfil */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-fit">
          <div className="bg-navy p-4 text-white flex items-center gap-2">
            <User size={20} />
            <h2 className="text-sm font-black uppercase tracking-wider m-0">Información del Perfil</h2>
          </div>
          <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest block">Correo Electrónico</span>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-500 font-medium text-sm">
                {session?.user?.email}
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="full-name" className="text-xs font-black text-slate-500 uppercase tracking-widest block">Nombre Completo</label>
              <input 
                id="full-name"
                type="text" 
                className="w-full p-3 border border-slate-200 rounded-lg text-sm font-medium focus:ring-4 focus:ring-navy/5 focus:border-navy outline-none transition-all"
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                placeholder="Tu nombre completo"
                required 
              />
            </div>

            {profileMessage && (
              <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-bold animate-in zoom-in-95 ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {profileMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {profileMessage.text}
              </div>
            )}

            <button 
              type="submit" 
              disabled={profileLoading}
              className="w-full p-3 bg-navy text-white border-none rounded-xl text-sm font-black cursor-pointer transition-all hover:bg-navy-light disabled:bg-slate-300 shadow-lg shadow-navy/10 flex items-center justify-center gap-2"
            >
              {profileLoading ? <Loader2 size={18} className="animate-spin" /> : 'Guardar Cambios'}
            </button>
          </form>
        </section>

        {/* Contraseña */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-fit">
          <div className="bg-slate-800 p-4 text-white flex items-center gap-2">
            <Lock size={20} />
            <h2 className="text-sm font-black uppercase tracking-wider m-0">Seguridad</h2>
          </div>
          <form onSubmit={handleUpdatePassword} className="p-6 space-y-6">
            <div className="space-y-2">
              <label htmlFor="current-password" className="text-xs font-black text-slate-500 uppercase tracking-widest block">Contraseña Actual</label>
              <input 
                id="current-password"
                type="password" 
                className="w-full p-3 border border-slate-200 rounded-lg text-sm font-medium focus:ring-4 focus:ring-navy/5 focus:border-navy outline-none transition-all"
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)} 
                placeholder="Ingresa tu contraseña actual"
                required 
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="new-password" className="text-xs font-black text-slate-500 uppercase tracking-widest block">Nueva Contraseña</label>
              <input 
                id="new-password"
                type="password" 
                className="w-full p-3 border border-slate-200 rounded-lg text-sm font-medium focus:ring-4 focus:ring-navy/5 focus:border-navy outline-none transition-all"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="Mínimo 6 caracteres"
                required 
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-xs font-black text-slate-500 uppercase tracking-widest block">Confirmar Nueva Contraseña</label>
              <input 
                id="confirm-password"
                type="password" 
                className="w-full p-3 border border-slate-200 rounded-lg text-sm font-medium focus:ring-4 focus:ring-navy/5 focus:border-navy outline-none transition-all"
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Repite la nueva contraseña"
                required 
              />
            </div>

            {passwordMessage && (
              <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-bold animate-in zoom-in-95 ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {passwordMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {passwordMessage.text}
              </div>
            )}

            <button 
              type="submit" 
              disabled={passwordLoading}
              className="w-full p-3 bg-slate-800 text-white border-none rounded-xl text-sm font-black cursor-pointer transition-all hover:bg-slate-900 disabled:bg-slate-300 shadow-lg shadow-black/10 flex items-center justify-center gap-2"
            >
              {passwordLoading ? <Loader2 size={18} className="animate-spin" /> : 'Actualizar Contraseña'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default SettingsView;
