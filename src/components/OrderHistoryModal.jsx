import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function OrderHistoryModal({ user, onClose, onTrackOrder }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadUserOrders(user.id);
    }
  }, [user]);

  const loadUserOrders = async (userId) => {
    try {
      setLoading(true);
      const res = await api.orders.getByUser(userId);
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load user orders:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content order-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">My Order History</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">Loading your order history...</div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <span>🍽️</span>
              <p>You haven't placed any orders yet.</p>
            </div>
          ) : (
            <div className="history-orders-list">
              {orders.map((ord) => (
                <div key={ord.id} className="history-order-card">
                  <div className="history-order-header">
                    <div>
                      <span className="history-tracking-id">{ord.orderTrackingNumber}</span>
                      <h4 className="history-restaurant-name">{ord.restaurant?.name || 'Restaurant'}</h4>
                    </div>
                    <span className={`badge badge-status badge-${ord.orderStatus?.toLowerCase()}`}>
                      {ord.orderStatus}
                    </span>
                  </div>

                  <div className="history-items-summary">
                    <p className="history-items-text">
                      {ord.items?.map((it) => `${it.quantity}x ${it.itemName}`).join(', ')}
                    </p>
                  </div>

                  <div className="history-order-footer">
                    <div className="history-date-amount">
                      <span className="history-amount">₹{ord.totalAmount?.toFixed(2)}</span>
                      <span className="history-date">
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <button
                      className="btn btn-outline btn-sm track-order-action-btn"
                      onClick={() => onTrackOrder(ord)}
                    >
                      Track Order 📍
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
