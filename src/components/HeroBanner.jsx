export default function HeroBanner({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
}) {
  const filterCategories = [
    { label: 'All Cuisines', value: 'ALL' },
    { label: 'Biryani & Mughlai', value: 'Biryani' },
    { label: 'Pizza & Italian', value: 'Italian' },
    { label: 'Burgers & Fast Food', value: 'Burgers' },
  ];

  return (
    <section className="hero-banner">
      <div className="container hero-content">
        <div className="hero-badge-tag">⚡ Fast 30-Min Local Delivery</div>
        <h1 className="hero-heading">
          Craving Delicious Food? <br />
          <span className="hero-highlight">Order from Top Restaurants Near You</span>
        </h1>
        <p className="hero-subtext">
          Fresh ingredients, artisanal recipes, and seamless delivery straight to your doorstep.
        </p>

        {/* Search Bar */}
        <div className="hero-search-box">
          <span className="search-icon">🔍</span>
          <input
            id="restaurant-search-input"
            type="text"
            className="hero-search-input"
            placeholder="Search restaurants, cuisines (e.g. Biryani, Pizza, Burger)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="cuisine-filter-pills">
          {filterCategories.map((cat) => (
            <button
              key={cat.value}
              className={`filter-pill ${activeFilter === cat.value ? 'active' : ''}`}
              onClick={() => onFilterChange(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
