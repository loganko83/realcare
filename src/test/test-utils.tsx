/**
 * Test Utilities
 * Custom render function and common test helpers
 */

import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactElement, type ReactNode } from 'react';

interface WrapperProps {
  children: ReactNode;
}

// Custom wrapper for providers if needed
function AllTheProviders({ children }: WrapperProps) {
  return <>{children}</>;
}

// Custom render that includes providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllTheProviders, ...options }),
  };
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render, userEvent };
