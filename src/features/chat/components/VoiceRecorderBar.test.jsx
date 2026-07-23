/**
 * @file VoiceRecorderBar.test.jsx
 * @description Unit tests for VoiceRecorderBar component.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VoiceRecorderBar } from './VoiceRecorderBar';

describe('VoiceRecorderBar', () => {
  it('renders active recording controls when audioPreviewUrl is null', () => {
    render(
      <VoiceRecorderBar
        audioPreviewUrl={null}
        audioPreviewPlaying={false}
        audioPreviewCurrentTime={0}
        audioPreviewDuration={0}
        recordDuration={5}
        isRecordingPaused={false}
        recordLevels={[10, 20]}
        discardRecording={vi.fn()}
        handleTogglePreviewPlay={vi.fn()}
        setAudioPreviewCurrentTime={vi.fn()}
        audioPreviewRef={{ current: null }}
        resumeRecording={vi.fn()}
        pauseRecording={vi.fn()}
        stopRecordingAndPreview={vi.fn()}
        sendRecordingImmediately={vi.fn()}
        sendRecording={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Discard recording')).toBeInTheDocument();
    expect(screen.getByLabelText('Pause recording')).toBeInTheDocument();
    expect(screen.getByLabelText('Stop and preview voice note')).toBeInTheDocument();
    expect(screen.getByLabelText('Send immediately')).toBeInTheDocument();
  });

  it('renders preview mode controls when audioPreviewUrl is present', () => {
    render(
      <VoiceRecorderBar
        audioPreviewUrl="blob:http://localhost/test"
        audioPreviewPlaying={false}
        audioPreviewCurrentTime={0}
        audioPreviewDuration={10}
        recordDuration={10}
        isRecordingPaused={false}
        recordLevels={[]}
        discardRecording={vi.fn()}
        handleTogglePreviewPlay={vi.fn()}
        setAudioPreviewCurrentTime={vi.fn()}
        audioPreviewRef={{ current: null }}
        resumeRecording={vi.fn()}
        pauseRecording={vi.fn()}
        stopRecordingAndPreview={vi.fn()}
        sendRecordingImmediately={vi.fn()}
        sendRecording={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Play preview')).toBeInTheDocument();
    expect(screen.getByLabelText('Send voice note')).toBeInTheDocument();
  });
});
