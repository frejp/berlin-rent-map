import React, { useRef, useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, ScaleControl, useMap, Tooltip } from "react-leaflet";
import * as L from "leaflet";
import { GeoJsonObject } from 'geojson';
import { feature } from "topojson-client";
import { getColor, getCenterOfGeoJson, layersUtils } from './mapUtils'
import "leaflet/dist/leaflet.css";
import bundes from "./bundes.json";
import landkreis from "./landskreis.json";
import berlinBezirke from "./berlin_bezirke.json";
import ortsteile from "./ortsteile.json";
import hamburgBezirke from "./app_bezirke_EPSG_4326.json";
import hamburgOrtsteile from "./app_ortsteile_EPSG_4326.json";
import CityMarkers from "./CityMarkers";
import { rentPricesData, getAverageRentForBezirk, getAverageRentForCity, getRentColor, getAverageRentForOrtsteil } from './rentData';

// View levels for the map
export enum ViewLevel {
    BUNDESLAND = 'bundesland',
    LANDKREIS = 'landkreis',
    BEZIRK = 'bezirk',
    ORTSTEIL = 'ortsteil'
}

// Type for the GeoJSON Feature properties
interface BundesFeatureProperties {
    geo_point_2d: { lon: number; lat: number };
    year: string;
    lan_code: string[];
    lan_name: string[];
    lan_area_code: string;
    lan_type: string;
    lan_name_short: null;
}

interface LandkreisFeatureProperties {
    geo_point_2d: { lon: number; lat: number };
    year: string;
    lan_code: string[];
    lan_name: string[];
    krs_code: string[];
    krs_name: string[];
    krs_area_code: string;
    krs_type: string;
    krs_name_short: string[];
    bundesland: string;
}

interface BezirkFeatureProperties {
    name: string;
    description: string;
    cartodb_id: number;
    created_at: string;
    updated_at: string;
}

interface OrtsteileFeatureProperties {
    Name: string;
    Description: string;
}

// Type for the GeoJSON structures
type BundesGeoJSON = {
    type: "FeatureCollection";
    features: Array<{
        type: "Feature";
        geometry: {
            type: "MultiPolygon";
            coordinates: number[][][][];
        };
        properties: BundesFeatureProperties;
    }>;
}

type LandkreisGeoJSON = {
    type: "FeatureCollection";
    features: Array<{
        type: "Feature";
        geometry: {
            type: "MultiPolygon" | "Polygon";
            coordinates: number[][][] | number[][][][];
        };
        properties: LandkreisFeatureProperties;
    }>;
}

type BezirkGeoJSON = {
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

type OrtsteileGeoJSON = {
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

const mapStyle = {
    default: {
        color: "#e4e4e4",
        weight: 1,
        fillOpacity: 0.8,
        fillColor: "#ffffff"
    },
    hover: {
        color: "#666",
        weight: 2,
        fillOpacity: 0.9
    }
};

function geoJSONStyle(feature: any) {
    // Get the rent data based on the feature
    let rent = 0;
    if (feature.properties.name) {
        // For Berlin bezirke
        rent = getAverageRentForBezirk(feature.properties.name);
    } else if (feature.properties.Name) {
        // For Berlin ortsteile
        const match = feature.properties.Description.match(/BEZNAME<\/td>\s*<td>([^<]+)<\/td>/);
        const bezirkName = match ? match[1] : null;
        if (bezirkName) {
            rent = getAverageRentForOrtsteil(bezirkName, feature.properties.Name);
        }
    } else if (feature.properties.bezirk_name) {
        // For Hamburg bezirke
        rent = getAverageRentForBezirk(feature.properties.bezirk_name);
    } else if (feature.properties.stadtteil_name) {
        // For Hamburg ortsteile
        rent = getAverageRentForOrtsteil(feature.properties.bezirk_name, feature.properties.stadtteil_name);
    }

    return {
        ...mapStyle.default,
        fillColor: rent > 0 ? getRentColor(rent) : getColor(Math.floor(Math.random() * 26))
    };
}

const tooltipStyle = {
    className: 'custom-tooltip',
    permanent: false,
    direction: 'auto' as const,
    offset: [15, 0] as [number, number],
    opacity: 0.9,
    sticky: true
};

// Add this CSS to your existing styles
const mapStyles = `
    .custom-tooltip {
        background: rgba(255, 255, 255, 0.95) !important;
        border: none !important;
        border-radius: 8px !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
        padding: 12px 16px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        font-size: 14px !important;
        line-height: 1.4 !important;
    }
    
    .custom-tooltip:before {
        display: none !important;
    }
    
    .rent-value {
        font-size: 18px !important;
        font-weight: 600 !important;
        color: #2c3e50 !important;
        margin-top: 4px !important;
        display: block !important;
    }

    .area-name {
        font-size: 16px !important;
        font-weight: 500 !important;
        color: #34495e !important;
        margin-bottom: 4px !important;
    }
    
    .rent-label {
        font-size: 14px !important;
        color: #7f8c8d !important;
    }
    
    .leaflet-container {
        background: #f8f9fa !important;
    }
    
    .map-controls {
        position: absolute;
        top: 20px;
        right: 20px;
        background: white;
        padding: 12px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .map-button {
        padding: 8px 16px;
        background: white;
        border: 1px solid #e4e4e4;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
    }
    
    .map-button:hover {
        background: #f8f9fa;
        border-color: #ddd;
    }
`;

const GeoMap = () => {
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<ViewLevel.BUNDESLAND | ViewLevel.LANDKREIS | ViewLevel.BEZIRK | ViewLevel.ORTSTEIL>(ViewLevel.BUNDESLAND);
    const [history, setHistory] = useState<Array<{level: ViewLevel, name: string}>>([]);
    const [selectedOrtsteil, setSelectedOrtsteil] = useState<string | null>(null);
    const [selectedLandkreis, setSelectedLandkreis] = useState<string | null>(null);

    // Get the appropriate GeoJSON data based on the current view
    const geoJson: GeoJsonObject | null = (() => {
        switch (currentView) {
            case ViewLevel.BUNDESLAND:
                return bundes as unknown as GeoJsonObject;
            case ViewLevel.LANDKREIS:
                const allLandkreise = landkreis as LandkreisGeoJSON;
                const filteredFeatures = allLandkreise.features.filter(feature => {
                    if (selectedLandkreis) {
                        return feature.properties.krs_name?.[0] === selectedLandkreis;
                    }
                    return feature.properties.lan_name?.[0] === selectedRegion;
                });
                return filteredFeatures.length > 0 ? {
                    type: "FeatureCollection" as const,
                    features: filteredFeatures
                } as unknown as GeoJsonObject : null;
            case ViewLevel.BEZIRK:
                if (selectedRegion === "Berlin") {
                    return berlinBezirke as unknown as GeoJsonObject;
                } else if (selectedRegion === "Hamburg") {
                    return hamburgBezirke as unknown as GeoJsonObject;
                }
                return null;
            case ViewLevel.ORTSTEIL:
                if (history[history.length - 2]?.name === "Berlin") {
                    const allOrtsteile = ortsteile as OrtsteileGeoJSON;
                    const processedFeatures = allOrtsteile.features.filter(feature => {
                        if (selectedOrtsteil) {
                            const cleanSelectedName = selectedOrtsteil.replace(" (Ortsteil)", "");
                            return feature.properties.Name === cleanSelectedName;
                        }
                        const match = feature.properties.Description.match(/BEZNAME<\/td>\s*<td>([^<]+)<\/td>/);
                        const bezirkName = match ? match[1] : null;
                        return bezirkName === selectedRegion && currentView === ViewLevel.ORTSTEIL;
                    });
                    
                    return processedFeatures.length > 0 ? {
                        type: "FeatureCollection" as const,
                        features: processedFeatures
                    } as unknown as GeoJsonObject : null;
                } else if (history[history.length - 2]?.name === "Hamburg") {
                    const allOrtsteile = hamburgOrtsteile as any;
                    const processedFeatures = allOrtsteile.features.filter((feature: any) => {
                        if (selectedOrtsteil) {
                            return feature.properties.stadtteil_name === selectedOrtsteil;
                        }
                        return feature.properties.bezirk_name === selectedRegion;
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
    })();

    function onEachFeature(feature: any, layer: L.Layer) {
        let layerUtils = layersUtils(geoJsonRef, mapRef);
        if (layer instanceof L.Path) {
            layer.on({
                mouseover: (e) => {
                    layerUtils.highlightOnClick(e);
                    const tooltip = layer.getTooltip();
                    if (tooltip && layer instanceof L.Polygon) {
                        const bounds = layer.getBounds();
                        const center = bounds.getCenter();
                        tooltip.setLatLng(center);
                    }
                },
                mouseout: layerUtils.resetHighlight,
                click: (e) => {
                    const properties = feature.properties;
                    let name;
                    let displayName;
                    switch (currentView) {
                        case ViewLevel.LANDKREIS:
                            name = properties.krs_name?.[0];
                            displayName = name;
                            break;
                        case ViewLevel.BEZIRK:
                            name = properties.name || properties.bezirk_name;
                            displayName = name;
                            break;
                        case ViewLevel.ORTSTEIL:
                            if (history[history.length - 2]?.name === "Berlin") {
                                name = properties.Name;
                                const berlinBezirkMatch = properties.Description.match(/BEZNAME<\/td>\s*<td>([^<]+)<\/td>/);
                                const bezirkName = berlinBezirkMatch ? berlinBezirkMatch[1] : null;
                                displayName = name === bezirkName ? `${name} (Ortsteil)` : name;
                            } else {
                                name = properties.stadtteil_name;
                                displayName = name;
                            }
                            break;
                        default:
                            name = properties.lan_name?.[0];
                            displayName = name;
                    }
                    setSelectedRegion(displayName);
                    
                    // Update view level and history
                    let nextLevel: ViewLevel;
                    switch (currentView) {
                        case ViewLevel.BUNDESLAND:
                            nextLevel = name === "Berlin" || name === "Hamburg" ? ViewLevel.BEZIRK : ViewLevel.LANDKREIS;
                            break;
                        case ViewLevel.BEZIRK:
                            nextLevel = ViewLevel.ORTSTEIL;
                            break;
                        case ViewLevel.LANDKREIS:
                            if (name === "Berlin" || name === "Hamburg") {
                                nextLevel = ViewLevel.BEZIRK;
                            } else {
                                nextLevel = currentView;
                                setSelectedLandkreis(name);
                                layerUtils.zoomToFeature(e);
                                return;
                            }
                            break;
                        case ViewLevel.ORTSTEIL:
                            nextLevel = currentView;
                            setSelectedOrtsteil(name);
                            layerUtils.zoomToFeature(e);
                            return;
                        default:
                            nextLevel = currentView;
                    }
                    
                    setCurrentView(nextLevel);
                    setHistory([...history, { level: currentView, name }]);
                }
            });
            
            // Create tooltip content with rent information
            let tooltipContent;
            switch (currentView) {
                case ViewLevel.LANDKREIS:
                    tooltipContent = feature.properties.krs_name?.[0];
                    break;
                case ViewLevel.BEZIRK:
                    const bezirkName = feature.properties.name || feature.properties.bezirk_name;
                    const bezirkRent = getAverageRentForBezirk(bezirkName);
                    tooltipContent = `<div class="area-name">${bezirkName}</div><div class="rent-label">Average Rent</div><div class="rent-value">${bezirkRent.toFixed(2)} €/m²</div>`;
                    break;
                case ViewLevel.ORTSTEIL:
                    let ortsteilName, ortsteilBezirk, ortsteilRent;
                    if (history[history.length - 2]?.name === "Berlin") {
                        const berlinBezirkMatch = feature.properties.Description.match(/BEZNAME<\/td>\s*<td>([^<]+)<\/td>/);
                        ortsteilBezirk = berlinBezirkMatch ? berlinBezirkMatch[1] : 'Unknown';
                        ortsteilName = feature.properties.Name;
                    } else {
                        ortsteilBezirk = feature.properties.bezirk_name;
                        ortsteilName = feature.properties.stadtteil_name;
                    }
                    ortsteilRent = getAverageRentForOrtsteil(ortsteilBezirk, ortsteilName);
                    tooltipContent = `<div class="area-name">${ortsteilName}</div><div class="rent-label">Average Rent</div><div class="rent-value">${ortsteilRent.toFixed(2)} €/m²</div>`;
                    break;
                default:
                    if (feature.properties.lan_name?.[0] === "Berlin" || feature.properties.lan_name?.[0] === "Hamburg") {
                        const cityAvg = getAverageRentForCity(feature.properties.lan_name[0]);
                        tooltipContent = `<div class="area-name">${feature.properties.lan_name[0]}</div><div class="rent-label">Average Rent</div><div class="rent-value">${cityAvg.toFixed(2)} €/m²</div>`;
                    } else {
                        tooltipContent = feature.properties.lan_name?.[0];
                    }
            }

            layer.bindTooltip(tooltipContent, {
                ...tooltipStyle,
                permanent: currentView === ViewLevel.ORTSTEIL || currentView === ViewLevel.BEZIRK
            });
        }
    }

    const mapRef = useRef<L.Map | null>(null);
    const geoJsonRef = useRef<L.GeoJSON | null>(null);

    useEffect(() => {
        if (mapRef.current && geoJsonRef.current) {
            const map = mapRef.current;
            const bounds = geoJsonRef.current.getBounds();
            map.fitBounds(bounds);
        }
    }, [geoJson]);

    // Add CSS for the tooltips
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = mapStyles;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const mapCenter: [number, number] = getCenterOfGeoJson(geoJson);

    // Function to go back one level
    const handleBack = () => {
        if (history.length > 0) {
            const previousState = history[history.length - 2];
            setCurrentView(previousState ? previousState.level : ViewLevel.BUNDESLAND);
            setSelectedRegion(previousState ? previousState.name : null);
            setHistory(history.slice(0, -1));
            setSelectedOrtsteil(null); // Reset selected ortsteil
            setSelectedLandkreis(null); // Reset selected landkreis
        }
    };

    // Function to go back to bundesland view
    const handleBackToStart = () => {
        setCurrentView(ViewLevel.BUNDESLAND);
        setSelectedRegion(null);
        setHistory([]);
        setSelectedOrtsteil(null);
        setSelectedLandkreis(null);
    };

    return (
        <div style={{ position: 'relative' }}>
            <style>{mapStyles}</style>
            <MapContainer 
                className="map" 
                center={mapCenter} 
                zoom={6} 
                style={{ height: "100vh", width: "100%" }} 
                ref={mapRef}
            >
                {geoJson && (
                <GeoJSON
                        data={geoJson as GeoJsonObject}
                        key={`${currentView}-${selectedRegion || ''}`}
                    style={geoJSONStyle}
                    ref={geoJsonRef}
                    onEachFeature={onEachFeature}
                />
                )}
                <CityMarkers 
                    currentView={currentView}
                    selectedLandkreis={selectedLandkreis}
                    selectedRegion={selectedRegion}
                />
                <ScaleControl position="bottomright" />
            </MapContainer>
            <div className="map-controls">
                {currentView !== ViewLevel.BUNDESLAND && (
                    <>
                        <button 
                            onClick={handleBack}
                            className="map-button"
                        >
                            ← Back
                        </button>
                    <button 
                            onClick={handleBackToStart}
                            className="map-button"
                    >
                        Back to States
                    </button>
                    </>
                )}
                {selectedRegion && (
                    <div style={{
                        background: 'white',
                        padding: '10px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#2c3e50',
                        borderTop: '1px solid #e4e4e4',
                        marginTop: '8px'
                    }}>
                        {`${currentView.charAt(0).toUpperCase() + currentView.slice(1)}: ${selectedRegion}`}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeoMap;
