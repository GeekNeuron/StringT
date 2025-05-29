// js/ui_interactions.js
// Module for UI related interactions like timeline, glossary, etc.
// Version: v2_refactor_resend_again

// Ensure the main app namespace exists
window.stringTheoryApp = window.stringTheoryApp || {};

window.stringTheoryApp.uiInteractions = (function() {
    'use strict';

    let bigIdeaAnimationInterval = null;
    // const sectionTransitionDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--section-transition-duration').replace('s', '')) * 1000 || 300;

    /**
     * Initializes interactive timeline events.
     * Each event can be clicked to expand/collapse details.
     */
    function initializeTimelineInteraction() {
        const timelineEvents = document.querySelectorAll('.timeline-event');
        timelineEvents.forEach(event => {
            const details = event.querySelector('.timeline-details');
            if (!details) {
                return;
            }
            if (!event.hasAttribute('aria-expanded')) event.setAttribute('aria-expanded', 'false');
            if (!details.hasAttribute('aria-hidden')) details.setAttribute('aria-hidden', 'true');

            event.addEventListener('click', () => {
                const isExpanded = details.classList.toggle('expanded');
                event.setAttribute('aria-expanded', isExpanded.toString());
                details.setAttribute('aria-hidden', (!isExpanded).toString());
            });
            event.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    event.click();
                }
            });
        });
    }

    /**
     * Initializes interactive glossary terms.
     * Each term (dt) can be clicked to expand/collapse its definition (dd).
     */
    function initializeGlossaryInteraction() {
        const glossaryEntries = document.querySelectorAll('.glossary-entry');
        glossaryEntries.forEach(entry => {
            const term = entry.querySelector('dt');
            const definition = entry.querySelector('dd');

            if (!term || !definition) {
                console.warn("DEBUG ui_interactions: Glossary entry missing dt or dd:", entry);
                return; 
            }
            const ddId = definition.id;
            if (ddId) { 
                term.setAttribute('aria-controls', ddId);
            } else {
                console.warn("DEBUG ui_interactions: Glossary definition (dd) missing an ID for term:", term.textContent.trim());
            }
            
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

    /**
     * Manages the animation of the "Big Idea" SVG.
     * @param {boolean} isActive - Whether the "Big Idea" section is currently active.
     * @param {HTMLElement} svgPlaceholder - The placeholder div where the SVG is loaded.
     */
    function manageBigIdeaAnimation(isActive, svgPlaceholder) {
        if (!svgPlaceholder) {
            if (bigIdeaAnimationInterval) clearInterval(bigIdeaAnimationInterval);
            bigIdeaAnimationInterval = null;
            return;
        }

        const checkSVGAndAnimate = () => {
            const stringMode1 = svgPlaceholder.querySelector('.string-mode1');
            const stringMode2 = svgPlaceholder.querySelector('.string-mode2');

            if (!stringMode1 || !stringMode2) {
                if (bigIdeaAnimationInterval) clearInterval(bigIdeaAnimationInterval);
                bigIdeaAnimationInterval = null;
                return;
            }

            if (isActive) {
                if (!bigIdeaAnimationInterval) { 
                    stringMode1.style.display = 'block';
                    stringMode2.style.display = 'none';
                    bigIdeaAnimationInterval = setInterval(() => {
                        const currentStringMode1 = svgPlaceholder.querySelector('.string-mode1'); 
                        const currentStringMode2 = svgPlaceholder.querySelector('.string-mode2');
                        if(currentStringMode1 && currentStringMode2){
                            if (currentStringMode1.style.display !== 'none') {
                                currentStringMode1.style.display = 'none';
                                currentStringMode2.style.display = 'block';
                            } else {
                                currentStringMode1.style.display = 'block';
                                currentStringMode2.style.display = 'none';
                            }
                        } else { 
                             clearInterval(bigIdeaAnimationInterval);
                             bigIdeaAnimationInterval = null;
                        }
                    }, 2000); 
                }
            } else {
                if (bigIdeaAnimationInterval) {
                    clearInterval(bigIdeaAnimationInterval);
                    bigIdeaAnimationInterval = null;
                    if (stringMode1) stringMode1.style.display = 'block'; // Reset to default
                    if (stringMode2) stringMode2.style.display = 'none';
                }
            }
        };
        
        if (svgPlaceholder.querySelector('svg')) {
            checkSVGAndAnimate();
        } else {
            if (bigIdeaAnimationInterval) clearInterval(bigIdeaAnimationInterval);
            bigIdeaAnimationInterval = null;
        }
    }
    
    /**
     * Initializes the "Skip to main content" link functionality.
     */
    function initializeSkipLink() {
        const skipLinkElement = document.querySelector('.skip-link');
        if (skipLinkElement) {
            skipLinkElement.addEventListener('click', (e) => {
                e.preventDefault();
                const mainContent = document.getElementById('interactive-content');
                if (mainContent) {
                    const activeSection = mainContent.querySelector('.content-section.active');
                    let firstFocusableElement = activeSection ? 
                        activeSection.querySelector('h2, h3, button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') : 
                        null;
                    
                    if (firstFocusableElement) {
                        firstFocusableElement.focus();
                    } else if (activeSection) { 
                        activeSection.setAttribute('tabindex', '-1'); 
                        activeSection.focus();
                    } else { 
                         mainContent.setAttribute('tabindex', '-1'); 
                         mainContent.focus();
                    }
                }
            });
        }
    }

    // Expose public functions
    return {
        initializeTimelineInteraction,
        initializeGlossaryInteraction,
        manageBigIdeaAnimation,
        initializeSkipLink
    };

})();
