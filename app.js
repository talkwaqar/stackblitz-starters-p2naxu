// Display canvas (for user interaction)
const displayCanvas = new fabric.Canvas('face-canvas', {
    width: 400,   // Display width
    height: 400,  // Display height
    backgroundColor: '#ffffff'
});

// Updated categories based on your folders
const partsCategories = ['Backgrounds', 'Accessories', 'Eyes', 'Noses', 'Mouths'];

// Function to generate image paths based on naming convention
function generateImagePaths(categoryName, count) {
    const paths = [];
    
    // Define a mapping for singular names
    const singularCategoryMap = {
        'Backgrounds': 'background',
        'Accessories': 'accessory',
        'Eyes': 'eye',
        'Mouths': 'mouth',
        'Noses': 'nose'
    };

    for (let i = 1; i <= count; i++) {
        // Generate filenames using the singular form of the category
        const singularName = singularCategoryMap[categoryName];
        const fileName = `${singularName}-${i}.png`;
        
        paths.push(`images/${categoryName}/${fileName}`);
    }
    
    return paths;
}

// Define the number of images in each category
const imageCounts = {
    Backgrounds: 5,  // Replace with the actual number of background images
    Accessories: 10, // Replace with the actual number of accessory images
    Eyes: 8,         // Replace with the actual number of eye images
    Noses: 6,        // Replace with the actual number of nose images
    Mouths: 7        // Replace with the actual number of mouth images
};

// Generate the part options dynamically
const partOptions = {};
partsCategories.forEach(category => {
    partOptions[category] = generateImagePaths(category, imageCounts[category]);
});

// Original dimensions for high-res output
const originalCanvasSize = 1768;

// Positions for different parts (adjusted as necessary)
const displayPartPositions = {
    Accessories: { top: 500, left: 400 }, // Adjust positions as needed
    Eyes: { top: 200, left: 400 },
    Noses: { top: 550, left: 400 },
    Mouths: { top: 725, left: 425 }
};

let currentParts = {};
let zoomLevel = displayCanvas.width / originalCanvasSize; // Calculate initial zoom level

function initializeCanvas() {
    displayCanvas.setZoom(zoomLevel);
    displayCanvas.renderAll();
}

function addPartToCanvas(part, category) {
    if (category === 'Backgrounds') {
        // Set the background image
        fabric.Image.fromURL(part, function(img) {
            img.set({
                selectable: false,
                evented: false,
                originX: 'left',
                originY: 'top',
                left: 0,
                top: 0,
                scaleX: originalCanvasSize / img.width,
                scaleY: originalCanvasSize / img.height
            });
            displayCanvas.setBackgroundImage(img, displayCanvas.renderAll.bind(displayCanvas));
        });
    } else {
        if (category !== 'Accessories' && currentParts[category]) {
            // For categories other than Accessories, remove the existing part
            displayCanvas.remove(currentParts[category]);
        }

        fabric.Image.fromURL(part, function(img) { 
            // Set default position
            let position = displayPartPositions[category] || { top: 500, left: 400 };

            // Calculate the base scale to display the image at its original size relative to the canvas
            let baseScaleX = (originalCanvasSize / img.width) * zoomLevel;
            let baseScaleY = (originalCanvasSize / img.height) * zoomLevel;

            // Increase the scale by 25%
            let scaleX = baseScaleX * 2;
            let scaleY = baseScaleY * 2;

            img.set({
                left: position.left,
                top: position.top,
                scaleX: scaleX,
                scaleY: scaleY,
                hasControls: true,   // Allow resizing
                hasBorders: true     // Show borders when selected
            });

            // Make the image selectable and evented
            img.selectable = true;
            img.evented = true;

            if (category === 'Accessories') {
                // For Accessories, allow multiple
                if (!currentParts[category]) {
                    currentParts[category] = [];
                }
                currentParts[category].push(img);
            } else {
                // For other categories, replace the existing part
                currentParts[category] = img;
            }

            displayCanvas.add(img);
            displayCanvas.setActiveObject(img);

            // Adjust z-order to ensure accessories are behind other parts
            adjustZOrder(img, category);

            displayCanvas.renderAll();
        });
    }
}

function adjustZOrder(img, category) {
    if (category === 'Accessories') {
        // Send accessory behind other parts but in front of the background image
        displayCanvas.sendToBack(img);
    } else {
        // Bring other parts to the front
        displayCanvas.bringToFront(img);
    }
}

function resetCanvas() {
    displayCanvas.clear();
    currentParts = {};
    displayCanvas.setBackgroundImage(null, displayCanvas.renderAll.bind(displayCanvas));
}

function saveFace() {
    // Deselect any active object before saving
    displayCanvas.discardActiveObject();
    displayCanvas.renderAll();

    // Define the sizes in inches and the DPI
    const sizesInInches = [12, 15, 18];
    const dpi = 300; // Standard print resolution

    // Loop through each size and save the image
    sizesInInches.forEach(sizeInInches => {
        // Calculate the required pixel dimensions
        const sizeInPixels = sizeInInches * dpi;

        // Calculate the multiplier needed to scale the canvas to the required size
        const multiplier = sizeInPixels / displayCanvas.getWidth();

        // Generate the image data URL
        const dataURL = displayCanvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: multiplier
        });

        // Initiate the download
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `my-face-${sizeInInches}inch.png`;
        link.click();
    });
}

function createPartButtons() {
    const partsSelector = document.getElementById('parts-selector');

    partsCategories.forEach(category => {
        const button = document.createElement('button');
        button.textContent = category;
        button.onclick = () => selectPart(category);
        partsSelector.appendChild(button);
    });
}

function selectPart(category) {
    const partsOptions = document.getElementById('parts-options');
    partsOptions.innerHTML = '';

    partOptions[category].forEach(part => {
        const partButton = document.createElement('div');
        partButton.classList.add('part-option');

        const img = document.createElement('img');
        img.src = part;
        img.alt = part;
        img.style.width = '60px';
        img.style.height = '60px';
        partButton.appendChild(img);

        partButton.onclick = () => addPartToCanvas(part, category);
        partsOptions.appendChild(partButton);
    });
}

// Zoom functions (you can remove these if not needed)
function zoomIn() {
    zoomLevel = Math.min(zoomLevel * 1.2, 1);
    updateZoom();
}

function zoomOut() {
    zoomLevel = Math.max(zoomLevel / 1.2, displayCanvas.width / originalCanvasSize);
    updateZoom();
}

function updateZoom() {
    const previousZoom = displayCanvas.getZoom();
    displayCanvas.setZoom(zoomLevel);

    // Update positions and scales of existing parts
    for (let category in currentParts) {
        let items = currentParts[category];
        if (Array.isArray(items)) {
            // For Accessories (array of items)
            items.forEach(img => {
                // Adjust position and scale proportionally to the change in zoom level
                let zoomRatio = zoomLevel / previousZoom;

                img.left *= zoomRatio;
                img.top *= zoomRatio;
                img.scaleX *= zoomRatio;
                img.scaleY *= zoomRatio;
                img.setCoords();
            });
        } else if (items) {
            // For other categories (single item)
            let img = items;

            // Adjust position and scale proportionally to the change in zoom level
            let zoomRatio = zoomLevel / previousZoom;

            img.left *= zoomRatio;
            img.top *= zoomRatio;
            img.scaleX *= zoomRatio;
            img.scaleY *= zoomRatio;
            img.setCoords();
        }
    }

    // No need to adjust background image scale here

    displayCanvas.renderAll();
}

// Event listeners
document.getElementById('reset-btn').onclick = resetCanvas;
document.getElementById('save-btn').onclick = saveFace;
// If you have zoom buttons, keep these; otherwise, you can remove them
document.getElementById('zoom-in-btn').onclick = zoomIn;
document.getElementById('zoom-out-btn').onclick = zoomOut;

// Add reference to the delete button
const deleteBtn = document.getElementById('delete-btn');

// Initialize the Face Creator
initializeCanvas();
createPartButtons();

// Event listener for object moving (while dragging)
displayCanvas.on('object:moving', function(event) {
    var obj = event.target;
    console.log('Moving object to:', 'Left:', obj.left, 'Top:', obj.top);
});

// Event listener for object modified (after dragging)
displayCanvas.on('object:modified', function(event) {
    var obj = event.target;
    console.log('Object moved to:', 'Left:', obj.left, 'Top:', obj.top);
});

// Event listener for object selection
displayCanvas.on('selection:created', function() {
    deleteBtn.disabled = false;
});

// Event listener for object deselection
displayCanvas.on('selection:cleared', function() {
    deleteBtn.disabled = true;
});

// Event listener for object selection updated (e.g., switching between objects)
displayCanvas.on('selection:updated', function() {
    deleteBtn.disabled = false;
});

// Event listener for delete button
deleteBtn.onclick = function() {
    var activeObject = displayCanvas.getActiveObject();
    if (activeObject && activeObject.selectable) {
        displayCanvas.remove(activeObject);
        displayCanvas.discardActiveObject();
        deleteBtn.disabled = true;

        // Remove the object from currentParts
        removeObjectFromCurrentParts(activeObject);

        displayCanvas.renderAll();
    }
};

// Event listener for Delete key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Delete' || event.key === 'Backspace') {
        var activeObject = displayCanvas.getActiveObject();
        if (activeObject && activeObject.selectable) {
            displayCanvas.remove(activeObject);
            displayCanvas.discardActiveObject();
            deleteBtn.disabled = true;

            // Remove the object from currentParts
            removeObjectFromCurrentParts(activeObject);

            displayCanvas.renderAll();
        }
    }
});

// Function to remove an object from currentParts
function removeObjectFromCurrentParts(obj) {
    // Check which category the object belongs to
    for (let category in currentParts) {
        if (category === 'Accessories') {
            // For Accessories, currentParts[category] is an array
            let index = currentParts[category].indexOf(obj);
            if (index !== -1) {
                currentParts[category].splice(index, 1);
                break;
            }
        } else {
            if (currentParts[category] === obj) {
                currentParts[category] = null;
                break;
            }
        }
    }
}
