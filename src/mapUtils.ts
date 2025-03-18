import * as L from "leaflet";
import type { Feature, FeatureCollection, GeoJsonObject } from 'geojson';
import { centroid } from "@turf/turf";
import { mapStyle } from './styles/MapStyles';

export function getColor(d: number): string {
    return d > 25
        ? "#800026"
        : d > 20
            ? "#BD0026"
            : d > 15
                ? "#E31A1C"
                : d > 10
                    ? "#FC4E2A"
                    : d > 5
                        ? "#FD8D3C"
                        : "#FEB24C";
}

/**
 * Get the center coordinates of a GeoJSON object
 * @param geoJson The GeoJSON to find the center of
 * @returns [latitude, longitude] coordinates
 */
export const getCenterOfGeoJson = (geoJson: GeoJsonObject | null): [number, number] => {
    // Default to Berlin center if no geoJson provided
    if (!geoJson) {
        return [52.5200, 13.4050];
    }

    try {
        const features = (geoJson as any).features;
        if (!features || features.length === 0) {
            return [52.5200, 13.4050]; // Berlin center as fallback
        }

        // Try to find a center feature (approximately in the middle of the array)
        const centerFeature = features[Math.floor(features.length / 2)];
        const centerPoint = centroid({
            type: "Feature",
            properties: {},
            geometry: centerFeature.geometry
        });

        return [
            centerPoint.geometry.coordinates[1], 
            centerPoint.geometry.coordinates[0]
        ];
    } catch (error) {
        console.error("Error calculating center of GeoJSON:", error);
        return [52.5200, 13.4050]; // Berlin center as fallback
    }
};

/**
 * Create utility functions for managing layer interactions
 * @param geoJsonRef Reference to the GeoJSON component
 * @param mapRef Reference to the map component
 * @returns Object with utility functions
 */
export const layersUtils = (
    geoJsonRef: React.RefObject<L.GeoJSON | null>,
    mapRef: React.RefObject<L.Map | null>
) => {
    /**
     * Highlight a layer on hover/click
     */
    const highlightOnClick = (e: L.LeafletEvent) => {
        const layer = e.target;
        if (!(layer instanceof L.Path)) return;

        // Save the original style to restore on mouseout
        const originalStyle = Object.assign({}, layer.options);
        (layer as any)._originalStyle = originalStyle;

        // Apply hover style
        layer.setStyle({
            weight: mapStyle.hover.weight,
            color: mapStyle.hover.color,
            fillOpacity: mapStyle.hover.fillOpacity
        });

        // Bring to front if not in IE/Edge
        if (!L.Browser.ie && !L.Browser.edge) {
            layer.bringToFront();
        }
    };

    /**
     * Reset layer highlight on mouseout
     */
    const resetHighlight = (e: L.LeafletEvent) => {
        const layer = e.target;
        if (!(layer instanceof L.Path)) return;

        // Restore original style if available
        if ((layer as any)._originalStyle) {
            layer.setStyle((layer as any)._originalStyle);
        } else if (geoJsonRef.current) {
            // Reset to GeoJSON default style
            geoJsonRef.current.resetStyle(layer);
        }
    };

    return {
        highlightOnClick,
        resetHighlight
    };
};
