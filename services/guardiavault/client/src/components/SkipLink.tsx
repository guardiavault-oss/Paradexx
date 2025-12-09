/**
 * Skip Link Component
 * Provides keyboard users with a way to skip navigation and jump to main content
 * Visible only on keyboard focus (Tab key)
 */

export function SkipLink() {
  return (
    <a 
      href="#main-content" 
      className="skip-to-main"
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
}

