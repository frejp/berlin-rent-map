import * as L from "leaflet";
import { MapStyles } from '../types';

// Default map style
export const mapStyle: MapStyles = {
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

// Tooltip style configuration
export const tooltipStyle = {
    className: 'custom-tooltip',
    permanent: false,
    direction: 'auto' as const,
    offset: [15, 0] as [number, number],
    opacity: 0.9,
    sticky: true
};

// CSS styles for the map and components
export const mapStyles = `
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

    .map-button.active {
        background: #e0e0e0;
        border-color: #aaa;
    }

    .region-info {
        position: absolute;
        left: 10px;
        top: 10px;
        z-index: 1000;
        background: white;
        padding: 10px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        max-width: 250px;
        font-size: 14px;
    }

    .region-info h2 {
        margin: 0 0 5px 0;
        font-size: 16px;
    }

    .region-info p {
        margin: 0;
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

// Button style for map controls
export const buttonStyle = {
    padding: '5px 10px',
    background: 'white',
    border: '1px solid #ccc',
    borderRadius: '5px',
    cursor: 'pointer'
};

// Region info style
export const regionInfoStyle = { 
    background: 'white', 
    padding: '5px 10px', 
    borderRadius: '5px',
    border: '1px solid #ccc'
}; 