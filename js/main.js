// js/main.js
// Main Application Orchestrator
// Version: v1_refactor_final

// Ensure the main app namespace exists
window.stringTheoryApp = window.stringTheoryApp || {};

console.log("DEBUG main.js: File execution started.");

document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG main.js: DOMContentLoaded event fired.");

    // --- DOM Element Selection ---
    let sectionsContainer, sections = [], prevBtn, nextBtn, langEnBtn, langFaBtn, mainTitleElement, bodyElement, htmlElement, skipLink;

    try {
        // console.log("DEBUG main.js: Attempting to select DOM elements...");
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
            console.error(`CRITICAL DEBUG main.js: Essential DOM elements missing: ${missing.join(', ')}. Check HTML IDs and structure.`);
            throw new Error(`Essential DOM elements missing: ${missing.join(', ')}.`);
        }
        // console.log("DEBUG main.js: DOM elements selected successfully.");
    } catch (e) {
        console.error("CRITICAL DEBUG main.js: Error selecting DOM elements:", e);
        document.body.innerHTML = `<p class="critical-error-message" style="color:red; text-align:center; padding: 50px; font-size: 1.2em;">Error initializing page (DOM elements missing). Please check console (F12) for details. Error: ${e.message}</p>`;
        return; 
    }

    // --- State Variables (managed by main.js, accessible via namespace) ---
    window.stringTheoryApp.currentSectionIndex = 0;
    window.stringTheoryApp.currentLang = localStorage.getItem('preferredLang') || (navigator.language.startsWith('fa') ? 'fa' : 'en');
    // translations will be populated by i18n module and stored in window.stringTheoryApp.i18n.currentTranslations
    // p5LabInstance will be populated by p5_setup module and stored in window.stringTheoryApp.p5LabInstance

    const sectionTransitionDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--section-transition-duration').replace('s', '')) * 1000 || 300;

    // --- Core Application Logic ---

    function updateSectionDisplay() {
        if (sections.length === 0) { 
            console.warn("DEBUG main.js: No sections found to display.");
            return; 
        }
        const currentActiveSection = sectionsContainer.querySelector('.content-section.active');
        const newActiveSection = sections[window.stringTheoryApp.currentSectionIndex];

        if (!newActiveSection) {
            console.error(`DEBUG main.js: New active section at index ${window.stringTheoryApp.currentSectionIndex} is undefined.`);
            return;
        }

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
        void newActiveSection.offsetWidth; // Force reflow for transition
        newActiveSection.classList.add('active');


        sections.forEach((section, index) => {
            if (section.id === 'interactive-lab' && window.stringTheoryApp.p5LabInstance) {
                if (index === window.stringTheoryApp.currentSectionIndex) {
                    if (typeof window.stringTheoryApp.p5LabInstance.isLooping === 'function' && !window.stringTheoryApp.p5LabInstance.isLooping()) window.stringTheoryApp.p5LabInstance.loop();
                    if (typeof window.stringTheoryApp.p5LabInstance.onSectionActive === 'function') window.stringTheoryApp.p5LabInstance.onSectionActive();
                } else {
                    if (typeof window.stringTheoryApp.p5LabInstance.isLooping === 'function' && window.stringTheoryApp.p5LabInstance.isLooping()) {
                        if (typeof window.stringTheoryApp.p5LabInstance.onSectionInactive === 'function') window.stringTheoryApp.p5LabInstance.onSectionInactive();
                        else window.stringTheoryApp.p5LabInstance.noLoop();
                    }
                }
            }
            if (section.id === 'big-idea' && window.stringTheoryApp.uiInteractions) {
                window.stringTheoryApp.uiInteractions.manageBigIdeaAnimation(index === window.stringTheoryApp.currentSectionIndex, document.getElementById('bigidea-svg'));
            }
        });

        const newHeading = newActiveSection.querySelector('h2'); 
        if (newHeading) {
            setTimeout(() => {
                newActiveSection.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                setTimeout(() => newHeading.focus({ preventScroll: false }), sectionTransitionDuration + 50); 
            }, 50); 
        }

        prevBtn.disabled = window.stringTheoryApp.currentSectionIndex === 0;
        nextBtn.disabled = window.stringTheoryApp.currentSectionIndex === sections.length - 1;
        prevBtn.setAttribute('aria-disabled', prevBtn.disabled.toString());
        nextBtn.setAttribute('aria-disabled', nextBtn.disabled.toString());
    }
    
    function toggleDarkMode() {
        bodyElement.classList.toggle('dark-mode');
        const isDarkModeEnabled = bodyElement.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkModeEnabled ? 'enabled' : 'disabled');
        mainTitleElement.setAttribute('aria-pressed', isDarkModeEnabled.toString());
        
        if (window.stringTheoryApp.svgLoader && typeof window.stringTheoryApp.svgLoader.updateAllSvgColors === 'function') {
            window.stringTheoryApp.svgLoader.updateAllSvgColors(); 
        } else {
            console.error("CRITICAL DEBUG main.js: svgLoader.updateAllSvgColors function is NOT DEFINED!");
        }

        if (window.stringTheoryApp.p5LabInstance && typeof window.stringTheoryApp.p5LabInstance.redraw === 'function' && window.stringTheoryApp.p5LabInstance.isLooping()) {
            window.stringTheoryApp.p5LabInstance.redraw();
        }
    }

    function applySavedDarkMode() {
        const savedDarkMode = localStorage.getItem('darkMode');
        const isDarkModeEnabled = savedDarkMode === 'enabled';
        if (isDarkModeEnabled) bodyElement.classList.add('dark-mode');
        else bodyElement.classList.remove('dark-mode');
        mainTitleElement.setAttribute('aria-pressed', isDarkModeEnabled.toString());
    }

    // --- Initialization ---
    async function initializeApp() {
        console.log("DEBUG main.js: Starting application initialization (initializeApp)...");
        
        // Check if all modules are loaded and their expected functions exist
        if (!window.stringTheoryApp.i18n || typeof window.stringTheoryApp.i18n.switchLanguage !== 'function') {
            console.error("CRITICAL DEBUG main.js: i18n.js module or switchLanguage function not loaded!"); throw new Error("i18n module/function missing.");
        }
        if (!window.stringTheoryApp.svgLoader || typeof window.stringTheoryApp.svgLoader.loadAllSvgs !== 'function') {
            console.error("CRITICAL DEBUG main.js: svg_loader.js module or loadAllSvgs function not loaded!"); throw new Error("svgLoader module/function missing.");
        }
        if (!window.stringTheoryApp.uiInteractions || typeof window.stringTheoryApp.uiInteractions.initializeTimelineInteraction !== 'function') {
            console.error("CRITICAL DEBUG main.js: ui_interactions.js module or initializeTimelineInteraction function not loaded!"); throw new Error("uiInteractions module/function missing.");
        }
        if (!window.stringTheoryApp.initializeP5Lab || typeof window.stringTheoryApp.initializeP5Lab !== 'function') { 
            console.error("CRITICAL DEBUG main.js: p5_setup.js module or initializeP5Lab function not loaded!"); throw new Error("p5_setup module/function missing.");
        }

        applySavedDarkMode(); 
        
        // console.log("DEBUG main.js: Loading SVGs...");
        const svgPlaceholdersMap = {
            'intro-svg': 'svg/intro-visual.svg',
            'problem-svg': 'svg/problem-visual-v2.svg', 
            'bigidea-svg': 'svg/bigidea-visual.svg',
            'dimensions-svg': 'svg/dimensions-visual.svg',
            'types-svg': 'svg/types-visual.svg',
            'mtheory-svg': 'svg/mtheory-visual.svg',
            'branes-svg': 'svg/branes-visual.svg',
            'exotic-svg': 'svg/exotic-spacetime-visual.svg', 
            'landscape-svg': 'svg/landscape-visual.svg',
            'philosophy-svg': 'svg/philosophy-visual-v2.svg', 
            'about-svg': 'svg/about-visual.svg',
            'conclusion-svg': 'svg/conclusion-visual.svg',
            'furtherreading-svg': 'svg/furtherreading-visual.svg'
        };
        await window.stringTheoryApp.svgLoader.loadAllSvgs(svgPlaceholdersMap);
        
        // console.log("DEBUG main.js: Loading initial language:", window.stringTheoryApp.currentLang);
        await window.stringTheoryApp.i18n.switchLanguage(window.stringTheoryApp.currentLang, {en: langEnBtn, fa: langFaBtn}, htmlElement, bodyElement); 
        
        // console.log("DEBUG main.js: Initializing UI components...");
        updateSectionDisplay(); 
        window.stringTheoryApp.uiInteractions.initializeTimelineInteraction();
        window.stringTheoryApp.uiInteractions.initializeGlossaryInteraction(); 
        window.stringTheoryApp.p5LabInstance = window.stringTheoryApp.initializeP5Lab(); 
        if(window.stringTheoryApp.uiInteractions.initializeSkipLink) window.stringTheoryApp.uiInteractions.initializeSkipLink();


        // Event Listeners
        if(prevBtn) prevBtn.addEventListener('click', () => { if (window.stringTheoryApp.currentSectionIndex > 0) { window.stringTheoryApp.currentSectionIndex--; updateSectionDisplay(); }});
        if(nextBtn) nextBtn.addEventListener('click', () => { if (window.stringTheoryApp.currentSectionIndex < sections.length - 1) { window.stringTheoryApp.currentSectionIndex++; updateSectionDisplay(); }});
        
        if(langEnBtn) langEnBtn.addEventListener('click', () => { 
            if (window.stringTheoryApp.currentLang !== 'en') {
                window.stringTheoryApp.i18n.switchLanguage('en', {en: langEnBtn, fa: langFaBtn}, htmlElement, bodyElement);
                // window.stringTheoryApp.currentLang = 'en'; // Already set inside i18n.switchLanguage
            }
        });
        if(langFaBtn) langFaBtn.addEventListener('click', () => { 
            if (window.stringTheoryApp.currentLang !== 'fa') {
                window.stringTheoryApp.i18n.switchLanguage('fa', {en: langEnBtn, fa: langFaBtn}, htmlElement, bodyElement);
                // window.stringTheoryApp.currentLang = 'fa'; // Already set inside i18n.switchLanguage
            }
        });

        if(mainTitleElement) mainTitleElement.addEventListener('click', toggleDarkMode);
        if(mainTitleElement) mainTitleElement.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDarkMode(); }});

        console.log("DEBUG main.js: Application initialized successfully.");
    }
    
    initializeApp().catch(err => {
        console.error("CRITICAL DEBUG main.js: Unhandled error during initializeApp:", err);
        if (!document.querySelector('body > p.critical-error-message')) {
            const errorMsgElement = document.createElement('p');
            errorMsgElement.className = 'critical-error-message';
            errorMsgElement.style.color = 'red'; errorMsgElement.style.textAlign = 'center';
            errorMsgElement.style.padding = '50px'; errorMsgElement.style.fontSize = '1.2em';
            errorMsgElement.textContent = `An error occurred while loading the application: ${err.message}. Please try refreshing the page. Check the console (F12) for more details. Ensure you are running this on a local server if viewing locally.`;
            document.body.innerHTML = ''; 
            document.body.appendChild(errorMsgElement);
        }
    });
});
