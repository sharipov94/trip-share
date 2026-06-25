/* ── иконки ── */
const s = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export const Icon = {
  home: () => <svg viewBox="0 0 24 24" {...s}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" /></svg>,
  trips: () => <svg viewBox="0 0 24 24" {...s}><path d="M4 7h16M4 12h16M4 17h10" /></svg>,
  money: () => <svg viewBox="0 0 24 24" {...s}><path d="M12 3v18M7 8h7a2.5 2.5 0 0 1 0 5H9a2.5 2.5 0 0 0 0 5h8" /></svg>,
  photo: () => <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="m4 18 5-4 4 3 3-2 4 3" /></svg>,
  user: () => <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" /></svg>,
  arrow: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14M13 6l6 6-6 6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  cam: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" strokeLinejoin="round" /><circle cx="12" cy="12.5" r="3.4" /></svg>,
  back: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 6l-6 6 6 6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14" strokeWidth="2.4" strokeLinecap="round" /></svg>,
}
