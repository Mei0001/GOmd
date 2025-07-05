/**
 * Accessibility utilities and helpers
 */

// Skip link for keyboard navigation
export function createSkipLink(targetId: string, text: string): string {
  return `<a href="#${targetId}" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50">${text}</a>`;
}

// ARIA live region announcements
export class LiveAnnouncer {
  private static instance: LiveAnnouncer;
  private liveElement: HTMLElement | null = null;

  static getInstance(): LiveAnnouncer {
    if (!LiveAnnouncer.instance) {
      LiveAnnouncer.instance = new LiveAnnouncer();
    }
    return LiveAnnouncer.instance;
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this.createLiveElement();
    }
  }

  private createLiveElement(): void {
    this.liveElement = document.createElement('div');
    this.liveElement.setAttribute('aria-live', 'polite');
    this.liveElement.setAttribute('aria-atomic', 'true');
    this.liveElement.className = 'sr-only';
    this.liveElement.id = 'live-announcer';
    document.body.appendChild(this.liveElement);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveElement) {
      this.createLiveElement();
    }

    if (this.liveElement) {
      this.liveElement.setAttribute('aria-live', priority);
      this.liveElement.textContent = message;

      // Clear after announcement to allow repeated messages
      setTimeout(() => {
        if (this.liveElement) {
          this.liveElement.textContent = '';
        }
      }, 1000);
    }
  }
}

// Focus management
export class FocusManager {
  private static focusStack: HTMLElement[] = [];

  static pushFocus(element: HTMLElement): void {
    const currentFocus = document.activeElement as HTMLElement;
    if (currentFocus) {
      this.focusStack.push(currentFocus);
    }
    element.focus();
  }

  static popFocus(): void {
    const previousFocus = this.focusStack.pop();
    if (previousFocus) {
      previousFocus.focus();
    }
  }

  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }
}

// Color contrast utilities
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Simplified luminance calculation
    const rgb = parseInt(color.replace('#', ''), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const sRGB = [r, g, b].map(c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);

  return (brightest + 0.05) / (darkest + 0.05);
}

export function meetsWCAGAAContrast(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 4.5;
}

export function meetsWCAGAAAContrast(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 7;
}

// Keyboard navigation helpers
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const;

export function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === KEYBOARD_KEYS.ENTER || event.key === KEYBOARD_KEYS.SPACE;
}

export function handleActivation(
  event: KeyboardEvent,
  callback: () => void
): void {
  if (isActivationKey(event)) {
    event.preventDefault();
    callback();
  }
}

// ARIA helpers
export function generateUniqueId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createAriaDescribedBy(descriptions: string[]): string {
  return descriptions.filter(Boolean).join(' ');
}

// Screen reader utilities
export function hideFromScreenReader(element: HTMLElement): void {
  element.setAttribute('aria-hidden', 'true');
}

export function showToScreenReader(element: HTMLElement): void {
  element.removeAttribute('aria-hidden');
}

export function setScreenReaderOnly(element: HTMLElement, text: string): void {
  const srElement = document.createElement('span');
  srElement.className = 'sr-only';
  srElement.textContent = text;
  element.appendChild(srElement);
}

// Reduced motion detection
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// High contrast detection
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

// Form accessibility helpers
export function setInvalidField(
  field: HTMLInputElement,
  errorId: string,
  errorMessage: string
): void {
  field.setAttribute('aria-invalid', 'true');
  field.setAttribute('aria-describedby', errorId);
  
  const errorElement = document.getElementById(errorId);
  if (errorElement) {
    errorElement.textContent = errorMessage;
    errorElement.setAttribute('role', 'alert');
  }
}

export function clearFieldError(field: HTMLInputElement, errorId: string): void {
  field.removeAttribute('aria-invalid');
  field.removeAttribute('aria-describedby');
  
  const errorElement = document.getElementById(errorId);
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.removeAttribute('role');
  }
}

// Progress announcement
export function announceProgress(current: number, total: number, label: string): void {
  const announcer = LiveAnnouncer.getInstance();
  const percentage = Math.round((current / total) * 100);
  announcer.announce(`${label}: ${percentage}% complete`, 'polite');
}

// File upload accessibility
export function announceFileSelection(files: FileList): void {
  const announcer = LiveAnnouncer.getInstance();
  const count = files.length;
  const message = count === 1 
    ? `1 file selected: ${files[0].name}`
    : `${count} files selected`;
  announcer.announce(message, 'polite');
}

export function announceFileUploadComplete(filename: string): void {
  const announcer = LiveAnnouncer.getInstance();
  announcer.announce(`File upload complete: ${filename}`, 'assertive');
}

export function announceFileUploadError(filename: string, error: string): void {
  const announcer = LiveAnnouncer.getInstance();
  announcer.announce(`File upload failed for ${filename}: ${error}`, 'assertive');
}

// Modal accessibility
export function makeModalAccessible(modalElement: HTMLElement): () => void {
  const previousFocus = document.activeElement as HTMLElement;
  
  // Set modal properties
  modalElement.setAttribute('role', 'dialog');
  modalElement.setAttribute('aria-modal', 'true');
  modalElement.setAttribute('tabindex', '-1');
  
  // Focus the modal
  modalElement.focus();
  
  // Trap focus
  const cleanupFocusTrap = FocusManager.trapFocus(modalElement);
  
  // Handle escape key
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === KEYBOARD_KEYS.ESCAPE) {
      // Close modal logic should be handled by parent component
      e.stopPropagation();
    }
  };
  
  modalElement.addEventListener('keydown', handleEscape);
  
  // Return cleanup function
  return () => {
    cleanupFocusTrap();
    modalElement.removeEventListener('keydown', handleEscape);
    if (previousFocus) {
      previousFocus.focus();
    }
  };
}

// Table accessibility
export function makeTableAccessible(table: HTMLTableElement): void {
  // Add role if not present
  if (!table.getAttribute('role')) {
    table.setAttribute('role', 'table');
  }
  
  // Ensure headers are properly associated
  const headers = table.querySelectorAll('th');
  headers.forEach((header, index) => {
    if (!header.id) {
      header.id = generateUniqueId('header');
    }
    if (!header.getAttribute('scope')) {
      header.setAttribute('scope', 'col');
    }
  });
  
  // Associate data cells with headers
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    cells.forEach((cell, index) => {
      const header = headers[index];
      if (header && !cell.getAttribute('headers')) {
        cell.setAttribute('headers', header.id);
      }
    });
  });
}