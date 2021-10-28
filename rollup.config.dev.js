import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import html from "@rollup/plugin-html";
import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";

const mapboxglToken = process.env.mapboxglToken;

export default [
  {
    input: "src/index.ts",
    output: {
      dir: "dev",
      format: "es",
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript(),
      html({
        fileName: "index.html",
        template: () => {
          const attribute = `lang="en"`;
          const meta = `<meta charset="utf-8">`;
          const title = `mapbox-gl-forbidden-area`;
          const linkFavicon = `<link rel="shortcut icon" type="image/x-icon" href="https://makina-corpus.com/favicon.ico">`;
          const linkMapbox = `<link href="https://api.mapbox.com/mapbox-gl-js/v1.12.0/mapbox-gl.css" rel="stylesheet" /><link rel='stylesheet' href='https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.3.0/mapbox-gl-draw.css' type='text/css' />`;
          const links = `${linkFavicon}${linkMapbox}`;
          const content = `<div id="map" style="width: 100vw; height: 100vh;"></div>`;
          const scriptMapbox = `<script src="https://api.mapbox.com/mapbox-gl-js/v1.12.0/mapbox-gl.js"></script><script src='https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.3.0/mapbox-gl-draw.js'></script>`;
          const scriptPage = `
            <script type="module">
              import MapboxForbiddenAreaControl from "./index.js";
              mapboxgl.accessToken = "${mapboxglToken}";
              var map = new mapboxgl.Map({ container: "map", style: "mapbox://styles/mapbox/streets-v11", center: [2.21, 46.22], zoom: 12 });
              map.on('error', ({ error }) => {
                // Invalid access token
                console.error(error)
                document.write(error.message)
              });
              const Draw = new MapboxDraw();

              let isMouseDown = false;
              window.addEventListener("mousedown", () => {
                isMouseDown = true;
              });
              window.addEventListener("mouseup", () => {
                isMouseDown = false;
              });

              const mapboxForbiddenAreaControl = new MapboxForbiddenAreaControl({
                getGeometryOnEnterForbiddenArea: (geometry) => {
                  if (isMouseDown) {
                    const getSelected = Draw.getSelected();
                    if (getSelected.features.length > 0) {
                      getSelected.features[0].geometry = { ...geometry };
                      const getAll = Draw.getAll();
                      getAll.features.push(getSelected.features[0]);
                      Draw.set(getAll);
                      Draw.changeMode("simple_select");
                    }
                  }
                }
              });
              map.addControl(mapboxForbiddenAreaControl);
              map.addControl(Draw, 'top-left');
              map.on("forbiddenarea:isready", () => {
                mapboxForbiddenAreaControl.updateForbiddenAreaSource({
                  type: "FeatureCollection",
                  features: [
                    {
                      type: "Feature",
                      geometry: { type: "Point", coordinates: [2.21, 46.22] },
                      properties: {},
                    },
                    {
                      type: "Feature",
                      geometry: { type: "Point", coordinates: [2.23, 46.22] },
                      properties: {},
                    },
                  ],
                });
              });
            </script>
            `;
          const scripts = `${scriptMapbox}${scriptPage}`;
          return `<!DOCTYPE html><html ${attribute}><head>${meta}<title>${title}</title>${links}</head><body style="margin: 0">${content}${scripts}</body></html>`;
        },
      }),
      serve({ contentBase: "dev", port: 9000 }),
      livereload(),
    ],
  },
];
