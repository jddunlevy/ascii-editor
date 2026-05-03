import { describe, it, expect } from 'vitest';
import { convertImageToAscii, CHARSETS } from './convert';

const defaultParams = {
  width: 2,
  charset: CHARSETS.standard,
  brightness: 0,
  contrast: 0,
  inverted: false,
};

function makeImageData(width: number, height: number, fillRgb: [number, number, number]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = fillRgb[0];
    data[i * 4 + 1] = fillRgb[1];
    data[i * 4 + 2] = fillRgb[2];
    data[i * 4 + 3] = 255;
  }
  return { data, width, height };
}

describe('convertImageToAscii', () => {
  it('maps all-black pixels to the densest char', () => {
    const imageData = makeImageData(2, 2, [0, 0, 0]);
    const result = convertImageToAscii(imageData, defaultParams);
    const densest = CHARSETS.standard[CHARSETS.standard.length - 1]; // '@'
    for (const ch of result.replace(/\n/g, '')) {
      expect(ch).toBe(densest);
    }
  });

  it('maps all-white pixels to the lightest char', () => {
    const imageData = makeImageData(2, 2, [255, 255, 255]);
    const result = convertImageToAscii(imageData, defaultParams);
    const lightest = CHARSETS.standard[0]; // ' '
    for (const ch of result.replace(/\n/g, '')) {
      expect(ch).toBe(lightest);
    }
  });

  it('invert flips black→lightest and white→densest', () => {
    const invertedParams = { ...defaultParams, inverted: true };
    const blackImg = makeImageData(2, 2, [0, 0, 0]);
    const whiteImg = makeImageData(2, 2, [255, 255, 255]);

    const blackResult = convertImageToAscii(blackImg, invertedParams);
    const whiteResult = convertImageToAscii(whiteImg, invertedParams);

    const lightest = CHARSETS.standard[0];
    const densest = CHARSETS.standard[CHARSETS.standard.length - 1];

    for (const ch of blackResult.replace(/\n/g, '')) expect(ch).toBe(lightest);
    for (const ch of whiteResult.replace(/\n/g, '')) expect(ch).toBe(densest);
  });

  it('output line count matches imageData height', () => {
    const imageData = makeImageData(4, 3, [128, 128, 128]);
    const result = convertImageToAscii(imageData, { ...defaultParams, width: 4 });
    const lines = result.split('\n');
    expect(lines.length).toBe(3);
  });

  it('each output line length matches imageData width', () => {
    const imageData = makeImageData(5, 2, [64, 64, 64]);
    const result = convertImageToAscii(imageData, { ...defaultParams, width: 5 });
    for (const line of result.split('\n')) {
      expect(line.length).toBe(5);
    }
  });
});
