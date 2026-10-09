export interface LogEntry { cls: string; text: string }
export interface Xinwu { id: string; name: string; needCult: number; rate: number }
export interface Game {
  innate: number; aptitude: number; lvl: number; cult: number;
  lifespan: number; age: number; year: number; xinwu: Xinwu[];
  maxCount: Record<string, number>; ascended: boolean; dead: boolean;
  ascendMode?: string; deadCause?: string; gotXitong?: boolean; gotYibian?: boolean;
  __log?: LogEntry[]; __time?: string;
}
export interface Player { lv: number; exp: number }
export interface Stats { total: number; ascend: number }
export interface HistoryEntry {
  time: string; outcome: string; god: boolean; talent: string;
  lvl: string; cult: string; age: string; exp: number;
}
export interface RankEntry {
  name: string; cultNum: number; cult: string; age: string;
  talent: string; innate: number; time: string;
}
export type FinishReason = 'dead' | 'god' | 'pause';
