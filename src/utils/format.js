import { fallbackImage } from "../constants";

export function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function validImage1(url) {
  return url && /^https?:\/\//i.test(url) ? url : fallbackImage;
}

export function validImage(url) {
  if (!url) return fallbackImage;

  // External image
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // Local image in public folder
  if (url.startsWith("/")) {
    return url;
  }

  return fallbackImage;
}