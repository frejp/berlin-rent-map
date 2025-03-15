import React, { useRef, useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, ScaleControl, useMap, Tooltip } from "react-leaflet";
import * as L from "leaflet";
import { GeoJsonObject } from 'geojson';
import * as topojson from "topojson-client";
import { getColor, getCenterOfGeoJson, layersUtils } from './mapUtils'
import "leaflet/dist/leaflet.css";
import bundes from "./bundes.json";
import landkreis from "./landskreis.json";
import berlinBezirke from "./berlin_bezirke.json";
import ortsteile from "./ortsteile.json";

// View levels for the map
enum ViewLevel {
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

function geoJSONStyle(feature) {
    return {
        color: "#1f2021",
        weight: 1,
        fillOpacity: 0.5,
        fillColor: getColor(Math.floor(Math.random() * 26))
    };
}

const GeoMap = () => {
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<ViewLevel.BUNDESLAND | ViewLevel.LANDKREIS | ViewLevel.BEZIRK | ViewLevel.ORTSTEIL>(ViewLevel.BUNDESLAND);
    const [history, setHistory] = useState<Array<{level: ViewLevel, name: string}>>([]);
    const [selectedOrtsteil, setSelectedOrtsteil] = useState<string | null>(null);

    // Get the appropriate GeoJSON data based on the current view
    const geoJson = (() => {
        switch (currentView) {
            case ViewLevel.BUNDESLAND:
                return bundes as BundesGeoJSON;
            case ViewLevel.LANDKREIS:
                const allLandkreise = landkreis as LandkreisGeoJSON;
                const filteredFeatures = allLandkreise.features.filter(
                    feature => feature.properties.lan_name?.[0] === selectedRegion
                );
                return filteredFeatures.length > 0 ? {
                    type: "FeatureCollection" as const,
                    features: filteredFeatures
                } : null;
            case ViewLevel.BEZIRK:
                if (selectedRegion === "Berlin") {
                    return berlinBezirke as BezirkGeoJSON;
                }
                return null;
            case ViewLevel.ORTSTEIL:
                if (history[history.length - 2]?.name === "Berlin") {
                    const allOrtsteile = ortsteile as OrtsteileGeoJSON;
                    // Extract BEZNAME from Description HTML for filtering
                    const processedFeatures = allOrtsteile.features.filter(feature => {
                        if (selectedOrtsteil) {
                            return feature.properties.Name === selectedOrtsteil;
                        }
                        const match = feature.properties.Description.match(/BEZNAME<\/td>\s*<td>([^<]+)<\/td>/);
                        return match && match[1] === selectedRegion;
                    });
                    
                    return processedFeatures.length > 0 ? {
                        type: "FeatureCollection",
                        features: processedFeatures
                    } : null;
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
                    switch (currentView) {
                        case ViewLevel.LANDKREIS:
                            name = properties.krs_name?.[0];
                            break;
                        case ViewLevel.BEZIRK:
                            name = properties.name;
                            break;
                        case ViewLevel.ORTSTEIL:
                            name = properties.Name;
                            break;
                        default:
                            name = properties.lan_name?.[0];
                    }
                    setSelectedRegion(name);
                    
                    // Update view level and history
                    let nextLevel: ViewLevel;
                    switch (currentView) {
                        case ViewLevel.BUNDESLAND:
                            nextLevel = name === "Berlin" ? ViewLevel.BEZIRK : ViewLevel.LANDKREIS;
                            break;
                        case ViewLevel.BEZIRK:
                            nextLevel = ViewLevel.ORTSTEIL;
                            break;
                        case ViewLevel.LANDKREIS:
                            nextLevel = currentView;
                            break;
                        case ViewLevel.ORTSTEIL:
                            nextLevel = currentView; // Stay at ORTSTEIL level
                            setSelectedOrtsteil(name); // Set the selected ortsteil
                            return; // Don't update history when clicking on ortsteile
                        default:
                            nextLevel = currentView;
                    }
                    
                    setCurrentView(nextLevel);
                    setHistory([...history, { level: currentView, name }]);
                    
                    // Extract bezirk name for logging if it's an ortsteil
                    if ('Description' in properties) {
                        const bezirkMatch = properties.Description.match(/BEZNAME<\/td>\s*<td>([^<]+)<\/td>/);
                        console.log("Clicked:", name, bezirkMatch ? `(${bezirkMatch[1]})` : '');
                    } else {
                        console.log("Clicked:", name);
                    }
                    layerUtils.zoomToFeature(e);
                }
            });
            
            // Add a tooltip that stays open on hover
            let tooltipContent;
            switch (currentView) {
                case ViewLevel.LANDKREIS:
                    tooltipContent = feature.properties.krs_name?.[0];
                    break;
                case ViewLevel.BEZIRK:
                    tooltipContent = feature.properties.name;
                    break;
                case ViewLevel.ORTSTEIL:
                    const bezirkMatch = feature.properties.Description.match(/BEZNAME<\/td>\s*<td>([^<]+)<\/td>/);
                    tooltipContent = `${feature.properties.Name} (${bezirkMatch ? bezirkMatch[1] : 'Unknown'})`;
                    break;
                default:
                    tooltipContent = feature.properties.lan_name?.[0];
            }

            layer.bindTooltip(tooltipContent, {
                permanent: false,
                direction: 'auto',
                offset: [15, 0],
                className: `${currentView}-tooltip`,
                sticky: true
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
        style.innerHTML = `
            .bundesland-tooltip, .landkreis-tooltip, .bezirk-tooltip, .ortsteil-tooltip {
                background: rgba(255, 255, 255, 0.9);
                border: none;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                padding: 6px 12px;
                font-size: 14px;
                font-weight: 500;
                pointer-events: none;
            }
            .bundesland-tooltip:before, .landkreis-tooltip:before, 
            .bezirk-tooltip:before, .ortsteil-tooltip:before {
                display: none;
            }
            .bundesland-tooltip {
                font-size: 16px;
            }
        `;
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
            setSelectedOrtsteil(null); // Reset selected ortsteil when going back
        }
    };

    // Function to go back to bundesland view
    const handleBackToStart = () => {
        setCurrentView(ViewLevel.BUNDESLAND);
        setSelectedRegion(null);
        setHistory([]);
        setSelectedOrtsteil(null); // Reset selected ortsteil when going back to start
    };

    return (
        <div>
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
                <ScaleControl />
            </MapContainer>
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                {currentView !== ViewLevel.BUNDESLAND && (
                    <>
                        <button 
                            onClick={handleBack}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#fff',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Back
                        </button>
                        <button 
                            onClick={handleBackToStart}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#fff',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Back to States
                        </button>
                    </>
                )}
                {selectedRegion && (
                    <div style={{
                        background: 'white',
                        padding: '10px',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        {`${currentView.charAt(0).toUpperCase() + currentView.slice(1)}: ${selectedRegion}`}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeoMap;
