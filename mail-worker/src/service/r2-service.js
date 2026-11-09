import s3Service from './s3-service';
import settingService from './setting-service';
import kvObjService from './kv-obj-service';

function sanitizeFileName(fileName) {
	if (!fileName) {
		return '';
	}
	return String(fileName)
		.replace(/[\r\n	]/g, ' ')
		.replace(/[\\/:*?"<>|]/g, '_')
		.trim();
}

function parseFileName(contentDisposition) {
	if (!contentDisposition) {
		return '';
	}
	const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
	if (utf8Match) {
		try {
			return decodeURIComponent(utf8Match[1]);
		} catch (e) {
			return utf8Match[1];
		}
	}
	const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
	return match ? match[1].trim() : '';
}

//RFC 5987: 同时给出 ascii 回退名和 UTF-8 文件名,保证中文/空格文件名可正确下载
function buildContentDisposition(type, fileName) {
	if (!fileName) {
		return type;
	}
	const asciiName = fileName.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
	const encodedName = encodeURIComponent(fileName)
		.replace(/['()*]/g, char => '%' + char.charCodeAt(0).toString(16).toUpperCase());
	return `${type}; filename="${asciiName}"; filename*=UTF-8''${encodedName}`;
}

const r2Service = {

	async storageType(c) {

		const setting = await settingService.query(c);
		const { bucket, endpoint, s3AccessKey, s3SecretKey } = setting;

		if (!!(bucket && endpoint && s3AccessKey && s3SecretKey)) {
			return 'S3';
		}

		if (c.env.r2) {
			return 'R2';
		}

		return 'KV';
	},

	async putObj(c, key, content, metadata) {

		const storageType = await this.storageType(c);

		if (storageType === 'KV') {
			await kvObjService.putObj(c, key, content, metadata);
		}

		if (storageType === 'R2') {
			await c.env.r2.put(key, content, {
				httpMetadata: { ...metadata }
			});
		}

		if (storageType === 'S3') {
			await s3Service.putObj(c, key, content, metadata);
		}

	},

	async getObj(c, key) {
		const storageType = await this.storageType(c);

		if (storageType === 'KV') {
			return await kvObjService.getObj(c, key);
		}

		if (storageType === 'R2') {
			return await c.env.r2.get(key);
		}

		if (storageType === 'S3') {
			return await s3Service.getObj(c, key);
		}
	},

	async delete(c, key) {

		const storageType = await this.storageType(c);

		if (storageType === 'KV') {
			await kvObjService.deleteObj(c, key);
		}

		if (storageType === 'R2') {
			await c.env.r2.delete(key);
		}

		if (storageType === 'S3'){
			await s3Service.deleteObj(c, key);
		}

	},

	//统一的对象响应:按实际存储类型(R2/KV/S3)读取,不存在的对象返回 404 而不是抛异常
	async toObjResp(c, key, options = {}) {

		if (!key) {
			return new Response('Not Found', { status: 404 });
		}

		const obj = await this.getObj(c, key);

		if (!obj) {
			return new Response('Not Found', { status: 404 });
		}

		const isResponse = obj instanceof Response;
		const httpMetadata = obj.httpMetadata || {};
		const kvMetadata = obj.metadata || {};

		const contentType = httpMetadata.contentType || kvMetadata.contentType || obj.ContentType
			|| (isResponse ? obj.headers.get('content-type') : null) || 'application/octet-stream';
		const cacheControl = httpMetadata.cacheControl || kvMetadata.cacheControl || obj.CacheControl
			|| (isResponse ? obj.headers.get('cache-control') : null);
		const rawContentDisposition = httpMetadata.contentDisposition || kvMetadata.contentDisposition || obj.ContentDisposition
			|| (isResponse ? obj.headers.get('content-disposition') : null);

		const fileName = sanitizeFileName(options.fileName)
			|| sanitizeFileName(parseFileName(rawContentDisposition))
			|| sanitizeFileName(key.split('/').pop());

		//内嵌图片默认 inline,普通附件默认 attachment;?download=1 强制下载
		let dispositionType = rawContentDisposition && /^\s*inline/i.test(rawContentDisposition) ? 'inline' : 'attachment';
		if (options.download) {
			dispositionType = 'attachment';
		}

		const headers = new Headers();
		headers.set('Content-Type', contentType);
		headers.set('Content-Disposition', buildContentDisposition(dispositionType, fileName));
		headers.set('X-Content-Type-Options', 'nosniff');

		if (options.download) {
			headers.set('Cache-Control', 'private, no-store');
		} else if (cacheControl) {
			headers.set('Cache-Control', cacheControl);
		}

		const body = obj.Body || obj.body || (isResponse ? obj.body : null);

		return new Response(body, { headers });
	}

};
export default r2Service;
