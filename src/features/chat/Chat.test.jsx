import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Chat from './Chat';

describe('Chat Layout Scaffolding', () => {
  it('renders header with placeholder partner name', () => {
    render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );
    expect(screen.getByText('Partner Name')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders input area placeholder', () => {
    render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );
    expect(screen.getByPlaceholderText('Message...')).toBeInTheDocument();
  });

  it('renders mock layout messages', () => {
    render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );
    expect(screen.getByText(/Hey! How is your day going?/i)).toBeInTheDocument();
  });
});
