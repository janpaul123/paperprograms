/*globals WithAll, When, Claim */

module.exports = function() {
  const { getCssTransform } = require('../positioning');

  When` {someone} wishes {paper} has text input with initial value {initialValue} with options {options},
        {paper} has corner points {points},
        {paper} has width {paperWidth},
        {paper} has height {paperHeight}`
  (({ paper, paperWidth, paperHeight, points, initialValue, options }) => {
    const [div, input] = getElement(paper, initialValue);

    div.style.width = paperWidth + 'px';
    div.style.height = paperHeight + 'px';
    div.style.transform = getCssTransform({
      points,
      paperHeight,
      paperWidth,
    });

    input.style.position = 'relative';
    input.style.left = (options.x || 0) + 'px';
    input.style.top = (options.y || 0) + 'px';
    if (options.width) {
      input.style.width = options.width + 'px';
    }
    else {
      input.style.width = '100%';
    }
    input.style.fontSize = (options.fontSize || 20) + 'px';

    Claim` ${paper} has text input ${input} with value ${input.value}`;
  });

  WithAll` {keyboard} points at {paper},
           {keyboard} is a keyboard,
           {paper} has text input {input} with value {value}`(matches => {
    if (matches.length > 0) {
      const { input } = matches[0];
      if (document.activeElement !== input) {
        input.focus();
      }
    }
    else {
      if (document.activeElement) {
        document.activeElement.blur();
      }
    }
  });

  WithAll` {someone} wishes {object} has text input with initial value {initialValue} with options {options}`(matches => {
    const activeElements = {};
    matches.forEach(({ object }) => {
      activeElements[object] = true;
    });

    Object.keys(elements).forEach(key => {
      if (!activeElements[key]) {
        removeElementByKey(key);
      }
    });
  });
  
  // element creation

  const elements = {};

  function getElement(object, initialValue) {
    const key = object;

    if (elements[key]) {
      return elements[key];
    }

    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.top = '0';
    div.style.left = '0';
    div.style.transformOrigin = '0 0 0';
    document.body.appendChild(div);

    const input = document.createElement('input');
    input.value = initialValue;
    input.width = '100%';
    div.appendChild(input);

    elements[key] = [div, input];

    return [div, input];
  }

  function removeElementByKey(key) {
    if (!elements[key]) {
      return;
    }

    document.body.removeChild(elements[key][0]);
    delete elements[key];
  }
};
