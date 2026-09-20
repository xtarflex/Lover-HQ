/**
 * @file Auth.test.jsx
 * @description Unit tests for Auth form accessibility and labeled inputs.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Auth from './Auth';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  },
}));

vi.mock('../../contexts/AppContext', () => ({
  useAppDispatch: () => vi.fn(),
}));

describe('Auth component accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email input with associated accessible label', () => {
    render(<Auth />);

    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('id', 'email');
  });

  it('renders password input with associated accessible label', () => {
    render(<Auth />);

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('id', 'password');
  });

  it('allows user input in labeled email and password fields', () => {
    render(<Auth />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText('Password');

    fireEvent.change(emailInput, { target: { value: 'test@loverhq.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Secret123!' } });

    expect(emailInput.value).toBe('test@loverhq.com');
    expect(passwordInput.value).toBe('Secret123!');
  });
});
