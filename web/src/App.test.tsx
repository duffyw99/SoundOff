import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('shows the app name and a healthy server status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    render(<App />);
    expect(screen.getByRole('heading', { name: 'SoundOff!' })).toBeInTheDocument();
    expect(await screen.findByText('Server: ok')).toBeInTheDocument();
  });

  it('shows unreachable when the server cannot be contacted', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<App />);
    expect(await screen.findByText('Server: unreachable')).toBeInTheDocument();
  });
});
