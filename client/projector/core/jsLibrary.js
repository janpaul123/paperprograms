/*globals When, Claim */

module.exports = function() {
  // A map of URL to "is loaded?"
  const loadedLibraries = {};

  function loadLibrary(url) {
    if (typeof loadedLibraries[url] !== 'undefined') {
      return;
    }

    loadedLibraries[url] = false;
    const script = document.createElement('script');
    script.onload = () => {
      loadedLibraries[url] = true;
    };
    script.src = url;
    document.head.appendChild(script);
  }

  When` {someone} wishes ${'system'} loads js library from {url}`(({ url }) => {
    loadLibrary(url);
    if (loadedLibraries[url]) {
      Claim` ${'system'} loaded js library from ${url}`;
    }
  });
};
