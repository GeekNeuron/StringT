// js/svg_loader.js
// Module for loading and managing SVG graphics
// Version: v2_refactor

// Ensure the main app namespace exists
window.stringTheoryApp = window.stringTheoryApp || {};

window.stringTheoryApp.svgLoader = (function() {
    'use strict';

    const bodyElement = document.body; // Cache body element

    /**
     * Applies dynamic fill/stroke styles to SVG elements based on dark/light mode.
     * @param {SVGElement} svgElement - The root SVG element.
     * @param {boolean} isDarkMode - True if dark mode is active.
     */
    function applyDynamicSvgStyles(svgElement, isDarkMode) {
        if (!svgElement) return;
        // console.log(`DEBUG svg_loader: Applying dynamic styles to SVG. Dark mode: ${isDarkMode}`);
        const dynamicFills = svgElement.querySelectorAll('[data-light-fill][data-dark-fill]');
        dynamicFills.forEach(el => {
            try {
                el.setAttribute('fill', isDarkMode ? el.dataset.darkFill : el.dataset.lightFill);
            } catch (e) {
                console.warn("Error setting fill on SVG element:", el, e);
            }
        });

        const dynamicTextFills = svgElement.querySelectorAll('text[data-light-fill][data-dark-fill]');
        dynamicTextFills.forEach(el => {
            try {
                el.setAttribute('fill', isDarkMode ? el.dataset.darkFill : el.dataset.lightFill);
            } catch (e) {
                console.warn("Error setting fill on SVG text element:", el, e);
            }
        });
    }
    
    /**
     * Applies translations to text elements within an SVG.
     * @param {SVGElement} svgElement - The root SVG element.
     */
    function applySvgTextTranslations(svgElement) {
        if (!svgElement || !window.stringTheoryApp.i18n) {
            // console.warn("DEBUG svg_loader: SVG element or i18n module not available for text translation.");
            return;
        }
        // console.log("DEBUG svg_loader: Applying SVG text translations.");
        const translations = window.stringTheoryApp.i18n.getCurrentTranslations();
        if (!translations || Object.keys(translations).length === 0) {
            // console.warn("DEBUG svg_loader: Translations not available for SVG text.");
            return;
        }

        const textElements = svgElement.querySelectorAll('text[data-translation-key]');
        textElements.forEach(textEl => {
            const key = textEl.getAttribute('data-translation-key');
            if (translations[key] !== undefined) {
                textEl.textContent = translations[key];
            } else {
                // console.warn(`DEBUG svg_loader: SVG Text translation key not found: ${key} for element:`, textEl);
            }
        });
    }
    
    /**
     * Updates colors for all currently loaded SVGs.
     * Typically called on dark mode toggle or initial load after SVGs are present.
     */
    function updateAllSvgColors() {
        // console.log("DEBUG svg_loader: updateAllSvgColors() called.");
        const isDarkMode = bodyElement.classList.contains('dark-mode');
        document.querySelectorAll('.svg-placeholder-container svg').forEach(svg => {
            if (svg) { 
                applyDynamicSvgStyles(svg, isDarkMode);
            }
        });
    }

    /**
     * Loads an SVG file and injects it into a placeholder element.
     * @param {HTMLElement} placeholderElement - The div element to inject SVG into.
     * @param {string} filePath - The path to the SVG file.
     * @returns {Promise<Object>} A promise that resolves with a status object.
     */
    async function loadSvg(placeholderElement, filePath) {
        if (!placeholderElement) {
            console.warn(`DEBUG svg_loader: SVG placeholder element not found for path: ${filePath}`);
            return { status: 'placeholder_not_found', path: filePath };
        }
        // console.log(`DEBUG svg_loader: Attempting to load SVG: ${filePath} into placeholder:`, placeholderElement.id);
        try {
            const response = await fetch(filePath + `?v=${new Date().getTime()}`); // Cache busting
            if (!response.ok) {
                console.error(`DEBUG svg_loader: Failed to load SVG: ${filePath}, Status: ${response.status} ${response.statusText}`);
                const errorMsgKey = "errorLoadingSVG";
                const errorDetails = `${filePath.split('/').pop()} (${response.status})`;
                const errorText = window.stringTheoryApp.i18n ? window.stringTheoryApp.i18n.getTranslation(errorMsgKey, "Error loading illustration") : "Error loading illustration";
                placeholderElement.innerHTML = `<p class="error-message">${errorText}</p><p class="error-details">${errorDetails}</p>`;
                return { status: 'fetch_error', path: filePath, code: response.status };
            }
            const svgText = await response.text();
            placeholderElement.innerHTML = svgText; 
            const svgElement = placeholderElement.querySelector('svg');
            if (svgElement) {
                // Apply styles and translations immediately after loading
                applyDynamicSvgStyles(svgElement, bodyElement.classList.contains('dark-mode'));
                applySvgTextTranslations(svgElement); 
            }
            // console.log(`DEBUG svg_loader: Successfully loaded SVG: ${filePath}`);
            return { status: 'success', path: filePath };
        } catch (error) {
            console.error(`DEBUG svg_loader: Network error fetching SVG ${filePath}:`, error);
            const errorMsgKey = "errorNetworkSVG";
            const errorDetails = `${filePath.split('/').pop()}`;
            const errorText = window.stringTheoryApp.i18n ? window.stringTheoryApp.i18n.getTranslation(errorMsgKey, "Network error loading illustration") : "Network error loading illustration";
            placeholderElement.innerHTML = `<p class="error-message">${errorText}</p><p class="error-details">${errorDetails}</p>`;
            return { status: 'network_error', path: filePath, error: error.message };
        }
    }

    /**
     * Loads all SVGs defined in a map.
     * @param {Object} svgMap - An object mapping placeholder IDs to SVG file paths.
     * @returns {Promise<void>}
     */
    async function loadAllSvgs(svgMap) {
        // console.log("DEBUG svg_loader: Loading all SVGs...");
        const svgLoadPromises = [];
        for (const id in svgMap) {
            const element = document.getElementById(id); 
            if (element) {
                svgLoadPromises.push(loadSvg(element, svgMap[id]));
            } else {
                console.warn(`DEBUG svg_loader: SVG placeholder div with ID '${id}' not found in HTML.`);
            }
        }
        
        try {
            const results = await Promise.all(svgLoadPromises);
            results.forEach(result => {
                if (result && result.status !== 'success') { 
                    console.warn(`DEBUG svg_loader: SVG loading issue: ${result.status} for ${result.path}${result.code ? ' (Code: ' + result.code + ')' : ''}${result.error ? ' Error: ' + result.error : ''}`);
                }
            });
            // console.log("DEBUG svg_loader: SVG loading process completed (or attempted).");
        } catch (e) {
            console.error("DEBUG svg_loader: Error during Promise.all for SVG loading:", e);
        }
    }
    
    // Expose public functions
    return {
        loadAllSvgs,
        updateAllSvgColors,
        // Expose individual loaders if needed, though loadAllSvgs is primary
        // loadSingleSvg: loadSvg // Uncomment if direct single load is needed from main.js
    };

})();
