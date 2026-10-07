import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UpdateNotificationBanner from './UpdateNotificationBanner';

describe('UpdateNotificationBanner', () => {
  it('renders update prompt and calls onApplyUpdate when update button is clicked', () => {
    const handleApply = vi.fn();
    const handleDismiss = vi.fn();

    render(<UpdateNotificationBanner onApplyUpdate={handleApply} onDismiss={handleDismiss} />);

    expect(screen.getByText('Fresh Update Available')).toBeInTheDocument();
    expect(screen.getByText('A newer version of Lover-HQ is ready.')).toBeInTheDocument();

    const updateBtn = screen.getByRole('button', { name: /apply update/i });
    fireEvent.click(updateBtn);
    expect(handleApply).toHaveBeenCalledTimes(1);

    const dismissBtn = screen.getByRole('button', { name: /dismiss update banner/i });
    fireEvent.click(dismissBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });
});
