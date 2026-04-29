"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-xs font-semibold uppercase tracking-widest hover:brightness-110 transition-all"
    >
      <span className="material-symbols-outlined text-base">print</span>
      Imprimir
    </button>
  );
}
