import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function OrderTrackingModal({ initialTrackingNumber, initialOrder, onClose }) {
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber || '');
  const [order, setOrder] = useState(initialOrder || null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialOrder) {
      setOrder(initialOrder);
      setTrackingNumber(initialOrder.orderTrackingNumber);
    } else if (initialTrackingNumber) {
      handleSearch(initialTrackingNumber);
    }
  }, [initialTrackingNumber, initialOrder]);

  const handleSearch = async (numToSearch) => {
    const query = numToSearch || trackingNumber;
    if (!query.trim()) return;

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.orders.track(query.trim());
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        setErrorMsg('Order not found. Please double check your tracking number.');
        setOrder(null);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Order not found.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { key: 'PLACED', label: 'Order Placed', icon: '📝', desc: 'Received by kitchen' },
    { key: 'PREPARING', label: 'Kitchen Preparing', icon: '🍳', desc: 'Chefs are cooking' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: '🛵', desc: 'Rider on the way' },
    { key: 'DELIVERED', label: 'Delivered', icon: '🎉', desc: 'Enjoy your meal!' },
  ];

  const getStepStatus = (stepKey, currentStatus) => {
    if (currentStatus === 'CANCELLED') return 'cancelled';
    const statusOrder = ['PLACED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content tracking-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Live Order Tracker</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Search Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="tracking-search-bar"
          >
            <input
              type="text"
              className="form-input tracking-input"
              placeholder="Enter Order Tracking ID (e.g. ORD-20261013-1001)"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>

          {errorMsg && <div className="alert-box error">{errorMsg}</div>}

          {loading ? (
            <div className="loading-state">Fetching real-time tracking details...</div>
          ) : order ? (
            <div className="tracking-details">
              {/* Order Header Summary */}
              <div className="order-summary-box">
                <div className="summary-col">
                  <span className="summary-label">Tracking ID</span>
                  <span className="summary-val tracking-code">{order.orderTrackingNumber}</span>
                </div>
                <div className="summary-col">
                  <span className="summary-label">Restaurant</span>
                  <span className="summary-val">{order.restaurant?.name || 'Restaurant'}</span>
                </div>
                <div className="summary-col">
                  <span className="summary-label">Total Amount</span>
                  <span className="summary-val price-val">₹{order.totalAmount?.toFixed(2)}</span>
                </div>
                <div className="summary-col">
                  <span className="summary-label">Status</span>
                  <span className={`badge badge-status badge-${order.orderStatus?.toLowerCase()}`}>
                    {order.orderStatus}
                  </span>
                </div>
              </div>

              {/* Progress Stepper */}
              {order.orderStatus === 'CANCELLED' ? (
                <div className="cancelled-banner">
                  <span>❌</span> This order was marked as <strong>CANCELLED</strong>.
                </div>
              ) : (
                <div className="stepper-horizontal">
                  {steps.map((s, idx) => {
                    const status = getStepStatus(s.key, order.orderStatus);
                    return (
                      <div key={s.key} className={`step-node ${status}`}>
                        <div className="step-circle">
                          {status === 'completed' ? '✓' : s.icon}
                        </div>
                        <div className="step-label-group">
                          <span className="step-label">{s.label}</span>
                          <span className="step-desc">{s.desc}</span>
                        </div>
                        {idx < steps.length - 1 && <div className="step-connector" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Order Items & Delivery Info */}
              <div className="tracking-info-grid">
                <div className="order-items-sublist">
                  <h4>Ordered Dishes</h4>
                  <ul>
                    {order.items?.map((item, idx) => (
                      <li key={idx} className="ordered-dish-row">
                        <span>{item.quantity}x {item.itemName}</span>
                        <span>₹{item.subtotal?.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="delivery-destination-box">
                  <h4>Delivery Address</h4>
                  <p><strong>Recipient:</strong> {order.customerName}</p>
                  <p><strong>Phone:</strong> {order.customerPhone}</p>
                  <p><strong>Address:</strong> {order.deliveryAddress}</p>
                  <p><strong>Payment:</strong> {order.paymentMethod}</p>
                  {order.specialInstructions && (
                    <p><strong>Notes:</strong> <em>{order.specialInstructions}</em></p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
