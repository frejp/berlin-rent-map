// Import the rent data from the JSON file
import rentPrices from './combined_rent_data.json';

// Define valid district keys
type DistrictKey = 
  | 'mitte' 
  | 'friedrichshain-kreuzberg' 
  | 'pankow' 
  | 'charlottenburg-wilmersdorf'
  | 'spandau' 
  | 'steglitz-zehlendorf' 
  | 'tempelhof-schoeneberg'
  | 'neukoelln' 
  | 'treptow-koepenick' 
  | 'marzahn-hellersdorf'
  | 'lichtenberg' 
  | 'reinickendorf'
  | 'hamburg-mitte'
  | 'altona'
  | 'eimsbuettel'
  | 'hamburg-nord'
  | 'wandsbek'
  | 'bergedorf'
  | 'harburg';

// Record of districts and their neighborhoods
type DistrictNeighborhoods = Record<DistrictKey, Record<string, number>>;

interface RentPrices {
    berlin_average: number;
    hamburg_average: number;
    bezirk_averages: Record<DistrictKey, number>;
    districts: DistrictNeighborhoods;
}

const typedRentPrices = rentPrices as RentPrices;

// Function to get average rent for a specific Planungsraum
export function getAverageRentForPlanungsraum(bezirk: string, ortsteil: string, planungsraum: string): number {
    const normalizedBezirk = bezirk.toLowerCase().replace(/\s+/g, '-') as DistrictKey;
    const area = typedRentPrices.districts[normalizedBezirk]?.[ortsteil] || 0;
    return area;
}

// Function to get average rent for an Ortsteil
export function getAverageRentForOrtsteil(bezirk: string, ortsteil: string): number {
    const normalizedBezirk = bezirk.toLowerCase().replace(/\s+/g, '-') as DistrictKey;
    return typedRentPrices.districts[normalizedBezirk]?.[ortsteil] || 0;
}

// Function to get average rent for a Bezirk
export function getAverageRentForBezirk(bezirk: string): number {
    const normalizedBezirk = bezirk.toLowerCase().replace(/\s+/g, '-') as DistrictKey;
    return typedRentPrices.bezirk_averages[normalizedBezirk] || 0;
}

// Function to get average rent for all of Berlin
export function getAverageRentForCity(city: string): number {
    if (city.toLowerCase() === 'berlin') {
        return typedRentPrices.berlin_average;
    } else if (city.toLowerCase() === 'hamburg') {
        return typedRentPrices.hamburg_average;
    }
    return 0;
}

// Function to get min and max rents for color scale
function getMinMaxRent(): { min: number; max: number } {
    const districts = typedRentPrices.districts;
    const allRents: number[] = [];
    
    Object.values(districts).forEach(neighborhoods => {
        Object.values(neighborhoods).forEach(rent => {
            if (typeof rent === 'number' && !isNaN(rent)) {
                allRents.push(rent);
            }
        });
    });
    
    if (allRents.length === 0) return { min: 0, max: 0 };
    
    return {
        min: Math.min(...allRents),
        max: Math.max(...allRents)
    };
}

// Function to get color based on rent price
export function getRentColor(rent: number): string {
    // Use a green to red color scale with proper thresholds
    if (rent === 0) return "#e0e0e0"; // Gray for no data
    
    // Rent values are absolute euros, typically ranging from 700-1100€
    return rent >= 1000
        ? "#bd0026" // Dark red (most expensive)
        : rent >= 950
        ? "#e31a1c" // Red
        : rent >= 900
        ? "#fc4e2a" // Red-orange
        : rent >= 850
        ? "#fd8d3c" // Orange
        : rent >= 800
        ? "#feb24c" // Yellow-orange
        : rent >= 780
        ? "#fed976" // Yellow
        : rent >= 750
        ? "#addd8e" // Light green
        : "#31a354"; // Green (cheapest)
}

// Function to get all rent data for a specific area
export function getRentDataForArea(bezirk: string, ortsteil?: string): number[] {
    const normalizedBezirk = bezirk.toLowerCase().replace(/\s+/g, '-') as DistrictKey;
    const districts = typedRentPrices.districts;
    
    if (ortsteil) {
        const rent = districts[normalizedBezirk]?.[ortsteil];
        return [rent || 0];
    }
    return Object.values(districts[normalizedBezirk]) || [];
}

// Export the raw data for direct access if needed
export const rentPricesData: RentPrices = rentPrices as RentPrices;