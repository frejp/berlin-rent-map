import React, { useEffect, useState } from 'react';
import { Marker } from 'react-leaflet';
import * as L from 'leaflet';
import { AreaLabel, ViewLevel, isColorDark } from '../types';
import { GeoJsonObject } from 'geojson';
import { centroid } from "@turf/turf";
import { getAverageRentForBezirk, getAverageRentForOrtsteil, getRentColor } from '../rentData';
import { normalizeName } from '../types';

interface AreaLabelsProps {
    geoJson: GeoJsonObject | null;
    currentView: ViewLevel;
}

/**
 * Component for rendering area labels with rent information
 */
const AreaLabels: React.FC<AreaLabelsProps> = ({ geoJson, currentView }) => {
    const [areaLabels, setAreaLabels] = useState<AreaLabel[]>([]);

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
                name = feature.properties.name;
                if (name) {
                    const normalizedName = normalizeName(name);
                    rent = getAverageRentForBezirk(normalizedName);
                }
            } else if (currentView === ViewLevel.ORTSTEIL) {
                name = feature.properties.Name;
                if (name) {
                    const berlinBezirkMatch = feature.properties.Description.match(/BEZNAME<\/td>\s*<td>([^<]+)<\/td>/);
                    const bezirkName = berlinBezirkMatch ? berlinBezirkMatch[1] : null;
                    
                    if (bezirkName) {
                        const normalizedBezirk = normalizeName(bezirkName);
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
                    content: `<div class="area-name">${name}</div><div class="area-rent">${rent.toFixed(0)}€</div>`,
                    isDark
                };
            } catch (error) {
                console.error('Error calculating centroid:', error);
                return null;
            }
        }).filter(Boolean) as AreaLabel[];

        setAreaLabels(newLabels);
    }, [geoJson, currentView]);

    return (
        <>
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
        </>
    );
};

export default AreaLabels; 