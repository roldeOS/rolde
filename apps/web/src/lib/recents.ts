/** Recently-viewed patients — stored per browser (no backend needed). */
export type Recent = { id: string; name: string; meta: string };

const KEY = "rolde:recents";

export function pushRecent(r: Recent) {
  if (typeof window === "undefined") return;
  try {
    const cur = JSON.parse(localStorage.getItem(KEY) ?? "[]") as Recent[];
    const next = [r, ...cur.filter((x) => x.id !== r.id)].slice(0, 8);
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("rolde:recents"));
  } catch {
    /* ignore quota / parse errors */
  }
}

export function getRecents(): Recent[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Recent[];
  } catch {
    return [];
  }
}
