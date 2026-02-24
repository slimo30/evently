import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { LogIn, Mail, Lock } from 'lucide-react';

const Login = ({ setUser }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { access_token } = await api.login({ email, password });
            localStorage.setItem('token', access_token);
            const userData = await api.getMe();
            setUser(userData);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon-wrapper">
                        <LogIn className="icon-primary" />
                    </div>
                    <h2>Welcome Back</h2>
                    <p>Sign in to continue your adventure</p>
                </div>

                {error && <div className="error-alert">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Email Address</label>
                        <div className="input-with-icon">
                            <Mail size={18} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div className="input-with-icon">
                            <Lock size={18} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Create one</Link>
                </p>
            </div>

            <style jsx>{`
        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .auth-icon-wrapper {
          width: 50px;
          height: 50px;
          background: var(--primary-light);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }
        .auth-header h2 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
        }
        .auth-header p {
          color: var(--text-muted);
        }
        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-with-icon svg {
          position: absolute;
          left: 1rem;
          color: var(--text-muted);
        }
        .input-with-icon input {
          padding-left: 3rem !important;
        }
        .btn-full {
          width: 100%;
          justify-content: center;
          padding: 0.8rem;
          margin-top: 1rem;
        }
        .error-alert {
          background: #fef2f2;
          color: #ef4444;
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
          border-left: 4px solid #ef4444;
        }
        .auth-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.95rem;
          color: var(--text-muted);
        }
        .auth-footer a {
          color: var(--primary);
          font-weight: 600;
        }
      `}</style>
        </div>
    );
};

export default Login;
