export const colorNames = ['R', 'G', 'B', 'D'];
export const cornerNames = ['TL', 'TR', 'BR', 'BL'];

export const cameraVideoConstraints = {
  // specifying "ideal" property with high value doesn't work with some webcams in Chrome
  // instead pick maximum from range of resolutions
  // based on: https://stackoverflow.com/questions/27420581/get-maximum-video-resolution-with-getusermedia#answer-27444179
  optional: [
    { minWidth: 320 },
    { minWidth: 640 },
    { minWidth: 1024 },
    { minWidth: 1280 },
    { minWidth: 1920 },
    { minWidth: 2560 },
  ],
};

export const commonPaperSizes = [
  { name: 'A4', dimensions: [595.28, 841.89] },
  { name: 'A5', dimensions: [419.53, 595.28] },
  { name: 'LEGAL', dimensions: [612.0, 1008.0] },
  { name: 'LETTER', dimensions: [612.0, 792.0] },
];

export const otherPaperSizes = [
  { name: 'A0', dimensions: [2383.94, 3370.39] },
  { name: 'A1', dimensions: [1683.78, 2383.94] },
  { name: 'A2', dimensions: [1190.55, 1683.78] },
  { name: 'A3', dimensions: [841.89, 1190.55] },
  { name: 'A6', dimensions: [297.64, 419.53] },
  { name: 'A7', dimensions: [209.76, 297.64] },
  { name: 'A8', dimensions: [147.4, 209.76] },
  { name: 'A9', dimensions: [104.88, 147.4] },
  { name: 'A10', dimensions: [73.7, 104.88] },
  { name: 'B0', dimensions: [2834.65, 4008.19] },
  { name: 'B1', dimensions: [2004.09, 2834.65] },
  { name: 'B2', dimensions: [1417.32, 2004.09] },
  { name: 'B3', dimensions: [1000.63, 1417.32] },
  { name: 'B4', dimensions: [708.66, 1000.63] },
  { name: 'B5', dimensions: [498.9, 708.66] },
  { name: 'B6', dimensions: [354.33, 498.9] },
  { name: 'B7', dimensions: [249.45, 354.33] },
  { name: 'B8', dimensions: [175.75, 249.45] },
  { name: 'B9', dimensions: [124.72, 175.75] },
  { name: 'B10', dimensions: [87.87, 124.72] },
  { name: 'C0', dimensions: [2599.37, 3676.54] },
  { name: 'C1', dimensions: [1836.85, 2599.37] },
  { name: 'C2', dimensions: [1298.27, 1836.85] },
  { name: 'C3', dimensions: [918.43, 1298.27] },
  { name: 'C4', dimensions: [649.13, 918.43] },
  { name: 'C5', dimensions: [459.21, 649.13] },
  { name: 'C6', dimensions: [323.15, 459.21] },
  { name: 'C7', dimensions: [229.61, 323.15] },
  { name: 'C8', dimensions: [161.57, 229.61] },
  { name: 'C9', dimensions: [113.39, 161.57] },
  { name: 'C10', dimensions: [79.37, 113.39] },
  { name: 'RA0', dimensions: [2437.8, 3458.27] },
  { name: 'RA1', dimensions: [1729.13, 2437.8] },
  { name: 'RA2', dimensions: [1218.9, 1729.13] },
  { name: 'RA3', dimensions: [864.57, 1218.9] },
  { name: 'RA4', dimensions: [609.45, 864.57] },
  { name: 'SRA0', dimensions: [2551.18, 3628.35] },
  { name: 'SRA1', dimensions: [1814.17, 2551.18] },
  { name: 'SRA2', dimensions: [1275.59, 1814.17] },
  { name: 'SRA3', dimensions: [907.09, 1275.59] },
  { name: 'SRA4', dimensions: [637.8, 907.09] },
  { name: 'EXECUTIVE', dimensions: [521.86, 756.0] },
  { name: 'FOLIO', dimensions: [612.0, 936.0] },
  { name: 'TABLOID', dimensions: [792.0, 1224.0] },
];
