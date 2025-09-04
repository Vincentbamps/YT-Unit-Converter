const overlayPosition = document.getElementById("overlayPosition");
const overlaySize = document.getElementById("overlaySize");
const sizeValue = document.getElementById("sizeValue");
const enableDetection = document.getElementById("enableDetection");
const defaultUnitsList = document.getElementById("defaultUnits");
const customUnitsList = document.getElementById("customUnits");
const addUnitBtn = document.getElementById("addUnit");

// Updated default units list
const defaultUnits = [
    { name: "mph → km/h", example: "100 mph → 160.93 km/h" },
    { name: "ft/s → m/s", example: "10 ft/s → 3.05 m/s" },
    { name: "kn → km/h", example: "10 kn → 18.52 km/h" },

    { name: "in → cm", example: "10 in → 25.40 cm" },
    { name: "ft → m", example: "5 ft → 1.52 m" },
    { name: "yd → m", example: "3 yd → 2.74 m" },
    { name: "mile → km", example: "1 mile → 1.61 km" },
    { name: "cm → m", example: "100 cm → 1.00 m" },
    { name: "mm → m", example: "1000 mm → 1.00 m" },
    { name: "km → m", example: "1 km → 1000 m" },

    { name: "oz → g", example: "10 oz → 283.50 g" },
    { name: "lb → kg", example: "5 lb → 2.27 kg" },
    { name: "imperial ton → kg", example: "1 ton → 907.19 kg" },

    { name: "gal → L", example: "1 gal → 3.79 L" },
    { name: "qt → L", example: "2 qt → 1.89 L" },
    { name: "pt → L", example: "4 pt → 1.89 L" },
    { name: "cup → L", example: "2 cups → 0.48 L" },

    { name: "°F → °C", example: "212 °F → 100.0 °C" },
    { name: "°C → °F", example: "0 °C → 32.0 °F" },
    { name: "K → °C", example: "273.15 K → 0.0 °C" }
];


function renderDefaultUnits() {
    defaultUnitsList.innerHTML = "";
    defaultUnits.forEach(unit => {
        const li = document.createElement("li");
        li.textContent = `${unit.name} (${unit.example})`;
        defaultUnitsList.appendChild(li);
    });
}

async function renderCustomUnits() {
    const { customUnits = [] } = await chrome.storage.sync.get("customUnits");
    customUnitsList.innerHTML = "";

    customUnits.forEach((unit, index) => {
        const li = document.createElement("li");
        li.textContent = `${unit.name}: ${unit.formula} → ${unit.output}`;

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "X";
        removeBtn.style.marginLeft = "10px";
        removeBtn.style.background = "rgba(255,0,0,0.2)";
        removeBtn.style.border = "none";
        removeBtn.style.borderRadius = "6px";
        removeBtn.style.cursor = "pointer";

        removeBtn.addEventListener("click", async () => {
            const updated = customUnits.filter((_, i) => i !== index);
            await chrome.storage.sync.set({ customUnits: updated });
            renderCustomUnits();
        });

        li.appendChild(removeBtn);
        customUnitsList.appendChild(li);
    });
}

addUnitBtn.addEventListener("click", async () => {
    const name = prompt("Name of unit (e.g. 'gal'):");
    const formula = prompt("Formula, use 'value' for the number. Example: 'value * 3.78541'");
    const output = prompt("Output unit (e.g. 'L'):");

    if (!name || !formula || !output) return;

    const { customUnits = [] } = await chrome.storage.sync.get("customUnits");
    customUnits.push({ name, formula, output });

    await chrome.storage.sync.set({ customUnits });
    renderCustomUnits();
});

// Load settings
async function loadSettings() {
    const settings = await chrome.storage.sync.get([
        "overlayPosition",
        "overlaySize",
        "enableDetection"
    ]);

    // Set stored overlay position or fallback to top-right
    overlayPosition.value = settings.overlayPosition || "top-right";

    overlaySize.value = settings.overlaySize || 16;
    sizeValue.textContent = overlaySize.value;
    enableDetection.checked = settings.enableDetection !== false;

    renderDefaultUnits();
    renderCustomUnits();
}

// Save settings automatically when position changes
overlayPosition.addEventListener("change", async () => {
    await chrome.storage.sync.set({ overlayPosition: overlayPosition.value });
});

// Save size slider
overlaySize.addEventListener("input", async () => {
    sizeValue.textContent = overlaySize.value;
    await chrome.storage.sync.set({ overlaySize: parseInt(overlaySize.value) });
});

// Save detection toggle
enableDetection.addEventListener("change", async () => {
    await chrome.storage.sync.set({ enableDetection: enableDetection.checked });
});

loadSettings();
