import React from 'react';

export default function PlaceholderPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center bg-card rounded-2xl border border-border p-8">
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground">Halaman ini sedang dalam tahap pengembangan (Placeholder).</p>
    </div>
  );
}
