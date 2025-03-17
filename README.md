# Berlin Rent Map

An interactive visualization of rental prices across Berlin and Hamburg, built with React and Leaflet. The application provides a detailed view of average rental costs at different geographical levels:

- City level (Berlin vs Hamburg)
- District level (Bezirke)
- Neighborhood level (Ortsteile)

## Features

- Interactive map with zoom levels from city overview to detailed neighborhoods
- Color-coded visualization of rental prices
- Detailed tooltips showing exact rental prices for each area
- Responsive design with custom styling
- Support for both Berlin and Hamburg data

## Technical Stack

- React 18.2
- TypeScript 4.9
- Leaflet for mapping
- React-Leaflet for React integration
- Turf.js for geospatial operations
- TopoJSON for efficient geographical data handling

## Data Structure

The application uses various GeoJSON/TopoJSON files for geographical boundaries and combines them with rental price data. Average rents are calculated at multiple levels:

- City-wide averages (e.g., Berlin: €840.71, Hamburg: €1000)
- District (Bezirk) averages
- Neighborhood (Ortsteil) specific prices

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Map Features

- Custom color scaling based on rental prices
- Interactive tooltips with area names and prices
- Automatic zoom level adjustment
- Smooth transitions between different map views
