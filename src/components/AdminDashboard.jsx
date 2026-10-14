import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function AdminDashboard({ onClose }) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'restaurants', 'menu', 'users'
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Modals / forms state
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    description: '',
    cuisineType: '',
    address: '',
    phone: '',
    rating: 4.5,
    deliveryTimeMinutes: 30,
    imageUrl: '',
    active: true,
  });

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    restaurantId: '',
    name: '',
    description: '',
    price: '',
    category: 'Main Course',
    imageUrl: '',
    isVegetarian: true,
    available: true,
  });

  const [selectedRestaurantFilter, setSelectedRestaurantFilter] = useState('ALL');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes, restsRes, itemsRes, usersRes] = await Promise.all([
        api.admin.getStats(),
        api.orders.getAll(),
        api.restaurants.getAll({ all: true }),
        api.menuItems.getByRestaurant(1, true).catch(() => ({ data: [] })), // or getAll
        api.auth.getUsers(),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (ordersRes.success) setOrders(ordersRes.data);
      if (restsRes.success) {
        setRestaurants(restsRes.data);
        if (restsRes.data.length > 0) {
          setItemForm((prev) => ({ ...prev, restaurantId: restsRes.data[0].id }));
        }
      }
      if (usersRes.success) setUsers(usersRes.data);

      // Load all dishes across restaurants
      loadDishesForAllRestaurants();
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDishesForAllRestaurants = async () => {
    try {
      const allRests = await api.restaurants.getAll({ all: true });
      if (allRests.success) {
        const itemPromises = allRests.data.map((r) =>
          api.menuItems.getByRestaurant(r.id, true).catch(() => ({ data: [] }))
        );
        const itemResults = await Promise.all(itemPromises);
        const combined = itemResults.flatMap((res) => res.data || []);
        setMenuItems(combined);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- Order Status Handler ---
  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      const res = await api.orders.updateStatus(orderId, newStatus);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
        );
        showMessage('Order status updated to ' + newStatus);
        // Refresh stats
        const statsRes = await api.admin.getStats();
        if (statsRes.success) setStats(statsRes.data);
      }
    } catch (err) {
      showMessage('Failed to update status: ' + err.message, true);
    }
  };

  // --- Restaurant CRUD ---
  const openRestaurantModal = (restaurant = null) => {
    if (restaurant) {
      setEditingRestaurant(restaurant);
      setRestaurantForm({
        name: restaurant.name || '',
        description: restaurant.description || '',
        cuisineType: restaurant.cuisineType || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        rating: restaurant.rating || 4.5,
        deliveryTimeMinutes: restaurant.deliveryTimeMinutes || 30,
        imageUrl: restaurant.imageUrl || '',
        active: restaurant.active ?? true,
      });
    } else {
      setEditingRestaurant(null);
      setRestaurantForm({
        name: '',
        description: '',
        cuisineType: '',
        address: '',
        phone: '',
        rating: 4.5,
        deliveryTimeMinutes: 30,
        imageUrl: '',
        active: true,
      });
    }
    setShowRestaurantModal(true);
  };

  const handleSaveRestaurant = async (e) => {
    e.preventDefault();
    try {
      if (editingRestaurant) {
        const res = await api.restaurants.update(editingRestaurant.id, restaurantForm);
        if (res.success) {
          showMessage('Restaurant updated successfully!');
          setShowRestaurantModal(false);
          loadAllData();
        }
      } else {
        const res = await api.restaurants.create(restaurantForm);
        if (res.success) {
          showMessage('Restaurant created successfully!');
          setShowRestaurantModal(false);
          loadAllData();
        }
      }
    } catch (err) {
      showMessage('Error saving restaurant: ' + err.message, true);
    }
  };

  const handleDeleteRestaurant = async (id) => {
    if (!window.confirm('Are you sure you want to delete this restaurant?')) return;
    try {
      const res = await api.restaurants.delete(id);
      if (res.success) {
        showMessage('Restaurant deleted successfully!');
        loadAllData();
      }
    } catch (err) {
      showMessage('Error deleting restaurant: ' + err.message, true);
    }
  };

  // --- Menu Item CRUD ---
  const openItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        restaurantId: item.restaurant?.id || '',
        name: item.name || '',
        description: item.description || '',
        price: item.price || '',
        category: item.category || 'Main Course',
        imageUrl: item.imageUrl || '',
        isVegetarian: item.isVegetarian ?? true,
        available: item.available ?? true,
      });
    } else {
      setEditingItem(null);
      setItemForm({
        restaurantId: restaurants[0]?.id || '',
        name: '',
        description: '',
        price: '',
        category: 'Main Course',
        imageUrl: '',
        isVegetarian: true,
        available: true,
      });
    }
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: itemForm.name,
        description: itemForm.description,
        price: parseFloat(itemForm.price),
        category: itemForm.category,
        imageUrl: itemForm.imageUrl,
        isVegetarian: itemForm.isVegetarian,
        available: itemForm.available,
      };

      if (editingItem) {
        const res = await api.menuItems.update(editingItem.id, payload);
        if (res.success) {
          showMessage('Menu item updated successfully!');
          setShowItemModal(false);
          loadDishesForAllRestaurants();
        }
      } else {
        const res = await api.menuItems.create(itemForm.restaurantId, payload);
        if (res.success) {
          showMessage('Menu item added successfully!');
          setShowItemModal(false);
          loadDishesForAllRestaurants();
        }
      }
    } catch (err) {
      showMessage('Error saving menu item: ' + err.message, true);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      const res = await api.menuItems.delete(id);
      if (res.success) {
        showMessage('Menu item deleted successfully!');
        loadDishesForAllRestaurants();
      }
    } catch (err) {
      showMessage('Error deleting item: ' + err.message, true);
    }
  };

  const showMessage = (msg, isError = false) => {
    setMessage({ text: msg, isError });
    setTimeout(() => setMessage(''), 4000);
  };

  const filteredDishes =
    selectedRestaurantFilter === 'ALL'
      ? menuItems
      : menuItems.filter((i) => i.restaurant?.id === parseInt(selectedRestaurantFilter));

  return (
    <div className="admin-page-container">
      {/* Top Admin Header */}
      <div className="admin-header-row">
        <div>
          <h1 className="admin-title">⚙️ Admin Control Panel</h1>
          <p className="admin-subtitle">
            Manage orders, restaurants, menus, and users for the Food Ordering Platform
          </p>
        </div>
        <button className="btn btn-outline" onClick={onClose}>
          ✕ Close Admin
        </button>
      </div>

      {message && (
        <div className={`alert-box ${message.isError ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="admin-stats-grid">
          <div className="stat-card">
            <span className="stat-icon">📦</span>
            <div className="stat-val">{stats.totalOrders}</div>
            <div className="stat-label">Total Orders</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💰</span>
            <div className="stat-val">₹{stats.totalRevenue?.toFixed(2)}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🏪</span>
            <div className="stat-val">{stats.totalRestaurants}</div>
            <div className="stat-label">Restaurants</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🍕</span>
            <div className="stat-val">{stats.totalMenuItems}</div>
            <div className="stat-label">Dishes & Items</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">👥</span>
            <div className="stat-val">{stats.totalUsers}</div>
            <div className="stat-label">Registered Users</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tab-nav">
        <button
          className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders ({orders.length})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'restaurants' ? 'active' : ''}`}
          onClick={() => setActiveTab('restaurants')}
        >
          Restaurants ({restaurants.length})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          Menu Items ({menuItems.length})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users ({users.length})
        </button>
      </div>

      {/* Tab 1: Orders */}
      {activeTab === 'orders' && (
        <div className="admin-tab-content">
          <div className="admin-content-header">
            <h2>Live Customer Orders</h2>
            <button className="btn btn-outline btn-sm" onClick={loadAllData}>
              🔄 Refresh Orders
            </button>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Customer</th>
                  <th>Restaurant</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => (
                  <tr key={ord.id}>
                    <td>
                      <code className="tracking-badge-code">{ord.orderTrackingNumber}</code>
                    </td>
                    <td>
                      <strong>{ord.customerName}</strong>
                      <br />
                      <small className="text-muted">{ord.customerPhone}</small>
                    </td>
                    <td>{ord.restaurant?.name || 'Restaurant'}</td>
                    <td>
                      <small>
                        {ord.items?.map((it) => `${it.quantity}x ${it.itemName}`).join(', ')}
                      </small>
                    </td>
                    <td>
                      <strong>₹{ord.totalAmount?.toFixed(2)}</strong>
                    </td>
                    <td>
                      <small>{ord.paymentMethod}</small>
                    </td>
                    <td>
                      <span className={`badge badge-status badge-${ord.orderStatus?.toLowerCase()}`}>
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm status-dropdown"
                        value={ord.orderStatus}
                        onChange={(e) => handleOrderStatusChange(ord.id, e.target.value)}
                      >
                        <option value="PLACED">PLACED</option>
                        <option value="PREPARING">PREPARING</option>
                        <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Restaurants */}
      {activeTab === 'restaurants' && (
        <div className="admin-tab-content">
          <div className="admin-content-header">
            <h2>Manage Restaurants</h2>
            <button
              id="add-restaurant-btn"
              className="btn btn-primary btn-sm"
              onClick={() => openRestaurantModal()}
            >
              + Add New Restaurant
            </button>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Cuisine</th>
                  <th>Rating</th>
                  <th>Delivery Time</th>
                  <th>Phone & Address</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((rest) => (
                  <tr key={rest.id}>
                    <td>#{rest.id}</td>
                    <td>
                      <strong>{rest.name}</strong>
                    </td>
                    <td>{rest.cuisineType}</td>
                    <td>⭐ {rest.rating}</td>
                    <td>{rest.deliveryTimeMinutes} mins</td>
                    <td>
                      <small>
                        {rest.phone} • {rest.address}
                      </small>
                    </td>
                    <td>
                      <span className={`badge ${rest.active ? 'badge-veg' : 'badge-nonveg'}`}>
                        {rest.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => openRestaurantModal(rest)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteRestaurant(rest.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Menu Items */}
      {activeTab === 'menu' && (
        <div className="admin-tab-content">
          <div className="admin-content-header">
            <div className="menu-filter-select-group">
              <h2>Menu Items</h2>
              <select
                className="form-select"
                style={{ width: '250px' }}
                value={selectedRestaurantFilter}
                onChange={(e) => setSelectedRestaurantFilter(e.target.value)}
              >
                <option value="ALL">All Restaurants</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              id="add-dish-btn"
              className="btn btn-primary btn-sm"
              onClick={() => openItemModal()}
            >
              + Add New Dish
            </button>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Dish Name</th>
                  <th>Restaurant</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Diet</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDishes.map((dish) => (
                  <tr key={dish.id}>
                    <td>
                      <img
                        src={dish.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80'}
                        alt={dish.name}
                        className="table-dish-thumbnail"
                      />
                    </td>
                    <td>
                      <strong>{dish.name}</strong>
                      <br />
                      <small className="text-muted">{dish.description?.substring(0, 50)}...</small>
                    </td>
                    <td>{dish.restaurant?.name || 'Restaurant'}</td>
                    <td>{dish.category}</td>
                    <td>
                      <strong>₹{dish.price?.toFixed(2)}</strong>
                    </td>
                    <td>
                      <span className={`badge ${dish.isVegetarian ? 'badge-veg' : 'badge-nonveg'}`}>
                        {dish.isVegetarian ? '🌱 Veg' : '🍗 Non-Veg'}
                      </span>
                    </td>
                    <td>{dish.available ? '✅ Yes' : '❌ Out of stock'}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => openItemModal(dish)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteItem(dish.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Users */}
      {activeTab === 'users' && (
        <div className="admin-tab-content">
          <div className="admin-content-header">
            <h2>Registered Users</h2>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td>
                      <strong>{u.fullName}</strong>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span
                        className={`badge ${u.role === 'ROLE_ADMIN' ? 'badge-preparing' : 'badge-placed'}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <small>{u.address || '—'}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Restaurant */}
      {showRestaurantModal && (
        <div className="modal-overlay" onClick={() => setShowRestaurantModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
              </h3>
              <button className="modal-close" onClick={() => setShowRestaurantModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveRestaurant}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Restaurant Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={restaurantForm.name}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cuisine Types</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. North Indian, Biryani, Mughlai"
                    value={restaurantForm.cuisineType}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, cuisineType: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    value={restaurantForm.description}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={restaurantForm.address}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, address: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={restaurantForm.phone}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://images.unsplash.com/..."
                    value={restaurantForm.imageUrl}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, imageUrl: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Rating (1.0 - 5.0)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      className="form-input"
                      value={restaurantForm.rating}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, rating: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Delivery Time (mins)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={restaurantForm.deliveryTimeMinutes}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, deliveryTimeMinutes: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowRestaurantModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRestaurant ? 'Save Changes' : 'Create Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Menu Item */}
      {showItemModal && (
        <div className="modal-overlay" onClick={() => setShowItemModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingItem ? 'Edit Dish' : 'Add New Dish'}</h3>
              <button className="modal-close" onClick={() => setShowItemModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveItem}>
              <div className="modal-body">
                {!editingItem && (
                  <div className="form-group">
                    <label className="form-label">Select Restaurant</label>
                    <select
                      className="form-select"
                      value={itemForm.restaurantId}
                      onChange={(e) => setItemForm({ ...itemForm, restaurantId: e.target.value })}
                      required
                    >
                      {restaurants.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Dish Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Starters, Main Course, Biryani, Pizza, Dessert"
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    className="form-input"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://images.unsplash.com/..."
                    value={itemForm.imageUrl}
                    onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={itemForm.isVegetarian}
                      onChange={(e) => setItemForm({ ...itemForm, isVegetarian: e.target.checked })}
                    />
                    <span>🌱 Pure Vegetarian</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={itemForm.available}
                      onChange={(e) => setItemForm({ ...itemForm, available: e.target.checked })}
                    />
                    <span>Available in Kitchen</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowItemModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Save Changes' : 'Add Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
