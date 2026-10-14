export default function RestaurantCard({ restaurant, onSelect }) {
  return (
    <div
      className="restaurant-card"
      id={`restaurant-card-${restaurant.id}`}
      onClick={() => onSelect(restaurant)}
    >
      <div className="restaurant-image-wrapper">
        <img
          src={restaurant.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'}
          alt={restaurant.name}
          className="restaurant-card-img"
          loading="lazy"
        />
        <div className="restaurant-rating-tag">
          ⭐ {restaurant.rating ? restaurant.rating.toFixed(1) : '4.5'}
        </div>
        <div className="restaurant-time-tag">
          ⏱️ {restaurant.deliveryTimeMinutes || 30} mins
        </div>
      </div>

      <div className="restaurant-card-body">
        <h3 className="restaurant-card-title">{restaurant.name}</h3>
        <p className="restaurant-card-cuisine">{restaurant.cuisineType}</p>
        <p className="restaurant-card-desc">{restaurant.description}</p>

        <div className="restaurant-card-footer">
          <span className="restaurant-card-address">
            📍 {restaurant.address}
          </span>
          <button className="btn btn-primary btn-sm view-menu-btn">
            View Menu →
          </button>
        </div>
      </div>
    </div>
  );
}
