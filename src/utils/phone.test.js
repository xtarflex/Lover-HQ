import { describe, it, expect } from 'vitest';
import { parsePhoneNumber, COUNTRIES } from './phone.js';

describe('parsePhoneNumber', () => {
  it('returns default country and empty local number for falsy input', () => {
    const result = parsePhoneNumber('');
    expect(result.country).toEqual(COUNTRIES[0]);
    expect(result.local).toBe('');

    const nullResult = parsePhoneNumber(null);
    expect(nullResult.country).toEqual(COUNTRIES[0]);
    expect(nullResult.local).toBe('');
  });

  it('correctly parses a number with a known country code', () => {
    // Nigeria is +234
    const result = parsePhoneNumber('+2348031234567');
    expect(result.country.code).toBe('+234');
    expect(result.country.name).toBe('Nigeria');
    expect(result.local).toBe('8031234567');
  });

  it('correctly handles spaces in the input number', () => {
    // US is +1
    const result = parsePhoneNumber('+1 415 555 2671');
    expect(result.country.code).toBe('+1');
    expect(result.country.name).toBe('United States');
    // Note: The function trims spaces after slice but it removes spaces completely in `cleanNumber` only for matching.
    // The slice is performed on `fullNumber`, so "+1 415 555 2671".slice(2) = " 415 555 2671" => trim => "415 555 2671".
    expect(result.local).toBe('415 555 2671');
  });

  it('returns default country and original number if no country code matches', () => {
    // +999 doesn't exist in COUNTRIES
    const result = parsePhoneNumber('+9991234567');
    expect(result.country).toEqual(COUNTRIES[0]); // default is the first one
    expect(result.local).toBe('+9991234567');
  });

  it('matches the longest possible country code', () => {
    // Provide a custom country list to test prefix sorting
    const customCountries = [
      { code: '+2', name: 'Country Two' },
      { code: '+25', name: 'Country Twenty Five' },
      { code: '+254', name: 'Kenya' } // the target
    ];

    const result = parsePhoneNumber('+254712345678', customCountries);
    expect(result.country.code).toBe('+254');
    expect(result.country.name).toBe('Kenya');
    expect(result.local).toBe('712345678');
  });

  it('matches a shorter code if longer ones do not match', () => {
    const customCountries = [
      { code: '+2', name: 'Country Two' },
      { code: '+25', name: 'Country Twenty Five' },
      { code: '+254', name: 'Kenya' }
    ];

    // +251 doesn't match +254, but matches +25
    const result = parsePhoneNumber('+251712345678', customCountries);
    expect(result.country.code).toBe('+25');
    expect(result.country.name).toBe('Country Twenty Five');
    expect(result.local).toBe('1712345678');
  });
});
