import React from 'react';
import { ViewLevel } from '../types';
import * as L from "leaflet";

interface MapControlsProps {
  currentView: ViewLevel;
  setCurrentView: (view: ViewLevel) => void;
  setSelectedRegion: (region: string | null) => void;
  setSelectedOrtsteil: (ortsteil: string | null) => void;
  setFeatureToZoom: (bounds: L.LatLngBounds | null) => void;
  mapRef: React.RefObject<L.Map>;
}

/**
 * Component for rendering map control buttons
 */
const MapControls: React.FC<MapControlsProps> = ({
  currentView,
  setCurrentView,
  setSelectedRegion,
  setSelectedOrtsteil,
  setFeatureToZoom,
  mapRef
}) => {
  const handleBackToBerlin = () => {
    // Instead of using bounds, set a specific center and zoom level
    // This provides more consistent results than fitBounds
    if (mapRef.current) {
      mapRef.current.setView([52.52, 13.405], 11);
    }
    
    // Update state
    setCurrentView(ViewLevel.BEZIRK);
    setSelectedRegion("Berlin");
    setSelectedOrtsteil(null);
  };

  return (
    <div className="map-controls">
      {currentView === ViewLevel.ORTSTEIL && (
        <button 
          className="map-button"
          onClick={handleBackToBerlin}
        >
          Back to Berlin
        </button>
      )}
    </div>
  );
};

export default MapControls; 