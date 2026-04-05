export const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <p className="font-serif text-2xl" style={{ color: 'var(--text-muted)' }}>
      {title} — Próximamente
    </p>
  </div>
);
