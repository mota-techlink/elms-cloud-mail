import r2Service from '../service/r2-service';
import app from '../hono/hono';

app.get('/oss/*', async (c) => {
	const key = decodeURIComponent(c.req.path.split('/oss/')[1] || '');
	return r2Service.toObjResp(c, key, {
		download: ['1', 'true'].includes(c.req.query('download')),
		fileName: c.req.query('filename')
	});
});
