// js/script.js

// Main application namespace
window.stringTheoryApp = {};

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
    const sectionsContainer = document.getElementById('interactive-content');
    const sections = document.querySelectorAll('.content-section');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const langEnBtn = document.getElementById('lang-en');
    const langFaBtn = document.getElementById('lang-fa');
    const mainTitleElement = document.getElementById('main-title'); // Renamed to avoid conflict
    const bodyElement = document.body;
    const htmlElement = document.documentElement;
    const skipLink = document.querySelector('.skip-link');

    // --- State Variables ---
    let currentSectionIndex = 0;
    let currentLang = localStorage.getItem('preferredLang') || (navigator.language.startsWith('fa') ? 'fa' : 'en');
    let translations = {}; // To store loaded language strings
    let p5LabInstance = null; // To hold the p5 instance for the lab
    const sectionTransitionDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--section-transition-duration').replace('s', '')) * 1000 || 450;

    // --- Translation Key for p5 sketch ---
    // This allows p5 sketch to request translations
    window.stringTheoryApp.getTranslation = (key, fallbackText = '') => {
        return translations[key] || fallbackText || key;
    };

    // --- SVG Loading Function ---
    async function loadSvg(elementId, filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                console.error(`Failed to load SVG: ${filePath}, Status: ${response.status}`);
                const placeholderDiv = document.getElementById(elementId);
                if(placeholderDiv) placeholderDiv.innerHTML = `<p style="color:red;">Error loading: ${filePath.split('/').pop()}</p>`;
                return;
            }
            const svgText = await response.text();
            const placeholderDiv = document.getElementById(elementId);
            if (placeholderDiv) {
                placeholderDiv.innerHTML = svgText;
                // Re-apply dynamic fills/strokes if SVG is loaded after initial dark mode check
                const isDarkMode = bodyElement.classList.contains('dark-mode');
                const svgElement = placeholderDiv.querySelector('svg');
                if (svgElement) {
                    applyDynamicSvgStyles(svgElement, isDarkMode);
                    applySvgTextTranslations(svgElement); // Translate text within newly loaded SVG
                }
            }
        } catch (error) {
            console.error(`Error fetching SVG ${filePath}:`, error);
            const placeholderDiv = document.getElementById(elementId);
            if(placeholderDiv) placeholderDiv.innerHTML = `<p style="color:red;">Error loading SVG.</p>`;
        }
    }

    function applyDynamicSvgStyles(svgElement, isDarkMode) {
        const dynamicFills = svgElement.querySelectorAll('[data-light-fill][data-dark-fill]');
        dynamicFills.forEach(el => {
            el.setAttribute('fill', isDarkMode ? el.dataset.darkFill : el.dataset.lightFill);
        });
        const dynamicTextFills = svgElement.querySelectorAll('text[data-light-fill][data-dark-fill]');
        dynamicTextFills.forEach(el => {
            el.setAttribute('fill', isDarkMode ? el.dataset.darkFill : el.dataset.lightFill);
        });
         // Handle elements that might only change stroke based on CSS variables (if direct manipulation is needed)
        // For now, relying on CSS variables for .svg-dynamic-stroke, .svg-line, .svg-path etc.
    }
    
    function applySvgTextTranslations(svgElement) {
        const textElements = svgElement.querySelectorAll('text[data-translation-key]');
        textElements.forEach(textEl => {
            const key = textEl.getAttribute('data-translation-key');
            if (translations[key]) {
                textEl.textContent = translations[key];
            }
        });
    }


    // --- Language and Translation Functions ---
    async function fetchTranslations(lang) {
        try {
            const response = await fetch(`lang/${lang}.json`);
            if (!response.ok) {
                console.error(`Could not load ${lang}.json. Status: ${response.status}`);
                // Fallback to English if current lang fails, or handle error appropriately
                if (lang !== 'en') {
                    return fetchTranslations('en'); // Attempt to load English as a fallback
                }
                return {}; // Return empty if English also fails
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching translations for ${lang}:`, error);
            if (lang !== 'en') {
                return fetchTranslations('en');
            }
            return {};
        }
    }

    function applyTranslations() {
        if (!translations) return;

        // Translate document title
        const docTitleKey = "docTitle";
        if (translations[docTitleKey]) {
            document.title = translations[docTitleKey];
        }

        // Translate all elements with data-translation-key
        const elements = document.querySelectorAll('[data-translation-key]');
        elements.forEach(el => {
            const key = el.getAttribute('data-translation-key');
            if (translations[key]) {
                // Handle special cases like list items with <i> tags
                if (el.tagName === 'LI' && el.querySelector('i') && translations[key].startsWith('<i>')) {
                    el.innerHTML = translations[key];
                } else {
                    el.textContent = translations[key];
                }
            } else {
                // console.warn(`Translation key not found: ${key}`);
            }
        });

        // Translate SVG text elements after SVGs are loaded
        document.querySelectorAll('.svg-placeholder-container svg').forEach(svg => {
            applySvgTextTranslations(svg);
        });
        
        // Update p5 sketch instruction text if it's visible and p5 instance exists
        if (p5LabInstance && typeof p5LabInstance.redraw === 'function' && p5LabInstance.isLooping()) {
            p5LabInstance.redraw(); // Redraw to update text
        }
    }

    async function switchLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('preferredLang', lang);
        translations = await fetchTranslations(lang);

        htmlElement.lang = lang;
        htmlElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
        bodyElement.style.fontFamily = lang === 'fa' ? "'Vazirmatn', 'Roboto', sans-serif" : "'Roboto', 'Vazirmatn', sans-serif";

        langEnBtn.classList.toggle('active-lang', lang === 'en');
        langFaBtn.classList.toggle('active-lang', lang === 'fa');
        langEnBtn.setAttribute('aria-pressed', (lang === 'en').toString());
        langFaBtn.setAttribute('aria-pressed', (lang === 'fa').toString());
        
        applyTranslations(); // Apply all text translations
        updateSvgColors(); // Ensure SVG colors are correct for the theme
        
        // Update string type toggle button text specifically
        const stringTypeToggleBtn = document.getElementById('string-type-toggle');
        if (stringTypeToggleBtn) {
            const isOpen = stringTypeToggleBtn.getAttribute('aria-pressed') === 'true';
            const openKey = "labToggleOpenActive"; // Key for "Switch to Closed Loop"
            const closedKey = "labToggleOpenDefault"; // Key for "Switch to Open String"
            stringTypeToggleBtn.textContent = isOpen ? (translations[openKey] || "Switch to Closed Loop") : (translations[closedKey] || "Switch to Open String");
        }
    }

    // --- Dark Mode ---
    function toggleDarkMode() {
        bodyElement.classList.toggle('dark-mode');
        const isDarkModeEnabled = bodyElement.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkModeEnabled ? 'enabled' : 'disabled');
        mainTitleElement.setAttribute('aria-pressed', isDarkModeEnabled.toString());
        updateSvgColors();
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

    // --- Navigation and Section Display ---
    function updateSectionDisplay() {
        const currentActiveSection = sectionsContainer.querySelector('.content-section.active');
        const newActiveSection = sections[currentSectionIndex];

        if (currentActiveSection && currentActiveSection !== newActiveSection) {
            currentActiveSection.classList.add('exiting');
            currentActiveSection.addEventListener('transitionend', function handler(event) {
                if (event.propertyName === 'opacity' && !this.classList.contains('active')) {
                    this.classList.remove('exiting');
                }
                this.removeEventListener('transitionend', handler);
            }, { once: true });
        }
        
        sections.forEach(s => { if (s !== newActiveSection) s.classList.remove('active');});
        newActiveSection.classList.remove('exiting'); 
        newActiveSection.classList.add('active');

        sections.forEach((section, index) => {
            if (section.id === 'interactive-lab' && p5LabInstance) {
                if (index === currentSectionIndex) {
                    if (typeof p5LabInstance.isLooping === 'function' && !p5LabInstance.isLooping()) p5LabInstance.loop();
                    if (typeof p5LabInstance.onSectionActive === 'function') p5LabInstance.onSectionActive();
                } else {
                    if (typeof p5LabInstance.isLooping === 'function' && p5LabInstance.isLooping()) p5LabInstance.onSectionInactive ? p5LabInstance.onSectionInactive() : p5LabInstance.noLoop();
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

    // --- Timeline Interaction ---
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
            event.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); event.click(); } });
        });
    }

    // --- Glossary Interaction ---
    function initializeGlossaryInteraction() {
        const glossaryTerms = document.querySelectorAll('.glossary-list dt');
        glossaryTerms.forEach(term => {
            term.addEventListener('focus', () => term.classList.add('focused'));
            term.addEventListener('blur', () => term.classList.remove('focused'));
        });
    }
    
    // --- p5.js Lab Initialization and Control ---
    function initializeP5Lab() {
        if (typeof stringLabSketch !== 'undefined' && document.getElementById('interactive-lab')) {
            p5LabInstance = new p5(stringLabSketch); // stringLabSketch is defined in p5_sketch.js

            // Setup listeners for sliders and toggle button to update p5 sketch
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
                }
            }

            if (modeSlider) modeSlider.addEventListener('input', updateP5SketchFromControls);
            if (amplitudeSlider) amplitudeSlider.addEventListener('input', updateP5SketchFromControls);
            if (frequencySlider) frequencySlider.addEventListener('input', updateP5SketchFromControls);
            if (stringTypeToggleBtn) {
                stringTypeToggleBtn.addEventListener('click', () => {
                    // The p5 sketch itself handles its internal 'isStringTypeOpen' state
                    // But we might need to call updateP5SketchFromControls if the button directly changes a p5 var
                    // For now, assuming the p5 sketch handles its own toggle state internally based on the button's aria-pressed
                    // and the main language switcher handles the button's text.
                    // We just need to ensure p5 redraws.
                    updateP5SketchFromControls(); // Call to sync and potentially trigger flash
                });
            }
        }
    }


    // --- Initialization ---
    async function initializeApp() {
        applySavedDarkMode(); // Apply dark mode first to avoid FOUC for SVGs
        
        // Load all SVGs
        const svgPlaceholders = [
            { id: 'intro-svg-placeholder', path: 'svg/intro-visual.svg' },
            { id: 'problem-svg-placeholder', path: 'svg/problem-visual.svg' },
            { id: 'bigidea-svg-placeholder', path: 'svg/bigidea-visual.svg' },
            { id: 'dimensions-svg-placeholder', path: 'svg/dimensions-visual.svg' },
            { id: 'types-svg-placeholder', path: 'svg/types-visual.svg' },
            { id: 'mtheory-svg-placeholder', path: 'svg/mtheory-visual.svg' },
            { id: 'branes-svg-placeholder', path: 'svg/branes-visual.svg' },
            { id: 'landscape-svg-placeholder', path: 'svg/landscape-visual.svg' },
            { id: 'philosophy-svg-placeholder', path: 'svg/philosophy-visual.svg' },
            { id: 'about-svg-placeholder', path: 'svg/about-visual.svg' },
            { id: 'conclusion-svg-placeholder', path: 'svg/conclusion-visual.svg' },
            { id: 'furtherreading-svg-placeholder', path: 'svg/furtherreading-visual.svg' }
        ];
        // Filter out placeholders that might not exist if sections were removed
        const existingPlaceholders = svgPlaceholders.filter(p => document.getElementById(p.id));
        await Promise.all(existingPlaceholders.map(p => loadSvg(p.id, p.path)));

        await switchLanguage(currentLang); // Load initial language and apply translations (also updates SVGs)
        
        updateSectionDisplay(); // Set initial active section
        initializeTimelineInteraction();
        initializeGlossaryInteraction();
        initializeP5Lab(); // Initialize p5 lab after translations and SVGs might be ready

        // Event Listeners
        prevBtn.addEventListener('click', () => { if (currentSectionIndex > 0) { currentSectionIndex--; updateSectionDisplay(); }});
        nextBtn.addEventListener('click', () => { if (currentSectionIndex < sections.length - 1) { currentSectionIndex++; updateSectionDisplay(); }});
        langEnBtn.addEventListener('click', () => { if (currentLang !== 'en') switchLanguage('en'); });
        langFaBtn.addEventListener('click', () => { if (currentLang !== 'fa') switchLanguage('fa'); });
        mainTitleElement.addEventListener('click', toggleDarkMode);
        mainTitleElement.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDarkMode(); }});

        if(skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const mainContent = document.getElementById('interactive-content');
                const firstFocusableElement = mainContent.querySelector('.active h2, .active h3, .active button, .active [href], .active input, .active select, .active textarea, .active [tabindex]:not([tabindex="-1"])');
                if (firstFocusableElement) {
                    firstFocusableElement.focus();
                } else { // Fallback to the section itself
                    const activeSection = mainContent.querySelector('.content-section.active');
                    if (activeSection) {
                        activeSection.setAttribute('tabindex', '-1');
                        activeSection.focus();
                    }
                }
            });
        }
    }

    initializeApp();
});
