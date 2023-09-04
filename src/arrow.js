var originalPoints = [{
  x: 0, y: 0
}, {
  x: 26, y: 2
}, {
  x: 25, y: 5
}, {
  x: 40, y: 0
}, {
  x: 25, y: -5
}, {
  x: 26, y: -2
}, {
  x: 0, y: 0
}];

function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end
}

function createArrow(left, top) {
  // Define the points for a simple arrow shape

  var polygon = new fabric.Polygon(structuredClone(originalPoints), {
    left: left-40,
    top: top-5,
    fill: '#FF007F',
    originX: 'left',
    strokeWidth: 4,
    stroke: 'white',
    scaleX: 1,
    scaleY: 1,
    objectCaching: true,
    strokeUniform: true,
    transparentCorners: false,
    cornerColor: 'blue',
  });

  polygon.strokeLineJoin = 'round';

  function getLocalStartPoint() {
    return new fabric.Point(points[0].x, points[0].y);
  }

  function getLocalEndPoint() {
    return new fabric.Point(points[0].x + polygon.width * polygon.scaleX, points[0].y);
  }

  function arrowScaleActionHandler(eventData, transform, x, y) {
    const target = transform.target;
    const localPoint = fabric.controlsUtils.getLocalPoint(transform, transform.originX, transform.originY, x, y);
    setArrowHeadPoint(target, x, y)
    return true
  }

  function renderControlHandle() {
    return function renderIcon(ctx, left, top, styleOverride, fabricObject) {
      var size = this.cornerSize;
      ctx.save();
      let circle = new fabric.Circle({
        radius:10,
        top:top,
        left:left,
        fill:'red'
      })
      ctx.add(circle)
      ctx.restore();
    }
  }

  const right_arrow_control = new fabric.Control({
    x: 0.51,
    y: 0,
    cursorStyle: 'pointer',
    cornerStyle: 'circle',
    actionHandler: arrowScaleActionHandler, // Setting anchor to MR
    actionName: 'right_polygon_modify'
  });

  polygon.controls = {right_arrow_control}

  function getScaleActionName() {
    return 'scaleArrowActionName'
  }

  return polygon
}

function updatePoints(scaleX, target) {
  for (let i = 1; i < target.points.length - 1; i++) {
    {
      target.points[i].y = originalPoints[i].y * (1 + .1 * scaleX);
    }
  }
  const factor = Math.min(scaleX / 4, 1)
  target.points[1].x = lerp(originalPoints[1].x, 35, factor)
  target.points[2].x = lerp(originalPoints[1].x, 35, factor)
  target.points[4].x = lerp(originalPoints[1].x, 35, factor)
  target.points[5].x = lerp(originalPoints[1].x, 35, factor)
}

function setArrowHeadPoint(target, x, y) {
  const anchor = new fabric.Point(target.width * -.5, 0);
  const absoluteAnchorPoint = fabric.util.transformPoint(anchor, target.calcTransformMatrix())

  let angleRadians = Math.atan2(y - absoluteAnchorPoint.y, x - absoluteAnchorPoint.x);

  let newTop = target.top
  let newLeft = target.left
  target.set({
    angle: fabric.util.radiansToDegrees(angleRadians),
    scaleX: Math.sqrt(Math.pow(absoluteAnchorPoint.x - x, 2) + Math.pow(absoluteAnchorPoint.y - y, 2)) / target.width,
    scaleY: Math.min(3, Math.sqrt(Math.pow(absoluteAnchorPoint.x - x, 2) + Math.pow(absoluteAnchorPoint.y - y, 2)) / target.width),
    top: newTop,
    left: newLeft,
  });
  updatePoints(target.scaleX, target)

  target.setCoords(); // Refresh object coordinates
}

export { createArrow, setArrowHeadPoint }