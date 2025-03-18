import React from 'react';
import { getAverageRentForBezirk, getAverageRentForOrtsteil } from '../rentData';
import { ViewLevel, normalizeName } from '../types';

interface RegionInfoProps {
  selectedRegion: string | null;
  selectedOrtsteil: string | null;
  currentView: ViewLevel;
}

/**
 * Component for displaying information about the selected region
 */
const RegionInfo: React.FC<RegionInfoProps> = ({
  selectedRegion,
  selectedOrtsteil,
  currentView
}) => {
  // If nothing is selected, don't show the info box
  if (!selectedRegion || selectedRegion === "Berlin" && !selectedOrtsteil) {
    return null;
  }

  let displayName = '';
  let avgRent = 0;

  if (currentView === ViewLevel.BEZIRK && selectedRegion) {
    displayName = selectedRegion;
    avgRent = getAverageRentForBezirk(normalizeName(selectedRegion));
  } else if (currentView === ViewLevel.ORTSTEIL && selectedOrtsteil) {
    displayName = selectedOrtsteil;
    if (selectedRegion) {
      const normalizedBezirk = normalizeName(selectedRegion);
      avgRent = getAverageRentForOrtsteil(normalizedBezirk, selectedOrtsteil);
    }
  }

  if (!displayName || avgRent === 0) {
    return null;
  }

  return (
    <div className="region-info">
      <h2>{displayName}</h2>
      <p>Average Rent: <strong>{avgRent.toFixed(0)}€</strong></p>
    </div>
  );
};

export default RegionInfo; 