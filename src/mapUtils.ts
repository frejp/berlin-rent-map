import { center } from "@turf/turf";
import L from "leaflet";
import type { Feature, FeatureCollection, GeoJsonObject } from 'geojson';

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

export function getCenterOfGeoJson(geoJson: GeoJsonObject | null): [number, number] {
    if (!geoJson) {
        return [51.1657, 10.4515]; // Default center of Germany
    }
    
    try {
        // @ts-ignore - Ignoring type issues with @turf/center as it accepts more types than TypeScript thinks
        const centerPoint = center(geoJson);
        return centerPoint ? [centerPoint.geometry.coordinates[1], centerPoint.geometry.coordinates[0]] : [51.1657, 10.4515];
    } catch (error) {
        console.error('Error calculating center:', error);
        return [51.1657, 10.4515]; // Fallback to center of Germany
    }
}

export function layersUtils(geoJsonRef: React.MutableRefObject<L.GeoJSON | null>, mapRef: React.MutableRefObject<L.Map | null>) {
    function highlightOnClick(e: L.LeafletMouseEvent) {
        const layer = e.target;
        if (layer) {
            layer.setStyle({
                weight: 5,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.7
            });
            layer.bringToFront();
        }
    }

    function resetHighlight(e: L.LeafletMouseEvent) {
        const layer = e.target;
        if (geoJsonRef.current && layer) {
            geoJsonRef.current.resetStyle(layer);
        }
    }

    function zoomToFeature(e: L.LeafletMouseEvent) {
        if (mapRef.current) {
            mapRef.current.fitBounds(e.target.getBounds());
        }
    }

    return {
        highlightOnClick,
        resetHighlight,
        zoomToFeature
    };
}
