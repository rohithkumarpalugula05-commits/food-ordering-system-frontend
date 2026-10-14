import { useState } from 'react';

export default function Navbar({
  user,
  cartCount,
  onOpenCart,
  onOpenAuth,
  onOpenAdmin,
  onOpenOrders,
  onOpenTracking,
  onLogout,
  onHomeClick,
}) {
  const [trackInput, setTrackInput] = useState('');
  const [showQuickTrack, setShowQuickTrack] = useState(false);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (trackInput.trim()) {
      onOpenTracking(trackInput.trim());
      setTrackInput('');
      setShowQuickTrack(false);
    }
  };

  return (
    <header className="navbar-wrapper">
      <div className="container navbar-container">
        {/* Brand / Logo */}
        <div className="nav-brand" onClick={onHomeClick} style={{ cursor: 'pointer' }}>
          <span className="brand-logo-icon">🍔</span>
          <div className="brand-text">
            <span className="brand-name">Foodie<span className="brand-highlight">Hub</span></span>
            <span className="brand-tagline">Order Fresh & Fast</span>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="nav-actions">
          {/* Quick Track Search */}
          <div className="quick-track-container">
            {showQuickTrack ? (
              <form onSubmit={handleTrackSubmit} className="quick-track-form">
                <input
                  type="text"
                  placeholder="Enter Order ID (e.g. ORD-20261013-1001)"
                  value={trackInput}
                  onChange={(e) => setTrackInput(e.target.value)}
                  className="quick-track-input"
                  autoFocus
                />
                <button type="submit" className="btn btn-primary btn-sm">Track</button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowQuickTrack(false)}
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                className="btn btn-outline btn-sm track-nav-btn"
                onClick={() => setShowQuickTrack(true)}
              >
                📍 Track Order
              </button>
            )}
          </div>

          {/* Admin Dashboard Button if Admin */}
          {user && user.role === 'ROLE_ADMIN' && (
            <button
              id="admin-dashboard-btn"
              className="btn btn-secondary btn-sm admin-badge-btn"
              onClick={onOpenAdmin}
            >
              ⚙️ Admin Panel
            </button>
          )}

          {/* My Orders (for logged-in customers) */}
          {user && (
            <button
              id="my-orders-btn"
              className="btn btn-outline btn-sm"
              onClick={onOpenOrders}
            >
              📜 My Orders
            </button>
          )}

          {/* Cart Button */}
          <button
            id="cart-trigger-btn"
            className="btn btn-primary cart-nav-btn"
            onClick={onOpenCart}
          >
            <span>🛒 Cart</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>

          {/* User Auth Section */}
          {user ? (
            <div className="user-profile-widget">
              <div className="user-avatar-circle">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-info-text">
                <span className="user-name-title">{user.fullName}</span>
                <span className="user-role-sub">
                  {user.role === 'ROLE_ADMIN' ? 'Administrator' : 'Customer'}
                </span>
              </div>
              <button
                id="logout-btn"
                className="btn btn-outline btn-sm logout-btn"
                onClick={onLogout}
                title="Logout"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              id="signin-btn"
              className="btn btn-outline"
              onClick={onOpenAuth}
            >
              👤 Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
