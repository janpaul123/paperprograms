import Matrix from 'node-matrices';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';

export function norm(vector) {
  if (vector.x !== undefined) return norm([vector.x, vector.y]);
  return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
}

export function add(v1, v2) {
  if (v1.x !== undefined) return { x: v1.x + v2.x, y: v1.y + v2.y };
  return v1.map((value, index) => value + v2[index]);
}

export function diff(v1, v2) {
  if (v1.x !== undefined) return { x: v1.x - v2.x, y: v1.y - v2.y };
  return v1.map((value, index) => value - v2[index]);
}

export function mult(v1, v2) {
  if (v1.x !== undefined) return { x: v1.x * v2.x, y: v1.y * v2.y };
  return v1.map((value, index) => value * v2[index]);
}

export function scale(vector, scale) {
  if (vector.x !== undefined) return { x: vector.x * scale, y: vector.y * scale };
  return v1.map((value, index) => value * scale);
}

export function div(v1, v2) {
  if (v1.x !== undefined) return { x: v1.x / v2.x, y: v1.y / v2.y };
  return v1.map((value, index) => value / v2[index]);
}

export function cross(v1, v2) {
  if (v1.x === undefined || v2.x === undefined) throw new Error('Must be points');
  return v1.x * v2.y - v1.y * v2.x;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function moveAlongVector(amount, vector) {
  const size = norm(vector);
  return { x: amount * vector.x / size, y: amount * vector.y / size };
}

export function shrinkPoints(amount, points) {
  return [0, 1, 2, 3].map(index => {
    const point = points[index];
    const nextPoint = points[(index + 1) % 4];
    const prevPoint = points[(index - 1 + 4) % 4];
    return add(
      add(point, moveAlongVector(amount, diff(nextPoint, point))),
      moveAlongVector(amount, diff(prevPoint, point))
    );
  });
}

// Per http://graphics.cs.cmu.edu/courses/15-463/2008_fall/Papers/proj.pdf
export function forwardProjectionMatrixForPoints(points) {
  const deltaX1 = points[1].x - points[2].x;
  const deltaX2 = points[3].x - points[2].x;
  const sumX = points[0].x - points[1].x + points[2].x - points[3].x;
  const deltaY1 = points[1].y - points[2].y;
  const deltaY2 = points[3].y - points[2].y;
  const sumY = points[0].y - points[1].y + points[2].y - points[3].y;
  const denominator = new Matrix([deltaX1, deltaX2], [deltaY1, deltaY2]).determinant();
  const g = new Matrix([sumX, deltaX2], [sumY, deltaY2]).determinant() / denominator;
  const h = new Matrix([deltaX1, sumX], [deltaY1, sumY]).determinant() / denominator;
  const a = points[1].x - points[0].x + g * points[1].x;
  const b = points[3].x - points[0].x + h * points[3].x;
  const c = points[0].x;
  const d = points[1].y - points[0].y + g * points[1].y;
  const e = points[3].y - points[0].y + h * points[3].y;
  const f = points[0].y;
  return new Matrix([a, b, c], [d, e, f], [g, h, 1]);
}

export function projectPoint(point, projectionMatrix) {
  const pointMatrix = projectionMatrix.multiply(new Matrix([point.x], [point.y], [1]));
  return {
    x: pointMatrix.get(0, 0) / pointMatrix.get(2, 0),
    y: pointMatrix.get(1, 0) / pointMatrix.get(2, 0),
  };
}

// Adapted from https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
export function intersects(v1,  v2,  v3,  v4) {
  const det = (v2.x - v1.x) * (v4.y - v3.y) - (v4.x - v3.x) * (v2.y - v1.y);
  if (det === 0) {
    return false;
  } else {
    const lambda = ((v4.y - v3.y) * (v4.x - v1.x) + (v3.x - v4.x) * (v4.y - v1.y)) / det;
    const gamma = ((v1.y - v2.y) * (v4.x - v1.x) + (v2.x - v1.x) * (v4.y - v1.y)) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  }
};

export function getApiUrl(spaceName, suffix) {
  return new URL(`api/spaces/${spaceName}${suffix}`, window.location.origin).toString();
}

const commentRegex = /\s*\/\/\s*(.+)/;
export function codeToName(code) {
  const firstLine = code.split('\n')[0];
  const match = firstLine.match(commentRegex);
  if (match) return match[1].trim();
  else return '???';
}

export function codeToPrint(code) {
  let lines = code.split('\n');
  let i = 0;
  for (; i < lines.length; i++) {
    if (!lines[i].match(commentRegex) && lines[i].trim().length !== 0) break;
  }
  return lines.slice(i).join('\n');
}

/**
 * Check if a paper's data matches a given format
 * @param  {Array | Object} dataFormat List of rules to validate the data against
 *     ex: [{name: "coords", items: [{name: "lat", type: "Number"}, {name: "long", type: "Number"}]}]
 * @param  {Object}         data       A paper's data object
 *     ex: {"coords": [{lat: 93.01, long: 23.12}, {lat: 93.40, long: 23.49}]}
 * @return {Boolean}
 */
function validatePaperData(_dataFormat, data) {
  const dataFormat = ([]).concat(_dataFormat);  // accept {...} or [{...}, ...]
  if (dataFormat.length === 0) return true;
  let anyRequirementSatisfied = false;
  dataFormatLoop:
  for (let i in dataFormat) {
    const format = dataFormat[i];
    for (let key in data) {
      const value = data[key];
      const validName = typeof format.name === 'undefined' || format.name == key;
      const validType = typeof format.type === 'undefined' || format.type == typeof value;
      const validValue = typeof format.value === 'undefined' || format.value == value;
      // only check the format of the first list item, for speed and simplicity
      const validItems = typeof format.items === 'undefined' || (
        isArray(value) && (value.length === 0 || validatePaperData(format.items, value[0]))
      );
      if (validName && validType && validValue && validItems) {
        anyRequirementSatisfied = true;
        continue dataFormatLoop;
      }
    }
    if (format.required) {
      return false;
    }
  }
  return anyRequirementSatisfied;
}

export function getPaperWisker(paper, direction, length) {
  const pts = paper.points;
  const segment = (dir => {
    switch(dir) {
      case 'right':
        return [pts.topRight, pts.bottomRight];
      case 'down':
        return [pts.bottomRight, pts.bottomLeft];
      case 'left':
        return [pts.bottomLeft, pts.topLeft];
      default:
        return [pts.topRight, pts.topLeft];
    }
  })(direction);
  const segmentMiddle = add(segment[1], scale(diff(...segment), 0.5));
  const wiskerEnd = add(segmentMiddle, moveAlongVector(length, diff(segmentMiddle, pts.center)));
  return [segmentMiddle, wiskerEnd];
}

export function filterPapers(params, originPaperId, papers) {
  if (typeof params === 'undefined' || isEmpty(params)) {
    return papers;
  }
  const originPaper = papers[originPaperId];
  let {position, distance, closest, includeMe, data: dataFormat} = params;
  let wisker;
  if (typeof position !== 'undefined') {
    distance = params.distance || 150;
    closest = (typeof params.closest === 'undefined') ? true : params.closest;
    wisker = getPaperWisker(originPaper, position, distance);
  }
  let filteredPapers = {};
  let closestDistance = null;
  for (let paperId in papers) {
    const paper = papers[paperId];
    const points = paper.points;
    if (!includeMe && paperId === originPaperId) {
      continue;
    }
    if (dataFormat && !validatePaperData(dataFormat, paper.data)) {
      continue;
    }
    const centerDistance = norm(diff(originPaper.points.center, points.center));
    if (position && wisker) {
      const paperIntersectsWisker = (
        intersects(...wisker, points.topLeft, points.topRight) ||
        intersects(...wisker, points.topRight, points.bottomRight) ||
        intersects(...wisker, points.bottomRight, points.bottomLeft) ||
        intersects(...wisker, points.bottomLeft, points.topLeft)
      )
      if (!paperIntersectsWisker) {
        continue;
      }
    } else if (distance && centerDistance > distance) {
      continue;
    }
    if (closest) {
      if (closestDistance === null || centerDistance < closestDistance) {
        closestDistance = centerDistance;
        filteredPapers = {[paperId]: paper};
      }
    } else {
      filteredPapers[paperId] = paper;
    }
  }
  return filteredPapers;
}
