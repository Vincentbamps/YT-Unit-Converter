// === Overlay maken ===
let overlay = document.createElement("div");
overlay.id = "yt-unit-converter-overlay";
document.body.appendChild(overlay);

// === Overlay stijl bijwerken ===
function updateOverlayStyle(settings) {
    overlay.style.position = "fixed";
    overlay.style.zIndex = "999999";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    overlay.style.color = "#fff";
    overlay.style.padding = "10px";
    overlay.style.borderRadius = "8px";
    overlay.style.fontFamily = "Arial, sans-serif";
    overlay.style.fontSize = `${settings.overlaySize || 16}px`;
    overlay.style.maxWidth = "300px";
    overlay.style.lineHeight = "1.5";
    overlay.style.whiteSpace = "pre-wrap";

    // Overlaypositie instellen
    const pos = settings.overlayPosition || "top-right";
    overlay.style.top = pos.includes("top") ? "10px" : "unset";
    overlay.style.bottom = pos.includes("bottom") ? "10px" : "unset";
    overlay.style.left = pos.includes("left") ? "10px" : "unset";
    overlay.style.right = pos.includes("right") ? "10px" : "unset";
}

// === Standaard eenheden ===
let baseUnits = [
    { regex: /(\d+(?:\.\d+)?)\s?(mph|miles per hour)/gi, convert: v => `${(v * 1.60934).toFixed(2)} km/h` },
    { regex: /(\d+(?:\.\d+)?)\s?(ft\/s|feet per second)/gi, convert: v => `${(v * 0.3048).toFixed(2)} m/s` },
    { regex: /(\d+(?:\.\d+)?)\s?(kn|knots)/gi, convert: v => `${(v * 1.852).toFixed(2)} km/h` },

    { regex: /(\d+(?:\.\d+)?)\s?(in|inch|inches)/gi, convert: v => `${(v * 2.54).toFixed(2)} cm` },
    { regex: /(\d+(?:\.\d+)?)\s?(ft|feet|foot)/gi, convert: v => `${(v * 0.3048).toFixed(2)} m` },
    { regex: /(\d+(?:\.\d+)?)\s?(yd|yard|yards)/gi, convert: v => `${(v * 0.9144).toFixed(2)} m` },
    { regex: /(\d+(?:\.\d+)?)\s?(mile|miles)/gi, convert: v => `${(v * 1.60934).toFixed(2)} km` },
    { regex: /(\d+(?:\.\d+)?)\s?(cm|centimeter|centimeters)/gi, convert: v => `${(v / 100).toFixed(2)} m` },
    { regex: /(\d+(?:\.\d+)?)\s?(mm|millimeter|millimeters)/gi, convert: v => `${(v / 1000).toFixed(2)} m` },
    { regex: /(\d+(?:\.\d+)?)\s?(km|kilometer|kilometers)/gi, convert: v => `${(v * 1000).toFixed(2)} m` },

    { regex: /(\d+(?:\.\d+)?)\s?(oz|ounces)/gi, convert: v => `${(v * 28.3495).toFixed(2)} g` },
    { regex: /(\d+(?:\.\d+)?)\s?(lb|lbs|pounds)/gi, convert: v => `${(v * 0.453592).toFixed(2)} kg` },
    { regex: /(\d+(?:\.\d+)?)\s?(ton|tons)/gi, convert: v => `${(v * 907.185).toFixed(2)} kg` },

    { regex: /(\d+(?:\.\d+)?)\s?(gal|gallon|gallons)/gi, convert: v => `${(v * 3.78541).toFixed(2)} L` },
    { regex: /(\d+(?:\.\d+)?)\s?(qt|quart|quarts)/gi, convert: v => `${(v * 0.946353).toFixed(2)} L` },
    { regex: /(\d+(?:\.\d+)?)\s?(pt|pint|pints)/gi, convert: v => `${(v * 0.473176).toFixed(2)} L` },
    { regex: /(\d+(?:\.\d+)?)\s?(cup|cups)/gi, convert: v => `${(v * 0.24).toFixed(2)} L` },

    { regex: /(\d+(?:\.\d+)?)\s?F/gi, convert: v => `${((v - 32) * 5/9).toFixed(1)} °C` },
    { regex: /(\d+(?:\.\d+)?)\s?C/gi, convert: v => `${(v * 9/5 + 32).toFixed(1)} °F` },
    { regex: /(\d+(?:\.\d+)?)\s?K/gi, convert: v => `${(v - 273.15).toFixed(1)} °C` }


];

// === Caption cache ===
let lastCaption = "";
let lastConversions = "";

// === Functie: combineer feet + inches ===
function convertFeetInches(text) {
    const regex = /(\d+)\s?(?:ft|feet|foot)\s?(\d+)\s?(?:in|inch|inches)/gi;
    let results = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
        const feet = parseFloat(match[1]);
        const inches = parseFloat(match[2]);
        const meters = ((feet * 12 + inches) * 2.54) / 100;
        results.push(`${match[0]} → ${meters.toFixed(2)} m`);
    }
    return results;
}


// === Functie: captions verwerken ===
async function processCaptions() {
    const settings = await chrome.storage.sync.get([
        "overlayPosition",
        "overlaySize",
        "enableDetection",
        "customUnits"
    ]);

    updateOverlayStyle(settings);

    if (settings.enableDetection === false) {
        overlay.innerText = "";
        return;
    }

    // Alle caption-elementen ophalen
    const captionNodes = document.querySelectorAll(".captions-text, .ytp-caption-segment");
    if (!captionNodes.length) {
        overlay.innerText = "";
        return;
    }

    // Tekst samenvoegen → line breaks vervangen door spaties
    const captionText = Array.from(captionNodes)
        .map(n => n.innerText.trim())
        .join(" ")
        .replace(/\s+/g, " "); // dubbele spaties vermijden

    // Check of tekst hetzelfde is als vorige keer
    if (captionText === lastCaption) return;
    lastCaption = captionText;

    let conversions = [];

    // Eerst feet + inches detecteren
    conversions.push(...convertFeetInches(captionText));

    // Daarna standaard eenheden
    const allUnits = [...baseUnits];

    // Custom eenheden toevoegen
    if (settings.customUnits && Array.isArray(settings.customUnits)) {
        settings.customUnits.forEach(u => {
            try {
                const dynamicRegex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s?(${u.name})`, "gi");
                allUnits.push({
                    regex: dynamicRegex,
                    convert: v => {
                        const formula = new Function("value", `return ${u.formula}`);
                        return `${formula(v).toFixed(2)} ${u.output}`;
                    }
                });
            } catch (e) {
                console.warn(`Fout in custom unit: ${u.name}`, e);
            }
        });
    }

    // Conversies uitvoeren voor alle andere eenheden
    for (const unit of allUnits) {
        let match;
        while ((match = unit.regex.exec(captionText)) !== null) {
            const value = parseFloat(match[1]);
            if (!isNaN(value)) {
                const converted = unit.convert(value);
                if (!conversions.includes(`${match[0]} → ${converted}`)) {
                    conversions.push(`${match[0]} → ${converted}`);
                }
            }
        }
    }

    // Alleen updaten als er nieuwe conversies zijn
    const newConversions = conversions.join("\n");
    if (newConversions === lastConversions) return;

    lastConversions = newConversions;
    overlay.innerText = newConversions || "";
}

// === Interval elke 300ms ===
setInterval(processCaptions, 300);
