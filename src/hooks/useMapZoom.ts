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
            // Special case for Pankow - it needs special handling
            if (selectedRegion === "Pankow") {
                try {
                    mapRef.current.fitBounds(featureToZoom, { 
                        padding: [-50, -50], // More aggressive for Pankow
                        animate: true,
                        maxZoom: 12
                    });
                } catch (e) {
                    // Fallback if that fails
                    mapRef.current.setView([52.5663, 13.4121], 11);
                }
                return;
            }
            
            // For Berlin city view
            if (selectedRegion === "Berlin" && currentView === ViewLevel.BEZIRK) {
                try {
                    // Use direct center and zoom level instead of fitBounds
                    // for more consistent results
                    mapRef.current.setView([52.52, 13.405], 11);
                } catch (e) {
                    // Fallback for Berlin
                    mapRef.current.setView([52.52, 13.405], 11);
                }
                return;
            }
            
            // Default case for all other regions
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