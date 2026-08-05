import { Search, ShoppingBag, Sparkles, Star } from "lucide-react";
import { categoriesFallback, fallbackImage } from "../constants";
import { currency } from "../utils/format";

export default function Storefront({
  products,
  categories,
  filters,
  loading,
  error,
  onFilter,
  onAdd,
  onProduct,
}) {
  const displayCategories = categories.length
    ? categories
    : categoriesFallback.map((name) => ({ name }));

  const highlights = [
    { label: "Scent Longevity", value: "12+ Hours" },
    { label: "Curated Bottles", value: "Premium Grade" },
    { label: "Trusted Delivery", value: "Pan-India" },
  ];

  return (
    <main>
      {/* <section className="hero reveal">
        <img src="/images/brand/hero-desktop.png" alt="Luxury perfume bottles" />
        <div className="hero-copy">
          <h1>TwoSoul Perfumes</h1>
          <span>Signature scents for elevated gifting and long-lasting daily wear.</span>
        </div>
      </section> */}
      <section className="hero reveal">
  <picture>
    <source
      media="(max-width: 768px)"
      srcSet="/images/brand/hero-mobile.png"
    />

    <img
      src="/images/brand/hero-desktop.png"
      alt="Luxury perfume bottles"
    />
  </picture>
</section>

      {/* <section className="story-band reveal" aria-label="Brand highlights">
        {highlights.map((item) => (
          <article key={item.label} className="story-tile">
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section> */}

      <section className="category-strip reveal" aria-label="Featured categories">
        {displayCategories.slice(0, 8).map((category) => (
          <button
            key={category.id || category.name}
            type="button"
            onClick={() => onFilter({ ...filters, CategoryId: category.id || "" })}
          >
            <Sparkles size={16} />
            {category.name}
          </button>
        ))}
      </section>

      <section className="toolbar reveal" id="products">
        <div>
          <h2>Bestsellers</h2>
          <p>{products.length} signature scents ready to shop</p>
        </div>
        <label className="search">
          <Search size={18} />
          <input
            value={filters.Search}
            placeholder="Search perfumes"
            onChange={(event) => onFilter({ ...filters, Search: event.target.value })}
          />
        </label>
      </section>

      {error && <div className="state">API error: {error}</div>}
      {loading && (
        <div className="grid skeleton-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="skeleton" key={index} />
          ))}
        </div>
      )}
      {!loading && !products.length && <div className="state">No products found.</div>}

      <section className="grid reveal">
        {products.map((product, index) => (
          <article className="product-card" style={{ "--delay": `${index * 60}ms` }} key={product.id}>
            <a
              className="image-button"
              href={`#/product/${product.id}`}
              onClick={(event) => {
                event.preventDefault();
                onProduct(product);
              }}
              aria-label={`View ${product.name}`}
            >
              <img src={product.image} alt={product.name} />
              {product.mrp > product.price && (
                <span>
                  {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                </span>
              )}
            </a>
            <div className="product-info">
              <p>{product.categoryName || "Perfume"}</p>
              <a
                className="product-title-link"
                href={`#/product/${product.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  onProduct(product);
                }}
              >
                <h3>{product.name}</h3>
              </a>
              <div className="rating">
                <Star size={15} fill="currentColor" /> {product.averageRating || "4.7"} | (
                {product.reviewCount || 0})
              </div>
              <div className="price-row">
                <strong>{currency(product.price)}</strong>
                {product.mrp > product.price && <del>{currency(product.mrp)}</del>}
              </div>
              <button className="primary full" type="button" onClick={() => onAdd(product)}>
                <ShoppingBag size={18} /> Add to Cart
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
