import { useState, useRef, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface LocationSearchBoxProps {
  onSelect: (result: { lat: number; lng: number; address: string }) => void;
}

export function LocationSearchBox({ onSelect }: LocationSearchBoxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // tracks whether a completed search (success or empty) has run for the current query
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Cancel any pending debounce and reset dropdown state immediately
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setResults([]);
    setSearched(false);

    if (!value.trim()) return;

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=in&limit=5&addressdetails=1`
        );
        const data: NominatimResult[] = await res.json();
        setResults(data || []);
      } catch {
        // Network error — silently clear; never throw or white-screen the page
        setResults([]);
      } finally {
        setIsLoading(false);
        setSearched(true);
      }
    }, 700);
  }, []);

  const handleSelect = (result: NominatimResult) => {
    onSelect({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name,
    });
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  // Show dropdown only after debounce fires (isLoading) or once results / "no results" are ready
  const showDropdown =
    query.trim().length > 0 && (isLoading || results.length > 0 || searched);

  return (
    <div className="relative">
      {/* Search input */}
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-3 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search city, locality, or address (e.g. Kanpur, Hazratganj)..."
          className="w-full pl-9 pr-10 py-2.5 text-sm bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:text-white placeholder:text-gray-400"
        />
        {isLoading && (
          <Loader2
            size={15}
            className="absolute right-3 animate-spin text-gray-400 pointer-events-none"
          />
        )}
      </div>

      {/* Dropdown — z-index 2000 keeps it above Leaflet's tile + control panes */}
      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden"
          style={{ zIndex: 2000 }}
        >
          {isLoading && (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin shrink-0" />
              Searching...
            </div>
          )}

          {!isLoading && searched && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              No results found
            </div>
          )}

          {!isLoading &&
            results.map((res, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(res)}
                className="w-full text-left px-4 py-3 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-0 truncate"
              >
                {res.display_name}
              </button>
            ))}
        </div>
      )}
      
      {/* Attribution required by Nominatim usage policy */}
      <div className="absolute top-full right-0 mt-1">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          Powered by OpenStreetMap
        </span>
      </div>
    </div>
  );
}
