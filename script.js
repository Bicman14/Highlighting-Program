const elements = {
  map: document.getElementById("map"),
  highlights: document.getElementById("highlights"),
  cursorPreview: document.getElementById("cursor-preview"),
  toggleColor: document.getElementById("toggle-color"),
  undoHighlight: document.getElementById("undo-highlight"),
  clearHighlights: document.getElementById("clear-highlights"),
  sizeRange: document.getElementById("size"),
  fileInput: document.getElementById("file"),
  pictureSelect: document.getElementById("pictures"),
  greenCount: document.getElementById("green-count"),
  redCount: document.getElementById("red-count"),
};

for (const [name, element] of Object.entries(elements)) {
  if (!element) {
    throw new Error(`Required element "${name}" was not found.`);
  }
}

const uploadedImages = new Map();
let currentColor = "green";
let diameter = elements.sizeRange.valueAsNumber;
let highlightId = 0;

function getCounts() {
  return {
    green: elements.highlights.querySelectorAll(".highlight.green").length,
    red: elements.highlights.querySelectorAll(".highlight.red").length,
  };
}

function updateCounter() {
  const counts = getCounts();
  elements.greenCount.textContent = counts.green;
  elements.redCount.textContent = counts.red;
}

function clearHighlights() {
  elements.highlights.replaceChildren();
  updateCounter();
}

function setPreviewPosition(event) {
  const bounds = elements.highlights.getBoundingClientRect();
  elements.cursorPreview.style.display = "block";
  elements.cursorPreview.style.left = `${event.clientX - bounds.left}px`;
  elements.cursorPreview.style.top = `${event.clientY - bounds.top}px`;
}

function placeHighlight(event) {
  const bounds = elements.highlights.getBoundingClientRect();
  const highlight = document.createElement("div");
  const xPercent = ((event.clientX - bounds.left) / bounds.width) * 100;
  const yPercent = ((event.clientY - bounds.top) / bounds.height) * 100;

  highlightId += 1;
  highlight.id = `highlight-${highlightId}`;
  highlight.classList.add("highlight", currentColor);
  highlight.style.left = `${xPercent}%`;
  highlight.style.top = `${yPercent}%`;
  highlight.style.width = `${diameter}px`;
  highlight.style.height = `${diameter}px`;

  elements.highlights.appendChild(highlight);
  updateCounter();
}

function toggleColor() {
  currentColor = currentColor === "green" ? "red" : "green";
  const label = currentColor[0].toUpperCase() + currentColor.slice(1);
  elements.toggleColor.textContent = `Highlight color: ${label}`;
}

function undoHighlight() {
  elements.highlights.lastElementChild?.remove();
  updateCounter();
}

function resetUploadedImages() {
  for (const objectUrl of uploadedImages.values()) {
    URL.revokeObjectURL(objectUrl);
  }

  uploadedImages.clear();
  elements.pictureSelect.replaceChildren();
}

function addSelectOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  elements.pictureSelect.appendChild(option);
}

function loadUploadedImages() {
  resetUploadedImages();

  for (const file of elements.fileInput.files) {
    const objectUrl = URL.createObjectURL(file);
    uploadedImages.set(file.name, objectUrl);
    addSelectOption(file.name, file.name);
  }

  elements.pictureSelect.disabled = uploadedImages.size === 0;

  if (uploadedImages.size > 0) {
    elements.pictureSelect.selectedIndex = 0;
    changeImage();
  } else {
    addSelectOption("", "No uploaded images");
  }
}

function changeImage() {
  const selectedImage = uploadedImages.get(elements.pictureSelect.value);

  if (selectedImage) {
    elements.map.src = selectedImage;
    elements.map.alt = `Uploaded image: ${elements.pictureSelect.value}`;
    clearHighlights();
  }
}

elements.highlights.addEventListener("pointerdown", placeHighlight);
elements.highlights.addEventListener("pointermove", setPreviewPosition);
elements.highlights.addEventListener("pointerleave", () => {
  elements.cursorPreview.style.display = "none";
});
elements.toggleColor.addEventListener("click", toggleColor);
elements.undoHighlight.addEventListener("click", undoHighlight);
elements.clearHighlights.addEventListener("click", clearHighlights);
elements.sizeRange.addEventListener("input", () => {
  diameter = elements.sizeRange.valueAsNumber;
  elements.cursorPreview.style.width = `${diameter}px`;
  elements.cursorPreview.style.height = `${diameter}px`;
});
elements.fileInput.addEventListener("change", loadUploadedImages);
elements.pictureSelect.addEventListener("change", changeImage);
window.addEventListener("beforeunload", resetUploadedImages);

elements.cursorPreview.style.width = `${diameter}px`;
elements.cursorPreview.style.height = `${diameter}px`;
