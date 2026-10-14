import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  activeRestaurant,
  user,
  onUpdateQuantity,
  onClearCart,
  onOrderSuccess,
  onRequireLogin,
}) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setCustomerName(user.fullName || '');
      setCustomerPhone(user.phone || '');
      setDeliveryAddress(user.address || '');
    }
  }, [user]);

  if (!isOpen) return null;

  const itemTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = itemTotal > 500 ? 0 : 40;
  const grandTotal = itemTotal + deliveryFee;

  const handleCheckout = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user) {
      onRequireLogin();
      return;
    }

    if (cartItems.length === 0) {
      setErrorMsg('Your cart is empty.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      setErrorMsg('Please enter your full delivery address and contact phone number.');
      return;
    }

    try {
      setSubmitting(true);
      const orderPayload = {
        userId: user.id,
        restaurantId: activeRestaurant?.id || cartItems[0]?.restaurantId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        paymentMethod,
        specialInstructions: specialInstructions.trim(),
        items: cartItems.map((item) => ({
          menuItemId: item.id,
          itemName: item.name,
          itemPrice: item.price,
          quantity: item.quantity,
        })),
      };

      const res = await api.orders.place(orderPayload);
      if (res.success && res.data) {
        onClearCart();
        onClose();
        onOrderSuccess(res.data);
      } else {
        setErrorMsg(res.message || 'Failed to place order.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while placing your order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div>
            <h2 className="modal-title">Your Order Cart</h2>
            {activeRestaurant && (
              <p className="cart-restaurant-name">From: {activeRestaurant.name}</p>
            )}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {errorMsg && <div className="alert-box error">{errorMsg}</div>}

          {cartItems.length === 0 ? (
            <div className="cart-empty-state">
              <span className="empty-cart-icon">🛒</span>
              <h3>Your cart is empty</h3>
              <p>Explore delicious dishes from our restaurants and add them to your cart!</p>
            </div>
          ) : (
            <div className="cart-filled-content">
              {/* Items List */}
              <div className="cart-items-list">
                {cartItems.map((item) => (
                  <div key={item.id} className="cart-item-row">
                    <div className="cart-item-info">
                      <span className="cart-item-name">{item.name}</span>
                      <span className="cart-item-unit-price">₹{item.price.toFixed(2)} each</span>
                    </div>

                    <div className="cart-item-actions">
                      <div className="quantity-control">
                        <button
                          className="quantity-btn"
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span className="quantity-value">{item.quantity}</span>
                        <button
                          className="quantity-btn"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <span className="cart-item-subtotal">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Details Form */}
              <div className="checkout-details-section">
                <h3 className="checkout-heading">Delivery Details</h3>

                {!user && (
                  <div className="login-prompt-banner">
                    <p>💡 Please log in or sign up to finalize your order.</p>
                    <button className="btn btn-outline btn-sm" onClick={onRequireLogin}>
                      Sign In Now
                    </button>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Delivery Address</label>
                  <textarea
                    className="form-textarea"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="House/Flat No, Street, Landmark, City..."
                    rows={2}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="CASH_ON_DELIVERY">💵 Cash on Delivery (COD)</option>
                    <option value="UPI">📱 UPI / QR Code</option>
                    <option value="CARD">💳 Credit / Debit Card</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Cooking & Delivery Instructions</label>
                  <input
                    type="text"
                    className="form-input"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Make it spicy, please don't ring doorbell"
                  />
                </div>
              </div>

              {/* Bill Breakdown */}
              <div className="bill-summary-card">
                <h4 className="bill-heading">Bill Summary</h4>
                <div className="bill-row">
                  <span>Item Total</span>
                  <span>₹{itemTotal.toFixed(2)}</span>
                </div>
                <div className="bill-row">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? <strong className="free-text">FREE</strong> : `₹${deliveryFee.toFixed(2)}`}</span>
                </div>
                {itemTotal > 500 && (
                  <p className="free-delivery-badge">🎉 Congratulations! Free delivery unlocked</p>
                )}
                <div className="bill-row grand-total">
                  <span>To Pay</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="drawer-footer">
            <button
              id="place-order-btn"
              className="btn btn-primary place-order-btn"
              onClick={handleCheckout}
              disabled={submitting}
            >
              {submitting ? 'Placing Order...' : `Place Order • ₹${grandTotal.toFixed(2)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
