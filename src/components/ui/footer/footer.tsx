/**
 * @file footer.tsx
 * @description Footer público — placeholder.
 */
export const Footer = () => (
  <footer
    className="mt-auto py-8 text-center"
    style={{
      backgroundColor: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-color)',
      color: 'var(--text-muted)',
      fontSize: 'var(--text-sm)',
    }}
  >
    © {new Date().getFullYear()} Joyería KOB — Footer próximamente
  </footer>
);
