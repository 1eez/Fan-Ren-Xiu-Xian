// Keep the original keys and record shapes for explicit same-origin save compatibility.
export const keys = {
  player: 'fc_player', achievements: 'fc_ach', total: 'fc_feisheng_total',
  stats: 'fanren_sim_stats', history: 'fc_history', rank: 'fc_rank', save: 'fc_save',
} as const;
export function read<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; }
  catch { return fallback; }
}
export function write(key: string, value: unknown): boolean {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}
export function remove(key: string): void {
  try { localStorage.removeItem(key); } catch { /* Storage may be unavailable. */ }
}
