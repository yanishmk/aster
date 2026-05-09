import { writeFile } from "node:fs/promises";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCT_CSV = join(ROOT, "backend", "data", "products.csv");
const RECOMMENDER_CSV = join(ROOT, "..", "product_recommender", "products.csv");
const IMAGE_DIR = join(ROOT, "public", "product-images");
const RAINFOREST_ENDPOINT = "https://api.rainforestapi.com/request";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const IMAGE_EXTENSIONS = new Map([
  ["image/jpeg", ".jpg"],
  ["image/jpg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

const FIELDS = [
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
];

const SEARCH_GROUPS = [
  group("cleanser", "gentle_cleanser", "barrier;redness", "ceramides;hyaluronic acid;glycerin", "normal;dry;sensitive", "", "morning/evening", "daily", 82, [
    "CeraVe cleanser",
    "La Roche Posay cleanser",
    "Vanicream cleanser",
    "Cetaphil gentle cleanser",
    "Aveeno face cleanser",
    "Neutrogena face cleanser",
  ]),
  group("cleanser", "foaming_cleanser", "acne;pores;blackheads;barrier", "ceramides;niacinamide;salicylic acid", "normal;oily;combination", "very_dry", "morning/evening", "daily", 78, [
    "foaming facial cleanser oily skin",
    "salicylic acid cleanser face",
    "acne cleanser face",
    "gel facial cleanser oily skin",
  ]),
  group("moisturizer", "face_moisturizer", "barrier;redness;wrinkles", "ceramides;niacinamide;glycerin", "all;sensitive", "", "morning/evening", "daily", 86, [
    "face moisturizer ceramide",
    "La Roche Posay moisturizer",
    "CeraVe facial moisturizer",
    "Vanicream facial moisturizer",
    "Cetaphil face moisturizer",
    "sensitive skin face moisturizer",
  ]),
  group("moisturizer", "gel_moisturizer", "barrier;wrinkles;pores", "hyaluronic acid;glycerin", "normal;oily;combination", "fragrance_sensitivity", "morning/evening", "daily", 76, [
    "gel moisturizer face hyaluronic acid",
    "oil free face moisturizer",
    "water gel moisturizer face",
  ]),
  group("sunscreen", "face_spf", "pigmentation;redness;wrinkles;barrier", "spf;niacinamide;antioxidants", "all;sensitive", "", "morning", "daily", 98, [
    "face sunscreen SPF 50",
    "mineral face sunscreen SPF",
    "La Roche Posay sunscreen",
    "EltaMD UV Clear SPF 46",
    "CeraVe AM facial moisturizing lotion SPF",
    "Neutrogena face sunscreen",
    "Supergoop unseen sunscreen",
  ]),
  group("exfoliant", "bha", "blackheads;pores;acne;texture", "salicylic acid;green tea", "oily;combination;normal", "pregnancy;aspirin_allergy;very_sensitive", "evening", "2-3x_week", 88, [
    "BHA exfoliant salicylic acid face",
    "Paula's Choice BHA exfoliant",
    "salicylic acid pads face",
    "blackhead exfoliant face",
  ]),
  group("treatment", "acne_treatment", "acne;pores;blackheads", "salicylic acid;benzoyl peroxide;adapalene", "oily;acne_prone", "pregnancy;breastfeeding;very_sensitive", "evening", "spot_use", 88, [
    "acne treatment gel",
    "benzoyl peroxide acne treatment",
    "adapalene gel acne treatment",
    "pimple patch hydrocolloid",
    "CeraVe acne control gel",
    "Differin gel",
  ]),
  group("serum", "niacinamide", "pores;blackheads;acne;redness;barrier", "niacinamide;zinc pca", "all", "niacinamide_sensitivity", "morning/evening", "daily", 84, [
    "niacinamide serum face",
    "The Ordinary niacinamide serum",
    "Good Molecules niacinamide serum",
  ]),
  group("serum", "tone_serum", "pigmentation;redness;acne_marks", "tranexamic acid;azelaic acid;niacinamide", "all", "very_sensitive", "morning/evening", "daily_or_alternate", 86, [
    "dark spot correcting serum",
    "azelaic acid face serum",
    "tranexamic acid serum face",
    "vitamin c serum face",
    "Timeless vitamin c serum",
  ]),
  group("serum", "hydration_serum", "barrier;wrinkles;redness", "hyaluronic acid;glycerin;snail mucin", "all", "snail_allergy", "morning/evening", "daily", 74, [
    "hyaluronic acid serum face",
    "COSRX snail mucin essence",
    "hydrating serum face",
  ]),
  group("retinoid", "retinol_serum", "wrinkles;pigmentation;texture;acne_marks", "retinol;retinal;adapalene", "normal;oily;combination", "pregnancy;breastfeeding;very_sensitive", "evening", "2-3x_week", 86, [
    "retinol serum face",
    "retinal serum face",
    "CeraVe retinol serum",
    "RoC retinol serum",
    "adapalene gel",
  ]),
  group("balm", "barrier_balm", "redness;barrier", "colloidal oatmeal;ceramides;panthenol", "dry;sensitive;normal", "oily;acne_prone", "evening", "as_needed", 78, [
    "barrier repair cream face",
    "cica cream face",
    "Avene Cicalfate cream",
    "redness relief face moisturizer",
  ]),
];

const args = parseArgs(process.argv.slice(2));

async function main() {
  const apiKey = process.env.RAINFOREST_API_KEY?.trim();
  if (!apiKey) {
    console.error("Missing RAINFOREST_API_KEY environment variable.");
    process.exitCode = 2;
    return;
  }

  mkdirSync(IMAGE_DIR, { recursive: true });

  const existingRows = args.fresh ? [] : readCsv(PRODUCT_CSV).rows;
  const rowsByAsin = new Map();
  const categoryCounts = new Map();
  for (const row of existingRows) {
    const asin = getAmazonAsin(row.product_url);
    if (row.retailer === "Amazon" && asin && hasRealImage(row.image_url)) {
      rowsByAsin.set(asin, row);
      incrementCategory(categoryCounts, row.category);
    }
  }

  const failures = [];
  const tasks = interleaveSearchTasks(SEARCH_GROUPS);
  let madeProgress = true;

  while (rowsByAsin.size < args.target && madeProgress) {
    madeProgress = false;

    for (const { searchGroup, term } of tasks) {
      if (rowsByAsin.size >= args.target) break;
      if ((categoryCounts.get(searchGroup.category) ?? 0) >= args.maxPerCategory) continue;
      console.log(`[${rowsByAsin.size}/${args.target}] ${searchGroup.category}: ${term}`);

      try {
        const results = await searchRainforest(apiKey, term, args.resultsPerTerm);
        for (const result of results) {
          if (rowsByAsin.size >= args.target) break;
          if ((categoryCounts.get(searchGroup.category) ?? 0) >= args.maxPerCategory) break;
          const row = await rowFromSearchResult(result, searchGroup, rowsByAsin);
          if (row) {
            rowsByAsin.set(getAmazonAsin(row.product_url), row);
            incrementCategory(categoryCounts, row.category);
            madeProgress = true;
          }
          await sleep(args.imageDelay);
        }
      } catch (error) {
        failures.push([term, error instanceof Error ? error.message : String(error)]);
      }

      await sleep(args.searchDelay);
    }
  }

  const rows = [...rowsByAsin.values()].slice(0, args.target);
  writeCsv(PRODUCT_CSV, FIELDS, rows);
  if (args.syncRecommender && existsSync(RECOMMENDER_CSV)) {
    writeCsv(RECOMMENDER_CSV, FIELDS, rows);
  }

  console.log(`\nCatalog products: ${rows.length}`);
  if (failures.length) {
    console.log("Failed searches:");
    for (const [term, reason] of failures) console.log(`- ${term}: ${reason}`);
  }
}

function group(category, subcategory, targets, activeIngredients, skinTypes, avoidIf, usageTime, frequency, priority, terms) {
  return { activeIngredients, avoidIf, category, frequency, priority, skinTypes, subcategory, targets, terms, usageTime };
}

function parseArgs(argv) {
  const parsed = {
    fresh: false,
    imageDelay: 120,
    maxPerCategory: 18,
    resultsPerTerm: 10,
    searchDelay: 350,
    syncRecommender: false,
    target: 100,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--fresh") parsed.fresh = true;
    else if (arg === "--max-per-category") parsed.maxPerCategory = Number(argv[++index] ?? "18");
    else if (arg === "--target") parsed.target = Number(argv[++index] ?? "100");
    else if (arg === "--results-per-term") parsed.resultsPerTerm = Number(argv[++index] ?? "10");
    else if (arg === "--sync-recommender") parsed.syncRecommender = true;
  }

  return parsed;
}

function interleaveSearchTasks(searchGroups) {
  const tasks = [];
  const maxTerms = Math.max(...searchGroups.map((searchGroup) => searchGroup.terms.length));
  for (let termIndex = 0; termIndex < maxTerms; termIndex += 1) {
    for (const searchGroup of searchGroups) {
      const term = searchGroup.terms[termIndex];
      if (term) tasks.push({ searchGroup, term });
    }
  }
  return tasks;
}

function incrementCategory(categoryCounts, category) {
  categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
}

async function searchRainforest(apiKey, searchTerm, numberOfResults) {
  const params = new URLSearchParams({
    "api_key": apiKey,
    "amazon_domain": "amazon.com",
    "exclude_sponsored": "true",
    "fields": "search_results.asin,search_results.title,search_results.image,search_results.link,search_results.price,search_results.rating,search_results.ratings_total",
    "number_of_results": String(numberOfResults),
    "search_term": searchTerm,
    "type": "search",
  });
  const response = await fetch(`${RAINFOREST_ENDPOINT}?${params.toString()}`);
  if (!response.ok) throw new Error(`Rainforest ${response.status}`);

  const payload = await response.json();
  if (payload.request_info?.success === false) {
    throw new Error(payload.request_info?.message ?? "Rainforest request failed");
  }
  return payload.search_results ?? [];
}

async function rowFromSearchResult(result, metadata, rowsByAsin) {
  const asin = String(result.asin ?? "").trim().toUpperCase();
  const title = cleanTitle(result.title ?? "");
  const image = result.image ?? "";
  if (!/^[A-Z0-9]{10}$/.test(asin) || !title || !image || rowsByAsin.has(asin)) return null;
  if (isUnwantedTitle(title)) return null;

  const productId = uniqueProductId(title, asin);
  const imageUrl = await downloadImage(productId, image);
  const price = parsePrice(result.price);
  const brand = inferBrand(title);

  return {
    product_id: productId,
    name: title,
    brand,
    category: metadata.category,
    subcategory: metadata.subcategory,
    retailer: "Amazon",
    affiliate_network: "Amazon Associates",
    price: price.value,
    currency: price.currency,
    price_tier: priceTier(price.value),
    rating: result.rating ? String(result.rating) : "",
    review_count: result.ratings_total ? String(result.ratings_total) : "",
    targets: metadata.targets,
    active_ingredients: metadata.activeIngredients,
    skin_types: metadata.skinTypes,
    avoid_if: metadata.avoidIf,
    usage_time: metadata.usageTime,
    frequency: metadata.frequency,
    priority: String(metadata.priority),
    in_stock: "unknown",
    country: "US",
    image_url: imageUrl,
    product_url: `https://www.amazon.com/dp/${asin}`,
    affiliate_url: "",
    why: whyText(metadata.category, metadata.targets),
  };
}

function cleanTitle(title) {
  return String(title).replace(/\s+/g, " ").trim();
}

function isUnwantedTitle(title) {
  const lower = title.toLowerCase();
  return ["book", "kindle", "poster", "travel bag", "makeup bag"].some((token) => lower.includes(token));
}

function uniqueProductId(title, asin) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 46);
  return `amazon_${slug}_${asin.toLowerCase()}`;
}

function inferBrand(title) {
  const compactTitle = title.replace(/[,:].*$/, "");
  const knownBrand = [
    "CeraVe",
    "La Roche-Posay",
    "Vanicream",
    "Cetaphil",
    "Neutrogena",
    "Aveeno",
    "EltaMD",
    "Differin",
    "COSRX",
    "Paula's Choice",
    "The Ordinary",
    "Good Molecules",
    "Timeless",
    "RoC",
    "Avene",
    "Hero Cosmetics",
  ].find((brand) => compactTitle.toLowerCase().includes(brand.toLowerCase()));
  if (knownBrand) return knownBrand;
  return compactTitle.split(/\s+/).slice(0, 2).join(" ");
}

function parsePrice(price) {
  if (typeof price === "object" && price) {
    const value = price.value ? String(price.value) : numericPrice(price.raw ?? "");
    return { currency: price.currency ?? "USD", value };
  }
  return { currency: "USD", value: numericPrice(price ?? "") };
}

function numericPrice(value) {
  return String(value).match(/\d+(?:\.\d{1,2})?/)?.[0] ?? "";
}

function priceTier(value) {
  const amount = Number(value);
  if (!amount) return "$";
  if (amount < 20) return "$";
  if (amount < 45) return "$$";
  return "$$$";
}

function whyText(category, targets) {
  const focus = targets.split(";").slice(0, 2).join(" and ");
  return `${titleCase(category)} option selected for ${focus || "routine"} support.`;
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getAmazonAsin(productUrl) {
  return String(productUrl).match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)?.[1]?.toUpperCase() ?? "";
}

function hasRealImage(imageUrl) {
  return /\.(jpe?g|png|webp)$/i.test(imageUrl);
}

async function downloadImage(productId, imageUrl) {
  const response = await fetch(imageUrl, {
    headers: {
      Accept: "image/avif,image/webp,image/*,*/*",
      "User-Agent": USER_AGENT,
    },
  });
  if (!response.ok) throw new Error(`image ${response.status}`);

  const contentType = response.headers.get("content-type")?.split(";")[0].toLowerCase() ?? "";
  const extension = IMAGE_EXTENSIONS.get(contentType) ?? (extname(new URL(imageUrl).pathname) || ".jpg");
  if (![".jpg", ".jpeg", ".png", ".webp"].includes(extension)) throw new Error(`not an image response: ${contentType}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 2048) throw new Error("image response too small");

  const outputName = `${productId}${extension === ".jpeg" ? ".jpg" : extension}`;
  await writeFile(join(IMAGE_DIR, basename(outputName)), buffer);
  return `/product-images/${outputName}`;
}

function readCsv(path) {
  const text = readFileSync(path, "utf8");
  const rows = parseCsv(text);
  const [headerRow, ...dataRows] = rows;
  const headers = headerRow ?? [];
  return {
    headers,
    rows: dataRows.filter((row) => row.length).map((row) => Object.fromEntries(headers.map((key, index) => [key, row[index] ?? ""]))),
  };
}

function writeCsv(path, headers, rows) {
  const csv = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header] ?? "")).join(",")),
  ].join("\n");
  writeFileSync(path, `${csv}\n`, "utf8");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') inQuotes = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function escapeCsvCell(value) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function sleep(milliseconds) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, milliseconds);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
