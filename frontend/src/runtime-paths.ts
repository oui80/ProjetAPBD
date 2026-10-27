export function normalizeBasePath(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const normalized = withLeadingSlash.replace(/\/{2,}/g, "/");
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

export function routerBasename(baseUrl = import.meta.env.BASE_URL): string {
  const normalized = normalizeBasePath(baseUrl);
  return normalized === "/" ? "/" : normalized.slice(0, -1);
}
