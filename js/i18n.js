// js/i18n.js
// Module for Internationalization (i18n)

// Ensure the main app namespace exists
window.stringTheoryApp = window.stringTheoryApp || {};

window.stringTheoryApp.i18n = (function() {
    'use strict';

    let currentTranslations = {}; 

    async function fetchTranslations(lang) {
        try {
            const response = await fetch(`lang/${lang}.json?v=${new Date().getTime()}`); 
            if (!response.ok) {
                console.error(`DEBUG i18n: Could not load ${lang}.json. Status: ${response.status} ${response.statusText}`);
                if (lang !== 'en') {
                    console.warn(`DEBUG i18n: Falling back to English translations.`);
                    return fetchTranslations('en');
                }
                currentTranslations = {}; 
                return {}; 
            }
            const data = await response.json();
            currentTranslations = data; 
            return data;
        } catch (error) {
            console.error(`DEBUG i18n: Error fetching or parsing translations for ${lang}:`, error);
            if (lang !== 'en') {
                console.warn(`DEBUG i18n: Falling back to English translations due to error.`);
                return fetchTranslations('en');
            }
            currentTranslations = {}; 
            return {};
        }
    }

    function applyTranslationsToPage() {
        if (!currentTranslations || Object.keys(currentTranslations).length === 0) {
            console.warn("DEBUG i18n: Translations not loaded or empty. Page text might not update correctly.");
            return;
        }

        const docTitleKey = "docTitle";
        if (currentTranslations[docTitleKey] !== undefined) {
            document.title = currentTranslations[docTitleKey];
        }

        const elements = document.querySelectorAll('[data-translation-key]');
        elements.forEach(el => {
            const key = el.getAttribute('data-translation-key');
            if (currentTranslations[key] !== undefined) {
                if (el.tagName === 'LI' && el.querySelector('i') && currentTranslations[key].startsWith('<i>')) {
                    el.innerHTML = currentTranslations[key];
                } else {
                    el.textContent = currentTranslations[key];
                }
            }
        });

        document.querySelectorAll('.svg-placeholder-container svg').forEach(svgElement => {
            if (window.stringTheoryApp.svgLoader && typeof window.stringTheoryApp.svgLoader.applySvgTextTranslations === 'function') {
                 window.stringTheoryApp.svgLoader.applySvgTextTranslations(svgElement, currentTranslations);
            }
        });
        
        if (window.stringTheoryApp.p5LabInstance && 
            typeof window.stringTheoryApp.p5LabInstance.redraw === 'function' && 
            window.stringTheoryApp.p5LabInstance.isLooping()) {
             window.stringTheoryApp.p5LabInstance.redraw(); 
        }
    }
    
    async function switchLanguage(lang, langButtons, htmlElement, bodyElement) {
        window.stringTheoryApp.currentLang = lang; // Update global currentLang
        localStorage.setItem('preferredLang', lang);
        currentTranslations = await fetchTranslations(lang); // Update module's currentTranslations

        htmlElement.lang = lang;
        htmlElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
        bodyElement.style.fontFamily = lang === 'fa' ? "'Vazirmatn', 'Roboto', sans-serif" : "'Roboto', 'Vazirmatn', sans-serif";
        
        if (langButtons.en && langButtons.fa) {
            langButtons.en.classList.toggle('active-lang', lang === 'en');
            langButtons.fa.classList.toggle('active-lang', lang === 'fa');
            langButtons.en.setAttribute('aria-pressed', (lang === 'en').toString());
            langButtons.fa.setAttribute('aria-pressed', (lang === 'fa').toString());
        }
        
        applyTranslationsToPage(); 
        
        if (window.stringTheoryApp.svgLoader && typeof window.stringTheoryApp.svgLoader.updateAllSvgColors === 'function') { 
            window.stringTheoryApp.svgLoader.updateAllSvgColors(); 
        }
        
        const stringTypeToggleBtn = document.getElementById('string-type-toggle');
        if (stringTypeToggleBtn) {
            const isOpen = stringTypeToggleBtn.getAttribute('aria-pressed') === 'true';
            const openKey = stringTypeToggleBtn.getAttribute('data-translation-key-open') || "labToggleOpenActive";
            const closedKey = stringTypeToggleBtn.getAttribute('data-translation-key-closed') || "labToggleOpenDefault";
            stringTypeToggleBtn.textContent = isOpen ? (currentTranslations[openKey] || (lang === 'fa' ? "تغییر به حلقه بسته" : "Switch to Closed Loop")) 
                                                  : (currentTranslations[closedKey] || (lang === 'fa' ? "تغییر به ریسمان باز" : "Switch to Open String"));
        }
    }


    function getTranslation(key, fallbackText = '') {
        const translated = currentTranslations[key];
        if (translated === undefined) {
            return fallbackText || key; 
        }
        return translated;
    }
    
    // Expose public functions
    return {
        // fetchTranslations, // Not needed to be public if switchLanguage handles it
        // applyTranslationsToPage, // Called by switchLanguage
        switchLanguage,
        getTranslation,
        getCurrentTranslations: () => currentTranslations 
    };

})();
