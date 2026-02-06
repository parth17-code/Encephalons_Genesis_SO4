import { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const Heatmap = () => {
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWard, setSelectedWard] = useState('all');

  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    fetchHeatmap();
  }, []);

  const fetchHeatmap = async () => {
    try {
      const res = await apiService.getHeatmapData();
      setHeatmapData(res.data.data);
    } catch (err) {
      setError('Failed to load heatmap data');
      console.error('Heatmap fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Convert API societies data to GeoJSON FeatureCollection
   * Uses complianceScore as heatmap weight
   * Inverts score so LOW compliance = HIGH heat (risk visualization)
   */
  const sociesToGeoJSON = (societies) => {
    return {
      type: 'FeatureCollection',
      features: societies.map(society => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [society.lng, society.lat]
        },
        properties: {
          // Invert score: 100 - score means low compliance = high intensity
          weight: 100 - society.complianceScore,
          complianceScore: society.complianceScore,
          complianceStatus: society.complianceStatus,
          societyName: society.societyName,
          ward: society.ward,
          rebatePercent: society.rebatePercent
        }
      }))
    };
  };

  // Initialize Mapbox map
  useEffect(() => {
    if (loading || !heatmapData) return;
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
    
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Dark style shows heatmap better
      center: [72.8777, 19.0760], // Mumbai
      zoom: 11
    });

    // Add controls
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Wait for map to load before adding heatmap layer
    mapRef.current.on('load', () => {
      const geojson = sociesToGeoJSON(heatmapData.societies);

      // Add GeoJSON source
      mapRef.current.addSource('societies-heat', {
        type: 'geojson',
        data: geojson
      });

      // Add heatmap layer
      mapRef.current.addLayer({
        id: 'societies-heatmap',
        type: 'heatmap',
        source: 'societies-heat',
        paint: {
          // Heatmap weight based on inverted compliance score
          // Higher weight = hotter (red) = lower compliance = higher risk
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'weight'],
            0, 0,      // Min weight
            100, 1     // Max weight
          ],

          // Heatmap intensity - increases with zoom for detail
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,      // Low zoom = subtle
            15, 3      // High zoom = intense
          ],

          // Color gradient: GREEN (good) → YELLOW → RED (bad)
          // This represents governance RISK, not performance
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33, 102, 172, 0)',       // Transparent at edges
            0.2, 'rgb(34, 197, 94)',          // Green (low risk)
            0.4, 'rgb(250, 204, 21)',         // Yellow (moderate risk)
            0.6, 'rgb(251, 146, 60)',         // Orange (elevated risk)
            0.8, 'rgb(239, 68, 68)',          // Red (high risk)
            1, 'rgb(153, 27, 27)'             // Dark red (critical risk)
          ],

          // Radius of influence - scales with zoom
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,      // Small radius at low zoom
            9, 20,     // Medium at city level
            15, 40     // Large at neighborhood level
          ],

          // Heatmap opacity
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 0.8,    // More opaque when zoomed out
            15, 0.6    // Slightly transparent when zoomed in
          ]
        }
      });

      // Optional: Add circle layer for precise locations at high zoom
      mapRef.current.addLayer({
        id: 'societies-points',
        type: 'circle',
        source: 'societies-heat',
        minzoom: 13, // Only show when zoomed in
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            13, 4,
            16, 8
          ],
          'circle-color': [
            'match',
            ['get', 'complianceStatus'],
            'GREEN', '#10b981',
            'YELLOW', '#f59e0b',
            'RED', '#ef4444',
            '#6b7280' // default gray
          ],
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 2,
          'circle-opacity': 0.8
        }
      });

      // Fit bounds to show all societies
      const bounds = new mapboxgl.LngLatBounds();
      heatmapData.societies.forEach(society => {
        bounds.extend([society.lng, society.lat]);
      });
      mapRef.current.fitBounds(bounds, { 
        padding: 50,
        maxZoom: 12
      });
    });

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loading, heatmapData]);

  // Update heatmap data when filter changes
  useEffect(() => {
    if (!mapRef.current || !heatmapData) return;
    
    // Wait for map to be loaded
    if (!mapRef.current.isStyleLoaded()) {
      mapRef.current.once('load', updateHeatmapData);
      return;
    }
    
    updateHeatmapData();
    
    function updateHeatmapData() {
      const source = mapRef.current.getSource('societies-heat');
      if (!source) return;

      // Filter societies by ward
      const filteredSocieties = selectedWard === 'all'
        ? heatmapData.societies
        : heatmapData.societies.filter(s => s.ward === selectedWard);

      // Update GeoJSON data
      const geojson = sociesToGeoJSON(filteredSocieties);
      source.setData(geojson);

      // Fit bounds to filtered data
      if (filteredSocieties.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        filteredSocieties.forEach(society => {
          bounds.extend([society.lng, society.lat]);
        });
        mapRef.current.fitBounds(bounds, { 
          padding: 50,
          maxZoom: 13,
          duration: 1000
        });
      }
    }
  }, [selectedWard, heatmapData]);

  const filteredSocieties = selectedWard === 'all'
    ? heatmapData?.societies || []
    : heatmapData?.societies.filter(s => s.ward === selectedWard) || [];

  if (loading) {
    return (
      <Layout title="Compliance Heatmap">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading heatmap data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Compliance Heatmap">
        <div className="bg-red-100 text-red-600 p-4 rounded-lg">{error}</div>
      </Layout>
    );
  }

  return (
    <Layout title="Compliance Heatmap">
      <div className="grid gap-8">
        {/* Heatmap Visualization */}
        {/* Filter Controls */}
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
          <label className="font-semibold text-gray-700">🔍 Filter by Ward:</label>

          <select
            value={selectedWard}
            onChange={e => setSelectedWard(e.target.value)}
            className="border-2 border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Wards</option>
            {heatmapData.wardSummary.map(ward => (
              <option key={ward.ward} value={ward.ward}>
                {ward.ward}
              </option>
            ))}
          </select>

          {selectedWard !== 'all' && (
            <button
              onClick={() => setSelectedWard('all')}
              className="ml-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
            >
              Clear Filter
            </button>
          )}

          <span className="ml-auto text-gray-500">
            Showing <strong className="text-indigo-600">{filteredSocieties.length}</strong> societie(s)
          </span>
        </div>

        {/* Ward Summary Cards */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">📊 Ward-wise Summary</h3>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
            {heatmapData.wardSummary.map(ward => (
              <div
                key={ward.ward}
                onClick={() => setSelectedWard(ward.ward)}
                className={`bg-white rounded-xl p-6 shadow-md cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg ${
                  selectedWard === ward.ward ? 'ring-2 ring-indigo-500' : ''
                }`}
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{ward.ward}</h3>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-indigo-500">
                    {ward.totalSocieties}
                  </span>
                  <span className="text-gray-500">Societies</span>
                </div>

                <div className="mb-4">
                  <div className="h-2 bg-gray-200 rounded overflow-hidden flex">
                    <div
                      className="bg-green-500"
                      style={{ width: `${(ward.greenCount / ward.totalSocieties) * 100}%` }}
                    />
                    <div
                      className="bg-yellow-500"
                      style={{ width: `${(ward.yellowCount / ward.totalSocieties) * 100}%` }}
                    />
                    <div
                      className="bg-red-500"
                      style={{ width: `${(ward.redCount / ward.totalSocieties) * 100}%` }}
                    />
                  </div>

                  <div className="flex gap-4 text-sm font-semibold mt-2">
                    <span className="text-green-500">{ward.greenCount} G</span>
                    <span className="text-yellow-500">{ward.yellowCount} Y</span>
                    <span className="text-red-500">{ward.redCount} R</span>
                  </div>
                </div>

                <p className="text-gray-500">
                  Avg Score: <strong className="text-gray-800">{ward.avgComplianceScore}/100</strong>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Societies List */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">📋 Society Details</h3>
          <div className="grid gap-4">
            {filteredSocieties.map(society => (
              <div 
                key={society.societyName} 
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">
                    {society.societyName}
                  </h4>
                  <StatusBadge status={society.complianceStatus} />
                </div>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-4 text-gray-500 text-sm">
                  <span>🏢 {society.ward}</span>
                  <span>📍 {society.lat.toFixed(4)}, {society.lng.toFixed(4)}</span>
                  <span>📊 Score: {society.complianceScore}/100</span>
                  <span>💰 Rebate: {society.rebatePercent}%</span>
                </div>

                <div className="h-2 bg-gray-200 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      society.complianceStatus === 'GREEN'
                        ? 'bg-green-500'
                        : society.complianceStatus === 'YELLOW'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${society.complianceScore}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-red-600 via-yellow-600 to-green-600">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  🔥 Compliance Risk Heatmap
                </h3>
                <p className="text-white/90">
                  Darker red areas indicate lower compliance scores (higher risk)
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-white text-sm font-semibold mb-2">Heat Legend</div>
                <div className="flex flex-col gap-2 text-xs text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-green-500 rounded"></span>
                    Low Risk (High Compliance)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-yellow-500 rounded"></span>
                    Moderate Risk
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-red-600 rounded"></span>
                    High Risk (Low Compliance)
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div 
            ref={mapContainerRef} 
            className="w-full h-[600px]"
          />
          
          <div className="p-4 bg-gray-50 border-t">
            <p className="text-xs text-gray-600">
              💡 <strong>Tip:</strong> Zoom in to see individual society markers. 
              Heat intensity represents concentration of low-compliance societies.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Heatmap;