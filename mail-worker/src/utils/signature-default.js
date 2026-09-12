export function getDefaultSignature(signatures = []) {
	if (!Array.isArray(signatures)) return null;
	const isTruthy = (val) => val === true || Number(val) === 1 || val === '1';
	const hasContent = (val) => Boolean(String(val || '').trim());

	const personalDefault = signatures.find((s) => !isTruthy(s.isCompany) && isTruthy(s.isDefault) && hasContent(s.content));
	if (personalDefault) return personalDefault;
	return signatures.find((s) => isTruthy(s.isCompany) && isTruthy(s.isDefault) && hasContent(s.content)) || null;
}

export function splitRecipientInput(value = '') {
	if (Array.isArray(value)) {
		return Array.from(new Set(
			value
				.flatMap((item) => String(item || '').split(/[;；,，]+/))
				.map((item) => item.trim())
				.filter(Boolean)
				.filter((item) => /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(item))
		));
	}
	return Array.from(new Set(
		String(value || '')
			.split(/[;；,，]+/)
			.map((item) => item.trim())
			.filter(Boolean)
			.filter((item) => /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(item))
	));
}

export function hasSignatureBlockMarkup(content = '') {
	return /data-email-signature=["']inserted["']/.test(String(content || ''));
}
