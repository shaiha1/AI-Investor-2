import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TickerAutocomplete({ value, onChange, onSelect, placeholder, className }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);

    clearTimeout(debounceRef.current);
    if (val.trim().length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke("searchTickers", { query: val.trim() });
        setSuggestions(res.data.results || []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleSelect = (item) => {
    onSelect(item.symbol, item.name);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin pointer-events-none z-10" />
      )}
      <Input
        value={value}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className={cn("pl-9 h-10 bg-background border-border text-sm", className)}
        autoComplete="off"
      />

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-xl overflow-hidden">
          <ul>
            {suggestions.map((item) => (
              <li key={item.symbol}>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(item)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left"
                >
                  <div className="h-7 w-10 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-primary leading-none text-center px-0.5 truncate">{item.symbol.slice(0, 5)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{item.symbol}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.name}</p>
                  </div>
                  {item.region && (
                    <span className="text-[10px] text-muted-foreground/60 shrink-0">{item.region}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}