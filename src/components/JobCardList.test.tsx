/**
 * Tests for JobCardList.
 * Testing framework: Jest + React Testing Library.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JobCardList } from './JobCardList';

// Mock the JobCard component since we're testing JobCardList in isolation
jest.mock('./JobCard', () => ({
  JobCard: jest.fn((props: any) => {
    const { title, company, location, variant } = props;
    return (
      <div data-testid="job-card" data-variant={variant}>
        <span>{title}</span>
        <span>{company}</span>
        <span>{location}</span>
      </div>
    );
  }),
}));

// Mock Ant Design Row/Col to make grid props observable
jest.mock('antd', () => ({
  Row: ({ children, gutter, wrap, align, justify, ...rest }: any) => (
    <div
      data-testid="antd-row"
      data-gutter={JSON.stringify(gutter)}
      data-wrap={String(wrap)}
      data-align={align}
      data-justify={justify}
      {...rest}
    >
      {children}
    </div>
  ),
  Col: ({ children, flex, ...rest }: any) => (
    <div data-testid="antd-col" data-flex={flex} {...rest}>
      {children}
    </div>
  ),
}));

const makeJob = (i: number) => ({
  id: String(i),
  imageUrl: `https://example.com/${i}.jpg`,
  title: `Job ${i}`,
  company: `Company ${i}`,
  location: `City ${i}`,
  experience: `${i} years`,
});

describe('JobCardList', () => {
  let jobs: any[];

  beforeEach(() => {
    jobs = [makeJob(1), makeJob(2), makeJob(3)];
    jest.clearAllMocks();
  });

  test('renders the title with expected classes', () => {
    render(<JobCardList title="Featured Jobs" data={jobs} />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Featured Jobs');
    expect(heading).toHaveClass('font-semibold', 'text-xl', 'mb-6');
  });

  test('renders correct number of JobCard components', () => {
    render(<JobCardList title="List" data={jobs} />);
    expect(screen.getAllByTestId('job-card')).toHaveLength(jobs.length);
  });

  test('default variant is large: gutter, wrap, align/justify, and Col flex are correct', () => {
    render(<JobCardList title="Default" data={jobs} />);
    const row = screen.getByTestId('antd-row');
    expect(row).toHaveAttribute('data-gutter', '[20,75]');
    expect(row).toHaveAttribute('data-wrap', 'true');
    expect(row).toHaveAttribute('data-align', 'top');
    expect(row).toHaveAttribute('data-justify', 'start');

    const cols = screen.getAllByTestId('antd-col');
    cols.forEach((col) => expect(col).toHaveAttribute('data-flex', '20%'));

    const { JobCard } = require('./JobCard');
    const mock: jest.Mock = JobCard as jest.Mock;
    expect(mock).toHaveBeenCalledTimes(jobs.length);
    jobs.forEach((job: any, i: number) => {
      expect(mock.mock.calls[i][0]).toEqual(expect.objectContaining({ ...job, variant: 'large' }));
    });
  });

  test('small variant: gutter and Col flex adjust accordingly', () => {
    render(<JobCardList title="Small" data={jobs} variant="small" />);
    const row = screen.getByTestId('antd-row');
    expect(row).toHaveAttribute('data-gutter', '[20,32]');
    const cols = screen.getAllByTestId('antd-col');
    cols.forEach((col) => expect(col).toHaveAttribute('data-flex', '33.33%'));

    const { JobCard } = require('./JobCard');
    const mock: jest.Mock = JobCard as jest.Mock;
    jobs.forEach((_, i: number) => {
      expect(mock.mock.calls[i][0]).toEqual(expect.objectContaining({ variant: 'small' }));
    });
  });

  test('renders no cards when data is empty', () => {
    render(<JobCardList title="Empty" data={[]} />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
    expect(screen.queryByTestId('job-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('antd-col')).not.toBeInTheDocument();
    // Row still renders
    expect(screen.getByTestId('antd-row')).toBeInTheDocument();
  });

  test('updates when data and variant change (rerender)', () => {
    const { rerender } = render(<JobCardList title="Update" data={jobs.slice(0, 2)} variant="large" />);
    expect(screen.getAllByTestId('job-card')).toHaveLength(2);

    rerender(<JobCardList title="Update" data={jobs} variant="small" />);
    expect(screen.getAllByTestId('job-card')).toHaveLength(3);

    const row = screen.getByTestId('antd-row');
    expect(row).toHaveAttribute('data-gutter', '[20,32]');
    screen.getAllByTestId('antd-col').forEach((col) => {
      expect(col).toHaveAttribute('data-flex', '33.33%');
    });
  });

  test('passes all job props through to JobCard (including id and variant)', () => {
    render(<JobCardList title="Props" data={jobs} />);
    const { JobCard } = require('./JobCard');
    const mock: jest.Mock = JobCard as jest.Mock;

    expect(mock.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        ...jobs[0],
        variant: 'large',
      })
    );
  });

  test('does not warn when keys are unique', () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<JobCardList title="Unique Keys" data={jobs} />);
    const hasKeyWarning = errSpy.mock.calls.some(([msg]) => typeof msg === 'string' && /same key|unique "key"/i.test(msg));
    expect(hasKeyWarning).toBe(false);
    errSpy.mockRestore();
  });

  test('warns via console.error when duplicate ids (keys) are provided', () => {
    const dup = makeJob(1);
    dup.id = 'dup';
    const dup2 = makeJob(2);
    dup2.id = 'dup';
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<JobCardList title="Dup Keys" data={[dup, dup2]} />);
    const hasKeyWarning = errSpy.mock.calls.some(([msg]) => typeof msg === 'string' && /same key|unique "key"/i.test(msg));
    expect(hasKeyWarning).toBe(true);
    errSpy.mockRestore();
  });

  test('supports special characters in the title', () => {
    const special = 'Jobs & Opportunities > 2025 | "Featured" <Selection>';
    render(<JobCardList title={special} data={jobs} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(special);
  });

  test('undefined variant defaults to large', () => {
    render(<JobCardList title="Undefined Variant" data={jobs} variant={undefined as any} />);
    const cols = screen.getAllByTestId('antd-col');
    cols.forEach((col) => expect(col).toHaveAttribute('data-flex', '20%'));
  });
});