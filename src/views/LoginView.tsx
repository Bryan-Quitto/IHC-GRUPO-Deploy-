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
    <div className="auth-container">
      <div className="auth-card">
        <h2>Inicio de Sesión</h2>
        <p className="auth-subtitle">Bienvenido ingrese sus datos.</p>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Ingrese su dirección de correo"
              required 
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Ingrese su contraseña"
              required 
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Validando...' : 'Acceder al Sistema'}
          </button>
        </form>
        <p className="auth-footer">
          ¿No dispone de una cuenta? <Link to="/register">Solicitar Registro</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginView;
