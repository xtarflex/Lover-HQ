/**
 * @file PhoneInput.jsx
 * @description Compound phone number input with country code selector dropdown
 * and formatted local number field.
 */

import React from 'react';

/**
 * A compound input consisting of a country code selector button with a
 * dropdown list and a free-text local phone number field.
 *
 * @param {{
 *   countriesList: Array<{code: string, flag: string, name: string}>,
 *   selectedCountry: {code: string, flag: string, name: string},
 *   localNumber: string,
 *   showCountryDropdown: boolean,
 *   onSelectCountry: Function,
 *   onToggleDropdown: Function,
 *   onLocalNumberChange: Function,
 * }} props
 * @param {Array<{code: string, flag: string, name: string}>} props.countriesList - Full list of selectable countries.
 * @param {{code: string, flag: string, name: string}} props.selectedCountry - Currently selected country.
 * @param {string} props.localNumber - The formatted local portion of the phone number.
 * @param {boolean} props.showCountryDropdown - Whether the country dropdown is open.
 * @param {Function} props.onSelectCountry - Callback when a country is selected from the dropdown.
 * @param {Function} props.onToggleDropdown - Callback to toggle the dropdown open/closed.
 * @param {Function} props.onLocalNumberChange - Callback for local number input changes.
 * @returns {React.ReactElement}
 */
export default function PhoneInput({
  countriesList,
  selectedCountry,
  localNumber,
  showCountryDropdown,
  onSelectCountry,
  onToggleDropdown,
  onLocalNumberChange,
}) {
  return (
    <div className="border-b-2 border-surface-border focus-within:border-primary transition-colors py-4 group flex flex-col">
      <label className="text-xs font-bold uppercase tracking-widest text-text-muted group-focus-within:text-primary transition-colors block mb-2">
        Phone Number (Optional)
      </label>
      <div className="flex items-center relative">
        {/* Country Selector Dropdown */}
        <div className="relative mr-3 shrink-0">
          <button
            type="button"
            onClick={onToggleDropdown}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-surface/40 hover:bg-surface/70 border border-surface-border/50 text-text-main transition-colors text-lg"
          >
            <span className="text-xl leading-none">{selectedCountry.flag}</span>
            <span className="font-bold text-sm leading-none">{selectedCountry.code}</span>
            <span className="text-[10px] text-text-muted">▼</span>
          </button>

          {showCountryDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => onSelectCountry(selectedCountry)}
              />
              <div className="absolute top-full left-0 mt-2 w-64 max-h-60 overflow-y-auto bg-surface border border-surface-border rounded-2xl shadow-xl z-50 py-2 custom-scrollbar">
                {countriesList.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => onSelectCountry(c)}
                    className="w-full px-4 py-2.5 hover:bg-primary/10 flex items-center space-x-3 text-left transition-colors"
                  >
                    <span className="text-xl shrink-0">{c.flag}</span>
                    <span className="text-sm font-semibold text-text-main shrink-0 w-12">
                      {c.code}
                    </span>
                    <span className="text-xs text-text-muted truncate">{c.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={localNumber}
          onChange={onLocalNumberChange}
          placeholder="803 123 4567"
          className="w-full bg-transparent text-xl md:text-2xl placeholder-text-muted/30 text-text-main focus:outline-none"
          autoFocus
        />
      </div>
    </div>
  );
}
