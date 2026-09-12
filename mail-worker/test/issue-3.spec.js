import { describe, expect, it } from 'vitest';
import { getDefaultSignature, hasSignatureBlockMarkup, splitRecipientInput } from '../src/utils/signature-default';

describe('issue #3 and #5 helpers', () => {
	it('selects a personal default before a public default', () => {
		const signatures = [
			{ sigId: 1, isCompany: 1, isDefault: 1, content: 'public' },
			{ sigId: 2, isCompany: 0, isDefault: 1, content: 'personal' },
			{ sigId: 3, isCompany: 0, isDefault: 0, content: 'other' }
		];

		expect(getDefaultSignature(signatures)).toMatchObject({ sigId: 2, content: 'personal' });
	});

	it('selects company default when no personal default exists', () => {
		const signatures = [
			{ sigId: 1, isCompany: 1, isDefault: 1, content: '<p>Company Signature</p>' },
			{ sigId: 2, isCompany: 0, isDefault: 0, content: 'personal' }
		];

		expect(getDefaultSignature(signatures)).toMatchObject({ sigId: 1, content: '<p>Company Signature</p>' });
	});

	it('falls back to company default when personal default content is empty', () => {
		const signatures = [
			{ sigId: 1, isCompany: 1, isDefault: 1, content: 'company default' },
			{ sigId: 2, isCompany: 0, isDefault: 1, content: '   ' }
		];

		expect(getDefaultSignature(signatures)).toMatchObject({ sigId: 1, content: 'company default' });
	});

	it('returns null when neither default signature has non-empty content', () => {
		const signatures = [
			{ sigId: 1, isCompany: 1, isDefault: 1, content: '   ' },
			{ sigId: 2, isCompany: 0, isDefault: 0, content: 'not default' }
		];

		expect(getDefaultSignature(signatures)).toBeNull();
		expect(getDefaultSignature([])).toBeNull();
	});

	it('handles boolean, numeric, and string truthy flags in signature records', () => {
		const signatures = [
			{ sigId: 10, isCompany: '1', isDefault: '1', content: 'company' }
		];
		expect(getDefaultSignature(signatures)).toMatchObject({ sigId: 10, content: 'company' });

		const signaturesBool = [
			{ sigId: 20, isCompany: true, isDefault: true, content: 'company bool' }
		];
		expect(getDefaultSignature(signaturesBool)).toMatchObject({ sigId: 20, content: 'company bool' });
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

	it('handles consecutive semicolons, chinese delimiters, and invalid inputs cleanly', () => {
		expect(splitRecipientInput(';;;')).toEqual([]);
		expect(splitRecipientInput('valid@example.com;;;')).toEqual(['valid@example.com']);
		expect(splitRecipientInput('a@example.com；b@example.com，c@example.com,d@example.com;')).toEqual([
			'a@example.com',
			'b@example.com',
			'c@example.com',
			'd@example.com'
		]);
		expect(splitRecipientInput(['first@example.com; second@example.com', 'third@example.com;'])).toEqual([
			'first@example.com',
			'second@example.com',
			'third@example.com'
		]);
		expect(splitRecipientInput('not-an-email; not-an-email-either')).toEqual([]);
	});

	it('detects whether an inserted signature block already exists', () => {
		expect(hasSignatureBlockMarkup('<div id="email-signature-block" data-email-signature="inserted"></div>')).toBe(true);
		expect(hasSignatureBlockMarkup('<div id="email-signature-block"></div><blockquote>quoted message</blockquote>')).toBe(false);
		expect(hasSignatureBlockMarkup('<p>hello</p>')).toBe(false);
	});
});
