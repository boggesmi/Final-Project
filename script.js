// Map configuration data
// If you have a Stadia Maps API key, add it here
let stadiaApiKey = ''; // Your Stadia Maps API key (leave empty for localhost)

// Try to load the API key from localStorage on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedApiKey = localStorage.getItem('stadiaApiKey');
    if (savedApiKey) {
        stadiaApiKey = savedApiKey;
        document.getElementById('stadia-api-key').value = savedApiKey;
    }

    // Add event listener for saving the API key
    document.getElementById('save-api-key').addEventListener('click', function() {
        const apiKeyInput = document.getElementById('stadia-api-key').value.trim();
        stadiaApiKey = apiKeyInput;
        localStorage.setItem('stadiaApiKey', apiKeyInput);
        
        // Reload the current map to apply the new API key
        const activeMapId = document.querySelector('.map-options li.active').getAttribute('data-map');
        setupMap(activeMapId);
        
        alert('API key saved! Map tiles will now use your Stadia Maps API key.');
    });
});

// Helper function to add API key to Stadia Maps URLs if needed
function addApiKeyToUrl(url) {
    if (stadiaApiKey && url.includes('stadiamaps.com')) {
        return url + (url.includes('?') ? '&' : '?') + 'api_key=' + stadiaApiKey;
    }
    return url;
}

// Global variables to store overlay layers that can be removed
let colonyLayers = [];
let latitudeLayers = [];

// Global tracking variables
let railroadLayers = [];

const mapConfigs = {
    'old-world': {
        title: 'Old World (Topographical)',
        description: 'This map shows the topographical features of the United States before state boundaries were established, when the land was shaped purely by natural forces. Before European settlement, the continent was a diverse mosaic of landscapes - from ancient forests and expansive grasslands to winding river systems and mountain ranges. These natural features influenced how indigenous peoples lived on the land for thousands of years, developing relationships with specific ecosystems and creating sustainable practices that worked within the limits of the natural world. As we explore this map, we see the land as it was - not as property to be divided and exploited, but as an interconnected system with its own logic and rhythms.',
        center: [39.8283, -98.5795], // Center of the US
        zoom: 3,
        basemap: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg',
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">CC BY SA</a> | Tiles hosted by <a href="https://stadiamaps.com/">Stadia Maps</a>',
        maxZoom: 16,
        minZoom: 2,
        style: function(map) {
            // Apply sepia filter with reduced contrast for a softer historical look
            document.querySelector('#map').style.filter = 'sepia(0.7) contrast(0.85)';
            
            // Add parchment background
            document.querySelector('#map').style.backgroundImage = 'url("https://i.imgur.com/8zGqS1f.jpg")';
            document.querySelector('#map').style.backgroundSize = 'cover';
            
            // Style the map container to enhance the historical feel
            document.querySelector('.map-container').style.backgroundColor = '#d9c7a9';
        }
    },
    'colonies': {
        title: 'American Colonies (European Latitude Comparison)',
        description: 'This map explores the original American Colonies by comparing their latitude lines to Europe. The map highlights the thirteen original colonies: Connecticut, Delaware, Georgia, Maryland, Massachusetts, New Hampshire, New Jersey, New York, North Carolina, Pennsylvania, Rhode Island, South Carolina, and Virginia. The parallel latitude lines in 5-degree increments show how colonial settlements shared similar climates with European locations.',
        center: [39.5, -77.5], // Center on the colonies
        zoom: 5,
        basemap: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', // Light basemap to make custom elements stand out
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        minZoom: 2,
        setup: function(map) {
            // Clear any existing layers
            colonyLayers.forEach(layer => map.removeLayer(layer));
            colonyLayers = [];
            
            latitudeLayers.forEach(layer => map.removeLayer(layer));
            latitudeLayers = [];
            
            // Define a simplified approximation of the 13 colonies as a fallback
            const simplifiedColonies = [
                { name: "Virginia", coords: [[-83, 39], [-83, 36], [-75, 36], [-75, 39], [-83, 39]] },
                { name: "Massachusetts", coords: [[-73.5, 42.7], [-73.5, 41.8], [-69.9, 41.8], [-69.9, 42.7], [-73.5, 42.7]] },
                { name: "New Hampshire", coords: [[-73, 45], [-73, 42.7], [-70.7, 42.7], [-70.7, 45], [-73, 45]] },
                { name: "Maryland", coords: [[-79.5, 39.7], [-79.5, 38], [-75.2, 38], [-75.2, 39.7], [-79.5, 39.7]] },
                { name: "Connecticut", coords: [[-73.7, 42], [-73.7, 40.9], [-71.8, 40.9], [-71.8, 42], [-73.7, 42]] },
                { name: "Rhode Island", coords: [[-71.9, 42], [-71.9, 41], [-71.1, 41], [-71.1, 42], [-71.9, 42]] },
                { name: "Delaware", coords: [[-75.8, 39.8], [-75.8, 38.5], [-75, 38.5], [-75, 39.8], [-75.8, 39.8]] },
                { name: "North Carolina", coords: [[-84, 36.5], [-84, 33.5], [-75.5, 33.5], [-75.5, 36.5], [-84, 36.5]] },
                { name: "South Carolina", coords: [[-83.5, 35], [-83.5, 32], [-78.5, 32], [-78.5, 35], [-83.5, 35]] },
                { name: "New Jersey", coords: [[-75.6, 41.4], [-75.6, 39], [-74, 39], [-74, 41.4], [-75.6, 41.4]] },
                { name: "New York", coords: [[-79.8, 45], [-79.8, 40.5], [-71.8, 40.5], [-71.8, 45], [-79.8, 45]] },
                { name: "Pennsylvania", coords: [[-80.5, 42], [-80.5, 39.7], [-74.7, 39.7], [-74.7, 42], [-80.5, 42]] },
                { name: "Georgia", coords: [[-85.6, 35], [-85.6, 30.5], [-80.7, 30.5], [-80.7, 35], [-85.6, 35]] }
            ];
            
            // Try to load states from external API first
            fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json')
                .then(response => response.json())
                .then(data => {
                    // List of the original 13 colonies
                    const coloniesStates = [
                        "Connecticut", "Delaware", "Georgia", "Maryland", "Massachusetts", 
                        "New Hampshire", "New Jersey", "New York", "North Carolina", 
                        "Pennsylvania", "Rhode Island", "South Carolina", "Virginia"
                    ];
                    
                    coloniesStates.forEach(state => {
                        // Find the state in the collection
                        const stateFeature = data.features.find(f => f.properties.name === state);
                        
                        if (stateFeature) {
                            // Create a new GeoJSON layer for the state
                            const stateLayer = L.geoJSON(stateFeature, {
                                style: {
                                    color: '#8B4513',
                                    weight: 2,
                                    opacity: 0.8,
                                    fillColor: '#DEB887',
                                    fillOpacity: 0.3
                                }
                            }).addTo(map);
                            
                            colonyLayers.push(stateLayer);
                        }
                    });
                })
                .catch(error => {
                    console.error('Error loading state data from API, using fallback:', error);
                    
                    // Use simplified fallback if API fails
                    simplifiedColonies.forEach(colony => {
                        const polygon = L.polygon(colony.coords, {
                            color: '#8B4513',
                            weight: 2,
                            opacity: 0.8,
                            fillColor: '#DEB887',
                            fillOpacity: 0.3
                        }).addTo(map);
                        
                        colonyLayers.push(polygon);
                    });
                });
            
            // Draw latitude lines in 5-degree increments
            for (let lat = 0; lat <= 60; lat += 5) {
                // Create the line across the view
                const latLine = L.polyline([
                    [lat, -100], // Starting point on the far west
                    [lat, 50]    // Ending point in Europe
                ], {
                    color: '#555555',
                    weight: 1,
                    opacity: 0.4,
                    dashArray: '3, 5'
                }).addTo(map);
                
                latitudeLayers.push(latLine);
                
                // Add label to the line in the middle of the Atlantic Ocean
                const lineLabel = L.marker([lat, -40], {  // -40 longitude is roughly middle of Atlantic
                    icon: L.divIcon({
                        className: 'latitude-label',
                        html: `<div class="latitude-text">${lat}°N</div>`,
                        iconSize: [50, 20],
                        iconAnchor: [25, 10]
                    }),
                    interactive: false
                }).addTo(map);
                
                latitudeLayers.push(lineLabel);
            }
            
            // Add important colonial cities with markers
            const colonialCities = [
                { name: "Philadelphia", coordinates: [-75.1652, 39.9526] },
                { name: "Boston", coordinates: [-71.0589, 42.3601] },
                { name: "Charleston", coordinates: [-79.9311, 32.7765] }
            ];
            
            colonialCities.forEach(city => {
                // Create marker for the city
                const cityMarker = L.circleMarker(
                    [city.coordinates[1], city.coordinates[0]], 
                    {
                        radius: 6,
                        fillColor: "#8B4513",
                        color: "#000",
                        weight: 1.5,
                        opacity: 1,
                        fillOpacity: 0.8
                    }
                ).addTo(map);
                
                // Add city label
                const cityLabel = L.marker(
                    [city.coordinates[1], city.coordinates[0]], 
                    {
                        icon: L.divIcon({
                            className: 'city-label',
                            html: `<div class="city-name">${city.name}</div>`,
                            iconSize: [80, 20],
                            iconAnchor: [40, -10]
                        }),
                        interactive: false
                    }
                ).addTo(map);
                
                colonyLayers.push(cityMarker);
                colonyLayers.push(cityLabel);
            });
        }
    },
    'midwest': {
        title: 'Midwest & Northeast Railroad Networks',
        description: 'This map explores how railroad networks in the Midwest and Northeast shaped resource commodification and settlement patterns during the 1800s. These major rail lines connected growing industrial cities, facilitated the movement of raw materials, and enabled the rapid development of agriculture and manufacturing. Hover over a railroad line to see its name, or click for more details.',
        center: [41.5, -84.0], // Center between Midwest and Northeast
        zoom: 5,
        basemap: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png',
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a> | Tiles hosted by <a href="https://stadiamaps.com/">Stadia Maps</a>',
        maxZoom: 18,
        setup: function(map) {
            // Clear any existing railroad layers
            railroadLayers.forEach(layer => {
                if (map.hasLayer(layer)) map.removeLayer(layer);
            });
            railroadLayers = [];
            
            // Add major cities in the Midwest and Northeast - save for later to layer on top
            const majorCities = [
                { name: "Chicago", coordinates: [41.8781, -87.6298], isHub: true },
                { name: "New York", coordinates: [40.7128, -74.0060], isHub: true },
                { name: "Boston", coordinates: [42.3601, -71.0589], isHub: true },
                { name: "Philadelphia", coordinates: [39.9526, -75.1652], isHub: true },
                { name: "Pittsburgh", coordinates: [40.4406, -79.9959], isHub: true },
                { name: "Cleveland", coordinates: [41.4993, -81.6944], isHub: true },
                { name: "Detroit", coordinates: [42.3314, -83.0458], isHub: false },
                { name: "Buffalo", coordinates: [42.8864, -78.8784], isHub: false },
                { name: "St. Louis", coordinates: [38.6270, -90.1994], isHub: false },
                { name: "Cincinnati", coordinates: [39.1031, -84.5120], isHub: false },
                { name: "Milwaukee", coordinates: [43.0389, -87.9065], isHub: false },
                { name: "Albany", coordinates: [42.6526, -73.7562], isHub: false },
                { name: "Baltimore", coordinates: [39.2904, -76.6122], isHub: false },
                { name: "Syracuse", coordinates: [43.0481, -76.1474], isHub: false },
                { name: "Springfield", coordinates: [42.1015, -72.5898], isHub: false }
            ];
            
            // Add each railroad line to the map FIRST (so cities appear on top)
            console.log("Adding railroads, count:", usRailroads.length);
            
            usRailroads.forEach((railroad, index) => {
                console.log(`Adding railroad ${index+1}: ${railroad.name}`);
                
                // Define colors based on region - new color scheme
                const lineColor = railroad.region === "Northeast" ? "#1E88E5" : "#6A1B9A"; // Blue for Northeast, Purple for Midwest
                
                // Create a thicker background line for better visibility
                const backgroundLine = L.polyline(
                    railroad.route,
                    {
                        color: '#333',
                        weight: 6,
                        opacity: 0.6, // Increased from 0.4 to reduce transparency
                        lineJoin: 'round'
                    }
                ).addTo(map);
                
                // Create a polyline for each railroad
                const railroadLine = L.polyline(
                    railroad.route,
                    {
                        color: lineColor,
                        weight: 4,
                        opacity: 1.0,
                        lineJoin: 'round'
                    }
                ).addTo(map);
                
                // Add a popup with information about the railroad
                railroadLine.bindPopup(
                    `<div class="railroad-popup">
                        <h3>${railroad.name}</h3>
                        <p>Established: ${railroad.year}</p>
                        <p>Region: ${railroad.region}</p>
                    </div>`
                );
                
                // Add tooltip that appears on hover instead of permanent label
                railroadLine.bindTooltip(railroad.name, {
                    permanent: false,
                    direction: 'center',
                    className: 'railroad-tooltip',
                    sticky: true
                });
                
                railroadLayers.push(backgroundLine);
                railroadLayers.push(railroadLine);
            });
            
            // NOW add city markers ON TOP of railroad lines
            majorCities.forEach(city => {
                const radius = city.isHub ? 6 : 4;
                const fillColor = city.isHub ? "#E91E63" : "#7F8C8D"; // Pink for hubs, gray for others
                
                const cityMarker = L.circleMarker(
                    [city.coordinates[0], city.coordinates[1]], 
                    {
                        radius: radius,
                        fillColor: fillColor,
                        color: "#000",
                        weight: 1.5,
                        opacity: 1,
                        fillOpacity: 1.0, // Full opacity
                        zIndexOffset: 1000 // Ensure cities are on top
                    }
                ).bindTooltip(city.name, {
                    permanent: false,
                    direction: 'top',
                    className: 'city-tooltip'
                }).addTo(map);
                
                railroadLayers.push(cityMarker);
            });
            
            // Create a legend for the map
            const legend = L.control({ position: 'bottomright' });
            
            legend.onAdd = function(map) {
                const div = L.DomUtil.create('div', 'info legend');
                div.innerHTML = `
                    <div class="legend-title">Historical Railroad Network (1800s)</div>
                    <div class="legend-item">
                        <div class="legend-northeast"></div>
                        <div>Northeast Railroads</div>
                    </div>
                    <div class="legend-item">
                        <div class="legend-midwest"></div>
                        <div>Midwest Railroads</div>
                    </div>
                    <div class="legend-item">
                        <div class="legend-hub"></div>
                        <div>Major Railroad Hub</div>
                    </div>
                    <div class="legend-item">
                        <div class="legend-city"></div>
                        <div>City</div>
                    </div>
                    <div class="legend-note">Hover over or click for details</div>
                `;
                return div;
            };
            
            legend.addTo(map);
            railroadLayers.push(legend);
        }
    },
    'south': {
        title: 'Southern Plantations',
        description: 'This map explores the American South with a focus on the historical distribution of plantations and their environmental impact.',
        center: [32.661418, -80.687945], // Updated to the specified coordinates
        zoom: 13, // Changed from 15 to 13 as requested
        basemap: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19,
        setup: function(map) {
            // Clear existing plantation layers if they exist
            if (window.plantationLayers) {
                window.plantationLayers.forEach(layer => {
                    if (map.hasLayer(layer)) map.removeLayer(layer);
                });
            }
            window.plantationLayers = [];
            
            // Define the bounds for the image overlay
            // Making the overlay smaller (roughly half the size)
            // Adjusted coordinates to the specified location
            const latLng = [32.661418, -80.687945]; // Updated to the specified coordinates
            const latDistance = 0.016; // Further reduced to make the overlay even smaller
            const lngDistance = 0.022; // Further reduced to make the overlay even smaller
            
            const bounds = [
                [latLng[0] - latDistance, latLng[1] - lngDistance], // Southwest corner
                [latLng[0] + latDistance, latLng[1] + lngDistance]  // Northeast corner
            ];
            
            // Add the plantation overlay with increased transparency
            const plantationOverlay = L.imageOverlay('Plantation Layer.png', bounds, {
                opacity: 0.5, 
                interactive: true,
                className: 'plantation-overlay' // The CSS will handle the rotation
            }).addTo(map);
            
            // Add a toggle control for the plantation layer
            const toggleControl = L.control({position: 'topright'});
            
            toggleControl.onAdd = function(map) {
                const div = L.DomUtil.create('div', 'layer-toggle-control');
                div.innerHTML = '<button class="layer-toggle-btn active">Plantation Layout</button>';
                
                // Add click event to toggle the plantation overlay
                div.querySelector('.layer-toggle-btn').addEventListener('click', function(e) {
                    if (map.hasLayer(plantationOverlay)) {
                        plantationOverlay.remove();
                        this.classList.remove('active');
                    } else {
                        plantationOverlay.addTo(map);
                        this.classList.add('active');
                    }
                });
                
                // Prevent map click events from propagating through the control
                L.DomEvent.disableClickPropagation(div);
                
                return div;
            };
            
            toggleControl.addTo(map);
            window.plantationLayers.push(toggleControl);
            
            // Rotation is now handled by CSS in styles.css
            
            // Add a popup with information about the plantation
            plantationOverlay.bindPopup('<h3>Historical Plantation</h3><p>This overlay shows the layout of a historical plantation in the American South. The image illustrates how plantation owners organized land for maximum agricultural production, reflecting the environmental impact of plantation agriculture.</p>');
            
            // Add the overlay to the tracking array
            window.plantationLayers.push(plantationOverlay);
            
            // Add a legend to explain the overlay
            const legend = L.control({position: 'bottomright'});
            legend.onAdd = function(map) {
                const div = L.DomUtil.create('div', 'info legend');
                div.innerHTML = `
                    <div class="legend-title">Southern Plantation Map</div>
                    <div class="legend-item">
                        <span style="background: rgba(0,0,0,0.5); display: inline-block; width: 18px; height: 18px; margin-right: 8px;"></span>
                        Plantation Layout
                    </div>
                    <div class="legend-note">
                        Click on the overlay for information<br>
                        Use the button in the top-right to toggle visibility
                    </div>
                `;
                return div;
            };
            legend.addTo(map);
            window.plantationLayers.push(legend);
        }
    },
    'west': {
        title: 'The West (Rectangular Survey System)',
        description: 'This map explores the American West using the Rectangular Survey System, showcasing how this grid-based land division method shaped western development and landscape.',
        center: [40.3428, -116.5453], // Center of the Western states (approximately)
        zoom: 5,
        basemap: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
        maxZoom: 19,
        setup: function(map) {
            // Create a global variable to track PLSS layers if it doesn't exist
            if (!window.plssLayers) {
                window.plssLayers = [];
            } else {
                // Clear existing PLSS layers
                window.plssLayers.forEach(layer => {
                    if (map.hasLayer(layer)) map.removeLayer(layer);
                });
                window.plssLayers = [];
            }
            
            // Add a toggle control for the PLSS grid
            const toggleControl = L.control({position: 'topright'});
            
            toggleControl.onAdd = function(map) {
                const div = L.DomUtil.create('div', 'layer-toggle-control');
                div.innerHTML = '<button class="layer-toggle-btn active">PLSS Grid</button>';
                
                // Add click event listener
                L.DomEvent.disableClickPropagation(div);
                
                return div;
            };
            
            toggleControl.addTo(map);
            window.plssLayers.push(toggleControl);
            
            // Generate PLSS grid
            createPLSSGrid(map);
            
            // Add a legend to explain the PLSS grid
            const legend = L.control({position: 'bottomleft'});
            legend.onAdd = function(map) {
                const div = L.DomUtil.create('div', 'info legend plss-legend');
                div.innerHTML = `
                    <div class="legend-title">Public Land Survey System (PLSS)</div>
                    <div class="legend-item">
                        <span style="background: transparent; display: inline-block; width: 30px; height: 3px; margin-right: 8px; border: none; border-top: 2.5px dashed #0000FF;"></span>
                        Principal Meridian
                    </div>
                    <div class="legend-item">
                        <span style="background: transparent; display: inline-block; width: 30px; height: 3px; margin-right: 8px; border: none; border-top: 2.5px dashed #008000;"></span>
                        Baseline
                    </div>
                    <div class="legend-item">
                        <span style="background: rgba(255,0,0,0.05); display: inline-block; width: 18px; height: 18px; margin-right: 8px; border: 1.2px solid rgba(255,0,0,0.6);"></span>
                        Township (6×6 miles)
                    </div>
                    <div class="legend-item">
                        <span style="background: rgba(255,165,0,0.05); display: inline-block; width: 18px; height: 18px; margin-right: 8px; border: 0.8px solid rgba(255,165,0,0.7);"></span>
                        Section (1×1 mile)
                    </div>
                    <div class="legend-note">
                        The Public Land Survey System divided much of the American West<br>
                        into a grid system that shaped settlement patterns and land use.<br>
                        <span style="font-size:9px">Zoom in to see more detail: townships appear at zoom level 8, sections at zoom level 10</span>
                    </div>
                `;
                return div;
            };
            legend.addTo(map);
            window.plssLayers.push(legend);
            
            // Add a button listener after everything is set up
            const toggleBtn = document.querySelector('.layer-toggle-btn');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', function() {
                    togglePLSSGrid(map, this);
                });
            }
            
            // Add debounced event handlers for zoom and pan
            let updateTimeout;
            
            function debouncedUpdate() {
                clearTimeout(updateTimeout);
                updateTimeout = setTimeout(function() {
                    // Clear existing grid elements
                    window.plssLayers.forEach(layer => {
                        if ((layer instanceof L.Rectangle || layer instanceof L.Polyline) && map.hasLayer(layer)) {
                            layer.remove();
                        }
                    });
                    
                    // Filter out removed layers
                    window.plssLayers = window.plssLayers.filter(layer => 
                        !(layer instanceof L.Rectangle || layer instanceof L.Polyline) || !map.hasLayer(layer)
                    );
                    
                    // Redraw the grid
                    createPLSSGrid(map);
                }, 300); // 300ms debounce
            }
            
            // Add event listeners with debouncing
            map.on('zoomend', debouncedUpdate);
            map.on('moveend', debouncedUpdate);
        }
    },
    'modern': {
        title: 'US Highways: Before & After Interstate System',
        description: 'This map compares US roadways before and after the Federal-Aid Highway Act of 1956. Toggle between views to see the dramatic transformation of American infrastructure from a disconnected network of roads to the organized Interstate Highway System as it appeared by 1969. This massive infrastructure project fundamentally changed how Americans traveled, lived, and consumed goods.',
        center: [39.8283, -98.5795], // Center of the US
        zoom: 5,
        basemap: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        setup: function(map) {
            // Clear any existing highway layers
            if (window.highwayLayers) {
                window.highwayLayers.forEach(layer => {
                    if (map.hasLayer(layer)) map.removeLayer(layer);
                });
            }
            window.highwayLayers = [];
            
            // State boundaries (simplified) for context
            const stateLines = {
                type: "FeatureCollection",
                features: []
            };
            
            // Try to load states from external API
            fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json')
                .then(response => response.json())
                .then(data => {
                    // Add state boundaries with light styling
                    const statesLayer = L.geoJSON(data, {
                        style: {
                            color: '#999',
                            weight: 1,
                            opacity: 0.6,
                            fillColor: '#f8f8f8',
                            fillOpacity: 0.1
                        }
                    }).addTo(map);
                    
                    window.highwayLayers.push(statesLayer);
                    
                    // After states are loaded, add the pre-1956 highways by default
                    showPre1956Highways(map);
                })
                .catch(error => {
                    console.error('Error loading state data:', error);
                    // If state loading fails, still show highways
                    showPre1956Highways(map);
                });
            
            // Add toggle control for switching between time periods
            const timeToggleControl = L.control({position: 'topright'});
            
            timeToggleControl.onAdd = function(map) {
                const div = L.DomUtil.create('div', 'time-toggle-control');
                div.innerHTML = `
                    <div class="highway-toggle-wrapper">
                        <button id="pre1956-btn" class="time-toggle-btn active">Pre-1956 Roads</button>
                        <button id="interstate1969-btn" class="time-toggle-btn">1969 Interstate System</button>
                    </div>
                `;
                
                // Prevent map click events from propagating through the control
                L.DomEvent.disableClickPropagation(div);
                return div;
            };
            
            timeToggleControl.addTo(map);
            window.highwayLayers.push(timeToggleControl);
            
            // Add event listeners after the control is added to the map
            setTimeout(() => {
                document.getElementById('pre1956-btn').addEventListener('click', function() {
                    if (!this.classList.contains('active')) {
                        document.getElementById('interstate1969-btn').classList.remove('active');
                        this.classList.add('active');
                        clearHighwayLayers(map);
                        showPre1956Highways(map);
                    }
                });
                
                document.getElementById('interstate1969-btn').addEventListener('click', function() {
                    if (!this.classList.contains('active')) {
                        document.getElementById('pre1956-btn').classList.remove('active');
                        this.classList.add('active');
                        clearHighwayLayers(map);
                        show1969Highways(map);
                    }
                });
            }, 100);
        }
    },
    'global': {
        title: "Global Interconnectedness (Airport Networks)",
        description: "This map visualizes the global network of airports, showing how continental patterns emerge from airport density and flight routes between major hubs.",
        center: [20, 0],
        zoom: 2,
        setup: function(map) {
            // Apply dark theme for better airport visualization
            map.getContainer().classList.add('airport-map-theme');
            
            // Fetch airport data
            fetch('airports.geojson')
                .then(response => response.json())
                .then(data => {
                    createAirportNetwork(map, data);
                })
                .catch(error => {
                    console.error('Error loading airport data:', error);
                });
        }
    }
};

// Initialize the map
let map;
let currentBasemap;
let historicalBorder;

function setupMap(mapId) {
    // Clear existing map
    if (window.currentMap) {
        window.currentMap.remove();
    }
    
    // Get map configuration
    const mapConfig = mapConfigs[mapId];
    
    // Update title and description
    document.getElementById('current-map-title').textContent = mapConfig.title;
    document.getElementById('current-map-description').textContent = mapConfig.description;
    
    // Create map
    const map = L.map('map', {
        center: mapConfig.center,
        zoom: mapConfig.zoom,
        minZoom: 2,
        maxZoom: mapConfig.maxZoom || 19,
        zoomControl: true
    });
    
    window.currentMap = map;
    
    // Add basemap
    if (mapConfig.basemap) {
        const basemapLayer = L.tileLayer(mapConfig.basemap, {
            attribution: mapConfig.attribution || '',
            maxZoom: mapConfig.maxZoom || 19
        }).addTo(map);
    } else {
        // Default basemap if not specified
        const basemapLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19
        }).addTo(map);
        
        // For airport map, use dark theme
        if (mapId === 'global') {
            basemapLayer.setUrl('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png');
        }
    }
    
    // Run map-specific setup function if it exists
    if (mapConfig.setup && typeof mapConfig.setup === 'function') {
        mapConfig.setup(map);
    }
    
    // Common setup for all maps
    setupCommonMapFeatures(map);
    
    return map;
}

// Handle map selection clicks
document.addEventListener('DOMContentLoaded', function() {
    // Get the initial active map ID
    const activeMapId = document.querySelector('.map-options li.active').getAttribute('data-map');
    
    // Initialize with active map
    setupMap(activeMapId);
    
    // Add click event listeners to map options
    const mapOptions = document.querySelectorAll('.map-options li');
    mapOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            mapOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active class to clicked option
            this.classList.add('active');
            
            // Get the map ID and initialize that map
            const mapId = this.getAttribute('data-map');
            setupMap(mapId);
        });
    });
    
    // Set up API key handling
    const saveApiKeyButton = document.getElementById('save-api-key');
    if (saveApiKeyButton) {
        saveApiKeyButton.addEventListener('click', function() {
            const apiKey = document.getElementById('stadia-api-key').value.trim();
            if (apiKey) {
                localStorage.setItem('stadia_maps_api_key', apiKey);
                alert('API key saved successfully!');
            } else {
                alert('Please enter a valid API key');
            }
        });
    }
});

// Define historical railroad routes in the Midwest and Northeast (1800s)
const usRailroads = [
    // Illinois Central Railroad (completed 1856)
    {
        name: "Illinois Central Railroad",
        year: 1856,
        region: "Midwest",
        route: [
            [42.4963, -90.6646], // Galena, IL
            [42.2711, -89.0939], // Rockford, IL
            [41.8781, -87.6298], // Chicago, IL
            [40.7967, -89.7400], // Peoria vicinity
            [40.1164, -88.2434], // Champaign, IL
            [39.8017, -89.6437], // Springfield, IL
            [38.5258, -89.9937], // East St. Louis vicinity
            [37.9064, -89.8487], // Carbondale vicinity
            [37.0128, -88.5717]  // Cairo, IL
        ]
    },
    // Chicago and North Western Railway (established 1859)
    {
        name: "Chicago and North Western",
        year: 1859,
        region: "Midwest",
        route: [
            [41.8781, -87.6298], // Chicago, IL
            [42.0834, -87.7945], // Northbrook vicinity
            [42.1883, -87.7992], // Highland Park vicinity
            [42.4793, -87.8216], // Waukegan, IL
            [42.5847, -87.8212], // Kenosha, WI
            [42.7261, -87.7828], // Racine, WI
            [43.0389, -87.9065], // Milwaukee, WI
            [43.4500, -88.8373], // Beaver Dam, WI
            [43.7844, -88.4381], // Fond du Lac, WI
            [44.2619, -88.4154]  // Oshkosh, WI
        ]
    },
    // Chicago, Burlington and Quincy Railroad (established 1849)
    {
        name: "Chicago, Burlington & Quincy",
        year: 1849,
        region: "Midwest",
        route: [
            [41.8781, -87.6298], // Chicago, IL
            [41.7636, -88.3147], // Aurora, IL
            [41.5878, -88.4272], // Plano vicinity
            [41.4281, -88.8461], // Mendota, IL
            [41.3456, -89.1326], // Princeton, IL
            [41.3456, -90.3460], // Galesburg, IL
            [40.9320, -91.0432], // Burlington, IA
            [39.9356, -91.4098]  // Quincy, IL
        ]
    },
    // Michigan Central Railroad (operating in 1850s)
    {
        name: "Michigan Central",
        year: 1850,
        region: "Midwest",
        route: [
            [41.8781, -87.6298], // Chicago, IL
            [41.6089, -87.3090], // Hammond/Gary, IN
            [41.6528, -86.8584], // South Bend vicinity
            [42.2917, -85.5872], // Kalamazoo, MI
            [42.3223, -83.1763], // Dearborn, MI
            [42.3314, -83.0458]  // Detroit, MI
        ]
    },
    // New York Central Railroad
    {
        name: "New York Central",
        year: 1853,
        region: "Northeast",
        route: [
            [40.7128, -74.0060], // New York, NY
            [41.0458, -73.5358], // Stamford, CT
            [41.7658, -72.6734], // Hartford, CT
            [42.1015, -72.5898], // Springfield, MA
            [42.3601, -71.0589], // Boston, MA
            [42.9634, -76.9309], // Geneva, NY
            [43.0481, -76.1474], // Syracuse, NY
            [43.1610, -77.6109], // Rochester, NY
            [42.8864, -78.8784], // Buffalo, NY
            [41.4993, -81.6944], // Cleveland, OH
            [41.8781, -87.6298]  // Chicago, IL
        ]
    },
    // Pennsylvania Railroad
    {
        name: "Pennsylvania Railroad",
        year: 1846,
        region: "Northeast",
        route: [
            [40.7128, -74.0060], // New York, NY
            [40.0115, -75.1327], // Philadelphia, PA
            [39.9526, -75.1652], // Philadelphia, main station
            [40.2732, -76.8867], // Harrisburg, PA
            [40.4406, -79.9959], // Pittsburgh, PA
            [40.4173, -80.0000], // Eastern Pittsburgh region
            [41.4993, -81.6944], // Cleveland, OH
            [41.6532, -83.5379], // Toledo, OH
            [42.3223, -83.1763], // Detroit, MI
            [41.8781, -87.6298]  // Chicago, IL
        ]
    },
    // Baltimore & Ohio Railroad
    {
        name: "Baltimore & Ohio",
        year: 1827,
        region: "Northeast",
        route: [
            [39.2904, -76.6122], // Baltimore, MD
            [39.7447, -77.7283], // Cumberland, MD
            [40.4406, -79.9959], // Pittsburgh, PA
            [39.9611, -82.9988], // Columbus, OH
            [39.1031, -84.5120], // Cincinnati, OH
            [38.6270, -90.1994]  // St. Louis, MO
        ]
    },
    // Erie Railroad
    {
        name: "Erie Railroad",
        year: 1832,
        region: "Northeast",
        route: [
            [40.7128, -74.0060], // New York, NY
            [41.0803, -74.1712], // Suffern, NY
            [41.3915, -74.6932], // Port Jervis, NY
            [41.4070, -75.6624], // Scranton, PA
            [41.2399, -77.0025], // Williamsport, PA
            [42.1292, -80.0851], // Erie, PA
            [41.4993, -81.6944]  // Cleveland, OH
        ]
    },
    // Boston and Albany Railroad
    {
        name: "Boston and Albany",
        year: 1833,
        region: "Northeast",
        route: [
            [42.3601, -71.0589], // Boston, MA
            [42.2626, -71.8023], // Worcester, MA
            [42.1015, -72.5898], // Springfield, MA
            [42.1256, -73.2882], // Lee, MA
            [42.4501, -73.2546], // Pittsfield, MA
            [42.6940, -73.7629], // Albany, NY
            [42.8142, -73.9396], // Schenectady, NY
            [43.0481, -76.1474]  // Syracuse, NY
        ]
    },
    // Lake Shore and Michigan Southern Railway
    {
        name: "Lake Shore & Michigan Southern",
        year: 1869,
        region: "Midwest/Northeast",
        route: [
            [41.8781, -87.6298], // Chicago, IL
            [41.6532, -83.5379], // Toledo, OH
            [41.4993, -81.6944], // Cleveland, OH
            [42.0889, -80.1886], // Erie, PA
            [42.8864, -78.8784]  // Buffalo, NY
        ]
    }
];

console.log("Railroad data initialized with " + usRailroads.length + " railroads");

// Functions for the PLSS grid system
function createPLSSGrid(map) {
    // Define the PLSS grid boundaries approximately covering the western US
    const westBoundary = -125; // Pacific coast
    const eastBoundary = -96;  // Roughly the eastern edge of PLSS territory
    const northBoundary = 49;  // US-Canada border
    const southBoundary = 31;  // Southern edge of New Mexico/Arizona
    
    // Define township size (6 miles ≈ 0.087 degrees at this latitude)
    const townshipSize = 0.087;
    
    // Get current zoom level
    const zoom = map.getZoom();
    
    try {
        // Draw principal meridians and baselines (always visible)
        drawPrincipalLines(map, westBoundary, eastBoundary, northBoundary, southBoundary);
        
        // Only draw townships if zoomed in enough - increased from zoom level 7 to 8
        if (zoom >= 8) {
            // Get the current map bounds to only draw what's visible
            const bounds = map.getBounds();
            const southVisible = Math.max(southBoundary, bounds.getSouth() - 0.5);
            const northVisible = Math.min(northBoundary, bounds.getNorth() + 0.5);
            const westVisible = Math.max(westBoundary, bounds.getWest() - 0.5);
            const eastVisible = Math.min(eastBoundary, bounds.getEast() + 0.5);
            
            // Limit the number of townships to draw (performance optimization)
            const maxTownships = 300; // Cap to prevent browser slowdown
            let townshipCount = 0;
            
            // Draw townships (6x6 mile squares)
            for (let lat = southVisible; lat < northVisible && townshipCount < maxTownships; lat += townshipSize) {
                for (let lng = westVisible; lng < eastVisible && townshipCount < maxTownships; lng += townshipSize) {
                    const townshipSquare = L.rectangle(
                        [[lat, lng], [lat + townshipSize, lng + townshipSize]],
                        {
                            color: "#FF0000",
                            weight: 1.2,
                            opacity: 0.6,
                            fillColor: "#FF0000",
                            fillOpacity: 0.05,
                            className: 'plss-township'
                        }
                    );
                    
                    // Add township label on hover
                    townshipSquare.bindTooltip(`Township: T${Math.round((lat - southBoundary) / townshipSize)}N R${Math.round((lng - westBoundary) / townshipSize)}E`, {
                        sticky: true,
                        className: 'plss-tooltip'
                    });
                    
                    // Add to the map and track
                    townshipSquare.addTo(map);
                    window.plssLayers.push(townshipSquare);
                    townshipCount++;
                    
                    // Draw sections (1x1 mile squares) only at higher zoom levels
                    if (zoom >= 10 && townshipCount < 100) { // Further limit section drawing
                        drawSections(map, lat, lng, townshipSize);
                    }
                }
            }
            
            // Add a warning if we hit the township limit
            if (townshipCount >= maxTownships) {
                console.log("Maximum township display limit reached. Zoom in for more detail.");
            }
        }
    } catch (error) {
        console.error("Error rendering PLSS grid:", error);
    }
}

// Draw the principal meridians and baselines of the PLSS system
function drawPrincipalLines(map, westBoundary, eastBoundary, northBoundary, southBoundary) {
    // Define principal meridians (selected historical lines)
    const principalMeridians = [
        { name: "Willamette Meridian", longitude: -122.7, latitude_range: [42, 49] },
        { name: "Mount Diablo Meridian", longitude: -121.9, latitude_range: [34, 42] },
        { name: "San Bernardino Meridian", longitude: -116.9, latitude_range: [33, 35] },
        { name: "Humboldt Meridian", longitude: -124.1, latitude_range: [40, 41] },
        { name: "Boise Meridian", longitude: -116.4, latitude_range: [42, 49] },
        { name: "Salt Lake Meridian", longitude: -111.9, latitude_range: [37, 42] },
        { name: "Navajo Meridian", longitude: -108.6, latitude_range: [35, 37] },
        { name: "New Mexico Meridian", longitude: -106.9, latitude_range: [31, 37] },
        { name: "Sixth Principal Meridian", longitude: -97.4, latitude_range: [40, 49] },
        { name: "Black Hills Meridian", longitude: -104.3, latitude_range: [43, 46] },
        { name: "Fifth Principal Meridian", longitude: -91.0, latitude_range: [33, 49] }
    ];
    
    // Define principal baselines (selected historical lines)
    const principalBaselines = [
        { name: "Willamette Baseline", latitude: 45.5, longitude_range: [-124.5, -116.5] },
        { name: "Mount Diablo Baseline", latitude: 37.8, longitude_range: [-124, -115] },
        { name: "San Bernardino Baseline", latitude: 34.1, longitude_range: [-119, -114] },
        { name: "Humboldt Baseline", latitude: 40.4, longitude_range: [-124.5, -123] },
        { name: "Salt Lake Baseline", latitude: 40.8, longitude_range: [-114, -109] },
        { name: "Boise Baseline", latitude: 43.4, longitude_range: [-117.5, -111] },
        { name: "Navajo Baseline", latitude: 35.8, longitude_range: [-110, -107] },
        { name: "New Mexico Baseline", latitude: 34.3, longitude_range: [-109, -103] },
        { name: "Sixth Principal Baseline", latitude: 40.0, longitude_range: [-105, -95] },
        { name: "Black Hills Baseline", latitude: 44.0, longitude_range: [-106, -103] },
        { name: "Fifth Principal Baseline", latitude: 34.8, longitude_range: [-94, -89] }
    ];
    
    // Draw each principal meridian
    principalMeridians.forEach(meridian => {
        const line = L.polyline(
            [
                [meridian.latitude_range[0], meridian.longitude],
                [meridian.latitude_range[1], meridian.longitude]
            ],
            {
                color: "#0000FF",
                weight: 2.5,
                opacity: 0.9,
                dashArray: "10, 5",
                className: 'plss-meridian'
            }
        );
        
        // Add meridian name as tooltip
        line.bindTooltip(meridian.name, {
            sticky: true,
            className: 'plss-meridian-tooltip'
        });
        
        line.addTo(map);
        window.plssLayers.push(line);
    });
    
    // Draw each principal baseline
    principalBaselines.forEach(baseline => {
        const line = L.polyline(
            [
                [baseline.latitude, baseline.longitude_range[0]],
                [baseline.latitude, baseline.longitude_range[1]]
            ],
            {
                color: "#008000",
                weight: 2.5,
                opacity: 0.9,
                dashArray: "10, 5",
                className: 'plss-baseline'
            }
        );
        
        // Add baseline name as tooltip
        line.bindTooltip(baseline.name, {
            sticky: true,
            className: 'plss-baseline-tooltip'
        });
        
        line.addTo(map);
        window.plssLayers.push(line);
    });
}

// Draw sections (1x1 mile squares) within a township
function drawSections(map, startLat, startLng, townshipSize) {
    try {
        // Define section size (1 mile ≈ 0.0145 degrees at this latitude)
        const sectionSize = townshipSize / 6;
        
        // Limit the number of sections per township (performance)
        const maxSections = 36; // Max sections in a township
        let sectionCount = 0;
        
        // Draw a 6x6 grid of sections inside the township
        for (let lat = startLat; lat < startLat + townshipSize - 0.001 && sectionCount < maxSections; lat += sectionSize) {
            for (let lng = startLng; lng < startLng + townshipSize - 0.001 && sectionCount < maxSections; lng += sectionSize) {
                // Create the section
                const section = L.rectangle(
                    [[lat, lng], [lat + sectionSize, lng + sectionSize]],
                    {
                        color: "#FFA500",
                        weight: 0.8, // Increased from 0.4 to 0.8 for better visibility
                        opacity: 0.7, // Increased from 0.4 to 0.7 for better visibility
                        fillColor: "#FFA500",
                        fillOpacity: 0.05, // Increased from 0.02 to 0.05 for better visibility
                        className: 'plss-section'
                    }
                );
                
                // Calculate section number (from 1-36 in standard PLSS)
                const sectionRow = Math.floor((lat - startLat) / sectionSize);
                const sectionCol = Math.floor((lng - startLng) / sectionSize);
                const sectionNumber = sectionRow * 6 + sectionCol + 1;
                
                // Add section tooltip
                section.bindTooltip(`Section ${sectionNumber}`, {
                    className: 'section-tooltip'
                });
                
                // Add to map and track
                section.addTo(map);
                window.plssLayers.push(section);
                sectionCount++;
            }
        }
    } catch (error) {
        console.error("Error rendering sections:", error);
    }
}

// Toggle the PLSS grid
function togglePLSSGrid(map, button) {
    try {
        // Check if grid is currently visible
        let isVisible = button.classList.contains('active');
        
        if (isVisible) {
            // Hide the grid
            window.plssLayers.forEach(layer => {
                if (layer instanceof L.Rectangle || layer instanceof L.Polyline) {
                    layer.remove();
                }
            });
            button.classList.remove('active');
        } else {
            // Show the grid
            button.classList.add('active');
            createPLSSGrid(map);
        }
    } catch (error) {
        console.error("Error toggling PLSS grid:", error);
    }
}

// Functions to support the highway comparison map
function clearHighwayLayers(map) {
    // Remove all highway-specific layers (but keep state boundaries and controls)
    if (window.highwayLayers) {
        window.highwayLayers = window.highwayLayers.filter(layer => {
            if (layer instanceof L.Polyline || 
                (layer instanceof L.LayerGroup && !(layer instanceof L.Control)) ||
                (layer instanceof L.Marker)) {
                if (map.hasLayer(layer)) map.removeLayer(layer);
                return false;
            }
            return true;
        });
    }
}

function showPre1956Highways(map) {
    // Major US Routes before the Interstate System (simplified)
    const pre1956Highways = [
        {
            name: "US Route 1",
            description: "Eastern Seaboard route from Maine to Florida",
            year: 1926,
            route: [
                [47.4590, -69.2254], // Fort Kent, ME
                [46.1428, -67.8390], // Houlton, ME
                [44.9012, -67.0023], // Calais, ME
                [44.3106, -68.8584], // Ellsworth, ME
                [44.1038, -69.1089], // Rockland, ME
                [43.6591, -70.2568], // Portland, ME
                [43.0718, -70.7626], // Portsmouth, NH
                [42.3601, -71.0589], // Boston, MA
                [41.7658, -72.6734], // Hartford, CT
                [41.3543, -72.0995], // New London, CT
                [41.0534, -73.5387], // Stamford, CT
                [40.7128, -74.0060], // New York, NY
                [40.2204, -74.7522], // Trenton, NJ
                [39.9526, -75.1652], // Philadelphia, PA
                [39.2904, -76.6122], // Baltimore, MD
                [38.9072, -77.0369], // Washington, DC
                [37.7749, -77.4194], // Richmond, VA
                [36.7335, -76.5327], // Norfolk, VA
                [36.0956, -79.4376], // Raleigh, NC
                [34.0407, -80.8323], // Columbia, SC
                [33.9711, -80.9731], // Savannah, GA
                [32.0809, -81.0912], // Jacksonville, FL
                [30.3322, -81.6557], // Daytona Beach, FL
                [28.5383, -81.3792], // Orlando, FL
                [27.9506, -82.4572], // Tampa, FL
                [26.1224, -80.1373], // Fort Lauderdale, FL
                [25.7617, -80.1918]  // Miami, FL
            ]
        },
        {
            name: "US Route 20",
            description: "Northern cross-country route",
            year: 1926,
            route: [
                [42.3601, -71.0589], // Boston, MA
                [42.2626, -71.8023], // Worcester, MA
                [42.1015, -72.5898], // Springfield, MA
                [42.4501, -73.2546], // Albany, NY
                [42.0987, -75.9180], // Binghamton, NY
                [42.0922, -78.4289], // Salamanca, NY
                [42.1292, -80.0851], // Erie, PA
                [41.4993, -81.6944], // Cleveland, OH
                [41.6532, -83.5379], // Toledo, OH
                [41.6140, -87.2339], // Gary, IN
                [41.8781, -87.6298], // Chicago, IL
                [42.5042, -90.6645], // Dubuque, IA
                [42.4963, -92.3389], // Waterloo, IA
                [42.4668, -94.1674], // Fort Dodge, IA
                [42.4963, -96.4003], // Sioux City, IA
                [42.8651, -97.3878], // Sioux Falls vicinity, SD
                [43.0383, -98.5386], // Near Pickstown, SD
                [42.8711, -106.3126], // Casper, WY
                [43.9792, -110.6818], // Yellowstone, WY
                [43.8231, -111.7924], // Idaho Falls, ID
                [43.6121, -116.2036], // Boise, ID
                [44.0520, -121.3153], // Bend, OR
                [44.0429, -123.0718], // Eugene, OR
                [44.9429, -123.0351], // Salem, OR
                [45.5051, -122.6750], // Portland, OR
                [46.1432, -122.9382], // Longview, WA
                [47.0379, -124.1698]  // Aberdeen, WA
            ]
        },
        {
            name: "US Route 30",
            description: "Lincoln Highway - First transcontinental highway",
            year: 1926,
            route: [
                [40.7447, -74.0406], // Jersey City, NJ
                [40.0379, -75.3716], // Philadelphia, PA vicinity
                [40.2732, -76.8867], // Harrisburg, PA
                [40.4406, -79.9959], // Pittsburgh, PA
                [40.7954, -81.3784], // Canton, OH
                [41.0814, -81.5191], // Akron, OH
                [41.4993, -81.6944], // Cleveland, OH
                [41.4700, -82.1792], // Mansfield, OH vicinity
                [41.0384, -83.6499], // Findlay, OH
                [41.0814, -85.1386], // Fort Wayne, IN
                [41.5349, -87.3435], // Gary, IN
                [41.8781, -87.6298], // Chicago, IL
                [41.5200, -90.5776], // Rock Island, IL vicinity
                [41.6611, -91.5302], // Iowa City, IA
                [41.7608, -93.6251], // Cedar Rapids, IA vicinity
                [41.5868, -93.6250], // Des Moines, IA
                [41.2619, -95.8608], // Council Bluffs, IA
                [41.2565, -95.9348], // Omaha, NE
                [41.1544, -101.0697], // North Platte, NE
                [41.1399, -104.8202], // Cheyenne, WY
                [41.7609, -108.7881], // Rock Springs, WY vicinity
                [41.5330, -112.0330], // Salt Lake City, UT
                [40.6338, -116.2389], // Elko, NV
                [39.5296, -119.8138], // Reno, NV
                [39.1682, -121.0937], // Sacramento, CA vicinity
                [37.8044, -122.2712]  // Oakland, CA
            ]
        },
        {
            name: "US Route 40",
            description: "National Road - Major east-west route",
            year: 1926,
            route: [
                [39.2904, -76.6122], // Baltimore, MD
                [39.7447, -77.7283], // Cumberland, MD vicinity
                [40.0595, -78.5170], // Bedford, PA
                [40.4406, -79.9959], // Pittsburgh, PA
                [40.0820, -80.7214], // Wheeling, WV
                [40.0992, -82.9871], // Columbus, OH
                [39.9611, -83.7972], // Springfield, OH vicinity
                [39.7589, -84.1916], // Dayton, OH
                [39.8283, -86.2358], // Indianapolis, IN vicinity
                [39.1031, -84.5120], // Cincinnati, OH vicinity
                [38.6270, -90.1994], // St. Louis, MO
                [39.0997, -94.5786], // Kansas City, MO
                [39.0504, -95.6889], // Topeka, KS
                [39.0639, -98.7675], // Russell, KS vicinity
                [39.7686, -104.9220], // Denver, CO vicinity
                [40.0149, -105.2705], // Boulder, CO
                [40.2454, -108.9520], // Craig, CO vicinity
                [40.6338, -111.4949], // Park City, UT
                [40.7608, -111.8910], // Salt Lake City, UT
                [40.7177, -114.8802], // Wendover, UT
                [39.5296, -119.8138], // Reno, NV vicinity
                [38.8026, -120.8039], // Placerville, CA vicinity
                [38.5816, -121.4944], // Sacramento, CA
                [37.9543, -121.2872], // Stockton, CA
                [37.3387, -120.4640], // Merced, CA vicinity
                [36.3728, -119.2861], // Visalia, CA vicinity
                [35.3733, -119.0187], // Bakersfield, CA
                [34.0522, -118.2437]  // Los Angeles, CA
            ]
        },
        {
            name: "US Route 50",
            description: "Transcontinental \"Loneliest Road in America\"",
            year: 1926,
            route: [
                [38.9072, -77.0369], // Washington, DC
                [39.2962, -76.6089], // Baltimore, MD vicinity
                [39.4143, -77.4105], // Frederick, MD
                [39.1547, -77.9959], // Winchester, VA vicinity
                [38.4495, -78.8689], // Staunton, VA vicinity
                [38.0293, -81.1868], // Charleston, WV vicinity
                [38.4112, -82.4452], // Huntington, WV vicinity
                [39.1031, -84.5120], // Cincinnati, OH
                [38.9342, -85.3909], // North Vernon, IN vicinity
                [38.6709, -87.5286], // Vincennes, IN
                [38.5177, -89.9839], // St. Louis, MO vicinity
                [38.7289, -93.2513], // Sedalia, MO vicinity
                [38.9717, -95.2353], // Kansas City, KS vicinity
                [38.7839, -98.7675], // Russell, KS vicinity
                [38.4675, -101.7724], // Tribune, KS vicinity
                [38.2544, -104.6091], // Pueblo, CO
                [38.4552, -105.9420], // Salida, CO
                [38.5736, -106.9253], // Gunnison, CO
                [39.0639, -108.5507], // Grand Junction, CO
                [39.1911, -111.8129], // Salina, UT
                [38.7775, -112.0829], // Scipio, UT vicinity
                [39.3643, -114.2192], // Ely, NV vicinity
                [39.1638, -119.7674], // Carson City, NV
                [38.8026, -120.8039], // Placerville, CA vicinity
                [38.5816, -121.4944]  // Sacramento, CA
            ]
        },
        {
            name: "US Route 66",
            description: "The \"Mother Road\" connecting Chicago to California",
            year: 1926,
            route: [
                [41.8781, -87.6298], // Chicago, IL
                [41.3275, -88.9975], // Bloomington, IL vicinity
                [39.8020, -89.6437], // Springfield, IL
                [38.6270, -90.1994], // St. Louis, MO
                [38.3380, -92.5293], // Jefferson City, MO
                [37.0870, -93.2918], // Springfield, MO
                [37.0842, -94.5133], // Joplin, MO
                [36.2946, -95.2375], // Tulsa, OK
                [35.4676, -97.5164], // Oklahoma City, OK
                [35.2220, -101.8313], // Amarillo, TX
                [35.0843, -106.6504], // Albuquerque, NM
                [35.0853, -110.9559], // Winslow, AZ vicinity
                [35.1983, -111.6513], // Flagstaff, AZ
                [35.1897, -114.0530], // Kingman, AZ vicinity
                [34.4839, -114.3224], // Needles, CA vicinity
                [34.0522, -117.3887], // San Bernardino, CA vicinity
                [34.0522, -118.2437]  // Los Angeles, CA
            ]
        },
        {
            name: "US Route 101",
            description: "Pacific Coast Highway",
            year: 1926,
            route: [
                [48.3705, -124.6126], // Olympia, WA vicinity
                [47.6062, -122.3321], // Seattle, WA
                [47.0379, -122.9007], // Olympia, WA
                [46.1432, -122.9382], // Longview, WA vicinity
                [45.5051, -122.6750], // Portland, OR
                [44.9429, -123.0351], // Salem, OR
                [44.0521, -123.0868], // Eugene, OR
                [43.1072, -124.4330], // Coos Bay, OR vicinity
                [42.0543, -124.2857], // Brookings, OR vicinity
                [41.7558, -124.1963], // Crescent City, CA
                [40.8021, -124.1637], // Eureka, CA
                [38.4406, -122.7144], // Santa Rosa, CA vicinity
                [37.7749, -122.4194], // San Francisco, CA
                [37.3337, -121.8907], // San Jose, CA vicinity
                [36.2724, -121.8079], // Big Sur, CA vicinity
                [35.2799, -120.6597], // San Luis Obispo, CA
                [34.4208, -119.6982], // Santa Barbara, CA
                [34.0522, -118.2437], // Los Angeles, CA
                [33.7175, -118.1812], // Long Beach, CA
                [33.1959, -117.3795], // Oceanside, CA
                [32.7157, -117.1611]  // San Diego, CA
            ]
        }
    ];
    
    // Add the pre-1956 roads to the map
    pre1956Highways.forEach(highway => {
        // Create a polyline for each highway
        const roadLine = L.polyline(
            highway.route,
            {
                color: '#A52A2A', // Brown for old highways
                weight: 3,
                opacity: 0.9,
                lineJoin: 'round'
            }
        ).addTo(map);
        
        // Add a popup with information
        roadLine.bindPopup(
            `<div class="highway-popup">
                <h3>${highway.name}</h3>
                <p>${highway.description}</p>
                <p>Established: ${highway.year}</p>
            </div>`
        );
        
        // Add tooltip that appears on hover
        roadLine.bindTooltip(highway.name, {
            permanent: false,
            direction: 'center',
            className: 'highway-tooltip',
            sticky: true
        });
        
        window.highwayLayers.push(roadLine);
    });
    
    // Add cities as markers
    const majorCities = [
        { name: "New York", coordinates: [40.7128, -74.0060] },
        { name: "Chicago", coordinates: [41.8781, -87.6298] },
        { name: "Los Angeles", coordinates: [34.0522, -118.2437] },
        { name: "St. Louis", coordinates: [38.6270, -90.1994] },
        { name: "Washington DC", coordinates: [38.9072, -77.0369] },
        { name: "San Francisco", coordinates: [37.7749, -122.4194] },
        { name: "Boston", coordinates: [42.3601, -71.0589] },
        { name: "Miami", coordinates: [25.7617, -80.1918] },
        { name: "Seattle", coordinates: [47.6062, -122.3321] },
        { name: "Denver", coordinates: [39.7392, -104.9903] }
    ];
    
    majorCities.forEach(city => {
        const cityMarker = L.circleMarker(
            city.coordinates, 
            {
                radius: 5,
                fillColor: "#333",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }
        ).bindTooltip(city.name, {
            permanent: false,
            direction: 'top',
            className: 'city-tooltip'
        }).addTo(map);
        
        window.highwayLayers.push(cityMarker);
    });
    
    // Add a legend
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info legend');
        div.innerHTML = `
            <div class="legend-title">US Highways Before Interstate System (Pre-1956)</div>
            <div class="legend-item">
                <div class="legend-pre1956"></div>
                <div>US Highway Routes</div>
            </div>
            <div class="legend-item">
                <div class="legend-city-pre1956"></div>
                <div>Major Cities</div>
            </div>
            <div class="legend-note">
                Before the Interstate Highway System, the US relied on a network of national highways<br>
                designated by the Bureau of Public Roads. These routes were often narrow, passed<br>
                directly through towns, and lacked consistent design standards.
            </div>
        `;
        return div;
    };
    
    legend.addTo(map);
    window.highwayLayers.push(legend);
}

function show1969Highways(map) {
    // The Interstate Highway System as of 1969 (major routes, simplified)
    const interstatesBy1969 = [
        {
            name: "Interstate 5",
            completed: 1968,
            description: "Pacific Coast Interstate from Mexico to Canada",
            route: [
                [32.5439, -117.0315], // San Diego/Mexican Border
                [33.1959, -117.3795], // Oceanside, CA vicinity
                [34.0522, -118.2437], // Los Angeles, CA
                [35.3733, -119.0187], // Bakersfield, CA
                [36.7378, -119.7871], // Fresno, CA
                [37.3541, -121.9552], // San Jose, CA
                [38.5816, -121.4944], // Sacramento, CA
                [40.5865, -122.3917], // Redding, CA
                [42.3265, -122.8756], // Medford, OR
                [44.0521, -123.0868], // Eugene, OR
                [45.5051, -122.6750], // Portland, OR
                [46.7246, -122.9665], // Centralia, WA vicinity
                [47.6062, -122.3321], // Seattle, WA
                [48.7519, -122.4787]  // Bellingham, WA
            ]
        },
        {
            name: "Interstate 10",
            completed: 1967,
            description: "Southernmost cross-country route from California to Florida",
            route: [
                [34.0522, -118.2437], // Los Angeles, CA
                [33.9534, -117.3962], // San Bernardino, CA vicinity
                [33.7175, -116.1745], // Indio, CA vicinity
                [33.4484, -112.0740], // Phoenix, AZ
                [32.2226, -110.9747], // Tucson, AZ
                [31.8457, -106.5645], // El Paso, TX
                [31.9686, -104.0307], // Van Horn, TX vicinity
                [31.9685, -102.0779], // Odessa, TX
                [31.4638, -100.4370], // San Angelo, TX vicinity
                [30.2672, -97.7431], // Austin, TX
                [29.7604, -95.3698], // Houston, TX
                [30.0444, -93.7152], // Lake Charles, LA vicinity
                [30.2241, -92.0198], // Lafayette, LA
                [30.4515, -91.1871], // Baton Rouge, LA
                [30.3674, -89.0928], // Gulfport, MS vicinity
                [30.6954, -88.0399], // Mobile, AL
                [30.4383, -84.2807], // Tallahassee, FL
                [30.3322, -81.6557]  // Jacksonville, FL
            ]
        },
        {
            name: "Interstate 15",
            completed: 1967,
            description: "Western route connecting San Diego to Montana",
            route: [
                [32.5439, -117.0315], // San Diego, CA
                [33.9534, -117.3962], // San Bernardino, CA vicinity
                [35.1897, -114.0530], // Las Vegas, NV vicinity
                [37.1053, -113.5765], // St. George, UT
                [39.5296, -111.8910], // Nephi, UT
                [40.7608, -111.8910], // Salt Lake City, UT
                [41.9192, -112.0372], // Pocatello, ID vicinity
                [43.6121, -116.2036], // Boise, ID
                [45.7814, -111.8010], // Butte, MT
                [47.5026, -111.3008]  // Great Falls, MT
            ]
        },
        {
            name: "Interstate 20",
            completed: 1965,
            description: "Southern route connecting Texas to South Carolina",
            route: [
                [32.4615, -94.7455], // Shreveport, LA vicinity
                [32.5007, -93.7501], // Longview, TX vicinity
                [32.7555, -97.3308], // Fort Worth, TX
                [32.7767, -96.7970], // Dallas, TX
                [32.4412, -93.7851], // Shreveport, LA
                [32.4490, -92.1581], // Monroe, LA
                [32.2988, -90.1848], // Jackson, MS
                [32.3668, -88.7029], // Meridian, MS
                [33.5186, -86.8104], // Birmingham, AL
                [33.7490, -84.3880], // Atlanta, GA
                [33.9806, -81.0317], // Columbia, SC
                [34.1954, -79.7626]  // Florence, SC
            ]
        },
        {
            name: "Interstate 25",
            completed: 1969,
            description: "Western north-south route through the Rocky Mountains",
            route: [
                [31.7619, -106.4850], // El Paso, TX vicinity
                [32.3199, -106.7637], // Las Cruces, NM
                [35.0844, -106.6504], // Albuquerque, NM
                [35.6870, -105.9378], // Santa Fe, NM
                [36.4072, -105.5730], // Raton, NM vicinity
                [38.2544, -104.6091], // Pueblo, CO
                [39.7392, -104.9903], // Denver, CO
                [40.5853, -105.0844], // Fort Collins, CO
                [41.1400, -104.8202], // Cheyenne, WY
                [42.8501, -106.3251], // Casper, WY
                [44.2783, -105.5019]  // Buffalo, WY vicinity
            ]
        },
        {
            name: "Interstate 35",
            completed: 1967,
            description: "Central north-south route connecting Mexico to Canada",
            route: [
                [27.5306, -99.5032], // Laredo, TX
                [29.4241, -98.4936], // San Antonio, TX
                [30.2672, -97.7431], // Austin, TX
                [31.5493, -97.1467], // Waco, TX
                [32.7767, -96.7970], // Dallas, TX
                [33.9137, -97.1467], // Ardmore, OK vicinity
                [35.4676, -97.5164], // Oklahoma City, OK
                [36.1540, -95.9928], // Tulsa, OK vicinity
                [37.6922, -97.3375], // Wichita, KS
                [38.9717, -95.2353], // Kansas City, KS vicinity
                [41.0780, -93.4711], // Des Moines, IA vicinity
                [44.9778, -93.2650], // Minneapolis, MN
                [46.7867, -96.7898]  // Fargo, ND vicinity
            ]
        },
        {
            name: "Interstate 40",
            completed: 1966,
            description: "Major east-west route across the southern US",
            route: [
                [35.1983, -120.6597], // Barstow, CA
                [35.1983, -114.0530], // Kingman, AZ vicinity
                [35.1983, -111.6513], // Flagstaff, AZ
                [35.0844, -106.6504], // Albuquerque, NM
                [35.2220, -101.8313], // Amarillo, TX
                [35.4676, -97.5164], // Oklahoma City, OK
                [35.4720, -94.4853], // Fort Smith, AR
                [35.1495, -90.0490], // Memphis, TN
                [35.1455, -85.2672], // Chattanooga, TN
                [35.9606, -83.9207], // Knoxville, TN
                [36.0956, -79.8254], // Greensboro, NC
                [35.7721, -78.6386], // Raleigh, NC
                [34.2257, -77.9447]  // Wilmington, NC
            ]
        },
        {
            name: "Interstate 55",
            completed: 1968,
            description: "Major north-south route along the Mississippi River",
            route: [
                [29.9511, -90.0715], // New Orleans, LA
                [31.3274, -89.2903], // Hattiesburg, MS vicinity
                [32.2988, -90.1848], // Jackson, MS
                [34.3815, -89.5192], // Batesville, MS
                [35.1495, -90.0490], // Memphis, TN
                [36.4072, -89.0689], // Sikeston, MO
                [37.9643, -91.8318], // St. Louis, MO
                [39.1031, -89.4812], // Springfield, IL vicinity
                [40.6331, -89.3985], // Bloomington, IL
                [41.8781, -87.6298]  // Chicago, IL
            ]
        },
        {
            name: "Interstate 70",
            completed: 1969,
            description: "Major east-west route through the central US",
            route: [
                [40.0149, -105.2705], // Denver, CO vicinity
                [39.7827, -104.8277], // Aurora, CO
                [39.3642, -101.0737], // Oakley, KS vicinity
                [38.8791, -97.6114], // Salina, KS vicinity
                [39.0997, -94.5786], // Kansas City, MO
                [38.6270, -90.1994], // St. Louis, MO
                [39.9611, -82.9988], // Columbus, OH
                [40.4406, -79.9959], // Pittsburgh, PA
                [39.9526, -75.1652], // Philadelphia, PA
                [39.2904, -76.6122]  // Baltimore, MD
            ]
        },
        {
            name: "Interstate 75",
            completed: 1969,
            description: "Major north-south route in eastern US",
            route: [
                [25.7617, -80.1918], // Miami, FL
                [26.6406, -80.7467], // West Palm Beach, FL vicinity
                [27.9506, -82.4572], // Tampa, FL vicinity
                [30.4383, -84.2807], // Tallahassee, FL vicinity
                [31.5785, -84.1557], // Albany, GA vicinity
                [33.7490, -84.3880], // Atlanta, GA
                [35.1455, -85.2672], // Chattanooga, TN
                [35.9606, -83.9207], // Knoxville, TN
                [37.9881, -84.1743], // Lexington, KY vicinity
                [39.1031, -84.5120], // Cincinnati, OH
                [40.7724, -84.1052], // Dayton, OH
                [41.6532, -83.5379], // Toledo, OH
                [42.3314, -83.0458], // Detroit, MI
                [43.5841, -83.8889], // Saginaw, MI vicinity
                [45.0275, -84.6748]  // Mackinac, MI vicinity
            ]
        },
        {
            name: "Interstate 80",
            completed: 1968,
            description: "Major northern east-west transcontinental route",
            route: [
                [37.8044, -122.2712], // Oakland/San Francisco, CA 
                [39.5296, -119.8138], // Reno, NV
                [40.7608, -111.8910], // Salt Lake City, UT
                [41.2565, -110.9559], // Evanston, WY
                [41.1399, -104.8202], // Cheyenne, WY
                [41.2565, -95.9348], // Omaha, NE
                [41.6005, -93.6091], // Des Moines, IA
                [41.8781, -87.6298], // Chicago, IL
                [41.4993, -81.6944], // Cleveland, OH
                [40.4406, -79.9959], // Pittsburgh, PA
                [40.7128, -74.0060]  // New York, NY
            ]
        },
        {
            name: "Interstate 90",
            completed: 1968,
            description: "Northernmost east-west transcontinental route",
            route: [
                [47.6062, -122.3321], // Seattle, WA
                [47.0379, -118.2437], // Spokane, WA vicinity
                [45.6736, -111.0429], // Bozeman, MT
                [45.7814, -108.5007], // Billings, MT
                [44.0805, -103.2310], // Rapid City, SD
                [43.5460, -96.7310], // Sioux Falls, SD
                [43.0383, -87.9065], // Milwaukee, WI
                [41.8781, -87.6298], // Chicago, IL
                [41.7409, -86.2491], // South Bend, IN
                [41.4993, -81.6944], // Cleveland, OH
                [42.8864, -78.8784], // Buffalo, NY
                [42.6526, -73.7562], // Albany, NY
                [42.3601, -71.0589]  // Boston, MA
            ]
        },
        {
            name: "Interstate 95",
            completed: 1968,
            description: "Major north-south eastern seaboard route",
            route: [
                [25.7617, -80.1918], // Miami, FL
                [26.7153, -80.0534], // West Palm Beach, FL
                [28.5383, -81.3792], // Orlando, FL vicinity
                [30.3322, -81.6557], // Jacksonville, FL
                [32.0809, -81.0912], // Savannah, GA
                [34.0007, -80.9731], // Columbia, SC
                [35.2270, -80.8432], // Charlotte, NC
                [36.0956, -79.8254], // Greensboro, NC vicinity
                [37.5407, -77.4360], // Richmond, VA
                [38.9072, -77.0369], // Washington, DC
                [39.2904, -76.6122], // Baltimore, MD
                [39.9526, -75.1652], // Philadelphia, PA
                [40.7128, -74.0060], // New York, NY
                [41.7658, -72.6734], // Hartford, CT
                [41.8240, -71.4128], // Providence, RI
                [42.3601, -71.0589]  // Boston, MA
            ]
        }
    ];
    
    // Add 1969 interstates to the map
    interstatesBy1969.forEach(interstate => {
        // Create a polyline for each interstate
        const interstateRoute = L.polyline(
            interstate.route,
            {
                color: '#003399', // Blue for interstate
                weight: 5,
                opacity: 0.9,
                lineJoin: 'round'
            }
        ).addTo(map);
        
        // Add a popup with information
        interstateRoute.bindPopup(
            `<div class="interstate-popup">
                <h3>${interstate.name}</h3>
                <p>${interstate.description}</p>
                <p>Completed by: ${interstate.completed}</p>
            </div>`
        );
        
        // Add tooltip that appears on hover
        interstateRoute.bindTooltip(interstate.name, {
            permanent: false,
            direction: 'center',
            className: 'interstate-tooltip',
            sticky: true
        });
        
        window.highwayLayers.push(interstateRoute);
    });
    
    // Add major cities as markers
    const majorCities = [
        { name: "New York", coordinates: [40.7128, -74.0060] },
        { name: "Chicago", coordinates: [41.8781, -87.6298] },
        { name: "Los Angeles", coordinates: [34.0522, -118.2437] },
        { name: "St. Louis", coordinates: [38.6270, -90.1994] },
        { name: "Washington DC", coordinates: [38.9072, -77.0369] },
        { name: "San Francisco", coordinates: [37.7749, -122.4194] },
        { name: "Boston", coordinates: [42.3601, -71.0589] },
        { name: "Miami", coordinates: [25.7617, -80.1918] },
        { name: "Seattle", coordinates: [47.6062, -122.3321] },
        { name: "Denver", coordinates: [39.7392, -104.9903] },
        { name: "Dallas", coordinates: [32.7767, -96.7970] },
        { name: "Atlanta", coordinates: [33.7490, -84.3880] }
    ];
    
    majorCities.forEach(city => {
        const cityMarker = L.circleMarker(
            city.coordinates, 
            {
                radius: 6,
                fillColor: "#ff4d4d",
                color: "#000",
                weight: 1.5,
                opacity: 1,
                fillOpacity: 0.9
            }
        ).bindTooltip(city.name, {
            permanent: false,
            direction: 'top',
            className: 'city-tooltip'
        }).addTo(map);
        
        window.highwayLayers.push(cityMarker);
    });
    
    // Add a legend
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info legend');
        div.innerHTML = `
            <div class="legend-title">Interstate Highway System (1969)</div>
            <div class="legend-item">
                <div class="legend-interstate"></div>
                <div>Interstate Highways</div>
            </div>
            <div class="legend-item">
                <div class="legend-city-interstate"></div>
                <div>Major Cities</div>
            </div>
            <div class="legend-note">
                By 1969, many major Interstate Highway corridors had been completed following<br>
                the Federal-Aid Highway Act of 1956. This system featured controlled access,<br>
                standardized design, and efficient movement of goods and people across the nation.
            </div>
        `;
        return div;
    };
    
    legend.addTo(map);
    window.highwayLayers.push(legend);
}

function createAirportNetwork(map, airportData) {
    // Clear existing layers if any
    if (window.airportLayers && window.airportLayers.length > 0) {
        window.airportLayers.forEach(layer => {
            if (map.hasLayer(layer)) map.removeLayer(layer);
        });
    }
    window.airportLayers = [];
    
    // Filter to include all airports with an IATA code
    const filteredAirports = airportData.features.filter(feature => {
        return feature.properties.iata_code && feature.geometry; // Ensure it has coordinates and IATA code
    });
    
    // Create a lookup map for faster airport finding
    const airportMap = {};
    filteredAirports.forEach(airport => {
        airportMap[airport.properties.iata_code] = airport;
    });
    
    // Connection colors by region
    const regionColors = {
        "North America": "#3498db", // Blue
        "South America": "#2ecc71", // Green
        "Europe": "#e74c3c",       // Red
        "Africa": "#f39c12",       // Orange
        "Asia": "#9b59b6",         // Purple
        "Oceania": "#1abc9c"       // Teal
    };
    
    // Helper to determine which region a coordinate belongs to (approximation)
    function getRegion(lat, lng) {
        // North America
        if (lat > 15 && lng < -30 && lng > -170) return "North America";
        
        // South America
        if (lat < 15 && lat > -60 && lng < -30 && lng > -90) return "South America";
        
        // Europe
        if (lat > 35 && lat < 70 && lng > -10 && lng < 40) return "Europe";
        
        // Africa
        if (lat < 35 && lat > -40 && lng > -20 && lng < 55) return "Africa";
        
        // Asia
        if ((lat > 0 && lat < 70 && lng > 55 && lng < 180) ||
            (lat > 0 && lat < 70 && lng < -150)) return "Asia";
        
        // Oceania
        if (lat < 0 && lat > -50 && lng > 100 && lng < 180) return "Oceania";
        
        // Default
        return "Other";
    }
    
    // Draw all airports with different styles based on size to show continental patterns
    filteredAirports.forEach(airport => {
        const coords = airport.geometry.coordinates;
        const region = getRegion(coords[1], coords[0]);
        const airportType = airport.properties.type || 'small';
        
        let radius, color, opacity;
        
        // Style airports by size
        if (airportType.includes('major')) {
            radius = 4;
            color = '#f39c12'; // Orange for major airports
            opacity = 0.9;
        } else if (airportType.includes('mid')) {
            radius = 2.5;
            color = '#f1c40f'; // Yellow for mid-sized airports
            opacity = 0.8;
        } else {
            radius = 1.5;
            color = '#ecf0f1'; // Light gray for smaller airports
            opacity = 0.7;
        }
        
        // Create airport marker
        const airportMarker = L.circleMarker([coords[1], coords[0]], {
            radius: radius,
            fillColor: color,
            color: '#fff',
            weight: 0.5,
            opacity: 0.6,
            fillOpacity: opacity
        }).addTo(map);
        
        // Add tooltip for larger airports only to reduce clutter
        if (airportType.includes('major') || airportType.includes('mid')) {
            airportMarker.bindTooltip(`
                <strong>${airport.properties.name} (${airport.properties.iata_code})</strong><br>
                ${region}
            `, {
                className: 'airport-tooltip'
            });
        }
        
        window.airportLayers.push(airportMarker);
    });
    
    // Define regional hub airports for creating connections
    const regionalHubs = [
        // North America
        { code: "ATL", name: "Atlanta" }, 
        { code: "ORD", name: "Chicago" },
        { code: "LAX", name: "Los Angeles" },
        { code: "JFK", name: "New York" },
        { code: "YYZ", name: "Toronto" },
        { code: "MEX", name: "Mexico City" },
        
        // South America
        { code: "GRU", name: "São Paulo" },
        { code: "BOG", name: "Bogotá" },
        { code: "SCL", name: "Santiago" },
        { code: "LIM", name: "Lima" },
        
        // Europe
        { code: "LHR", name: "London" },
        { code: "CDG", name: "Paris" },
        { code: "FRA", name: "Frankfurt" },
        { code: "IST", name: "Istanbul" },
        { code: "MAD", name: "Madrid" },
        
        // Africa
        { code: "JNB", name: "Johannesburg" },
        { code: "CAI", name: "Cairo" },
        { code: "LOS", name: "Lagos" },
        { code: "NBO", name: "Nairobi" },
        
        // Asia
        { code: "PEK", name: "Beijing" },
        { code: "HND", name: "Tokyo" },
        { code: "SIN", name: "Singapore" },
        { code: "DEL", name: "Delhi" },
        { code: "DXB", name: "Dubai" },
        
        // Oceania
        { code: "SYD", name: "Sydney" },
        { code: "MEL", name: "Melbourne" },
        { code: "AKL", name: "Auckland" }
    ];
    
    // Create connections for each hub - more strategic connections
    regionalHubs.forEach(hub => {
        const hubAirport = airportMap[hub.code];
        if (!hubAirport) return; // Skip if hub not found
        
        const hubCoords = hubAirport.geometry.coordinates;
        const hubRegion = getRegion(hubCoords[1], hubCoords[0]);
        const regionColor = regionColors[hubRegion] || "#7f8c8d"; // Default gray if region not found
        
        // Find nearby airports in the same region (limit to fewer connections)
        const nearbyAirports = filteredAirports
            .filter(airport => {
                if (airport.properties.iata_code === hub.code) return false;
                
                const coords = airport.geometry.coordinates;
                const dx = coords[0] - hubCoords[0];
                const dy = coords[1] - hubCoords[1];
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                const airportRegion = getRegion(coords[1], coords[0]);
                
                // Connect to airports in same region that are relatively close
                return airportRegion === hubRegion && distance < 25;
            })
            .slice(0, 3); // Connect to a max of 3 nearby airports (reduced number)
        
        // Also add 1-2 long distance connections to other hubs
        const otherHubs = regionalHubs
            .filter(otherHub => {
                if (otherHub.code === hub.code) return false;
                
                const otherAirport = airportMap[otherHub.code];
                if (!otherAirport) return false;
                
                const otherCoords = otherAirport.geometry.coordinates;
                const otherRegion = getRegion(otherCoords[1], otherCoords[0]);
                
                // Connect to hubs in different regions
                return otherRegion !== hubRegion;
            })
            .slice(0, 2); // Connect to 1-2 other hubs
        
        // Create connections to nearby airports to emphasize regional patterns
        nearbyAirports.forEach(airport => {
            drawConnection(hubAirport, airport, map, regionColor, 0.7);
        });
        
        // Create connections to other hubs to show intercontinental connections
        otherHubs.forEach(otherHub => {
            const otherAirport = airportMap[otherHub.code];
            if (otherAirport) {
                const otherRegion = getRegion(otherAirport.geometry.coordinates[1], otherAirport.geometry.coordinates[0]);
                // Use a white color with higher opacity for long-distance connections
                drawConnection(hubAirport, otherAirport, map, "#ffffff", 0.4);
            }
        });
    });
    
    // Helper function to draw a connection between two airports
    function drawConnection(sourceAirport, targetAirport, map, color, opacity) {
        const sourceCoords = sourceAirport.geometry.coordinates;
        const targetCoords = targetAirport.geometry.coordinates;
        
        // Create a curved line
        const controlPoint = getCurvedPathControlPoint(sourceCoords, targetCoords);
        
        // First, draw the base path with lower opacity
        const basePath = L.curve(
            [
                'M', [sourceCoords[1], sourceCoords[0]],
                'Q', [controlPoint.lat, controlPoint.lng],
                [targetCoords[1], targetCoords[0]]
            ],
            {
                color: color,
                weight: 1.5,
                opacity: opacity * 0.7,
                fill: false,
                className: 'flight-path'
            }
        ).addTo(map);
        
        // Then, draw a thinner, more opaque path on top for the highlight effect
        const highlightPath = L.curve(
            [
                'M', [sourceCoords[1], sourceCoords[0]],
                'Q', [controlPoint.lat, controlPoint.lng],
                [targetCoords[1], targetCoords[0]]
            ],
            {
                color: color,
                weight: 0.8,
                opacity: opacity * 1.3,
                fill: false,
                className: 'flight-path-highlight'
            }
        ).addTo(map);
        
        // Add tooltip
        basePath.bindTooltip(`
            ${sourceAirport.properties.name} (${sourceAirport.properties.iata_code}) to 
            ${targetAirport.properties.name} (${targetAirport.properties.iata_code})
        `, {
            className: 'connection-tooltip'
        });
        
        window.airportLayers.push(basePath);
        window.airportLayers.push(highlightPath);
    }
    
    // Add a legend
    const legend = L.control({position: 'bottomright'});
    legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info legend airport-legend');
        div.innerHTML = `
            <div class="legend-title">Global Airport Network</div>
            <div class="legend-item">
                <div style="background-color: #f39c12; width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px; border: 1px solid white;"></div>
                Major Airports
            </div>
            <div class="legend-item">
                <div style="background-color: #f1c40f; width: 5px; height: 5px; border-radius: 50%; display: inline-block; margin-right: 8px; border: 1px solid white;"></div>
                Mid-sized Airports
            </div>
            <div class="legend-item">
                <div style="background-color: #ecf0f1; width: 3px; height: 3px; border-radius: 50%; display: inline-block; margin-right: 8px; border: 1px solid white;"></div>
                Local Airports
            </div>
            <div class="legend-subtitle">Continental Connections</div>
            ${Object.entries(regionColors).map(([region, color]) => `
                <div class="legend-item">
                    <span style="background-color: ${color}; display: inline-block; width: 20px; height: 2px; margin-right: 8px;"></span>
                    ${region}
                </div>
            `).join('')}
            <div class="legend-item">
                <span style="background-color: #ffffff; display: inline-block; width: 20px; height: 2px; margin-right: 8px;"></span>
                Intercontinental
            </div>
            <div class="legend-note">
                <small>Airport density reveals continental patterns</small>
            </div>
        `;
        return div;
    };
    
    legend.addTo(map);
    window.airportLayers.push(legend);
}

// Helper function to create curved flight paths
function getCurvedPathControlPoint(source, target) {
    // Calculate midpoint
    const midLng = (source[0] + target[0]) / 2;
    const midLat = (source[1] + target[1]) / 2;
    
    // Calculate distance
    const dx = target[0] - source[0];
    const dy = target[1] - source[1];
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Create curve based on distance
    const curvature = Math.min(distance / 10, 12); // Limit max curvature
    
    // Calculate control point (perpendicular to midpoint)
    const angle = Math.atan2(dy, dx) + Math.PI/2;
    const controlLng = midLng + curvature * Math.cos(angle);
    const controlLat = midLat + curvature * Math.sin(angle);
    
    return { lat: controlLat, lng: controlLng };
}

// Common setup for all maps
function setupCommonMapFeatures(map) {
    // Add scale control
    L.control.scale({
        imperial: true,
        metric: true,
        position: 'bottomleft'
    }).addTo(map);
    
    // Add zoom control
    map.zoomControl.setPosition('topleft');
}

// ... existing code ...