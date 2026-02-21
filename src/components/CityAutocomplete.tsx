"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const COUNTRY_CODES: Record<string, string> = {
  Deutschland: "de",
  Österreich: "at",
  Schweiz: "ch",
  Niederlande: "nl",
  Belgien: "be",
  Frankreich: "fr",
};

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
  };
  type: string;
  class: string;
}

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  country?: string;
  disabled?: boolean;
  name?: string;
  placeholder?: string;
  className?: string;
}

export default function CityAutocomplete({
  value,
  onChange,
  country,
  disabled,
  name,
  placeholder = "z.B. Frankfurt, Berlin",
  className = "",
}: CityAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchCities = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const countryCode = country ? COUNTRY_CODES[country] : undefined;
        const params = new URLSearchParams({
          q: query,
          format: "json",
          limit: "8",
          addressdetails: "1",
          featuretype: "city",
          "accept-language": "de",
        });

        if (countryCode) {
          params.set("countrycodes", countryCode);
        }

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          { headers: { "Accept-Language": "de" } }
        );

        if (!res.ok) return;

        const data: NominatimResult[] = await res.json();

        const cities = data
          .map((r) => {
            const addr = r.address;
            return (
              addr.city ||
              addr.town ||
              addr.village ||
              addr.municipality ||
              addr.county ||
              ""
            );
          })
          .filter(Boolean)
          .filter((c, i, arr) => arr.indexOf(c) === i); // Duplikate entfernen

        setSuggestions(cities);
        setIsOpen(cities.length > 0);
        setActiveIndex(-1);
      } catch {
        // Bei Netzwerkfehler einfach keine Vorschläge zeigen
      } finally {
        setIsLoading(false);
      }
    },
    [country]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCities(val), 300);
  };

  const handleSelect = (city: string) => {
    onChange(city);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  // Schließen wenn außerhalb geklickt wird
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const baseClass =
    "w-full px-4 py-2.5 rounded-lg bg-white border border-border text-foreground placeholder-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          name={name}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={baseClass}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-border rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((city, idx) => (
            <li
              key={city}
              onMouseDown={() => handleSelect(city)}
              className={`px-4 py-2.5 cursor-pointer text-sm text-foreground transition-colors ${
                idx === activeIndex
                  ? "bg-accent-light/40 text-primary font-medium"
                  : "hover:bg-accent-light/20"
              }`}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
