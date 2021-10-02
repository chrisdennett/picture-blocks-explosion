import {
  createBrightnessCanvas,
  createThresholdCanvas,
  createRestrictedGreysCanvas,
  createMaxSizeCanvas,
  createCroppedCanvas,
  getDistance,
} from "./UTILS";

// CREATE PORTRAIT PIXEL BLOCKS
export const createPixelPortraitBlocks = (inputCanvas, settings) => {
  // use a transparent bg until the eng
  const {
    contrast = 0,
    brightnessAdjust = 0,
    pixelsWide = 24,
    crop,
    palette,
    backgroundColour = "rgba(0,0,0,0)",
  } = settings;

  const { totalColours } = palette;

  const croppedCanvas = createCroppedCanvas(
    inputCanvas,
    crop,
    backgroundColour
  );

  // create canvas matching blocks across dimensions
  const smallCanvas = createMaxSizeCanvas(croppedCanvas, pixelsWide);

  // convert blocks to brightness
  // todo - could bypass this if want original colours
  const brightnessCanvas = createBrightnessCanvas(smallCanvas, {
    brightnessAdjust: brightnessAdjust,
  });

  // tweak contrast
  const contrastCanvas = createThresholdCanvas(brightnessCanvas, contrast);

  const { canvas: restrictedGreysCanvas, palette: greyPalette } =
    createRestrictedGreysCanvas(contrastCanvas, {
      maxGreys: totalColours,
      returnPalette: true,
    });

  const blocks = getBlocksData(restrictedGreysCanvas, {
    imagePalette: greyPalette,
  });

  const blocksPerImageWidth = restrictedGreysCanvas.width;
  const blocksPerImageHeight = restrictedGreysCanvas.height;

  return { blocks, blocksPerImageWidth, blocksPerImageHeight };
};

// PORTRAIT CANVAS
export const createPixelPortraitCanvas = (inputCanvas, settings) => {
  const { blocks, blocksPerImageWidth, blocksPerImageHeight } =
    createPixelPortraitBlocks(inputCanvas, settings);

  const blockCanvas = createCanvasFromBlocks(blocks, {
    blocksPerImageWidth,
    blocksPerImageHeight,
    ...settings,
  });

  return { canvas: blockCanvas };
};

// Use the brightness of each greyscale pixel
// to select the corresponding palette index
const getBlocksData = (inputCanvas, options) => {
  let { imagePalette } = options;
  const blocks = [];

  const inputCtx = inputCanvas.getContext("2d");
  const inputWidth = inputCanvas.width;
  const inputHeight = inputCanvas.height;
  let imageData = inputCtx.getImageData(0, 0, inputWidth, inputHeight);
  let pixels = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    // with greyscale r, g, and b are all the same so just use r
    const brightness = pixels[i];

    // set transparent pixels to -1
    const alpha = pixels[i + 3];
    const paletteIndex = alpha === 0 ? -1 : imagePalette.indexOf(brightness);

    blocks.push(paletteIndex);
  }

  return blocks;
};

// CANVAS FROM BLOCKS
export const createCanvasFromBlocks = (blocks, options) => {
  let {
    canvasWidth,
    canvasHeight,
    blocksPerImageWidth,
    blocksPerImageHeight,
    blockSize = 10,
    backgroundColour,
    palette,
    sheetLabel,
    minExplodeDistance,
    explodeFromX,
    explodeFromY,
  } = options;

  const outputCanvas = document.createElement("canvas");
  const outWidth = canvasWidth ? canvasWidth : blocksPerImageWidth * blockSize;
  const outHeight = canvasHeight
    ? canvasHeight
    : blocksPerImageHeight * blockSize;

  console.log("minExplodeDistance: ", minExplodeDistance);

  outputCanvas.width = outWidth;
  outputCanvas.height = outHeight;

  const outputCtx = outputCanvas.getContext("2d");

  // fill background colour
  outputCtx.fillStyle = backgroundColour;
  outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

  let x, y, i;

  // explodeFromX: NumberParam,
  // explodeFromY: NumberParam,
  // minExplodeDistance: NumberParam,

  const explosionCenterPt = {
    x: Math.round(outWidth / 2),
    y: Math.round(outHeight / 2),
  };

  const maxDiagonalDistance = getDistance(
    explosionCenterPt.x,
    explosionCenterPt.y,
    outWidth,
    outHeight
  );

  const minDiagonalDistanceToEffect = maxDiagonalDistance * minExplodeDistance;

  for (i = 0; i < blocks.length; i++) {
    x = i % blocksPerImageWidth;
    y = (i - x) / blocksPerImageWidth;

    let left = x * blockSize;
    let top = y * blockSize;

    const actualFromCenter = getDistance(
      left,
      top,
      explosionCenterPt.x,
      explosionCenterPt.y
    );
    // let distFromCenter = 0;
    let distFromCenter = { x: 0, y: 0, diagonal: 0 };
    if (actualFromCenter > minDiagonalDistanceToEffect) {
      distFromCenter.diagonal =
        (actualFromCenter - minDiagonalDistanceToEffect) /
        (maxDiagonalDistance - minDiagonalDistanceToEffect);
    }

    let offsetDirection = { x: 1, y: 1 };
    if (left < explosionCenterPt.x) offsetDirection.x = -1;
    if (top < explosionCenterPt.y) offsetDirection.y = -1;

    const blockTypeIndex = blocks[i];
    if (blockTypeIndex >= 0) {
      const swatch = palette.swatches
        ? palette.swatches[blockTypeIndex]
        : { hue: 0, saturation: 100, lightness: 50 };

      const blockHue = swatch.customHue ? swatch.customHue : swatch.hue;

      const blockColour = `hsl(
        ${blockHue},
        ${swatch.saturation}%,
        ${swatch.lightness}%
        )`;

      const label =
        palette.labels && palette.labels[blockTypeIndex]
          ? palette.labels[blockTypeIndex]
          : null;

      drawBlock({
        outputCtx,
        left,
        top,
        blockColour,
        label,
        blockTypeIndex,
        distFromCenter,
        offsetDirection,
        ...options,
      });
    }
  }

  // add text showing sheet number at the top of the sheet.
  if (sheetLabel) {
    const fontSize = 8;
    const sheetLabelX = 2;
    const sheetLabelY = fontSize - 2;
    const sheetLabelWidth = 62;
    const sheetLabelHeight = fontSize;

    outputCtx.fillStyle = "rgba(255,255,255,0.5)";
    outputCtx.fillRect(0, 0, sheetLabelWidth, sheetLabelHeight);

    outputCtx.fillStyle = "#000000";
    outputCtx.textBaseline = "middle";
    outputCtx.textAlign = "left";
    outputCtx.font = `${fontSize}px Lucida Console`;
    outputCtx.fillText(sheetLabel, sheetLabelX, sheetLabelY, sheetLabelWidth);
  }

  return outputCanvas;
};

const drawBlock = ({
  outputCtx,
  left,
  top,
  explodeOuterBlocks,
  explosionLevel,
  multiplier,
  useRotation,
  distFromCenter,
  offsetDirection,
  blockColour,
  label,
  pixelType,
  blockSize,
  showColourOnSheets,
  includeNumberOnWhite,
  showAsFinishedPortrait,
  blockTypeIndex,
}) => {
  let xPos = left;
  let yPos = top;
  let rotation = 0;

  if (explodeOuterBlocks && distFromCenter.diagonal > 0) {
    const rand = Math.random();
    if (useRotation) {
      rotation = rand * distFromCenter.diagonal;
    }
    const maxOffset =
      blockSize * (explosionLevel * (explosionLevel * multiplier));
    const offsetX = maxOffset * (rand * distFromCenter.diagonal);
    const offsetY = maxOffset * (rand * distFromCenter.diagonal);
    xPos += offsetX * offsetDirection.x;
    yPos += offsetY * offsetDirection.y;
  }

  outputCtx.save();
  outputCtx.translate(xPos, yPos);
  outputCtx.rotate(rotation);

  if (pixelType === "symbol") {
    drawSymbolBlock(outputCtx, blockColour, xPos, yPos, blockSize, {
      blockTypeIndex,
      showColourOnSheets,
      includeNumberOnWhite,
      showAsFinishedPortrait,
      label,
    });
  } else {
    drawSquareBlock(outputCtx, blockColour, blockSize);
  }

  outputCtx.restore();
};

// SYMBOL BLOCK
const getHSL = (hslColour) => {
  const sep = hslColour.indexOf(",") > -1 ? "," : " ";
  const hsl = hslColour.substr(4).split(")")[0].split(sep);

  const h = parseInt(hsl[0]);
  const s = parseInt(hsl[1].substr(0, hsl[1].length - 1));
  const l = parseInt(hsl[2].substr(0, hsl[2].length - 1));

  return { h, s, l };
};

export const drawSymbolBlock = (ctx, colour, x, y, size, loopVars) => {
  const {
    blockTypeIndex,
    showAsFinishedPortrait,
    label,
    includeNumberOnWhite = false,
    distFromCenter = 0,
  } = loopVars;

  const drawAsFillInCard = !showAsFinishedPortrait && label;

  // draw as if finished
  if (showAsFinishedPortrait) {
    drawLabelBlock({ ctx, colour, size, label, distFromCenter });
    return;
  }
  // draw as if fill-in template
  else if (drawAsFillInCard) {
    drawLabelBlock({
      ctx,
      colour: "hsl(0,0%,100%)",
      size,
      label,
      distFromCenter,
    });
    return;
  }

  const symbols = []; //["", "O", "X", "#", "=", "M", "%", "&"];
  const character =
    blockTypeIndex < symbols.length
      ? symbols[blockTypeIndex]
      : blockTypeIndex + 1;

  // if it's a blank square, don't show grid lines or text,
  // just leave it blank so it's easy to paint white over the top
  if (character === 1 && includeNumberOnWhite === false) return;

  const halfSize = size / 2;

  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.font = `${halfSize}px Lucida Console`;

  ctx.lineWidth = 0.4;
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.strokeRect(x, y, size, size);

  const textX = x + halfSize;
  const textY = y + halfSize;
  ctx.fillText(character, textX, textY, size);

  if (character === 6 || character === 9) {
    underline(
      ctx,
      character,
      textX,
      textY,
      halfSize / 2,
      "rgba(0,0,0,0.2)",
      2,
      0
    );
  }
};

// LABEL BLOCK
const drawLabelBlock = ({ ctx, colour, size, label, forceTextColour }) => {
  const x = 0;
  const y = 0;
  const halfSize = size / 2;
  const thirdSize = size / 3;
  const twoThirdSize = thirdSize * 2;
  ctx.fillStyle = colour;
  ctx.fillRect(x, y, size, size);

  const { h, s, l } = getHSL(colour);

  const textDiff = 10;

  const backgroundIsLight = l >= 25;
  let textLightness = backgroundIsLight ? l - textDiff : l + 7;
  if (l <= 10) textLightness = 21;
  if (l <= 7) textLightness = 20;
  if (l <= 3) textLightness = 19;
  if (l <= 1) textLightness = 18;

  const textColour = forceTextColour
    ? forceTextColour
    : `hsl(${h}, ${s}%, ${textLightness}%)`;

  ctx.fillStyle = textColour;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.font = `${halfSize}px Arial Black`;

  ctx.lineWidth = 0.4;
  ctx.strokeStyle = textColour;
  ctx.strokeRect(x, y, size, size);

  if (!label) label = "YO";

  const isSingleWord = label.indexOf(" ") === -1;

  const textPadding = size / 10;
  const doublePadding = textPadding * 2;
  const textX = x + halfSize + 1;

  // draw background box
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.setLineDash([3, 2]);
  ctx.moveTo(x + twoThirdSize, y);
  ctx.lineTo(x + size, y + thirdSize);
  ctx.moveTo(x + size, y + twoThirdSize);
  ctx.lineTo(x + twoThirdSize, y + size);
  ctx.moveTo(x + thirdSize, y + size);
  ctx.lineTo(x, y + twoThirdSize);
  ctx.moveTo(x, y + thirdSize);
  ctx.lineTo(x + thirdSize, y);
  ctx.stroke();

  if (isSingleWord) {
    // add text
    const textY = y + halfSize;
    ctx.fillText(label, textX, textY, size - doublePadding);
  } else {
    // if there are two words
    const words = label.split(" ");
    let textY = y + halfSize / 2 + 2;

    const upperFontSize = halfSize * 0.8;
    ctx.font = `${upperFontSize}px Arial Black`;
    ctx.fillText(words[0], textX, textY, size - doublePadding);

    textY += upperFontSize;
    ctx.font = `${halfSize}px Arial Black`;
    ctx.fillText(words[1], textX, textY, size - doublePadding);
  }
};

const underline = (ctx, text, x, y, size, color, thickness, offset) => {
  const width = ctx.measureText(text).width;

  switch (ctx.textAlign) {
    case "center":
      x -= width / 2;
      break;
    case "right":
      x -= width;
      break;
    default:
      break;
  }

  y += size + offset;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.stroke();
};

// SQUARE BLOCK
export const drawSquareBlock = (ctx, colour, size) => {
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, size, size);
};
