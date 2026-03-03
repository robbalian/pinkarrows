function parseCoordinate(value) {
  if (value === null || value === undefined || value === '') {
    return NaN;
  }
  return Number(value);
}

function hasDistinctEndpoints(x1, y1, x2, y2) {
  return x1 !== x2 || y1 !== y2;
}

function validateLineEndpoints(x1, y1, x2, y2, canvasWidth, canvasHeight) {
  if (![x1, y1, x2, y2].every(Number.isFinite)) {
    return { valid: false, message: "Enter valid numeric endpoints" };
  }

  if (!hasDistinctEndpoints(x1, y1, x2, y2)) {
    return { valid: false, message: "Line endpoints must be different" };
  }

  const insideBounds =
    x1 >= 0 && x1 <= canvasWidth &&
    x2 >= 0 && x2 <= canvasWidth &&
    y1 >= 0 && y1 <= canvasHeight &&
    y2 >= 0 && y2 <= canvasHeight;

  if (!insideBounds) {
    return { valid: false, message: "Endpoints must be inside the canvas" };
  }

  return { valid: true };
}

export { hasDistinctEndpoints, parseCoordinate, validateLineEndpoints };
