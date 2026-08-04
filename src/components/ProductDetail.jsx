import { ShieldCheck, ShoppingBag, Sparkles, Star, Truck } from "lucide-react";
import { currency } from "../utils/format";

export default function ProductDetail({ product, onBack, onAdd }) {
  if (!product) {
    return (
      <main className="state">
        Product not found.{" "}
        <button type="button" onClick={onBack}>
          Back to shop
        </button>
      </main>
    );
  }

  const highlights = [
    { icon: Sparkles, text: "Premium signature blend" },
    { icon: Truck, text: "Fast dispatch across India" },
    { icon: ShieldCheck, text: "Secure checkout and tracking" },
  ];

  return (
    <main className="detail reveal">
      <button className="text-button" type="button" onClick={onBack}>
        Back to shop
      </button>
      <div className="detail-media">
        <img src={product.image} alt={product.name} />
      </div>
      <div className="detail-copy">
        <p>{product.brandName || "TwoSoul"}</p>
        <h1>{product.name}</h1>
        <div className="detail-chips">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <span key={item.text} className="detail-chip">
                <Icon size={14} /> {item.text}
              </span>
            );
          })}
        </div>
        <div className="rating">
          <Star size={16} fill="currentColor" /> {product.averageRating || "4.7"} rating
        </div>
        <p>
          {product.description ||
            product.shortDescription ||
            "A refined perfume crafted for memorable everyday wear."}
        </p>
        <div className="price-row large">
          <strong>{currency(product.price)}</strong>
          {product.mrp > product.price && <del>{currency(product.mrp)}</del>}
        </div>
        <div className="detail-actions">
          <button className="primary" type="button" onClick={() => onAdd(product)}>
            <ShoppingBag size={19} /> Add to Cart
          </button>
          <span className="detail-note">Best worn daily and layered for evenings.</span>
        </div>
      </div>
    </main>
  );
}
