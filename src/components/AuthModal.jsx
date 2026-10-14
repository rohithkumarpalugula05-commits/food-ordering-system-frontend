import { useState } from 'react';
import { api } from '../services/api';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleQuickFill = (roleType) => {
    setTab('login');
    setErrorMsg('');
    if (roleType === 'admin') {
      setEmail('admin@foodorder.com');
      setPassword('admin123');
    } else {
      setEmail('customer@foodorder.com');
      setPassword('customer123');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await api.auth.login({ email, password });
      if (res.success) {
        onLoginSuccess(res);
        onClose();
      } else {
        setErrorMsg(res.message || 'Login failed.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await api.auth.register({
        fullName,
        email,
        password,
        phone,
        address,
        role: 'ROLE_CUSTOMER',
      });

      if (res.success) {
        setSuccessMsg('Account created successfully! Logging you in...');
        setTimeout(() => {
          onLoginSuccess(res);
          onClose();
        }, 1000);
      } else {
        setErrorMsg(res.message || 'Registration failed.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {tab === 'login' ? 'Welcome Back!' : 'Create an Account'}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Demo Quick Fill Buttons */}
          <div className="demo-credentials-banner">
            <span className="demo-title">⚡ Quick College Demo Login:</span>
            <div className="demo-btn-group">
              <button
                type="button"
                className="btn btn-outline btn-sm demo-badge-btn"
                onClick={() => handleQuickFill('admin')}
              >
                👑 Demo Admin
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm demo-badge-btn"
                onClick={() => handleQuickFill('customer')}
              >
                👤 Demo Customer
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="auth-tab-bar">
            <button
              className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
              onClick={() => {
                setTab('login');
                setErrorMsg('');
              }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
              onClick={() => {
                setTab('register');
                setErrorMsg('');
              }}
            >
              Register
            </button>
          </div>

          {errorMsg && <div className="alert-box error">{errorMsg}</div>}
          {successMsg && <div className="alert-box success">{successMsg}</div>}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="admin@foodorder.com or customer@foodorder.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full submit-auth-btn"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Priya Patel"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. priya@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password (min 6 chars)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Address</label>
                <textarea
                  className="form-textarea"
                  placeholder="Default address for orders"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full submit-auth-btn"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Register as Customer'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
