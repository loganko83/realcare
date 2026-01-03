/**
 * Modal Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import { Modal } from './Modal';

describe('Modal', () => {
  describe('Rendering', () => {
    it('renders when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Modal content
        </Modal>
      );
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={() => {}}>
          Modal content
        </Modal>
      );
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Title">
          Content
        </Modal>
      );
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders footer when provided', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} footer={<button>Submit</button>}>
          Content
        </Modal>
      );
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    it('shows close button by default', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('hides close button when showCloseButton is false', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} showCloseButton={false}>
          Content
        </Modal>
      );
      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', async () => {
      const handleClose = vi.fn();
      const { user } = render(
        <Modal isOpen={true} onClose={handleClose}>
          Content
        </Modal>
      );

      await user.click(screen.getByRole('button', { name: /close/i }));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Overlay Click', () => {
    it('closes on overlay click by default', async () => {
      const handleClose = vi.fn();
      const { user } = render(
        <Modal isOpen={true} onClose={handleClose}>
          Content
        </Modal>
      );

      // Click on the overlay (the dialog element itself)
      const overlay = screen.getByRole('dialog');
      await user.click(overlay);
      expect(handleClose).toHaveBeenCalled();
    });

    it('does not close on content click', async () => {
      const handleClose = vi.fn();
      const { user } = render(
        <Modal isOpen={true} onClose={handleClose}>
          <div data-testid="content">Content</div>
        </Modal>
      );

      await user.click(screen.getByTestId('content'));
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('does not close on overlay click when closeOnOverlay is false', async () => {
      const handleClose = vi.fn();
      const { user } = render(
        <Modal isOpen={true} onClose={handleClose} closeOnOverlay={false}>
          Content
        </Modal>
      );

      const overlay = screen.getByRole('dialog').parentElement;
      if (overlay) {
        await user.click(overlay);
        expect(handleClose).not.toHaveBeenCalled();
      }
    });
  });

  describe('Escape Key', () => {
    it('closes on Escape key by default', async () => {
      const handleClose = vi.fn();
      const { user } = render(
        <Modal isOpen={true} onClose={handleClose}>
          Content
        </Modal>
      );

      await user.keyboard('{Escape}');
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not close on Escape when closeOnEscape is false', async () => {
      const handleClose = vi.fn();
      const { user } = render(
        <Modal isOpen={true} onClose={handleClose} closeOnEscape={false}>
          Content
        </Modal>
      );

      await user.keyboard('{Escape}');
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Sizes', () => {
    it('applies md size by default', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );
      // The modal content div is inside the dialog container
      const modalContent = screen.getByText('Content').closest('.max-w-md');
      expect(modalContent).toBeInTheDocument();
    });

    it('applies sm size', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} size="sm">
          Content
        </Modal>
      );
      const modalContent = screen.getByText('Content').closest('.max-w-sm');
      expect(modalContent).toBeInTheDocument();
    });

    it('applies lg size', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} size="lg">
          Content
        </Modal>
      );
      const modalContent = screen.getByText('Content').closest('.max-w-lg');
      expect(modalContent).toBeInTheDocument();
    });

    it('applies xl size', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} size="xl">
          Content
        </Modal>
      );
      const modalContent = screen.getByText('Content').closest('.max-w-xl');
      expect(modalContent).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has role="dialog"', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal="true"', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );
      // aria-modal is on the overlay element which contains role="dialog"
      const overlay = screen.getByRole('dialog');
      expect(overlay).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('Body Scroll Lock', () => {
    it('locks body scroll when open', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', async () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );

      rerender(
        <Modal isOpen={false} onClose={() => {}}>
          Content
        </Modal>
      );

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('');
      });
    });
  });
});
