import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

/** Resolve openapi.yaml in dev (tsx), compiled dist, and Netlify function bundles. */
export function resolveOpenApiPath(): string | undefined {
  const candidates = [
    join(process.cwd(), "apps/api/openapi.yaml"),
    join(process.cwd(), "openapi.yaml"),
  ];

  try {
    const metaUrl = import.meta.url;
    if (metaUrl?.startsWith("file:")) {
      candidates.unshift(join(dirname(fileURLToPath(metaUrl)), "..", "openapi.yaml"));
    }
  } catch {
    // Netlify esbuild CJS bundle — rely on process.cwd() paths only
  }

  return candidates.find((p) => existsSync(p));
}
