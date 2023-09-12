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

export const paperSizes = {
  A0: [2383.94, 3370.39],
  A1: [1683.78, 2383.94],
  A2: [1190.55, 1683.78],
  A3: [841.89, 1190.55],
  A4: [595.28, 841.89],
  A5: [419.53, 595.28],
  A6: [297.64, 419.53],
  A7: [209.76, 297.64],
  A8: [147.4, 209.76],
  A9: [104.88, 147.4],
  A10: [73.7, 104.88],
  B0: [2834.65, 4008.19],
  B1: [2004.09, 2834.65],
  B2: [1417.32, 2004.09],
  B3: [1000.63, 1417.32],
  B4: [708.66, 1000.63],
  B5: [498.9, 708.66],
  B6: [354.33, 498.9],
  B7: [249.45, 354.33],
  B8: [175.75, 249.45],
  B9: [124.72, 175.75],
  B10: [87.87, 124.72],
  C0: [2599.37, 3676.54],
  C1: [1836.85, 2599.37],
  C2: [1298.27, 1836.85],
  C3: [918.43, 1298.27],
  C4: [649.13, 918.43],
  C5: [459.21, 649.13],
  C6: [323.15, 459.21],
  C7: [229.61, 323.15],
  C8: [161.57, 229.61],
  C9: [113.39, 161.57],
  C10: [79.37, 113.39],
  RA0: [2437.8, 3458.27],
  RA1: [1729.13, 2437.8],
  RA2: [1218.9, 1729.13],
  RA3: [864.57, 1218.9],
  RA4: [609.45, 864.57],
  SRA0: [2551.18, 3628.35],
  SRA1: [1814.17, 2551.18],
  SRA2: [1275.59, 1814.17],
  SRA3: [907.09, 1275.59],
  SRA4: [637.8, 907.09],
  EXECUTIVE: [521.86, 756.0],
  FOLIO: [612.0, 936.0],
  TABLOID: [792.0, 1224.0],
  LEGAL: [612.0, 1008.0],
  LETTER: [612.0, 792.0],
};

export const commonPaperSizeNames = ['A4', 'A5', 'LEGAL', 'LETTER'];
export const otherPaperSizeNames = [
  'A0',
  'A1',
  'A2',
  'A3',
  'A6',
  'A7',
  'A8',
  'A9',
  'A10',
  'B0',
  'B1',
  'B2',
  'B3',
  'B4',
  'B5',
  'B6',
  'B7',
  'B8',
  'B9',
  'B10',
  'C0',
  'C1',
  'C2',
  'C3',
  'C4',
  'C5',
  'C6',
  'C7',
  'C8',
  'C9',
  'C10',
  'RA0',
  'RA1',
  'RA2',
  'RA3',
  'RA4',
  'SRA0',
  'SRA1',
  'SRA2',
  'SRA3',
  'SRA4',
  'EXECUTIVE',
  'FOLIO',
  'TABLOID',
];