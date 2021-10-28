import { Map, IControl } from "mapbox-gl";
import Buffer from "@turf/buffer";
import PolygonToLine from "@turf/polygon-to-line";
import NearestPointOnLine from "@turf/nearest-point-on-line";

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

export default class MapboxForbiddenAreaControl implements IControl {
  private map: Map | undefined;
  private forbiddenAreaControl: HTMLElement | undefined;
  private featureCollection: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
    type: "FeatureCollection",
    features: [],
  };
  private forbiddenAreaFeatureCollection:
    | GeoJSON.FeatureCollection<GeoJSON.Geometry>
    | undefined = undefined;
  private radius: number = 0.2;
  private forbiddenAreaConfiguration: ForbiddenAreaConfiguration = {
    sourceConfiguration: { id: "forbidden-area" },
    layerConfiguration: {
      id: "forbidden-area",
      type: "fill",
      paint: { "fill-opacity": 0.5, "fill-color": "#ff0000" },
    },
  };
  private getGeometryOnEnterForbiddenArea: any;
  private eventsToFire: string[] = ["mouseup"];
  private eventsToDisable: string[] = ["mouseup"];

  constructor(parameters: Parameters | undefined) {
    if (parameters) {
      let {
        featureCollection,
        radius,
        forbiddenAreaConfiguration,
        getGeometryOnEnterForbiddenArea,
        eventsToFire,
        eventsToDisable,
      } = parameters;
      if (featureCollection) {
        this.featureCollection = featureCollection;
      }
      if (radius !== undefined) {
        this.radius = radius;
      }
      if (forbiddenAreaConfiguration) {
        this.forbiddenAreaConfiguration = {
          ...this.forbiddenAreaConfiguration,
          ...forbiddenAreaConfiguration,
        };
      }
      if (getGeometryOnEnterForbiddenArea) {
        this.getGeometryOnEnterForbiddenArea = getGeometryOnEnterForbiddenArea;
      }
      if (eventsToFire) {
        this.eventsToFire = eventsToFire;
      }
      if (eventsToDisable) {
        this.eventsToDisable = eventsToDisable;
      }
    }
  }

  public onAdd(currentMap: Map): HTMLElement {
    this.map = currentMap;
    this.forbiddenAreaControl = this.createUI();
    this.map.once("idle", this.configureMap);
    return this.forbiddenAreaControl;
  }

  public onRemove(): void {
    this.map!.off("idle", this.configureMap);
    this.forbiddenAreaControl?.remove();
  }

  private createUI(): HTMLDivElement {
    const forbiddenAreaControlContainer = document.createElement("div");

    return forbiddenAreaControlContainer;
  }

  private configureMap = (): void => {
    this.initializeSourceAndLayers();
    this.initializeEvents();
    this.map!.fire("mouseup", { point: { x: undefined, y: undefined } });
    this.map!.fire("forbiddenarea:isready");
  };

  private initializeSourceAndLayers(): void {
    this.forbiddenAreaFeatureCollection = Buffer(
      this.featureCollection!,
      this.radius
    );
    this.map!.addSource(
      this.forbiddenAreaConfiguration.sourceConfiguration.id,
      {
        type: "geojson",
        data: this.forbiddenAreaFeatureCollection,
        generateId: true,
      }
    );
    this.map!.addLayer({
      source: this.forbiddenAreaConfiguration.sourceConfiguration.id,
      ...this.forbiddenAreaConfiguration.layerConfiguration,
    } as any);
  }

  private initializeEvents(): void {
    const disableEvent = (e: any) => {
      e.stopPropagation();
      e.preventDefault();
    };

    this.map!.on(
      "mouseenter",
      this.forbiddenAreaConfiguration.layerConfiguration.id,
      (e) => {
        this.handleMapCursor("not-allowed");
        for (const event of this.eventsToFire) {
          this.map!.fire(event, e);
        }
        for (const event of this.eventsToDisable) {
          this.map!.getCanvas().addEventListener(event, disableEvent, true);
        }
        if (this.getGeometryOnEnterForbiddenArea) {
          if (
            this.forbiddenAreaConfiguration.layerConfiguration.type === "fill"
          ) {
            const polygonToLine = PolygonToLine(
              (this.forbiddenAreaFeatureCollection!.features as any)[
                (e as any).features[0].id
              ].geometry
            );
            const nearestPointOnLine = NearestPointOnLine(
              polygonToLine as any,
              [e.lngLat.lng, e.lngLat.lat]
            );
            this.getGeometryOnEnterForbiddenArea(nearestPointOnLine.geometry);
          } else {
            this.getGeometryOnEnterForbiddenArea(
              (e as any).features[0].geometry
            );
          }
        }
      }
    );
    this.map!.on(
      "mouseleave",
      this.forbiddenAreaConfiguration.layerConfiguration.id,
      () => {
        this.handleMapCursor("");
        for (const event of this.eventsToDisable) {
          this.map!.getCanvas().removeEventListener(event, disableEvent, true);
        }
      }
    );
  }

  public updateForbiddenAreaSource(source: any): void {
    this.featureCollection = source;
    this.forbiddenAreaFeatureCollection = this.radius
      ? Buffer(source, this.radius)
      : source;
    const forbiddenAreaSource = this.map!.getSource(
      this.forbiddenAreaConfiguration.sourceConfiguration.id
    );
    (forbiddenAreaSource as any).setData(this.forbiddenAreaFeatureCollection);
  }

  private handleMapCursor(cursor: string): void {
    this.map!.getCanvas().style.cursor = cursor;
  }
}
