import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Page from '@/app/page';

// Mock the ImageGallery component
vi.mock('@/app/components/ImageGallery', () => {
  return {
    default: () => <div data-testid="mock-gallery" />,
  };
});

test('Page renders header', () => {
  render(<Page />);
  expect(
    screen.getByRole('heading', { level: 1, name: 'CYBERPUNK GRID TEST' }),
  ).toBeDefined();

  // Optional: assert the mock gallery exists
  expect(screen.getByTestId('mock-gallery')).toBeDefined();
});
