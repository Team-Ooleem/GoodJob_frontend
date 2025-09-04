/**
 * Test stack note:
 * - Framework: Jest
 * - Library: @testing-library/react with @testing-library/jest-dom
 * If the repo uses Vitest, this file's RTL patterns remain valid; replace jest.* with vi.* mocks if needed.
 */

import React, { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Default mock for antd Flex to render a simple div and forward props
jest.mock('antd', () => {
  const Actual = jest.requireActual('antd');
  const Flex = ({ children, ...rest }: any) => <div data-testid="flex-root" {...rest}>{children}</div>;
  return { ...Actual, Flex };
});

// Default non-suspending mock for next/image: render a plain img honoring width/height/className/src/alt
jest.mock('next/image', () => {
  // match next/image props subset used in JobCard
  return function Image(props: any) {
    const { src, alt, width, height, className } = props;
    return <img src={String(src)} alt={alt} width={width} height={height} className={className} />;
  };
});

// Import after mocks so JobCard uses mocked deps
import { JobCard } from './JobCard';

const baseProps = {
  imageUrl: '/test-image.jpg',
  title: 'Senior Frontend Engineer',
  company: 'Acme Corp',
  location: 'San Francisco, CA',
  experience: '3-5 years',
};

describe('JobCard', () => {
  test('renders required texts and image with default (large) variant', () => {
    render(<JobCard {...baseProps} />);

    // Text content
    expect(screen.getByRole('heading', { name: baseProps.title })).toBeInTheDocument();
    expect(screen.getByText(baseProps.company)).toBeInTheDocument();
    expect(screen.getByText(baseProps.location)).toBeInTheDocument();
    expect(screen.getByText(baseProps.experience)).toBeInTheDocument();

    // Middle dot separator is present
    expect(screen.getByText('·')).toBeInTheDocument();

    // Image props for large variant
    const img = screen.getByRole('img', { name: '임시 이미지' }) as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('/test-image.jpg'));
    expect(img).toHaveAttribute('width', '264');
    expect(img).toHaveAttribute('height', '176');
    expect(img).toHaveClass('rounded-xl', { exact: false });
    expect(img).toHaveClass('object-cover', { exact: false });
  });

  test('renders small variant with correct image dimensions', () => {
    render(<JobCard {...baseProps} variant="small" />);

    const img = screen.getByRole('img', { name: '임시 이미지' }) as HTMLImageElement;
    expect(img).toHaveAttribute('width', '120');
    expect(img).toHaveAttribute('height', '90');
  });

  test('applies custom style prop to root Flex container', () => {
    const { container } = render(<JobCard {...baseProps} style={{ border: '2px solid rgb(255, 0, 0)' }} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-testid', 'flex-root'); // from our antd Flex mock passthrough
    // JSDOM normalizes styles; check computed inline style string includes the border
    expect(root).toHaveStyle('border: 2px solid rgb(255, 0, 0)');
  });

  test('uses provided alt text string from component (Korean "임시 이미지")', () => {
    render(<JobCard {...baseProps} />);
    expect(screen.getByAltText('임시 이미지')).toBeInTheDocument();
  });

  test('Suspense fallback is shown when image suspends (large variant)', async () => {
    // Re-import with a suspending next/image mock in an isolated module context
    jest.isolateModules(() => {
      jest.doMock('next/image', () => {
        // Component that suspends forever to trigger fallback
        return function SuspendedImage() {
          throw new Promise(() => {});
        };
      });

      const { JobCard: SuspenseJobCard } = require('./JobCard');

      // Wrap in outer Suspense to avoid test crashing due to thrown promise
      const { container } = render(
        <Suspense fallback={null}>
          <SuspenseJobCard {...baseProps} />
        </Suspense>
      );

      // Fallback is a rounded div with neutral bg and large dimensions classes
      const fallbackDiv = container.querySelector('div.rounded-xl.bg-neutral-300');
      expect(fallbackDiv).toBeInTheDocument();
      // Tailwind utility classes for the large variant dimensions
      expect(fallbackDiv).toHaveClass('w-[264px]', { exact: false });
      expect(fallbackDiv).toHaveClass('h-[176px]', { exact: false });
    });
  });

  test('Suspense fallback shows small variant dimensions when variant="small"', async () => {
    jest.isolateModules(() => {
      jest.doMock('next/image', () => {
        return function SuspendedImage() {
          throw new Promise(() => {});
        };
      });

      const { JobCard: SuspenseJobCard } = require('./JobCard');

      const { container } = render(
        <Suspense fallback={null}>
          <SuspenseJobCard {...baseProps} variant="small" />
        </Suspense>
      );

      const fallbackDiv = container.querySelector('div.rounded-xl.bg-neutral-300');
      expect(fallbackDiv).toBeInTheDocument();
      expect(fallbackDiv).toHaveClass('w-[120px]', { exact: false });
      expect(fallbackDiv).toHaveClass('h-[90px]', { exact: false });
    });
  });

  test('gracefully handles unusual strings (edge content)', () => {
    render(
      <JobCard
        {...baseProps}
        title=""
        company="Company • Inc."
        location="Remote — Worldwide"
        experience="0 years"
      />
    );
    // Empty title still renders heading element
    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(screen.getByText('Company • Inc.')).toBeInTheDocument();
    expect(screen.getByText('Remote — Worldwide')).toBeInTheDocument();
    expect(screen.getByText('0 years')).toBeInTheDocument();
  });
});