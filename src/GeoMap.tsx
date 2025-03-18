import React, { useRef, useState, useEffect } from "react";
import { MapContainer, TileLayer, ScaleControl } from "react-leaflet";
import * as L from "leaflet";
import { GeoJsonObject } from 'geojson';
import { getCenterOfGeoJson } from './mapUtils';
import "leaflet/dist/leaflet.css";
import { ViewLevel } from './types';
import { useGeoData } from './hooks/useGeoData';
import { useMapZoom } from './hooks/useMapZoom';
import GeoJSONLayer from './components/GeoJSONLayer';
import AreaLabels from './components/AreaLabels';
import MapControls from './components/MapControls';
import RegionInfo from './components/RegionInfo';
import { mapStyles } from './styles/MapStyles';

/**
 * Main map component that displays geographic data with rent information
 */
const GeoMap: React.FC = () => {
    // State management
    const [selectedRegion, setSelectedRegion] = useState<string | null>("Berlin");
    const [currentView, setCurrentView] = useState<ViewLevel>(ViewLevel.BEZIRK);
    const [selectedOrtsteil, setSelectedOrtsteil] = useState<string | null>(null);
    const [featureToZoom, setFeatureToZoom] = useState<L.LatLngBounds | null>(null);
    
    // Refs
    const mapRef = useRef<L.Map | null>(null);
    
    // Custom hooks
    const geoJson = useGeoData(currentView, selectedRegion);
    useMapZoom(featureToZoom, mapRef, selectedRegion, currentView);
    
    // Add CSS styles
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = mapStyles;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Use the same exact coordinates as the Back to Berlin button
    const mapCenter: [number, number] = [52.52, 13.405];

    return (
        <div style={{ position: 'relative' }}>
            {/* RegionInfo - shows details about the selected region */}
            <RegionInfo 
                selectedRegion={selectedRegion}
                selectedOrtsteil={selectedOrtsteil}
                currentView={currentView}
            />
            
            {/* MapControls - contains view toggle and reset buttons */}
            <MapControls 
                currentView={currentView}
                setCurrentView={setCurrentView}
                setSelectedRegion={setSelectedRegion}
                setSelectedOrtsteil={setSelectedOrtsteil}
                setFeatureToZoom={setFeatureToZoom}
                mapRef={mapRef}
            />
            
            {/* MapContainer - the actual map */}
            <MapContainer 
                className="map" 
                center={mapCenter} 
                zoom={11} 
                ref={mapRef}
                style={{ height: '100vh', width: '100%' }}
            >
                {/* Base map tiles */}
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* GeoJSON layer for regions */}
                <GeoJSONLayer
                    geoJson={geoJson}
                    currentView={currentView}
                    selectedRegion={selectedRegion}
                    selectedOrtsteil={selectedOrtsteil}
                    setSelectedOrtsteil={setSelectedOrtsteil}
                    setCurrentView={setCurrentView}
                    setSelectedRegion={setSelectedRegion}
                    setFeatureToZoom={setFeatureToZoom}
                    mapRef={mapRef}
                />
                
                {/* Area labels with rent information */}
                <AreaLabels
                    geoJson={geoJson}
                    currentView={currentView}
                />
                
                {/* Scale control */}
                <ScaleControl position="bottomright" />
            </MapContainer>
        </div>
    );
};

export default GeoMap;
