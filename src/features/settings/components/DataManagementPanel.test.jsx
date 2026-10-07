import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DataManagementPanel from './DataManagementPanel';
import * as swManager from '../../../services/serviceWorkerManager';
import { APP_VERSION } from '../../../constants/version';

vi.mock('../../../services/serviceWorkerManager', () => ({
  checkForUpdates: vi.fn(),
  clearAppCacheAndReload: vi.fn(),
}));

describe('DataManagementPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders application version and installed release tag', () => {
    render(<DataManagementPanel />);

    expect(screen.getByText('Lover-HQ Version')).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(`v${APP_VERSION}`)).length).toBeGreaterThanOrEqual(1);
  });

  it('handles manual update check when app is up to date', async () => {
    vi.mocked(swManager.checkForUpdates).mockResolvedValueOnce({
      hasUpdate: false,
      message: 'You are on the latest version of Lover-HQ.',
    });

    render(<DataManagementPanel />);

    const checkBtn = screen.getByRole('button', { name: /check for updates/i });
    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect(swManager.checkForUpdates).toHaveBeenCalledTimes(1);
      expect(screen.getByText('You are on the latest version of Lover-HQ.')).toBeInTheDocument();
    });
  });

  it('triggers clearAppCacheAndReload when cache purge button is clicked', async () => {
    vi.mocked(swManager.clearAppCacheAndReload).mockResolvedValueOnce();

    render(<DataManagementPanel />);

    const purgeBtn = screen.getByRole('button', { name: /clear cache & refresh app/i });
    fireEvent.click(purgeBtn);

    await waitFor(() => {
      expect(swManager.clearAppCacheAndReload).toHaveBeenCalledTimes(1);
    });
  });
});
