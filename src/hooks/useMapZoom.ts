import { useEffect } from 'react';
import * as L from "leaflet";
import { ViewLevel } from '../types';

/**
 * Custom hook to handle map zooming logic
 * @param featureToZoom - The bounds to zoom to
 * @param mapRef - Reference to the Leaflet map
 * @param selectedRegion - Currently selected region
 * @param currentView - Current view level
 */
export const useMapZoom = (
    featureToZoom: L.LatLngBounds | null,
    mapRef: React.RefObject<L.Map>,
    selectedRegion: string | null,
    currentView: ViewLevel
) => {
    // Handle zooming when a region is selected
    useEffect(() => {
        if (featureToZoom && mapRef.current) {
            // Default case for all regions
            mapRef.current.fitBounds(featureToZoom, { 
                padding: [-30, -30], // Negative padding for maximum screen coverage
                animate: true,
                maxZoom: 13 // Limit max zoom
            });
        }
    }, [featureToZoom, selectedRegion, currentView]);

    // Set initial view for Berlin on first load
    useEffect(() => {
        if (mapRef.current) {
            // Use the exact same logic as the Back to Berlin button
            // for consistent behavior on first load
            setTimeout(() => {
                if (mapRef.current) {
                    // Center on central Berlin
                    mapRef.current.setView([52.52, 13.405], 11, {
                        animate: false,
                        duration: 0
                    });
                }
            }, 200); // Slightly longer timeout to ensure map is fully ready
        }
    }, []);

    // No UI returned from this hook
    return null;
}; 