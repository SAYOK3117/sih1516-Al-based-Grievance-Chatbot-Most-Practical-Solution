import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths in bundler environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export interface MapMarkerItem {
  id: string;
  lat: number;
  lng: number;
  title: string;
  category: string;
  dept: string;
  priority: string; // Critical, High, Medium, Low
  status: string;
  location: string;
  assignedAdminId?: string;
  slaDeadlineStr?: string;
  isSlaBreached?: boolean;
  escalatedToDM?: boolean;
  duplicateCount?: number;
  onClick?: () => void;
}

interface LeafletMapProps {
  mode: 'picker' | 'viewer' | 'heatmap';
  center?: [number, number];
  zoom?: number;
  pickerPosition?: { lat: number; lng: number };
  onPickerPositionChange?: (pos: { lat: number; lng: number; address?: string }) => void;
  markers?: MapMarkerItem[];
  selectedMarkerId?: string | null;
  height?: string;
  className?: string;
  /** When true, auto-fits the viewport to all marker coordinates whenever the set of
   *  marker positions changes. Falls back to center/zoom when no valid markers exist.
   *  Safe to enable only for specific call sites — all existing callers default to false. */
  fitBoundsOnMarkersChange?: boolean;
}

export function LeafletMap({
  mode = 'viewer',
  center = [26.8467, 80.9462], // Default Lucknow / UP coordinates
  zoom = 13,
  pickerPosition,
  onPickerPositionChange,
  markers = [],
  selectedMarkerId,
  height = '350px',
  className = '',
  fitBoundsOnMarkersChange = false
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);
  /** Tracks the last seen coordinate fingerprint to avoid re-fitting on unrelated re-renders. */
  const prevMarkerKeyRef = useRef<string>('');

  // Helper to create colored pin SVG icon for Leaflet
  const createColorIcon = (color: string, isEscalated: boolean = false) => {
    const pulseRing = isEscalated
      ? `<circle cx="15" cy="15" r="14" fill="${color}" fill-opacity="0.35"><animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite"/></circle>`
      : '';

    const svgHtml = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40" width="30" height="40">
        ${pulseRing}
        <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 13.5 23.6 14.2 24.3.4.4 1.1.4 1.5 0C16.5 38.6 30 25.5 30 15 30 6.7 23.3 0 15 0z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="15" cy="14" r="5.5" fill="#ffffff"/>
      </svg>
    `;

    return L.divIcon({
      className: 'custom-map-marker',
      html: svgHtml,
      iconSize: [30, 40],
      iconAnchor: [15, 40],
      popupAnchor: [0, -36]
    });
  };

  const getMarkerColor = (item: MapMarkerItem) => {
    if (item.escalatedToDM || item.isSlaBreached || item.priority === 'Critical' || item.priority === 'High') {
      return '#ef4444'; // Red
    }
    if (item.priority === 'Medium' || item.status === 'In Progress') {
      return '#f97316'; // Orange
    }
    return '#10b981'; // Green
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true
      });

      // Standard OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
      markerGroupRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerGroupRef.current = null;
        pickerMarkerRef.current = null;
      }
    };
  }, []);

  // Handle Mode & Marker updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (mode === 'picker') {
      // Picker always flies to the provided center
      if (center && center[0] && center[1]) {
        map.flyTo(center, zoom, { animate: true, duration: 0.8 });
      }
    } else if (fitBoundsOnMarkersChange) {
      // Compute a stable fingerprint from the sorted lat/lng pairs of valid markers
      const validPoints = markers
        .filter(m => m.lat && m.lng && isFinite(m.lat) && isFinite(m.lng))
        .map(m => [m.lat, m.lng] as [number, number]);

      const currentKey = JSON.stringify(
        validPoints.map(([lat, lng]) => [+lat.toFixed(5), +lng.toFixed(5)]).sort()
      );

      if (currentKey !== prevMarkerKeyRef.current) {
        prevMarkerKeyRef.current = currentKey;
        if (validPoints.length > 0) {
          // Fit viewport to all markers with padding; cap zoom to avoid over-zooming a tight cluster
          map.fitBounds(L.latLngBounds(validPoints), { padding: [40, 40], maxZoom: 15 });
        } else {
          // No valid markers — fall back to default center/zoom
          map.setView(center ?? [26.8467, 80.9462], zoom ?? 13);
        }
      }
    } else {
      // Default behaviour: respect the center/zoom props directly
      if (center && center[0] && center[1]) {
        map.setView(center, zoom);
      }
    }

    // Clear previous markers
    if (markerGroupRef.current) {
      markerGroupRef.current.clearLayers();
    }

    if (mode === 'picker') {
      const pos = pickerPosition || { lat: center[0], lng: center[1] };

      const pickerIcon = L.divIcon({
        className: 'picker-map-marker',
        html: `
          <div style="position:relative;">
            <div style="width:36px;height:36px;border-radius:50%;background:rgba(239, 68, 68, 0.2);display:flex;align-items:center;justify-content:center;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:absolute;top:3px;left:3px;width:30px;height:30px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">📍</div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      if (!pickerMarkerRef.current) {
        const marker = L.marker([pos.lat, pos.lng], {
          draggable: true,
          icon: pickerIcon
        }).addTo(map);

        marker.on('dragend', async () => {
          const newPos = marker.getLatLng();
          let address = '';
          try {
            const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos.lat}&lon=${newPos.lng}`);
            const data = await resp.json();
            address = data.display_name || '';
          } catch (e) {
            console.error('Reverse geocoding error:', e);
          }

          if (onPickerPositionChange) {
            onPickerPositionChange({ lat: newPos.lat, lng: newPos.lng, address });
          }
        });

        pickerMarkerRef.current = marker;
      } else {
        pickerMarkerRef.current.setLatLng([pos.lat, pos.lng]);
      }

      map.off('click');
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (pickerMarkerRef.current) {
          pickerMarkerRef.current.setLatLng([lat, lng]);
        }
        let address = '';
        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await resp.json();
          address = data.display_name || '';
        } catch (err) {
          console.error(err);
        }

        if (onPickerPositionChange) {
          onPickerPositionChange({ lat, lng, address });
        }
      });
    } else if (mode === 'viewer') {
      markers.forEach((m) => {
        if (!m.lat || !m.lng) return;

        const color = getMarkerColor(m);
        const icon = createColorIcon(color, !!m.escalatedToDM);

        const marker = L.marker([m.lat, m.lng], { icon });

        const popupContent = `
          <div style="font-family: system-ui, sans-serif; min-width: 220px; padding: 4px;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 6px;">
              <span style="font-weight:bold; font-size:12px; color:#2563eb; font-family: monospace;">${m.id}</span>
              ${m.escalatedToDM ? '<span style="background:#fee2e2; color:#dc2626; border:1px solid #f87171; font-weight:bold; font-size:10px; padding:2px 6px; border-radius:10px;">🔴 DM ESCALATED</span>' : `<span style="background:#f3f4f6; color:#374151; font-size:10px; font-weight:bold; padding:2px 6px; border-radius:10px;">${m.status}</span>`}
            </div>
            <h4 style="margin:0 0 6px 0; font-size:14px; font-weight:600; color:#111827;">${m.title}</h4>
            <div style="font-size:11px; color:#4b5563; margin-bottom:8px; line-height:1.4;">
              <div><strong>Dept:</strong> ${m.dept}</div>
              <div><strong>Priority:</strong> <span style="color:${color}; font-weight:bold;">${m.priority}</span></div>
              <div><strong>Location:</strong> ${m.location}</div>
              ${m.slaDeadlineStr ? `<div><strong>SLA Deadline:</strong> ${m.slaDeadlineStr}</div>` : ''}
              ${m.duplicateCount ? `<div style="color:#d97706; font-weight:bold;">Linked Reports: ${m.duplicateCount}</div>` : ''}
            </div>
            <a href="/track?id=${m.id}" style="display:inline-block; width:100%; text-align:center; background:#2563eb; color:white; font-size:11px; font-weight:600; padding:6px 0; border-radius:6px; text-decoration:none;">View Full Details →</a>
          </div>
        `;

        marker.bindPopup(popupContent);

        if (m.id === selectedMarkerId) {
          setTimeout(() => marker.openPopup(), 300);
        }

        if (markerGroupRef.current) {
          markerGroupRef.current.addLayer(marker);
        }
      });
    } else if (mode === 'heatmap') {
      // Custom Leaflet canvas density heatmap circles visualization
      markers.forEach((m) => {
        if (!m.lat || !m.lng) return;

        const color = m.priority === 'Critical' || m.escalatedToDM ? '#ef4444' : m.priority === 'High' ? '#f97316' : '#eab308';
        const circle = L.circle([m.lat, m.lng], {
          color: color,
          fillColor: color,
          fillOpacity: 0.4,
          radius: 350
        });

        circle.bindTooltip(`<b>${m.location}</b><br/>${m.dept} (${m.priority} Priority)`, { sticky: true });

        if (markerGroupRef.current) {
          markerGroupRef.current.addLayer(circle);
        }
      });
    }
  }, [mode, markers, pickerPosition, selectedMarkerId, center, zoom]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%' }}
      className={`rounded-xl border border-gray-200 dark:border-gray-800 z-0 overflow-hidden shadow-inner ${className}`}
    />
  );
}
