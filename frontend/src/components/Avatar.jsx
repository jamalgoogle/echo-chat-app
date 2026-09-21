export default function Avatar({ name = '?', online, size = 'h-11 w-11' }) {
  return (
    <span className={`relative grid ${size} shrink-0 place-items-center rounded-full bg-ink-soft font-semibold text-slate-100`}>
      {name.slice(0, 1).toUpperCase()}
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-ink ${online ? 'bg-emerald-400' : 'bg-slate-500'}`}
          title={online ? 'Online' : 'Offline'}
        />
      )}
    </span>
  );
}
