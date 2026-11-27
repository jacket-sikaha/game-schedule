import { StatusError } from 'itty-router';
import { getAKEventWithDetailTime } from '@/Arknights/util';
import { BAData } from '@/ba/DataType';
import { handleBAData } from '@/ba/util';
import { getActivities } from '@/endfield';
import { getFGOEventWithDetailTime } from '@/fgo/util';
import { GamekeeData } from '@/gamekee/DataType';
import { handleGamekeeEvent } from '@/gamekee/util';
import { getPunishingEvent, getWutheringWavesEvent } from '@/kuro-game/util';
import { getNteEventData } from '@/nte/util';
import { getSnowBreakEventData } from '@/snowbreak/util';
import { getUmamusumeEventData } from '@/umamusume/util';
import { getZzzEventData } from '@/zzz/util';
import {
	buildGameCalendar,
	ICS_CLIENT_MAX_AGE_SECONDS,
	ICS_GAME_KEYS,
	ICS_KV_TTL_SECONDS,
	ICS_NAMESPACE,
	type IcsGameKey,
} from './generator.mjs';

export {
	buildGameCalendar,
	foldIcsLine,
	ICS_GAME_KEYS,
	normalizeIcsActivities,
	toIcsUtcStamp,
} from './generator.mjs';
export type { IcsActivity, IcsBuildResult, IcsGameKey } from './generator.mjs';

export type IcsEnv = Env & {
	ICS_KV?: KVNamespace;
};

interface IcsSnapshotMetadata {
	generatedAt: string;
	eventCount: number;
}

export const isIcsGameKey = (value: string): value is IcsGameKey =>
	(ICS_GAME_KEYS as readonly string[]).includes(value);

const fetchJson = async (url: string, init?: RequestInit): Promise<any> => {
	const response = await fetch(url, {
		...init,
		signal: AbortSignal.timeout(8_000),
	});
	if (!response.ok) {
		throw new StatusError(502, `Upstream request failed: ${response.status}`);
	}
	return response.json();
};

const loadGamePayload = async (gameKey: IcsGameKey, env: IcsEnv): Promise<unknown> => {
	switch (gameKey) {
		case 'genshin': {
			const data = await fetchJson(env.VITE_GENSHIN_API);
			return data.data?.list.find((item: { type_id: number }) => item.type_id === 1);
		}
		case 'starrail': {
			const data = await fetchJson(env.VITE_STARRAIL_API);
			return data.data?.list.find((item: { type_id: number }) => item.type_id === 4);
		}
		case 'zzz':
			return getZzzEventData(env.VITE_ZZZ_API);
		case 'fgo':
			return getFGOEventWithDetailTime(env.VITE_FGO_PROXY_API);
		case 'ak':
			return getAKEventWithDetailTime(env.VITE_AKEventList_API, env.VITE_AKEventDetail_API);
		case 'mc':
			return getWutheringWavesEvent(env);
		case 'pns':
			return getPunishingEvent(env.VITE_KURO_WIKI_GAME_API);
		case 'ba':
			return handleBAData((await fetchJson(env.VITE_BA_API)) as BAData);
		case 'ba-jp': {
			const data = (await fetchJson(env.VITE_BA_JP_API, {
				headers: { 'game-alias': 'ba' },
			})) as GamekeeData;
			return handleGamekeeEvent(data.data);
		}
		case 'nikke': {
			const data = (await fetchJson(env.VITE_NIKKE_API, {
				headers: { 'game-alias': 'nikke' },
			})) as GamekeeData;
			return handleGamekeeEvent(data.data);
		}
		case 'cbjq':
			return getSnowBreakEventData(env.VITE_SNOWBREAK_API);
		case 'endfield':
			return getActivities(env.VITE_ENDFIELD_API);
		case 'nte':
			return getNteEventData(env.VITE_NTE_API);
		case 'umamusume':
			return getUmamusumeEventData(env.VITE_UMAMUSUME_API);
	}
};

const hashText = (text: string): string => {
	let hash = 0x811c9dc5;
	for (let index = 0; index < text.length; index += 1) {
		hash ^= text.charCodeAt(index);
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}
	return hash.toString(16).padStart(8, '0');
};

const buildResponseHeaders = (
	gameKey: IcsGameKey,
	etag: string,
	metadata?: IcsSnapshotMetadata,
): Headers => {
	const headers = new Headers({
		'Content-Type': 'text/calendar; charset=utf-8',
		'Cache-Control': `public, max-age=${ICS_CLIENT_MAX_AGE_SECONDS}, stale-while-revalidate=${ICS_KV_TTL_SECONDS}`,
		ETag: etag,
		'Cache-Tag': `ics:${gameKey}`,
		'Content-Disposition': `inline; filename="${gameKey}.ics"`,
	});
	if (metadata?.generatedAt) {
		const generatedAt = new Date(metadata.generatedAt);
		if (!Number.isNaN(generatedAt.getTime())) {
			headers.set('Last-Modified', generatedAt.toUTCString());
			headers.set('X-ICS-Generated-At', metadata.generatedAt);
		}
	}
	return headers;
};

export const getIcsResponse = async (
	gameKey: IcsGameKey,
	request: Request,
	env: IcsEnv,
): Promise<Response> => {
	const kv = env.ICS_KV;
	if (!kv) {
		throw new StatusError(503, 'ICS_KV binding is not configured');
	}

	const key = `${ICS_NAMESPACE}:${gameKey}`;
	const stored = await kv.getWithMetadata<IcsSnapshotMetadata>(key, {
		type: 'text',
		cacheTtl: 300,
	});
	let text = stored.value;
	let metadata = stored.metadata ?? undefined;

	if (!text) {
		try {
			const payload = await loadGamePayload(gameKey, env);
			const built = buildGameCalendar(gameKey, payload);
			text = built.text;
			metadata = {
				generatedAt: new Date().toISOString(),
				eventCount: built.eventCount,
			};
			await kv.put(key, text, {
				expirationTtl: ICS_KV_TTL_SECONDS,
				metadata,
			});
		} catch (error: any) {
			if (error instanceof StatusError) throw error;
			const status = typeof error?.status === 'number' ? error.status : 502;
			throw new StatusError(status, error?.message ?? 'Failed to generate iCal');
		}
	}

	const etag = `W/"${hashText(text)}"`;
	const ifNoneMatch = request.headers.get('If-None-Match');
	if (ifNoneMatch?.split(',').map((value) => value.trim()).includes(etag)) {
		return new Response(null, {
			status: 304,
			headers: buildResponseHeaders(gameKey, etag, metadata),
		});
	}

	return new Response(text, {
		headers: buildResponseHeaders(gameKey, etag, metadata),
	});
};
