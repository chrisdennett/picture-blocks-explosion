import React, { useState, useRef, useEffect } from "react";
// Style
import styles from "./app.module.css";
// utils
import {
  copyToCanvas,
  createMaxSizeCanvas,
  GetImageFromUrl,
  hexToHsl,
} from "./utils/UTILS";
import { createPixelPortraitCanvas } from "./utils/createPixelNumberCanvas";
// comps
import Controls from "./controls/Controls";
import { createPixelPortraitPalette } from "./utils/createPalette";

export const editors = ["Colour", "Greyscale"];

// baseHue: 188,
// baseSaturation: 30,
const App = () => {
  const [params, setParams] = useState({});
  const [settings, setSettings] = useState({});
  const [sourceCanvas, setSourceCanvas] = useState(null);
  const canvasRef = useRef(null);

  // DERIVE SETTINGS FROM PARAMS
  useEffect(() => {
    if (!params.blockSize) return;
    let newSettings = { ...params };

    // combine crop data
    newSettings.crop = {
      left: params.cropLeft,
      right: params.cropRight,
      top: params.cropTop,
      bottom: params.cropBottom,
    };

    const baseHSL = hexToHsl(params.baseColour);

    // just use numbers for labels
    let labels = [];
    for (let i = 0; i < params.totalColours; i++) {
      labels.push((i + 1).toString());
    }

    // generate pallete
    newSettings.palette = createPixelPortraitPalette({
      baseHue: baseHSL.hue,
      baseSaturation: baseHSL.saturation,
      labels,
      totalColours: params.totalColours,
    });

    setSettings(newSettings);
  }, [params]);

  // LOAD IN IMAGE
  useEffect(() => {
    GetImageFromUrl(
      `/images/Dorothy-Wordsworth-transparent-bg-levels.png`,
      (img) => {
        const src = createMaxSizeCanvas(img);
        setSourceCanvas(src);
      }
    );
  }, []);

  // Create the canvas
  useEffect(() => {
    const updateBlockCanvas = (canvas, sourceCanvas, settings) => {
      if (!canvas || !sourceCanvas || !settings.palette) return;

      const { canvas: portraitCanvas } = createPixelPortraitCanvas(
        sourceCanvas,
        settings
      );

      copyToCanvas(portraitCanvas, canvas);
    };

    updateBlockCanvas(canvasRef.current, sourceCanvas, settings);
  }, [sourceCanvas, settings]);

  const onParamsChange = (newParams) => setParams(newParams);

  return (
    <div className={styles.app}>
      <Controls onChange={onParamsChange} />
      <canvas ref={canvasRef} />
    </div>
  );
};

export default App;
