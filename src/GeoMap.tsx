import React, { useRef, useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, ScaleControl, useMap, Tooltip, Marker } from "react-leaflet";
import * as L from "leaflet";
import { GeoJsonObject } from 'geojson';
import { feature } from "topojson-client";
import { getColor, getCenterOfGeoJson, layersUtils } from './mapUtils'
import { center, centroid } from "@turf/turf";
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
    .map {
        height: 100vh;
        width: 100%;
    }

    .map-controls {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 200px;
        margin: 0 auto;
        background: white;
        padding: 10px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .map-button {
        background: white;
        border: 1px solid #ccc;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        color: #2c3e50;
        width: 100%;
        text-align: center;
        transition: background-color 0.2s;
        white-space: normal;
        word-wrap: break-word;
        min-height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .map-button:hover {
        background: #f5f5f5;
    }

    .region-info {
        background: white;
        padding: 8px;
        border-radius: 4px;
        font-size: 14px;
        color: #2c3e50;
        text-align: center;
        width: 100%;
        word-wrap: break-word;
        white-space: normal;
        line-height: 1.3;
    }

    .custom-tooltip {
        background: white;
        border: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 14px;
        color: #2c3e50;
    }

    /* Make the marker div transparent to mouse events */
    .leaflet-marker-icon {
        pointer-events: none !important;
    }

    /* Make the marker pane still receive events */
    .leaflet-marker-pane {
        pointer-events: auto;
    }

    .area-label {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        z-index: 1000 !important;
    }

    .area-label-content {
        text-align: center;
        font-size: 12px;
        font-weight: 500;
        text-shadow: 0px 0px 2px rgba(255,255,255,1),
                     0px 0px 4px rgba(255,255,255,1),
                     0px 0px 6px rgba(255,255,255,1);
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;
        max-width: 120px;
        word-wrap: break-word;
        hyphens: auto;
        -webkit-hyphens: auto;
    }

    .area-label-light {
        color: #fff;
        text-shadow: 0px 0px 2px rgba(0,0,0,0.8),
                     0px 0px 4px rgba(0,0,0,0.8),
                     0px 0px 6px rgba(0,0,0,0.8);
    }

    .area-label-dark {
        color: #000;
        text-shadow: 0px 0px 2px rgba(255,255,255,1),
                     0px 0px 4px rgba(255,255,255,1),
                     0px 0px 6px rgba(255,255,255,1);
    }

    .area-name {
        font-weight: 600;
        margin-bottom: 2px;
        word-break: break-word;
        hyphens: auto;
        -webkit-hyphens: auto;
    }

    .area-rent {
        font-weight: 500;
    }
`;

const GeoMap = () => {
    const [selectedRegion, setSelectedRegion] = useState<string | null>("Berlin");
    const [currentView, setCurrentView] = useState<ViewLevel.BUNDESLAND | ViewLevel.LANDKREIS | ViewLevel.BEZIRK | ViewLevel.ORTSTEIL>(ViewLevel.BEZIRK);
    const [history, setHistory] = useState<Array<{level: ViewLevel, name: string}>>([{level: ViewLevel.BUNDESLAND, name: "Berlin"}]);
    const [selectedOrtsteil, setSelectedOrtsteil] = useState<string | null>(null);
    const [selectedLandkreis, setSelectedLandkreis] = useState<string | null>(null);
    const [areaLabels, setAreaLabels] = useState<Array<{position: L.LatLng, content: string, isDark: boolean}>>([]);
    const [featureToZoom, setFeatureToZoom] = useState<L.LatLngBounds | null>(null);

    // Get the appropriate GeoJSON data based on the current view
    const geoJson: GeoJsonObject | null = useMemo(() => {
        switch (currentView) {
            case ViewLevel.BEZIRK:
                if (selectedRegion === "Berlin") {
                    return berlinBezirke as unknown as GeoJsonObject;
                } else if (selectedRegion === "Hamburg") {
                    return hamburgBezirke as unknown as GeoJsonObject;
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

    // Function to determine if background color is dark
    const isColorDark = (color: string): boolean => {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness < 128;
    };

    // Update area labels when geoJson changes
    useEffect(() => {
        if (!geoJson) {
            setAreaLabels([]);
            return;
        }

        const features = (geoJson as any).features;
        const newLabels = features.map((feature: any) => {
            let name = '';
            let rent = 0;
            
            if (currentView === ViewLevel.BEZIRK) {
                name = feature.properties.name || feature.properties.bezirk_name;
                if (name) {
                    const normalizedName = name.toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/ä/g, 'ae')
                        .replace(/ö/g, 'oe')
                        .replace(/ü/g, 'ue')
                        .replace(/ß/g, 'ss');
                    rent = getAverageRentForBezirk(normalizedName);
                }
            } else if (currentView === ViewLevel.ORTSTEIL) {
                name = feature.properties.Name;
                if (name) {
                    const berlinBezirkMatch = feature.properties.Description.match(/BEZNAME<\/td>\s*<td>([^<]+)<\/td>/);
                    const bezirkName = berlinBezirkMatch ? berlinBezirkMatch[1] : null;
                    
                    if (bezirkName) {
                        const normalizedBezirk = bezirkName.toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/ä/g, 'ae')
                            .replace(/ö/g, 'oe')
                            .replace(/ü/g, 'ue')
                            .replace(/ß/g, 'ss');
                        
                        rent = getAverageRentForOrtsteil(normalizedBezirk, name);
                    }
                }
            }

            if (!name || rent === 0) {
                return null;
            }

            try {
                const centerPoint = centroid({
                    type: "Feature",
                    properties: {},
                    geometry: feature.geometry
                });
                const center = [centerPoint.geometry.coordinates[1], centerPoint.geometry.coordinates[0]];

                const fillColor = getRentColor(rent);
                const isDark = isColorDark(fillColor);

                return {
                    position: center as L.LatLngExpression,
                    content: `<div class="area-name">${name}</div><div class="area-rent">${rent.toFixed(0)}€/m²</div>`,
                    isDark
                };
            } catch (error) {
                console.error('Error calculating centroid:', error);
                return null;
            }
        }).filter(Boolean);

        setAreaLabels(newLabels);
    }, [geoJson, currentView]);

    // Helper to get bounds from GeoJSON coordinates
    const getBoundsFromFeature = (feature: any): L.LatLngBounds => {
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

    // Handle zooming in a separate effect
    useEffect(() => {
        if (featureToZoom && mapRef.current) {
            // Use a moderate padding (10%) to make features fill ~80% of the viewport
            const padding: L.PointTuple = [50, 50];
            
            // Special case for Germany view
            if (currentView === ViewLevel.BUNDESLAND && !selectedRegion) {
                mapRef.current.fitBounds(featureToZoom, { 
                    padding,
                    maxZoom: 7,  // Restrict zoom for Germany view
                    animate: true
                });
                return;
            }
            
            // Berlin city view - use minimal padding to maximize size
            if (currentView === ViewLevel.BEZIRK && selectedRegion === "Berlin") {
                mapRef.current.fitBounds(featureToZoom, { 
                    padding: [5, 5],  // Even smaller padding for bezirk view
                    maxZoom: 14,  // Higher zoom for Berlin bezirks
                    animate: true
                });
                return;
            }
            
            // Hamburg bezirk view
            if (currentView === ViewLevel.BEZIRK && selectedRegion === "Hamburg") {
                mapRef.current.fitBounds(featureToZoom, { 
                    padding: [10, 10],  // Minimal padding for bezirk view
                    maxZoom: 12,  // Consistent with Berlin
                    animate: true
                });
                return;
            }
            
            // For specific large districts, use more padding
            if (currentView === ViewLevel.ORTSTEIL && selectedRegion) {
                if (selectedRegion === "Pankow" || 
                    selectedRegion === "Treptow-Köpenick" || 
                    selectedRegion === "Spandau") {
                    mapRef.current.fitBounds(featureToZoom, { 
                        padding: [20, 20],  // Less padding for large districts
                        maxZoom: 13,        // Increased zoom level
                        animate: true
                    });
                    return;
                }
            }
            
            // Default case - use minimal padding to fill screen
            mapRef.current.fitBounds(featureToZoom, { 
                padding: [20, 20],  // Less padding by default
                maxZoom: 14,       // Higher default max zoom
                animate: true
            });
        }
    }, [featureToZoom, currentView, selectedRegion]);

    const addToHistory = (name: string, level: ViewLevel) => {
        setHistory(prevHistory => {
            // Prevent adding duplicate entries
            if (prevHistory.length > 0 && 
                prevHistory[prevHistory.length - 1].level === level && 
                prevHistory[prevHistory.length - 1].name === name) {
                return prevHistory;
            }
            
            // If we're at a new top-level (Bundesland), reset the history
            if (level === ViewLevel.BUNDESLAND) {
                return [{ level, name }];
            }
            
            // Otherwise, append to history
            return [...prevHistory, { level, name }];
        });
    };

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
                        default:
                            name = properties.lan_name?.[0];
                    }
                    
                    // For Ortsteile, just zoom to the feature
                    if (currentView === ViewLevel.ORTSTEIL) {
                        setSelectedOrtsteil(name);
                        setFeatureToZoom(getBoundsFromFeature(feature));
                        return;
                    }
                    
                    // Update view level for Bezirk only
                    if (currentView === ViewLevel.BEZIRK) {
                        setCurrentView(ViewLevel.ORTSTEIL);
                        setSelectedRegion(name);
                        addToHistory(name, currentView);
                        setFeatureToZoom(getBoundsFromFeature(feature));
                    }
                }
            });
        }
    }

    const mapRef = useRef<L.Map | null>(null);
    const geoJsonRef = useRef<L.GeoJSON | null>(null);

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

    // Function to go back to top layer
    const handleBackToStart = () => {
        // Reset all states to the initial view
        setCurrentView(ViewLevel.BUNDESLAND);
        setSelectedRegion(null);
        setSelectedOrtsteil(null);
        setSelectedLandkreis(null);
        
        // Reset history
        setHistory([]);
        
        // Zoom out to show entire Germany with appropriate padding
        if (mapRef.current) {
            const germanBounds = L.latLngBounds(
                L.latLng(47.27, 5.87),  // Southwest corner
                L.latLng(55.06, 15.04)  // Northeast corner
            );
            
            // Set the feature to zoom using the same bounds
            // This ensures our main zoom effect handles it consistently
            setFeatureToZoom(germanBounds);
        }
    };

    // Get the current view level name for display
    const getCurrentViewLevelName = () => {
        switch (currentView) {
            case ViewLevel.BUNDESLAND:
                return "Bundesland";
            case ViewLevel.LANDKREIS:
                // Berlin and Hamburg are Stadtstaaten, which are equivalent to Landkreise
                if (selectedRegion === "Berlin" || selectedRegion === "Hamburg") {
                    return "Stadtstaat";
                }
                return "Landkreis";
            case ViewLevel.BEZIRK:
                return "Bezirk";
            case ViewLevel.ORTSTEIL:
                return "Ortsteil";
            default:
                return "";
        }
    };

    // Get the next view level name for display
    const getNextViewLevelName = () => {
        switch (currentView) {
            case ViewLevel.BUNDESLAND:
                return selectedRegion === "Berlin" || selectedRegion === "Hamburg" ? "Bezirk" : "Landkreis";
            case ViewLevel.LANDKREIS:
                return "Bezirk";
            case ViewLevel.BEZIRK:
                return "Ortsteil";
            default:
                return "";
        }
    };

    // Set initial Berlin view on first load
    useEffect(() => {
        if (mapRef.current) {
            // Create Berlin bounds and set the feature to zoom
            const berlinBounds = L.latLngBounds(
                L.latLng(52.3300, 13.0900),  // Southwest
                L.latLng(52.6800, 13.7600)   // Northeast
            );
            setFeatureToZoom(berlinBounds);
        }
    }, []);

    return (
        <div style={{ position: 'relative' }}>
            <style>{mapStyles}</style>
            
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '0',
                right: '0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 10px',
                zIndex: 1000
            }}>
                <div className="region-info" style={{ 
                    background: 'white', 
                    padding: '5px 10px', 
                    borderRadius: '5px',
                    border: '1px solid #ccc'
                }}>
                    {selectedRegion && (
                        (currentView === ViewLevel.BEZIRK && (selectedRegion === "Berlin" || selectedRegion === "Hamburg"))
                        ? `Stadtstaat: ${selectedRegion}`
                        : (currentView === ViewLevel.ORTSTEIL) 
                          ? `Bezirk: ${selectedRegion}` 
                          : `${getCurrentViewLevelName()}: ${selectedRegion}`
                    )}
                    {selectedOrtsteil && ` Ortsteil: ${selectedOrtsteil}`}
                </div>
                
                {currentView === ViewLevel.ORTSTEIL && (
                    <button 
                        onClick={() => {
                            setCurrentView(ViewLevel.BEZIRK);
                            setSelectedRegion("Berlin");
                            setSelectedOrtsteil(null);
                            
                            // Set bounds for Berlin bezirk view
                            if (mapRef.current) {
                                const berlinBounds = L.latLngBounds(
                                    L.latLng(52.3300, 13.0900),  // Southwest
                                    L.latLng(52.6800, 13.7600)   // Northeast
                                );
                                setFeatureToZoom(berlinBounds);
                            }
                        }}
                        style={{
                            padding: '5px 10px',
                            background: 'white',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Back to Berlin
                    </button>
                )}
            </div>

            <MapContainer 
                className="map" 
                center={mapCenter} 
                zoom={11} 
                ref={mapRef}
                style={{ height: '100vh', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {geoJson && (
                <GeoJSON
                        data={geoJson as GeoJsonObject}
                        key={`${currentView}-${selectedRegion || ''}-${selectedOrtsteil || ''}-${history.length}`}
                        style={geoJSONStyle}
                        ref={geoJsonRef}
                        onEachFeature={onEachFeature}
                />
                )}
                {areaLabels.map((label, index) => (
                    <Marker
                        key={index}
                        position={label.position}
                        icon={L.divIcon({
                            html: `<div class="area-label-content ${label.isDark ? 'area-label-light' : 'area-label-dark'}">
                                    <div class="area-name">${label.content.match(/<div class="area-name">(.*?)<\/div>/)?.[1] || ''}</div>
                                    <div class="area-rent">${label.content.match(/<div class="area-rent">(.*?)<\/div>/)?.[1] || ''}</div>
                                  </div>`,
                            className: 'area-label',
                            iconSize: [120, 60],
                            iconAnchor: [60, 30]
                        })}
                    />
                ))}
                <CityMarkers 
                    currentView={currentView}
                    selectedLandkreis={selectedLandkreis}
                    selectedRegion={selectedRegion}
                />
                <ScaleControl position="bottomright" />
            </MapContainer>
        </div>
    );
};

export default GeoMap;
