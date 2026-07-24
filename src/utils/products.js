import { validImage } from "./format";

export function normalizeProduct(product) {
  const variant =
    product.variants?.find((item) => item.isActive) || product.variants?.[0];

  return {
    ...product,
    image: validImage(product.imageUrls?.[0] || variant?.imageUrl),
    variantId: variant?.id,
    price: variant?.price || product.basePrice,
    mrp: variant?.compareAtPrice || product.compareAtPrice,
  };
}
