# StringT - An Interactive Journey into String Theory

**Live Demo (once deployed):** [https://GeekNeuron.github.io/StringT/](https://GeekNeuron.github.io/StringT/)

**StringT** is a bilingual (English/Persian) educational web experience designed to introduce the core concepts of String Theory in a casual, engaging, and visually appealing way. This project is built with modern HTML, CSS, and JavaScript, optimized for hosting on GitHub Pages. It features dynamic content loading for translations and SVG graphics to ensure a lightweight and maintainable codebase.

## Features

* **Interactive Exploration:** Navigate through fundamental ideas of String Theory step-by-step.
* **Bilingual Content (JSON-based i18n):** Full support for English and Persian, with translations managed in external JSON files (`lang/en.json`, `lang/fa.json`) for easy updates and scalability.
* **Dynamic SVG Loading:** Visual elements (SVG graphics) are stored externally (`svg/` folder) and loaded dynamically, keeping the main HTML clean and lightweight.
* **Interactive String Lab:** A p5.js powered canvas allowing users to experiment with a virtual string's vibration modes, amplitude, speed, and type (open/closed), including a "pluck" feature.
* **Modern & Responsive Design:** Clean interface inspired by contemporary web aesthetics, with a dark mode toggle and full responsiveness across devices.
* **Accessible:** Includes ARIA attributes and focus management for improved accessibility.
* **Client-Side:** Runs entirely in the browser; no backend required.
* **Educational Focus:** Aims to make complex topics more accessible to a general audience.
* **Organized Project Structure:** Code is modularized into dedicated folders for JavaScript (`js/`), languages (`lang/`), and SVG images (`svg/`).

## Content Overview

The experience covers the following key areas of String Theory at an introductory level:

1.  **Welcome!**: Introduction to the journey.
2.  **What's the Problem?**: Limitations of General Relativity and Quantum Mechanics.
3.  **The Big Idea: Vibrating Strings**: Particles as tiny vibrating strings.
4.  **Extra Dimensions**: The need for extra spatial dimensions and compactification.
5.  **History & Key Physicists**: An interactive timeline of String Theory's development.
6.  **A Family of Theories**: The five initial Superstring Theories.
7.  **M-Theory: A Unification**: The search for a unified "theory of everything" in 11 dimensions.
8.  **Branes and Beyond**: Introducing higher-dimensional objects (p-branes).
9.  **String Theory & The Fabric of Reality**: Exploring singularities, exotic spacetimes, and the holographic principle.
10. **Interactive String Lab**: Experiment with a virtual string.
11. **The Landscape & Challenges**: Current status, the "cosmic landscape," and open questions.
12. **Philosophical Implications**: Broader questions raised by the theory.
13. **Glossary of Terms**: Definitions of key terminology.
14. **About This Project**: Information about the project's creation and purpose.
15. **Further Reading & Resources**: Suggestions for deeper exploration.

## Project Structure

```
StringT/
├── lang/
│   ├── en.json         # English translations
│   └── fa.json         # Persian translations
├── svg/
│   ├── intro-visual.svg
│   ├── problem-visual-v2.svg
│   ├── bigidea-visual.svg
│   ├── dimensions-visual.svg
│   ├── types-visual.svg
│   ├── mtheory-visual.svg
│   ├── branes-visual.svg
│   ├── exotic-spacetime-visual.svg
│   ├── landscape-visual.svg
│   ├── philosophy-visual-v2.svg
│   ├── about-visual.svg
│   ├── conclusion-visual.svg
│   └── furtherreading-visual.svg
├── js/
│   ├── i18n.js                 # Internationalization module
│   ├── svg_loader.js           # SVG loading module
│   ├── ui_interactions.js      # UI interactions module (timeline, glossary, etc.)
│   ├── p5_setup.js             # p5.js sketch and setup
│   └── main.js                 # Main application script (orchestrator)
├── style.css           # Main stylesheet
├── index.html          # Main HTML structure (lightweight)
├── LICENSE.md          # Project License (MIT)
└── README.md           # This file
```

## How to Use / Navigate

* Open the [live demo link](https://GeekNeuron.github.io/StringT/) (once deployed).
* Use the language switcher ("English" / "فارسی") to select your preferred language.
* Click the main title ("String Theory") to toggle dark mode.
* Navigate through the sections using the "Previous" and "Next" buttons.
* Click on events in the "History" section timeline to expand for more details.
* Click on terms in the "Glossary" to expand their definitions.
* Interact with the controls in the "Interactive String Lab" to change the string's behavior.

## Development

### Setup for GitHub Pages

1.  Ensure your repository is named `StringT` under your `GeekNeuron` GitHub account.
2.  Place all files and folders as per the `Project Structure` above in the root of the repository.
3.  Go to your repository settings on GitHub.
4.  Navigate to the "Pages" section.
5.  Under "Build and deployment", select "Deploy from a branch" as the source.
6.  Choose the `main` (or `master`) branch and the `/ (root)` folder, then save.
7.  Your site should be live at `https://GeekNeuron.github.io/StringT/` after a few minutes.

### Local Development

* Due to the use of `fetch` API for loading JSON and SVG files, running `index.html` directly from the local file system (`file:///...`) **will not work correctly**.
* **Recommended:** Use a simple local HTTP server.
    * If you have Python installed, navigate to the project's root directory in your terminal and run:
        * Python 3: `python -m http.server`
        * Python 2: `python -m SimpleHTTPServer`
    * Then open `http://localhost:8000` (or the port shown in the terminal) in your browser.
    * Alternatively, use extensions like "Live Server" in VS Code.

### Managing Translations

* All display text is managed in `lang/en.json` (for English) and `lang/fa.json` (for Persian).
* Each file contains a JSON object where keys represent specific text elements (e.g., `"introHeading"`) and values are the translated strings.
* To add or edit translations:
    1.  Identify or add a unique `data-translation-key` to the HTML element in `index.html`.
    2.  Add the corresponding key and translated string to both `en.json` and `fa.json`.
    3.  The `js/i18n.js` module handles fetching and applying these translations.

### Managing SVGs

* SVG graphics are stored as individual `.svg` files in the `svg/` folder.
* In `index.html`, placeholders (e.g., `<div id="intro-svg" class="svg-placeholder-container"></div>`) are used.
* The `js/svg_loader.js` module dynamically fetches the content of these SVG files and injects them into their respective placeholders.
* Ensure SVG filenames match the identifiers used in the `svgPlaceholdersMap` in `js/main.js`.

## Technologies Used

* HTML5
* CSS3 (including Custom Properties for theming, Flexbox, Grid)
* JavaScript (ES6+, Asynchronous Fetch API)
* p5.js (for the Interactive String Lab)
* JSON (for internationalization/i18n)
* SVG (for scalable vector graphics)
* Google Fonts (Roboto, Vazirmatn)

## Contributing

Contributions are welcome! Please follow these steps:

1.  **Fork the repository.**
2.  **Create a new branch** for your feature or bug fix (`git checkout -b feature/your-feature-name`).
3.  **Make your changes.**
    * **Content/Translations:** Edit the relevant `.json` files in the `lang/` folder or the text content within `index.html` (if it's a structural change).
    * **Styling:** Modify `style.css`.
    * **Functionality:** Update files in the `js/` folder.
    * **SVGs:** Add or modify files in the `svg/` folder and ensure they are loaded correctly.
4.  **Test your changes thoroughly,** especially across different browsers and devices.
5.  **Commit your changes** (`git commit -am 'Add some feature'`).
6.  **Push to the branch** (`git push origin feature/your-feature-name`).
7.  **Submit a pull request** with a clear description of your changes.

## License

This project is licensed under the MIT License - see the `LICENSE.md` file for details.

## Acknowledgements

* Created by **GeekNeuron**.
* Significant assistance for content generation, code structure, SVG creation, and iterative improvements was provided by an AI language model.
* *(You can add other acknowledgements here if needed)*

---

This project aims to be a high-quality, engaging, and informative resource. Enjoy your journey into the world of String Theory!
