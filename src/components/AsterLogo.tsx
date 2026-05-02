export function AsterLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#fff8fa] ring-1 ring-[#efb5ca]">
        <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 64 64">
          <path
            d="M32 29C26 19 26 9 32 5C38 9 38 19 32 29Z"
            fill="#f472b6"
          />
          <path
            d="M35 31C45 25 55 25 59 32C55 38 45 38 35 32Z"
            fill="#ec4899"
          />
          <path
            d="M32 35C38 45 38 55 32 59C26 55 26 45 32 35Z"
            fill="#be185d"
          />
          <path
            d="M29 32C19 38 9 38 5 32C9 26 19 26 29 32Z"
            fill="#f9a8d4"
          />
          <path
            d="M34 28C36 17 43 10 51 12C53 20 45 27 34 30Z"
            fill="#fb7185"
          />
          <path
            d="M36 34C47 36 54 43 52 51C44 53 37 45 34 36Z"
            fill="#db2777"
          />
          <path
            d="M30 36C28 47 21 54 13 52C11 44 19 37 30 34Z"
            fill="#f0abfc"
          />
          <path
            d="M28 30C17 28 10 21 12 13C20 11 27 19 30 28Z"
            fill="#fbcfe8"
          />
          <circle cx="32" cy="32" fill="#fff7ed" r="7" />
          <circle cx="32" cy="32" fill="#b83263" r="3" />
        </svg>
      </span>
      {!compact ? <span className="text-lg font-semibold tracking-tight">Aster</span> : null}
    </span>
  );
}
