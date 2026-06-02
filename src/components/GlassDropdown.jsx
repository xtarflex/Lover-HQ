import React, { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

/**
 * @typedef {Object} DropdownOption
 * @property {string|number} value - The underlying value of the option.
 * @property {string} label - The user-visible display label.
 */

/**
 * A reusable glassmorphic dropdown selector component.
 * Rendered in a portal to prevent parent stacking contexts and z-index clipping.
 * Leverages modern CSS Anchor Positioning with an optimized JavaScript fallback.
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
  const panelRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

  // Generate a unique CSS Custom Identifier for CSS Anchor Positioning
  const uniqueId = useId().replace(/:/g, '');
  const anchorName = `--dropdown-anchor-${uniqueId}`;

  const selectedOption = options.find((opt) => opt.value === value);

  // Feature detection for native CSS Anchor Positioning support
  const [supportsAnchor, setSupportsAnchor] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupportsAnchor(
      typeof CSS !== 'undefined' &&
        CSS.supports &&
        (CSS.supports('anchor-name: --a') || CSS.supports('top: anchor(bottom)'))
    );
  }, []);

  // Optimized position calculations for fallback browsers (throttled via requestAnimationFrame)
  useEffect(() => {
    if (!isOpen || supportsAnchor || !buttonRef.current) return;

    let rafId;
    const updateCoords = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom, // Viewport-relative coordinates
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    const throttledUpdate = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateCoords);
    };

    updateCoords();

    window.addEventListener('resize', throttledUpdate);
    // Listen to scroll events on capture phase to handle nested scrolling containers
    window.addEventListener('scroll', throttledUpdate, true);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', throttledUpdate);
      window.removeEventListener('scroll', throttledUpdate, true);
    };
  }, [isOpen, supportsAnchor]);

  // Click outside to dismiss (light dismiss logic)
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (buttonRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Keyboard accessibility: dismiss on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
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
    const spacing = size === 'md' ? '8px' : '4px';

    if (supportsAnchor) {
      return {
        position: 'fixed',
        anchorName,
        positionAnchor: anchorName,
        top: `calc(anchor(bottom) + ${spacing})`,
        left: align === 'right' ? 'auto' : 'anchor(left)',
        right: align === 'right' ? 'anchor(right)' : 'auto',
        width: size === 'md' ? 'anchor-size(width)' : 'auto',
        minWidth: size === 'sm' ? '110px' : undefined,
        zIndex: 50,
      };
    }

    // Fallback coordinates (viewport-relative, since position is fixed)
    const spacingVal = size === 'md' ? 8 : 4;
    return {
      position: 'fixed',
      top: `${coords.top + spacingVal}px`,
      left: align === 'right' ? 'auto' : `${coords.left}px`,
      right: align === 'right' ? `${window.innerWidth - coords.left - coords.width}px` : 'auto',
      width: size === 'md' ? `${coords.width}px` : 'auto',
      minWidth: size === 'sm' ? '110px' : undefined,
      zIndex: 50,
    };
  };

  const dropdownMenu = (
    <div
      ref={panelRef}
      onClick={(e) => e.stopPropagation()}
      className={`bg-slate-900/95 dark:bg-slate-950/95 border border-white/10 dark:border-slate-800 backdrop-blur-xl overflow-hidden space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150 shadow-2xl ${sizeStyles.panel} ${panelClassName}`}
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
  );

  return (
    <div className={`relative ${size === 'md' ? 'w-full' : 'inline-block'}`}>
      <button
        ref={buttonRef}
        type="button"
        style={{ anchorName }}
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
