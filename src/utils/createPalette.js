import { hslToRgbObj } from "./UTILS";

// PALETTE MAKER
export const createPixelPortraitPalette = ({
  baseHue = 0,
  baseSaturation = 50,
  totalColours = 10,
  labels,
  customHues = [],
}) => {
  const brightnessBandSize = 100 / (totalColours - 1);
  const swatches = [];
  const symbols = []; //["", "O", "X", "#", "=", "M", "%", "&"];

  for (let i = 0; i < totalColours; i++) {
    const lightness = Math.round(100 - brightnessBandSize * i);
    const greyRGB = hslToRgbObj(0, 100, lightness);
    // use a number if the symbol doesn't exist
    const symbol = i < symbols.length ? symbols[i] : i + 1;

    const customHue = customHues[i] ? customHues[i] : null;

    swatches.push({
      greyRGB,
      hue: baseHue,
      saturation: baseSaturation,
      lightness,
      symbol,
      customHue,
    });
  }

  return {
    baseHue,
    baseSaturation,
    totalColours,
    swatches,
    labels,
  };
};
