// js/script.js

// Main application namespace
window.stringTheoryApp = {};

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
    const sectionsContainer = document.getElementById('interactive-content');
    const sections = Array.from(document.querySelectorAll('.content-section')); // Convert NodeList to Array
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

    async function loadSvg(placeholderElement, filePath) {
        if (!placeholderElement) {
            // console.warn(`SVG placeholder not found for path: ${filePath}`);
            return;
        }
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                console.error(`Failed to load SVG: ${filePath}, Status: ${response.status}`);
                placeholderElement.innerHTML = `<p class="error-message">Error loading: ${filePath.split('/').pop()}</p>`;
                return;
            }
            const svgText = await response.text();
            placeholderElement.innerHTML = svgText;
            const svgElement = placeholderElement.querySelector('svg');
            if (svgElement) {
                applyDynamicSvgStyles(svgElement, bodyElement.classList.contains('dark-mode'));
                applySvgTextTranslations(svgElement);
            }
        } catch (error) {
            console.error(`Error fetching SVG ${filePath}:`, error);
            placeholderElement.innerHTML = `<p class="error-message">Error loading SVG.</p>`;
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
            }
        });
    }

    async function fetchTranslations(lang) {
        try {
            const response = await fetch(`lang/${lang}.json?v=${new Date().getTime()}`); // Cache busting
            if (!response.ok) {
                console.error(`Could not load ${lang}.json. Status: ${response.status}`);
                if (lang !== 'en') return fetchTranslations('en');
                return {};
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching translations for ${lang}:`, error);
            if (lang !== 'en') return fetchTranslations('en');
            return {};
        }
    }

    function applyTranslationsToPage() {
        if (!translations || Object.keys(translations).length === 0) {
            console.warn("Translations not loaded or empty.");
            return;
        }
        const docTitleKey = "docTitle";
        if (translations[docTitleKey]) document.title = translations[docTitleKey];

        const elements = document.querySelectorAll('[data-translation-key]');
        elements.forEach(el => {
            const key = el.getAttribute('data-translation-key');
            if (translations[key]) {
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
        applyTranslationsToPage();
        updateSvgColors();
        
        const stringTypeToggleBtn = document.getElementById('string-type-toggle');
        if (stringTypeToggleBtn) {
            const isOpen = stringTypeToggleBtn.getAttribute('aria-pressed') === 'true';
            const openKey = "labToggleOpenActive"; 
            const closedKey = "labToggleOpenDefault"; 
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
            currentActiveSection.addEventListener('transitionend', function handler(event) {
                if (event.target === this && event.propertyName === 'opacity') { 
                    this.classList.remove('active'); // Only remove active after transition
                    this.classList.remove('exiting');
                }
                this.removeEventListener('transitionend', handler);
            }, { once: false }); // Listen until opacity transition ends
        }
        
        sections.forEach(s => { if (s !== newActiveSection && s !== currentActiveSection) s.classList.remove('active');}); // Clear others
        
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
                // newActiveSection.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                // Focusing should also scroll if the element is off-screen.
                newHeading.focus(); // { preventScroll: false } is default
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
        if (typeof stringLabSketch !== 'undefined' && document.getElementById('interactive-lab')) {
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
                    // The p5 sketch will use aria-pressed directly.
                    // We need to update the button's text based on the new state and current language.
                    const lang = htmlElement.lang || 'en';
                    const isOpen = stringTypeToggleBtn.getAttribute('aria-pressed') === 'true'; // This is after toggle
                    const openText = translations[stringTypeToggleBtn.getAttribute('data-translation-key-open')] || "Switch to Closed Loop";
                    const closedText = translations[stringTypeToggleBtn.getAttribute('data-translation-key-closed')] || "Switch to Open String";
                    stringTypeToggleBtn.textContent = isOpen ? openText : closedText;
                    updateP5SketchFromControls(); 
                });
            }
        }
    }

    async function initializeApp() {
        applySavedDarkMode(); 
        
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
                // console.warn(`SVG placeholder with ID '${id}' not found in HTML.`);
            }
        }
        await Promise.all(svgLoadPromises);

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
                } else if (activeSection) { // Fallback to the section itself if no interactive elements
                    activeSection.setAttribute('tabindex', '-1'); // Make it focusable
                    activeSection.focus();
                } else { // Ultimate fallback
                     mainContent.setAttribute('tabindex', '-1');
                     mainContent.focus();
                }
            });
        }
    }

    initializeApp().catch(err => {
        console.error("Failed to initialize the application:", err);
        // Display a user-friendly error message on the page if critical initialization fails
        document.body.innerHTML = '<p style="color:red; text-align:center; padding-top: 50px;">An error occurred while loading the application. Please try refreshing the page or check the console for details.</p>';
    });
});
