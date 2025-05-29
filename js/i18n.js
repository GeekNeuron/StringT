// js/i18n.js
// Module for Internationalization (i18n)

// Ensure the main app namespace exists
window.stringTheoryApp = window.stringTheoryApp || {};

window.stringTheoryApp.i18n = (function() {
    'use strict';

    // This will be populated by fetchTranslations
    let currentTranslations = {}; 
    // currentLang will be managed by the main script and passed or set here
    // For now, we assume it's accessible or passed to functions that need it.

    /**
     * Fetches the translation file for the given language.
     * @param {string} lang - The language code (e.g., 'en', 'fa').
     * @returns {Promise<Object>} A promise that resolves to the translation object.
     */
    async function fetchTranslations(lang) {
        // console.log(`DEBUG i18n: Fetching translations for: ${lang} from lang/${lang}.json`);
        try {
            const response = await fetch(`lang/${lang}.json?v=${new Date().getTime()}`); // Cache busting
            if (!response.ok) {
                console.error(`DEBUG i18n: Could not load ${lang}.json. Status: ${response.status} ${response.statusText}`);
                // Fallback to English if the current language file fails, but not if English itself fails
                if (lang !== 'en') {
                    console.warn(`DEBUG i18n: Falling back to English translations.`);
                    return fetchTranslations('en');
                }
                currentTranslations = {}; // Clear current translations on critical failure
                return {}; // Return empty if English also fails
            }
            const data = await response.json();
            // console.log(`DEBUG i18n: Successfully fetched and parsed translations for ${lang}.`);
            currentTranslations = data; // Store the loaded translations
            return data;
        } catch (error) {
            console.error(`DEBUG i18n: Error fetching or parsing translations for ${lang}:`, error);
            if (lang !== 'en') {
                console.warn(`DEBUG i18n: Falling back to English translations due to error.`);
                return fetchTranslations('en');
            }
            currentTranslations = {}; // Clear current translations on critical failure
            return {};
        }
    }

    /**
     * Applies the loaded translations to the page elements.
     */
    function applyTranslationsToPage() {
        if (!currentTranslations || Object.keys(currentTranslations).length === 0) {
            console.warn("DEBUG i18n: Translations not loaded or empty. Page text might not update correctly.");
            return;
        }
        // console.log("DEBUG i18n: Applying translations to page...");

        // Translate document title
        const docTitleKey = "docTitle";
        if (currentTranslations[docTitleKey] !== undefined) {
            document.title = currentTranslations[docTitleKey];
        }

        // Translate all elements with data-translation-key
        const elements = document.querySelectorAll('[data-translation-key]');
        elements.forEach(el => {
            const key = el.getAttribute('data-translation-key');
            if (currentTranslations[key] !== undefined) {
                if (el.tagName === 'LI' && el.querySelector('i') && currentTranslations[key].startsWith('<i>')) {
                    el.innerHTML = currentTranslations[key];
                } else {
                    el.textContent = currentTranslations[key];
                }
            } else {
                // console.warn(`DEBUG i18n: Translation key not found in JSON: ${key} for element:`, el);
            }
        });

        // Translate SVG text elements (assuming SVGs are already loaded and in DOM)
        document.querySelectorAll('.svg-placeholder-container svg').forEach(svgElement => {
            const textElements = svgElement.querySelectorAll('text[data-translation-key]');
            textElements.forEach(textEl => {
                const key = textEl.getAttribute('data-translation-key');
                if (currentTranslations[key] !== undefined) {
                    textEl.textContent = currentTranslations[key];
                }
            });
        });
        
        // Update p5 sketch instruction text if it's visible and p5 instance exists
        // This relies on p5LabInstance being accessible, perhaps via window.stringTheoryApp
        if (window.stringTheoryApp.p5LabInstance && 
            typeof window.stringTheoryApp.p5LabInstance.redraw === 'function' && 
            window.stringTheoryApp.p5LabInstance.isLooping()) {
             window.stringTheoryApp.p5LabInstance.redraw(); // Redraw to update text
        }
        // console.log("DEBUG i18n: Translations applied.");
    }

    /**
     * Gets a specific translation string.
     * @param {string} key - The translation key.
     * @param {string} [fallbackText=''] - Text to return if key is not found.
     * @returns {string} The translated string or fallback.
     */
    function getTranslation(key, fallbackText = '') {
        const translated = currentTranslations[key];
        if (translated === undefined) {
            // console.warn(`DEBUG i18n: Translation key '${key}' not found, using fallback.`);
            return fallbackText || key; // Return key itself if no fallback
        }
        return translated;
    }
    
    // Expose public functions
    return {
        fetchTranslations,
        applyTranslationsToPage,
        getTranslation,
        // Getter for current translations if needed by other modules directly
        getCurrentTranslations: () => currentTranslations 
    };

})();
