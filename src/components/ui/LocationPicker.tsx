import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { Button } from './Button';

// Fix Leaflet's default icon path issues in React/Vite bundler
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export interface LocationPickerCoords {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  /** The editable address string shown below the map */
  address: string;
  onChangeAddress: (address: string) => void;
  /** Parent can push a position in (e.g. from GPS watchPosition) to move the map/pin */
  coords?: LocationPickerCoords;
  /** Fires on map click, pin drag, search selection, and "Use Current Location" */
  onCoordsChange?: (coords: LocationPickerCoords) => void;
}

// Inner component: pans the map when centerPos changes and forwards map clicks
function MapController({ centerPos, onMapClick }: { centerPos: L.LatLng | null, onMapClick: (latlng: L.LatLng) => void }) {
  const map = useMap();
  
  useEffect(() => {
    if (centerPos) {
      // Preserve current zoom if already zoomed in beyond 14; otherwise zoom to 14
      map.flyTo(centerPos, Math.max(map.getZoom(), 14), { animate: true, duration: 0.8 });
    }
  }, [centerPos, map]);

  useMapEvents({
    click(e: any) {
      onMapClick(e.latlng);
    },
  });

  return null;
}

export function LocationPicker({ address, onChangeAddress, coords, onCoordsChange }: LocationPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markerRef = useRef<L.Marker>(null);
  // Tracks coords we set ourselves to skip re-pan when our onCoordsChange causes the parent
  // to write the same value back via the `coords` prop (prevents ping-pong)
  const lastOwnCoordsRef = useRef<LocationPickerCoords | null>(null);

  // Default to central India view before any pin is placed
  const defaultCenter: L.LatLngExpression = [20.5937, 78.9629];
  const defaultZoom = 5;

  // Sync parent-driven coords (e.g. GPS watchPosition updates) into the map/pin
  useEffect(() => {
    if (!coords) return;
    const last = lastOwnCoordsRef.current;
    // Skip if this value originated from us — avoids the parent echoing our callback back
    if (
      last &&
      Math.abs(last.lat - coords.lat) < 0.0001 &&
      Math.abs(last.lng - coords.lng) < 0.0001
    ) return;
    setPosition(new L.LatLng(coords.lat, coords.lng));
  }, [coords]);

  // NOTE (production): Nominatim enforces a max 1 req/sec and requires a User-Agent.
  // The 800ms debounce on search and per-action calls here keep demo usage within fair-use.
  // For production traffic: proxy via your own backend or switch to a paid geocoder.
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      onChangeAddress(data?.display_name || `Lat: ${lat.toFixed(4)}, Lng: ${lon.toFixed(4)}`);
    } catch {
      // Network/geocoding failure — fallback to coordinates; form still works
      onChangeAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lon.toFixed(4)}`);
    }
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`
        );
        setSearchResults((await res.json()) || []);
      } catch {
        // Search failure — silently clear; user can still click map or drag pin
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 800); // 800ms debounce
  }, []);

  const selectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    lastOwnCoordsRef.current = { lat, lng };
    setPosition(new L.LatLng(lat, lng));
    onChangeAddress(result.display_name);
    onCoordsChange?.({ lat, lng });
    setSearchQuery('');
    setSearchResults([]);
  };

  // Option B: internal button also fires onCoordsChange so parent state stays in sync
  const handleCurrentLocation = () => {
    setIsLocating(true);
    if (!('geolocation' in navigator)) {
      setIsLocating(false);
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude: lat, longitude: lng } = pos.coords;
        lastOwnCoordsRef.current = { lat, lng };
        setPosition(new L.LatLng(lat, lng));
        reverseGeocode(lat, lng);
        onCoordsChange?.({ lat, lng });
      },
      () => {
        setIsLocating(false);
        alert('Could not get location. Please check your browser permissions or enter the address manually.');
      }
    );
  };

  const handleMapClick = (latlng: L.LatLng) => {
    lastOwnCoordsRef.current = { lat: latlng.lat, lng: latlng.lng };
    setPosition(latlng);
    reverseGeocode(latlng.lat, latlng.lng);
    onCoordsChange?.({ lat: latlng.lat, lng: latlng.lng });
  };

  const handleMarkerDragEnd = () => {
    const marker = markerRef.current;
    if (!marker) return;
    const { lat, lng } = marker.getLatLng();
    lastOwnCoordsRef.current = { lat, lng };
    setPosition(marker.getLatLng());
    reverseGeocode(lat, lng);
    onCoordsChange?.({ lat, lng });
  };

  return (
    <div className="relative flex flex-col space-y-3">
      {/* Search Bar */}
      <div className="relative z-[1000]">
        <div className="relative flex items-center">
          <Search size={18} className="absolute left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search city, locality, or address in India..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
          />
          {isSearching && <Loader2 size={16} className="absolute right-3 animate-spin text-gray-400" />}
        </div>
        
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((res, i) => (
              <div 
                key={i} 
                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-sm dark:text-gray-200 border-b border-gray-100 dark:border-gray-800 last:border-0"
                onClick={() => selectSearchResult(res)}
              >
                {res.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative h-[300px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <MapContainer 
          center={defaultCenter} 
          zoom={defaultZoom} 
          style={{ height: '100%', width: '100%', zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {position && (
            <Marker 
              position={position} 
              draggable={true}
              ref={markerRef}
              eventHandlers={{ dragend: handleMarkerDragEnd }}
            />
          )}
          <MapController centerPos={position} onMapClick={handleMapClick} />
        </MapContainer>

        {/* Floating action for Current Location */}
        <Button 
          type="button" 
          onClick={handleCurrentLocation} 
          isLoading={isLocating} 
          className="absolute bottom-4 right-4 shadow-lg z-[1000] bg-white text-gray-800 hover:bg-gray-50 dark:bg-surface-dark dark:text-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 h-9 px-3"
          size="sm"
        >
          <MapPin size={16} className="mr-2" /> Use Current Location
        </Button>
      </div>

      {/* Manual Address Edit */}
      <div className="bg-white dark:bg-surface-dark p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 flex items-center">
        <MapPin size={16} className="text-gray-400 mr-3 shrink-0" />
        <input 
          type="text" 
          value={address} 
          onChange={(e) => onChangeAddress(e.target.value)} 
          placeholder="Drag pin or type exact address here..."
          className="w-full bg-transparent border-none focus:outline-none text-sm dark:text-white" 
        />
      </div>
    </div>
  );
}
