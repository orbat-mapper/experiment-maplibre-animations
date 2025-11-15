// Based on https://maplibre.org/maplibre-gl-js/docs/examples/animate-a-point/
import "./style.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { Map as MlMap, GlobeControl, NavigationControl } from "maplibre-gl";

const map = new MlMap({
  container: "map",
  style: "https://demotiles.maplibre.org/globe.json",
  // style: "https://tiles.openfreemap.org/styles/positron",
  center: [0, 0],
  zoom: 2,
});

map.addControl(new GlobeControl());
map.addControl(
  new NavigationControl({
    visualizePitch: true,
    visualizeRoll: true,
    showZoom: true,
    showCompass: true,
  }),
);

map.on("style.load", () => {
  map.setProjection({
    type: "globe", // Set projection to globe
  });
});

const numPoints = 500;
const radius = 20;

const iconUrls = {
  horse: "http://maps.google.com/mapfiles/kml/shapes/horsebackriding.png",
  airport2: "http://maps.google.com/mapfiles/kml/shapes/airports.png",
  volcano2: "http://maps.google.com/mapfiles/kml/shapes/volcano.png",
  heliport2: "http://maps.google.com/mapfiles/kml/shapes/heliport.png",
};

const icons = Object.keys(iconUrls);

function pointOnCircle(angle, radius = 20, icon = "airport") {
  return {
    type: "Feature",
    properties: { icon, bearing: 0 },
    geometry: {
      type: "Point",
      coordinates: [Math.cos(angle) * radius, Math.sin(angle) * radius],
    },
  };
}

function createFeatures(timestamp) {
  return Array.from({ length: numPoints }, (_, i) =>
    pointOnCircle(
      ((i / numPoints) * 2 * Math.PI * timestamp) / 100000,
      i * radius * 0.1,
      icons[i % icons.length],
    ),
  );
}

function animateMarkers(timestamp) {
  const features = createFeatures(timestamp);
  map.getSource("point")?.setData({ type: "FeatureCollection", features });
  requestAnimationFrame(animateMarkers);
}

map.on("load", async () => {
  // add icons to map
  for (const [icon, url] of Object.entries(iconUrls)) {
    const image = await map.loadImage(url);
    if (!map.hasImage(icon)) map.addImage(icon, image.data);
  }

  map.addSource("point", {
    type: "geojson",
    data: { type: "FeatureCollection", features: createFeatures(0) },
  });

  map.addLayer({
    id: "point",
    source: "point",
    type: "symbol",
    layout: {
      "icon-image": ["get", "icon"],
      "icon-rotate": ["get", "bearing"],
      "icon-rotation-alignment": "map",
      "icon-overlap": "always",
      "icon-ignore-placement": true,
      "icon-size": 0.5,
    },
  });

  // Start the animation.
  animateMarkers(0);
});
