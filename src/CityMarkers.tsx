import React from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
import { majorGermanCities } from './cities';
import { ViewLevel } from './GeoMap';

interface CityMarkersProps {
    currentView: ViewLevel;
    selectedLandkreis: string | null;
    selectedRegion: string | null;
}

const CITY_STATES = ['Berlin', 'Hamburg', 'Bremen'];

const CityMarkers: React.FC<CityMarkersProps> = ({ currentView, selectedLandkreis, selectedRegion }) => {
    // Don't show markers when:
    // 1. A specific landkreis is selected
    // 2. A city-state is selected
    if (selectedLandkreis || (selectedRegion && CITY_STATES.includes(selectedRegion))) {
        return null;
    }

    return (
        <>
            {majorGermanCities.map((city) => (
                <CircleMarker
                    key={city.name}
                    center={city.coordinates}
                    radius={Math.min(Math.log(city.population / 20000), 6)}
                    pathOptions={{
                        fillColor: '#e41a1c',
                        color: '#000',
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8,
                    }}
                >
                    <Tooltip 
                        permanent
                        direction="top"
                        offset={[0, -8]}
                        className="city-tooltip"
                    >
                        {city.name}
                    </Tooltip>
                </CircleMarker>
            ))}
        </>
    );
};

export default CityMarkers; 