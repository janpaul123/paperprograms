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
