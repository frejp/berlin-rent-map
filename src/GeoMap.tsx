import React, { useRef, useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, ScaleControl, useMap, Tooltip } from "react-leaflet";
import * as L from "leaflet";
import * as topojson from "topojson-client";
import { getColor, getCenterOfGeoJson, layersUtils } from './mapUtils'
import "leaflet/dist/leaflet.css";
import germany from "./germany.json";

const COUNTRY_VIEW_ID = "states";

function geoJSONStyle(feature) {
    return {
        color: "#1f2021",
        weight: 1,
        fillOpacity: 0.5,
        fillColor: getColor(Math.floor(Math.random() * 26))
    };
}

const GeoMap = () => {
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<'states' | 'districts'>('states');

    // Get the appropriate GeoJSON data based on the current view
    const geoJson = (() => {
        if (currentView === 'states') {
            // @ts-ignore
            return topojson.feature(germany, germany.objects[COUNTRY_VIEW_ID]);
        } else {
            // For districts view, use the counties object filtered by state
            // @ts-ignore
            const allCounties = topojson.feature(germany, germany.objects.counties);
            return {
                type: "FeatureCollection" as const,
                features: (allCounties as any).features.filter(
                    (feature: any) => feature.properties.state === selectedState
                )
            };
        }
    })();

    function onEachFeature(feature: any, layer: L.Layer) {
        let layerUtils = layersUtils(geoJsonRef, mapRef);
        if (layer instanceof L.Path) {
            layer.on({
                mouseover: (e) => {
                    layerUtils.highlightOnClick(e);
                    // Update tooltip position based on mouse position
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
                    const name = currentView === 'states' ? properties.name : properties.state;
                    setSelectedState(name);
                    
                    // Switch to districts view when clicking a state
                    if (currentView === 'states') {
                        setCurrentView('districts');
                    }
                    
                    console.log("Clicked:", name);
                    layerUtils.zoomToFeature(e);
                }
            });
            
            // Add a tooltip that stays open on hover
            const tooltipContent = currentView === 'districts' 
                ? `${feature.properties.name} (${feature.properties.districtType})`
                : feature.properties.name;

            layer.bindTooltip(tooltipContent, {
                permanent: false,
                direction: 'auto',
                offset: [15, 0],
                className: currentView === 'districts' ? 'district-tooltip' : 'state-tooltip',
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

    // Add CSS for the tooltip
    useEffect(() => {
        // Add custom CSS for the tooltip
        const style = document.createElement('style');
        style.innerHTML = `
            .district-tooltip, .state-tooltip {
                background: rgba(255, 255, 255, 0.9);
                border: none;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                padding: 6px 12px;
                font-size: 14px;
                font-weight: 500;
                pointer-events: none;
            }
            .district-tooltip:before, .state-tooltip:before {
                display: none;
            }
            .state-tooltip {
                font-size: 16px;
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const mapCenter: [number, number] = getCenterOfGeoJson(geoJson);

    // Function to go back to state view
    const handleBackToStates = () => {
        setCurrentView('states');
        setSelectedState(null);
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
                <GeoJSON
                    data={geoJson}
                    key={currentView + (selectedState || '')}
                    style={geoJSONStyle}
                    ref={geoJsonRef}
                    onEachFeature={onEachFeature}
                />
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
                {currentView === 'districts' && (
                    <button 
                        onClick={handleBackToStates}
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
                )}
                {selectedState && (
                    <div style={{
                        background: 'white',
                        padding: '10px',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        {currentView === 'districts' ? `Districts of ${selectedState}` : `Selected: ${selectedState}`}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeoMap;
