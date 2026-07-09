# Highlighting Program

A lightweight browser tool for marking and counting points of interest on a floor plan or image. Highlights can be green or red, resized, undone, and cleared without modifying the original image.

## Run locally

No build step or dependencies are required. Clone the repository and open `index.html` in a modern browser.

## Picture selection

Use **Choose or upload picture** to select an image from a local folder. The selected image is added to the session picture history dropdown after it is displayed on the page.

The browser cannot permanently save local files into the repository's `assets/` folder by itself. To keep a picture with the project, manually copy it into `assets/` or another project folder.

The dropdown resets on every new browser session. It only lists pictures that have already been displayed during the current session, so large folders are not loaded into the page all at once.

## Controls

- Enter your name, store number, and location when the session starts.
- Use the sun/moon button to switch between light and dark mode.
- Click the image to place a highlight, or click an existing highlight to select it.
- Switch between green and red highlights with **Highlight color**.
- Adjust the circle diameter with **Highlight size** and use the inline preview to see the exact circle size.
- Add notes to the selected highlight from the compact **Map** tab.
- Open the **Notes** tab to review saved notes.
- Select a saved note to locate its highlight on the image.
- Remove the latest mark with **Undo last highlight**.
- Remove every mark with **Clear all highlights**.
- Choose a bundled image from **Built-in pictures** for quick use.
- Choose or upload a picture from a local folder.
- Pictures scale to fit the available map area so the page does not require vertical scrolling on normal desktop layouts.
- Use **Session picture history** to switch between pictures displayed during the current session.
- Save one named project folder with the source picture, highlighted picture, Excel CSV, and restore JSON.
- Reload a saved project folder to restore the picture, circle positions, notes, and session details.

The app warns before closing, reloading, clearing, changing pictures, or loading another project when current-session data has not been exported.

## Project structure

- `index.html` contains the application markup.
- `styles.css` defines the responsive layout and highlight overlay.
- `script.js` handles image selection, highlighting, notes, folder export/load, unsaved-data protection, and counters.
- `assets/` contains the bundled example images.

Uploaded images and highlights remain in the browser and are not sent anywhere.

Project folders include:

- `*-source-picture.png` for restoring the original picture.
- `*-highlighted-picture.png` for a shareable marked-up picture.
- `*-highlight-notes.csv` for Excel-compatible note data.
- `highlight-project-code.json` for restoring circle positions, store details, dates, authors, and notes.

Project-code files store highlight positions as image-relative percentages. That keeps circles accurate when the project folder is reloaded. Folder save/load works in browsers that support the File System Access API, such as Chrome and Edge. Other browsers download the project files separately.
