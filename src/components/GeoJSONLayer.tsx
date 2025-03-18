import React, { useRef } from 'react';
import { GeoJSON } from 'react-leaflet';
import { GeoJsonObject } from 'geojson';
import * as L from 'leaflet';
import { layersUtils } from '../mapUtils';
import { ViewLevel, getBoundsFromFeature } from '../types';
import { mapStyle } from '../styles/MapStyles';
import { getAverageRentForBezirk, getAverageRentForOrtsteil, getRentColor } from '../rentData';
import { normalizeName } from '../types';

interface GeoJSONLayerProps {
    geoJson: GeoJsonObject | null;
    currentView: ViewLevel;
    selectedRegion: string | null;
    selectedOrtsteil: string | null;
    setSelectedOrtsteil: (ortsteil: string | null) => void;
    setCurrentView: (view: ViewLevel) => void;
    setSelectedRegion: (region: string | null) => void;
    setFeatureToZoom: (bounds: L.LatLngBounds | null) => void;
    mapRef: React.RefObject<L.Map | null>;
}

/**
 * Component for rendering GeoJSON data with proper styling and interactions
 */
const GeoJSONLayer: React.FC<GeoJSONLayerProps> = ({
    geoJson,
    currentView,
    selectedRegion,
    selectedOrtsteil,
    setSelectedOrtsteil,
    setCurrentView,
    setSelectedRegion,
    setFeatureToZoom,
    mapRef
}) => {
    const geoJsonRef = useRef<L.GeoJSON | null>(null);

    /**
     * Style function for GeoJSON features based on rent data
     * @param feature GeoJSON feature to style
     * @returns Style object with colors based on rent prices
     */
    function geoJSONStyle(feature: any) {
        // Get the rent data based on the feature
        let rent = 0;
        
        // Berlin bezirke
        if (feature.properties.name) {
            const normalizedName = normalizeName(feature.properties.name);
            rent = getAverageRentForBezirk(normalizedName);
        } 
        // Berlin ortsteile
        else if (feature.properties.Name) {
            const match = feature.properties.Description.match(/BEZNAME<\/td>\s*<td>([^<]+)<\/td>/);
            const bezirkName = match ? match[1] : null;
            if (bezirkName) {
                const normalizedBezirk = normalizeName(bezirkName);
                rent = getAverageRentForOrtsteil(normalizedBezirk, feature.properties.Name);
            }
        }

        // Use consistent coloring: rent data or default gray
        return {
            ...mapStyle.default,
            fillColor: rent > 0 ? getRentColor(rent) : "#e0e0e0" // Default gray for missing data
        };
    }

    /**
     * Handles feature interactions (hover, click)
     * @param feature GeoJSON feature
     * @param layer Leaflet layer
     */
    function onEachFeature(feature: any, layer: L.Layer) {
        let layerUtils = layersUtils(geoJsonRef, mapRef);
        if (layer instanceof L.Path) {
            layer.on({
                mouseover: layerUtils.highlightOnClick,
                mouseout: layerUtils.resetHighlight,
                click: (e) => {
                    const properties = feature.properties;
                    let name;
                    
                    switch (currentView) {
                        case ViewLevel.BEZIRK:
                            name = properties.name || properties.bezirk_name;
                            break;
                        case ViewLevel.ORTSTEIL:
                            name = properties.Name || properties.stadtteil_name;
                            break;
                    }
                    
                    // For Ortsteile, just zoom to the feature
                    if (currentView === ViewLevel.ORTSTEIL) {
                        setSelectedOrtsteil(name);
                        setFeatureToZoom(getBoundsFromFeature(feature));
                        return;
                    }
                    
                    // Update view level for Bezirk clicks
                    if (currentView === ViewLevel.BEZIRK) {
                        // First calculate bounds from the feature
                        const bounds = getBoundsFromFeature(feature);
                        
                        // Then update state AFTER storing the feature bounds 
                        setFeatureToZoom(bounds);
                        
                        // Now update the rest of the state
                        setCurrentView(ViewLevel.ORTSTEIL);
                        setSelectedRegion(name);
                    }
                }
            });
        }
    }

    if (!geoJson) return null;

    return (
        <GeoJSON
            data={geoJson}
            key={`${currentView}-${selectedRegion || ''}-${selectedOrtsteil || ''}`}
            style={geoJSONStyle}
            ref={geoJsonRef}
            onEachFeature={onEachFeature}
        />
    );
};

export default GeoJSONLayer; 