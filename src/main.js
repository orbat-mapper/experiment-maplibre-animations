// Based on https://maplibre.org/maplibre-gl-js/docs/examples/animate-a-point/
import "./style.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { GlobeControl, Map as MlMap, NavigationControl } from "maplibre-gl";
import ms from "milsymbol";

// Tweak these values to see different effects
let numberOfFeatures = 500;
let radius = 40; //
let timeFactor = 100000; // higher value = slower animation
const pixelRatio = 2; // used when converting MIL-STD-2525D symbols to images

// Icon names that starts with "mil-" are MILSTD2525D/APP6-D symbol identification codes
const iconData = {
  // horse: "https://maps.google.com/mapfiles/kml/shapes/horsebackriding.png",
  // airport2: "https://maps.google.com/mapfiles/kml/shapes/airports.png",
  // volcano2: "https://maps.google.com/mapfiles/kml/shapes/volcano.png",
  // heliport2: "https://maps.google.com/mapfiles/kml/shapes/heliport.png",
  "mil-1": "10031000141211004600",
  "mil-2": "10063000001200000000",
  "mil-3": "10064000001106050000",
  "mil-4": "10041500001106030000",
};

const iconNames = Object.keys(iconData);
const map = await setupMap();

async function setupMap() {
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

  for (const [icon, url] of Object.entries(iconData)) {
    if (icon.startsWith("mil-")) {
      const data = createMilsymbolImage(url, {
        pixelRatio,
        options: {
          size: 20,
          outlineWidth: 10,
          outlineColor: "yellow",
        },
      });
      if (data && !map.hasImage(icon)) map.addImage(icon, data, { pixelRatio });
    } else {
      const image = await map.loadImage(url);
      if (image && !map.hasImage(icon)) map.addImage(icon, image.data);
    }
  }

  map.on("style.load", () => {
    map.setProjection({
      type: "globe",
    });

    map.addSource("point", {
      type: "geojson",
      data: { type: "FeatureCollection", features: createFeatures(0) },
    });

    map.addLayer({
      id: "point",
      source: "point",
      type: "symbol",
      // https://maplibre.org/maplibre-style-spec/layers/#symbol
      layout: {
        "icon-image": ["get", "icon"],
        "icon-rotate": ["get", "bearing"],
        "icon-rotation-alignment": "map",
        "icon-overlap": "always",
        "icon-ignore-placement": true,
        "icon-size": 1,
        // "icon-size": 0.5,
      },
    });
  });

  return map;
}

function pointOnCircle(angle, radius, icon) {
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
  return Array.from({ length: numberOfFeatures }, (_, i) =>
    pointOnCircle(
      ((i / numberOfFeatures) * 2 * Math.PI * timestamp) / timeFactor,
      i * radius * 0.1,
      iconNames[i % iconNames.length],
    ),
  );
}

function createMilsymbolImage(sidc, { pixelRatio = 2, options = {} } = {}) {
  const symb = new ms.Symbol(sidc, {
    size: 20,
    ...options,
  });
  const { width, height } = symb.getSize();
  return symb
    .asCanvas(pixelRatio)
    ?.getContext("2d")
    ?.getImageData(0, 0, pixelRatio * width, pixelRatio * height);
}

function animateFeatures(timestamp) {
  const features = createFeatures(timestamp);
  map.getSource("point")?.setData({ type: "FeatureCollection", features });
  requestAnimationFrame(animateFeatures);
}

map.on("load", async () => {
  // Start the animation.
  animateFeatures(0);
});
