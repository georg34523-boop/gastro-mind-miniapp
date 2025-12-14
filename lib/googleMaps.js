export function extractCidFromUrl(url) {
  const match = url.match(/cid=(\d+)/);
  return match ? match[1] : null;
}

export function extractPlaceNameFromUrl(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/place/");
    if (!parts[1]) return null;

    return decodeURIComponent(parts[1].split("/")[0]).replace(/\+/g, " ");
  } catch {
    return null;
  }
}
