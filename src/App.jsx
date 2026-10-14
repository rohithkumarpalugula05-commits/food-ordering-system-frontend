import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import RestaurantCard from './components/RestaurantCard';
import RestaurantDetail from './components/RestaurantDetail';
import CartDrawer from './components/CartDrawer';
import OrderTrackingModal from './components/OrderTrackingModal';
import OrderHistoryModal from './components/OrderHistoryModal';
import AuthModal from './components/AuthModal';
import AdminDashboard from './components/AdminDashboard';
import { api } from './services/api';
import './App.css';

function App() {
  // Current user state
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('food_order_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Cart state
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('food_order_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active restaurant for items in cart
  const [activeCartRestaurant, setActiveCartRestaurant] = useState(() => {
    try {
      const saved = localStorage.getItem('food_order_cart_rest');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Restaurants list
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);

  // Selected restaurant for viewing dishes
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);

  // Tracking Modal State
  const [trackingModal, setTrackingModal] = useState({
    isOpen: false,
    trackingNumber: '',
    order: null,
  });

  // Order Confirmation Success Modal
  const [orderSuccessModal, setOrderSuccessModal] = useState({
    isOpen: false,
    order: null,
  });

  // Sync Cart to localStorage
  useEffect(() => {
    localStorage.setItem('food_order_cart', JSON.stringify(cart));
    localStorage.setItem('food_order_cart_rest', JSON.stringify(activeCartRestaurant));
  }, [cart, activeCartRestaurant]);

  // Sync User to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('food_order_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('food_order_user');
    }
  }, [user]);

  // Load restaurants on mount
  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoadingRestaurants(true);
      const res = await api.restaurants.getAll();
      if (res.success && res.data) {
        setRestaurants(res.data);
      }
    } catch (err) {
      console.error('Failed to load restaurants:', err);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  // Cart operations
  const handleAddToCart = (item, restaurant) => {
    // If adding from a different restaurant, check confirmation
    if (cart.length > 0 && activeCartRestaurant && activeCartRestaurant.id !== restaurant.id) {
      const confirmClear = window.confirm(
        `Your cart contains dishes from ${activeCartRestaurant.name}. Discard existing cart to add dishes from ${restaurant.name}?`
      );
      if (!confirmClear) return;
      setCart([{ ...item, quantity: 1, restaurantId: restaurant.id, restaurantName: restaurant.name }]);
      setActiveCartRestaurant(restaurant);
      return;
    }

    setActiveCartRestaurant(restaurant);
    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci.id === item.id);
      if (existing) {
        return prevCart.map((ci) =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prevCart, { ...item, quantity: 1, restaurantId: restaurant.id, restaurantName: restaurant.name }];
    });
  };

  const handleUpdateCartQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      const updated = cart.filter((ci) => ci.id !== itemId);
      setCart(updated);
      if (updated.length === 0) setActiveCartRestaurant(null);
    } else {
      setCart((prev) =>
        prev.map((ci) => (ci.id === itemId ? { ...ci, quantity: newQuantity } : ci))
      );
    }
  };

  const handleClearCart = () => {
    setCart([]);
    setActiveCartRestaurant(null);
  };

  // Auth operations
  const handleLoginSuccess = (authRes) => {
    setUser({
      id: authRes.id,
      fullName: authRes.fullName,
      email: authRes.email,
      role: authRes.role,
      phone: authRes.phone,
      address: authRes.address,
    });
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdminView(false);
  };

  // Order Placement Success
  const handleOrderSuccess = (placedOrder) => {
    setOrderSuccessModal({
      isOpen: true,
      order: placedOrder,
    });
  };

  // Open Tracking Modal
  const handleOpenTracking = (trackingNumber, orderObj = null) => {
    setTrackingModal({
      isOpen: true,
      trackingNumber: trackingNumber || '',
      order: orderObj,
    });
  };

  // Filtered restaurants
  const filteredRestaurants = restaurants.filter((r) => {
    const matchesQuery =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisineType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter =
      activeFilter === 'ALL' ||
      r.cuisineType.toLowerCase().includes(activeFilter.toLowerCase());

    return matchesQuery && matchesFilter;
  });

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Top Navbar */}
      <Navbar
        user={user}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => setIsAdminView(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenTracking={(trackNum) => handleOpenTracking(trackNum)}
        onLogout={handleLogout}
        onHomeClick={() => {
          setSelectedRestaurant(null);
          setIsAdminView(false);
        }}
      />

      {/* Main Body */}
      {isAdminView ? (
        <AdminDashboard onClose={() => setIsAdminView(false)} />
      ) : selectedRestaurant ? (
        <main className="container main-content">
          <RestaurantDetail
            restaurant={selectedRestaurant}
            cartItems={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onBack={() => setSelectedRestaurant(null)}
          />
        </main>
      ) : (
        <>
          {/* Hero Banner with Search */}
          <HeroBanner
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />

          {/* Restaurant List Section */}
          <main className="container main-content">
            <div className="section-header-row">
              <div>
                <h2 className="section-title">Popular Restaurants</h2>
                <p className="restaurant-count-sub">
                  Showing {filteredRestaurants.length} restaurants ready to deliver
                </p>
              </div>
            </div>

            {loadingRestaurants ? (
              <div className="loading-state">Finding nearby delicious restaurants...</div>
            ) : filteredRestaurants.length === 0 ? (
              <div className="empty-state">
                <span>🔍</span>
                <h3>No restaurants found</h3>
                <p>Try searching for a different cuisine or clearing your filter.</p>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('ALL');
                  }}
                  style={{ marginTop: '12px' }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="restaurants-grid">
                {filteredRestaurants.map((rest) => (
                  <RestaurantCard
                    key={rest.id}
                    restaurant={rest}
                    onSelect={(selected) => setSelectedRestaurant(selected)}
                  />
                ))}
              </div>
            )}
          </main>
        </>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div className="container">
          <p>
            <strong>Food Ordering System</strong> — College Java Full-Stack Project
          </p>
          <p style={{ marginTop: '4px', fontSize: '12px' }}>
            Built with Spring Boot 4 / Java 21, MySQL 8.0, and React 19 + Vite.
          </p>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        activeRestaurant={activeCartRestaurant}
        user={user}
        onUpdateQuantity={handleUpdateCartQuantity}
        onClearCart={handleClearCart}
        onOrderSuccess={handleOrderSuccess}
        onRequireLogin={() => {
          setIsCartOpen(false);
          setIsAuthOpen(true);
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Live Order Tracking Modal */}
      {trackingModal.isOpen && (
        <OrderTrackingModal
          initialTrackingNumber={trackingModal.trackingNumber}
          initialOrder={trackingModal.order}
          onClose={() => setTrackingModal({ isOpen: false, trackingNumber: '', order: null })}
        />
      )}

      {/* Order History Modal */}
      {isOrdersOpen && (
        <OrderHistoryModal
          user={user}
          onClose={() => setIsOrdersOpen(false)}
          onTrackOrder={(ord) => {
            setIsOrdersOpen(false);
            handleOpenTracking(ord.orderTrackingNumber, ord);
          }}
        />
      )}

      {/* Order Confirmation Success Modal */}
      {orderSuccessModal.isOpen && (
        <div
          className="modal-overlay"
          onClick={() => setOrderSuccessModal({ isOpen: false, order: null })}
        >
          <div
            className="modal-content order-success-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-body">
              <span className="success-icon-large">🎉</span>
              <h2 className="order-success-title">Order Placed Successfully!</h2>
              <p>Your order has been received by the kitchen and is being prepared.</p>

              <div>
                <span className="order-success-code">
                  {orderSuccessModal.order?.orderTrackingNumber}
                </span>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b' }}>
                Total Paid: <strong>₹{orderSuccessModal.order?.totalAmount?.toFixed(2)}</strong> via{' '}
                {orderSuccessModal.order?.paymentMethod}
              </p>

              <div className="success-modal-actions">
                <button
                  id="view-live-tracking-btn"
                  className="btn btn-primary"
                  onClick={() => {
                    const ord = orderSuccessModal.order;
                    setOrderSuccessModal({ isOpen: false, order: null });
                    handleOpenTracking(ord?.orderTrackingNumber, ord);
                  }}
                >
                  📍 Track Order Live
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setOrderSuccessModal({ isOpen: false, order: null })}
                >
                  Back to Restaurants
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
