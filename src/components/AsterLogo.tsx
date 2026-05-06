export function AsterLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white ring-1 ring-[#edc2d1]">
        <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 64 64">
          <path d="M32 30C27 22 27 13 32 9C37 13 37 22 32 30Z" fill="#d9467c" />
          <path d="M34 31C42 26 51 26 55 32C51 37 42 37 34 33Z" fill="#c62f68" />
          <path d="M32 34C37 42 37 51 32 55C27 51 27 42 32 34Z" fill="#a82456" />
          <path d="M30 33C22 38 13 38 9 32C13 27 22 27 30 31Z" fill="#e78bae" />
          <path d="M34 29C37 20 43 15 50 16C50 24 43 29 34 31Z" fill="#dc6f99" />
          <path d="M35 35C44 37 49 43 48 50C41 50 36 44 33 35Z" fill="#b83263" />
          <path d="M29 35C27 44 21 49 14 48C14 41 21 36 30 33Z" fill="#efb5ca" />
          <path d="M29 29C20 27 15 21 16 14C23 14 28 21 31 30Z" fill="#f4c7d8" />
          <circle cx="32" cy="32" fill="#fff8fa" r="6" />
          <circle cx="32" cy="32" fill="#8f244d" r="2.5" />
        </svg>
      </span>
      {!compact ? <span className="text-lg font-black tracking-[-0.03em]" style={{ color: "var(--text)" }}>Aster</span> : null}
    </span>
  );
}
