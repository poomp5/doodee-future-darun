"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

export default function SearchSelect({
  value,
  onChange,
  options,
  placeholder,
  maxResults = 80,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  maxResults?: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const deferredQuery = useDeferredValue(query);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) {
      return options.slice(0, maxResults);
    }
    const results: string[] = [];
    for (const opt of options) {
      if (opt.toLowerCase().includes(q)) {
        results.push(opt);
        if (results.length >= maxResults) break;
      }
    }
    return results;
  }, [deferredQuery, options, maxResults]);

  const display = value || placeholder;

  return (
    <div ref={ref} className="relative flex-1 min-w-[160px]">
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setQuery("");
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:outline-none bg-white ${
          value ? "text-gray-900" : "text-gray-400"
        }`}
      >
        <span className="truncate">{display}</span>
        {value ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setOpen(false);
            }}
            className="ml-1 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        ) : (
          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-1.5">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="พิมพ์เพื่อค้นหา..."
              className="w-full px-2.5 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-pink-500 focus:outline-none"
            />
          </div>
          <ul className="overflow-y-auto max-h-64">
            <li>
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-pink-50 ${
                  !value ? "text-pink-600 font-medium" : "text-gray-500"
                }`}
              >
                {placeholder}
              </button>
            </li>
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400">ไม่พบผลลัพธ์</li>
            ) : (
              filtered.map((opt) => (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => { onChange(opt); setOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-pink-50 ${
                      value === opt ? "text-pink-600 font-medium bg-pink-50" : "text-gray-700"
                    }`}
                  >
                    {opt}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
