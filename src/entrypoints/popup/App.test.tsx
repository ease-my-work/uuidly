import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('scaffold', () => {
  it('renders the wordmark', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'uuidly' })).toBeInTheDocument();
  });

  it('lists every design token from DESIGN.md §5', () => {
    render(<App />);
    // 12 semantic tokens, dark and light both defined from the same names.
    expect(screen.getAllByRole('listitem')).toHaveLength(12);
  });
});
