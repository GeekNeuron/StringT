// js/script.js
// Version: v19_debug_final_attempt

// Main application namespace
window.stringTheoryApp = {};

console.log("DEBUG: script.js: File execution started (v19_debug_final_attempt).");

document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: DOMContentLoaded event fired.");

    // --- DOM Element Selection ---
    let sectionsContainer, sections = [], prevBtn, nextBtn, langEnBtn, langFaBtn, mainTitleElement, bodyElement, htmlElement, skipLink;

    try {
        console.log("DEBUG: Attempting to select DOM elements...");
        sectionsContainer = document.getElementById('interactive-content');
        sections = Array.from(document.querySelectorAll('.content-section'));
        prevBtn = document.getElementById('prev-btn');
        nextBtn = document.getElementById('next-btn');
        langEnBtn = document.getElementById('lang-en');
        langFaBtn = document.getElementById('lang-fa');
        mainTitleElement = document.getElementById('main-title');
        bodyElement = document.body;
        htmlElement = document.documentElement;
        skipLink = document.querySelector('.skip-link');
        
        if (!sectionsContainer || sections.length === 0 || !prevBtn || !nextBtn || !langEnBtn || !langFaBtn || !mainTitleElement) {
            let missing = [];
            if (!sectionsContainer) missing.push("interactive-content");
            if (sections.length === 0) missing.push(".content-section (any)");
            if (!prevBtn) missing.push("prev-btn");
            // ... (add other checks)
            console.error(`CRITICAL DEBUG: Essential DOM elements missing: ${missing.join(', ')}. Check HTML IDs and structure.`);
            throw new Error(`Essential DOM elements missing: ${missing.join(', ')}.`);
        }
        console.log("DEBUG: DOM elements selected successfully.");
    } catch (e) {
        console.error("CRITICAL DEBUG: Error selecting DOM elements:", e);
        document.body.innerHTML = `<p class="critical-error-message" style="color:red; text-align:center; padding: 50px; font-size: 1.2em;">Error initializing page (DOM elements missing). Please check console (F12) for details like missing element IDs. Error: ${e.message}</p>`;
        return; 
    }

    // --- State Variables ---
    let currentSectionIndex = 0;
    let currentLang = localStorage.getItem('preferredLang') || (navigator.language.startsWith('fa') ? 'fa' : 'en');
    let translations = {};
    let p5LabInstance = null;
    const sectionTransitionDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--section-transition-duration').replace('s', '')) * 1000 || 450;

    window.stringTheoryApp.getTranslation = (key, fallbackText = '') => {
        const translated = translations[key];
        if (translated === undefined) {
            return fallbackText || key;
        }
        return translated;
    };

    // --- SVG Functions ---
    // DEFINE SVG helper functions BEFORE they are potentially called by other functions like switchLanguage (via applyTranslationsToPage -> applySvgTextTranslations)
    
    function applyDynamicSvgStyles(svgElement, isDarkMode) {
        // console.log("DEBUG: Applying dynamic SVG styles. Dark mode:", isDarkMode, "Element:", svgElement);
        const dynamicFills = svgElement.querySelectorAll('[data-light-fill][data-dark-fill]');
        dynamicFills.forEach(el => el.setAttribute('fill', isDarkMode ? el.dataset.darkFill : el.dataset.lightFill));
        const dynamicTextFills = svgElement.querySelectorAll('text[data-light-fill][data-dark-fill]');
        dynamicTextFills.forEach(el => el.setAttribute('fill', isDarkMode ? el.dataset.darkFill : el.dataset.lightFill));
    }
    
    function applySvgTextTranslations(svgElement) {
        // console.log("DEBUG: Applying SVG text translations to:", svgElement);
        const textElements = svgElement.querySelectorAll('text[data-translation-key]');
        textElements.forEach(textEl => {
            const key = textEl.getAttribute('data-translation-key');
            if (translations[key] !== undefined) {
                textEl.textContent = translations[key];
            }
        });
    }
    
    // DEFINITION of updateSvgColors - Ensure this is defined before it's called.
    function updateSvgColors() {
        console.log("DEBUG: updateSvgColors() CALLED. Dark mode:", bodyElement.classList.contains('dark-mode'));
        const isDarkMode = bodyElement.classList.contains('dark-mode');
        document.querySelectorAll('.svg-placeholder-container svg').forEach(svg => {
            if (svg) { // Ensure svg element actually exists
                applyDynamicSvgStyles(svg, isDarkMode);
            } else {
                console.warn("DEBUG: Found a .svg-placeholder-container without an inner SVG element during updateSvgColors.");
            }
        });
    }
    console.log("DEBUG: Function updateSvgColors defined. Type:", typeof updateSvgColors);


    async function loadSvg(placeholderElement, filePath) {
        if (!placeholderElement) {
            console.warn(`DEBUG: SVG placeholder element not found for path: ${filePath}`);
            return { status: 'placeholder_not_found', path: filePath };
        }
        try {
            const response = await fetch(filePath + `?v=${new Date().getTime()}`);
            if (!response.ok) {
                console.error(`DEBUG: Failed to load SVG: ${filePath}, Status: ${response.status} ${response.statusText}`);
                placeholderElement.innerHTML = `<p class="error-message">Error loading: ${filePath.split('/').pop()} (${response.status})</p>`;
                return { status: 'fetch_error', path: filePath, code: response.status };
            }
            const svgText = await response.text();
            placeholderElement.innerHTML = svgText; 
            const svgElement = placeholderElement.querySelector('svg');
            if (svgElement) {
                applyDynamicSvgStyles(svgElement, bodyElement.classList.contains('dark-mode'));
                applySvgTextTranslations(svgElement); 
            }
            return { status: 'success', path: filePath };
        } catch (error) {
            console.error(`DEBUG: Network error fetching SVG ${filePath}:`, error);
            placeholderElement.innerHTML = `<p class="error-message">Network error loading SVG: ${filePath.split('/').pop()}</p>`;
            return { status: 'network_error', path: filePath, error: error.message };
        }
    }

    async function fetchTranslations(lang) {
        console.log(`DEBUG: Fetching translations for: ${lang} from lang/${lang}.json`);
        try {
            const response = await fetch(`lang/${lang}.json?v=${new Date().getTime()}`);
            console.log(`DEBUG: Fetch response for lang/${lang}.json status: ${response.status}`);
            if (!response.ok) {
                console.error(`DEBUG: Could not load ${lang}.json. Status: ${response.status} ${response.statusText}`);
                if (lang !== 'en') {
                    console.warn(`DEBUG: Falling back to English translations.`);
                    return fetchTranslations('en');
                }
                translations = {}; // Ensure translations is an empty object on failure
                return {};
            }
            const data = await response.json();
            console.log(`DEBUG: Successfully fetched and parsed translations for ${lang}. Number of keys: ${Object.keys(data).length}`);
            return data;
        } catch (error) {
            console.error(`DEBUG: Error fetching or parsing translations for ${lang}:`, error);
            if (lang !== 'en') {
                console.warn(`DEBUG: Falling back to English translations due to error.`);
                return fetchTranslations('en');
            }
            translations = {}; // Ensure translations is an empty object on failure
            return {};
        }
    }

    function applyTranslationsToPage() {
        if (!translations || Object.keys(translations).length === 0) {
            console.warn("DEBUG: Translations not loaded or empty. Page text might not update correctly.");
            return;
        }
        console.log("DEBUG: Applying translations to page...");
        const docTitleKey = "docTitle";
        if (translations[docTitleKey] !== undefined) document.title = translations[docTitleKey];

        const elements = document.querySelectorAll('[data-translation-key]');
        elements.forEach(el => {
            const key = el.getAttribute('data-translation-key');
            if (translations[key] !== undefined) {
                if (el.tagName === 'LI' && el.querySelector('i') && translations[key].startsWith('<i>')) {
                    el.innerHTML = translations[key];
                } else {
                    el.textContent = translations[key];
                }
            }
        });
        document.querySelectorAll('.svg-placeholder-container svg').forEach(applySvgTextTranslations);
        if (p5LabInstance && typeof p5LabInstance.redraw === 'function' && p5LabInstance.isLooping()) {
             p5LabInstance.redraw();
        }
        console.log("DEBUG: Translations applied.");
    }

    async function switchLanguage(lang) {
        console.log(`DEBUG: switchLanguage called for lang: ${lang}`);
        currentLang = lang;
        localStorage.setItem('preferredLang', lang);
        translations = await fetchTranslations(lang); // This might return {} if fetch fails

        htmlElement.lang = lang;
        htmlElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
        bodyElement.style.fontFamily = lang === 'fa' ? "'Vazirmatn', 'Roboto', sans-serif" : "'Roboto', 'Vazirmatn', sans-serif";
        
        langEnBtn.classList.toggle('active-lang', lang === 'en');
        langFaBtn.classList.toggle('active-lang', lang === 'fa');
        langEnBtn.setAttribute('aria-pressed', (lang === 'en').toString());
        langFaBtn.setAttribute('aria-pressed', (lang === 'fa').toString());
        
        applyTranslationsToPage(); // Apply text based on newly loaded translations
        
        console.log("DEBUG: Before calling updateSvgColors in switchLanguage. Typeof updateSvgColors:", typeof updateSvgColors);
        if (typeof updateSvgColors === 'function') {
            updateSvgColors(); // CORRECTED CALL
        } else {
            console.error("CRITICAL DEBUG: updateSvgColors function is NOT DEFINED when called from switchLanguage!");
        }
        
        const stringTypeToggleBtn = document.getElementById('string-type-toggle');
        if (stringTypeToggleBtn) {
            const isOpen = stringTypeToggleBtn.getAttribute('aria-pressed') === 'true';
            const openKey = stringTypeToggleBtn.getAttribute('data-translation-key-open') || "labToggleOpenActive";
            const closedKey = stringTypeToggleBtn.getAttribute('data-translation-key-closed') || "labToggleOpenDefault";
            stringTypeToggleBtn.textContent = isOpen ? (translations[openKey] || "Switch to Closed Loop") : (translations[closedKey] || "Switch to Open String");
        }
        console.log(`DEBUG: switchLanguage for ${lang} completed.`);
    }

    function toggleDarkMode() {
        console.log("DEBUG: toggleDarkMode called.");
        bodyElement.classList.toggle('dark-mode');
        const isDarkModeEnabled = bodyElement.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkModeEnabled ? 'enabled' : 'disabled');
        mainTitleElement.setAttribute('aria-pressed', isDarkModeEnabled.toString());
        
        console.log("DEBUG: Before calling updateSvgColors in toggleDarkMode. Typeof updateSvgColors:", typeof updateSvgColors);
        if (typeof updateSvgColors === 'function') {
            updateSvgColors(); // CORRECTED CALL
        } else {
            console.error("CRITICAL DEBUG: updateSvgColors function is NOT DEFINED when called from toggleDarkMode!");
        }

        if (p5LabInstance && typeof p5LabInstance.redraw === 'function' && p5LabInstance.isLooping()) {
            p5LabInstance.redraw();
        }
    }

    function applySavedDarkMode() {
        const savedDarkMode = localStorage.getItem('darkMode');
        const isDarkModeEnabled = savedDarkMode === 'enabled';
        if (isDarkModeEnabled) bodyElement.classList.add('dark-mode');
        else bodyElement.classList.remove('dark-mode');
        mainTitleElement.setAttribute('aria-pressed', isDarkModeEnabled.toString());
    }

    function updateSectionDisplay() {
        if (sections.length === 0) {
            console.warn("DEBUG: No sections found to display.");
            return;
        }
        const currentActiveSection = sectionsContainer.querySelector('.content-section.active');
        const newActiveSection = sections[currentSectionIndex];

        if (!newActiveSection) {
            console.error(`DEBUG: New active section at index ${currentSectionIndex} is undefined.`);
            return;
        }

        if (currentActiveSection && currentActiveSection !== newActiveSection) {
            currentActiveSection.classList.add('exiting');
            currentActiveSection.addEventListener('transitionend', function handler(event) {
                if (event.target === this && event.propertyName === 'opacity') { 
                    this.classList.remove('active'); 
                    this.classList.remove('exiting');
                }
                this.removeEventListener('transitionend', handler);
            }, { once: false }); 
        }
        
        sections.forEach(s => { if (s !== newActiveSection && s !== currentActiveSection) s.classList.remove('active');});
        
        newActiveSection.classList.remove('exiting'); 
        newActiveSection.classList.add('active');

        sections.forEach((section, index) => {
            if (section.id === 'interactive-lab' && p5LabInstance) {
                if (index === currentSectionIndex) {
                    if (typeof p5LabInstance.isLooping === 'function' && !p5LabInstance.isLooping()) p5LabInstance.loop();
                    if (typeof p5LabInstance.onSectionActive === 'function') p5LabInstance.onSectionActive();
                } else {
                    if (typeof p5LabInstance.isLooping === 'function' && p5LabInstance.isLooping()) {
                        if (typeof p5LabInstance.onSectionInactive === 'function') p5LabInstance.onSectionInactive();
                        else p5LabInstance.noLoop();
                    }
                }
            }
        });

        const newHeading = newActiveSection.querySelector('h2'); 
        if (newHeading) {
            setTimeout(() => {
                newActiveSection.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                setTimeout(() => newHeading.focus({ preventScroll: false }), sectionTransitionDuration + 50); 
            }, 50); 
        }

        prevBtn.disabled = currentSectionIndex === 0;
        nextBtn.disabled = currentSectionIndex === sections.length - 1;
        prevBtn.setAttribute('aria-disabled', prevBtn.disabled.toString());
        nextBtn.setAttribute('aria-disabled', nextBtn.disabled.toString());
    }

    function initializeTimelineInteraction() {
        const timelineEvents = document.querySelectorAll('.timeline-event');
        timelineEvents.forEach(event => {
            const details = event.querySelector('.timeline-details');
            if (!details) return; 
            event.addEventListener('click', () => {
                const isExpanded = details.classList.toggle('expanded');
                event.setAttribute('aria-expanded', isExpanded.toString());
                details.setAttribute('aria-hidden', (!isExpanded).toString());
            });
            event.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); event.click(); }});
        });
    }

    function initializeGlossaryInteraction() {
        const glossaryTerms = document.querySelectorAll('.glossary-list dt');
        glossaryTerms.forEach(term => {
            term.addEventListener('focus', () => term.classList.add('focused'));
            term.addEventListener('blur', () => term.classList.remove('focused'));
        });
    }
    
    function initializeP5Lab() {
        console.log("DEBUG: Attempting to initialize p5 Lab...");
        if (typeof stringLabSketch === 'function' && document.getElementById('interactive-lab')) {
            console.log("DEBUG: stringLabSketch function found and interactive-lab element exists.");
            try {
                p5LabInstance = new p5(stringLabSketch); 
                console.log("DEBUG: p5 instance created.");

                const modeSlider = document.getElementById('mode-slider');
                const amplitudeSlider = document.getElementById('amplitude-slider');
                const frequencySlider = document.getElementById('frequency-slider');
                const stringTypeToggleBtn = document.getElementById('string-type-toggle');

                function updateP5SketchFromControls() {
                    if (p5LabInstance && typeof p5LabInstance.updateP5Controls === 'function') {
                        const mode = modeSlider ? parseInt(modeSlider.value) : 1;
                        const amp = amplitudeSlider ? parseInt(amplitudeSlider.value) : 50;
                        const freqFactor = frequencySlider ? parseInt(frequencySlider.value) : 3;
                        const isOpen = stringTypeToggleBtn ? stringTypeToggleBtn.getAttribute('aria-pressed') === 'true' : false;
                        p5LabInstance.updateP5Controls(mode, amp, freqFactor, isOpen);
                    } else {
                        console.warn("DEBUG: p5LabInstance or updateP5Controls not available.");
                    }
                }
                if (modeSlider) modeSlider.addEventListener('input', updateP5SketchFromControls);
                if (amplitudeSlider) amplitudeSlider.addEventListener('input', updateP5SketchFromControls);
                if (frequencySlider) frequencySlider.addEventListener('input', updateP5SketchFromControls);
                if (stringTypeToggleBtn) {
                    stringTypeToggleBtn.addEventListener('click', () => {
                        const lang = htmlElement.lang || 'en';
                        const isOpen = stringTypeToggleBtn.getAttribute('aria-pressed') === 'true'; 
                        const openKey = stringTypeToggleBtn.getAttribute('data-translation-key-open') || "labToggleOpenActive";
                        const closedKey = stringTypeToggleBtn.getAttribute('data-translation-key-closed') || "labToggleOpenDefault";
                        stringTypeToggleBtn.textContent = isOpen ? (translations[openKey] || "Switch to Closed Loop") : (translations[closedKey] || "Switch to Open String");
                        updateP5SketchFromControls(); 
                    });
                }
                console.log("DEBUG: p5 Lab controls initialized.");
            } catch (e) {
                console.error("DEBUG: Error initializing p5 sketch instance:", e);
            }
        } else {
            if (typeof stringLabSketch !== 'function') {
                console.error("CRITICAL DEBUG: stringLabSketch is not defined. Ensure p5_sketch.js is loaded BEFORE script.js and defines this function in the global scope.");
            }
            if(!document.getElementById('interactive-lab')){
                console.warn("DEBUG: Interactive lab section ('interactive-lab') not found in HTML.");
            }
        }
    }

    async function initializeApp() {
        console.log("DEBUG: Starting application initialization (initializeApp)...");
        applySavedDarkMode(); 
        
        console.log("DEBUG: Loading SVGs...");
        const svgPlaceholdersMap = {
            'intro-svg': 'svg/intro-visual.svg',
            'problem-svg': 'svg/problem-visual.svg',
            'bigidea-svg': 'svg/bigidea-visual.svg',
            'dimensions-svg': 'svg/dimensions-visual.svg',
            'types-svg': 'svg/types-visual.svg',
            'mtheory-svg': 'svg/mtheory-visual.svg',
            'branes-svg': 'svg/branes-visual.svg',
            'landscape-svg': 'svg/landscape-visual.svg',
            'philosophy-svg': 'svg/philosophy-visual.svg',
            'about-svg': 'svg/about-visual.svg',
            'conclusion-svg': 'svg/conclusion-visual.svg',
            'furtherreading-svg': 'svg/furtherreading-visual.svg'
        };

        const svgLoadPromises = [];
        for (const id in svgPlaceholdersMap) {
            const element = document.getElementById(id); 
            if (element) {
                svgLoadPromises.push(loadSvg(element, svgPlaceholdersMap[id]));
            } else {
                console.warn(`DEBUG: SVG placeholder div with ID '${id}' not found in HTML during initializeApp.`);
            }
        }
        
        try {
            const svgLoadResults = await Promise.all(svgLoadPromises);
            let allSvgsLoadedSuccessfully = true;
            svgLoadResults.forEach(result => {
                if (result && result.status !== 'success') { 
                    allSvgsLoadedSuccessfully = false;
                    console.warn(`DEBUG: SVG loading issue: ${result.status} for ${result.path}${result.code ? ' (Code: ' + result.code + ')' : ''}${result.error ? ' Error: ' + result.error : ''}`);
                }
            });
            if(allSvgsLoadedSuccessfully) console.log("DEBUG: All SVGs loaded successfully (or placeholders not found).");
            else console.warn("DEBUG: Some SVGs failed to load. Check previous logs.");

        } catch (e) {
            console.error("DEBUG: Error during Promise.all for SVG loading:", e);
        }
        console.log("DEBUG: SVG loading process completed (or attempted).");

        console.log("DEBUG: Loading initial language:", currentLang);
        // Ensure updateSvgColors is defined before switchLanguage calls it
        if (typeof updateSvgColors !== 'function') {
            console.error("CRITICAL DEBUG: updateSvgColors is not defined before first call in switchLanguage during init!");
             // Define it here as a fallback, though it should be defined above.
            // This is a defensive measure.
            window.updateSvgColors = function() { console.warn("Fallback updateSvgColors called"); };
        }
        await switchLanguage(currentLang); 
        
        console.log("DEBUG: Initializing UI components...");
        updateSectionDisplay(); 
        initializeTimelineInteraction();
        initializeGlossaryInteraction();
        initializeP5Lab(); 

        // Event Listeners
        if(prevBtn) prevBtn.addEventListener('click', () => { if (currentSectionIndex > 0) { currentSectionIndex--; updateSectionDisplay(); }});
        if(nextBtn) nextBtn.addEventListener('click', () => { if (currentSectionIndex < sections.length - 1) { currentSectionIndex++; updateSectionDisplay(); }});
        if(langEnBtn) langEnBtn.addEventListener('click', () => { if (currentLang !== 'en') switchLanguage('en'); });
        if(langFaBtn) langFaBtn.addEventListener('click', () => { if (currentLang !== 'fa') switchLanguage('fa'); });
        if(mainTitleElement) mainTitleElement.addEventListener('click', toggleDarkMode);
        if(mainTitleElement) mainTitleElement.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDarkMode(); }});

        if(skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const mainContent = document.getElementById('interactive-content');
                const activeSection = mainContent.querySelector('.content-section.active');
                let firstFocusableElement = activeSection ? activeSection.querySelector('h2, h3, button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') : null;
                
                if (firstFocusableElement) {
                    firstFocusableElement.focus();
                } else if (activeSection) { 
                    activeSection.setAttribute('tabindex', '-1'); 
                    activeSection.focus();
                } else { 
                     mainContent.setAttribute('tabindex', '-1');
                     mainContent.focus();
                }
            });
        }
        console.log("DEBUG: Application initialized successfully.");
    }
    
    if (typeof stringLabSketch === 'undefined') {
         console.error("CRITICAL DEBUG: stringLabSketch is not defined BEFORE initializeApp is called. Ensure p5_sketch.js is loaded and executed before script.js, and it defines stringLabSketch in the global scope.");
         const p5Container = document.getElementById('p5-canvas-container');
         if (p5Container) {
            p5Container.innerHTML = `<p class="error-message">Interactive lab could not be loaded. (stringLabSketch not found). Check console.</p>`;
         }
    }

    initializeApp().catch(err => {
        console.error("CRITICAL DEBUG: Unhandled error during initializeApp:", err);
        if (!document.querySelector('body > p.critical-error-message')) {
            const errorMsgElement = document.createElement('p');
            errorMsgElement.className = 'critical-error-message';
            errorMsgElement.style.color = 'red'; errorMsgElement.style.textAlign = 'center';
            errorMsgElement.style.padding = '50px'; errorMsgElement.style.fontSize = '1.2em';
            errorMsgElement.textContent = 'An error occurred while loading the application. Please try refreshing the page. Check the console (F12) for more details. Ensure you are running this on a local server if viewing locally.';
            document.body.innerHTML = ''; 
            document.body.appendChild(errorMsgElement);
        }
    });
});
