// Check if the required elements are present on the page
const map = document.getElementById("map");
const highlights = document.getElementById("highlights");
const toggleButton = document.getElementById("toggle-button");
const counter = document.getElementById("counter");
const sizeRange = document.getElementById("size");
const fileInput = document.getElementById("file");
const select = document.getElementById("pictures");
const filesByName = new Map();

if (!fileInput) {
  throw new Error("Element with ID 'fileInput' not found");
}

if (!sizeRange) {
  throw new Error("Element with ID 'sizeRange' not found");
}

if (!map) {
  throw new Error("Element with ID 'map' not found");
}

if (!highlights) {
  throw new Error("Element with ID 'highlights' not found");
}

if (!toggleButton) {
  throw new Error("Element with ID 'toggle-button' not found");
}

if (!counter) {
  throw new Error("Element with ID 'counter' not found");
}

let highlightCount = 0;
let currentHighlight;
let currentColor = "green";
let greenCount = 0;
let redCount = 0;
let diameter = 45;

map.addEventListener("pointerdown", (event) => {
  const x = event.x;
  const y = event.y;

  currentHighlight = document.createElement("div");
  currentHighlight.classList.add("highlight", currentColor);
  currentHighlight.style.left = `${x - diameter / 2}px`;
  currentHighlight.style.top = `${y - diameter / 2}px`;
  currentHighlight.style.width = diameter + "px";
  currentHighlight.style.height = diameter + "px";

  highlightCount++;
  currentHighlight.setAttribute("id", `highlight-${highlightCount}`);
  highlights.appendChild(currentHighlight);

  updateCounter(currentColor, 1);
});

function changeColor() {
  if (currentColor === "green") {
    currentColor = "red";
    toggleButton.textContent = "Red Highlight";
  } else {
    currentColor = "green";
    toggleButton.textContent = "Green Highlight";
  }
}

function clearAll() {
  while (highlights.firstChild) {
    highlights.removeChild(highlights.firstChild);
  }

  highlightCount = 0;
  greenCount = 0;
  redCount = 0;
  document.getElementById("green-count").textContent = greenCount;
  document.getElementById("red-count").textContent = redCount;
}

//Erases last placed Highlight in Order placed.
function eraseHighlight() {
  const lastHighlight = highlights.lastChild;
  if (lastHighlight) {
    const lastHighlightColor = lastHighlight.classList.contains("green")
      ? "green"
      : "red";
    highlights.removeChild(lastHighlight);
    highlightCount--;
    updateCounter(lastHighlightColor, -1);
  }
}
//Updates the counter for red and green circles on screen.
function updateCounter(color, amount) {
  if (color === "green") {
    greenCount += amount;
    document.getElementById("green-count").textContent = greenCount;
  } else if (color === "red") {
    redCount += amount;
    document.getElementById("red-count").textContent = redCount;
  }
}
//Has a Grey circle following the mouse on screen.
const greyCircle = document.createElement("div");
greyCircle.classList.add("grey-circle");
greyCircle.style.width = diameter + "px";
greyCircle.style.height = diameter + "px";
document.body.appendChild(greyCircle);

document.addEventListener("pointermove", (event) => {
  greyCircle.style.left = `${event.pageX - greyCircle.offsetWidth / 2}px`;
  greyCircle.style.top = `${event.pageY - greyCircle.offsetHeight / 2}px`;
});
//Changes the size of the circles for both the grey and red/green.
sizeRange.addEventListener("input", (event) => {
  diameter = sizeRange.valueAsNumber;
  greyCircle.style.width = diameter + "px";
  greyCircle.style.height = diameter + "px";
});

fileInput.addEventListener("change", (event) => {
  if (!fileInput.files.length) {
    return;
  }
  for (const file of fileInput.files) {
    //file.text = clear.text;
    const pictureLocation = URL.createObjectURL(file);
    filesByName.set(file.name, pictureLocation);
    const option = document.createElement("option");
    option.value = file.name; // prints file name
    option.text = file.name;
    select.appendChild(option);
  }
});

function changeImage() {
  const selectedImage = select.value;

  if (selectedImage) {
    map.src = filesByName.get(selectedImage);
  } else {
    map.src = ""; // Clear the image source if no option is selected
  }
}

select.addEventListener("change", changeImage);
