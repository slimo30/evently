import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { UserPlus, Mail, Lock, User } from 'lucide-react';

const Register = ({ setUser }) => {
    const [name, setName] = useState('');
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
            await api.register({ name, email, password });
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
                        <UserPlus className="icon-primary" />
                    </div>
                    <h2>Join Evently</h2>
                    <p>Create an account to start exploring</p>
                </div>

                {error && <div className="error-alert">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Full Name</label>
                        <div className="input-with-icon">
                            <User size={18} />
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

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
                                placeholder="Min. 8 characters"
                                minLength={8}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
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

export default Register;
