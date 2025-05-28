// js/p5_sketch.js
// Version: v22_freeze_fix

// This function will be called by the main script.js to create the p5 instance.
const stringLabSketch = (p) => {
    let currentVibrationMode = 1;
    let currentAmplitude = 50;
    let currentFrequencyFactor = 3;
    let baseFrequency = 0.01;
    let phase = 0;
    let isStringTypeOpen = false;

    let stringColor, glowColor, openEndCapColor;
    let flashDuration = 0;
    const flashMaxDuration = 20; 
    let tempStringColor = null;

    let pluckPoints = [];
    const numStringSegments = 100;
    let pluckDecay = 0.965;
    let pluckWaveSpeed = 0.28;
    let p5CanvasContainer;
    let instructionOpacity = 255;
    let hasPluckedOnce = false;
    const openStringEndCapRadius = 4;

    p.updateP5Controls = (mode, amplitude, freqFactor, isOpen) => {
        // console.log(`DEBUG p5_sketch: updateP5Controls called - mode: ${mode}, amp: ${amplitude}, freq: ${freqFactor}, isOpen: ${isOpen}`);
        let modeChanged = (currentVibrationMode !== mode);
        let amplitudeChanged = (currentAmplitude !== amplitude);
        let typeChanged = (isStringTypeOpen !== isOpen);

        currentVibrationMode = mode;
        currentAmplitude = amplitude;
        currentFrequencyFactor = freqFactor;
        isStringTypeOpen = isOpen;

        if (modeChanged || amplitudeChanged || typeChanged) {
            flashDuration = flashMaxDuration;
            tempStringColor = document.body.classList.contains('dark-mode') ? p.color(255, 255, 255, 230) : p.color(0, 0, 0, 230);
        }
        if (!p.isLooping()) {
            // console.log("DEBUG p5_sketch: Controls updated, calling p.loop()");
            p.loop();
        }
        if (typeChanged) {
            // console.log("DEBUG p5_sketch: String type changed, resetting pluckPoints.");
            for (let i = 0; i <= numStringSegments; i++) {
                pluckPoints[i] = { y: 0, vy: 0 };
            }
        }
    };

    p.onSectionActive = () => {
        // console.log("DEBUG p5_sketch: onSectionActive called.");
        if (p5CanvasContainer) {
            let canvasWidth = p5CanvasContainer.offsetWidth > 20 ? p5CanvasContainer.offsetWidth - 20 : 300;
            canvasWidth = Math.min(canvasWidth, 600);
            // p.resizeCanvas(canvasWidth, 300); // Resize only if necessary
        }
        if (!hasPluckedOnce) instructionOpacity = 255;
        if (!p.isLooping()) {
            // console.log("DEBUG p5_sketch: Section active, calling p.loop()");
            p.loop();
        }
    };
    
    p.onSectionInactive = () => {
        // console.log("DEBUG p5_sketch: onSectionInactive called, calling p.noLoop()");
        if (p.isLooping()) p.noLoop();
    };

    p.setup = () => {
        // console.log("DEBUG p5_sketch: p.setup() called.");
        p5CanvasContainer = document.getElementById('p5-canvas-container');
        if (!p5CanvasContainer) {
            console.error("CRITICAL p5_sketch: p5 canvas container not found!");
            p.noLoop(); 
            return;
        }
        let canvasWidth = p5CanvasContainer.offsetWidth > 20 ? p5CanvasContainer.offsetWidth - 20 : 300;
        canvasWidth = Math.min(canvasWidth, 600);
        let canvasHeight = 300;
        const canvas = p.createCanvas(canvasWidth, canvasHeight);
        canvas.parent('p5-canvas-container');
        p.pixelDensity(p.displayDensity());

        for (let i = 0; i <= numStringSegments; i++) pluckPoints[i] = { y: 0, vy: 0 };

        const initiatePluck = (mouseX, mouseY) => {
            if (mouseY > p.height * 0.1 && mouseY < p.height * 0.9) {
                const pluckPosNormalized = p.constrain(mouseX / p.width, 0.01, 0.99);
                const pluckStrengthVal = p.constrain(mouseY - p.height / 2, -currentAmplitude * 2.2, currentAmplitude * 2.2);
                for (let i = 0; i <= numStringSegments; i++) {
                    const xNorm = i / numStringSegments;
                    const dist = p.abs(xNorm - pluckPosNormalized);
                    const influenceWidth = isStringTypeOpen ? 0.08 : 0.12;
                    const influence = p.exp(-dist * dist / (2 * influenceWidth * influenceWidth));
                    pluckPoints[i].y += pluckStrengthVal * influence;
                    pluckPoints[i].vy = 0;
                }
                p5CanvasContainer.classList.add('grabbing');
                flashDuration = Math.floor(flashMaxDuration / 1.5);
                tempStringColor = document.body.classList.contains('dark-mode') ? p.color(200, 220, 255, 210) : p.color(100, 50, 0, 210);
                if (!hasPluckedOnce) hasPluckedOnce = true;
                if (!p.isLooping()) p.loop();
            }
        };
        canvas.mousePressed(() => initiatePluck(p.mouseX, p.mouseY));
        canvas.mouseReleased(() => p5CanvasContainer.classList.remove('grabbing'));
        canvas.touchStarted(() => { if (p.touches.length > 0) { initiatePluck(p.touches[0].x, p.touches[0].y); return false; } });
        canvas.touchEnded(() => { p5CanvasContainer.classList.remove('grabbing'); return false; });
        
        // Initial values are set by main script calling updateP5Controls after p5 instance creation
        p.noLoop(); // Start paused
    };

    p.draw = () => {
        try { // Added try...catch for debugging draw loop errors
            p.clear();
            const isDarkMode = document.body.classList.contains('dark-mode');
            const rootStyles = getComputedStyle(document.documentElement);
            let finalStringColor;

            if (flashDuration > 0) {
                const flashProgress = 1 - (flashDuration / flashMaxDuration);
                const baseColorHex = isDarkMode ? rootStyles.getPropertyValue('--primary-accent-dark').trim() : rootStyles.getPropertyValue('--primary-accent-light').trim();
                const baseColor = p.color(baseColorHex); // Ensure p.color() is used
                finalStringColor = p.lerpColor(tempStringColor || baseColor, baseColor, flashProgress);
                flashDuration--;
            } else {
                finalStringColor = p.color(isDarkMode ? rootStyles.getPropertyValue('--primary-accent-dark').trim() : rootStyles.getPropertyValue('--primary-accent-light').trim());
            }
            glowColor = p.color(isDarkMode ? hexToRgba(rootStyles.getPropertyValue('--primary-accent-dark').trim(), 0.3) : hexToRgba(rootStyles.getPropertyValue('--primary-accent-light').trim(), 0.3));
            openEndCapColor = p.color(isDarkMode ? hexToRgba(rootStyles.getPropertyValue('--secondary-accent-dark').trim(), 0.8) : hexToRgba(rootStyles.getPropertyValue('--secondary-accent-light').trim(), 0.8));
            
            let currentStrokeWeight = 3 + (flashDuration > 0 ? 2.5 * (flashDuration / flashMaxDuration) : 0);

            // Update pluck wave physics
            let newPluckPoints = pluckPoints.map(pt => ({ y: pt.y, vy: pt.vy }));
            for (let iter = 0; iter < 3; iter++) {
                for (let i = 1; i < numStringSegments; i++) {
                    let prevY = pluckPoints[i - 1].y;
                    let currentY = pluckPoints[i].y;
                    let nextY = pluckPoints[i + 1].y;
                    let acceleration = (prevY + nextY - 2 * currentY) * pluckWaveSpeed * pluckWaveSpeed;
                    newPluckPoints[i].vy += acceleration;
                }
                for (let i = 0; i <= numStringSegments; i++) { // Apply damping and update y for all points
                    newPluckPoints[i].vy *= pluckDecay;
                    newPluckPoints[i].y += newPluckPoints[i].vy;
                }
                if (isStringTypeOpen) {
                    newPluckPoints[0].y = 0; newPluckPoints[0].vy = 0;
                    newPluckPoints[numStringSegments].y = 0; newPluckPoints[numStringSegments].vy = 0;
                } else {
                    // Ensure continuity for closed loop pluck wave
                    let accFirst = (pluckPoints[numStringSegments - 1].y + pluckPoints[1].y - 2 * pluckPoints[0].y) * pluckWaveSpeed * pluckWaveSpeed;
                    newPluckPoints[0].vy += accFirst;
                    // newPluckPoints[0].vy *= pluckDecay; // Damping already applied above
                    // newPluckPoints[0].y += newPluckPoints[0].vy; // Position update already applied above
                    newPluckPoints[numStringSegments].y = newPluckPoints[0].y; // Enforce loop
                    newPluckPoints[numStringSegments].vy = newPluckPoints[0].vy;
                }
                pluckPoints = newPluckPoints.map(pt => ({ ...pt }));
            }

            p.push();
            p.drawingContext.shadowBlur = 8 + (flashDuration > 0 ? 12 * (flashDuration / flashMaxDuration) : 0);
            p.drawingContext.shadowColor = glowColor.toString();
            p.stroke(finalStringColor);
            p.strokeWeight(currentStrokeWeight);
            p.noFill();

            p.beginShape();
            let startX = isStringTypeOpen ? p.width * 0.05 : 0;
            let endX = isStringTypeOpen ? p.width * 0.95 : p.width;
            let effectiveWidth = endX - startX;

            for (let i = 0; i <= numStringSegments; i++) {
                let x_norm_segment = i / numStringSegments;
                let x_abs = startX + x_norm_segment * effectiveWidth;
                let yOffset_mode = 0;
                let effectiveAmplitude = currentAmplitude;
                if (currentVibrationMode > 2) effectiveAmplitude *= (1 - (currentVibrationMode - 2) * 0.15);
                effectiveAmplitude = Math.max(5, effectiveAmplitude);
                let boundaryFactor = 1.0;
                if (isStringTypeOpen) {
                    boundaryFactor = p.sin(x_norm_segment * p.PI); 
                }
                yOffset_mode = (effectiveAmplitude * boundaryFactor) * p.sin(phase + currentVibrationMode * p.PI * x_norm_segment);
                let yOffset_pluck = pluckPoints[i].y;
                p.vertex(x_abs, p.height / 2 + yOffset_mode + yOffset_pluck);
            }
            p.endShape(isStringTypeOpen ? undefined : p.CLOSE);

            if (isStringTypeOpen) {
                p.noStroke();
                p.fill(openEndCapColor);
                // For open strings, modal displacement at ends (i=0, i=numStringSegments) is 0 due to boundaryFactor.
                // So y positions are determined by pluckPoints only at the ends.
                let firstPointY = p.height / 2 + pluckPoints[0].y; 
                let lastPointY = p.height / 2 + pluckPoints[numStringSegments].y;
                
                p.ellipse(startX, firstPointY, openStringEndCapRadius * 2, openStringEndCapRadius * 2);
                p.ellipse(endX, lastPointY, openStringEndCapRadius * 2, openStringEndCapRadius * 2);
            }
            p.pop();
            phase += (baseFrequency * currentFrequencyFactor);

            if (hasPluckedOnce && instructionOpacity > 0) instructionOpacity -= 2.5;
            if (instructionOpacity > 0) {
                p.fill(isDarkMode ? 200 : 100, instructionOpacity);
                p.noStroke();
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(12);
                const instructionTextKey = "labPluckInstruction";
                const mainScript = window.stringTheoryApp;
                let instructionText = instructionTextKey;
                if (mainScript && mainScript.getTranslation) {
                    instructionText = mainScript.getTranslation(instructionTextKey, "Click & Drag to 'Pluck'");
                } else {
                    instructionText = document.documentElement.lang === 'fa' ? "برای «کندن» کلیک و درگ کنید" : "Click & Drag to 'Pluck'";
                }
                p.text(instructionText, p.width / 2, p.height - 20);
            }

            // Auto-stop logic (optional, can be too aggressive)
            // let canStopLoop = true;
            // for(let pt of pluckPoints) {
            //     if (p.abs(pt.y) > 0.01 || p.abs(pt.vy) > 0.01) {
            //         canStopLoop = false;
            //         break;
            //     }
            // }
            // if (flashDuration <= 0 && canStopLoop && !document.querySelector('#string-controls-lab input[type="range"]:active')) {
            //     if(p.isLooping()) p.noLoop();
            // }

        } catch (err) {
            console.error("Error in p5.js draw loop:", err);
            p.noLoop(); // Stop the loop to prevent further errors
            // Optionally, display an error message on the canvas itself
            p.fill(255,0,0);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(16);
            p.text("Animation Error. Check Console.", p.width/2, p.height/2);
        }
    };

    function hexToRgba(hex, alpha) {
        let r = 0, g = 0, b = 0;
        if (!hex || typeof hex !== 'string') return `rgba(128,128,128,${alpha})`;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex[1] + hex[2], 16); g = parseInt(hex[3] + hex[4], 16); b = parseInt(hex[5] + hex[6], 16);
        }
        return `rgba(${r},${g},${b},${alpha})`;
    }
};
