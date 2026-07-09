# Highlighting Program

A lightweight browser tool for marking and counting points of interest on a floor plan or image. Highlights can be green or red, resized, undone, and cleared without modifying the original image.

## Run locally

No build step or dependencies are required. Clone the repository and open `index.html` in a modern browser.

## Picture selection

Use **Choose or upload picture** to select an image from a local folder. The selected image is added to the session picture history dropdown after it is displayed on the page.

The browser cannot permanently save local files into the repository's `assets/` folder by itself. To keep a picture with the project, manually copy it into `assets/` or another project folder.

The dropdown resets on every new browser session. It only lists pictures that have already been displayed during the current session, so large folders are not loaded into the page all at once.

## Controls

- Click the image to place a highlight, or click an existing highlight to select it.
- Switch between green and red highlights with **Highlight color**.
- Adjust the circle diameter with **Highlight size** and use the inline preview to see the exact circle size.
- Add notes to the selected highlight from the **Map** tab.
- Open the **Notes** tab to review saved notes.
- Select a saved note to locate its highlight on the image.
- Remove the latest mark with **Undo last highlight**.
- Remove every mark with **Clear all highlights**.
- Choose or upload a picture from a local folder.
- Use **Session picture history** to switch between pictures displayed during the current session.

## Project structure

- `index.html` contains the application markup.
- `styles.css` defines the responsive layout and highlight overlay.
- `script.js` handles image selection, highlighting, notes, and counters.
- `assets/` contains the bundled example images.

Uploaded images and highlights remain in the browser and are not sent anywhere.
