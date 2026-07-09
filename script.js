const elements = {
  map: document.getElementById("map"),
  highlights: document.getElementById("highlights"),
  cursorPreview: document.getElementById("cursor-preview"),
  mapTab: document.getElementById("map-tab"),
  notesTab: document.getElementById("notes-tab"),
  mapPanel: document.getElementById("map-panel"),
  notesPanel: document.getElementById("notes-panel"),
  toggleColor: document.getElementById("toggle-color"),
  undoHighlight: document.getElementById("undo-highlight"),
  clearHighlights: document.getElementById("clear-highlights"),
  sizeRange: document.getElementById("size"),
  fileInput: document.getElementById("file"),
  pictureSelect: document.getElementById("pictures"),
  selectedHighlightLabel: document.getElementById("selected-highlight-label"),
  highlightNote: document.getElementById("highlight-note"),
  saveNote: document.getElementById("save-note"),
  notesList: document.getElementById("notes-list"),
  greenCount: document.getElementById("green-count"),
  redCount: document.getElementById("red-count"),
};

for (const [name, element] of Object.entries(elements)) {
  if (!element) {
    throw new Error(`Required element "${name}" was not found.`);
  }
}

const sessionPictures = new Map();
let currentColor = "green";
let diameter = elements.sizeRange.valueAsNumber;
let highlightId = 0;
let selectedHighlight = null;
let sessionPictureId = 0;

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

function getHighlightLabel(highlight) {
  const color = highlight.classList.contains("red") ? "red" : "green";
  return `Highlight ${highlight.dataset.number} (${color})`;
}

function setActiveTab(activeTab) {
  const showNotes = activeTab === "notes";

  elements.mapTab.classList.toggle("active", !showNotes);
  elements.notesTab.classList.toggle("active", showNotes);
  elements.mapTab.setAttribute("aria-selected", String(!showNotes));
  elements.notesTab.setAttribute("aria-selected", String(showNotes));
  elements.mapPanel.classList.toggle("active", !showNotes);
  elements.notesPanel.classList.toggle("active", showNotes);
  elements.mapPanel.hidden = showNotes;
  elements.notesPanel.hidden = !showNotes;
}

function renderNotesList() {
  const highlightsWithNotes = [...elements.highlights.querySelectorAll(".highlight")]
    .filter((highlight) => highlight.dataset.note?.trim());

  elements.notesList.replaceChildren();

  if (highlightsWithNotes.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "No notes have been added yet.";
    elements.notesList.appendChild(emptyState);
    return;
  }

  for (const highlight of highlightsWithNotes) {
    const noteButton = document.createElement("button");
    noteButton.className = "note-card";
    noteButton.type = "button";
    noteButton.dataset.highlightId = highlight.id;
    noteButton.innerHTML = `
      <span class="note-title">${getHighlightLabel(highlight)}</span>
      <span class="note-body"></span>
    `;
    noteButton.querySelector(".note-body").textContent = highlight.dataset.note;
    elements.notesList.appendChild(noteButton);
  }
}

function setSelectedHighlight(highlight) {
  selectedHighlight?.classList.remove("selected");
  selectedHighlight = highlight;

  if (!selectedHighlight) {
    elements.selectedHighlightLabel.textContent = "Select a highlight to add a note.";
    elements.highlightNote.value = "";
    elements.highlightNote.disabled = true;
    elements.saveNote.disabled = true;
    return;
  }

  selectedHighlight.classList.add("selected");
  elements.selectedHighlightLabel.textContent = getHighlightLabel(selectedHighlight);
  elements.highlightNote.value = selectedHighlight.dataset.note || "";
  elements.highlightNote.disabled = false;
  elements.saveNote.disabled = false;
}

function locateHighlight(highlight) {
  setSelectedHighlight(highlight);
  highlight.classList.remove("located");
  void highlight.offsetWidth;
  highlight.classList.add("located");
  elements.map.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
}

function clearHighlights() {
  elements.highlights.replaceChildren();
  setSelectedHighlight(null);
  renderNotesList();
  updateCounter();
}

function setPreviewPosition(event) {
  const bounds = elements.highlights.getBoundingClientRect();
  elements.cursorPreview.style.display = "block";
  elements.cursorPreview.style.left = `${event.clientX - bounds.left}px`;
  elements.cursorPreview.style.top = `${event.clientY - bounds.top}px`;
}

function placeHighlight(event) {
  if (event.target.classList.contains("highlight")) {
    setSelectedHighlight(event.target);
    return;
  }

  const bounds = elements.highlights.getBoundingClientRect();
  const highlight = document.createElement("div");
  const xPercent = ((event.clientX - bounds.left) / bounds.width) * 100;
  const yPercent = ((event.clientY - bounds.top) / bounds.height) * 100;

  highlightId += 1;
  highlight.id = `highlight-${highlightId}`;
  highlight.dataset.number = highlightId;
  highlight.tabIndex = 0;
  highlight.setAttribute("role", "button");
  highlight.classList.add("highlight", currentColor);
  highlight.style.left = `${xPercent}%`;
  highlight.style.top = `${yPercent}%`;
  highlight.style.width = `${diameter}px`;
  highlight.style.height = `${diameter}px`;

  elements.highlights.appendChild(highlight);
  highlight.setAttribute("aria-label", getHighlightLabel(highlight));
  setSelectedHighlight(highlight);
  updateCounter();
}

function toggleColor() {
  currentColor = currentColor === "green" ? "red" : "green";
  const label = currentColor[0].toUpperCase() + currentColor.slice(1);
  elements.toggleColor.textContent = `Highlight color: ${label}`;
}

function undoHighlight() {
  const highlight = elements.highlights.lastElementChild;

  if (highlight) {
    if (highlight === selectedHighlight) {
      setSelectedHighlight(null);
    }

    highlight.remove();
    renderNotesList();
  }

  updateCounter();
}

function addSelectOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  elements.pictureSelect.appendChild(option);
}

function revokeUploadedImages() {
  for (const picture of sessionPictures.values()) {
    if (picture.objectUrl) {
      URL.revokeObjectURL(picture.url);
    }
  }
}

function registerDisplayedPicture(file) {
  sessionPictureId += 1;
  const sourceId = `session:${sessionPictureId}`;
  const objectUrl = URL.createObjectURL(file);

  sessionPictures.set(sourceId, {
    name: file.name,
    url: objectUrl,
    alt: `Selected image: ${file.name}`,
    objectUrl: true,
  });

  if (sessionPictures.size === 1) {
    elements.pictureSelect.replaceChildren();
  }

  addSelectOption(sourceId, file.name);
  elements.pictureSelect.disabled = false;
  elements.pictureSelect.value = sourceId;
  return sessionPictures.get(sourceId);
}

function registerInitialPicture() {
  const sourceId = "initial-picture";

  sessionPictures.set(sourceId, {
    name: elements.map.alt,
    url: elements.map.getAttribute("src"),
    alt: elements.map.alt,
    objectUrl: false,
  });

  elements.pictureSelect.replaceChildren();
  addSelectOption(sourceId, elements.map.alt);
  elements.pictureSelect.disabled = false;
  elements.pictureSelect.value = sourceId;
}

function loadUploadedImages() {
  const files = [...elements.fileInput.files];

  if (files.length === 0) {
    return;
  }

  const selectedImage = registerDisplayedPicture(files[0]);
  showImage(selectedImage);
  elements.fileInput.value = "";
}

function showImage(selectedImage) {
  elements.map.src = selectedImage.url;
  elements.map.alt = selectedImage.alt;
  clearHighlights();
}

function changeImage() {
  const selectedImage = sessionPictures.get(elements.pictureSelect.value);

  if (selectedImage) {
    showImage(selectedImage);
  }
}

elements.highlights.addEventListener("pointerdown", placeHighlight);
elements.highlights.addEventListener("keydown", (event) => {
  if (!event.target.classList.contains("highlight")) {
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    setSelectedHighlight(event.target);
  }
});
elements.highlights.addEventListener("pointermove", setPreviewPosition);
elements.highlights.addEventListener("pointerleave", () => {
  elements.cursorPreview.style.display = "none";
});
elements.toggleColor.addEventListener("click", toggleColor);
elements.undoHighlight.addEventListener("click", undoHighlight);
elements.clearHighlights.addEventListener("click", clearHighlights);
elements.mapTab.addEventListener("click", () => setActiveTab("map"));
elements.notesTab.addEventListener("click", () => {
  renderNotesList();
  setActiveTab("notes");
});
elements.saveNote.addEventListener("click", () => {
  if (!selectedHighlight) {
    return;
  }

  selectedHighlight.dataset.note = elements.highlightNote.value.trim();
  selectedHighlight.classList.toggle("has-note", Boolean(selectedHighlight.dataset.note));
  renderNotesList();
});
elements.notesList.addEventListener("click", (event) => {
  const noteCard = event.target.closest(".note-card");

  if (!noteCard) {
    return;
  }

  const highlight = document.getElementById(noteCard.dataset.highlightId);

  if (highlight) {
    locateHighlight(highlight);
  }
});
elements.sizeRange.addEventListener("input", () => {
  diameter = elements.sizeRange.valueAsNumber;
  elements.cursorPreview.style.width = `${diameter}px`;
  elements.cursorPreview.style.height = `${diameter}px`;
});
elements.fileInput.addEventListener("change", loadUploadedImages);
elements.pictureSelect.addEventListener("change", changeImage);
window.addEventListener("beforeunload", revokeUploadedImages);

elements.cursorPreview.style.width = `${diameter}px`;
elements.cursorPreview.style.height = `${diameter}px`;
registerInitialPicture();
renderNotesList();
