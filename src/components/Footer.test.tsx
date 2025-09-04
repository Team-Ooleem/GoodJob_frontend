/**
 * Tests for Footer component.
 *
 * Testing library/framework:
 * - React Testing Library with expect matchers from jest-dom (common in Jest/Vitest setups).
 *
 * These tests validate:
 * - Rendering of the copyright text and year
 * - Presence and correctness of key Tailwind utility classes on containers
 * - Basic structure (div wrappers, single paragraph)
 * - No unexpected interactive elements
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
// If jest-dom isn't globally set up, this import is harmless redundancy.
import '@testing-library/jest-dom';

import { Footer } from './Footer';

describe('Footer', () => {
  it('renders without crashing and shows the copyright line', () => {
    render(<Footer />);
    const copyright = screen.getByText(/ⓒ\s*2025\s+Team\s+Ooleem/i);
    expect(copyright).toBeInTheDocument();
  });

  it('applies expected classes on the outermost container', () => {
    const { container } = render(<Footer />);
    const root = container.firstElementChild as HTMLElement | null;
    expect(root).toBeTruthy();
    // Validate key Tailwind classes on root
    expect(root!).toHaveClass('w-full');
    expect(root!).toHaveClass('h-[130px]');
    expect(root!).toHaveClass('border-t-1');
    expect(root!).toHaveClass('border-gray-200');
  });

  it('contains the width-constrained wrapper with proper layout classes', () => {
    const { container } = render(<Footer />);
    const divs = container.querySelectorAll('div');
    // Expect: three nested divs before the paragraph
    expect(divs.length).toBeGreaterThanOrEqual(3);

    const wrapper = divs[1] as HTMLElement;
    expect(wrapper).toHaveClass('mx-auto');
    expect(wrapper).toHaveClass('w-[1400px]');
    expect(wrapper).toHaveClass('flex', 'justify-between', 'items-start');

    const row = divs[2] as HTMLElement;
    expect(row).toHaveClass('h-[60px]');
    expect(row).toHaveClass('flex', 'justify-between', 'items-center');
  });

  it('renders exactly one paragraph with correct text and text classes', () => {
    const { container } = render(<Footer />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(1);

    const p = paragraphs[0] as HTMLParagraphElement;
    expect(p).toHaveTextContent('ⓒ 2025 Team Ooleem');
    expect(p).toHaveClass('text-sm', 'text-neutral-500');
  });

  it('does not include unexpected interactive elements (links/buttons)', () => {
    render(<Footer />);
    // No links or buttons expected in this static footer
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('basic DOM structure sanity: nested divs contain the paragraph', () => {
    const { container } = render(<Footer />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toBeInTheDocument();

    // Descend to the innermost container then verify paragraph presence
    const innerMost = within(root).getByText(/Team Ooleem/i).closest('p');
    expect(innerMost).toBeInTheDocument();
    // Ensure it’s inside the root (structure integrity)
    expect(root.contains(innerMost as Node)).toBe(true);
  });
});