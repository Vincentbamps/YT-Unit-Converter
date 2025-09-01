// =======================
// Unit conversion functions
// =======================
function convertSimpleUnit(value, unit) {
    unit = unit.toLowerCase();
    if (unit.includes('inch') || unit === 'in') return (value * 2.54).toFixed(2) + ' cm';
    if (unit.includes('ft') || unit.includes('foot')) return (value * 0.3048).toFixed(2) + ' m';
    if (unit.includes('mile')) return (value * 1.60934).toFixed(2) + ' km';
    if (unit.includes('mph')) return (value * 1.60934).toFixed(2) + ' km/h';
    if (unit.includes('f') && !unit.includes('foot')) return ((value - 32) * 5/9).toFixed(1) + ' °C';
    if (unit.includes('oz')) return (value * 28.3495).toFixed(1) + ' g';
    if (unit.includes('lb') || unit.includes('pound')) return (value * 0.453592).toFixed(2) + ' kg';
    return null;
}

const compoundRegex = /(\d+)\s*(foot|ft)\s*(\d+)\s*(inch|in)/gi;
const simpleRegex = /(\d+(\.\d+)?)\s*(inch|inches|in|ft|foot|feet|mile|mph|F|°F|oz|ounces|lb|pound|pounds)/gi;

// =======================
// Overlay
// =======================
const overlay = document.createElement('div');
overlay.style.position = 'fixed';
overlay.style.top = '50px';
overlay.style.right = '20px';
overlay.style.width = '220px';
overlay.style.maxHeight = '90vh';
overlay.style.overflowY = 'auto';
overlay.style.background = 'rgba(0,0,50,0.6)';
overlay.style.color = '#fff';
overlay.style.fontFamily = 'Arial, sans-serif';
overlay.style.fontSize = '14px';
overlay.style.padding = '10px';
overlay.style.zIndex = '99999';
overlay.style.borderRadius = '8px';
overlay.style.pointerEvents = 'none';
document.body.appendChild(overlay);

// =======================
// Keep track of processed matches
// =======================
const processedMatches = new Set();

// =======================
// Get full caption text
// =======================
function getFullCaptionText(captionWindow) {
    let lines = [];
    const segments = captionWindow.querySelectorAll('.ytp-caption-segment, .caption-visual-line, span');
    segments.forEach(span => lines.push(span.innerText));
    return lines.join(' ').replace(/\s+/g, ' ').trim();
}

// =======================
// Get conversions
// =======================
function getConversionsOnly(text) {
    let results = [];
    text.replace(compoundRegex, (match, ftVal, ftUnit, inVal, inUnit) => {
        if (!processedMatches.has(match)) {
            let meters = ftVal * 0.3048 + inVal * 0.0254;
            results.push(`${meters.toFixed(2)} m`);
            processedMatches.add(match);
        }
        return match;
    });

    text.replace(simpleRegex, (match, num, _, unit) => {
        if (!processedMatches.has(match)) {
            const converted = convertSimpleUnit(parseFloat(num), unit);
            if (converted) {
                results.push(converted);
                processedMatches.add(match);
            }
        }
        return match;
    });

    return results;
}

// =======================
// Watch captions
// =======================
function watchCaptions(captionWindow) {
    const observer = new MutationObserver(() => {
        const text = getFullCaptionText(captionWindow);
        if (!captionWindow.dataset.lastText || captionWindow.dataset.lastText !== text) {
            captionWindow.dataset.lastText = text;
            const conversions = getConversionsOnly(text);
            conversions.forEach(conv => {
                const line = document.createElement('div');
                line.innerText = conv;
                line.style.opacity = '0';
                overlay.appendChild(line);

                // Fade in animation
                setTimeout(() => line.style.transition = 'opacity 0.5s', 0);
                setTimeout(() => line.style.opacity = '1', 50);

                // Auto-remove
                setTimeout(() => overlay.removeChild(line), 5000);
            });
        }
    });
    observer.observe(captionWindow, { childList: true, subtree: true });
}

// =======================
// Observe body for caption-window dynamically
// =======================
const bodyObserver = new MutationObserver(() => {
    const captionWindow = document.querySelector('.caption-window');
    if (captionWindow && !captionWindow.dataset.observed) {
        watchCaptions(captionWindow);
        captionWindow.dataset.observed = 'true';
    }
});
bodyObserver.observe(document.body, { childList: true, subtree: true });

// =======================
// Fallback interval
// =======================
setInterval(() => {
    const captionWindow = document.querySelector('.caption-window');
    if (captionWindow && !captionWindow.dataset.observed) {
        watchCaptions(captionWindow);
        captionWindow.dataset.observed = 'true';
    }
}, 1000);

// =======================
// Clear old processed matches periodically
// =======================
setInterval(() => processedMatches.clear(), 10000);
