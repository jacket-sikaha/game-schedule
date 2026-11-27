export type IcsGameKey =
	| 'genshin'
	| 'starrail'
	| 'zzz'
	| 'fgo'
	| 'ak'
	| 'mc'
	| 'pns'
	| 'ba'
	| 'ba-jp'
	| 'nikke'
	| 'cbjq'
	| 'endfield'
	| 'nte'
	| 'umamusume';

export const ICS_GAME_KEYS: readonly IcsGameKey[];
export const ICS_NAMESPACE: string;
export const ICS_CLIENT_MAX_AGE_SECONDS: number;
export const ICS_KV_TTL_SECONDS: number;
export const ICS_REFRESH_HOURS: number;

export interface IcsActivity {
	id: number | string;
	title: string;
	start_time: string;
	end_time?: string;
	banner?: string;
	linkUrl?: string;
}

export interface IcsBuildResult {
	text: string;
	eventCount: number;
	skipped: number;
}

export function normalizeIcsActivities(gameKey: IcsGameKey, payload: unknown): IcsActivity[];
export function escapeIcsText(value: unknown): string;
export function foldIcsLine(line: string, limit?: number): string;
export function toIcsUtcStamp(localDate: string): string | null;
export function buildGameCalendar(
	gameKey: IcsGameKey,
	payload: unknown,
	now?: Date,
): IcsBuildResult;
