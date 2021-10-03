import React, { useEffect } from "react";
import { button, folder, Leva, useControls } from "leva";
import {
  useQueryParams,
  BooleanParam,
  StringParam,
  NumberParam,
} from "use-query-params";
import { useHistory } from "react-router";

const defaultValsPath = `?backgroundColour=rgb%28255%2C%20255%2C%20255%2C%201%29&baseColour=%23862c1c&blockSize=7&brightnessAdjust=0&contrast=0&cropBottom=1&cropLeft=0&cropRight=1&cropTop=0&explodeFromX=0.48&explodeFromY=0.61&explodeOuterBlocks=1&explosionLevel=72&minExplodeDistance=0.19&multiplier=0.1&pixelsWide=135&removeLightestColour=0&totalColours=10&useRandom=1&useRotation=1`;

export default function Controls({ showControls = true, onChange }) {
  const [query, setQuery] = useQueryParams({
    explodeOuterBlocks: BooleanParam,
    useRotation: BooleanParam,
    useRandom: BooleanParam,
    baseColour: StringParam,
    backgroundColour: StringParam,
    blockSize: NumberParam,
    brightnessAdjust: NumberParam,
    contrast: NumberParam,
    pixelsWide: NumberParam,
    explosionLevel: NumberParam,
    explodeFromX: NumberParam,
    explodeFromY: NumberParam,
    minExplodeDistance: NumberParam,
    multiplier: NumberParam,
    totalColours: NumberParam,
    cropTop: NumberParam,
    cropLeft: NumberParam,
    cropRight: NumberParam,
    cropBottom: NumberParam,
  });
  let history = useHistory();

  const [values, set] = useControls(() => ({
    sizes: folder(
      {
        blockSize: {
          value: 7,
          step: 1,
          min: 1,
          max: 100,
          onChange: (value) => setQuery({ blockSize: value }),
        },
        pixelsWide: {
          value: 242,
          step: 1,
          min: 1,
          max: 1000,
          onChange: (value) => setQuery({ pixelsWide: value }),
        },
      },
      {
        collapsed: true,
      }
    ),

    colours: folder(
      {
        totalColours: {
          value: 10,
          step: 1,
          min: 1,
          max: 50,
          onChange: (value) => setQuery({ totalColours: value }),
        },

        baseColour: {
          value: "#862c1c",
          onChange: (value) => setQuery({ baseColour: value }),
        },

        backgroundColour: {
          value: { r: 255, g: 255, b: 255, a: 1 },
          onChange: (value) => {
            const c = value;
            setQuery({
              backgroundColour: `rgb(${c.r}, ${c.g}, ${c.b}, ${c.a})`,
            });
          },
        },
      },
      {
        collapsed: true,
      }
    ),

    cropping: folder(
      {
        cropLeft: {
          value: 0,
          min: 0,
          max: 1,
          onChange: (value) => setQuery({ cropLeft: value }),
        },
        cropTop: {
          value: 0,
          min: 0,
          max: 1,
          onChange: (value) => setQuery({ cropTop: value }),
        },
        cropRight: {
          value: 1,
          min: 0,
          max: 1,
          onChange: (value) => setQuery({ cropRight: value }),
        },
        cropBottom: {
          value: 1,
          min: 0,
          max: 1,
          onChange: (value) => setQuery({ cropBottom: value }),
        },
      },
      {
        collapsed: true,
      }
    ),

    explosionEffect: folder(
      {
        explodeOuterBlocks: {
          value: true,
          onChange: (value) => setQuery({ explodeOuterBlocks: value }),
        },
        explodeFromX: {
          value: 0.5,
          min: 0,
          max: 1,
          onChange: (value) => setQuery({ explodeFromX: value }),
          render: (get) => get("explosionEffect.explodeOuterBlocks") === true,
        },
        explodeFromY: {
          value: 0.5,
          min: 0,
          max: 1,
          onChange: (value) => setQuery({ explodeFromY: value }),
          render: (get) => get("explosionEffect.explodeOuterBlocks") === true,
        },
        minExplodeDistance: {
          value: 0.5,
          min: 0,
          max: 1,
          onChange: (value) => setQuery({ minExplodeDistance: value }),
          render: (get) => get("explosionEffect.explodeOuterBlocks") === true,
        },
        explosionLevel: {
          value: 10,
          step: 1,
          min: 0,
          max: 100,
          onChange: (value) => setQuery({ explosionLevel: value }),
          render: (get) => get("explosionEffect.explodeOuterBlocks") === true,
        },
        multiplier: {
          value: 0.7,
          min: 0.1,
          max: 100,
          onChange: (value) => setQuery({ multiplier: value }),
          render: (get) => get("explosionEffect.explodeOuterBlocks") === true,
        },

        useRotation: {
          value: true,
          onChange: (value) => setQuery({ useRotation: value }),
          render: (get) => get("explosionEffect.explodeOuterBlocks") === true,
        },

        useRandom: {
          value: true,
          onChange: (value) => setQuery({ useRandom: value }),
          render: (get) => get("explosionEffect.explodeOuterBlocks") === true,
        },
      },
      {
        collapsed: false,
      }
    ),

    imageAdjustments: folder(
      {
        brightnessAdjust: {
          value: 0,
          step: 1,
          min: -100,
          max: 100,
          onChange: (value) => setQuery({ brightnessAdjust: value }),
        },

        contrast: {
          value: 0,
          step: 1,
          min: -100,
          max: 100,
          onChange: (value) => setQuery({ contrast: value }),
        },
      },
      {
        collapsed: true,
      }
    ),

    reset: button(() => history.push(`/${defaultValsPath}`)),
  }));

  useEffect(() => {
    const updatedKeys = Object.keys(query);
    if (updatedKeys.length > 0) {
      const updates = {};

      for (let key of updatedKeys) {
        updates[key] = query[key];
      }

      // set the controls based on the query
      set(updates);

      // update the app based on the query
      onChange({ ...values, ...updates });
    }

    // eslint-disable-next-line
  }, [query]);

  return <Leva hidden={!showControls} />;
}
