const defaultUnits = [
    // Speed
    { name: "mph → km/h", example: "100 mph → 160.93 km/h" },
    { name: "ft/s → m/s", example: "10 ft/s → 3.05 m/s" },
    { name: "kn → km/h", example: "10 kn → 18.52 km/h" },

    // Distance
    { name: "in → cm", example: "10 in → 25.40 cm" },
    { name: "ft → m", example: "5 ft → 1.52 m" },
    { name: "yd → m", example: "3 yd → 2.74 m" },
    { name: "mile → km", example: "1 mile → 1.61 km" },
    { name: "mm → m", example: "1000 mm → 1 m" },
    { name: "cm → m", example: "100 cm → 1 m" },
    { name: "km → m", example: "2 km → 2000 m" },

    // Weight
    { name: "oz → g", example: "10 oz → 283.50 g" },
    { name: "lb → kg", example: "5 lb → 2.27 kg" },
    { name: "ton → kg", example: "1 ton → 907.18 kg" },

    // Volume
    { name: "gal → L", example: "1 gal → 3.79 L" },
    { name: "qt → L", example: "2 qt → 1.89 L" },
    { name: "pt → L", example: "1 pt → 0.47 L" },
    { name: "cup → L", example: "3 cups → 0.72 L" },

    // Temperature
    { name: "F → C", example: "100 F → 37.8 °C" },
    { name: "C → F", example: "25 C → 77.0 °F" },
    { name: "K → C", example: "300 K → 26.85 °C" },

    // Special feet+inches
    { name: "ft + in → m", example: "5 ft 3 in → 1.60 m" }
];

// Elementen ophalen
const overlayPosition = document.getElementById("overlayPosition");
const overlaySize = document.getElementById("overlaySize");
const sizeValue = document.getElementById("sizeValue");
const enableDetection = document.getElementById("enableDetection");
const defaultUnitsList = document.getElementById("defaultUnits");
const customUnitsList = document.getElementById("customUnits");
const addUnitBtn = document.getElementById("addUnit");

// Standaard eenheden tonen
function renderDefaultUnits() {
    defaultUnitsList.innerHTML = "";
    defaultUnits.forEach(unit => {
        const li = document.createElement("li");
        li.textContent = `${unit.name} (${unit.example})`;
        defaultUnitsList.appendChild(li);
    });
}

// Custom eenheden tonen
async function renderCustomUnits() {
    const { customUnits = [] } = await chrome.storage.sync.get("customUnits");
    customUnitsList.innerHTML = "";

    customUnits.forEach((unit, index) => {
        const li = document.createElement("li");
        li.textContent = `${unit.name}: ${unit.formula} → ${unit.output}`;

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "X";
        removeBtn.addEventListener("click", async () => {
            const updated = customUnits.filter((_, i) => i !== index);
            await chrome.storage.sync.set({ customUnits: updated });
            renderCustomUnits();
        });

        li.appendChild(removeBtn);
        customUnitsList.appendChild(li);
    });
}

// Custom eenheid toevoegen
addUnitBtn.addEventListener("click", async () => {
    const name = prompt("Naam van eenheid (bijv. 'gal'):");
    const formula = prompt("Formule, gebruik 'value' voor het getal. Voorbeeld: 'value * 3.78541'");
    const output = prompt("Uitkomsteenheid (bijv. 'L'):");

    if (!name || !formula || !output) return;

    const { customUnits = [] } = await chrome.storage.sync.get("customUnits");
    customUnits.push({ name, formula, output });

    await chrome.storage.sync.set({ customUnits });
    renderCustomUnits();
});

// Instellingen laden
async function loadSettings() {
    const settings = await chrome.storage.sync.get([
        "overlayPosition",
        "overlaySize",
        "enableDetection"
    ]);

    overlayPosition.value = settings.overlayPosition || "top-right";
    overlaySize.value = settings.overlaySize || 16;
    sizeValue.textContent = overlaySize.value;
    enableDetection.checked = settings.enableDetection !== false;

    renderDefaultUnits();
    renderCustomUnits();
}

// Instellingen opslaan bij verandering
overlayPosition.addEventListener("change", () => {
    chrome.storage.sync.set({ overlayPosition: overlayPosition.value });
});

overlaySize.addEventListener("input", () => {
    sizeValue.textContent = overlaySize.value;
    chrome.storage.sync.set({ overlaySize: parseInt(overlaySize.value) });
});

enableDetection.addEventListener("change", () => {
    chrome.storage.sync.set({ enableDetection: enableDetection.checked });
});

// Init
loadSettings();
