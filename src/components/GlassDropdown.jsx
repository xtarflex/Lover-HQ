import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

/**
 * @typedef {Object} DropdownOption
 * @property {string|number} value - The underlying value of the option.
 * @property {string} label - The user-visible display label.
 */

/**
 * A reusable glassmorphic dropdown selector component.
 * Rendered globally in a viewport portal to prevent parent stacking contexts and z-index overlap issues.
 *
 * @param {Object} props
 * @param {string|number} props.value - The currently selected value.
 * @param {DropdownOption[]} props.options - Array of available select options.
 * @param {function(string|number): void} props.onChange - Callback fired when selection changes.
 * @param {string} [props.buttonClassName] - Additional custom styles for the trigger button.
 * @param {string} [props.panelClassName] - Additional custom styles for the options panel.
 * @param {string} [props.optionClassName] - Additional custom styles for each option button.
 * @param {string} [props.size="md"] - Preset sizes: "sm" (fridge toolbar) or "md" (settings).
 * @param {string} [props.align="left"] - Panel alignment: "left" or "right".
 * @returns {React.ReactElement} The GlassDropdown react component.
 */
export default function GlassDropdown({
  value,
  options,
  onChange,
  buttonClassName = '',
  panelClassName = '',
  optionClassName = '',
  size = 'md',
  align = 'left',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const selectedOption = options.find((opt) => opt.value === value);

  // Position calculation and window/container event tracking
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updateCoords = () => {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom, // Viewport-relative bottom
        left: rect.left, // Viewport-relative left
        width: rect.width,
        height: rect.height,
      });
    };

    updateCoords();

    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true); // capture phase to handle nested scroll

    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  const sizeStyles = {
    sm: {
      button:
        'px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-border/20 border border-surface-border/60 hover:bg-surface-border/30 text-text-main cursor-pointer',
      panel: 'p-1 rounded-lg min-w-[110px]',
      option: 'px-2 py-1.5 rounded-md text-xs font-semibold cursor-pointer',
      chevron: 'w-3.5 h-3.5',
      check: 'w-3.5 h-3.5',
    },
    md: {
      button:
        'w-full px-4 py-3.5 bg-white/5 dark:bg-slate-950/40 border border-white/10 dark:border-white/5 backdrop-blur-md rounded-2xl text-text-main font-semibold hover:bg-white/10 text-left cursor-pointer',
      panel: 'p-1.5 rounded-2xl shadow-2xl',
      option: 'px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer',
      chevron: 'w-4 h-4',
      check: 'w-4 h-4',
    },
  }[size];

  // Calculate panel placement styles relative to measured trigger coords
  const getPanelStyle = () => {
    const spacing = size === 'md' ? 8 : 4;
    return {
      position: 'absolute',
      top: `${coords.top + spacing}px`,
      left: align === 'right' ? 'auto' : `${coords.left}px`,
      right: align === 'right' ? `${window.innerWidth - coords.left - coords.width}px` : 'auto',
      width: size === 'md' ? `${coords.width}px` : 'auto',
      minWidth: size === 'sm' ? '110px' : undefined,
      zIndex: 10, // Higher than backdrop inside the wrapper
    };
  };

  const dropdownMenu = (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 99999 }}>
      <div
        className="absolute inset-0 bg-transparent pointer-events-auto"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(false);
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-slate-900/95 dark:bg-slate-950/95 border border-white/10 dark:border-slate-800 backdrop-blur-xl overflow-hidden space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150 shadow-2xl pointer-events-auto ${sizeStyles.panel} ${panelClassName}`}
        style={getPanelStyle()}
      >
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left transition-all flex items-center justify-between cursor-pointer ${
                sizeStyles.option
              } ${
                isSelected ? 'bg-primary/20 text-primary' : 'text-text-main hover:bg-white/5'
              } ${optionClassName}`}
            >
              <span>{opt.label}</span>
              {isSelected && <Check className={`text-primary ${sizeStyles.check}`} />}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`relative ${size === 'md' ? 'w-full' : 'inline-block'}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`${sizeStyles.button} flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 gap-1 ${buttonClassName}`}
      >
        <span>{selectedOption ? selectedOption.label : value}</span>
        <ChevronDown
          className={`text-text-muted transition-transform duration-200 ${sizeStyles.chevron} ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && createPortal(dropdownMenu, document.body)}
    </div>
  );
}
