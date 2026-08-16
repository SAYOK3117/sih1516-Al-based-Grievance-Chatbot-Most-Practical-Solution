export interface LatLng {
  lat: number;
  lng: number;
}

// In-memory cache for the current session
const memoryCache = new Map<string, LatLng | null>();

// Hardcoded fallback for the generic demo seed addresses so the map isn't empty on load
const SEED_FALLBACKS: Record<string, LatLng> = {
  'Sector 4 Market Road, City Center': { lat: 28.6139, lng: 77.2090 }, // New Delhi center
  'Sector 9, Phase 2': { lat: 28.6200, lng: 77.2150 }, // Nearby New Delhi
};

export async function geocodeLocation(address: string): Promise<LatLng | null> {
  if (!address) return null;
  const trimmed = address.trim();

  // 1. Check in-memory cache
  if (memoryCache.has(trimmed)) {
    return memoryCache.get(trimmed) || null;
  }

  // 2. Check localStorage cache
  try {
    const localCacheStr = localStorage.getItem('suvas_geocode_cache');
    if (localCacheStr) {
      const localCache = JSON.parse(localCacheStr);
      if (localCache && localCache[trimmed] !== undefined) {
        memoryCache.set(trimmed, localCache[trimmed]);
        return localCache[trimmed];
      }
    }
  } catch (e) {
    console.error('Failed to read geocode cache from localStorage', e);
  }

  // 3. Check hardcoded fallbacks
  if (SEED_FALLBACKS[trimmed]) {
    const result = SEED_FALLBACKS[trimmed];
    saveToCache(trimmed, result);
    return result;
  }

  // 4. Hit Nominatim API
  try {
    // Note: Nominatim requires a user-agent, but browsers don't allow setting it easily via fetch.
    // It works for low-volume demo requests, but a real app needs a backend or a paid geocoder.
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&countrycodes=in&limit=1`);
    if (!res.ok) {
      throw new Error(`Geocoding failed: ${res.statusText}`);
    }
    
    const data = await res.json();
    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
      saveToCache(trimmed, result);
      return result;
    }
    
    // Cache the null result so we don't spam the API with invalid addresses
    saveToCache(trimmed, null);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    // Don't cache network errors so it can retry later
    return null;
  }
}

function saveToCache(address: string, result: LatLng | null) {
  memoryCache.set(address, result);
  try {
    const localCacheStr = localStorage.getItem('suvas_geocode_cache');
    const localCache = localCacheStr ? JSON.parse(localCacheStr) : {};
    localCache[address] = result;
    localStorage.setItem('suvas_geocode_cache', JSON.stringify(localCache));
  } catch (e) {
    console.error('Failed to write geocode cache to localStorage', e);
  }
}
