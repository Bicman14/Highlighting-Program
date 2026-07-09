const elements = {
  sessionDialog: document.getElementById("session-dialog"),
  sessionForm: document.getElementById("session-form"),
  sessionName: document.getElementById("session-name"),
  sessionStoreNumber: document.getElementById("session-store-number"),
  sessionStoreLocation: document.getElementById("session-store-location"),
  sessionSummary: document.getElementById("session-summary"),
  editSession: document.getElementById("edit-session"),
  themeToggle: document.getElementById("theme-toggle"),
  unsavedDialog: document.getElementById("unsaved-dialog"),
  cancelRiskyAction: document.getElementById("cancel-risky-action"),
  confirmRiskyAction: document.getElementById("confirm-risky-action"),
  map: document.getElementById("map"),
  mapContainer: document.querySelector(".map-container"),
  mapFrame: document.querySelector(".map-frame"),
  highlights: document.getElementById("highlights"),
  cursorPreview: document.getElementById("cursor-preview"),
  mapTab: document.getElementById("map-tab"),
  notesTab: document.getElementById("notes-tab"),
  colorsTab: document.getElementById("colors-tab"),
  mapPanel: document.getElementById("map-panel"),
  notesPanel: document.getElementById("notes-panel"),
  colorsPanel: document.getElementById("colors-panel"),
  toggleColor: document.getElementById("toggle-color"),
  undoHighlight: document.getElementById("undo-highlight"),
  clearHighlights: document.getElementById("clear-highlights"),
  builtInPictures: document.getElementById("built-in-pictures"),
  sizeRange: document.getElementById("size"),
  sizePreview: document.getElementById("size-preview"),
  sizeValue: document.getElementById("size-value"),
  fileInput: document.getElementById("file"),
  pictureSelect: document.getElementById("pictures"),
  selectedHighlightLabel: document.getElementById("selected-highlight-label"),
  highlightNote: document.getElementById("highlight-note"),
  noteTimestamp: document.getElementById("note-timestamp"),
  saveNote: document.getElementById("save-note"),
  projectFolderName: document.getElementById("project-folder-name"),
  saveProject: document.getElementById("save-project"),
  loadProjectFolder: document.getElementById("load-project-folder"),
  noteDialog: document.getElementById("note-dialog"),
  noteDialogForm: document.getElementById("note-dialog-form"),
  noteDialogLabel: document.getElementById("note-dialog-label"),
  noteDialogText: document.getElementById("note-dialog-text"),
  noteDialogTimestamp: document.getElementById("note-dialog-timestamp"),
  saveNoteDialog: document.getElementById("save-note-dialog"),
  colorDialog: document.getElementById("color-dialog"),
  colorDialogForm: document.getElementById("color-dialog-form"),
  customColor: document.getElementById("custom-color"),
  customColorPreview: document.getElementById("custom-color-preview"),
  saveCustomColor: document.getElementById("save-custom-color"),
  colorList: document.getElementById("color-list"),
  addColor: document.getElementById("add-color"),
  deleteColor: document.getElementById("delete-color"),
  notesList: document.getElementById("notes-list"),
  colorCounts: document.getElementById("color-counts"),
};

for (const [name, element] of Object.entries(elements)) {
  if (!element) {
    throw new Error(`Required element "${name}" was not found.`);
  }
}

const sessionPictures = new Map();
const defaultColors = ["#008000", "#ff0000"];
const colorStorageKey = "highlighting-program-colors";
let customColors = [];
let currentColor = defaultColors[0];
let diameter = elements.sizeRange.valueAsNumber;
let highlightId = 0;
let selectedHighlight = null;
let sessionPictureId = 0;
let activePictureId = "";
let hasUnsavedChanges = false;
let pendingRiskyAction = null;
const sessionDetails = {
  name: "",
  storeNumber: "",
  storeLocation: "",
};

function getCounts() {
  const highlights = [...elements.highlights.querySelectorAll(".highlight")];
  const counts = new Map();

  for (const highlight of highlights) {
    const color = getHighlightColor(highlight);
    counts.set(color, (counts.get(color) || 0) + 1);
  }

  return counts;
}

function updateCounter() {
  const counts = getCounts();
  elements.colorCounts.replaceChildren();

  for (const [color, count] of counts) {
    const item = document.createElement("span");
    item.className = "color-count";
    item.innerHTML = `
      <span class="count-dot" aria-hidden="true"></span>
      <strong>${count}</strong>
    `;
    item.querySelector(".count-dot").style.background = color;
    item.setAttribute("aria-label", `${count} highlights for ${color}`);
    elements.colorCounts.appendChild(item);
  }
}

function updateSizePreview() {
  diameter = elements.sizeRange.valueAsNumber;
  elements.cursorPreview.style.width = `${diameter}px`;
  elements.cursorPreview.style.height = `${diameter}px`;
  elements.sizePreview.style.width = `${diameter}px`;
  elements.sizePreview.style.height = `${diameter}px`;
  elements.sizeValue.textContent = diameter;
}

function updatePreviewColor() {
  elements.sizePreview.style.background = toAlphaColor(currentColor, 0.5);
}

function updateColorButton() {
  elements.toggleColor.textContent = "Next color";
  elements.toggleColor.style.borderColor = currentColor;
}

function normalizeColor(color) {
  if (!color) {
    return defaultColors[0];
  }

  if (color === "green") {
    return defaultColors[0];
  }

  if (color === "red") {
    return defaultColors[1];
  }

  return color.toLowerCase();
}

function toAlphaColor(hexColor, alpha) {
  const color = normalizeColor(hexColor);
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function setSizePreviewPosition(event) {
  elements.sizePreview.style.display = "block";
  elements.sizePreview.style.left = `${event.clientX}px`;
  elements.sizePreview.style.top = `${event.clientY}px`;
}

function hideSizePreview() {
  elements.sizePreview.style.display = "none";
}

function fitMapToAvailableArea() {
  if (!elements.map.naturalWidth || !elements.map.naturalHeight) {
    return;
  }

  const containerBounds = elements.mapContainer.getBoundingClientRect();

  if (!containerBounds.width || !containerBounds.height) {
    return;
  }

  const imageAspect = elements.map.naturalWidth / elements.map.naturalHeight;
  const containerAspect = containerBounds.width / containerBounds.height;
  let width = containerBounds.width;
  let height = containerBounds.height;

  if (containerAspect > imageAspect) {
    width = height * imageAspect;
  } else {
    height = width / imageAspect;
  }

  elements.mapFrame.style.width = `${Math.floor(width)}px`;
  elements.mapFrame.style.height = `${Math.floor(height)}px`;
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  updateThemeToggle();
}

function updateThemeToggle() {
  const isDark = document.documentElement.dataset.theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";
  elements.themeToggle.textContent = isDark ? "☀️" : "🌙";
  elements.themeToggle.setAttribute("aria-label", label);
  elements.themeToggle.title = label;
}

function getAvailableColors() {
  return [...defaultColors, ...customColors];
}

function loadCustomColors() {
  try {
    const savedColors = JSON.parse(localStorage.getItem(colorStorageKey) || "[]");
    customColors = Array.isArray(savedColors)
      ? savedColors.map(normalizeColor).filter((color) => !defaultColors.includes(color))
      : [];
  } catch {
    customColors = [];
  }
}

function saveCustomColors() {
  localStorage.setItem(colorStorageKey, JSON.stringify(customColors));
}

function updateColorPickerPreview() {
  elements.customColorPreview.style.background = elements.customColor.value;
}

function selectColor(color) {
  currentColor = normalizeColor(color);
  updatePreviewColor();
  updateColorButton();
  renderColorList();
}

function renderColorList() {
  elements.colorList.replaceChildren();

  for (const color of getAvailableColors()) {
    const colorButton = document.createElement("button");
    colorButton.className = "color-swatch";
    colorButton.type = "button";
    colorButton.dataset.color = color;
    colorButton.style.background = color;
    colorButton.setAttribute("aria-label", `Use ${color}`);
    colorButton.classList.toggle("active", color === currentColor);
    elements.colorList.appendChild(colorButton);
  }

  elements.deleteColor.disabled = !customColors.includes(currentColor);
  updateCounter();
}

function openNoteDialog(highlight) {
  setSelectedHighlight(highlight);
  elements.noteDialogLabel.textContent = getHighlightLabel(highlight);
  elements.noteDialogText.value = highlight.dataset.note || "";
  elements.noteDialogTimestamp.textContent = formatTimestamp(highlight.dataset.timestamp);
  elements.noteDialog.showModal();
}

function saveSelectedHighlightNote(noteText) {
  if (!selectedHighlight) {
    return;
  }

  selectedHighlight.dataset.note = noteText.trim();
  selectedHighlight.dataset.author = sessionDetails.name;
  selectedHighlight.dataset.storeNumber = sessionDetails.storeNumber;
  selectedHighlight.dataset.storeLocation = sessionDetails.storeLocation;
  selectedHighlight.dataset.timestamp = new Date().toISOString();
  selectedHighlight.classList.toggle("has-note", Boolean(selectedHighlight.dataset.note));
  elements.highlightNote.value = selectedHighlight.dataset.note;
  elements.noteTimestamp.textContent = formatTimestamp(selectedHighlight.dataset.timestamp);
  elements.noteDialogTimestamp.textContent = formatTimestamp(selectedHighlight.dataset.timestamp);
  markUnsaved();
  renderNotesList();
}

function getCurrentPicture() {
  return sessionPictures.get(elements.pictureSelect.value) || null;
}

function getHighlightLabel(highlight) {
  return `Highlight ${highlight.dataset.number} (${highlight.dataset.color || defaultColors[0]})`;
}

function getHighlightColor(highlight) {
  return normalizeColor(highlight.dataset.color);
}

function setNoteFieldsDisabled(disabled) {
  elements.highlightNote.disabled = disabled;
  elements.saveNote.disabled = disabled;
}

function markUnsaved() {
  hasUnsavedChanges = true;
}

function markExported() {
  hasUnsavedChanges = false;
}

function updateSessionSummary() {
  elements.sessionSummary.textContent = sessionDetails.name
    ? `${sessionDetails.name} | Store ${sessionDetails.storeNumber} - ${sessionDetails.storeLocation}`
    : "No session details yet.";
}

function saveSessionDetails() {
  sessionDetails.name = elements.sessionName.value.trim();
  sessionDetails.storeNumber = elements.sessionStoreNumber.value.trim();
  sessionDetails.storeLocation = elements.sessionStoreLocation.value.trim();
  updateSessionSummary();
}

function runRiskyAction(action) {
  if (!hasUnsavedChanges) {
    action();
    return;
  }

  pendingRiskyAction = action;
  elements.unsavedDialog.showModal();
}

function confirmRiskyAction() {
  const action = pendingRiskyAction;
  pendingRiskyAction = null;
  elements.unsavedDialog.close();

  if (action) {
    action();
  }
}

function getHighlightRecord(highlight) {
  return {
    id: highlight.id,
    number: highlight.dataset.number,
    color: getHighlightColor(highlight),
    xPercent: Number(highlight.dataset.xPercent),
    yPercent: Number(highlight.dataset.yPercent),
    diameter: Number(highlight.dataset.diameter),
    note: highlight.dataset.note || "",
    author: highlight.dataset.author || "",
    storeNumber: highlight.dataset.storeNumber || "",
    storeLocation: highlight.dataset.storeLocation || "",
    timestamp: highlight.dataset.timestamp || "",
  };
}

function getHighlightRecords() {
  return [...elements.highlights.querySelectorAll(".highlight")].map(getHighlightRecord);
}

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "No note saved yet.";
  }

  return `Saved ${new Date(timestamp).toLocaleString()}`;
}

function setActiveTab(activeTab) {
  const showNotes = activeTab === "notes";
  const showColors = activeTab === "colors";
  const showMap = activeTab === "map";

  elements.mapTab.classList.toggle("active", showMap);
  elements.notesTab.classList.toggle("active", showNotes);
  elements.colorsTab.classList.toggle("active", showColors);
  elements.mapTab.setAttribute("aria-selected", String(showMap));
  elements.notesTab.setAttribute("aria-selected", String(showNotes));
  elements.colorsTab.setAttribute("aria-selected", String(showColors));
  elements.mapPanel.classList.toggle("active", showMap);
  elements.notesPanel.classList.toggle("active", showNotes);
  elements.colorsPanel.classList.toggle("active", showColors);
  elements.mapPanel.hidden = !showMap;
  elements.notesPanel.hidden = !showNotes;
  elements.colorsPanel.hidden = !showColors;
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
    const record = getHighlightRecord(highlight);
    const noteButton = document.createElement("button");
    noteButton.className = "note-card";
    noteButton.type = "button";
    noteButton.dataset.highlightId = highlight.id;
    noteButton.innerHTML = `
      <span class="note-title">${getHighlightLabel(highlight)}</span>
      <span class="note-meta"></span>
      <span class="note-body"></span>
    `;
    noteButton.querySelector(".note-meta").textContent = [
      record.author,
      record.storeNumber && record.storeLocation
        ? `Store ${record.storeNumber} - ${record.storeLocation}`
        : "",
      record.timestamp ? new Date(record.timestamp).toLocaleString() : "",
    ].filter(Boolean).join(" | ");
    noteButton.querySelector(".note-body").textContent = record.note;
    elements.notesList.appendChild(noteButton);
  }
}

function setSelectedHighlight(highlight) {
  selectedHighlight?.classList.remove("selected");
  selectedHighlight = highlight;

  if (!selectedHighlight) {
    elements.selectedHighlightLabel.textContent = "Select a highlight to add a note.";
    elements.highlightNote.value = "";
    elements.noteTimestamp.textContent = "No note saved yet.";
    setNoteFieldsDisabled(true);
    return;
  }

  selectedHighlight.classList.add("selected");
  elements.selectedHighlightLabel.textContent = getHighlightLabel(selectedHighlight);
  elements.highlightNote.value = selectedHighlight.dataset.note || "";
  elements.noteTimestamp.textContent = formatTimestamp(selectedHighlight.dataset.timestamp);
  setNoteFieldsDisabled(false);
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
  highlight.dataset.xPercent = xPercent.toFixed(4);
  highlight.dataset.yPercent = yPercent.toFixed(4);
  highlight.dataset.diameter = diameter;
  highlight.dataset.color = currentColor;
  highlight.tabIndex = 0;
  highlight.setAttribute("role", "button");
  highlight.classList.add("highlight");
  highlight.style.background = toAlphaColor(currentColor, 0.5);
  highlight.style.left = `${xPercent}%`;
  highlight.style.top = `${yPercent}%`;
  highlight.style.width = `${diameter}px`;
  highlight.style.height = `${diameter}px`;

  elements.highlights.appendChild(highlight);
  highlight.setAttribute("aria-label", getHighlightLabel(highlight));
  setSelectedHighlight(highlight);
  markUnsaved();
  updateCounter();
}

function toggleColor() {
  const colors = getAvailableColors();
  const currentIndex = colors.indexOf(currentColor);
  selectColor(colors[(currentIndex + 1) % colors.length]);
}

function undoHighlight() {
  const highlight = elements.highlights.lastElementChild;

  if (highlight) {
    if (highlight === selectedHighlight) {
      setSelectedHighlight(null);
    }

    highlight.remove();
    renderNotesList();
    markUnsaved();
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
    sourceType: "local-file",
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

function registerDisplayedProjectPicture(name, objectUrl) {
  sessionPictureId += 1;
  const sourceId = `project:${sessionPictureId}`;

  sessionPictures.set(sourceId, {
    name,
    url: objectUrl,
    alt: `Saved project image: ${name}`,
    sourceType: "project-folder",
    objectUrl: true,
  });

  addSelectOption(sourceId, name);
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
    sourceType: "built-in",
    objectUrl: false,
  });

  elements.pictureSelect.replaceChildren();
  addSelectOption(sourceId, elements.map.alt);
  elements.pictureSelect.disabled = false;
  elements.pictureSelect.value = sourceId;
  activePictureId = sourceId;
}

function registerBuiltInPicture(url, name) {
  sessionPictureId += 1;
  const sourceId = `built-in:${sessionPictureId}`;

  sessionPictures.set(sourceId, {
    name,
    url,
    alt: name,
    sourceType: "built-in",
    objectUrl: false,
  });

  addSelectOption(sourceId, name);
  elements.pictureSelect.disabled = false;
  elements.pictureSelect.value = sourceId;
  return sessionPictures.get(sourceId);
}

function loadUploadedImages() {
  const files = [...elements.fileInput.files];

  if (files.length === 0) {
    return;
  }

  runRiskyAction(() => {
    const selectedImage = registerDisplayedPicture(files[0]);
    showImage(selectedImage);
    markUnsaved();
  });
  elements.fileInput.value = "";
}

function showImage(selectedImage) {
  elements.map.addEventListener("load", fitMapToAvailableArea, { once: true });
  elements.map.src = selectedImage.url;
  elements.map.alt = selectedImage.alt;
  activePictureId = elements.pictureSelect.value;
  clearHighlights();
}

function loadBuiltInPicture() {
  if (!elements.builtInPictures.value) {
    return;
  }

  const selectedValue = elements.builtInPictures.value;
  const selectedLabel = elements.builtInPictures.selectedOptions[0].textContent;

  runRiskyAction(() => {
    const selectedImage = registerBuiltInPicture(selectedValue, selectedLabel);
    showImage(selectedImage);
    markUnsaved();
  });
  elements.builtInPictures.value = "";
}

function changeImage() {
  const selectedValue = elements.pictureSelect.value;
  const selectedImage = sessionPictures.get(selectedValue);

  if (selectedImage) {
    if (hasUnsavedChanges) {
      elements.pictureSelect.value = activePictureId;
    }

    runRiskyAction(() => {
      elements.pictureSelect.value = selectedValue;
      showImage(selectedImage);
      markUnsaved();
    });
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function getProjectCode() {
  const picture = getCurrentPicture();

  return {
    version: 1,
    savedAt: new Date().toISOString(),
    session: { ...sessionDetails },
    customColors,
    picture: picture
      ? {
          name: picture.name,
          url: picture.objectUrl ? "" : picture.url,
          alt: picture.alt,
          sourceType: picture.sourceType,
        }
      : null,
    highlights: getHighlightRecords(),
  };
}

function getCsvText() {
  const picture = getCurrentPicture();
  const rows = [
    [
      "Name",
      "Time/date",
      "Note Added",
      "Store #",
      "Store Location",
      "Picture",
      "Highlight #",
      "Color",
      "X %",
      "Y %",
      "Circle Size",
    ],
  ];

  for (const record of getHighlightRecords()) {
    rows.push([
      record.author,
      record.timestamp,
      record.note,
      record.storeNumber,
      record.storeLocation,
      picture?.name || "",
      record.number,
      record.color,
      record.xPercent,
      record.yPercent,
      record.diameter,
    ]);
  }

  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

function sanitizeFilename(value) {
  return String(value || "highlight-project")
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function getProjectFilename() {
  const picture = getCurrentPicture();
  return sanitizeFilename(
    elements.projectFolderName.value.trim() || picture?.name || "highlight-project",
  );
}

async function writeDirectoryFile(directory, filename, contents) {
  const fileHandle = await directory.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(contents);
  await writable.close();
}

function createHighlightFromRecord(record) {
  const highlight = document.createElement("div");
  const restoredNumber = Number(record.number) || highlightId + 1;
  const restoredDiameter = Number(record.diameter) || diameter;

  highlightId = Math.max(highlightId, restoredNumber);
  highlight.id = `highlight-${restoredNumber}`;
  highlight.dataset.number = restoredNumber;
  highlight.dataset.xPercent = Number(record.xPercent).toFixed(4);
  highlight.dataset.yPercent = Number(record.yPercent).toFixed(4);
  highlight.dataset.diameter = restoredDiameter;
  highlight.dataset.note = record.note || "";
  highlight.dataset.author = record.author || "";
  highlight.dataset.storeNumber = record.storeNumber || "";
  highlight.dataset.storeLocation = record.storeLocation || "";
  highlight.dataset.timestamp = record.timestamp || "";
  highlight.dataset.color = normalizeColor(record.color);
  highlight.tabIndex = 0;
  highlight.setAttribute("role", "button");
  highlight.classList.add("highlight");
  highlight.classList.toggle("has-note", Boolean(highlight.dataset.note));
  highlight.style.background = toAlphaColor(highlight.dataset.color, 0.5);
  highlight.style.left = `${record.xPercent}%`;
  highlight.style.top = `${record.yPercent}%`;
  highlight.style.width = `${restoredDiameter}px`;
  highlight.style.height = `${restoredDiameter}px`;
  highlight.setAttribute("aria-label", getHighlightLabel(highlight));
  elements.highlights.appendChild(highlight);
}

function restoreProjectCode(projectCode) {
  clearHighlights();

  if (projectCode.session) {
    sessionDetails.name = projectCode.session.name || "";
    sessionDetails.storeNumber = projectCode.session.storeNumber || "";
    sessionDetails.storeLocation = projectCode.session.storeLocation || "";
    elements.sessionName.value = sessionDetails.name;
    elements.sessionStoreNumber.value = sessionDetails.storeNumber;
    elements.sessionStoreLocation.value = sessionDetails.storeLocation;
    updateSessionSummary();
  }

  if (Array.isArray(projectCode.customColors)) {
    customColors = [
      ...new Set([
        ...customColors,
        ...projectCode.customColors.map(normalizeColor).filter((color) => !defaultColors.includes(color)),
      ]),
    ];
    saveCustomColors();
    renderColorList();
  }

  for (const record of projectCode.highlights || []) {
    createHighlightFromRecord(record);
  }

  setSelectedHighlight(null);
  renderNotesList();
  updateCounter();
}

function createMarkedImageBlob() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const imageBounds = elements.map.getBoundingClientRect();
  const xScale = elements.map.naturalWidth / imageBounds.width;
  const yScale = elements.map.naturalHeight / imageBounds.height;

  canvas.width = elements.map.naturalWidth;
  canvas.height = elements.map.naturalHeight;
  context.drawImage(elements.map, 0, 0, canvas.width, canvas.height);

  for (const record of getHighlightRecords()) {
    const centerX = (record.xPercent / 100) * canvas.width;
    const centerY = (record.yPercent / 100) * canvas.height;
    const radius = (record.diameter * ((xScale + yScale) / 2)) / 2;

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fillStyle = toAlphaColor(record.color, 0.5);
    context.fill();
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/png");
  });
}

function createSourceImageBlob() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = elements.map.naturalWidth;
  canvas.height = elements.map.naturalHeight;
  context.drawImage(elements.map, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/png");
  });
}

async function saveProjectFolder() {
  const projectBaseName = getProjectFilename();
  const sourcePictureFilename = `${projectBaseName}-source-picture.png`;
  const highlightedPictureFilename = `${projectBaseName}-highlighted-picture.png`;
  const csvFilename = `${projectBaseName}-highlight-notes.csv`;
  const codeFilename = "highlight-project-code.json";
  const projectCode = getProjectCode();
  projectCode.picture = {
    ...projectCode.picture,
    fileName: sourcePictureFilename,
    highlightedFileName: highlightedPictureFilename,
  };

  try {
    const sourceImageBlob = await createSourceImageBlob();
    const markedImageBlob = await createMarkedImageBlob();

    if (!window.showDirectoryPicker) {
      downloadBlob(sourceImageBlob, sourcePictureFilename);
      downloadBlob(markedImageBlob, highlightedPictureFilename);
      downloadBlob(
        new Blob([getCsvText()], { type: "text/csv;charset=utf-8" }),
        csvFilename,
      );
      downloadBlob(
        new Blob([JSON.stringify(projectCode, null, 2)], { type: "application/json" }),
        codeFilename,
      );
      markExported();
      window.alert("Your browser does not support folder saving, so the project files were downloaded separately.");
      return;
    }

    const directory = await window.showDirectoryPicker({ mode: "readwrite" });
    const projectDirectory = await directory.getDirectoryHandle(projectBaseName, { create: true });
    await writeDirectoryFile(projectDirectory, sourcePictureFilename, sourceImageBlob);
    await writeDirectoryFile(projectDirectory, highlightedPictureFilename, markedImageBlob);
    await writeDirectoryFile(
      projectDirectory,
      csvFilename,
      new Blob([getCsvText()], { type: "text/csv;charset=utf-8" }),
    );
    await writeDirectoryFile(
      projectDirectory,
      codeFilename,
      new Blob([JSON.stringify(projectCode, null, 2)], { type: "application/json" }),
    );
    markExported();
  } catch {
    window.alert("The project folder could not be saved.");
  }
}

async function loadProjectFolder() {
  if (!window.showDirectoryPicker) {
    window.alert("This browser does not support loading a project folder.");
    return;
  }

  try {
    const directory = await window.showDirectoryPicker();
    const codeFile = await (await directory.getFileHandle("highlight-project-code.json")).getFile();
    const projectCode = JSON.parse(await codeFile.text());
    const sourcePictureFilename = projectCode.picture?.fileName;

    if (sourcePictureFilename) {
      const pictureFile = await (await directory.getFileHandle(sourcePictureFilename)).getFile();
      const objectUrl = URL.createObjectURL(pictureFile);
      const selectedImage = registerDisplayedProjectPicture(pictureFile.name, objectUrl);
      showImage(selectedImage);
    }

    restoreProjectCode(projectCode);
    markExported();
  } catch {
    window.alert("The selected folder does not contain a valid saved project.");
  }
}

elements.highlights.addEventListener("pointerdown", placeHighlight);
elements.highlights.addEventListener("dblclick", (event) => {
  if (event.target.classList.contains("highlight")) {
    openNoteDialog(event.target);
  }
});
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
elements.themeToggle.addEventListener("click", toggleTheme);
elements.undoHighlight.addEventListener("click", undoHighlight);
elements.clearHighlights.addEventListener("click", () => {
  runRiskyAction(() => {
    clearHighlights();
    markUnsaved();
  });
});
elements.builtInPictures.addEventListener("change", loadBuiltInPicture);
elements.mapTab.addEventListener("click", () => setActiveTab("map"));
elements.notesTab.addEventListener("click", () => {
  renderNotesList();
  setActiveTab("notes");
});
elements.colorsTab.addEventListener("click", () => {
  renderColorList();
  setActiveTab("colors");
});
elements.colorList.addEventListener("click", (event) => {
  const colorButton = event.target.closest(".color-swatch");

  if (colorButton) {
    selectColor(colorButton.dataset.color);
  }
});
elements.addColor.addEventListener("click", () => {
  updateColorPickerPreview();
  elements.colorDialog.showModal();
});
elements.deleteColor.addEventListener("click", () => {
  if (!customColors.includes(currentColor)) {
    return;
  }

  customColors = customColors.filter((color) => color !== currentColor);
  saveCustomColors();
  selectColor(defaultColors[0]);
});
elements.customColor.addEventListener("input", updateColorPickerPreview);
elements.colorDialogForm.addEventListener("submit", (event) => {
  if (event.submitter !== elements.saveCustomColor) {
    return;
  }

  const color = normalizeColor(elements.customColor.value);

  if (!getAvailableColors().includes(color)) {
    customColors.push(color);
    saveCustomColors();
  }

  selectColor(color);
});
elements.noteDialogForm.addEventListener("submit", (event) => {
  if (event.submitter === elements.saveNoteDialog) {
    saveSelectedHighlightNote(elements.noteDialogText.value);
  }
});
elements.saveNote.addEventListener("click", () => {
  if (!selectedHighlight) {
    return;
  }

  saveSelectedHighlightNote(elements.highlightNote.value);
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
elements.sizeRange.addEventListener("pointerenter", setSizePreviewPosition);
elements.sizeRange.addEventListener("pointermove", setSizePreviewPosition);
elements.sizeRange.addEventListener("pointerdown", (event) => {
  elements.sizeRange.setPointerCapture(event.pointerId);
  setSizePreviewPosition(event);
});
elements.sizeRange.addEventListener("pointerup", (event) => {
  elements.sizeRange.releasePointerCapture(event.pointerId);

  if (!elements.sizeRange.matches(":hover")) {
    hideSizePreview();
  }
});
elements.sizeRange.addEventListener("pointercancel", hideSizePreview);
elements.sizeRange.addEventListener("pointerleave", (event) => {
  if (!elements.sizeRange.hasPointerCapture(event.pointerId)) {
    hideSizePreview();
  }
});
elements.sizeRange.addEventListener("input", (event) => {
  updateSizePreview();

  if (event instanceof PointerEvent) {
    setSizePreviewPosition(event);
  }
});
elements.fileInput.addEventListener("change", loadUploadedImages);
elements.pictureSelect.addEventListener("change", changeImage);
elements.saveProject.addEventListener("click", saveProjectFolder);
elements.loadProjectFolder.addEventListener("click", () => runRiskyAction(loadProjectFolder));
elements.sessionForm.addEventListener("submit", () => {
  saveSessionDetails();
  markUnsaved();
});
elements.editSession.addEventListener("click", () => {
  elements.sessionName.value = sessionDetails.name;
  elements.sessionStoreNumber.value = sessionDetails.storeNumber;
  elements.sessionStoreLocation.value = sessionDetails.storeLocation;
  elements.sessionDialog.showModal();
});
elements.cancelRiskyAction.addEventListener("click", () => {
  pendingRiskyAction = null;
});
elements.confirmRiskyAction.addEventListener("click", confirmRiskyAction);
window.addEventListener("beforeunload", (event) => {
  if (hasUnsavedChanges) {
    event.preventDefault();
    event.returnValue = "";
  }
});
window.addEventListener("pagehide", revokeUploadedImages);
window.addEventListener("resize", fitMapToAvailableArea);

updateSizePreview();
loadCustomColors();
updatePreviewColor();
updateColorButton();
renderColorList();
registerInitialPicture();
renderNotesList();
updateSessionSummary();
document.documentElement.dataset.theme = "light";
updateThemeToggle();
if (elements.map.complete) {
  fitMapToAvailableArea();
} else {
  elements.map.addEventListener("load", fitMapToAvailableArea, { once: true });
}
elements.sessionDialog.showModal();
