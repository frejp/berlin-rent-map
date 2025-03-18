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

## Deployment

This project is deployed on GitHub Pages. You can view the live version at:
[https://YOUR_GITHUB_USERNAME.github.io/berlin-rent-map](https://YOUR_GITHUB_USERNAME.github.io/berlin-rent-map)

### How to Deploy

1. Fork or clone this repository
2. Update the `homepage` field in `package.json` with your GitHub username:
   ```json
   "homepage": "https://YOUR_GITHUB_USERNAME.github.io/berlin-rent-map"
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

## Local Development

To run the project locally:

```bash
npm install
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## How to Navigate the Map

1. Start with a view of Berlin districts
2. Click on a district to zoom in and view its neighborhoods
3. Use the "Back to Germany" button to view the entire country
4. Click on regions to drill down into more detailed views

## Data Sources

- Rent price data is based on average prices per square meter in each district
- Geographical data sources include official Berlin and Hamburg administrative boundaries
