/**
 * Tests for HeaderNavigation
 *
 * Framework and libraries:
 * - Test runner: Jest (or Vitest-compatible)
 * - React component testing: @testing-library/react
 * - Matchers: @testing-library/jest-dom
 *
 * These tests focus on the public interface: rendered links/texts and their href targets.
 * We mock HeaderNavigationAnchor to render a real <a> for robust, accessible queries.
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import HeaderNavigation from './HeaderNavigation';

// Mock the HeaderNavigationAnchor to a simple anchor that preserves href and children.
// This isolates tests from its internal implementation and ensures accessible queries by role.
jest.mock('./HeaderNavigationAnchor', () => {
  const React = require('react');
  return {
    HeaderNavigationAnchor: ({ href, children }: { href: string; children: React.ReactNode }) =>
      React.createElement('a', { href, 'data-testid': 'header-nav-link' }, children),
    __esModule: true,
  };
});

describe('HeaderNavigation', () => {
  const expected = [
    { text: '채용', href: '/' },
    { text: 'AI 인터뷰', href: '/ai-interview' },
    { text: '이력서', href: '/coaching-resume' },
    { text: '커뮤니티', href: '/' },
  ];

  it('renders without crashing and displays all expected navigation links', () => {
    render(<HeaderNavigation />);

    // Query all mocked anchors by test id and also verify by accessible role=link
    const linksByTestId = screen.getAllByTestId('header-nav-link');
    expect(linksByTestId).toHaveLength(expected.length);

    // Verify each expected label is present and is a link
    for (const { text } of expected) {
      const link = screen.getByRole('link', { name: text });
      expect(link).toBeInTheDocument();
    }
  });

  it('renders links in the correct order with correct href targets', () => {
    render(<HeaderNavigation />);

    const navLinks = screen.getAllByTestId('header-nav-link');
    expect(navLinks).toHaveLength(expected.length);

    navLinks.forEach((el, idx) => {
      const { text, href } = expected[idx];
      // text content
      expect(el).toHaveTextContent(text);
      // href attribute (will be absolute in JSDOM; check endsWith to be resilient)
      const actualHref = (el as HTMLAnchorElement).getAttribute('href') ?? '';
      expect(actualHref).toBe(href);
    });
  });

  it('exposes all links via accessible role "link" with the correct names', () => {
    render(<HeaderNavigation />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(expected.length);

    // Assert each expected label has exactly one corresponding link
    for (const { text } of expected) {
      const found = screen.getAllByRole('link', { name: text });
      expect(found).toHaveLength(1);
    }
  });

  it('does not render unexpected or duplicate navigation items', () => {
    render(<HeaderNavigation />);
    // Ensure there are no extra links beyond the expected set
    const links = screen.getAllByRole('link');
    const labels = links.map((l) => l.textContent?.trim());
    expect(new Set(labels).size).toBe(labels.length); // no duplicates by label

    // Negative checks for a few common/possible mistakes
    expect(screen.queryByRole('link', { name: /home/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /about/i })).not.toBeInTheDocument();
  });

  it('matches a stable snapshot of the rendered navigation structure', () => {
    const { container } = render(<HeaderNavigation />);
    // Snapshot the immediate container of links to catch structural regressions
    // This remains resilient because HeaderNavigationAnchor is mocked to <a>.
    expect(container.firstChild).toMatchSnapshot();
  });
});