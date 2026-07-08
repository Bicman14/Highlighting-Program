# Highlighting Program

A lightweight browser tool for marking and counting points of interest on a floor plan or image. Highlights can be green or red, resized, undone, and cleared without modifying the original image.

## Run locally

No build step or dependencies are required. Clone the repository and open `index.html` in a modern browser.

## Controls

- Click the image to place a highlight.
- Switch between green and red highlights with **Highlight color**.
- Adjust the circle diameter with **Highlight size**.
- Remove the latest mark with **Undo last highlight**.
- Remove every mark with **Clear all highlights**.
- Upload one or more PNG or JPEG files and choose between them using the image selector.

## Project structure

- `index.html` contains the application markup.
- `styles.css` defines the responsive layout and highlight overlay.
- `script.js` handles image selection, highlighting, and counters.
- `assets/` contains the bundled example images.

Uploaded images and highlights remain in the browser and are not sent anywhere.
