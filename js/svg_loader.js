
// js/svg_loader.js
// Module for loading and managing SVG graphics
// Version: v2_refactor

// Ensure the main app namespace exists
window.stringTheoryApp = window.stringTheoryApp || {};

window.stringTheoryApp.svgLoader = (function() {
    'use strict';

    const bodyElement = document.body; 

    function applyDynamicSvgStyles(svgElement, isDarkMode) {
        if (!svgElement) return;
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
    
    function applySvgTextTranslations(svgElement, translations) { // Added translations parameter
        if (!svgElement || !translations || Object.keys(translations).length === 0) {
            // console.warn("DEBUG svg_loader: SVG element or translations not available for text translation.");
            return;
        }
        const textElements = svgElement.querySelectorAll('text[data-translation-key]');
        textElements.forEach(textEl => {
            const key = textEl.getAttribute('data-translation-key');
            if (translations[key] !== undefined) {
                textEl.textContent = translations[key];
            }
        });
    }
    
    function updateAllSvgColors() {
        const isDarkMode = bodyElement.classList.contains('dark-mode');
        document.querySelectorAll('.svg-placeholder-container svg').forEach(svg => {
            if (svg) { 
                applyDynamicSvgStyles(svg, isDarkMode);
            }
        });
    }

    async function loadSvg(placeholderElement, filePath) {
        if (!placeholderElement) {
            return { status: 'placeholder_not_found', path: filePath };
        }
        try {
            const response = await fetch(filePath + `?v=${new Date().getTime()}`); 
            if (!response.ok) {
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
                applyDynamicSvgStyles(svgElement, bodyElement.classList.contains('dark-mode'));
                // Translations will be applied globally by i18n.applyTranslationsToPage or by switchLanguage
                // Or, if i18n module is guaranteed to be loaded:
                if (window.stringTheoryApp.i18n) {
                    applySvgTextTranslations(svgElement, window.stringTheoryApp.i18n.getCurrentTranslations());
                }
            }
            return { status: 'success', path: filePath };
        } catch (error) {
            const errorMsgKey = "errorNetworkSVG";
            const errorDetails = `${filePath.split('/').pop()}`;
            const errorText = window.stringTheoryApp.i18n ? window.stringTheoryApp.i18n.getTranslation(errorMsgKey, "Network error loading illustration") : "Network error loading illustration";
            placeholderElement.innerHTML = `<p class="error-message">${errorText}</p><p class="error-details">${errorDetails}</p>`;
            return { status: 'network_error', path: filePath, error: error.message };
        }
    }

    async function loadAllSvgs(svgMap) {
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
        } catch (e) {
            console.error("DEBUG svg_loader: Error during Promise.all for SVG loading:", e);
        }
    }
    
    // Expose public functions
    return {
        loadAllSvgs,
        updateAllSvgColors,
        applySvgTextTranslations // Make this available if i18n needs to call it
    };

})();
