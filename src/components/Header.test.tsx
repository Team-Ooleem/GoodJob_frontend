import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Test framework note:
 * - Runner: Jest or Vitest (whichever the repo uses).
 * - Library: @testing-library/react (+ @testing-library/jest-dom if configured).
 *
 * These tests focus on the Header component structure from the PR diff:
 * - Renders next/image logo with correct alt/src and dimensions
 * - Renders HeaderNavigation child
 * - Renders primary "로그인" and secondary "기업 서비스" buttons
 * - Basic layout container expectations
 */

 // Conditionally use jest/vi for mocking "next/image" and local components
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const isJest = typeof jest !== 'undefined';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const isVitest = typeof vi !== 'undefined';

const mockFn = (impl: any) => {
  if (isVitest) {
    // eslint-disable-next-line no-undef
    return vi.fn(impl as any);
  }
  if (isJest) {
    // eslint-disable-next-line no-undef
    return jest.fn(impl as any);
  }
  return (..._args: any[]) => {};
};

// Mock next/image to render a plain img tag, preserving key props
const mockNextImage = (props: any) => {
  const { src, alt, width, height, ...rest } = props;
  // Next/Image sometimes forwards numeric width/height; cast to string for DOM attributes
  return React.createElement('img', { src, alt, width: String(width ?? ''), height: String(height ?? ''), ...rest });
};

if (isVitest) {
  // eslint-disable-next-line no-undef
  vi.mock('next/image', () => ({ default: mockNextImage }));
} else if (isJest) {
  // eslint-disable-next-line no-undef
  jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => mockNextImage(props),
  }));
}

// Mock antd components with simple passthroughs to avoid style-heavy rendering issues
if (isVitest) {
  // eslint-disable-next-line no-undef
  vi.mock('antd', async () => {
    const ReactMod = await import('react');
    return {
      Flex: ({ children, ...rest }: any) => ReactMod.createElement('div', { 'data-testid': 'antd-flex', ...rest }, children),
      Button: ({ children, ...rest }: any) => ReactMod.createElement('button', { 'data-testid': 'antd-button', ...rest }, children),
    };
  });
} else if (isJest) {
  // eslint-disable-next-line no-undef
  jest.mock('antd', () => {
    const ReactMod = require('react');
    return {
      __esModule: true,
      Flex: ({ children, ...rest }: any) => ReactMod.createElement('div', { 'data-testid': 'antd-flex', ...rest }, children),
      Button: ({ children, ...rest }: any) => ReactMod.createElement('button', { 'data-testid': 'antd-button', ...rest }, children),
    };
  });
}

// Mock HeaderNavigation to a stable sentinel element
if (isVitest) {
  // eslint-disable-next-line no-undef
  vi.mock('./HeaderNavigation', async () => {
    const ReactMod = await import('react');
    const HeaderNavigation = () => ReactMod.createElement('nav', { 'aria-label': 'Header navigation' }, 'HeaderNavigation');
    return { HeaderNavigation };
  });
} else if (isJest) {
  // eslint-disable-next-line no-undef
  jest.mock('./HeaderNavigation', () => {
    const ReactMod = require('react');
    return {
      __esModule: true,
      HeaderNavigation: () => ReactMod.createElement('nav', { 'aria-label': 'Header navigation' }, 'HeaderNavigation'),
    };
  });
}

// Import the component under test (the implementation should live in src/components/Header.tsx)
// If, in this PR, the header implementation ended up in a .test.tsx file by mistake,
// ensure an actual src/components/Header.tsx exists. These tests assume a named export { Header }.
import { Header } from './Header';

describe('Header component', () => {
  test('renders the logo image with correct alt text and src', () => {
    render(<Header />);

    const img = screen.getByAltText('올인원 채용 플랫폼 굿잡') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.tagName.toLowerCase()).toBe('img'); // via our mock
    expect(img.getAttribute('src')).toBe('/assets/good-job-logo.webp');
    // Dimensions per diff: width=40, height=40
    expect(img.getAttribute('width')).toBe('40');
    expect(img.getAttribute('height')).toBe('40');
  });

  test('renders HeaderNavigation within the left Flex container', () => {
    render(<Header />);
    // Our mock renders a nav with an aria-label
    const nav = screen.getByRole('navigation', { name: 'Header navigation' });
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveTextContent('HeaderNavigation');
  });

  test('renders primary and secondary action buttons with correct labels', () => {
    render(<Header />);
    const loginBtn = screen.getByRole('button', { name: '로그인' });
    const corpServiceBtn = screen.getByRole('button', { name: '기업 서비스' });

    expect(loginBtn).toBeInTheDocument();
    expect(corpServiceBtn).toBeInTheDocument();
  });

  test('layout containers exist and include expected Tailwind classes', () => {
    const { container } = render(<Header />);

    // Outer wrapper with border classes from diff
    const outer = container.querySelector('div.w-full.h-auto.border-b-1.border-gray-200');
    expect(outer).toBeInTheDocument();

    // Inner fixed-width container with 1400px width and 60px height per diff
    const inner = container.querySelector('div.mx-auto.w-\\[1400px\\].h-\\[60px\\].flex.justify-between.items-center');
    expect(inner).toBeInTheDocument();
  });

  test('two antd Flex containers are rendered (left for logo/nav, right for actions)', () => {
    render(<Header />);
    const flexes = screen.getAllByTestId('antd-flex');
    expect(flexes).toHaveLength(2);
  });

  test('action buttons are clickable without throwing (no onClick handlers in diff)', async () => {
    const user = userEvent.setup();
    render(<Header />);

    const loginBtn = screen.getByRole('button', { name: '로그인' });
    const corpServiceBtn = screen.getByRole('button', { name: '기업 서비스' });

    await user.click(loginBtn);
    await user.click(corpServiceBtn);

    // No specific side-effects expected; ensure they remain in document
    expect(loginBtn).toBeInTheDocument();
    expect(corpServiceBtn).toBeInTheDocument();
  });

  test('image remains accessible even if HeaderNavigation fails to render', () => {
    // Remock HeaderNavigation to throw to simulate failure of child component
    const ThrowingNav = () => { throw new Error('Nav failed'); };

    // For Jest
    if (isJest) {
      // eslint-disable-next-line no-undef
      jest.doMock('./HeaderNavigation', () => {
        const ReactMod = require('react');
        return {
          __esModule: true,
          HeaderNavigation: () => ReactMod.createElement(ThrowingNav),
        };
      });
      const { Header: HeaderWithThrowingNav } = require('./Header');
      render(<HeaderWithThrowingNav />);
    } else if (isVitest) {
      // eslint-disable-next-line no-undef
      vi.doMock('./HeaderNavigation', async () => {
        const ReactMod = await import('react');
        return { HeaderNavigation: () => ReactMod.createElement(ThrowingNav) };
      });
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Header: HeaderWithThrowingNav } = require('./Header');
      render(<HeaderWithThrowingNav />);
    } else {
      // Fallback: just render the original
      render(<Header />);
    }

    const img = screen.getByAltText('올인원 채용 플랫폼 굿잡');
    expect(img).toBeInTheDocument();
  });
});