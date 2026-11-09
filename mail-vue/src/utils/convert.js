import {useSettingStore} from "@/store/setting.js";

//后端 API 基地址(生产为 /api,开发为 http://127.0.0.1:8787/api)
function apiBase() {
    return (import.meta.env.VITE_BASE_URL || '/api').replace(/\/+$/, '');
}

//附件与内嵌图片统一走同源 Worker 的 OSS 路由,避免依赖 r2Domain 配置导致的 404
export function ossBase() {
    return apiBase() + '/oss/';
}

export function ossUrl(key) {

    if (!key) {
        return '';
    }

    if (/^(https?:|data:|blob:)/i.test(key)) {
        return key;
    }

    return ossBase() + String(key).replace(/^\/+/, '');
}

//附件下载地址:download=1 让 Worker 强制返回 Content-Disposition: attachment
export function ossDownloadUrl(key, fileName) {

    const url = ossUrl(key);

    if (!url) {
        return '';
    }

    const params = new URLSearchParams({download: '1'});

    if (fileName) {
        params.set('filename', fileName);
    }

    return url + (url.includes('?') ? '&' : '?') + params.toString();
}

export function cvtR2Url(key) {

    if (!key) {
        return + 'https://' + ''
    }

    if (key.startsWith('https://')) {
        return key
    }

    const { settings } = useSettingStore();

    let domain = settings.r2Domain

    if (!domain) {
        return key;
    }

    if (!domain.startsWith('http')) {
        return 'https://' + domain + '/' + key
    }

    if (domain.endsWith("/")) {
        domain = domain.slice(0, -1);
    }
    return domain + '/' + key
}

export function toOssDomain(domain) {

    if (!domain) {
        return ''
    }

    if (!domain.startsWith('http')) {
        return 'https://' + domain
    }

    if (domain.endsWith("/")) {
        domain = domain.slice(0, -1);
    }

    return domain
}
