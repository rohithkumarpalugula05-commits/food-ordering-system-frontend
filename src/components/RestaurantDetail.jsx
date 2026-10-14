import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function RestaurantDetail({
  restaurant,
  cartItems,
  onAddToCart,
  onUpdateCartQuantity,
  onBack,
}) {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [vegOnly, setVegOnly] = useState(false);

  useEffect(() => {
    if (restaurant?.id) {
      loadMenuItems(restaurant.id);
    }
  }, [restaurant]);

  const loadMenuItems = async (restaurantId) => {
    try {
      setLoading(true);
      const res = await api.menuItems.getByRestaurant(restaurantId, false);
      if (res.success) {
        setMenuItems(res.data);
      }
    } catch (err) {
      console.error('Failed to load menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['ALL', ...new Set(menuItems.map((item) => item.category))];

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesVeg = !vegOnly || item.isVegetarian;
    return matchesCategory && matchesVeg;
  });

  const getItemQuantityInCart = (itemId) => {
    const found = cartItems.find((ci) => ci.id === itemId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="restaurant-detail-view">
      {/* Back button & Restaurant Hero */}
      <div className="restaurant-detail-header-card">
        <button className="btn btn-outline btn-sm back-nav-btn" onClick={onBack}>
          ← Back to All Restaurants
        </button>

        <div className="restaurant-detail-info-grid">
          <img
            src={restaurant.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'}
            alt={restaurant.name}
            className="restaurant-detail-img"
          />
          <div className="restaurant-detail-text">
            <div className="detail-tags-row">
              <span className="badge badge-status badge-preparing">
                ⭐ {restaurant.rating ? restaurant.rating.toFixed(1) : '4.5'} Rating
              </span>
              <span className="badge badge-status badge-delivered">
                ⏱️ {restaurant.deliveryTimeMinutes || 30} mins
              </span>
            </div>
            <h1 className="restaurant-detail-title">{restaurant.name}</h1>
            <p className="restaurant-detail-cuisine">{restaurant.cuisineType}</p>
            <p className="restaurant-detail-description">{restaurant.description}</p>
            <p className="restaurant-detail-contact">
              <span>📍 {restaurant.address}</span> • <span>📞 {restaurant.phone}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Menu Filters Row */}
      <div className="menu-filter-bar">
        <div className="category-scroll-list">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <label className="veg-only-toggle">
          <input
            type="checkbox"
            checked={vegOnly}
            onChange={(e) => setVegOnly(e.target.checked)}
          />
          <span className="toggle-label">🌱 Pure Veg Only</span>
        </label>
      </div>

      {/* Dishes Grid */}
      <div className="menu-dishes-section">
        <h2 className="section-title">
          {selectedCategory === 'ALL' ? 'All Dishes' : selectedCategory} ({filteredItems.length})
        </h2>

        {loading ? (
          <div className="loading-state">Loading scrumptious dishes...</div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">No items found matching the selected filters.</div>
        ) : (
          <div className="dishes-grid">
            {filteredItems.map((item) => {
              const qty = getItemQuantityInCart(item.id);
              return (
                <div key={item.id} className="dish-card" id={`dish-card-${item.id}`}>
                  <div className="dish-img-wrap">
                    <img
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'}
                      alt={item.name}
                      className="dish-img"
                      loading="lazy"
                    />
                    <span className={`dish-diet-badge ${item.isVegetarian ? 'veg' : 'non-veg'}`}>
                      {item.isVegetarian ? '🌱 VEG' : '🍗 NON-VEG'}
                    </span>
                  </div>

                  <div className="dish-content">
                    <div className="dish-meta-top">
                      <span className="dish-category-label">{item.category}</span>
                      <span className="dish-price">₹{item.price.toFixed(2)}</span>
                    </div>

                    <h3 className="dish-title">{item.name}</h3>
                    <p className="dish-desc">{item.description}</p>

                    <div className="dish-footer-action">
                      {qty === 0 ? (
                        <button
                          className="btn btn-primary btn-sm add-cart-btn"
                          onClick={() => onAddToCart(item, restaurant)}
                        >
                          + Add to Cart
                        </button>
                      ) : (
                        <div className="quantity-control">
                          <button
                            className="quantity-btn"
                            onClick={() => onUpdateCartQuantity(item.id, qty - 1)}
                          >
                            -
                          </button>
                          <span className="quantity-value">{qty}</span>
                          <button
                            className="quantity-btn"
                            onClick={() => onUpdateCartQuantity(item.id, qty + 1)}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
