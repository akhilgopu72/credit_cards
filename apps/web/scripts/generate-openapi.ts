/**
 * Generate OpenAPI spec from registered Zod schemas.
 *
 * Usage: pnpm openapi:generate
 */
import { writeFileSync } from "fs";
import { resolve } from "path";
import { generateOpenApiDocument } from "../src/lib/openapi";

const doc = generateOpenApiDocument();
const outPath = resolve(__dirname, "../openapi.json");
writeFileSync(outPath, JSON.stringify(doc, null, 2) + "\n");
console.log(`OpenAPI spec written to ${outPath}`);
