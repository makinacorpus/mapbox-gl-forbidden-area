# Mapbox-gl-forbidden-area

_Mapbox-gl-forbidden-area_ allows you to disable events on feature collection.  
It requires [Mapbox-gl-js](https://github.com/mapbox/mapbox-gl-js) (or [Maplibre-gl-js](https://github.com/maplibre/maplibre-gl-js)) as a dependency.

## Run Locally

```bash
cd mapbox-gl-forbidden-area
```

Install dependencies

```bash
npm install
```

Start the server

```bash
mapboxglToken="YOUR_ACCESS_TOKEN" npm run start
```

## Build

```bash
npm run build
```

# Installation

Install <em>Mapbox-gl-forbidden-area</em> with your package manager:

```bash
npm install @makina-corpus/mapbox-gl-forbidden-area
```

## Usage in your application

```js
import MapboxForbiddenAreaControl from "@makina-corpus/mapbox-gl-forbidden-area";
```

### Sample configuration

```js
const mapboxForbiddenAreaControl = new MapboxForbiddenAreaControl(parameters);

map.addControl(mapboxForbiddenAreaControl);
```

# Parameters

```typescript
interface Parameters {
  featureCollection?: GeoJSON.FeatureCollection<GeoJSON.Geometry>;
  eventsToFire?: string[];
  eventsToDisable?: string[];
  radius?: number;
  forbiddenAreaConfiguration?: ForbiddenAreaConfiguration;
  getGeometryOnEnterForbiddenArea?: Function;
}

interface ForbiddenAreaConfiguration {
  sourceConfiguration: { id: string };
  layerConfiguration: {
    id: string;
    type: string;
    paint: { "fill-opacity": number; "fill-color": string };
  };
}
```
