import { writeFile } from "node:fs/promises";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCT_CSV = join(ROOT, "backend", "data", "products.csv");
const RECOMMENDER_CSV = join(ROOT, "..", "product_recommender", "products.csv");
const IMAGE_DIR = join(ROOT, "public", "product-images");
const ZENROWS_ENDPOINT = "https://api.zenrows.com/v1/";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const IMAGE_EXTENSIONS = new Map([
  ["image/jpeg", ".jpg"],
  ["image/jpg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

const args = parseArgs(process.argv.slice(2));

async function main() {
  const apiKey = process.env.ZENROWS_API_KEY?.trim();
  if (!apiKey) {
    console.error("Missing ZENROWS_API_KEY environment variable.");
    process.exitCode = 2;
    return;
  }

  const csvPath = resolve(args.csv || PRODUCT_CSV);
  const { rows, headers } = readCsv(csvPath);
  const selectedRows = selectRows(rows, args.limit, args.onlyMissing);

  if (!selectedRows.length) {
    console.log("No products to process.");
    return;
  }

  mkdirSync(IMAGE_DIR, { recursive: true });
  const changed = new Map();
  const failed = [];

  for (const [index, row] of selectedRows.entries()) {
    const productId = row.product_id;
    const sourceUrl = row.affiliate_url || row.product_url;
    if (!sourceUrl) {
      failed.push([productId, "missing product_url"]);
      continue;
    }

    console.log(`[${index + 1}/${selectedRows.length}] ${productId}`);
    try {
      const html = await fetchWithZenRows(apiKey, sourceUrl);
      const imageUrl = findProductImageUrl(html, sourceUrl);
      if (!imageUrl) {
        failed.push([productId, "no image found"]);
        continue;
      }

      const publicPath = args.dryRun ? `/product-images/${productId}${imageExtensionFromUrl(imageUrl)}` : await downloadImage(productId, imageUrl);
      row.image_url = publicPath;
      changed.set(productId, publicPath);
      console.log(`  -> ${publicPath}`);
    } catch (error) {
      failed.push([productId, error instanceof Error ? error.message : String(error)]);
    }
    await sleep(600);
  }

  if (changed.size && !args.dryRun) {
    writeCsv(csvPath, headers, rows);
    if (args.syncRecommender && existsSync(RECOMMENDER_CSV)) {
      syncCsvImageUrls(RECOMMENDER_CSV, changed);
    }
  }

  console.log(`\nUpdated: ${changed.size}`);
  if (failed.length) {
    console.log("Failed:");
    for (const [productId, reason] of failed) {
      console.log(`  - ${productId}: ${reason}`);
    }
  }
  if (args.dryRun) console.log("Dry run: no files were written.");
}

function parseArgs(argv) {
  const parsed = {
    csv: "",
    dryRun: false,
    ids: [],
    limit: 0,
    onlyMissing: false,
    syncRecommender: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--csv") parsed.csv = argv[++index] ?? "";
    else if (arg === "--dry-run") parsed.dryRun = true;
    else if (arg === "--ids") parsed.ids = (argv[++index] ?? "").split(",").map((id) => id.trim()).filter(Boolean);
    else if (arg === "--limit") parsed.limit = Number(argv[++index] ?? "0");
    else if (arg === "--only-missing") parsed.onlyMissing = true;
    else if (arg === "--sync-recommender") parsed.syncRecommender = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return parsed;
}

function printHelp() {
  console.log(`Fetch product images using ZenRows.

Usage:
  npm run fetch:product-images -- --only-missing --limit 5

Environment:
  ZENROWS_API_KEY  Required. ZenRows API key.

Options:
  --csv <path>          Product CSV to update. Defaults to backend/data/products.csv.
  --ids <a,b,c>         Process only these product IDs.
  --only-missing        Skip rows already pointing to non-SVG local images.
  --limit <n>           Limit number of products to process.
  --sync-recommender    Also update ../product_recommender/products.csv.
  --dry-run             Print changes without writing files.
`);
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

function syncCsvImageUrls(path, imageUrls) {
  const { rows, headers } = readCsv(path);
  let changed = false;
  for (const row of rows) {
    if (imageUrls.has(row.product_id)) {
      row.image_url = imageUrls.get(row.product_id);
      changed = true;
    }
  }
  if (changed) writeCsv(path, headers, rows);
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

function selectRows(rows, limit, onlyMissing) {
  const selected = [];
  const ids = new Set(args.ids);
  for (const row of rows) {
    if (ids.size && !ids.has(row.product_id)) continue;
    const imageUrl = row.image_url ?? "";
    if (onlyMissing && imageUrl && !imageUrl.endsWith(".svg") && !imageUrl.includes("placehold.co")) {
      continue;
    }
    selected.push(row);
    if (limit && selected.length >= limit) break;
  }
  return selected;
}

async function fetchWithZenRows(apiKey, targetUrl) {
  const params = new URLSearchParams({
    apikey: apiKey,
    mode: "auto",
    proxy_country: "us",
    url: targetUrl,
    wait: "2500",
  });
  const response = await fetch(`${ZENROWS_ENDPOINT}?${params.toString()}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!response.ok) throw new Error(`ZenRows ${response.status}`);
  return response.text();
}

function findProductImageUrl(html, pageUrl) {
  const landingImage = normalizeCandidates(extractAmazonLandingImages(html), pageUrl).find(isProbableProductImage);
  if (landingImage) return landingImage;

  const candidates = [
    ...extractSearchResultImages(html),
    ...extractJsonLdImages(html),
    ...extractMetaImages(html),
    ...extractAmazonDynamicImages(html),
    ...extractRegexImages(html),
  ];

  return normalizeCandidates(candidates, pageUrl).find(isProbableProductImage) ?? "";
}

function extractAmazonLandingImages(html) {
  const images = [];
  const tagPattern = /<img\b[^>]*(?:id=["']landingImage["']|data-a-image-name=["']landingImage["']|data-old-hires=)[^>]*>/gi;
  for (const match of html.matchAll(tagPattern)) {
    const tag = match[0];
    const oldHires = getHtmlAttribute(tag, "data-old-hires");
    const src = getHtmlAttribute(tag, "src");
    const dynamic = getHtmlAttribute(tag, "data-a-dynamic-image");
    if (oldHires) images.push(oldHires);
    if (src) images.push(src);
    if (dynamic) {
      try {
        images.push(...Object.keys(JSON.parse(decodeHtml(dynamic))));
      } catch {
        // Ignore invalid Amazon image payloads.
      }
    }
  }
  return images;
}

function getHtmlAttribute(tag, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return tag.match(new RegExp(`\\s${escapedName}=["']([^"']+)["']`, "i"))?.[1] ?? "";
}

function extractMetaImages(html) {
  const images = [];
  const metaPattern = /<meta\s+[^>]*(?:property|name)=["'](?:og:image|og:image:url|twitter:image|twitter:image:src)["'][^>]*>/gi;
  for (const match of html.matchAll(metaPattern)) {
    const content = match[0].match(/\scontent=["']([^"']+)["']/i)?.[1];
    if (content) images.push(decodeHtml(content));
  }
  return images;
}

function extractSearchResultImages(html) {
  const images = [];
  const tagPattern = /<img\b[^>]*>/gi;
  for (const match of html.matchAll(tagPattern)) {
    const tag = match[0];
    const src = getHtmlAttribute(tag, "src");
    const dataSrc = getHtmlAttribute(tag, "data-src");
    const srcset = getHtmlAttribute(tag, "srcset") || getHtmlAttribute(tag, "data-srcset");

    for (const candidate of [src, dataSrc, bestSrcsetImage(srcset)]) {
      if (!candidate) continue;
      const lower = candidate.toLowerCase();
      if (
        lower.includes("m.media-amazon.com") ||
        lower.includes("images-na.ssl-images-amazon.com") ||
        lower.includes("sephora.com/productimages") ||
        lower.includes("sephora.net/productimages")
      ) {
        images.push(candidate);
      }
    }
  }
  return images;
}

function bestSrcsetImage(srcset) {
  if (!srcset) return "";
  const candidates = srcset
    .split(",")
    .map((part) => {
      const [url, descriptor = ""] = part.trim().split(/\s+/, 2);
      const score = Number.parseInt(descriptor.replace(/\D/g, ""), 10) || 0;
      return { score, url };
    })
    .filter((candidate) => candidate.url);
  candidates.sort((left, right) => right.score - left.score);
  return candidates[0]?.url ?? "";
}

function extractJsonLdImages(html) {
  const images = [];
  const scriptPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    try {
      images.push(...walkJsonForImages(JSON.parse(match[1])));
    } catch {
      // Ignore invalid structured data blocks.
    }
  }
  return images;
}

function walkJsonForImages(value) {
  if (Array.isArray(value)) return value.flatMap(walkJsonForImages);
  if (!value || typeof value !== "object") return [];

  const images = [];
  const image = value.image;
  if (typeof image === "string") images.push(image);
  else if (Array.isArray(image)) images.push(...image.filter((item) => typeof item === "string"));

  for (const child of Object.values(value)) {
    images.push(...walkJsonForImages(child));
  }
  return images;
}

function extractAmazonDynamicImages(html) {
  const images = [];
  const pattern = /data-a-dynamic-image=["']([^"']+)["']/gi;
  for (const match of html.matchAll(pattern)) {
    try {
      images.push(...Object.keys(JSON.parse(decodeHtml(match[1]))));
    } catch {
      // Ignore invalid Amazon image payloads.
    }
  }
  return images;
}

function extractRegexImages(html) {
  const patterns = [
    /"hiRes"\s*:\s*"([^"]+)"/gi,
    /"large"\s*:\s*"([^"]+)"/gi,
    /"mainUrl"\s*:\s*"([^"]+)"/gi,
    /"imageUrl"\s*:\s*"([^"]+)"/gi,
  ];
  return patterns.flatMap((pattern) => [...html.matchAll(pattern)].map((match) => match[1].replaceAll("\\/", "/")));
}

function normalizeCandidates(candidates, pageUrl) {
  const seen = new Set();
  const normalized = [];
  for (const candidate of candidates) {
    let imageUrl = decodeHtml(candidate).trim();
    if (!imageUrl || imageUrl.startsWith("data:")) continue;
    imageUrl = new URL(imageUrl, pageUrl).toString();
    if (!seen.has(imageUrl)) {
      seen.add(imageUrl);
      normalized.push(imageUrl);
    }
  }
  return normalized.sort((left, right) => imageScore(right) - imageScore(left));
}

function isProbableProductImage(url) {
  const lower = url.toLowerCase();
  if (!lower.startsWith("http://") && !lower.startsWith("https://")) return false;
  return !["sprite", "logo", "icon", "badge", "avatar", "grey-pixel", "transparent-pixel"].some((token) =>
    lower.includes(token),
  );
}

function imageScore(url) {
  const lower = url.toLowerCase();
  let score = 0;
  if (lower.includes("images-na.ssl-images-amazon.com") || lower.includes("m.media-amazon.com")) score += 20;
  if (lower.includes("sephora")) score += 20;
  if (lower.includes("hires") || lower.includes("main") || lower.includes("product")) score += 10;
  if (["1500", "1200", "1000", "800", "700"].some((size) => lower.includes(size))) score += 5;
  if (lower.includes("_sl") || lower.includes("wid=")) score += 5;
  return score;
}

function imageExtensionFromUrl(imageUrl) {
  const extension = extname(new URL(imageUrl).pathname).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(extension)) return extension === ".jpeg" ? ".jpg" : extension;
  return ".jpg";
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

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("\\u002F", "/")
    .replaceAll("\\/", "/");
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
