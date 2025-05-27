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
    const sectionTransitionDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--section-transition-duration').replace('s', '')) * 1000 || 450;

    // --- Functions ---

    function updateSectionDisplay() {
        const currentActiveSection = sectionsContainer.querySelector('.content-section.active');
        const newActiveSection = sections[currentSectionIndex];

        if (currentActiveSection && currentActiveSection !== newActiveSection) {
            currentActiveSection.classList.add('exiting');
            currentActiveSection.addEventListener('transitionend', function handler() {
                this.classList.remove('active');
                this.classList.remove('exiting');
                this.removeEventListener('transitionend', handler);
            }, { once: true });
        }
        
        newActiveSection.classList.remove('exiting'); 
        newActiveSection.classList.add('active');

        sections.forEach((section, index) => {
            if (section.id === 'interactive-lab' && p5Instance) {
                if (index === currentSectionIndex) {
                    if (typeof p5Instance.isLooping === 'function' && !p5Instance.isLooping()) p5Instance.loop();
                    if (typeof p5Instance.onSectionActive === 'function') p5Instance.onSectionActive();
                } else {
                    if (typeof p5Instance.isLooping === 'function' && p5Instance.isLooping()) p5Instance.noLoop();
                }
            }
        });

        const newHeading = newActiveSection.querySelector('h2, h3'); 
        if (newHeading) {
            setTimeout(() => {
                newActiveSection.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                setTimeout(() => newHeading.focus({ preventScroll: true }), 150); // Focus after scroll
            }, 50); 
        }

        prevBtn.disabled = currentSectionIndex === 0;
        nextBtn.disabled = currentSectionIndex === sections.length - 1;
        prevBtn.setAttribute('aria-disabled', prevBtn.disabled.toString());
        nextBtn.setAttribute('aria-disabled', nextBtn.disabled.toString());
    }
    
    function updateSvgColors() {
        const isDarkMode = bodyElement.classList.contains('dark-mode');
        const svgs = document.querySelectorAll('.svg-container svg');
        svgs.forEach(svg => {
            const dynamicFills = svg.querySelectorAll('[data-light-fill][data-dark-fill]');
            dynamicFills.forEach(el => el.setAttribute('fill', isDarkMode ? el.dataset.darkFill : el.dataset.lightFill));
            const dynamicTextFills = svg.querySelectorAll('text[data-light-fill][data-dark-fill]');
            dynamicTextFills.forEach(el => el.setAttribute('fill', isDarkMode ? el.dataset.darkFill : el.dataset.lightFill));
        });
    }

    function switchLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('preferredLang', lang); 
        htmlElement.lang = lang;
        htmlElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
        bodyElement.style.fontFamily = lang === 'fa' ? "'Vazirmatn', 'Roboto', sans-serif" : "'Roboto', 'Vazirmatn', sans-serif";
        
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
                } else if (el.id === 'string-type-toggle') { 
                    const isOpen = el.getAttribute('aria-pressed') === 'true';
                    const openText = el.getAttribute(`data-${lang}-open`);
                    const closedText = el.getAttribute(`data-${lang}-closed`);
                    el.textContent = isOpen ? (openText || text) : (closedText || text);
                }
                else if (el.tagName === 'TITLE' || el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'P' || el.tagName === 'BUTTON' || el.classList.contains('visual-placeholder') || el.classList.contains('dark-mode-hint') || el.tagName === 'LI' || el.tagName === 'I' || el.tagName === 'SPAN' && (el.closest('.visual-placeholder') || el.closest('.timeline-date') || el.closest('.timeline-content')) || el.tagName === 'DT' || el.tagName === 'DD') {
                     if (el.tagName === 'LI' && el.querySelector('i') && el.getAttribute(textKey).startsWith('<i>')) {
                        el.innerHTML = text;
                    } else if(el.tagName === 'I' || (el.tagName === 'SPAN' && (el.closest('.visual-placeholder') || el.closest('.timeline-date')))){
                         el.textContent = text;
                    }
                    else {
                        el.textContent = text;
                    }
                }
            }
        });
        const titleElement = document.querySelector('title');
        if (titleElement) titleElement.textContent = titleElement.getAttribute(`data-${lang}`);
        updateSvgColors(); 
    }

    function toggleDarkMode() {
        bodyElement.classList.toggle('dark-mode');
        const isDarkModeEnabled = bodyElement.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkModeEnabled ? 'enabled' : 'disabled');
        mainTitle.setAttribute('aria-pressed', isDarkModeEnabled.toString());
        updateSvgColors(); 
        if (p5Instance && typeof p5Instance.redraw === 'function' && p5Instance.isLooping()) p5Instance.redraw();
    }

    function applySavedDarkMode() {
        const savedDarkMode = localStorage.getItem('darkMode');
        const isDarkModeEnabled = savedDarkMode === 'enabled';
        if (isDarkModeEnabled) bodyElement.classList.add('dark-mode');
        else bodyElement.classList.remove('dark-mode');
        mainTitle.setAttribute('aria-pressed', isDarkModeEnabled.toString());
    }

    // --- Timeline Interaction ---
    const timelineEvents = document.querySelectorAll('.timeline-event');
    timelineEvents.forEach(event => {
        const details = event.querySelector('.timeline-details');
        if (!details) return; // Skip if no details div

        event.addEventListener('click', () => {
            const isExpanded = details.classList.toggle('expanded');
            event.setAttribute('aria-expanded', isExpanded.toString());
            details.setAttribute('aria-hidden', (!isExpanded).toString());
        });
        event.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); event.click();
            }
        });
    });


    // --- Event Listeners ---
    prevBtn.addEventListener('click', () => { if (currentSectionIndex > 0) { currentSectionIndex--; updateSectionDisplay(); }});
    nextBtn.addEventListener('click', () => { if (currentSectionIndex < sections.length - 1) { currentSectionIndex++; updateSectionDisplay(); }});
    langEnBtn.addEventListener('click', () => { if (currentLang !== 'en') switchLanguage('en'); });
    langFaBtn.addEventListener('click', () => { if (currentLang !== 'fa') switchLanguage('fa'); });
    mainTitle.addEventListener('click', toggleDarkMode);
    mainTitle.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDarkMode(); }});


    // --- p5.js Interactive String Lab Sketch (Instance Mode) ---
    const stringLabSketch = (p) => {
        let currentVibrationMode = 1; let currentAmplitude = 50; let currentFrequencyFactor = 3; 
        let baseFrequency = 0.01; let phase = 0; let isStringTypeOpen = false; 
        let modeSlider, amplitudeSlider, frequencySlider, stringTypeToggleBtn;
        let modeValueDisplay, amplitudeValueDisplay, frequencyValueDisplay;
        let stringColor, glowColor; 
        let lastAmplitude = 50; let lastMode = 1;
        let flashDuration = 0; const flashMaxDuration = 20; 
        let tempStringColor = null;
        let pluckPoints = []; const numStringSegments = 100; 
        let pluckDecay = 0.96; let pluckWaveSpeed = 0.2; // Increased speed
        let p5CanvasContainer;
        let instructionOpacity = 255; // For pluck instruction text

        p.setup = () => {
            p5CanvasContainer = document.getElementById('p5-canvas-container');
            if (!p5CanvasContainer) { console.error("p5 canvas container not found"); return; }
            let canvasWidth = p5CanvasContainer.offsetWidth > 20 ? p5CanvasContainer.offsetWidth - 20 : 300;
            canvasWidth = Math.min(canvasWidth, 600); let canvasHeight = 300;
            const canvas = p.createCanvas(canvasWidth, canvasHeight);
            canvas.parent('p5-canvas-container');
            p.pixelDensity(p.displayDensity()); 

            for (let i = 0; i <= numStringSegments; i++) pluckPoints[i] = { y: 0, vy: 0 };

            modeSlider = document.getElementById('mode-slider');
            amplitudeSlider = document.getElementById('amplitude-slider');
            frequencySlider = document.getElementById('frequency-slider');
            stringTypeToggleBtn = document.getElementById('string-type-toggle');
            modeValueDisplay = document.getElementById('mode-value');
            amplitudeValueDisplay = document.getElementById('amplitude-value');
            frequencyValueDisplay = document.getElementById('frequency-value');
            
            const updateValuesAndFlash = (paramChanged = null) => {
                let modeChanged = false, amplitudeChanged = false;
                if (modeSlider) { const newMode = parseInt(modeSlider.value); if (newMode !== lastMode) { modeChanged = true; lastMode = newMode; } currentVibrationMode = newMode; if (modeValueDisplay) modeValueDisplay.textContent = currentVibrationMode; }
                if (amplitudeSlider) { const newAmplitude = parseInt(amplitudeSlider.value); if (newAmplitude !== lastAmplitude) { amplitudeChanged = true; lastAmplitude = newAmplitude; } currentAmplitude = newAmplitude; if (amplitudeValueDisplay) amplitudeValueDisplay.textContent = currentAmplitude; }
                if (frequencySlider) { currentFrequencyFactor = parseInt(frequencySlider.value); if (frequencyValueDisplay) frequencyValueDisplay.textContent = (baseFrequency * currentFrequencyFactor).toFixed(3); }
                if (paramChanged === 'mode' || paramChanged === 'amplitude' || modeChanged || amplitudeChanged) { flashDuration = flashMaxDuration; tempStringColor = bodyElement.classList.contains('dark-mode') ? p.color(255, 255, 255, 230) : p.color(0, 0, 0, 230); }
                if (!p.isLooping()) p.loop(); 
            };

            if (modeSlider) modeSlider.addEventListener('input', () => updateValuesAndFlash('mode'));
            if (amplitudeSlider) amplitudeSlider.addEventListener('input', () => updateValuesAndFlash('amplitude'));
            if (frequencySlider) frequencySlider.addEventListener('input', () => updateValuesAndFlash('frequency'));
            
            if (stringTypeToggleBtn) {
                stringTypeToggleBtn.addEventListener('click', () => {
                    isStringTypeOpen = !isStringTypeOpen;
                    stringTypeToggleBtn.setAttribute('aria-pressed', isStringTypeOpen.toString());
                    const lang = htmlElement.lang || 'en';
                    const openText = stringTypeToggleBtn.getAttribute(`data-${lang}-open`);
                    const closedText = stringTypeToggleBtn.getAttribute(`data-${lang}-closed`);
                    stringTypeToggleBtn.textContent = isStringTypeOpen ? (openText || "Switch to Closed Loop") : (closedText || "Switch to Open String");
                    if (p5Instance && !p.isLooping()) p.loop();
                });
            }

            const initiatePluck = (mouseX, mouseY) => {
                if (mouseY > p.height * 0.15 && mouseY < p.height * 0.85) {
                    const pluckPosNormalized = p.constrain(mouseX / p.width, 0.01, 0.99);
                    const pluckStrengthVal = p.constrain(mouseY - p.height / 2, -currentAmplitude * 2, currentAmplitude * 2);
                    for (let i = 0; i <= numStringSegments; i++) {
                        const xNorm = i / numStringSegments; const dist = p.abs(xNorm - pluckPosNormalized);
                        const influence = p.exp(-dist * dist * (isStringTypeOpen ? 180 : 150) ); // Sharper for open string ends
                        pluckPoints[i].y = pluckStrengthVal * influence; pluckPoints[i].vy = 0; 
                    }
                    p5CanvasContainer.classList.add('grabbing');
                    flashDuration = flashMaxDuration / 1.5; 
                    tempStringColor = bodyElement.classList.contains('dark-mode') ? p.color(220,220,255, 200) : p.color(80,80,0, 200); 
                    instructionOpacity = 0; // Hide instruction after first pluck
                    if (!p.isLooping()) p.loop();
                }
            };
            canvas.mousePressed(() => initiatePluck(p.mouseX, p.mouseY));
            canvas.mouseReleased(() => p5CanvasContainer.classList.remove('grabbing'));
            canvas.touchStarted(() => { if (p.touches.length > 0) { initiatePluck(p.touches[0].x, p.touches[0].y); return false; } });
            canvas.touchEnded(() => { p5CanvasContainer.classList.remove('grabbing'); return false; });
            updateValuesAndFlash(); 
        };
        
        p.onSectionActive = () => {
            if (p5CanvasContainer) {
                 let canvasWidth = p5CanvasContainer.offsetWidth > 20 ? p5CanvasContainer.offsetWidth - 20 : 300;
                 canvasWidth = Math.min(canvasWidth, 600);
                 // p.resizeCanvas(canvasWidth, 300); 
            }
            instructionOpacity = 255; // Reset instruction visibility
        };

        p.draw = () => {
            p.clear(); 
            const isDarkMode = bodyElement.classList.contains('dark-mode');
            const rootStyles = getComputedStyle(document.documentElement);
            let finalStringColor;
            if (flashDuration > 0) {
                const flashProgress = 1 - (flashDuration / flashMaxDuration); 
                const baseColor = p.color(isDarkMode ? rootStyles.getPropertyValue('--primary-accent-dark').trim() : rootStyles.getPropertyValue('--primary-accent-light').trim());
                finalStringColor = p.lerpColor(tempStringColor || baseColor, baseColor, flashProgress); 
                flashDuration--;
            } else {
                finalStringColor = p.color(isDarkMode ? rootStyles.getPropertyValue('--primary-accent-dark').trim() : rootStyles.getPropertyValue('--primary-accent-light').trim());
            }
            glowColor = p.color(isDarkMode ? hexToRgba(rootStyles.getPropertyValue('--primary-accent-dark').trim(), 0.3) : hexToRgba(rootStyles.getPropertyValue('--primary-accent-light').trim(), 0.3));
            let currentStrokeWeight = 3 + (flashDuration > 0 ? 2.5 * (flashDuration / flashMaxDuration) : 0) ;

            // Update pluck wave physics
            let newPluckPoints = pluckPoints.map(pt => ({ ...pt })); // Deep copy for modification

            for (let iter = 0; iter < 2; iter++) { // Multiple iterations for stability/speed
                for (let i = 1; i < numStringSegments; i++) {
                    let prevY = pluckPoints[i-1].y; let currentY = pluckPoints[i].y; let nextY = pluckPoints[i+1].y;
                    let acceleration = (prevY + nextY - 2 * currentY) * pluckWaveSpeed * pluckWaveSpeed;
                    newPluckPoints[i].vy += acceleration;
                }
                for (let i = 1; i < numStringSegments; i++) {
                     newPluckPoints[i].vy *= pluckDecay; 
                     newPluckPoints[i].y += newPluckPoints[i].vy;
                }
                if (isStringTypeOpen) { 
                    newPluckPoints[0].y = 0; newPluckPoints[0].vy = 0;
                    newPluckPoints[numStringSegments].y = 0; newPluckPoints[numStringSegments].vy = 0;
                } else { 
                    let accFirst = (pluckPoints[numStringSegments-1].y + pluckPoints[1].y - 2 * pluckPoints[0].y) * pluckWaveSpeed * pluckWaveSpeed; // Use numStringSegments-1 for loop back
                    newPluckPoints[0].vy += accFirst; newPluckPoints[0].vy *= pluckDecay;
                    newPluckPoints[0].y += newPluckPoints[0].vy;
                    newPluckPoints[numStringSegments] = {y: newPluckPoints[0].y, vy: newPluckPoints[0].vy}; // Loop back last point
                }
                pluckPoints = newPluckPoints.map(pt => ({ ...pt })); // Update main array
            }
            
            p.push(); 
            p.drawingContext.shadowBlur = 8 + (flashDuration > 0 ? 12 * (flashDuration / flashMaxDuration) : 0);
            p.drawingContext.shadowColor = glowColor.toString(); 
            p.stroke(finalStringColor); p.strokeWeight(currentStrokeWeight); p.noFill();

            p.beginShape();
            let startX = isStringTypeOpen ? p.width * 0.05 : 0; let endX = isStringTypeOpen ? p.width * 0.95 : p.width;   
            let effectiveWidth = endX - startX;

            for (let i = 0; i <= numStringSegments; i++) {
                let x_norm_segment = i / numStringSegments; 
                let x_abs = startX + x_norm_segment * effectiveWidth;
                let yOffset_mode = 0; let effectiveAmplitude = currentAmplitude;
                if (currentVibrationMode > 2) effectiveAmplitude *= (1 - (currentVibrationMode - 2) * 0.15);
                effectiveAmplitude = Math.max(5, effectiveAmplitude);
                let boundaryFactor = isStringTypeOpen ? p.sin(x_norm_segment * p.PI) : 1.0;
                yOffset_mode = (effectiveAmplitude * boundaryFactor) * p.sin(phase + currentVibrationMode * p.PI * x_norm_segment);
                let yOffset_pluck = pluckPoints[i].y;
                p.vertex(x_abs, p.height / 2 + yOffset_mode + yOffset_pluck);
            }
            p.endShape(isStringTypeOpen ? null : undefined); // Use undefined for open, p.CLOSE handled by connecting last to first for closed.
            
            p.pop(); 
            phase += (baseFrequency * currentFrequencyFactor);
            
            // Draw pluck instruction
            if (instructionOpacity > 0) {
                p.fill(isDarkMode ? 200 : 100, instructionOpacity);
                p.noStroke();
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(12);
                const instructionText = htmlElement.lang === 'fa' ? "برای «کندن» کلیک و درگ کنید" : "Click & Drag to 'Pluck'";
                p.text(instructionText, p.width / 2, p.height - 20);
                instructionOpacity -= 1.5; // Fade out
            }
        };
        
        function hexToRgba(hex, alpha) {
            let r = 0, g = 0, b = 0;
            if (!hex || typeof hex !== 'string') return `rgba(128,128,128,${alpha})`; 
            if (hex.length == 4) { r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16); } 
            else if (hex.length == 7) { r = parseInt(hex[1] + hex[2], 16); g = parseInt(hex[3] + hex[4], 16); b = parseInt(hex[5] + hex[6], 16); }
            return `rgba(${r},${g},${b},${alpha})`;
        }
    };

    // --- Initialization ---
    applySavedDarkMode(); 
    if (document.getElementById('interactive-lab')) p5Instance = new p5(stringLabSketch);
    updateSectionDisplay(); 
    switchLanguage(currentLang); 

    const sliderLabels = document.querySelectorAll('.slider-control label');
    sliderLabels.forEach(label => {
        const textKey = `data-${currentLang}`;
        if (label.hasAttribute(textKey)) label.textContent = label.getAttribute(textKey);
        const slider = label.nextElementSibling;
        if (slider && slider.tagName === 'INPUT' && slider.type === 'range') slider.setAttribute('aria-labelledby', label.id);
    });
    const stringTypeToggleBtn = document.getElementById('string-type-toggle');
    if (stringTypeToggleBtn) { // Initialize button text
        const lang = htmlElement.lang || 'en';
        const isOpen = stringTypeToggleBtn.getAttribute('aria-pressed') === 'true';
        const openText = stringTypeToggleBtn.getAttribute(`data-${lang}-open`);
        const closedText = stringTypeToggleBtn.getAttribute(`data-${lang}-closed`);
        stringTypeToggleBtn.textContent = isOpen ? (openText || "Switch to Closed Loop") : (closedText || "Switch to Open String");
    }
});
