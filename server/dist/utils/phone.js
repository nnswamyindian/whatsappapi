// Phone number parsing and normalization utility for WhatsApp Business E.164 compliance
export function normalizePhone(rawInput, defaultCountryCode = '91') {
    if (!rawInput || typeof rawInput !== 'string') {
        return { isValid: false, e164: '', countryCode: '', nationalNumber: '', error: 'Empty or invalid phone number' };
    }
    // Remove whitespace, dashes, parentheses, dots
    let cleaned = rawInput.trim().replace(/[\s\(\)\-\.]/g, '');
    let countryCode = '';
    let nationalNumber = '';
    if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1);
    }
    else if (cleaned.startsWith('00')) {
        cleaned = cleaned.substring(2);
    }
    else if (cleaned.length === 10 && defaultCountryCode) {
        // Local 10 digit number with default country code
        cleaned = defaultCountryCode + cleaned;
    }
    // Only digits allowed
    if (!/^\d+$/.test(cleaned)) {
        return { isValid: false, e164: '', countryCode: '', nationalNumber: '', error: 'Contains non-digit characters' };
    }
    // Detect country prefix
    if (cleaned.startsWith('91') && cleaned.length === 12) {
        countryCode = '91';
        nationalNumber = cleaned.substring(2);
    }
    else if (cleaned.startsWith('1') && cleaned.length === 11) {
        countryCode = '1';
        nationalNumber = cleaned.substring(1);
    }
    else if (cleaned.startsWith('44') && (cleaned.length === 11 || cleaned.length === 12)) {
        countryCode = '44';
        nationalNumber = cleaned.substring(2);
    }
    else if (cleaned.startsWith('971') && (cleaned.length === 11 || cleaned.length === 12)) {
        countryCode = '971';
        nationalNumber = cleaned.substring(3);
    }
    else if (cleaned.length >= 8 && cleaned.length <= 15) {
        countryCode = cleaned.substring(0, 2);
        nationalNumber = cleaned.substring(2);
    }
    else {
        return { isValid: false, e164: '', countryCode: '', nationalNumber: '', error: 'Invalid phone length for WhatsApp E.164' };
    }
    return {
        isValid: true,
        e164: `+${cleaned}`,
        countryCode,
        nationalNumber,
    };
}
