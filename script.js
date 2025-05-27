document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
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

    // --- Functions ---

    function updateSectionDisplay() {
        sections.forEach((section, index) => {
            section.classList.toggle('active', index === currentSectionIndex);
        });
        prevBtn.disabled = currentSectionIndex === 0;
        nextBtn.disabled = currentSectionIndex === sections.length - 1;

        // Simple interaction for string animation visibility
        const stringMode1 = document.querySelector('#string-animation-placeholder .string-mode1');
        const stringMode2 = document.querySelector('#string-animation-placeholder .string-mode2');
        if (stringMode1 && stringMode2) {
            if (sections[currentSectionIndex].id === 'big-idea') {
                // Cycle between showing mode1 and mode2, or both if more complex
                setTimeout(() => { // Simple toggle for demonstration
                    if (stringMode1.style.display !== 'none') {
                        stringMode1.style.display = 'none';
                        stringMode2.style.display = 'block';
                    } else {
                        stringMode1.style.display = 'block';
                        stringMode2.style.display = 'none';
                    }
                }, 500); // Delay a bit after section becomes active
            } else { // Hide secondary mode if not in the big-idea section
                stringMode1.style.display = 'block';
                stringMode2.style.display = 'none';
            }
        }
    }
    
    function updateSvgColors() {
        const isDarkMode = bodyElement.classList.contains('dark-mode');
        const svgs = document.querySelectorAll('.svg-container svg');

        svgs.forEach(svg => {
            // Update elements with dynamic fill based on data attributes
            const dynamicFills = svg.querySelectorAll('[data-light-fill][data-dark-fill]');
            dynamicFills.forEach(el => {
                el.setAttribute('fill', isDarkMode ? el.dataset.darkFill : el.dataset.lightFill);
            });
            // Update text elements with dynamic fill
             const dynamicText = svg.querySelectorAll('text[data-light-fill][data-dark-fill]');
             dynamicText.forEach(el => {
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

        const elementsToTranslate = document.querySelectorAll('[data-en],[data-fa]');
        elementsToTranslate.forEach(el => {
            const textKey = `data-${lang}`;
            if (el.hasAttribute(textKey)) {
                const text = el.getAttribute(textKey);
                 // Handle text for SVG elements specifically if they are structured this way
                if (el.tagName === 'text' && el.closest('svg')) { // Check if it's a text element within an SVG
                    el.textContent = text;
                } else if (el.tagName === 'TITLE' || el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'P' || el.tagName === 'BUTTON' || el.classList.contains('visual-placeholder') || el.classList.contains('dark-mode-hint') || el.tagName === 'LI' || el.tagName === 'I') {
                    // For list items or italicized placeholders, directly set textContent if simple, or innerHTML if it contains formatting
                     if (el.tagName === 'LI' && el.querySelector('i') && el.getAttribute(textKey).startsWith('<i>')) {
                        el.innerHTML = text; // If the data attribute contains HTML like <i>...</i>
                    } else if(el.tagName === 'I'){
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
        updateSvgColors(); // Update SVG text colors/fills that might be language-dependent if structured so
    }

    function toggleDarkMode() {
        bodyElement.classList.toggle('dark-mode');
        if (bodyElement.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
        } else {
            localStorage.setItem('darkMode', 'disabled');
        }
        updateSvgColors(); // Crucial to update SVG colors on dark mode toggle
    }

    function applySavedDarkMode() {
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'enabled') {
            bodyElement.classList.add('dark-mode');
        } else {
            bodyElement.classList.remove('dark-mode');
        }
        // No need to call updateSvgColors here, switchLanguage will call it or it's called on toggle
    }

    // --- Event Listeners ---

    prevBtn.addEventListener('click', () => {
        if (currentSectionIndex > 0) {
            currentSectionIndex--;
            updateSectionDisplay();
            window.scrollTo(0, 0); 
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentSectionIndex < sections.length - 1) {
            currentSectionIndex++;
            updateSectionDisplay();
            window.scrollTo(0, 0); 
        }
    });

    langEnBtn.addEventListener('click', () => { if (currentLang !== 'en') switchLanguage('en'); });
    langFaBtn.addEventListener('click', () => { if (currentLang !== 'fa') switchLanguage('fa'); });
    mainTitle.addEventListener('click', toggleDarkMode);

    // --- Initialization ---
    applySavedDarkMode(); 
    updateSectionDisplay(); 
    switchLanguage(currentLang); // This will also call updateSvgColors

    // Initial setup for string animation visibility
    const stringMode1 = document.querySelector('#string-animation-placeholder .string-mode1');
    const stringMode2 = document.querySelector('#string-animation-placeholder .string-mode2');
    if (stringMode1 && stringMode2) {
        stringMode1.style.display = 'block'; // Show mode 1 by default
        stringMode2.style.display = 'none';  // Hide mode 2 by default
    }
});
