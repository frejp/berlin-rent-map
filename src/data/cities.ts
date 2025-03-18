interface City {
    name: string;
    coordinates: [number, number]; // [latitude, longitude]
    population: number;
}

export const majorGermanCities: City[] = [
    { name: "Berlin", coordinates: [52.5200, 13.4050], population: 3669495 },
    { name: "Hamburg", coordinates: [53.5511, 9.9937], population: 1841179 },
    { name: "Munich", coordinates: [48.1351, 11.5820], population: 1471508 },
    { name: "Cologne", coordinates: [50.9375, 6.9603], population: 1085664 },
    { name: "Frankfurt", coordinates: [50.1109, 8.6821], population: 753056 },
    { name: "Stuttgart", coordinates: [48.7758, 9.1829], population: 634830 },
    { name: "Düsseldorf", coordinates: [51.2277, 6.7735], population: 619294 },
    { name: "Leipzig", coordinates: [51.3397, 12.3731], population: 597493 },
    { name: "Dortmund", coordinates: [51.5136, 7.4653], population: 588250 },
    { name: "Essen", coordinates: [51.4556, 7.0116], population: 582760 }
]; 