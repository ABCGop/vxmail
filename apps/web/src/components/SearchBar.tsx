"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, X, Paperclip, CheckSquare } from "lucide-react";
import { useMail } from "@/lib/mail-context";

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useMail();
  const [inputValue, setInputValue] = useState(searchQuery);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterHasAttachment, setFilterHasAttachment] = useState(false);
  const [filterIsUnread, setFilterIsUnread] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(inputValue.trim());
    setIsFilterOpen(false);
  };

  const handleClear = () => {
    setInputValue("");
    setSearchQuery("");
  };

  const applyAdvancedFilters = () => {
    const parts: string[] = [];
    if (filterFrom.trim()) parts.push(`from:${filterFrom.trim()}`);
    if (filterTo.trim()) parts.push(`to:${filterTo.trim()}`);
    if (filterSubject.trim()) parts.push(`subject:"${filterSubject.trim()}"`);
    if (filterHasAttachment) parts.push("has:attachment");
    if (filterIsUnread) parts.push("is:unread");

    const fullQuery = parts.join(" ");
    setInputValue(fullQuery);
    setSearchQuery(fullQuery);
    setIsFilterOpen(false);
  };

  const addSearchChip = (chip: string) => {
    const newVal = inputValue ? `${inputValue} ${chip}` : chip;
    setInputValue(newVal);
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex-1 max-w-xl" ref={filterRef}>
      <form onSubmit={handleSearchSubmit} className="relative flex items-center">
        <div className="absolute left-3.5 pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          id="vxmail-search-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search mail..."
          className="w-full pl-10 pr-20 py-2 bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl border border-slate-200/80 dark:border-slate-700/80 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 outline-none text-xs transition-all"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {inputValue ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-700"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-mono">
              ⌘K
            </kbd>
          )}

          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`p-1 rounded-lg transition-colors ${
              isFilterOpen
                ? "bg-sky-600 text-white"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700"
            }`}
            title="Advanced search filters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Advanced Search Popover */}
      {isFilterOpen && (
        <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:left-0 sm:right-0 sm:top-auto sm:mt-2 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-dropdown z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Search Filters
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">From</label>
              <input
                type="text"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                placeholder="sarah@vxmusic.in"
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">To</label>
              <input
                type="text"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                placeholder="alex@vxmusic.in"
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Subject</label>
              <input
                type="text"
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                placeholder="Project stems"
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-sky-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterHasAttachment}
                  onChange={(e) => setFilterHasAttachment(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500"
                />
                <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                <span>Has attachment</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterIsUnread}
                  onChange={(e) => setFilterIsUnread(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500"
                />
                <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Is unread</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => addSearchChip("is:unread")}
                className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium"
              >
                + unread
              </button>
              <button
                type="button"
                onClick={() => addSearchChip("has:attachment")}
                className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium"
              >
                + attachment
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFilterFrom("");
                  setFilterTo("");
                  setFilterSubject("");
                  setFilterHasAttachment(false);
                  setFilterIsUnread(false);
                }}
                className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={applyAdvancedFilters}
                className="px-3.5 py-1 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors shadow-sm"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
