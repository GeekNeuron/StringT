// js/script.js
// Version: v25_bigidea_animation

// Main application namespace
window.stringTheoryApp = {};

// console.log("DEBUG: script.js: File execution started (v25_bigidea_animation).");

document.addEventListener('DOMContentLoaded', () => {
    // console.log("DEBUG: DOMContentLoaded event fired.");

    // --- DOM Element Selection ---
    let sectionsContainer, sections = [], prevBtn, nextBtn, langEnBtn, langFaBtn, mainTitleElement, bodyElement, htmlElement, skipLink;

    try {
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
            if (!nextBtn) missing.push("next-btn");
            if (!langEnBtn) missing.push("lang-en");
            if (!langFaBtn) missing.push("lang-fa");
            if (!mainTitleElement) missing.push("main-title");
            console.error(`CRITICAL DEBUG: Essential DOM elements missing: ${missing.join(', ')}. Check HTML IDs and structure.`);
            throw new Error(`Essential DOM elements missing: ${missing.join(', ')}.`);
        }
    } catch (e) {
        console.error("CRITICAL DEBUG: Error selecting DOM elements:", e);
        document.body.innerHTML = `<p class="critical-error-message" style="color:red; text-align:center; padding: 50px; font-size: 1.2em;">Error initializing page (DOM elements missing). Please check console (F12) for details. Error: ${e.message}</p>`;
        return; 
    }

    // --- State Variables ---
    let currentSectionIndex = 0;
    let currentLang = localStorage.getItem('preferredLang') || (navigator.language.startsWith('fa') ? 'fa' : 'en');
    let translations = {};
    let p5LabInstance = null;
    const sectionTransitionDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--section-transition-duration').replace('s', '')) * 1000 || 300;
    let bigIdeaAnimationInterval = null; // For the vibrating string SVG animation

    window.stringTheoryApp.getTranslation = (key, fallbackText = '') => {
        const translated = translations[key];
        if (translated === undefined) {
            return fallbackText || key;
        }
        return translated;
    };
    
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
            if (translations[key] !== undefined) {
                textEl.textContent = translations[key];
            }
        });
    }
    
    function updateSvgColors() { 
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
                placeholderElement.innerHTML = `<p class="error-message" data-translation-key="errorLoadingSVG">Error loading SVG</p><p class="error-details">${filePath.split('/').pop()} (${response.status})</p>`;
                if (translations['errorLoadingSVG']) placeholderElement.querySelector('.error-message').textContent = translations['errorLoadingSVG'];
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
            placeholderElement.innerHTML = `<p class="error-message" data-translation-key="errorNetworkSVG">Network error loading SVG</p><p class="error-details">${filePath.split('/').pop()}</p>`;
            if (translations['errorNetworkSVG']) placeholderElement.querySelector('.error-message').textContent = translations['errorNetworkSVG'];
            return { status: 'network_error', path: filePath, error: error.message };
        }
    }

    async function fetchTranslations(lang) {
        try {
            const response = await fetch(`lang/${lang}.json?v=${new Date().getTime()}`);
            if (!response.ok) {
                if (lang !== 'en') { return fetchTranslations('en'); }
                translations = {}; return {};
            }
            return await response.json();
        } catch (error) {
            if (lang !== 'en') { return fetchTranslations('en'); }
            translations = {}; return {};
        }
    }

    function applyTranslationsToPage() {
        if (!translations || Object.keys(translations).length === 0) { return; }
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
        
        if (typeof updateSvgColors === 'function') { updateSvgColors(); } 
        else { console.error("CRITICAL DEBUG: updateSvgColors function is NOT DEFINED when called from switchLanguage!"); }
        
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
        
        if (typeof updateSvgColors === 'function') { updateSvgColors(); } 
        else { console.error("CRITICAL DEBUG: updateSvgColors function is NOT DEFINED when called from toggleDarkMode!"); }

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

    function manageBigIdeaAnimation(isActive) {
        const svgPlaceholder = document.getElementById('bigidea-svg');
        if (!svgPlaceholder) return;

        const stringMode1 = svgPlaceholder.querySelector('.string-mode1');
        const stringMode2 = svgPlaceholder.querySelector('.string-mode2');

        if (!stringMode1 || !stringMode2) {
            // console.warn("DEBUG: String mode paths not found in bigidea-svg.");
            if (bigIdeaAnimationInterval) clearInterval(bigIdeaAnimationInterval);
            bigIdeaAnimationInterval = null;
            return;
        }

        if (isActive) {
            if (!bigIdeaAnimationInterval) { // Start animation if not already running
                // Ensure one is visible and the other is hidden initially
                stringMode1.style.display = 'block';
                stringMode2.style.display = 'none';
                bigIdeaAnimationInterval = setInterval(() => {
                    if (stringMode1.style.display !== 'none') {
                        stringMode1.style.display = 'none';
                        stringMode2.style.display = 'block';
                    } else {
                        stringMode1.style.display = 'block';
                        stringMode2.style.display = 'none';
                    }
                }, 2000); // Toggle every 2 seconds
            }
        } else {
            if (bigIdeaAnimationInterval) {
                clearInterval(bigIdeaAnimationInterval);
                bigIdeaAnimationInterval = null;
                // Optionally reset to a default state
                // stringMode1.style.display = 'block';
                // stringMode2.style.display = 'none';
            }
        }
    }


    function updateSectionDisplay() {
        if (sections.length === 0) { return; }
        const currentActiveSection = sectionsContainer.querySelector('.content-section.active');
        const newActiveSection = sections[currentSectionIndex];
        if (!newActiveSection) { return; }

        if (currentActiveSection && currentActiveSection !== newActiveSection) {
            currentActiveSection.classList.add('exiting');
            currentActiveSection.addEventListener('transitionend', function handler(event) {
                if (event.target === this && event.propertyName === 'opacity') { 
                    this.classList.remove('active'); 
                    this.classList.remove('exiting');
                    this.style.display = 'none'; 
                }
                this.removeEventListener('transitionend', handler);
            }, { once: false }); 
        }
        
        sections.forEach(s => { 
            if (s !== newActiveSection && !s.classList.contains('exiting')) { 
                s.classList.remove('active');
                s.style.display = 'none';
            }
        });
        
        newActiveSection.classList.remove('exiting'); 
        newActiveSection.style.display = 'block'; 
        void newActiveSection.offsetWidth; 
        newActiveSection.classList.add('active');


        sections.forEach((section, index) => {
            // Manage p5 Lab
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
            // Manage Big Idea SVG Animation
            if (section.id === 'big-idea') {
                manageBigIdeaAnimation(index === currentSectionIndex);
            } else if (index !== currentSectionIndex && section.id === 'big-idea' && bigIdeaAnimationInterval) {
                // Ensure animation stops if another section becomes active and this was the big-idea section
                manageBigIdeaAnimation(false);
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
            const ddId = term.getAttribute('aria-controls');
            const definition = ddId ? document.getElementById(ddId) : null;

            if (!definition) { return; }
            if (!term.hasAttribute('aria-expanded')) term.setAttribute('aria-expanded', 'false');
            if (!definition.hasAttribute('aria-hidden')) definition.setAttribute('aria-hidden', 'true');

            term.addEventListener('click', () => {
                const isExpanded = definition.classList.toggle('expanded');
                term.setAttribute('aria-expanded', isExpanded.toString());
                definition.setAttribute('aria-hidden', (!isExpanded).toString());
            });
            term.addEventListener('keydown', (e) => { 
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault(); 
                    term.click();
                }
            });
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
                        const currentPressedState = stringTypeToggleBtn.getAttribute('aria-pressed') === 'true';
                        stringTypeToggleBtn.setAttribute('aria-pressed', (!currentPressedState).toString());
                        
                        const lang = htmlElement.lang || 'en';
                        const isOpenNewState = !currentPressedState; 
                        const openKey = stringTypeToggleBtn.getAttribute('data-translation-key-open') || "labToggleOpenActive";
                        const closedKey = stringTypeToggleBtn.getAttribute('data-translation-key-closed') || "labToggleOpenDefault";
                        stringTypeToggleBtn.textContent = isOpenNewState ? (translations[openKey] || "Switch to Closed Loop") : (translations[closedKey] || "Switch to Open String");
                        updateP5SketchFromControls(); 
                    });
                }
            } catch (e) {
                console.error("DEBUG: Error initializing p5 sketch instance:", e);
            }
        }
    }

    async function initializeApp() {
        applySavedDarkMode(); 
        
        const svgPlaceholdersMap = {
            'intro-svg': 'svg/intro-visual.svg',
            'problem-svg': 'svg/problem-visual-v2.svg', 
            'bigidea-svg': 'svg/bigidea-visual.svg',
            'dimensions-svg': 'svg/dimensions-visual.svg',
            'types-svg': 'svg/types-visual.svg',
            'mtheory-svg': 'svg/mtheory-visual.svg',
            'branes-svg': 'svg/branes-visual.svg',
            'landscape-svg': 'svg/landscape-visual.svg',
            'philosophy-svg': 'svg/philosophy-visual-v2.svg', 
            'about-svg': 'svg/about-visual.svg',
            'conclusion-svg': 'svg/conclusion-visual.svg',
            'furtherreading-svg': 'svg/furtherreading-visual.svg'
        };

        const svgLoadPromises = [];
        for (const id in svgPlaceholdersMap) {
            const element = document.getElementById(id); 
            if (element) {
                svgLoadPromises.push(loadSvg(element, svgPlaceholdersMap[id]));
            }
        }
        
        try {
            await Promise.all(svgLoadPromises);
        } catch (e) {
            console.error("DEBUG: Error during Promise.all for SVG loading:", e);
        }
        
        await switchLanguage(currentLang); 
        
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
            p5Container.innerHTML = `<p class="error-message" data-translation-key="errorP5Load">Interactive lab could not be loaded. (Sketch not found)</p>`;
            if(translations && translations['errorP5Load']) {
                p5Container.querySelector('.error-message').textContent = translations['errorP5Load'];
            }
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
