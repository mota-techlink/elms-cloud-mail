export function getDefaultSignature(signatures = []) {
	if (!Array.isArray(signatures)) return null;
	const personalDefault = signatures.find((signature) => !signature.isCompany && Number(signature.isDefault) === 1 && String(signature.content || '').trim());
	if (personalDefault) return personalDefault;
	return signatures.find((signature) => !!signature.isCompany && Number(signature.isDefault) === 1 && String(signature.content || '').trim()) || null;
}

export function splitRecipientInput(value = '') {
	return Array.from(new Set(
		String(value || '')
			.split(/[;；,，]+/)
			.map((item) => item.trim())
			.filter(Boolean)
			.filter((item) => /^.+@.+\..+$/.test(item))
	));
}

export function hasSignatureBlockMarkup(content = '') {
	return /id=["']email-signature-block["']/.test(String(content || '')) || /data-email-signature=["']inserted["']/.test(String(content || ''));
}
