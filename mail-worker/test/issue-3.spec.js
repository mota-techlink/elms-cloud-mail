import { describe, expect, it } from 'vitest';
import { getDefaultSignature, hasSignatureBlockMarkup, splitRecipientInput } from '../src/utils/signature-default';

describe('issue #3 helpers', () => {
	it('selects a personal default before a public default', () => {
		const signatures = [
			{ sigId: 1, isCompany: 1, isDefault: 1, content: 'public' },
			{ sigId: 2, isCompany: 0, isDefault: 1, content: 'personal' },
			{ sigId: 3, isCompany: 0, isDefault: 0, content: 'other' }
		];

		expect(getDefaultSignature(signatures)).toMatchObject({ sigId: 2, content: 'personal' });
	});

	it('splits semicolon-delimited recipients without leaving the delimiter behind', () => {
		expect(splitRecipientInput('first@example.com; second@example.com ; third@example.com')).toEqual([
			'first@example.com',
			'second@example.com',
			'third@example.com'
		]);
		expect(splitRecipientInput('one@example.com;two@example.com')).toEqual([
			'one@example.com',
			'two@example.com'
		]);
	});

	it('detects whether an inserted signature block already exists', () => {
		expect(hasSignatureBlockMarkup('<div id="email-signature-block" data-email-signature="inserted"></div>')).toBe(true);
		expect(hasSignatureBlockMarkup('<p>hello</p>')).toBe(false);
	});
});
