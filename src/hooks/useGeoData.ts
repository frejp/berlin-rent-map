import { useMemo } from 'react';
import { GeoJsonObject } from 'geojson';
import { ViewLevel, OrtsteileGeoJSON } from '../types';
import berlinBezirke from "../berlin_bezirke.json";
import ortsteile from "../ortsteile.json";

/**
 * Custom hook to handle GeoJSON data fetching and processing
 * @param currentView - Current view level (BEZIRK or ORTSTEIL)
 * @param selectedRegion - Selected region name
 * @returns GeoJSON data for the current view and selection
 */
export const useGeoData = (
    currentView: ViewLevel,
    selectedRegion: string | null
): GeoJsonObject | null => {
    return useMemo(() => {
        switch (currentView) {
            case ViewLevel.BEZIRK:
                if (selectedRegion === "Berlin") {
                    return berlinBezirke as unknown as GeoJsonObject;
                }
                return null;
                
            case ViewLevel.ORTSTEIL:
                if (selectedRegion) {
                    const allOrtsteile = ortsteile as OrtsteileGeoJSON;
                    const processedFeatures = allOrtsteile.features.filter(feature => {
                        const match = feature.properties.Description.match(/BEZNAME<\/td>\s*<td>([^<]+)<\/td>/);
                        const bezirkName = match ? match[1] : null;
                        return bezirkName === selectedRegion;
                    });
                    
                    return processedFeatures.length > 0 ? {
                        type: "FeatureCollection" as const,
                        features: processedFeatures
                    } as unknown as GeoJsonObject : null;
                }
                return null;
                
            default:
                return null;
        }
    }, [currentView, selectedRegion]);
}; 