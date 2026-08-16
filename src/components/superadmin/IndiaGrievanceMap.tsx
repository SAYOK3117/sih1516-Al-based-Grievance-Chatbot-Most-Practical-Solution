import { useState, useEffect, useMemo, useRef } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { useStore } from '../../lib/store';
import { getSLAStatus } from '../../lib/slaUtils';
import { Card } from '../ui/Card';
import { MapLegend } from './MapLegend';
import { DistrictGrievancePanel } from './DistrictGrievancePanel';
import { GrievanceList } from './GrievanceList';
import { SuperAdminGrievanceDetails } from './SuperAdminGrievanceDetails';
import { Map, ArrowLeft, Loader2 } from 'lucide-react';

const normalizeStateName = (name: string) => {
  if (!name) return '';
  let clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean === 'up') return 'uttarpradesh';
  if (clean === 'mp') return 'madhyapradesh';
  if (clean === 'andamanandnicobar') return 'andamanandnicobarislands';
  if (clean === 'delhi') return 'nctofdelhi';
  return clean;
};

export function IndiaGrievanceMap() {
  const { grievances } = useStore();
  const [geoData, setGeoData] = useState<any>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedGrievanceId, setSelectedGrievanceId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    // GeoJSON sourced dynamically and completely locally
    fetch('/geo/india-states.geojson')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error('Failed to load India map:', err));
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions(prev => {
          const newWidth = entry.contentRect.width;
          const newHeight = entry.contentRect.height || 600;
          if (prev.width === newWidth && prev.height === newHeight) return prev;
          return { width: newWidth, height: newHeight };
        });
      }
    });
    
    observer.observe(containerRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [geoData, selectedState, selectedDistrict]);

  const stateStats = useMemo(() => {
    const stats: Record<string, any> = {};
    
    grievances.forEach(g => {
      if (!g.state) return;
      const normState = normalizeStateName(g.state);
      
      if (!stats[normState]) {
        stats[normState] = {
          total: 0, active: 0, resolved: 0, overdue: 0, critical: 0, escalated: 0,
          originalName: g.state,
          departments: {} as Record<string, number>
        };
      }
      
      const st = stats[normState];
      st.total++;
      if (g.status === 'Resolved') {
        st.resolved++;
      } else {
        st.active++;
        if (getSLAStatus(g) === 'Overdue') st.overdue++;
        if (g.priority === 'Critical' || g.priority === 'High') st.critical++;
        if (g.escalated) st.escalated++;
      }
      
      st.departments[g.dept] = (st.departments[g.dept] || 0) + 1;
    });
    
    return stats;
  }, [grievances]);

  const getStateColor = (stat: any) => {
    if (!stat || stat.total === 0) return '#f3f4f6';
    const score = stat.active + (stat.overdue * 2);
    if (score === 0) return '#e9d5ff'; 
    if (score < 5) return '#c084fc'; 
    if (score < 15) return '#9333ea'; 
    return '#6b21a8'; 
  };

  const getDarkStateColor = (stat: any) => {
    if (!stat || stat.total === 0) return '#1f2937';
    const score = stat.active + (stat.overdue * 2);
    if (score === 0) return '#4c1d95'; 
    if (score < 5) return '#5b21b6'; 
    if (score < 15) return '#6d28d9'; 
    return '#7c3aed'; 
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltipRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      tooltipRef.current.style.transform = `translate(${e.clientX - rect.left + 15}px, ${e.clientY - rect.top + 15}px)`;
    }
  };



  // Use projection to automatically fit and center the path to our container width/height
  const { projection: _projection, pathGenerator } = useMemo(() => {
    if (!geoData) return { projection: null, pathGenerator: null };
    const proj = geoMercator().fitSize([dimensions.width, dimensions.height], geoData);
    return {
      projection: proj,
      pathGenerator: geoPath().projection(proj)
    };
  }, [dimensions.width, dimensions.height, geoData]);

  const features = geoData?.features || [];

  const mapContent = useMemo(() => {
    if (dimensions.width <= 0 || !geoData || !pathGenerator) return null;
    return (
      <>
        <svg viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 drop-shadow-sm">
          <g>
            {features.map((feature: any) => {
              const rawName = feature.properties.NAME_1 || feature.properties.name || 'Unknown';
              const normName = normalizeStateName(rawName);
              const isSelected = selectedState === rawName;
              
              return (
                <path
                  key={rawName}
                  d={pathGenerator(feature) || ''}
                  className="transition-all duration-300 cursor-pointer outline-none"
                  style={{
                    stroke: isSelected ? '#581c87' : 'rgba(156, 163, 175, 0.4)',
                    strokeWidth: isSelected ? 2 : 1,
                  }}
                  onClick={() => { setSelectedState(rawName); setSelectedDistrict(null); }}
                  onMouseEnter={() => setHoveredState(rawName)}
                  onMouseLeave={() => setHoveredState(null)}
                  data-state={normName}
                />
              );
            })}
          </g>
        </svg>
        
        <style>{`
          ${features.map((f: any) => {
            const rawName = f.properties.NAME_1 || f.properties.name || '';
            const normName = normalizeStateName(rawName);
            const stat = stateStats[normName];
            const isSelected = selectedState === rawName;
            
            return `
              path[data-state="${normName}"] {
                fill: ${isSelected ? '#c084fc' : getStateColor(stat)};
              }
              .dark path[data-state="${normName}"] {
                fill: ${isSelected ? '#8b5cf6' : getDarkStateColor(stat)};
              }
              path[data-state="${normName}"]:hover {
                fill: #d8b4fe !important;
              }
              .dark path[data-state="${normName}"]:hover {
                fill: #a855f7 !important;
              }
            `;
          }).join('\n')}
        `}</style>
      </>
    );
  }, [dimensions.width, dimensions.height, features, selectedState, stateStats, pathGenerator, geoData]);

  if (!geoData) {
    return (
      <Card className="border-gray-100 dark:border-gray-800 shadow-sm min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-purple-600 dark:text-purple-400">
          <Loader2 className="animate-spin" size={40} />
          <p className="font-medium">Loading Geographic Data...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <Card className="border-gray-100 dark:border-gray-800 shadow-sm flex-1 flex flex-col relative overflow-hidden bg-gray-50/50 dark:bg-gray-900/20">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-[#0F1620]/90 backdrop-blur-sm z-10 flex justify-between items-center h-[76px]">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Map size={20} className="text-purple-600 dark:text-purple-400" />
              India-wide Grievance Overview
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm font-medium">
              <button onClick={() => { setSelectedState(null); setSelectedDistrict(null); }} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">India</button>
              {selectedState && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">/</span>
                  <button onClick={() => setSelectedDistrict(null)} className={`hover:underline transition-colors ${!selectedDistrict ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {selectedState}
                  </button>
                </>
              )}
              {selectedDistrict && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">/</span>
                  <span className="text-purple-600 dark:text-purple-400">{selectedDistrict}</span>
                </>
              )}
            </div>
          </div>
          {selectedState && (
            <button 
              onClick={() => selectedDistrict ? setSelectedDistrict(null) : setSelectedState(null)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-purple-700 dark:text-gray-400 dark:hover:text-purple-400 bg-gray-100 hover:bg-purple-50 dark:bg-gray-800 dark:hover:bg-purple-900/40 px-3 py-2 rounded-lg transition-colors shadow-sm"
            >
              <ArrowLeft size={16} /> {selectedDistrict ? 'Back to State' : 'Back to India'}
            </button>
          )}
        </div>

        <div 
          className="flex-1 relative min-h-[600px] w-full" 
          ref={containerRef}
          onMouseMove={handleMouseMove}
        >
          {mapContent}

          <div 
            ref={tooltipRef}
            className={`absolute top-0 left-0 z-50 pointer-events-none bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl p-4 min-w-[200px] transition-opacity duration-150 ${hoveredState ? 'opacity-100' : 'opacity-0'}`}
          >
            {hoveredState && (
              <>
                <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm mb-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                  {hoveredState}
                </h4>
                
                {(() => {
                  const normName = normalizeStateName(hoveredState);
                  const stat = stateStats[normName];
                  
                  if (!stat || stat.total === 0) {
                    return <p className="text-sm text-gray-500 dark:text-gray-400">No active grievances recorded.</p>;
                  }
                  
                  return (
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Total Grievances:</span> <span className="font-semibold text-gray-900 dark:text-white">{stat.total}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Active:</span> <span className="font-semibold text-purple-600 dark:text-purple-400">{stat.active}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Resolved:</span> <span className="font-semibold text-green-600 dark:text-green-400">{stat.resolved}</span></div>
                      {stat.overdue > 0 && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Overdue:</span> <span className="font-semibold text-red-600 dark:text-red-400">{stat.overdue}</span></div>}
                      {stat.critical > 0 && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Critical:</span> <span className="font-semibold text-orange-600 dark:text-orange-400">{stat.critical}</span></div>}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
          
          <MapLegend />
        </div>
      </Card>
      
      {selectedState && !selectedDistrict && (
        <div className="w-full lg:w-96 shrink-0 transition-all duration-300">
          <DistrictGrievancePanel 
            stateName={selectedState} 
            grievances={grievances}
            onSelectDistrict={(district) => setSelectedDistrict(district)}
          />
        </div>
      )}
      
      {selectedState && selectedDistrict && (
        <div className="w-full lg:w-96 shrink-0 transition-all duration-300">
          <GrievanceList 
            districtName={selectedDistrict}
            stateName={selectedState}
            grievances={grievances}
            onSelectGrievance={(id) => setSelectedGrievanceId(id)}
          />
        </div>
      )}

      {selectedGrievanceId && (
        <SuperAdminGrievanceDetails 
          grievance={grievances.find(g => g.id === selectedGrievanceId)!}
          onClose={() => setSelectedGrievanceId(null)}
        />
      )}
    </div>
  );
}
