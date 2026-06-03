/**
 * @file StepPhone.jsx
 * @description Onboarding Step 2: Asks for an optional phone number.
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import PhoneInput from '../components/PhoneInput';

/**
 * Renders the second onboarding step where the user optionally provides
 * their phone number with country code selection.
 *
 * @param {{
 *   countriesList: Array<{code: string, flag: string, name: string}>,
 *   selectedCountry: {code: string, flag: string, name: string},
 *   localNumber: string,
 *   showCountryDropdown: boolean,
 *   onSelectCountry: Function,
 *   onToggleDropdown: Function,
 *   onLocalNumberChange: Function,
 *   onBack: Function,
 *   onNext: Function,
 * }} props
 * @param {Array<{code: string, flag: string, name: string}>} props.countriesList - Full list of selectable countries.
 * @param {{code: string, flag: string, name: string}} props.selectedCountry - Currently selected country.
 * @param {string} props.localNumber - Formatted local portion of the phone number.
 * @param {boolean} props.showCountryDropdown - Whether the country dropdown is open.
 * @param {Function} props.onSelectCountry - Callback when a country is chosen.
 * @param {Function} props.onToggleDropdown - Callback to toggle the country dropdown.
 * @param {Function} props.onLocalNumberChange - Callback for local number input changes.
 * @param {Function} props.onBack - Callback to go to the previous step.
 * @param {Function} props.onNext - Callback to advance to the next step.
 * @returns {React.ReactElement}
 */
export default function StepPhone({
  countriesList,
  selectedCountry,
  localNumber,
  showCountryDropdown,
  onSelectCountry,
  onToggleDropdown,
  onLocalNumberChange,
  onBack,
  onNext,
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <span className="text-primary font-semibold tracking-tighter text-sm uppercase">
          02 / 05
        </span>
        <h2 className="font-heading text-4xl md:text-5xl leading-tight font-bold text-text-main">
          Tell us a bit more about yourself.
        </h2>
      </div>
      <div className="space-y-6">
        <PhoneInput
          countriesList={countriesList}
          selectedCountry={selectedCountry}
          localNumber={localNumber}
          showCountryDropdown={showCountryDropdown}
          onSelectCountry={onSelectCountry}
          onToggleDropdown={onToggleDropdown}
          onLocalNumberChange={onLocalNumberChange}
        />
      </div>
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={onBack}
          className="p-4 rounded-full border border-surface-border hover:border-text-muted text-text-main transition-colors relative z-10 bg-background"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onNext}
          className="bg-text-main text-background hover-heart-scale flex-grow py-4 rounded-full text-sm font-bold uppercase tracking-widest transition-all group"
        >
          <span className="relative z-10">Next</span>
        </button>
      </div>
    </div>
  );
}
