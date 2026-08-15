import { createArrow, setArrowHeadPoint } from './arrow.js'
import { hasDistinctEndpoints } from './line-utils.mjs'
// Import the functions you need from the SDKs you need

var emojiPicker = null;

class CustomTextbox extends fabric.Textbox {
  constructor(text, options) {
    super(text, options);
    this.on('editing:entered', function () {
      console.log('Entered edit mode');
      setMode(Mode.EDIT_TEXT);
    });

    this.on('editing:exited', function () {
      setMode(Mode.NONE);
    });
  }
}

async function openEmojiPicker() {
  if (emojiPicker == null) {
    await loadEmojiPopup()
  }
  emojiPicker.open()
}

async function loadEmojiPopup() {
  let { createPopup } = await import('https://unpkg.com/@picmo/popup-picker@latest/dist/index.js?module')
  const trigger = document.querySelector('#emoji-button');//$('#emoji-button')

  emojiPicker = createPopup({
    showCategoryTabs: false
    // picker options go here
  }, {
    referenceElement: trigger,
    triggerElement: trigger
  });
  emojiPicker.addEventListener('emoji:select', selection => {
    console.log('Selected emoji: ', selection.emoji);
    let text = new fabric.IText(selection.emoji, {
      left: 100,
      top: 100,
      fontFamily: 'sans-serif',
      fontSize: 100,
      fill: annotationColor,
      stroke: '#ffffff', // White border
      strokeWidth: 2,
      shadow: 'rgba(0,0,0,0.3) 2px 2px 2px',  // Black shadow
      fontWeight: '900',
    });
    canvas.add(text)
    setMode(Mode.NONE)
  });
}

$(document).ready(function () {
  $('#emoji-button').click(() => {
    openEmojiPicker()
  })

  $('#undo-button').click(() => {
    canvas.undo()
  })

  $('#redo-button').click(() => {
    canvas.redo()
  })

  $('#download-button').click(() => {
    downloadCroppedWithWatermark()
  })


  $('#copy-image-to-clipboard-button').click(() => {
    copyImageToClipboard()
  })

  // Add this to handle the button click
  $('#file-upload-button').click(() => {
    console.log('clicked button')
    document.getElementById('fileInput').click();
  });

  // Add this to handle the file input change
  $('#fileInput').change(function () {
    handleFiles(this.files);
    // Clear the input to ensure the change event triggers even if the same file is selected again
    this.value = null;
  });

  // Initialize watermark toggle state from localStorage
  const watermarkToggle = $('#watermark-toggle');
  let watermarkState = localStorage.getItem('watermark');

  // If watermark state is not set in localStorage, default to true
  if (watermarkState === null) {
    watermarkState = 'true';
    localStorage.setItem('watermark', watermarkState);
  }

  watermarkToggle.prop('checked', watermarkState === 'true');



  // Handle watermark toggle change
  watermarkToggle.change(function () {
    const isChecked = $(this).is(':checked');
    localStorage.setItem('watermark', isChecked);
  });



  function refreshUI() {
    if (loggedInUser) {
      $('#userAccountDropdownMenu').removeClass('d-none'); // show the menu
      $('#userNameItem').text(loggedInUser.email)
      $('#signUpButtonItem').addClass('d-none')
      getPriceURL()
      loggedInUser.isPro = getCustomerIsProStatus()
      console.log(loggedInUser)


      console.log(loggedInUser.displayName, "is signed in")
    } else {
      $('#userAccountDropdownMenu').addClass('d-none'); // hide the menu
      $('#signUpButtonItem').removeClass('d-none')
      console.log("no user is signed in")
    }

  }

  // Build the color palette
  const colorPalette = $('#color-palette');
  const customColorInput = $('#custom-color-input');
  ANNOTATION_COLORS.forEach(color => {
    const swatch = $('<button type="button" class="color-swatch"></button>')
      .attr('data-color', color)
      .attr('title', color)
      .css('background-color', color);
    swatch.click(() => {
      setAnnotationColor(color);
      colorPalette.addClass('d-none');
    });
    customColorInput.before(swatch);
  });

  const customSwatch = $('<button type="button" id="custom-color-swatch" class="color-swatch" title="Custom color"></button>');
  customSwatch.click(() => {
    customColorInput.val(annotationColor);
    customColorInput[0].click();
  });
  customColorInput.before(customSwatch);

  customColorInput.on('input', function () {
    setAnnotationColor(this.value);
  });

  $('#color-button').click(function (e) {
    e.stopPropagation();
    colorPalette.toggleClass('d-none');
  });

  // Close the palette when clicking anywhere else
  $(document).click(function (e) {
    if (!$(e.target).closest('.color-picker-container').length) {
      colorPalette.addClass('d-none');
    }
  });

  // Reflect the persisted color in the toolbar
  setAnnotationColor(annotationColor);

  $(".tool-btn").click(function () {
    let modeText = $(this).attr("data-mode");
    if (!modeText) {
      return;
    }
    setMode(Mode[modeText]); // set global mode

    // Remove 'selected' class from all buttons
    $(".tool-btn").removeClass("selected");

    // Add 'selected' class to clicked button
    $(this).addClass("selected");

  });
});

function getModeNameForMode(modeValue) {
  return Object.keys(Mode).find(key => Mode[key] === modeValue);
}

let canvas = new fabric.Canvas('canvas', {
  selection: true,
  width: $('#drop_area').width(),
  height: $('#drop_area').height(),
  uniformScaling: false,
  interactive: true,
  preserveObjectStacking: true,
});

fabric.Rect.prototype._controlsVisibility = {
  mt: false, // top-left
  mb: false, // top-right
  ml: false,
  mr: false
}

fabric.Polygon.prototype._controlsVisibility = {
  tl: false,
  tr: false,
  bl: false,
  br: false,
  mt: false, // top-left
  mb: false, // top-right
  ml: true,
  mr: false
}

fabric.Rect.prototype.rx = 2;
fabric.Rect.prototype.ry = 2;

//canvas.viewportTransform = [0.7, 0, 0, 0.7, -50, 50];
//let arrow = createArrow(100, 100);
//canvas.add(arrow);

canvas.on('history:append', function (event) {
  // event.json contains the serialized state of the canvas that was just added to the history
  console.log("History appended:", event.json);

  // Add your callback logic here
});

window.addEventListener('resize', resizeCanvas, false);

function resizeCanvas() {
  canvas.setWidth(window.innerWidth);
  canvas.setHeight(window.innerHeight);
  redrawCanvas();
}

let dropArea = document.getElementById('drop_area');

// struct for storing mode state [drawRect, drawText]. You can only be in one of these modes at once
let Mode = Object.freeze({
  "NONE": 0,
  "TEXT": 1,
  "RECT": 2,
  "OVAL": 3,
  "EDIT_TEXT": 4,
  "EDIT_RECT": 5,
  "EDIT_OVAL": 6,
  "ARROW": 7,
  "LINE": 8,
  "EMOJI": 9
});
let mode = Mode.NONE
setMode(Mode.NONE);

function setMode(newMode) {
  // set the mode
  mode = newMode;
  const modeName = getModeNameForMode(mode);
  $(".tool-btn").removeClass("selected");
  $(`.tool-btn[data-mode='${modeName}']`).addClass("selected");

  if (mode == Mode.NONE) {
    canvas.selection = true;
    canvas.selectable = true;
    // turn all objects into selectable = false
    canvas.forEachObject(function (o) {
      o.selectable = true;
    });
  } else {
    canvas.selection = false;
    canvas.selectable = false;
    // turn all objects into selectable = false
    canvas.forEachObject(function (o) {
      o.selectable = false;
    });
    if (mode != Mode.EDIT_TEXT) {
      canvas.discardActiveObject().renderAll();
    }
  }

}


// Annotation color, shared by all tools and persisted like the watermark toggle
const DEFAULT_ANNOTATION_COLOR = '#FF007F';
const ANNOTATION_COLORS = [
  '#FF007F', '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE',
  '#32ADE6', '#007AFF', '#5856D6', '#AF52DE', '#FF2DCF', '#FFFFFF',
  '#C7C7CC', '#8E8E93', '#3A3A3C', '#000000'
];
let annotationColor = localStorage.getItem('annotationColor') || DEFAULT_ANNOTATION_COLOR;

function applyColorToObject(obj, color) {
  if (obj.type === 'activeSelection' || obj.type === 'group') {
    obj.forEachObject(o => applyColorToObject(o, color));
    return;
  }
  if (obj.type === 'image') {
    return;
  }
  // Filled shapes recolor their fill; outlined shapes recolor their stroke
  if (obj.type === 'polygon' || obj.type === 'textbox' || obj.type === 'i-text') {
    obj.set('fill', color);
  } else {
    obj.set('stroke', color);
  }
  obj.dirty = true;
}

function setAnnotationColor(color) {
  annotationColor = color;
  localStorage.setItem('annotationColor', color);
  $('#color-swatch-current').css('background-color', color);
  $('.color-swatch').removeClass('selected');
  $(`.color-swatch[data-color='${color.toUpperCase()}']`).addClass('selected');

  const activeObject = canvas.getActiveObject();
  if (activeObject) {
    applyColorToObject(activeObject, color);
    redrawCanvas();
  }
}

let currentlyCreatingObject = null;
let copiedObject = null;

let isDown = false;
//let arrow = null;
let origX = 0;
let origY = 0;

// Prevent default actions
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Handle drop
dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
  let dt = e.dataTransfer;
  let files = dt.files;
  handleFiles(files);
}

function handleFiles(files) {
  ([...files]).forEach(previewFile);
}

// Scale an image down so it fits within the visible canvas, preserving
// aspect ratio; small images are left at their natural size
function scaleImageToFit(oImg) {
  const maxWidth = canvas.width * 0.9;
  const maxHeight = canvas.height * 0.8;
  const scaleFactor = Math.min(1, maxWidth / oImg.width, maxHeight / oImg.height);
  if (scaleFactor < 1) {
    oImg.scale(scaleFactor);
  }
}

function previewFile(file) {
  let reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = function () {
    fabric.Image.fromURL(reader.result, function (oImg) {
      scaleImageToFit(oImg);

      oImg.set({
        left: (canvas.width - oImg.getScaledWidth()) / 2,  // Center horizontally
        top: canvas.height * .1, //(canvas.height - oImg.getScaledHeight()) / 2,  // Center vertically
        angle: 0
      }).setCoords();

      oImg.on({
        'mousedown': function () {
          canvas.setActiveObject(oImg);
        }
      });

      // Find the correct insertion index
      let insertIndex = canvas.getObjects().findIndex(obj =>
        obj.type !== 'image' && obj.type !== 'backgroundImage'
      );

      // If no non-image objects found, insert at the top
      if (insertIndex === -1) {
        insertIndex = canvas.getObjects().length;
      }

      // Insert the image at the found index
      canvas.insertAt(oImg, insertIndex);

      redrawCanvas();
    });
  }
}

function redrawCanvas() {
  // if there are objects on the canvas, remove the image-placeholder
  if (canvas.getObjects().length > 0) {
    $('#image-placeholder').addClass('d-none');
  } else {
    $('#image-placeholder').removeClass('d-none');
  }
  canvas.renderAll();
}

async function getImageWithWatermark() {
  var objects = canvas.getObjects();
  if (objects.length === 0) {
    return null;
  }

  // Group all objects temporarily to get bounding box
  var tempGroup = new fabric.Group(objects);
  var boundingBox = tempGroup.getBoundingRect();
  tempGroup.destroy(); // Remove the temporary group

  const watermarkEnabled = localStorage.getItem('watermark') === 'true';

  if (watermarkEnabled) {
    return new Promise((resolve) => {
      fabric.Image.fromURL('assets/watermark.png', function (watermarkImg) {
        var scaleFactor = 0.1;
        watermarkImg.scale(scaleFactor);

        // Position watermark at the bottom right of the cropped area
        watermarkImg.set({
          left: boundingBox.left + boundingBox.width - watermarkImg.getScaledWidth(),
          top: boundingBox.top + boundingBox.height - watermarkImg.getScaledHeight()
        });

        canvas.add(watermarkImg);
        canvas.renderAll();

        const dataURL = canvas.toDataURL({
          format: 'png',
          quality: 1.0,
          left: boundingBox.left,
          top: boundingBox.top,
          width: boundingBox.width,
          height: boundingBox.height,
          enableRetinaScaling: true
        });

        canvas.remove(watermarkImg);
        canvas.renderAll();

        resolve(dataURL);
      });
    });
  } else {
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1.0,
      left: boundingBox.left,
      top: boundingBox.top,
      width: boundingBox.width,
      height: boundingBox.height,
      enableRetinaScaling: true
    });
    return dataURL;
  }
}

async function downloadCroppedWithWatermark() {
  const dataURL = await getImageWithWatermark();

  if (!dataURL) {
    $.toast("Canvas is empty")
    return;
  }

  var link = document.createElement('a');
  link.href = dataURL;
  link.download = 'canvas_image.png';
  link.click();
  $.toast("Downloaded")
}

async function copyImageToClipboard() {
  const dataURL = await getImageWithWatermark();

  if (!dataURL) {
    $.toast("Canvas is empty")
    return;
  }

  fetch(dataURL)
    .then(res => res.blob())
    .then(blob => {
      const item = new ClipboardItem({ 'image/png': blob });
      navigator.clipboard.write([item]).then(() => {
        $.toast("Copied to clipboard")
      }).catch(err => {
        $.toast("Failed to copy image")
      });
    });
}

// Keyboard event to toggle text mode
// Keyboard event to toggle modes
document.addEventListener('keydown', function (e) {
  // cmd + enter should exit edit mode
  if ((e.ctrlKey || e.metaKey) && e.which === 13) {
    if (mode == Mode.EDIT_TEXT) {
      let textbox = canvas.getActiveObject()

      textbox.exitEditing();
      // select the textbox now so I can move the bounds
      // set no active object
      canvas.discardActiveObject();
      canvas.setActiveObject(textbox);
      canvas.renderAll();
    }
    setMode(Mode.NONE);
    return;
  }

  if (mode == Mode.EDIT_TEXT) {
    return;
  }
  switch (e.key) {
    case '6':
    case 't':
      setMode(Mode.TEXT);
      break;
    case '4':
    case 'r':
      setMode(Mode.RECT);
      break;
    case '2':
    case 'a':
      setMode(Mode.ARROW);
      break;
    case '3':
    case 'l':
      setMode(Mode.LINE);
      break;
    case '5':
    case 'o':
      setMode(Mode.OVAL);
      break;
    case '7':
    case 'e':
      openEmojiPicker()
      setMode(Mode.EMOJI)
      break
    case 'd':
      downloadCroppedWithWatermark();
      break;
    case 'c':
      copyImageToClipboard()
    // additional cases can be added as you add more features
    case '1':
    default:
      setMode(Mode.NONE);
  }
  if ((e.ctrlKey || e.metaKey) && e.which === 67) {
    copy();
  }

  // Ctrl+V or Cmd+V for MacOS
  if ((e.ctrlKey || e.metaKey) && e.which === 86) {
    // Decide what to paste from the OS clipboard contents, so an old internal
    // copy can't permanently block image pasting (#48)
    navigator.clipboard.read().then(async items => {
      for (const item of items) {
        const imageType = item.types.find(t => t === 'image/png' || t === 'image/jpeg');
        if (imageType) {
          const blob = await item.getType(imageType);
          pasteImageBlob(blob);
          return;
        }
        if (copiedObject && item.types.includes('text/plain')) {
          const text = await (await item.getType('text/plain')).text();
          if (text === CLIPBOARD_OBJECT_MARKER) {
            paste();
            return;
          }
        }
      }
      // Nothing usable in the OS clipboard; fall back to the internal copy
      if (copiedObject) {
        paste();
      }
    }).catch(err => {
      // Clipboard read can be blocked by permissions; the internal copy still works
      if (copiedObject) {
        paste();
        return;
      }
      $.toast('Failed to paste image from clipboard');
      console.error('Failed to paste image from clipboard', err);
    })
  }

  if ((e.ctrlKey || e.metaKey) && e.which === 90 && !e.shiftKey) {
    canvas.undo();
    redrawCanvas()
  }

  // Ctrl+Shift+Z or Cmd+Shift+Z for MacOS
  if ((e.ctrlKey || e.metaKey) && e.which === 90 && e.shiftKey) {
    canvas.redo();
    redrawCanvas()
  }

  // Ctrl+A or Cmd-A selects all objects
  if ((e.ctrlKey || e.metaKey) && e.which === 65) {
    var allObjects = canvas.getObjects();

    if (allObjects.length) {
      let activeSelection = new fabric.ActiveSelection(allObjects, {
        canvas: canvas
      });
      canvas.setActiveObject(activeSelection);
      redrawCanvas();
    }
  }
});

// Written to the OS clipboard on copy so paste can tell whether the internal
// copy or an image copied in another app is the most recent thing copied
const CLIPBOARD_OBJECT_MARKER = 'pinkarrows:copied-object';

function copy() {
  var activeObject = canvas.getActiveObject();

  if (activeObject) {
    copiedObject = activeObject;
    navigator.clipboard.writeText(CLIPBOARD_OBJECT_MARKER).catch(() => {});
  }
}

function pasteImageBlob(blob) {
  const reader = new FileReader();
  reader.onload = function(event) {
    fabric.Image.fromURL(event.target.result, function(oImg) {
      scaleImageToFit(oImg);

      oImg.set({
        left: (canvas.width - oImg.getScaledWidth()) / 2,
        top: canvas.height * .1,
        angle: 0
      }).setCoords();

      // Find insertion index
      let insertIndex = canvas.getObjects().findIndex(obj =>
        obj.type !== 'image' && obj.type !== 'backgroundImage'
      );

      // if no non-image objects found, insert at the top
      if (insertIndex === -1) {
        insertIndex = canvas.getObjects().length;
      }

      // Insert the image at the found index
      canvas.insertAt(oImg, insertIndex);
      redrawCanvas();
      $.toast('Image pasted from clipboard');
    });
  };
  reader.readAsDataURL(blob);
}

function paste() {
  if (copiedObject) {
    copiedObject.clone(function (clonedObj) {
      // Ensure the cloned object is an instance of CustomTextbox
      if (clonedObj instanceof fabric.Textbox) {
        clonedObj = new CustomTextbox(clonedObj.text, clonedObj.toObject());
      }
      canvas.add(clonedObj);
      clonedObj.set({
        left: clonedObj.left + 10, // You can adjust these values for the paste position
        top: clonedObj.top + 10,
        evented: true
      });
      copiedObject = clonedObj;

      // Make sure the newly added object is selected
      canvas.setActiveObject(clonedObj);
      canvas.requestRenderAll();
    });
  }
}


canvas.on('mouse:down', function (options) {
  isDown = true;
  let pointer = canvas.getPointer(options.e);
  origX = pointer.x;
  origY = pointer.y;
  if (mode == Mode.TEXT) {
    if (options.target && options.target.selectable) {
      return;
    }
    let pointer = canvas.getPointer(options.e);
    let text = new CustomTextbox('text', {
      left: pointer.x,
      top: pointer.y,
      fontFamily: 'sans-serif',
      fill: annotationColor,
      stroke: '#ffffff', // White border
      strokeWidth: 2,
      shadow: 'rgba(0,0,0,0.3) 2px 2px 2px',  // Black shadow
      fontWeight: '900',
      fixedWidth: 250,
      width: 250
    });

    // text.on('editing:entered', function () {
    //   setMode(Mode.EDIT_TEXT);
    // });

    // text.on('editing:exited', function () {
    //   setMode(Mode.NONE);
    // });

    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    // highlight the text
    text.selectAll();
    redrawCanvas();
  } else if (mode == Mode.RECT) {
    console.log('attempting to draw rect')
    let pointer = canvas.getPointer(options.e);
    origX = pointer.x;
    origY = pointer.y;
    let rect = new fabric.Rect({
      left: origX,
      top: origY,
      originX: 'left',
      originY: 'top',
      width: 50,
      height: 50,
      angle: 0,
      fill: 'rgba(255,255,255,0)',
      stroke: annotationColor,
      strokeWidth: 4,
      selectable: true,
      hasBorders: false,
      hasControls: true,
      strokeUniform: true,
    })
    currentlyCreatingObject = rect;
    console.log(rect)

    // detect rect edit
    rect.on('selected', function () {
      //mode = Mode.EDIT_RECT;
      console.log("mode is EDIT_RECT")
    });

    canvas.add(rect);
    redrawCanvas();
  } else if (mode == Mode.OVAL) {
    console.log('attempting to draw oval')
    let pointer = canvas.getPointer(options.e);
    origX = pointer.x;
    origY = pointer.y;
    let oval = new fabric.Ellipse({
      left: origX,
      top: origY,
      originX: 'left',
      originY: 'top',
      rx: 25,
      ry: 25,
      angle: 0,
      fill: 'rgba(255,255,255,0)',
      stroke: annotationColor,
      strokeWidth: 4,
      selectable: true,
      hasBorders: false,
      hasControls: true,
      strokeUniform: true,
    })
    currentlyCreatingObject = oval;
    console.log(oval)

    // detect oval edit
    oval.on('selected', function () {
      //mode = Mode.EDIT_OVAL;
      console.log("mode is EDIT_OVAL")
    });

    canvas.add(oval);
    redrawCanvas();
  } else if (mode == Mode.ARROW) {

    let arrow = createArrow(origX, origY, annotationColor);
    canvas.add(arrow);
    currentlyCreatingObject = arrow;

    redrawCanvas();
  } else if (mode == Mode.LINE) {
    let line = new fabric.Line([origX, origY, origX, origY], {
      stroke: annotationColor,
      strokeWidth: 4,
      selectable: true,
      hasBorders: false,
      hasControls: true,
      strokeLineCap: 'round',
      strokeUniform: true,
    });

    canvas.add(line);
    currentlyCreatingObject = line;
    redrawCanvas();
  } else if (mode == Mode.NONE) {

  }
});

function getBoundsForPointer(pointer) {
  let x = pointer.x;
  let y = pointer.y;
  let bounds = {
    left: Math.min(x, origX),
    top: Math.min(y, origY),
    width: Math.abs(x - origX),
    height: Math.abs(y - origY)
  };
  //bounds.width = bounds.width < 10 ? 10 : bounds.width;
  //bounds.height = bounds.height < 10 ? 10 : bounds.height;
  return bounds;
}

canvas.on('mouse:move', function (o) {
  if (!isDown) return;
  let pointer = canvas.getPointer(o.e);
  if (mode == Mode.RECT) {
    if (currentlyCreatingObject) {
      let bounds = getBoundsForPointer(pointer)
      currentlyCreatingObject.set({
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height
      });
    }
  } else if (mode == Mode.OVAL) {
    if (currentlyCreatingObject) {
      let bounds = getBoundsForPointer(pointer)
      currentlyCreatingObject.set({
        left: bounds.left,
        top: bounds.top,
        rx: bounds.width/2,
        ry: bounds.height/2
      });
    }
  } else if (mode == Mode.ARROW) {
    if (currentlyCreatingObject) {
      let arrow = currentlyCreatingObject
      setArrowHeadPoint(arrow, pointer.x, pointer.y)
    }
  } else if (mode == Mode.LINE) {
    if (currentlyCreatingObject) {
      currentlyCreatingObject.set({ x2: pointer.x, y2: pointer.y });
      currentlyCreatingObject.setCoords();
    }
  }

  //arrow.set({ x2: pointer.x, y2: pointer.y });
  redrawCanvas();
});

canvas.on('mouse:up', function (o) {
  isDown = false;
  if (mode == Mode.RECT || mode == Mode.OVAL) {
    canvas.setActiveObject(canvas.item(canvas.getObjects().length - 1));
    currentlyCreatingObject = null;
    setMode(Mode.NONE);
  } else if (mode == Mode.ARROW) {
    canvas.setActiveObject(canvas.item(canvas.getObjects().length - 1))
    currentlyCreatingObject = null;
    setMode(Mode.NONE);
  } else if (mode == Mode.LINE) {
    const line = currentlyCreatingObject;
    if (line && !hasDistinctEndpoints(line.x1, line.y1, line.x2, line.y2)) {
      canvas.remove(line);
      $.toast("Line endpoints must be different");
      currentlyCreatingObject = null;
      redrawCanvas();
      return;
    }
    canvas.setActiveObject(canvas.item(canvas.getObjects().length - 1))
    currentlyCreatingObject = null;
    setMode(Mode.NONE);
  }
  redrawCanvas();
});


// Keyboard event to delete active object
document.addEventListener('keydown', function (event) {
  if (event.key == 'Delete' || event.key == 'Backspace') {
    let activeObjects = canvas.getActiveObjects();
    if (activeObjects.length == 1) {
      let activeObject = activeObjects[0];
      if (activeObject.type == 'textbox' && mode == Mode.EDIT_TEXT) {
        return;
      }
    }
    canvas.remove(...activeObjects);
    canvas.discardActiveObject();
    redrawCanvas();
  }
});
