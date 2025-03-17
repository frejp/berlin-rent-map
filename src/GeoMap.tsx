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
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<ViewLevel.BUNDESLAND | ViewLevel.LANDKREIS | ViewLevel.BEZIRK | ViewLevel.ORTSTEIL>(ViewLevel.BUNDESLAND);
    const [history, setHistory] = useState<Array<{level: ViewLevel, name: string}>>([]);
    const [selectedOrtsteil, setSelectedOrtsteil] = useState<string | null>(null);
    const [selectedLandkreis, setSelectedLandkreis] = useState<string | null>(null);
    const [areaLabels, setAreaLabels] = useState<Array<{position: L.LatLng, content: string, isDark: boolean}>>([]);
    const [featureToZoom, setFeatureToZoom] = useState<L.LatLngBounds | null>(null);

    // Get the appropriate GeoJSON data based on the current view
    const geoJson: GeoJsonObject | null = useMemo(() => {
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
    }, [currentView, selectedRegion, selectedLandkreis]);

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
            const padding: L.PointTuple = [50, 50];
            mapRef.current.fitBounds(featureToZoom, { padding });
        }
    }, [featureToZoom]);

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
                        case ViewLevel.LANDKREIS:
                            name = properties.krs_name?.[0];
                            break;
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
                    
                    // Update view level and history for other levels
                    let nextLevel: ViewLevel;
                    let nextHistory = [...history];
                    
                    switch (currentView) {
                        case ViewLevel.BUNDESLAND:
                            nextLevel = name === "Berlin" || name === "Hamburg" ? ViewLevel.BEZIRK : ViewLevel.LANDKREIS;
                            nextHistory = [...history, { level: currentView, name }];
                            setSelectedRegion(name);
                            break;
                        case ViewLevel.BEZIRK:
                            nextLevel = ViewLevel.ORTSTEIL;
                            nextHistory = [...history, { level: currentView, name }];
                            setSelectedRegion(name);
                            break;
                        case ViewLevel.LANDKREIS:
                            if (name === "Berlin" || name === "Hamburg") {
                                nextLevel = ViewLevel.BEZIRK;
                                nextHistory = [...history, { level: currentView, name }];
                                setSelectedRegion(name);
                            } else {
                                nextLevel = currentView;
                                setSelectedLandkreis(name);
                            }
                            break;
                        default:
                            nextLevel = currentView;
                    }
                    
                    setCurrentView(nextLevel);
                    setHistory(nextHistory);
                    setFeatureToZoom(getBoundsFromFeature(feature));
                }
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
            const previousState = history[history.length - 1];
            setCurrentView(previousState.level);
            setSelectedRegion(previousState.name);
            setHistory(history.slice(0, -1));
            setSelectedOrtsteil(null);
            setSelectedLandkreis(null);
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
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {geoJson && (
                <GeoJSON
                        data={geoJson as GeoJsonObject}
                        key={`${currentView}-${selectedRegion || ''}-${selectedOrtsteil || ''}`}
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
                    <div className="region-info">
                        {`${currentView.charAt(0).toUpperCase() + currentView.slice(1)}: ${selectedRegion}`}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeoMap;
