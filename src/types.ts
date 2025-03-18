import { GeoJsonObject } from 'geojson';
import * as L from "leaflet";

// View levels for the map
export enum ViewLevel {
    BEZIRK = 'bezirk',
    ORTSTEIL = 'ortsteil'
}

// Type for the GeoJSON Feature properties
export interface BezirkFeatureProperties {
    name: string;
    description: string;
    cartodb_id: number;
    created_at: string;
    updated_at: string;
}

export interface OrtsteileFeatureProperties {
    Name: string;
    Description: string;
}

// Type for the GeoJSON structures
export type BezirkGeoJSON = {
    type: "FeatureCollection";
    features: Array<{
        type: "Feature";
        properties: BezirkFeatureProperties;
        geometry: {
            type: "MultiPolygon";
            coordinates: number[][][][];
        };
    }>;
}

export type OrtsteileGeoJSON = {
    type: "FeatureCollection";
    features: Array<{
        type: "Feature";
        geometry: {
            type: "MultiPolygon";
            coordinates: number[][][][];
        };
        properties: OrtsteileFeatureProperties;
    }>;
}

// Type for area labels
export interface AreaLabel {
    position: L.LatLngExpression;
    content: string;
    isDark: boolean;
}

// Type for map styles
export interface MapStyles {
    default: {
        color: string;
        weight: number;
        fillOpacity: number;
        fillColor: string;
    };
    hover: {
        color: string;
        weight: number;
        fillOpacity: number;
    };
}

// Helper function to normalize district names for consistent lookup
export const normalizeName = (name: string): string => {
    return name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss');
};

// Function to determine if background color is dark
export const isColorDark = (color: string): boolean => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
};

// Get bounds from GeoJSON feature
export const getBoundsFromFeature = (feature: any): L.LatLngBounds => {
    const allLatLngs: L.LatLng[] = [];
    
    if (feature.geometry.type === 'Polygon') {
        // For Polygon, use the first (outer) ring
        const coords = feature.geometry.coordinates[0];
        coords.forEach((coord: number[]) => {
            allLatLngs.push(L.latLng(coord[1], coord[0]));
        });
    } else if (feature.geometry.type === 'MultiPolygon') {
        // For MultiPolygon, use all outer rings
        feature.geometry.coordinates.forEach((polygon: number[][][]) => {
            const outerRing = polygon[0];
            outerRing.forEach((coord: number[]) => {
                allLatLngs.push(L.latLng(coord[1], coord[0]));
            });
        });
    }
    
    return L.latLngBounds(allLatLngs);
}; 