const REAL_PRODUCT_IMAGES = new Map([
  ["amazon_avene_cicalfate", ".webp"],
  ["amazon_cerave_acne_control_gel", ".webp"],
  ["amazon_cerave_foaming_cleanser", ".jpg"],
  ["amazon_cerave_hydrating_cleanser", ".jpg"],
  ["amazon_cerave_resurfacing_retinol", ".jpg"],
  ["amazon_cetaphil_redness_relief", ".webp"],
  ["amazon_cosrx_snail_mucin", ".jpg"],
  ["amazon_differin_gel", ".jpg"],
  ["amazon_elta_md_uv_clear", ".jpg"],
  ["amazon_good_molecules_discoloration", ".webp"],
  ["amazon_lrp_effaclar_duo", ".webp"],
  ["amazon_lrp_toleriane_double_repair", ".jpg"],
  ["amazon_mighty_patch_original", ".jpg"],
  ["amazon_neutrogena_hydro_boost", ".jpg"],
  ["amazon_stridex_red_box", ".webp"],
  ["amazon_timeless_vitamin_c", ".webp"],
  ["amazon_vanicream_daily", ".jpg"],
]);

export function normalizeProductImage(imageUrl: string) {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;

  const localPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  const localImage = localPath.match(/^\/product-images\/(.+)\.svg$/i);
  const realExtension = localImage ? REAL_PRODUCT_IMAGES.get(localImage[1]) : "";
  if (localImage && realExtension) {
    return `/product-images/${localImage[1]}${realExtension}`;
  }

  return localPath;
}
