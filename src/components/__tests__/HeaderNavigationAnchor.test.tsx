import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen } from '@testing-library/react';

import { HeaderNavigationAnchor } from '../HeaderNavigationAnchor';

// Mock next/link to a simple anchor for test determinism
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('HeaderNavigationAnchor', () => {
  test('renders link with provided children text', () => {
    render(<HeaderNavigationAnchor href="/about">About</HeaderNavigationAnchor>);
    const link = screen.getByRole('link', { name: 'About' });
    expect(link).toBeInTheDocument();
  });

  test('applies the expected className for styling', () => {
    render(<HeaderNavigationAnchor href="/features">Features</HeaderNavigationAnchor>);
    const link = screen.getByRole('link', { name: 'Features' });
    expect(link).toHaveClass('text-base');
    expect(link).toHaveClass('font-semibold');
    expect(link.className).toMatch(/!text-neutral-800/);
  });

  test('sets href correctly for a relative URL', () => {
    render(<HeaderNavigationAnchor href="/contact">Contact</HeaderNavigationAnchor>);
    const link = screen.getByRole('link', { name: 'Contact' }) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/contact');
  });

  test('supports absolute/external URLs', () => {
    render(<HeaderNavigationAnchor href="https://example.com">External</HeaderNavigationAnchor>);
    const link = screen.getByRole('link', { name: 'External' }) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('https://example.com');
  });

  test('renders complex children (element)', () => {
    render(
      <HeaderNavigationAnchor href="/docs">
        <span aria-label="docs-label">Docs</span>
      </HeaderNavigationAnchor>
    );
    const link = screen.getByRole('link', { name: /Docs/i });
    expect(link).toBeInTheDocument();
    expect(screen.getByLabelText('docs-label')).toBeInTheDocument();
  });

  test('renders with empty string children (edge case)', () => {
    render(<HeaderNavigationAnchor href="/empty">{''}</HeaderNavigationAnchor>);
    // Link with no accessible name can still be selected by role if name option omitted:
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/empty');
  });

  test('renders exactly one anchor element', () => {
    const { container } = render(<HeaderNavigationAnchor href="/one">One</HeaderNavigationAnchor>);
    const anchors = container.querySelectorAll('a');
    expect(anchors.length).toBe(1);
  });
});