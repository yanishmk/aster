import csv
from pathlib import Path
from urllib.parse import quote_plus


ROOT = Path(__file__).resolve().parents[1]
IMAGE_OUTPUT_DIR = ROOT / "public" / "product-images"
OUTPUTS = [
    ROOT / "backend" / "data" / "products.csv",
    ROOT.parent / "product_recommender" / "products.csv",
]

FIELDS = [
    "product_id",
    "name",
    "brand",
    "category",
    "subcategory",
    "retailer",
    "affiliate_network",
    "price",
    "currency",
    "price_tier",
    "rating",
    "review_count",
    "targets",
    "active_ingredients",
    "skin_types",
    "avoid_if",
    "usage_time",
    "frequency",
    "priority",
    "in_stock",
    "country",
    "image_url",
    "product_url",
    "affiliate_url",
    "why",
]

DIRECT_PRODUCT_URLS = {
    # Keep direct links only when the product detail page is known.
    # Products without a verified URL fall back to a retailer search page.
    "amazon_cerave_hydrating_cleanser": "https://www.amazon.com/dp/B01MSSDEPK",
    "amazon_cerave_foaming_cleanser": "https://www.amazon.com/dp/B01N1LL62W",
    "amazon_lrp_toleriane_double_repair": "https://www.amazon.com/dp/B01N9SPQHQ",
    "amazon_neutrogena_hydro_boost": "https://www.amazon.com/dp/B00NR1YQHM",
    "amazon_elta_md_uv_clear": "https://www.amazon.com/dp/B002MSN3QQ",
    "amazon_cerave_resurfacing_retinol": "https://www.amazon.com/dp/B09NM9TFF2",
    "amazon_differin_gel": "https://www.amazon.com/dp/B07L1PHSY9",
    "amazon_mighty_patch_original": "https://www.amazon.com/dp/B074PVTPBW",
    "amazon_cosrx_snail_mucin": "https://www.amazon.com/dp/B00PBX3L7K",
    "amazon_vanicream_daily": "https://www.amazon.com/dp/B08BW46XXK",
}

CATEGORY_COLORS = {
    "balm": ("#fbe7ef", "#c43f72"),
    "cleanser": ("#e7f4ff", "#2772a8"),
    "exfoliant": ("#fff2cf", "#b46b00"),
    "moisturizer": ("#eef6df", "#5d8a28"),
    "retinoid": ("#efe8ff", "#7b3fc9"),
    "serum": ("#ffe8f3", "#c02568"),
    "sunscreen": ("#fff4df", "#c5761c"),
    "treatment": ("#f5e9ff", "#9b3eb5"),
}

PRODUCTS = [
    ("amazon_cerave_hydrating_cleanser", "CeraVe Hydrating Facial Cleanser", "CeraVe", "cleanser", "gentle_cleanser", "Amazon", "15.99", "$", "barrier;redness", "ceramides;hyaluronic acid", "normal;dry;sensitive", "", "morning/evening", "daily", 82, "Gentle cleanser for maintaining the skin barrier."),
    ("amazon_cerave_foaming_cleanser", "CeraVe Foaming Facial Cleanser", "CeraVe", "cleanser", "foaming_cleanser", "Amazon", "16.99", "$", "acne;pores;blackheads;barrier", "ceramides;niacinamide", "normal;oily;combination", "very_dry", "morning/evening", "daily", 80, "Simple cleanser for oily or combination skin when pores or blemishes are present."),
    ("sephora_yttp_superfood_cleanser", "Youth To The People Superfood Cleanser", "Youth To The People", "cleanser", "gel_cleanser", "Sephora", "39.00", "$$", "pores;blackheads;barrier", "green tea;spinach;vitamins", "normal;oily;combination", "very_dry", "morning/evening", "daily", 76, "Fresh gel cleanser for skin that needs a clean but not stripped feel."),
    ("amazon_lrp_toleriane_double_repair", "La Roche-Posay Toleriane Double Repair Face Moisturizer", "La Roche-Posay", "moisturizer", "face_moisturizer", "Amazon", "23.99", "$", "barrier;redness;wrinkles", "ceramide-3;niacinamide;glycerin", "all;sensitive", "", "morning/evening", "daily", 88, "Barrier-support moisturizer with niacinamide and ceramides."),
    ("amazon_neutrogena_hydro_boost", "Neutrogena Hydro Boost Water Gel", "Neutrogena", "moisturizer", "gel_moisturizer", "Amazon", "21.99", "$", "barrier;wrinkles;pores", "hyaluronic acid;glycerin", "normal;oily;combination", "fragrance_sensitivity", "morning/evening", "daily", 78, "Light hydration that works well when texture or pores are a concern."),
    ("sephora_belif_aqua_bomb", "belif The True Cream Aqua Bomb", "belif", "moisturizer", "gel_cream", "Sephora", "38.00", "$$", "barrier;wrinkles", "glycerin;squalane", "normal;combination;oily", "fragrance_sensitivity", "morning/evening", "daily", 74, "Lightweight moisturizer for hydration without a heavy finish."),
    ("sephora_tatcha_dewy_skin", "Tatcha The Dewy Skin Cream", "Tatcha", "moisturizer", "rich_cream", "Sephora", "72.00", "$$$", "barrier;wrinkles;redness", "squalane;hyaluronic acid", "normal;dry", "fragrance_sensitivity;oily", "evening", "daily", 68, "Richer comfort option for dry-looking skin and early aging appearance."),
    ("amazon_lrp_anthelios_spf60", "La Roche-Posay Anthelios Melt-In Milk Sunscreen SPF 60", "La Roche-Posay", "sunscreen", "face_body_spf", "Amazon", "36.99", "$$", "pigmentation;redness;wrinkles;barrier", "spf;antioxidants", "all;sensitive", "", "morning", "daily", 100, "Daily sunscreen is essential when pigmentation or aging signs are detected."),
    ("amazon_elta_md_uv_clear", "EltaMD UV Clear Broad-Spectrum SPF 46", "EltaMD", "sunscreen", "face_spf", "Amazon", "43.00", "$$", "pigmentation;redness;acne;barrier", "spf;niacinamide", "sensitive;acne_prone;all", "", "morning", "daily", 98, "A strong SPF pick when redness or blemish-prone skin is part of the profile."),
    ("sephora_supergoop_unseen_spf40", "Supergoop! Unseen Sunscreen SPF 40", "Supergoop!", "sunscreen", "face_spf", "Sephora", "38.00", "$$", "pigmentation;wrinkles;barrier", "spf", "all", "", "morning", "daily", 96, "Invisible daily SPF option for tone protection and photoaging prevention."),
    ("sephora_innisfree_daily_uv", "innisfree Daily UV Defense Sunscreen SPF 36", "innisfree", "sunscreen", "face_spf", "Sephora", "18.00", "$", "pigmentation;wrinkles;barrier", "spf;green tea", "all", "fragrance_sensitivity", "morning", "daily", 86, "Affordable daily sunscreen option for tone and aging-prevention routines."),
    ("sephora_paulas_choice_bha2", "Paula's Choice Skin Perfecting 2% BHA Liquid Exfoliant", "Paula's Choice", "exfoliant", "bha", "Sephora", "35.00", "$$", "blackheads;pores;acne;texture", "salicylic acid;green tea", "oily;combination;normal", "pregnancy;aspirin_allergy;very_sensitive", "evening", "2-3x_week", 98, "BHA is useful when pores blackheads or acne signals are high."),
    ("amazon_stridex_red_box", "Stridex Maximum Strength Acne Pads", "Stridex", "exfoliant", "bha_pads", "Amazon", "7.99", "$", "blackheads;pores;acne", "salicylic acid", "oily;acne_prone", "pregnancy;aspirin_allergy;very_sensitive;dry", "evening", "2-3x_week", 70, "Budget BHA option for blackheads and pore-focused routines."),
    ("sephora_dennis_gross_peel", "Dr. Dennis Gross Alpha Beta Universal Daily Peel", "Dr. Dennis Gross", "exfoliant", "aha_bha_peel", "Sephora", "92.00", "$$$", "pores;blackheads;pigmentation;wrinkles", "glycolic acid;salicylic acid;lactic acid", "normal;oily;combination", "very_sensitive;pregnancy", "evening", "1-2x_week", 82, "Higher-end exfoliating peel for texture tone pores and visible aging signs."),
    ("amazon_cerave_acne_control_gel", "CeraVe Acne Control Gel", "CeraVe", "treatment", "acne_treatment", "Amazon", "19.99", "$", "acne;pores;blackheads", "salicylic acid;glycolic acid;lactic acid;niacinamide;ceramides", "oily;acne_prone", "pregnancy;aspirin_allergy;very_sensitive", "evening", "2-3x_week", 92, "Acne-focused option with salicylic acid and barrier-supporting ingredients."),
    ("amazon_differin_gel", "Differin Acne Treatment Gel", "Differin", "treatment", "adapalene", "Amazon", "18.99", "$", "acne;blackheads;pores;texture", "adapalene", "acne_prone;oily;combination", "pregnancy;breastfeeding;very_sensitive", "evening", "2-3x_week", 88, "Adapalene option for blemishes blackheads and rough texture appearance."),
    ("amazon_lrp_effaclar_duo", "La Roche-Posay Effaclar Duo Acne Spot Treatment", "La Roche-Posay", "treatment", "benzoyl_peroxide", "Amazon", "31.99", "$$", "acne", "benzoyl peroxide;lha", "acne_prone;oily", "benzoyl_peroxide_sensitivity;very_sensitive", "evening", "spot_use", 74, "Targeted blemish support when acne is the strongest signal."),
    ("sephora_ordinary_azelaic10", "The Ordinary Azelaic Acid Suspension 10%", "The Ordinary", "treatment", "azelaic_acid", "Sephora", "13.00", "$", "pigmentation;redness;acne", "azelaic acid", "all", "very_sensitive", "evening", "daily_or_alternate", 94, "Targets uneven tone texture redness appearance and blemish-prone skin."),
    ("sephora_ordinary_niacinamide10", "The Ordinary Niacinamide 10% + Zinc 1%", "The Ordinary", "serum", "niacinamide", "Sephora", "6.00", "$", "pores;blackheads;acne;redness;barrier", "niacinamide;zinc pca", "all", "niacinamide_sensitivity", "morning/evening", "daily", 88, "Supports brightness texture oil control and the appearance of pores."),
    ("amazon_good_molecules_discoloration", "Good Molecules Discoloration Correcting Serum", "Good Molecules", "serum", "tone_serum", "Amazon", "12.00", "$", "pigmentation;redness", "tranexamic acid;niacinamide", "all", "niacinamide_sensitivity", "morning/evening", "daily", 86, "Affordable tone support for visible dark spots and uneven complexion."),
    ("sephora_topicals_faded", "Topicals Faded Serum for Dark Spots", "Topicals", "serum", "tone_serum", "Sephora", "38.00", "$$", "pigmentation;acne_marks", "tranexamic acid;azelaic acid;niacinamide", "all", "very_sensitive", "evening", "daily_or_alternate", 90, "Tone-focused serum when pigmentation is a main Aster concern."),
    ("sephora_drunk_elephant_cfirma", "Drunk Elephant C-Firma Fresh Day Serum", "Drunk Elephant", "serum", "vitamin_c", "Sephora", "79.00", "$$$", "pigmentation;wrinkles;dullness", "vitamin c;ferulic acid;vitamin e", "normal;dry;combination", "very_sensitive", "morning", "daily", 78, "Vitamin C option for brightness and uneven tone appearance."),
    ("amazon_timeless_vitamin_c", "Timeless 20% Vitamin C + E Ferulic Acid Serum", "Timeless Skin Care", "serum", "vitamin_c", "Amazon", "27.00", "$$", "pigmentation;wrinkles;dullness", "vitamin c;ferulic acid;vitamin e", "normal;oily;combination", "very_sensitive", "morning", "daily", 82, "Vitamin C option for tone and early aging appearance."),
    ("sephora_inkey_list_hyaluronic", "The INKEY List Hyaluronic Acid Serum", "The INKEY List", "serum", "hydration_serum", "Sephora", "10.00", "$", "barrier;wrinkles;redness", "hyaluronic acid", "all", "", "morning/evening", "daily", 72, "Simple hydration layer to keep routines comfortable."),
    ("amazon_cerave_resurfacing_retinol", "CeraVe Resurfacing Retinol Serum", "CeraVe", "retinoid", "retinol_serum", "Amazon", "23.99", "$", "pigmentation;pores;wrinkles;acne_marks", "retinol;niacinamide;ceramides;licorice root", "normal;oily;combination", "pregnancy;breastfeeding;very_sensitive", "evening", "2-3x_week", 90, "Retinol option for post-acne marks pores texture and early aging appearance."),
    ("sephora_ordinary_granactive_retinoid", "The Ordinary Granactive Retinoid 2% Emulsion", "The Ordinary", "retinoid", "retinoid_serum", "Sephora", "12.00", "$", "wrinkles;pigmentation;texture", "granactive retinoid", "normal;dry;combination", "pregnancy;breastfeeding;very_sensitive", "evening", "2-3x_week", 84, "Entry retinoid for visible aging texture and tone support."),
    ("sephora_shani_darden_retinol", "Shani Darden Retinol Reform Treatment Serum", "Shani Darden", "retinoid", "retinol_serum", "Sephora", "88.00", "$$$", "wrinkles;pigmentation;pores", "retinol;lactic acid", "normal;oily;combination", "pregnancy;breastfeeding;very_sensitive", "evening", "2-3x_week", 76, "Premium retinol option for wrinkles tone and skin texture."),
    ("amazon_cetaphil_redness_relief", "Cetaphil Redness Relieving Night Moisturizer", "Cetaphil", "balm", "redness_moisturizer", "Amazon", "18.99", "$", "redness;barrier", "licorice extract;allantoin;glycerin", "sensitive;dry;normal", "oily", "evening", "daily", 82, "Comforting moisturizer when redness and sensitivity are visible."),
    ("sephora_tower28_sos", "Tower 28 SOS Daily Rescue Facial Spray", "Tower 28", "balm", "calming_spray", "Sephora", "28.00", "$$", "redness;barrier;acne", "hypochlorous acid", "all;sensitive", "", "morning/evening", "daily", 78, "Calming support for redness-prone or blemish-prone skin."),
    ("amazon_avene_cicalfate", "Avene Cicalfate+ Restorative Protective Cream", "Avene", "balm", "barrier_balm", "Amazon", "42.00", "$$", "redness;barrier", "sucralfate;copper-zinc complex", "dry;sensitive;normal", "oily;acne_prone", "evening", "as_needed", 76, "Barrier rescue option when skin looks irritated or over-exfoliated."),
    ("amazon_mighty_patch_original", "Hero Cosmetics Mighty Patch Original", "Hero Cosmetics", "treatment", "pimple_patch", "Amazon", "12.99", "$", "acne", "hydrocolloid", "all", "", "evening", "spot_use", 72, "Simple spot patch for visible blemishes without adding more actives."),
    ("sephora_peace_out_pores", "Peace Out Pores", "Peace Out", "treatment", "pore_strips", "Sephora", "19.00", "$", "pores;blackheads", "hydrocolloid;retinol", "normal;oily;combination", "very_sensitive;pregnancy", "evening", "weekly", 68, "Occasional targeted support for visible pores and blackheads."),
    ("amazon_cosrx_snail_mucin", "COSRX Advanced Snail 96 Mucin Power Essence", "COSRX", "serum", "hydration_essence", "Amazon", "25.00", "$$", "barrier;redness;wrinkles", "snail mucin;hyaluronic acid", "all", "snail_allergy", "morning/evening", "daily", 74, "Hydrating essence to support comfort and skin barrier appearance."),
    ("sephora_skinfix_barrier", "Skinfix Barrier+ Triple Lipid-Peptide Cream", "Skinfix", "moisturizer", "barrier_cream", "Sephora", "54.00", "$$$", "barrier;redness;wrinkles", "lipids;peptides;glycerin", "dry;sensitive;normal", "oily", "morning/evening", "daily", 80, "Barrier-focused moisturizer for redness and dry-looking aging signs."),
    ("amazon_vanicream_daily", "Vanicream Daily Facial Moisturizer", "Vanicream", "moisturizer", "sensitive_moisturizer", "Amazon", "14.99", "$", "barrier;redness", "ceramides;hyaluronic acid;squalane", "all;sensitive", "", "morning/evening", "daily", 84, "Low-fragrance barrier moisturizer for simple sensitive-skin routines."),
    ("sephora_farmacy_honey_halo", "Farmacy Honey Halo Moisturizer", "Farmacy", "moisturizer", "rich_cream", "Sephora", "48.00", "$$", "barrier;wrinkles;redness", "ceramides;honey;glycerin", "normal;dry;combination", "honey_allergy;oily", "evening", "daily", 72, "Richer moisturizer when hydration and comfort are the focus."),
]


def amazon_search(product_name: str) -> str:
    return f"https://www.amazon.com/s?k={quote_plus(product_name)}"


def sephora_search(product_name: str) -> str:
    return f"https://www.sephora.com/search?keyword={quote_plus(product_name)}"


def placeholder(category: str, brand: str) -> str:
    label = quote_plus(f"{brand} {category}")
    return f"https://placehold.co/640x760/fdf2f8/b83263?text={label}"


def product_image_path(product_id: str) -> Path:
    return IMAGE_OUTPUT_DIR / f"{product_id}.svg"


def product_image_url(product_id: str) -> str:
    return f"/product-images/{product_id}.svg"


def escape_svg(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def write_product_image(product_id: str, name: str, brand: str, category: str) -> None:
    bg, accent = CATEGORY_COLORS.get(category, ("#fff0f7", "#f0277b"))
    brand_text = escape_svg(brand)
    name_text = escape_svg(name[:42])
    category_text = escape_svg(category.upper())
    initials = "".join(word[0] for word in brand.split()[:2]).upper()

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="640" height="760" viewBox="0 0 640 760" role="img" aria-label="{brand_text} {name_text}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="52%" stop-color="{bg}"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
    <linearGradient id="pack" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="{bg}"/>
    </linearGradient>
    <filter id="shadow" color-interpolation-filters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#7c2d4a" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="640" height="760" rx="48" fill="url(#bg)"/>
  <circle cx="520" cy="118" r="92" fill="{accent}" opacity="0.09"/>
  <circle cx="118" cy="622" r="120" fill="{accent}" opacity="0.07"/>
  <g filter="url(#shadow)">
    <rect x="190" y="130" width="260" height="500" rx="34" fill="url(#pack)" stroke="{accent}" stroke-opacity="0.24" stroke-width="3"/>
    <rect x="230" y="96" width="180" height="70" rx="26" fill="#ffffff" stroke="{accent}" stroke-opacity="0.22" stroke-width="3"/>
    <circle cx="320" cy="250" r="76" fill="{accent}" opacity="0.13"/>
    <text x="320" y="272" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="800" fill="{accent}">{escape_svg(initials)}</text>
    <rect x="230" y="345" width="180" height="3" rx="2" fill="{accent}" opacity="0.28"/>
    <text x="320" y="395" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="800" fill="#15080e">{brand_text}</text>
    <text x="320" y="434" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="600" fill="#6b4558">{name_text}</text>
    <rect x="242" y="505" width="156" height="42" rx="21" fill="{accent}" opacity="0.12"/>
    <text x="320" y="532" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="800" fill="{accent}">{category_text}</text>
  </g>
</svg>
"""
    product_image_path(product_id).write_text(svg, encoding="utf-8")


def product_url(product_id: str, retailer: str, name: str) -> str:
    direct_url = DIRECT_PRODUCT_URLS.get(product_id)
    if direct_url:
        return direct_url

    if retailer == "Amazon":
        return amazon_search(name)
    return sephora_search(name)


def affiliate_network(retailer: str) -> str:
    if retailer == "Amazon":
        return "Amazon Associates"
    return "Sephora Rakuten or Skimlinks"


def row_from_product(item: tuple) -> dict:
    (
        product_id,
        name,
        brand,
        category,
        subcategory,
        retailer,
        price,
        price_tier,
        targets,
        active_ingredients,
        skin_types,
        avoid_if,
        usage_time,
        frequency,
        priority,
        why,
    ) = item

    return {
        "product_id": product_id,
        "name": name,
        "brand": brand,
        "category": category,
        "subcategory": subcategory,
        "retailer": retailer,
        "affiliate_network": affiliate_network(retailer),
        "price": price,
        "currency": "USD",
        "price_tier": price_tier,
        "rating": "",
        "review_count": "",
        "targets": targets,
        "active_ingredients": active_ingredients,
        "skin_types": skin_types,
        "avoid_if": avoid_if,
        "usage_time": usage_time,
        "frequency": frequency,
        "priority": str(priority),
        "in_stock": "unknown",
        "country": "US",
        "image_url": product_image_url(product_id),
        "product_url": product_url(product_id, retailer, name),
        "affiliate_url": "",
        "why": why,
    }


IMAGE_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

for product in PRODUCTS:
    write_product_image(product[0], product[1], product[2], product[3])

rows = [row_from_product(product) for product in PRODUCTS]

for output in OUTPUTS:
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    print(output)
