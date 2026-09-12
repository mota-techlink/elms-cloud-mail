import { describe, expect, it } from 'vitest';
import worker from '../src';

describe('worker entry', () => {
	it('serves asset responses through the app fetch handler', async () => {
		const env = {
			assets: {
				fetch: async () => new Response('<html>ok</html>', { headers: { 'content-type': 'text/html' } })
			}
		};
		const ctx = {
			waitUntil: () => {},
			passThroughOnException: () => {}
		};
		const response = await worker.fetch(new Request('https://example.com/'), env, ctx);
		expect(response.status).toBe(200);
		expect(await response.text()).toBe('<html>ok</html>');
	});
});
