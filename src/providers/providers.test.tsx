/**
 * Testing library and framework: Jest + React Testing Library (+ jest-dom)
 * - If using Vitest, replace jest.fn with vi.fn, and jest.resetModules with vi.resetModules as needed.
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

/**
 * We will mock external providers to make their behavior observable and to avoid side-effects.
 * - @tanstack/react-query: mock QueryClientProvider to record the provided client
 * - @tanstack/react-query-devtools: mock to a simple test component exposing its props
 * - @ant-design/nextjs-registry: make it render a wrapper div for easy querying
 * - ./get-query-client: controlled stub to verify call count and identity of client
 */

let mockClient: Record<string, unknown> = { id: 'test-client' };
const getQueryClientMock = jest.fn(() => mockClient);

// Module mocks
jest.mock('./get-query-client', () => ({
  getQueryClient: () => getQueryClientMock(),
}));

// mutable holder to capture the last client prop passed to QueryClientProvider
let lastProvidedClient: unknown = undefined;

jest.mock('@tanstack/react-query', () => {
  const React = require('react');
  return {
    // Keep names consistent with actual library exports used by the component
    QueryClientProvider: ({ client, children }: any) => {
      lastProvidedClient = client;
      return React.createElement('div', { 'data-testid': 'query-client-provider' }, children);
    },
  };
});

jest.mock('@tanstack/react-query-devtools', () => {
  const React = require('react');
  return {
    ReactQueryDevtools: (props: any) =>
      React.createElement('div', { 'data-testid': 'rq-devtools', 'data-initial-is-open': String(props?.initialIsOpen) }),
  };
});

jest.mock('@ant-design/nextjs-registry', () => {
  const React = require('react');
  return {
    AntdRegistry: ({ children }: any) =>
      React.createElement('div', { 'data-testid': 'antd-registry' }, children),
  };
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  lastProvidedClient = undefined;
  // reset NODE_ENV back to 'test' to avoid cross-test contamination
  process.env.NODE_ENV = 'test';
});

describe('Providers', () => {
  // Utility to import fresh Providers with mocks applied
  const importProviders = async () => {
    jest.resetModules();
    return await import('./providers');
  };

  it('renders children inside AntdRegistry and QueryClientProvider (happy path)', async () => {
    const { Providers } = await importProviders();

    render(
      <Providers>
        <div data-testid="child">Hello</div>
      </Providers>
    );

    // Children rendered
    expect(screen.getByTestId('child')).toHaveTextContent('Hello');

    // Wrapped by AntdRegistry stub
    expect(screen.getByTestId('antd-registry')).toBeInTheDocument();

    // QueryClientProvider wrapper present
    expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();

    // getQueryClient invoked exactly once and client passed through
    expect(getQueryClientMock).toHaveBeenCalledTimes(1);
    expect(lastProvidedClient).toBe(mockClient);
  });

  it('does not render ReactQueryDevtools when NODE_ENV is "test"', async () => {
    // default jest env is "test"
    const { Providers } = await importProviders();

    render(
      <Providers>
        <div>Content</div>
      </Providers>
    );

    expect(screen.queryByTestId('rq-devtools')).toBeNull();
  });

  it('renders ReactQueryDevtools in development with initialIsOpen=false', async () => {
    process.env.NODE_ENV = 'development';
    const { Providers } = await importProviders();

    render(
      <Providers>
        <span>Dev Content</span>
      </Providers>
    );

    const devtools = screen.getByTestId('rq-devtools');
    expect(devtools).toBeInTheDocument();
    expect(devtools).toHaveAttribute('data-initial-is-open', 'false');
  });

  it('does not render ReactQueryDevtools in production', async () => {
    process.env.NODE_ENV = 'production';
    const { Providers } = await importProviders();

    render(
      <Providers>
        <span>Prod Content</span>
      </Providers>
    );

    expect(screen.queryByTestId('rq-devtools')).toBeNull();
  });

  it('handles null children gracefully', async () => {
    const { Providers } = await importProviders();

    // Rendering with null children should not throw
    expect(() =>
      render(<Providers>{null as unknown as React.ReactNode}</Providers>)
    ).not.toThrow();

    // Wrappers still present
    expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    expect(screen.getByTestId('antd-registry')).toBeInTheDocument();
  });

  it('propagates errors from getQueryClient (failure path)', async () => {
    getQueryClientMock.mockImplementationOnce(() => {
      throw new Error('failed to create query client');
    });
    const { Providers } = await importProviders();

    // Rendering should throw in this case
    expect(() =>
      render(
        <Providers>
          <div>Should not render</div>
        </Providers>
      )
    ).toThrow('failed to create query client');
  });
});