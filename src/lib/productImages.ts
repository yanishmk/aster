const REAL_PRODUCT_IMAGE_IDS = new Set([
  "amazon_cerave_foaming_cleanser",
  "amazon_cerave_hydrating_cleanser",
  "amazon_cerave_resurfacing_retinol",
  "amazon_cosrx_snail_mucin",
  "amazon_differin_gel",
  "amazon_elta_md_uv_clear",
  "amazon_lrp_toleriane_double_repair",
  "amazon_mighty_patch_original",
  "amazon_neutrogena_hydro_boost",
  "amazon_vanicream_daily",
]);

export function normalizeProductImage(imageUrl: string) {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;

  const localPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  const localImage = localPath.match(/^\/product-images\/(.+)\.svg$/i);
  if (localImage && REAL_PRODUCT_IMAGE_IDS.has(localImage[1])) {
    return `/product-images/${localImage[1]}.jpg`;
  }

  return localPath;
}
