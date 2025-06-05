// beginning map for soil interactive map

// create base map using esri satellite imagery
const map = L.map('map').setView([20.8247, -156.919409], 8);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
}).addTo(map);

// set ahupuaa and soil series as separate panes to set ahupuaa lines higher in z-axis so they always appear over soil polygons
map.createPane('ahupuaaPane');
map.getPane('ahupuaaPane').style.zIndex = 500;

map.createPane('seriesPane');
map.getPane('seriesPane').style.zIndex = 450;

const urlLanai = 'https://lepolad.github.io/interactive-soil-maps/lanai_soil_combined.json';
const urlOahu = 'https://lepolad.github.io/interactive-soil-maps/oahu_soil_combined.json';
const urlMolokai = 'https://lepolad.github.io/interactive-soil-maps/molokai_soil_combined.json';
const urlMaui = 'https://lepolad.github.io/interactive-soil-maps/maui_soil_combined.json';
const urlKauai = 'https://lepolad.github.io/interactive-soil-maps/kauai_soil_combined.json';
const urlHawaii = 'https://lepolad.github.io/interactive-soil-maps/hawaii_soil_combined.json';
const urlKahoolawe = 'https://lepolad.github.io/interactive-soil-maps/kahoolawe_soil_combined.json';

const groupProperty = 'order';

const groupedLayers = {};

// adding ahupuaa to the map
// uses data from here: https://geoportal.hawaii.gov/datasets/HiStateGIS::ahupuaa/about
addAhupuaa();

// adds soil polygon layers to the map, calling all the other functions below
addLayers(groupProperty);








// FUNCTION SECTION


// maps colors to soil orders to color them together
function getColor(order) {
    switch (order) {
        case 'Inceptisols': return 'blue';
        case 'Oxisols': return 'red';
        case 'Ultisols': return 'purple';
        case 'Mollisols': return '#E0218A';
        case 'Vertisols': return 'orange';
        case 'Entisols': return 'yellow';
        case 'Spodosols': return 'cyan';
        case 'Aridisols': return 'brown';
        case 'Histosols': return 'greenyellow';
        case 'Andisols': return 'darkslateblue'
        case 'Undefined': return 'white';
        default: return 'white';
    }
}
;



// function for retrieve data and group polygons by a given property
async function getAndGroupData(url, property){

    try{
        const response = await fetch(url);
        if(!response.ok){
            throw new Error(`Stay all hammajang my dawg, ${response.status}`);
        }

        const data = await response.json();

        // looping through each polygon in the data and grouping by the given property (soil order or soil series)
        // feature here refers to individual polygons from the json data object
        data.features.forEach(feature => {
            const groupName = feature.properties[property];

            // make new group if no exist
            if(!groupedLayers[groupName]){
                groupedLayers[groupName] = L.featureGroup();
            }

            // turning each feature into a leaflet polygon so it can be added to the map
            if(typeof feature === 'object' && feature !== null && feature.type === 'Feature' && feature.geometry){
                try{
                    const polygon = L.geoJSON(feature,
                        {style: (feature) => {
                            try{
                                const prop = feature.properties[property];
                                return{
                                    fillColor: getColor(prop), // color the polygons by soil order or soil series
                                    color: getColor(prop),
                                    weight: 1,
                                    fillOpacity: 0.5
                                }
                            }
                            // polygons with errors shown in black to highlight them for us to fix
                            catch (error){
                                console.error('style function stay hammajang', error)
                                return{
                                    fillColor: 'black',
                                    color: 'black',
                                    weight: 1,
                                    fillOpacity: 1
                                }
                            }
                           
                           
                         },
                        pane: 'seriesPane'
                        }
                    )    
                //    make polygons display the property when clicked
                   polygon.bindPopup(feature.properties['series']);
                //    add individual polygon to group
                   polygon.addTo(groupedLayers[groupName]);
                }
                catch (error){
                    console.error('stay all jam up trying for make L.GeoJSON', error, feature);
                }
            }
            

            
        });

    }
    catch(error){
        console.error('something stay more broken than your teeth', error);    
    }
}

// adds the layers and layer groups to the map
// stuff comes all kapakahi if no more seperate async function with await for getAndGroupData
async function initializeLayers(url, property){
    await getAndGroupData(url, property);

    // adding layer groups to map
    for(const groupName in groupedLayers){
        groupedLayers[groupName].addTo(map);
    }
}

// adjusts layers on map based on layer selector
function handleLayerChange(event){
    const selectedGroup = event.target.value;

    // add all layers for 'all'
    if (selectedGroup === 'all'){
        for (const groupName in groupedLayers){
            if(!map.hasLayer(groupedLayers[groupName])){
                groupedLayers[groupName].addTo(map);
            }
        }
    }
    // remove all layers if not 'all'
    else {
        for (const groupName in groupedLayers){
            if (map.hasLayer(groupedLayers[groupName])){
                map.removeLayer(groupedLayers[groupName]);
            }
        }
    }

    // showing selected layer
    if (groupedLayers[selectedGroup] && !map.hasLayer(groupedLayers[selectedGroup])) {
        groupedLayers[selectedGroup].addTo(map);
    }

}

/* calls initializeLayers for each island and then adds the dropdown selector afterwards
I went make it this way so that the dropdown has all of the orders on it and doesn't add
any soil orders to it multiple times.
I also tried having it loop through a list of the urls but that went broke instantly
*/
async function addLayers(prop){
    await initializeLayers(urlLanai, prop);
    await initializeLayers(urlOahu, prop);
    await initializeLayers(urlMolokai, prop);
    await initializeLayers(urlMaui, prop);
    await initializeLayers(urlKauai, prop);
    await initializeLayers(urlHawaii, prop);
    await initializeLayers(urlKahoolawe, prop);


    // adding layer control to dropdown located off of the map
    const dropdown = document.getElementById('dropdown');
    for(const groupName in groupedLayers){
        const option = document.createElement('option');
        option.value = groupName;
        option.textContent = groupName;
        dropdown.appendChild(option);  
    }

    dropdown.addEventListener('change', handleLayerChange);
}


// adds ahupuaa layer to map, sets them on upper pane and non-interactive so they no interfere with soil series polygons
async function addAhupuaa(){
    const url = 'https://geodata.hawaii.gov/arcgis/rest/services/HistoricCultural/MapServer/1/query?outFields=*&where=1%3D1&f=geojson'

    try{
        const response = await fetch(url);
        if(!response.ok){
            throw new Error(`Ahupuaa stay buss up, something wrong ${response.status}`);
        }

        const data = await response.json();
        
        data.features.forEach(feature => {
             // turning each feature into a leaflet polygon so it can be added to the map
            if(typeof feature === 'object' && feature !== null && feature.type === 'Feature' && feature.geometry){
                try{
                    const polygon = L.geoJSON(feature,
                        {
                            style: {'color': "black", 'weight': 1, 'fill':false},
                            pane: 'ahupuaaPane',
                            interactive:false
                        }
                    )
                    polygon.addTo(map);
                }
                catch(error){
                    console.error('Brah your ahupuaa polygons stay messed up', error);
                }
            }
        })
    }
    catch(error){
        console.error('You gotta get it together brah', error);
    }
}