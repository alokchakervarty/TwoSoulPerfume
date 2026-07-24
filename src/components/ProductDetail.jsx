import { ShoppingBag, Star } from "lucide-react";
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

  return (
    <main className="detail">
      <button className="text-button" type="button" onClick={onBack}>
        Back to shop
      </button>
      <div className="detail-media">
        <img src={product.image} alt={product.name} />
      </div>
      <div className="detail-copy">
        <p>{product.brandName || "TwoSoul"}</p>
        <h1>{product.name}</h1>
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
        <button className="primary" type="button" onClick={() => onAdd(product)}>
          <ShoppingBag size={19} /> Add to Cart
        </button>
      </div>
    </main>
  );
}
