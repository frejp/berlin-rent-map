import center from "@turf/center";
import L from "leaflet";

export function getColor(d) {
    return d > 25
        ? "#800026"
        : d > 20
            ? "#E31A1C"
            : d > 15
                ? "#FD8D3C"
                : d > 10
                    ? "#FEB24C"
                    : d > 5
                        ? "#FED976"
                        : "#FFEDA0";
}

export function getCenterOfGeoJson(geoJson): [number, number] {
    const coords = center(geoJson).geometry.coordinates;
    return [coords[1], coords[0]]; // Convert to [lat, lng] format
}

export function layersUtils(geoJsonRef, mapRef) {
    function highlightOnClick(e) {
        var layer = e.target;

        layer.setStyle({
            weight: 2,
            color: "#f90303",
            dashArray: "",
            fillOpacity: 0.7
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    }

    function resetHighlight(e) {
        if (geoJsonRef.current) {
            geoJsonRef.current.setStyle({
                weight: 1,
                color: "#1f2021",
                fillOpacity: 0.5
            });
        }
    }

    function zoomToFeature(e) {
        if (mapRef.current) {
            mapRef.current.fitBounds(e.target.getBounds());
        }
    }

    return { highlightOnClick, resetHighlight, zoomToFeature };
}
