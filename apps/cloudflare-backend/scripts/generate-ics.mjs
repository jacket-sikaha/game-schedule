import {
	buildGameCalendar,
	ICS_GAME_KEYS,
	ICS_KV_TTL_SECONDS,
	ICS_NAMESPACE,
} from '../src/ical/generator.mjs';

const backendUrl = (process.env.ICS_BACKEND_URL || 'https://gebc.lee-sikaha.cloudns.ch').replace(
	/\/+$/,
	'',
);
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const namespaceId = process.env.ICS_KV_NAMESPACE_ID;
const requestedConcurrency = Number(process.env.ICS_REFRESH_CONCURRENCY || 3);
const concurrency = Number.isFinite(requestedConcurrency)
	? Math.max(1, Math.floor(requestedConcurrency))
	: 3;

const requireEnv = (name, value) => {
	if (!value) throw new Error(`Missing required environment variable: ${name}`);
	return value;
};

const fetchJson = async (gameKey) => {
	const url = `${backendUrl}/${encodeURIComponent(gameKey)}`;
	const response = await fetch(url, {
		headers: { Accept: 'application/json' },
		signal: AbortSignal.timeout(30_000),
	});
	if (!response.ok) {
		throw new Error(`GET ${url} failed: ${response.status}`);
	}
	return response.json();
};

const writeKv = async (key, value) => {
	const url = new URL(
		`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/storage/kv/namespaces/${encodeURIComponent(namespaceId)}/values/${encodeURIComponent(key)}`,
	);
	url.searchParams.set('expiration_ttl', String(ICS_KV_TTL_SECONDS));

	const response = await fetch(url, {
		method: 'PUT',
		headers: {
			Authorization: `Bearer ${apiToken}`,
			'Content-Type': 'text/plain; charset=utf-8',
		},
		body: value,
		signal: AbortSignal.timeout(30_000),
	});
	const result = await response.json().catch(() => null);
	if (!response.ok || result?.success === false) {
		const errors = result?.errors?.map((item) => item.message).join('; ');
		throw new Error(`KV write for ${key} failed: ${response.status}${errors ? ` (${errors})` : ''}`);
	}
};

const mapWithConcurrency = async (items, limit, mapper) => {
	const results = new Array(items.length);
	let nextIndex = 0;

	await Promise.all(
		Array.from({ length: Math.min(limit, items.length) }, async () => {
			while (nextIndex < items.length) {
				const index = nextIndex;
				nextIndex += 1;
				results[index] = await mapper(items[index]);
			}
		}),
	);

	return results;
};

const main = async () => {
	requireEnv('CLOUDFLARE_ACCOUNT_ID', accountId);
	requireEnv('CLOUDFLARE_API_TOKEN', apiToken);
	requireEnv('ICS_KV_NAMESPACE_ID', namespaceId);

	const results = await mapWithConcurrency(ICS_GAME_KEYS, concurrency, async (gameKey) => {
		try {
			const payload = await fetchJson(gameKey);
			const built = buildGameCalendar(gameKey, payload);
			if (built.eventCount === 0) {
				throw new Error('Generated calendar contains zero events');
			}

			const key = `${ICS_NAMESPACE}:${gameKey}`;
			await writeKv(key, built.text);
			return {
				game: gameKey,
				ok: true,
				events: built.eventCount,
				skipped: built.skipped,
				bytes: new TextEncoder().encode(built.text).length,
			};
		} catch (error) {
			return {
				game: gameKey,
				ok: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	});

	console.log(JSON.stringify({ event: 'ics_refresh_summary', results }, null, 2));
	if (results.some((result) => !result.ok)) {
		process.exitCode = 1;
	}
};

main().catch((error) => {
	console.error(error instanceof Error ? error.stack ?? error.message : error);
	process.exitCode = 1;
});
