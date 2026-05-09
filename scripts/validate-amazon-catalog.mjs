import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCT_CSV = join(ROOT, "backend", "data", "products.csv");

const rows = readCsv(PRODUCT_CSV).rows;

const amazonRows = rows.filter((row) => row.retailer.toLowerCase() === "amazon");
const amazonCartReadyRows = amazonRows.filter((row) => hasAmazonAsin(row.product_url));
const imageReadyRows = rows.filter((row) => hasExistingRealImage(row.image_url));
const amazonReadyRows = amazonCartReadyRows.filter((row) => hasExistingRealImage(row.image_url));

console.log(`Total products: ${rows.length}`);
console.log(`Amazon products: ${amazonRows.length}`);
console.log(`Amazon cart-ready products: ${amazonCartReadyRows.length}`);
console.log(`Products with real local images: ${imageReadyRows.length}`);
console.log(`Amazon cart-ready products with real images: ${amazonReadyRows.length}`);

const notReady = amazonRows.filter((row) => !hasAmazonAsin(row.product_url) || !hasExistingRealImage(row.image_url));
if (notReady.length) {
  console.log("\nAmazon products not fully ready:");
  for (const row of notReady) {
    const issues = [];
    if (!hasAmazonAsin(row.product_url)) issues.push("missing /dp/ASIN");
    if (!hasExistingRealImage(row.image_url)) issues.push("missing real image file");
    console.log(`- ${row.product_id}: ${issues.join(", ")}`);
  }
}

function hasAmazonAsin(productUrl) {
  return /\/(?:dp|gp\/product)\/[A-Z0-9]{10}/i.test(productUrl);
}

function hasRealImage(imageUrl) {
  return /\.(jpe?g|png|webp)$/i.test(imageUrl);
}

function hasExistingRealImage(imageUrl) {
  if (!hasRealImage(imageUrl)) return false;
  const localPath = imageUrl.startsWith("/product-images/")
    ? join("public", imageUrl.slice(1))
    : imageUrl.startsWith("/")
      ? imageUrl.slice(1)
      : imageUrl;
  return existsSync(join(ROOT, localPath));
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
