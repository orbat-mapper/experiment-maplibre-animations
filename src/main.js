// Based on https://maplibre.org/maplibre-gl-js/docs/examples/animate-a-point/
import "./style.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { GlobeControl, Map as MlMap, NavigationControl } from "maplibre-gl";
import ms from "milsymbol";

const map = new MlMap({
  container: "map",
  // style: "https://demotiles.maplibre.org/globe.json",
  style: "https://tiles.openfreemap.org/styles/positron",
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
const radius = 40;

const iconUrls = {
  // horse: "https://maps.google.com/mapfiles/kml/shapes/horsebackriding.png",
  // airport2: "https://maps.google.com/mapfiles/kml/shapes/airports.png",
  // volcano2: "https://maps.google.com/mapfiles/kml/shapes/volcano.png",
  // heliport2: "https://maps.google.com/mapfiles/kml/shapes/heliport.png",
  "mil-1": "10031000141211004600",
  "mil-2": "10063000001200000000",
  "mil-3": "10064000001106050000",
  "mil-4": "10041500001106030000",
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

function createMilsymbolImage(iconId, sidc, options = {}) {
  const symb = new ms.Symbol(sidc, {
    size: 20,
    ...options,
  });
  const { width, height } = symb.getSize();
  const data = symb
    .asCanvas(2)
    ?.getContext("2d")
    ?.getImageData(0, 0, 2 * width, 2 * height);
  if (data && !map.hasImage(iconId)) {
    map.addImage(iconId, data, { pixelRatio: 2 });
  }
}

function animateMarkers(timestamp) {
  const features = createFeatures(timestamp);
  map.getSource("point")?.setData({ type: "FeatureCollection", features });
  requestAnimationFrame(animateMarkers);
}

map.on("load", async () => {
  // add icons to map
  let image;
  for (const [icon, url] of Object.entries(iconUrls)) {
    if (icon.startsWith("mil-")) {
      createMilsymbolImage(icon, url, {
        size: 20,
        outlineWidth: 10,
        outlineColor: "yellow",
      });
    } else {
      image = await map.loadImage(url);
      if (image && !map.hasImage(icon)) map.addImage(icon, image.data);
    }
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
      "icon-size": 1,
      // "icon-size": 1,
    },
  });

  // Start the animation.
  animateMarkers(0);
});
