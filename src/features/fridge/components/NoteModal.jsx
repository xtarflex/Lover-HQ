import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { ModalOverlay } from '../../../components/ModalOverlay';

/**
 * @file NoteModal.jsx
 * @description Modal component for creating or editing sticky notes on the collaborative Fridge board.
 */

// Constants for sticky note colors (8 options)
const NOTE_COLORS = [
  { id: 'yellow', bg: 'bg-[#fef08a] text-[#854d0e] border-[#fde047]' },
  { id: 'pink', bg: 'bg-[#fbcfe8] text-[#9d174d] border-[#f9a8d4]' },
  { id: 'blue', bg: 'bg-[#bfdbfe] text-[#1e40af] border-[#93c5fd]' },
  { id: 'green', bg: 'bg-[#bbf7d0] text-[#166534] border-[#86efac]' },
  { id: 'purple', bg: 'bg-[#e9d5ff] text-[#6b21a8] border-[#d8b4fe]' },
  { id: 'orange', bg: 'bg-[#ffedd5] text-[#9a3412] border-[#fed7aa]' },
  { id: 'teal', bg: 'bg-[#ccfbf1] text-[#115e59] border-[#99f6e4]' },
  { id: 'lavender', bg: 'bg-[#e0e7ff] text-[#3730a3] border-[#c7d2fe]' },
];

/**
 * Sticky Note Creator / Editor Modal
 *
 * @param {Object} props - Component properties
 * @param {boolean} props.isOpen - Controls visibility of the modal
 * @param {Function} props.onClose - Callback function to close the modal
 * @param {string} props.userId - ID of the current user
 * @param {Function} props.onSave - Callback when note is successfully stuck/saved
 * @param {string|null} [props.editItemId=null] - ID of the item being edited (null if creating)
 * @param {string} [props.initialText=''] - Initial text content of the note
 * @param {string} [props.initialColor=''] - Initial color configuration of the note
 * @param {Function} [props.addOfflineItem] - Function to add item to offline queue
 * @returns {React.ReactElement} The NoteModal component
 */
export function NoteModal({
  isOpen,
  onClose,
  userId,
  onSave,
  editItemId = null,
  initialText = '',
  initialColor = '',
  addOfflineItem,
}) {
  const [text, setText] = useState(initialText);
  const [selectedColor, setSelectedColor] = useState(() => {
    if (initialColor) {
      return NOTE_COLORS.find((c) => c.id === initialColor) || NOTE_COLORS[0];
    }
    const defaultColorId = localStorage.getItem('fridge_default_note_color') || 'yellow';
    return NOTE_COLORS.find((c) => c.id === defaultColorId) || NOTE_COLORS[0];
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setText(initialText);
      if (initialColor) {
        const matchingColor = NOTE_COLORS.find((c) => c.id === initialColor);
        if (matchingColor) setSelectedColor(matchingColor);
      } else {
        const defaultColorId = localStorage.getItem('fridge_default_note_color') || 'yellow';
        const matchingColor = NOTE_COLORS.find((c) => c.id === defaultColorId);
        setSelectedColor(matchingColor || NOTE_COLORS[0]);
      }
    } else {
      setText('');
      setError(null);
    }
  }, [isOpen, initialText, initialColor]);

  const handleSave = async () => {
    if (!text.trim()) return;
    setIsSaving(true);
    setError(null);

    const content = JSON.stringify({ text, color: selectedColor.id });
    const timestamp = new Date().toISOString();

    // Check if explicitly offline
    if (!navigator.onLine) {
      const tempId = `offline-${Date.now()}`;
      const localItem = {
        id: tempId,
        user_id: userId,
        type: 'note',
        content,
        x_position: 30 + Math.random() * 40,
        y_position: 30 + Math.random() * 40,
        created_at: timestamp,
        updated_at: timestamp,
        isPending: true,
        isOfflineQueue: true,
      };

      if (addOfflineItem) {
        addOfflineItem(localItem);
      }

      if (onSave) onSave(localItem);
      onClose();
      setIsSaving(false);
      return;
    }

    try {
      let data, dbError;

      if (editItemId) {
        const { data: updatedData, error: updateError } = await supabase
          .from('fridge_items')
          .update({
            content,
            updated_at: timestamp,
          })
          .eq('id', editItemId)
          .select()
          .single();
        data = updatedData;
        dbError = updateError;
      } else {
        const { data: insertedData, error: insertError } = await supabase
          .from('fridge_items')
          .insert({
            user_id: userId,
            type: 'note',
            content,
            x_position: 30 + Math.random() * 40,
            y_position: 30 + Math.random() * 40,
          })
          .select()
          .single();
        data = insertedData;
        dbError = insertError;
      }

      if (dbError) throw dbError;
      if (onSave) onSave(data);
      onClose();
    } catch (err) {
      console.error('Save note error:', err);
      const isNetwork =
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('network') ||
        !navigator.onLine;
      if (isNetwork && !editItemId) {
        const tempId = `offline-${Date.now()}`;
        const localItem = {
          id: tempId,
          user_id: userId,
          type: 'note',
          content,
          x_position: 30 + Math.random() * 40,
          y_position: 30 + Math.random() * 40,
          created_at: timestamp,
          updated_at: timestamp,
          isPending: true,
          isOfflineQueue: true,
        };
        if (addOfflineItem) {
          addOfflineItem(localItem);
        }
        if (onSave) onSave(localItem);
        onClose();
      } else {
        setError(editItemId ? 'Failed to update sticky note.' : 'Failed to save sticky note.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const fontPref = localStorage.getItem('fridge_note_font') || 'handwriting';
  const getModalFontClass = (pref) => {
    switch (pref) {
      case 'sans':
        return 'font-sans text-lg placeholder:font-sans';
      case 'serif':
        return 'font-serif text-lg placeholder:font-serif';
      case 'mono':
        return 'font-mono text-base placeholder:font-mono';
      case 'kalam':
        return 'font-kalam text-2xl placeholder:font-kalam';
      case 'patrick':
        return 'font-patrick text-2xl placeholder:font-patrick';
      case 'handwriting':
      default:
        return 'font-handwriting text-2xl placeholder:font-handwriting';
    }
  };
  const fontClass = getModalFontClass(fontPref);

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-bold text-text-main">
            {editItemId ? 'Edit Sticky Note' : 'Leave a Sticky Note'}
          </h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview / Textarea */}
        <div
          className={`w-full aspect-square rounded-xl p-6 border-2 flex flex-col shadow-inner transition-all duration-300 ${selectedColor.bg}`}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your handwritten note here..."
            className={`flex-grow bg-transparent border-none outline-none resize-none leading-relaxed placeholder:text-current/50 focus:ring-0 p-0 ${fontClass}`}
            maxLength={180}
            disabled={isSaving}
          />
          <div className="text-[10px] text-right font-semibold opacity-70">{text.length}/180</div>
        </div>

        {/* Color Palette Picker */}
        <div className="flex flex-wrap gap-2.5 justify-center my-4">
          {NOTE_COLORS.map((color) => (
            <button
              key={color.id}
              onClick={() => setSelectedColor(color)}
              className={`w-7 h-7 rounded-full border transition-transform ${color.bg.split(' ')[0]} ${
                selectedColor.id === color.id
                  ? 'scale-110 border-primary ring-2 ring-primary/30 shadow-md'
                  : 'border-slate-300 dark:border-slate-700 hover:scale-105'
              }`}
              title={`Choose ${color.id}`}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-xs bg-red-500/10 p-2.5 rounded-lg border border-red-500/20 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!text.trim() || isSaving}
          className="w-full bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-brand-surface font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
        >
          <Save className="w-4 h-4" />
          {isSaving
            ? editItemId
              ? 'Saving...'
              : 'Sticking...'
            : editItemId
              ? 'Save Changes'
              : 'Stick to Fridge'}
        </button>
      </div>
    </ModalOverlay>
  );
}
