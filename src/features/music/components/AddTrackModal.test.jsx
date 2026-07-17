import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddTrackModal from './AddTrackModal';

// Mock useMusic
const mockAddToQueue = vi.fn().mockResolvedValue({});
vi.mock('../../../contexts/MusicContext', () => ({
  useMusic: () => ({
    addToQueue: mockAddToQueue,
  }),
}));

// Mock useSupabase — YouTube path never calls Supabase, but the hook
// is imported at the top level and would otherwise try to init a real client.
vi.mock('../../../hooks/useSupabase', () => ({
  useSupabase: () => ({}),
}));

describe('AddTrackModal', () => {
  let mockOnClose;
  let originalCreateObjectURL;
  let originalRevokeObjectURL;

  beforeAll(() => {
    // Setup dialog prototype methods since JSDOM doesn't implement them fully
    HTMLDialogElement.prototype.showModal = vi.fn(function () {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function () {
      this.open = false;
    });

    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
  });

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockAddToQueue.mockClear();

    // Mock URL object methods
    URL.createObjectURL = vi.fn((file) => `blob:mock-url-${file.name}`);
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<AddTrackModal isOpen={false} onClose={mockOnClose} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders correctly when isOpen is true', () => {
    render(<AddTrackModal isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText('Add Song to Queue')).toBeInTheDocument();
    expect(screen.getByText('Upload Audio File')).toBeInTheDocument();
    expect(screen.getByText('Add YouTube Link')).toBeInTheDocument();
  });

  it('handles backdrop click on dialog to close', () => {
    render(<AddTrackModal isOpen={true} onClose={mockOnClose} />);
    const dialog = screen.getByRole('dialog', { hidden: true });

    // Click on dialog backdrop (which is the dialog itself)
    fireEvent.click(dialog);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside the modal content box', () => {
    render(<AddTrackModal isOpen={true} onClose={mockOnClose} />);
    const modalHeader = screen.getByText('Add Song to Queue');

    // Click inside the modal content box
    fireEvent.click(modalHeader);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('handles Esc key cancellation to close and reset states', () => {
    render(<AddTrackModal isOpen={true} onClose={mockOnClose} />);
    const dialog = screen.getByRole('dialog', { hidden: true });

    // Cancel event (triggered by pressing Esc on HTMLDialogElement)
    fireEvent(dialog, new Event('cancel'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('validates file type on select', () => {
    render(<AddTrackModal isOpen={true} onClose={mockOnClose} />);
    const fileInput = screen.getByLabelText(/select audio clip/i, { selector: 'input' });

    // Create an invalid file
    const invalidFile = new File(['foo'], 'photo.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(screen.getByText('Please select a valid audio file.')).toBeInTheDocument();
  });

  it('validates file size on select (maximum 10MB)', () => {
    render(<AddTrackModal isOpen={true} onClose={mockOnClose} />);
    const fileInput = screen.getByLabelText(/select audio clip/i, { selector: 'input' });

    // Create a file larger than 10MB
    const largeFile = new File(['a'.repeat(11 * 1024 * 1024)], 'large-song.mp3', {
      type: 'audio/mp3',
    });
    Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(
      screen.getByText('File is too large. Maximum size allowed is 10MB.')
    ).toBeInTheDocument();
  });

  it('handles sequential file selection and ensures previous URL is revoked', async () => {
    render(<AddTrackModal isOpen={true} onClose={mockOnClose} />);
    const fileInput = screen.getByLabelText(/select audio clip/i, { selector: 'input' });

    const file1 = new File(['audio1'], 'song1.mp3', { type: 'audio/mp3' });
    const file2 = new File(['audio2'], 'song2.mp3', { type: 'audio/mp3' });

    // 1. Select first file
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file1] } });
    });

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).toHaveBeenLastCalledWith(file1);
    expect(screen.getByText('song1.mp3')).toBeInTheDocument();

    // 2. Select second file immediately
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file2] } });
    });

    // Verify the previous URL was revoked to prevent leakage
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url-song1.mp3');

    // Verify new URL is created for file2
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    expect(URL.createObjectURL).toHaveBeenLastCalledWith(file2);
    expect(screen.getByText('song2.mp3')).toBeInTheDocument();
  });

  it('revokes blob URL on close/unmount', async () => {
    const { unmount } = render(<AddTrackModal isOpen={true} onClose={mockOnClose} />);
    const fileInput = screen.getByLabelText(/select audio clip/i, { selector: 'input' });
    const file = new File(['audio'], 'song.mp3', { type: 'audio/mp3' });

    // Select file
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // Close modal
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url-song.mp3');

    // Reset calls and unmount fully before second render
    URL.revokeObjectURL.mockClear();
    unmount(); // <-- properly remove the first modal from DOM

    // Re-render, select file, and unmount
    const { unmount: unmount2 } = render(<AddTrackModal isOpen={true} onClose={mockOnClose} />);
    const fileInput2 = screen.getByLabelText(/select audio clip/i, { selector: 'input' });

    await act(async () => {
      fireEvent.change(fileInput2, { target: { files: [file] } });
    });

    unmount2();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url-song.mp3');
  });

  it('handles youtube link tab submission', async () => {
    const { unmount } = render(<AddTrackModal isOpen={true} onClose={mockOnClose} />);

    // Switch to YouTube tab
    const ytTabBtn = screen.getByRole('button', { name: /add youtube link/i });
    fireEvent.click(ytTabBtn);

    // Fill inputs
    const urlInput = screen.getByPlaceholderText(/watch\?v=/i);
    await act(async () => {
      fireEvent.change(urlInput, {
        target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
      });
    });

    const titleInput = screen.getByPlaceholderText(/e\.g\. Yellow/i);
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Never Gonna Give You Up' } });
    });

    const artistInput = screen.getByPlaceholderText(/e\.g\. Coldplay/i);
    await act(async () => {
      fireEvent.change(artistInput, { target: { value: 'Rick Astley' } });
    });

    // Submit inside act to flush all async state
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add track/i }));
      // Flush the resolved mockAddToQueue promise
      await Promise.resolve();
    });

    expect(mockAddToQueue).toHaveBeenCalledWith(
      'Never Gonna Give You Up',
      'Rick Astley',
      'youtube',
      'dQw4w9WgXcQ',
      null
    );
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    unmount();
  }, 10000); // generous timeout to prevent CI flakiness
});
