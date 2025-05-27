document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
    const sectionsContainer = document.getElementById('interactive-content');
    const sections = document.querySelectorAll('.content-section');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const langEnBtn = document.getElementById('lang-en');
    const langFaBtn = document.getElementById('lang-fa');
    const mainTitle = document.getElementById('main-title');
    const bodyElement = document.body;
    const htmlElement = document.documentElement;

    // --- State Variables ---
    let currentSectionIndex = 0;
    let preferredLang = localStorage.getItem('preferredLang') || (navigator.language.startsWith('fa') ? 'fa' : 'en');
    let currentLang = preferredLang;
    let p5Instance = null; 
    const sectionTransitionDuration = 500; // ms, should match CSS var(--section-transition-duration)

    // --- Functions ---

    function updateSectionDisplay() {
        const currentActiveSection = sectionsContainer.querySelector('.content-section.active');
        const newActiveSection = sections[currentSectionIndex];

        if (currentActiveSection && currentActiveSection !== newActiveSection) {
            currentActiveSection.classList.add('exiting');
            currentActiveSection.classList.remove('active');
            // Wait for exit animation to complete before making the new one active
            // This can be tricky with CSS transitions alone for visibility.
            // A simple timeout can work, or more complex event listeners.
            setTimeout(() => {
                currentActiveSection.classList.remove('exiting');
            }, sectionTransitionDuration);
        }
        
        newActiveSection.classList.remove('exiting'); // Ensure it's not stuck in exiting state
        newActiveSection.classList.add('active');

        // Manage p5.js lab loop
        sections.forEach((section, index) => {
            if (section.id === 'interactive-lab' && p5Instance) {
                if (index === currentSectionIndex) {
                    if (!p5Instance.isLooping()) p5Instance.loop();
                    if (typeof p5Instance.onSectionActive === 'function') {
                        p5Instance.onSectionActive();
                    }
                } else {
                    if (p5Instance.isLooping()) p5Instance.noLoop();
                }
            }
        });

        // Set focus to the new section's heading for accessibility
        const newHeading = newActiveSection.querySelector('h2, h3'); // Try h2 first, then h3
        if (newHeading) {
            newHeading.focus();
        }


        prevBtn.disabled = currentSectionIndex === 0;
        nextBtn.disabled = currentSectionIndex === sections.length - 1;
        prevBtn.setAttribute('aria-disabled', prevBtn.disabled.toString());
        nextBtn.setAttribute('aria-disabled', nextBtn.disabled.toString());

        // Static string animation placeholder (if used)
        const stringMode1 = document.querySelector('#string-animation-placeholder .string-mode1');
        const stringMode2 = document.querySelector('#string-animation-placeholder .string-mode2');
        if (stringMode1 && stringMode2) {
            if (newActiveSection.id === 'big-idea') {
                stringMode1.style.display = 'block'; 
                stringMode2.style.display = 'none';
            }
        }
    }
    
    function updateSvgColors() {
        const isDarkMode = bodyElement.classList.contains('dark-mode');
        const svgs = document.querySelectorAll('.svg-container svg');

        svgs.forEach(svg => {
            const dynamicFills = svg.querySelectorAll('[data-light-fill][data-dark-fill]');
            dynamicFills.forEach(el => {
                el.setAttribute('fill', isDarkMode ? el.dataset.darkFill : el.dataset.lightFill);
            });
            const dynamicTextFills = svg.querySelectorAll('text[data-light-fill][data-dark-fill]');
             dynamicTextFills.forEach(el => {
                el.setAttribute('fill', isDarkMode ? el.dataset.darkFill : el.dataset.lightFill);
            });
        });
    }

    function switchLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('preferredLang', lang); 

        htmlElement.lang = lang;
        htmlElement.dir = lang === 'fa' ? 'rtl' : 'ltr';

        if (lang === 'fa') {
            bodyElement.style.fontFamily = "'Vazirmatn', 'Roboto', sans-serif";
        } else {
            bodyElement.style.fontFamily = "'Roboto', 'Vazirmatn', sans-serif";
        }
        
        langEnBtn.classList.toggle('active-lang', lang === 'en');
        langFaBtn.classList.toggle('active-lang', lang === 'fa');
        langEnBtn.setAttribute('aria-pressed', (lang === 'en').toString());
        langFaBtn.setAttribute('aria-pressed', (lang === 'fa').toString());

        const elementsToTranslate = document.querySelectorAll('[data-en],[data-fa]');
        elementsToTranslate.forEach(el => {
            const textKey = `data-${lang}`;
            if (el.hasAttribute(textKey)) {
                const text = el.getAttribute(textKey);
                if (el.tagName === 'LABEL' && el.closest('.slider-control')) {
                     el.textContent = text;
                } else if (el.tagName === 'text' && el.closest('svg')) {
                    el.textContent = text;
                } else if (el.tagName === 'TITLE' || el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'P' || el.tagName === 'BUTTON' || el.classList.contains('visual-placeholder') || el.classList.contains('dark-mode-hint') || el.tagName === 'LI' || el.tagName === 'I' || el.tagName === 'SPAN' && el.closest('.visual-placeholder')) {
                     if (el.tagName === 'LI' && el.querySelector('i') && el.getAttribute(textKey).startsWith('<i>')) {
                        el.innerHTML = text;
                    } else if(el.tagName === 'I' || (el.tagName === 'SPAN' && el.closest('.visual-placeholder'))){
                         el.textContent = text;
                    }
                    else {
                        el.textContent = text;
                    }
                }
            }
        });
        const titleElement = document.querySelector('title');
        if (titleElement) {
            titleElement.textContent = titleElement.getAttribute(`data-${lang}`);
        }
        updateSvgColors(); 
    }

    function toggleDarkMode() {
        bodyElement.classList.toggle('dark-mode');
        const isDarkModeEnabled = bodyElement.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkModeEnabled ? 'enabled' : 'disabled');
        mainTitle.setAttribute('aria-pressed', isDarkModeEnabled.toString());
        updateSvgColors(); 
        if (p5Instance && typeof p5Instance.redraw === 'function') { 
            p5Instance.redraw(); // Redraw p5 sketch if it's currently looping or needs an update
        }
    }

    function applySavedDarkMode() {
        const savedDarkMode = localStorage.getItem('darkMode');
        const isDarkModeEnabled = savedDarkMode === 'enabled';
        if (isDarkModeEnabled) {
            bodyElement.classList.add('dark-mode');
        } else {
            bodyElement.classList.remove('dark-mode');
        }
        mainTitle.setAttribute('aria-pressed', isDarkModeEnabled.toString());
    }

    // --- Event Listeners ---
    prevBtn.addEventListener('click', () => {
        if (currentSectionIndex > 0) {
            currentSectionIndex--;
            updateSectionDisplay();
            // window.scrollTo(0, 0); // Scroll handled by focus on heading
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentSectionIndex < sections.length - 1) {
            currentSectionIndex++;
            updateSectionDisplay();
            // window.scrollTo(0, 0); // Scroll handled by focus on heading
        }
    });

    langEnBtn.addEventListener('click', () => { if (currentLang !== 'en') switchLanguage('en'); });
    langFaBtn.addEventListener('click', () => { if (currentLang !== 'fa') switchLanguage('fa'); });
    mainTitle.addEventListener('click', toggleDarkMode);
    mainTitle.addEventListener('keydown', (e) => { // Allow toggle with Enter/Space
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleDarkMode();
        }
    });


    // --- p5.js Interactive String Lab Sketch (Instance Mode) ---
    const stringLabSketch = (p) => {
        let currentVibrationMode = 1;
        let currentAmplitude = 50;
        let currentFrequencyFactor = 3; 
        let baseFrequency = 0.01; 
        let phase = 0;
        let isStringTypeOpen = false; // false for closed loop, true for open string
        
        let modeSlider, amplitudeSlider, frequencySlider, stringTypeToggleBtn;
        let modeValueDisplay, amplitudeValueDisplay, frequencyValueDisplay;

        let stringColor, glowColor; 
        let lastAmplitude = 50; 
        let lastMode = 1;
        let flashDuration = 0; 
        const flashMaxDuration = 20; // Increased duration for more noticeable flash
        let tempStringColor = null; // For flash color change

        p.setup = () => {
            const canvasContainer = document.getElementById('p5-canvas-container');
            if (!canvasContainer) { console.error("p5 canvas container not found"); return; }

            let canvasWidth = canvasContainer.offsetWidth > 20 ? canvasContainer.offsetWidth - 20 : 300;
            canvasWidth = Math.min(canvasWidth, 600);
            let canvasHeight = 300;

            const canvas = p.createCanvas(canvasWidth, canvasHeight);
            canvas.parent('p5-canvas-container');
            p.pixelDensity(1); 

            modeSlider = document.getElementById('mode-slider');
            amplitudeSlider = document.getElementById('amplitude-slider');
            frequencySlider = document.getElementById('frequency-slider');
            stringTypeToggleBtn = document.getElementById('string-type-toggle');

            modeValueDisplay = document.getElementById('mode-value');
            amplitudeValueDisplay = document.getElementById('amplitude-value');
            frequencyValueDisplay = document.getElementById('frequency-value');
            
            const updateValuesAndFlash = (paramChanged = null) => {
                let modeChanged = false;
                let amplitudeChanged = false;

                const newMode = parseInt(modeSlider.value);
                if (newMode !== lastMode) {
                    modeChanged = true;
                    lastMode = newMode;
                }
                currentVibrationMode = newMode;

                const newAmplitude = parseInt(amplitudeSlider.value);
                 if (newAmplitude !== lastAmplitude) {
                    amplitudeChanged = true;
                    lastAmplitude = newAmplitude;
                }
                currentAmplitude = newAmplitude;
                
                currentFrequencyFactor = parseInt(frequencySlider.value);

                if (modeValueDisplay) modeValueDisplay.textContent = currentVibrationMode;
                if (amplitudeValueDisplay) amplitudeValueDisplay.textContent = currentAmplitude;
                if (frequencyValueDisplay) frequencyValueDisplay.textContent = (baseFrequency * currentFrequencyFactor).toFixed(3);
                
                if (paramChanged === 'mode' || paramChanged === 'amplitude' || modeChanged || amplitudeChanged) {
                    flashDuration = flashMaxDuration; 
                    tempStringColor = bodyElement.classList.contains('dark-mode') ? '#FFFFFF' : '#000000'; // Flash white/black
                }
                if (!p.isLooping()) p.loop(); 
            };

            if (modeSlider) modeSlider.addEventListener('input', () => updateValuesAndFlash('mode'));
            if (amplitudeSlider) amplitudeSlider.addEventListener('input', () => updateValuesAndFlash('amplitude'));
            if (frequencySlider) frequencySlider.addEventListener('input', () => updateValuesAndFlash('frequency'));
            
            if (stringTypeToggleBtn) {
                stringTypeToggleBtn.addEventListener('click', () => {
                    isStringTypeOpen = !isStringTypeOpen;
                    stringTypeToggleBtn.setAttribute('aria-pressed', isStringTypeOpen.toString());
                    // Update button text based on new state and current language
                    const lang = htmlElement.lang || 'en';
                    const openText = stringTypeToggleBtn.dataset[lang === 'en' ? 'enOpen' : 'faOpen'] || (lang === 'en' ? "Switch to Closed Loop" : "تغییر به حلقه بسته");
                    const closedText = stringTypeToggleBtn.dataset[lang === 'en' ? 'enClosed' : 'faClosed'] || (lang === 'en' ? "Switch to Open String" : "تغییر به ریسمان باز");
                    stringTypeToggleBtn.textContent = isStringTypeOpen ? openText : closedText;
                    
                    // Add data attributes to the button in HTML for these texts:
                    // data-en-open="Switch to Closed Loop" data-fa-open="تغییر به حلقه بسته"
                    // data-en-closed="Switch to Open String" data-fa-closed="تغییر به ریسمان باز"
                    // And update switchLanguage to handle these too.
                    // For now, simple text update:
                    if (lang === 'en') {
                        stringTypeToggleBtn.textContent = isStringTypeOpen ? "Switch to Closed Loop" : "Switch to Open String";
                    } else {
                        stringTypeToggleBtn.textContent = isStringTypeOpen ? "تغییر به حلقه بسته" : "تغییر به ریسمان باز";
                    }
                    // Update data-en/data-fa on the button itself if you want the main lang switcher to handle it.
                    // For now, this direct update is simpler.
                    if (p5Instance && !p.isLooping()) p.loop(); // Redraw if paused
                });
            }
            updateValuesAndFlash(); 
        };
        
        p.onSectionActive = () => {
            const canvasContainer = document.getElementById('p5-canvas-container');
            if (canvasContainer) {
                 let canvasWidth = canvasContainer.offsetWidth > 20 ? canvasContainer.offsetWidth - 20 : 300;
                 canvasWidth = Math.min(canvasWidth, 600);
                 // p.resizeCanvas(canvasWidth, 300); // Resizing can be complex if aspect ratio changes
            }
        };

        p.draw = () => {
            p.clear(); 
            const isDarkMode = bodyElement.classList.contains('dark-mode');
            const rootStyles = getComputedStyle(document.documentElement);
            
            let finalStringColor;
            if (flashDuration > 0) {
                // Interpolate color towards a bright flash color (e.g., white in dark mode, dark in light mode)
                const flashProgress = 1 - (flashDuration / flashMaxDuration); // 0 to 1
                const baseColor = p.color(isDarkMode ? rootStyles.getPropertyValue('--primary-accent-dark').trim() : rootStyles.getPropertyValue('--primary-accent-light').trim());
                const flashEffectColor = p.color(isDarkMode ? 255 : 0); // Flash white or black
                finalStringColor = p.lerpColor(flashEffectColor, baseColor, flashProgress);
                flashDuration--;
            } else {
                finalStringColor = p.color(isDarkMode ? rootStyles.getPropertyValue('--primary-accent-dark').trim() : rootStyles.getPropertyValue('--primary-accent-light').trim());
            }
            glowColor = p.color(isDarkMode ? hexToRgba(rootStyles.getPropertyValue('--primary-accent-dark').trim(), 0.4) : hexToRgba(rootStyles.getPropertyValue('--primary-accent-light').trim(), 0.4));
            
            let currentStrokeWeight = 3 + (flashDuration > 0 ? 2 * (flashDuration / flashMaxDuration) : 0) ;


            p.push(); 
            p.drawingContext.shadowBlur = 10 + (flashDuration > 0 ? 10 * (flashDuration / flashMaxDuration) : 0);
            p.drawingContext.shadowColor = glowColor.toString(); // p5 color to string
            
            p.stroke(finalStringColor);
            p.strokeWeight(currentStrokeWeight);
            p.noFill();

            p.beginShape();
            let startX = isStringTypeOpen ? p.width * 0.1 : 0; // Start further in for open string
            let endX = isStringTypeOpen ? p.width * 0.9 : p.width;   // End sooner for open string
            let effectiveWidth = endX - startX;

            for (let x = 0; x <= effectiveWidth; x += 5) {
                let yOffset = 0;
                let effectiveAmplitude = currentAmplitude;
                
                if (currentVibrationMode > 2) effectiveAmplitude *= (1 - (currentVibrationMode - 2) * 0.15);
                effectiveAmplitude = Math.max(5, effectiveAmplitude);

                // For open strings, ends should be (relatively) fixed or have less amplitude
                let boundaryFactor = 1.0;
                if (isStringTypeOpen) {
                    const distFromEnd = Math.min(x, effectiveWidth - x);
                    boundaryFactor = p.map(distFromEnd, 0, effectiveWidth * 0.1, 0.1, 1, true); // Dampen near ends
                }
                
                yOffset = (effectiveAmplitude * boundaryFactor) * p.sin(phase + p.map(x, 0, effectiveWidth, 0, currentVibrationMode * p.PI));
                p.vertex(startX + x, p.height / 2 + yOffset);
            }
            if (!isStringTypeOpen) { // Close the loop for closed string
                // This is a simple visual connection, not a true loop projection
                let firstX = 0;
                let firstYOffset = effectiveAmplitude * p.sin(phase + p.map(firstX, 0, p.width, 0, currentVibrationMode * p.PI));
                p.vertex(firstX, p.height / 2 + firstYOffset);
            }
            p.endShape(isStringTypeOpen ? null : p.CLOSE); // Use p.CLOSE for closed string, otherwise default (open)
            
            p.pop(); 

            phase += (baseFrequency * currentFrequencyFactor);
        };
        
        function hexToRgba(hex, alpha) {
            let r = 0, g = 0, b = 0;
            if (!hex || typeof hex !== 'string') return `rgba(128,128,128,${alpha})`; // Default grey
            if (hex.length == 4) { 
                r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16);
            } else if (hex.length == 7) { 
                r = parseInt(hex[1] + hex[2], 16); g = parseInt(hex[3] + hex[4], 16); b = parseInt(hex[5] + hex[6], 16);
            }
            return `rgba(${r},${g},${b},${alpha})`;
        }
    };

    // --- Initialization ---
    applySavedDarkMode(); 
    
    if (document.getElementById('interactive-lab')) {
        p5Instance = new p5(stringLabSketch);
    }
    
    updateSectionDisplay(); 
    switchLanguage(currentLang); 

    const sliderLabels = document.querySelectorAll('.slider-control label');
    sliderLabels.forEach(label => {
        const textKey = `data-${currentLang}`;
        if (label.hasAttribute(textKey)) {
            label.textContent = label.getAttribute(textKey);
        }
        const slider = label.nextElementSibling;
        if (slider && slider.tagName === 'INPUT' && slider.type === 'range') {
            // label.id = slider.id + '-label'; // Already set in HTML
            slider.setAttribute('aria-labelledby', label.id);
        }
    });
     // Initialize string type toggle button text
    const stringTypeToggleBtn = document.getElementById('string-type-toggle');
    if (stringTypeToggleBtn) {
        const lang = htmlElement.lang || 'en';
        // Add these data attributes to the button in HTML for proper translation by switchLanguage:
        // data-en-closed="Switch to Open String" data-fa-closed="تغییر به ریسمان باز"
        // data-en-open="Switch to Closed Loop" data-fa-open="تغییر به حلقه بسته"
        // For now, setting initial text directly:
        if (lang === 'en') {
            stringTypeToggleBtn.textContent = "Switch to Open String";
        } else {
            stringTypeToggleBtn.textContent = "تغییر به ریسمان باز";
        }
    }
});
