// Main application namespace
window.stringTheoryApp = {};

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
    const sectionsContainer = document.getElementById('interactive-content');
    const sections = Array.from(document.querySelectorAll('.content-section'));
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const langEnBtn = document.getElementById('lang-en');
    const langFaBtn = document.getElementById('lang-fa');
    const mainTitleElement = document.getElementById('main-title');
    const bodyElement = document.body;
    const htmlElement = document.documentElement;
    const skipLink = document.querySelector('.skip-link');

    // --- State Variables ---
    let currentSectionIndex = 0;
    let currentLang = localStorage.getItem('preferredLang') || (navigator.language.startsWith('fa') ? 'fa' : 'en');
    let translations = {};
    let p5LabInstance = null;
    const sectionTransitionDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--section-transition-duration').replace('s', '')) * 1000 || 450;

    window.stringTheoryApp.getTranslation = (key, fallbackText = '') => {
        return translations[key] || fallbackText || key;
    };

    // --- SVG Loading Function (More Resilient) ---
    async function loadSvg(placeholderElement, filePath) {
        if (!placeholderElement) {
            console.warn(`SVG placeholder element not found for path: ${filePath}`);
            return { status: 'placeholder_not_found', path: filePath };
        }
        try {
            const response = await fetch(filePath + `?v=${new Date().getTime()}`); // Cache busting
            if (!response.ok) {
                console.error(`Failed to load SVG: ${filePath}, Status: ${response.status}`);
                placeholderElement.innerHTML = `<p class="error-message">Error loading: ${filePath.split('/').pop()} (${response.status})</p>`;
                return { status: 'fetch_error', path: filePath, code: response.status };
            }
            const svgText = await response.text();
            placeholderElement.innerHTML = svgText;
            const svgElement = placeholderElement.querySelector('svg');
            if (svgElement) {
                applyDynamicSvgStyles(svgElement, bodyElement.classList.contains('dark-mode'));
                applySvgTextTranslations(svgElement); // Translate text within newly loaded SVG
            }
            return { status: 'success', path: filePath };
        } catch (error) {
            console.error(`Error fetching SVG ${filePath}:`, error);
            placeholderElement.innerHTML = `<p class="error-message">Network error loading SVG: ${filePath.split('/').pop()}</p>`;
            return { status: 'network_error', path: filePath, error: error.message };
        }
    }

    function applyDynamicSvgStyles(svgElement, isDarkMode) {
        const dynamicFills = svgElement.querySelectorAll('[data-light-fill][data-dark-fill]');
        dynamicFills.forEach(el => el.setAttribute('fill', isDarkMode ? el.dataset.darkFill : el.dataset.lightFill));
        const dynamicTextFills = svgElement.querySelectorAll('text[data-light-fill][data-dark-fill]');
        dynamicTextFills.forEach(el => el.setAttribute('fill', isDarkMode ? el.dataset.darkFill : el.dataset.lightFill));
    }
    
    function applySvgTextTranslations(svgElement) {
        const textElements = svgElement.querySelectorAll('text[data-translation-key]');
        textElements.forEach(textEl => {
            const key = textEl.getAttribute('data-translation-key');
            if (translations[key]) {
                textEl.textContent = translations[key];
            } else {
                // console.warn(`SVG Text translation key not found: ${key}`);
            }
        });
    }

    async function fetchTranslations(lang) {
        try {
            const response = await fetch(`lang/${lang}.json?v=${new Date().getTime()}`);
            if (!response.ok) {
                console.error(`Could not load ${lang}.json. Status: ${response.status}`);
                if (lang !== 'en') {
                    console.warn(`Falling back to English translations.`);
                    return fetchTranslations('en');
                }
                return {};
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching translations for ${lang}:`, error);
            if (lang !== 'en') {
                console.warn(`Falling back to English translations due to error.`);
                return fetchTranslations('en');
            }
            return {};
        }
    }

    function applyTranslationsToPage() {
        if (!translations || Object.keys(translations).length === 0) {
            console.warn("Translations not loaded or empty. Page text might not update.");
            return;
        }
        const docTitleKey = "docTitle";
        if (translations[docTitleKey]) document.title = translations[docTitleKey];

        const elements = document.querySelectorAll('[data-translation-key]');
        elements.forEach(el => {
            const key = el.getAttribute('data-translation-key');
            if (translations[key] !== undefined) { // Check if key exists
                if (el.tagName === 'LI' && el.querySelector('i') && translations[key].startsWith('<i>')) {
                    el.innerHTML = translations[key];
                } else {
                    el.textContent = translations[key];
                }
            } else {
                // console.warn(`Translation key not found in JSON: ${key} for element:`, el);
            }
        });
        document.querySelectorAll('.svg-placeholder-container svg').forEach(applySvgTextTranslations);
        if (p5LabInstance && typeof p5LabInstance.redraw === 'function' && p5LabInstance.isLooping()) {
             p5LabInstance.redraw();
        }
    }

    async function switchLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('preferredLang', lang);
        console.log(`Attempting to load translations for: ${lang}`);
        translations = await fetchTranslations(lang);
        console.log(`Translations for ${lang} loaded:`, Object.keys(translations).length > 0);

        htmlElement.lang = lang;
        htmlElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
        bodyElement.style.fontFamily = lang === 'fa' ? "'Vazirmatn', 'Roboto', sans-serif" : "'Roboto', 'Vazirmatn', sans-serif";
        
        langEnBtn.classList.toggle('active-lang', lang === 'en');
        langFaBtn.classList.toggle('active-lang', lang === 'fa');
        langEnBtn.setAttribute('aria-pressed', (lang === 'en').toString());
        langFaBtn.setAttribute('aria-pressed', (lang === 'fa').toString());
        
        applyTranslationsToPage();
        updateSvgColors();
        
        const stringTypeToggleBtn = document.getElementById('string-type-toggle');
        if (stringTypeToggleBtn) {
            const isOpen = stringTypeToggleBtn.getAttribute('aria-pressed') === 'true';
            const openKey = stringTypeToggleBtn.getAttribute('data-translation-key-open') || "labToggleOpenActive";
            const closedKey = stringTypeToggleBtn.getAttribute('data-translation-key-closed') || "labToggleOpenDefault";
            stringTypeToggleBtn.textContent = isOpen ? (translations[openKey] || "Switch to Closed Loop") : (translations[closedKey] || "Switch to Open String");
        }
    }

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

    function updateSectionDisplay() {
        const currentActiveSection = sectionsContainer.querySelector('.content-section.active');
        const newActiveSection = sections[currentSectionIndex];

        if (currentActiveSection && currentActiveSection !== newActiveSection) {
            currentActiveSection.classList.add('exiting');
            // Remove 'active' after the transition to allow smooth exit animation
            // The 'transitionend' listener will clean up 'exiting'
            currentActiveSection.addEventListener('transitionend', function handler(event) {
                if (event.target === this && event.propertyName === 'opacity') {
                    this.classList.remove('active'); 
                }
                // No need to remove listener if once: true, but if not, manage it.
                // For simplicity, let's assume this is fine or add more robust listener management if needed.
            }, { once: true }); 
        }
        
        // Ensure no other sections are active before activating the new one
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
        if (typeof stringLabSketch === 'function' && document.getElementById('interactive-lab')) {
            try {
                p5LabInstance = new p5(stringLabSketch); 

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
                        // The button's aria-pressed state is already toggled by its own click.
                        // Then we update its text based on the new state and current language.
                        const lang = htmlElement.lang || 'en';
                        const isOpen = stringTypeToggleBtn.getAttribute('aria-pressed') === 'true';
                        const openKey = stringTypeToggleBtn.getAttribute('data-translation-key-open') || "labToggleOpenActive";
                        const closedKey = stringTypeToggleBtn.getAttribute('data-translation-key-closed') || "labToggleOpenDefault";
                        stringTypeToggleBtn.textContent = isOpen ? (translations[openKey] || "Switch to Closed Loop") : (translations[closedKey] || "Switch to Open String");
                        updateP5SketchFromControls(); 
                    });
                }
            } catch (e) {
                console.error("Error initializing p5 sketch:", e);
            }
        } else {
            if (typeof stringLabSketch !== 'function') {
                console.error("p5_sketch.js might not have loaded correctly or stringLabSketch is not defined.");
            }
        }
    }

    async function initializeApp() {
        applySavedDarkMode(); 
        
        console.log("Initializing app, loading SVGs...");
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
            const element = document.getElementById(id); // Get placeholder div by its ID
            if (element) {
                svgLoadPromises.push(loadSvg(element, svgPlaceholdersMap[id]));
            } else {
                console.warn(`SVG placeholder div with ID '${id}' not found in HTML.`);
            }
        }
        
        const svgLoadResults = await Promise.all(svgLoadPromises);
        svgLoadResults.forEach(result => {
            if (result.status !== 'success') {
                console.warn(`SVG loading issue: ${result.status} for ${result.path}${result.code ? ' (Code: ' + result.code + ')' : ''}${result.error ? ' Error: ' + result.error : ''}`);
            }
        });
        console.log("SVG loading process completed.");

        console.log("Loading initial language:", currentLang);
        await switchLanguage(currentLang); 
        
        updateSectionDisplay(); 
        initializeTimelineInteraction();
        initializeGlossaryInteraction();
        initializeP5Lab(); 

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
        console.log("Application initialized successfully.");
    }

    initializeApp().catch(err => {
        console.error("CRITICAL: Failed to initialize the application:", err);
        document.body.innerHTML = `<p style="color:red; text-align:center; padding: 50px; font-size: 1.2em;">An error occurred while loading the application. Please try refreshing the page. Check the console (F12) for more details.</p>`;
    });
});
