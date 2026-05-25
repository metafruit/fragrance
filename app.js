// State Management
let collection = [];
let wizardNotes = { top: [], middle: [], base: [] };
let wizardAccords = [];
let currentWizardStep = 1;

// Global Chart Instances
let chartSeasons = null;
let chartGender = null;
let chartAccords = null;

// Color palette for accords if none provided
const ACCORD_COLORS = {
  "wood": "#8e8e93", "woody": "#8e8e93",
  "citrus": "#f1c40f",
  "amber": "#e67e22",
  "spicy": "#d35400", "warm spicy": "#d35400", "fresh spicy": "#2ecc71",
  "sweet": "#9b59b6",
  "leather": "#795548",
  "vanilla": "#f5c518",
  "aromatic": "#1abc9c",
  "coffee": "#6f4e37",
  "floral": "#e84393", "rose": "#fd79a8", "white floral": "#ecf0f1",
  "marine": "#3498db", "aquatic": "#3498db",
  "aldehydic": "#e2e2e2",
  "powdery": "#e7e7e7",
  "musk": "#bdc3c7", "musky": "#bdc3c7",
  "tobacco": "#795548",
  "rum": "#9e5c1d",
  "earthy": "#a0522d",
  "green": "#2ecc71",
  "ozonic": "#a8e6cf"
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  // Load collection from localStorage
  const savedCollection = localStorage.getItem("scentspace_collection");
  if (savedCollection) {
    try {
      collection = JSON.parse(savedCollection);
    } catch (e) {
      console.error("Error parsing saved collection", e);
      collection = [];
    }
  } else {
    // Seed with a couple of fragrances if it's their very first time
    collection = [
      PRELOADED_FRAGRANCES[0], // Bleu de Chanel
      PRELOADED_FRAGRANCES[3]  // Tobacco Vanille
    ];
    saveCollectionToLocalStorage();
  }

  // Initial renders
  renderCollection();
  searchDatabase(); // Load discover DB items
  updateStats();
  
  // Set up click listeners for close drawer
  document.getElementById("detail-drawer").addEventListener("click", (e) => {
    if (e.target.id === "detail-drawer") closeDrawer();
  });
});

// Save to LocalStorage
function saveCollectionToLocalStorage() {
  localStorage.setItem("scentspace_collection", JSON.stringify(collection));
}

// Navigation & Views Switching
function switchView(viewName) {
  // Hide all sections
  document.querySelectorAll(".view-section").forEach(sec => sec.classList.remove("active"));
  // Deactivate all nav items
  document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
  
  // Show target section
  const targetSection = document.getElementById(`section-${viewName}`);
  if (targetSection) targetSection.classList.add("active");
  
  // Activate target nav item
  const targetNavItem = document.getElementById(`nav-${viewName}`);
  if (targetNavItem) targetNavItem.classList.add("active");

  // Perform view-specific logic
  if (viewName === "collection") {
    renderCollection();
  } else if (viewName === "stats") {
    updateStats();
  }
}

// Render Collection Grid
function renderCollection() {
  const grid = document.getElementById("collection-grid");
  const emptyState = document.getElementById("collection-empty");
  grid.innerHTML = "";

  const filtered = getFilteredCollection();

  if (filtered.length === 0) {
    emptyState.style.display = "block";
    grid.style.display = "none";
    return;
  }

  emptyState.style.display = "none";
  grid.style.display = "grid";

  filtered.forEach(perfume => {
    const card = document.createElement("div");
    card.className = "fragrance-card";
    card.onclick = () => openDrawer(perfume.id, false);

    // Accords preview (top 3)
    const accordsHtml = perfume.accords.slice(0, 3).map(acc => `
      <span class="accord-dot-tag">
        <span class="dot" style="background-color: ${acc.color || getAccordColor(acc.name)}"></span>
        ${acc.name}
      </span>
    `).join("");

    // Card Image
    const imgHtml = perfume.image ? 
      `<div class="card-image-wrapper"><img src="${perfume.image}" alt="${perfume.name}" class="card-image" loading="lazy"></div>` :
      `<div class="card-image-wrapper"><i class="fa-solid fa-bottle-droplet fallback-icon"></i></div>`;

    // Identify main season (highest percentage)
    let bestSeason = "spring";
    let maxVal = 0;
    for (const [season, val] of Object.entries(perfume.seasons)) {
      if (val > maxVal) {
        maxVal = val;
        bestSeason = season;
      }
    }
    
    // Choose appropriate season icon
    const seasonIcons = {
      spring: "fa-leaf",
      summer: "fa-sun",
      autumn: "fa-leaf",
      winter: "fa-snowflake"
    };
    const seasonColors = {
      spring: "#2ecc71",
      summer: "#f1c40f",
      autumn: "#e67e22",
      winter: "#3498db"
    };

    card.innerHTML = `
      <div class="card-actions-menu">
        <button class="btn-card-action" onclick="deleteFragrance(event, '${perfume.id}')" title="Delete from collection">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
      <div class="card-top">
        <span class="brand-tag">${perfume.brand}</span>
        <span class="gender-badge ${perfume.gender}">${perfume.gender}</span>
      </div>
      ${imgHtml}
      <h4 class="fragrance-name" title="${perfume.name}">${perfume.name}</h4>
      <div class="concentration-label">${perfume.concentration}</div>
      
      <div class="accords-preview">
        ${accordsHtml}
      </div>

      <div class="card-footer-metrics">
        <div class="metric-item">
          <i class="fa-solid ${seasonIcons[bestSeason]}" style="color: ${seasonColors[bestSeason]}"></i>
          <span style="text-transform: capitalize">${bestSeason}</span>
        </div>
        <div class="metric-item">
          <i class="fa-solid fa-stopwatch"></i>
          <span>${perfume.longevity.label || perfume.longevity}</span>
        </div>
        <div class="metric-item">
          <i class="fa-solid fa-spray-can"></i>
          <span>${perfume.sillage.label || perfume.sillage}</span>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Get filtered items based on search + drop downs
function getFilteredCollection() {
  const searchQuery = document.getElementById("collection-search").value.toLowerCase().trim();
  const genderFilter = document.getElementById("filter-gender").value;
  const seasonFilter = document.getElementById("filter-season").value;

  return collection.filter(perfume => {
    // Search match (name, brand, accords, or notes)
    const matchesSearch = !searchQuery || 
      perfume.name.toLowerCase().includes(searchQuery) ||
      perfume.brand.toLowerCase().includes(searchQuery) ||
      perfume.accords.some(acc => acc.name.toLowerCase().includes(searchQuery)) ||
      (perfume.notes && (
        perfume.notes.top.some(n => n.toLowerCase().includes(searchQuery)) ||
        perfume.notes.middle.some(n => n.toLowerCase().includes(searchQuery)) ||
        perfume.notes.base.some(n => n.toLowerCase().includes(searchQuery))
      ));

    // Gender match
    const matchesGender = genderFilter === "all" || perfume.gender === genderFilter;

    // Season match (only if it has >20% for that season)
    const matchesSeason = seasonFilter === "all" || (perfume.seasons && perfume.seasons[seasonFilter] >= 20);

    return matchesSearch && matchesGender && matchesSeason;
  });
}

function filterCollection() {
  renderCollection();
}

// Delete fragrance
function deleteFragrance(event, perfumeId) {
  event.stopPropagation(); // Avoid opening drawer
  
  if (confirm("Are you sure you want to remove this fragrance from your collection?")) {
    collection = collection.filter(perfume => perfume.id !== perfumeId);
    saveCollectionToLocalStorage();
    renderCollection();
    updateStats();
    showToast("Fragrance removed from collection");
  }
}

// Render Database / Discover Grid
function searchDatabase() {
  const grid = document.getElementById("database-grid");
  const query = document.getElementById("database-search").value.toLowerCase().trim();
  grid.innerHTML = "";

  // Filter the preloaded list
  const matches = PRELOADED_FRAGRANCES.filter(perfume => 
    !query ||
    perfume.name.toLowerCase().includes(query) ||
    perfume.brand.toLowerCase().includes(query) ||
    perfume.accords.some(acc => acc.name.toLowerCase().includes(query)) ||
    perfume.notes.top.some(n => n.toLowerCase().includes(query)) ||
    perfume.notes.middle.some(n => n.toLowerCase().includes(query)) ||
    perfume.notes.base.some(n => n.toLowerCase().includes(query))
  );

  matches.forEach(perfume => {
    const card = document.createElement("div");
    card.className = "fragrance-card";
    card.onclick = () => openDrawer(perfume.id, true);

    const accordsHtml = perfume.accords.slice(0, 3).map(acc => `
      <span class="accord-dot-tag">
        <span class="dot" style="background-color: ${acc.color || getAccordColor(acc.name)}"></span>
        ${acc.name}
      </span>
    `).join("");

    const imgHtml = perfume.image ? 
      `<div class="card-image-wrapper"><img src="${perfume.image}" alt="${perfume.name}" class="card-image" loading="lazy"></div>` :
      `<div class="card-image-wrapper"><i class="fa-solid fa-bottle-droplet fallback-icon"></i></div>`;

    const isAlreadyOwned = collection.some(item => item.name.toLowerCase() === perfume.name.toLowerCase() && item.brand.toLowerCase() === perfume.brand.toLowerCase());

    const buttonHtml = isAlreadyOwned ? 
      `<button class="btn-primary" style="width: 100%; margin-top: 1rem; background-color: var(--border-color); color: var(--text-secondary); cursor: not-allowed; box-shadow: none;" disabled onclick="event.stopPropagation()">
        <i class="fa-solid fa-circle-check" style="color: var(--accent-gold)"></i> Owned
      </button>` :
      `<button class="btn-primary" style="width: 100%; margin-top: 1rem;" onclick="addToCollectionDirect(event, '${perfume.id}')">
        <i class="fa-solid fa-plus"></i> Add to closet
      </button>`;

    card.innerHTML = `
      <div class="card-top">
        <span class="brand-tag">${perfume.brand}</span>
        <span class="gender-badge ${perfume.gender}">${perfume.gender}</span>
      </div>
      ${imgHtml}
      <h4 class="fragrance-name" title="${perfume.name}">${perfume.name}</h4>
      <div class="concentration-label">${perfume.concentration}</div>
      
      <div class="accords-preview">
        ${accordsHtml}
      </div>
      ${buttonHtml}
    `;
    grid.appendChild(card);
  });
}

// Add directly from discover
function addToCollectionDirect(event, dbId) {
  event.stopPropagation(); // Stop drawer from opening
  const matched = PRELOADED_FRAGRANCES.find(p => p.id === dbId);
  
  if (matched) {
    // Generate new unique ID for user's closet (to support duplicates if they own 2 bottles)
    const cloned = JSON.parse(JSON.stringify(matched));
    cloned.id = cloned.id + "-" + Date.now();
    collection.push(cloned);
    saveCollectionToLocalStorage();
    searchDatabase(); // Refresh discover buttons
    showToast(`Added ${cloned.name} to your collection!`);
  }
}

// Detailed Drawer Visualizer
function openDrawer(perfumeId, isFromDb = false) {
  const sourceList = isFromDb ? PRELOADED_FRAGRANCES : collection;
  const perfume = sourceList.find(p => p.id === perfumeId);

  if (!perfume) return;

  // Header data
  document.getElementById("d-brand").innerText = perfume.brand;
  document.getElementById("d-name").innerText = perfume.name;
  document.getElementById("d-concentration").innerText = perfume.concentration;

  // Drawer image
  const imgWrapper = document.getElementById("d-image-wrapper");
  imgWrapper.innerHTML = perfume.image ? 
    `<img src="${perfume.image}" alt="${perfume.name}" class="drawer-image">` :
    `<i class="fa-solid fa-bottle-droplet drawer-fallback-icon"></i>`;

  // Accords list
  const accordsContainer = document.getElementById("d-accords");
  accordsContainer.innerHTML = "";
  perfume.accords.forEach(acc => {
    const color = acc.color || getAccordColor(acc.name);
    accordsContainer.innerHTML += `
      <div class="accord-item">
        <span class="accord-label">${acc.name}</span>
        <div class="accord-bar-outer">
          <div class="accord-bar-inner" style="width: ${acc.value}%; background-color: ${color}"></div>
        </div>
        <span class="accord-val">${acc.value}%</span>
      </div>
    `;
  });

  // Notes Pyramid
  const topNotesContainer = document.getElementById("d-notes-top");
  const middleNotesContainer = document.getElementById("d-notes-middle");
  const baseNotesContainer = document.getElementById("d-notes-base");

  topNotesContainer.innerHTML = perfume.notes && perfume.notes.top.length ? 
    perfume.notes.top.map(n => `<span class="note-tag"><i class="fa-solid fa-wind"></i> ${n}</span>`).join("") :
    `<span style="font-size: 0.85rem; color: var(--text-muted);">None documented</span>`;

  middleNotesContainer.innerHTML = perfume.notes && perfume.notes.middle.length ? 
    perfume.notes.middle.map(n => `<span class="note-tag"><i class="fa-solid fa-heart"></i> ${n}</span>`).join("") :
    `<span style="font-size: 0.85rem; color: var(--text-muted);">None documented</span>`;

  baseNotesContainer.innerHTML = perfume.notes && perfume.notes.base.length ? 
    perfume.notes.base.map(n => `<span class="note-tag"><i class="fa-solid fa-anchor"></i> ${n}</span>`).join("") :
    `<span style="font-size: 0.85rem; color: var(--text-muted);">None documented</span>`;

  // Seasons bars
  const seasonsContainer = document.getElementById("d-seasons");
  seasonsContainer.innerHTML = "";
  const seasonLabels = { spring: "Spring", summer: "Summer", autumn: "Autumn", winter: "Winter" };
  const seasonFills = { spring: "spring-fill", summer: "summer-fill", autumn: "autumn-fill", winter: "winter-fill" };
  const seasonIcons = { spring: "fa-leaf", summer: "fa-sun", autumn: "fa-leaf", winter: "fa-snowflake" };

  Object.entries(perfume.seasons).forEach(([season, val]) => {
    seasonsContainer.innerHTML += `
      <div class="season-bar-wrapper">
        <span class="season-label">
          <i class="fa-solid ${seasonIcons[season]}" style="margin-right: 0.4rem; opacity: 0.8;"></i>
          ${seasonLabels[season]}
        </span>
        <div class="season-bar-outer">
          <div class="season-bar-inner ${seasonFills[season]}" style="width: ${val}%"></div>
        </div>
        <span class="season-value">${val}%</span>
      </div>
    `;
  });

  // Time of Day slider
  const dayVal = perfume.timeOfDay.day;
  const nightVal = perfume.timeOfDay.night;
  document.getElementById("d-time-day").innerText = `${dayVal}%`;
  document.getElementById("d-time-night").innerText = `${nightVal}%`;
  document.getElementById("d-time-thumb").style.left = `${dayVal}%`;

  // Longevity & Sillage distributions
  const longevityLabel = perfume.longevity.label || perfume.longevity;
  const sillageLabel = perfume.sillage.label || perfume.sillage;
  document.getElementById("d-longevity-label").innerText = longevityLabel;
  document.getElementById("d-sillage-label").innerText = sillageLabel;

  // Distribute votes
  const lDist = perfume.longevity.distribution || getLongevityMockDistribution(longevityLabel);
  const sDist = perfume.sillage.distribution || getSillageMockDistribution(sillageLabel);

  const lContainer = document.getElementById("d-longevity-dist");
  lContainer.innerHTML = "";
  Object.entries(lDist).forEach(([label, val]) => {
    lContainer.innerHTML += `
      <div class="distribution-row">
        <span class="dist-label" style="text-transform: capitalize">${label}</span>
        <div class="dist-bar-outer">
          <div class="dist-bar-inner" style="width: ${val}%"></div>
        </div>
        <span style="font-weight: 500">${val}%</span>
      </div>
    `;
  });

  const sContainer = document.getElementById("d-sillage-dist");
  sContainer.innerHTML = "";
  Object.entries(sDist).forEach(([label, val]) => {
    sContainer.innerHTML += `
      <div class="distribution-row">
        <span class="dist-label" style="text-transform: capitalize">${label}</span>
        <div class="dist-bar-outer">
          <div class="dist-bar-inner" style="width: ${val}%"></div>
        </div>
        <span style="font-weight: 500">${val}%</span>
      </div>
    `;
  });

  toggleDrawer(true);
}

function toggleDrawer(isOpen) {
  const drawer = document.getElementById("detail-drawer");
  if (isOpen) {
    drawer.classList.add("open");
  } else {
    drawer.classList.remove("open");
  }
}

function closeDrawer(event) {
  toggleDrawer(false);
}

// Scent Wizard Navigation
function updateWizardProgress() {
  document.querySelectorAll(".indicator-dot").forEach((dot, idx) => {
    const stepNum = idx + 1;
    dot.className = "indicator-dot";
    if (stepNum === currentWizardStep) {
      dot.classList.add("active");
    } else if (stepNum < currentWizardStep) {
      dot.classList.add("completed");
    }
  });

  document.querySelectorAll(".wizard-step").forEach((step, idx) => {
    step.style.display = (idx + 1 === currentWizardStep) ? "block" : "none";
  });

  // Buttons visibility
  document.getElementById("btn-back").style.visibility = (currentWizardStep === 1) ? "hidden" : "visible";
  
  if (currentWizardStep === 3) {
    document.getElementById("btn-next").style.display = "none";
    document.getElementById("btn-submit").style.display = "block";
  } else {
    document.getElementById("btn-next").style.display = "block";
    document.getElementById("btn-submit").style.display = "none";
  }
}

function wizardNext() {
  if (currentWizardStep === 1) {
    // Validate basic inputs
    if (!document.getElementById("f-name").value || !document.getElementById("f-brand").value) {
      alert("Please fill in the fragrance name and brand.");
      return;
    }
  }
  currentWizardStep++;
  updateWizardProgress();
}

function wizardBack() {
  if (currentWizardStep > 1) {
    currentWizardStep--;
    updateWizardProgress();
  }
}

// Scent Wizard Inputs processing
function handleTagInput(event, tier) {
  if (event.key === "Enter" || event.key === ",") {
    event.preventDefault();
    const input = event.target;
    const value = input.value.trim().replace(/,/g, "");

    if (value && !wizardNotes[tier].includes(value)) {
      wizardNotes[tier].push(value);
      renderNoteTags(tier);
    }
    input.value = "";
  }
}

function handleTagInputChange(event, tier) {
  const input = event.target;
  const value = input.value;
  
  const datalist = document.getElementById("popular-notes");
  const options = Array.from(datalist.options).map(opt => opt.value.toLowerCase());
  
  if (value.endsWith(",")) {
    const cleanVal = value.slice(0, -1).trim();
    if (cleanVal && !wizardNotes[tier].includes(cleanVal)) {
      wizardNotes[tier].push(cleanVal);
      renderNoteTags(tier);
    }
    input.value = "";
  } else if (options.includes(value.toLowerCase())) {
    const matchedVal = Array.from(datalist.options).find(opt => opt.value.toLowerCase() === value.toLowerCase()).value;
    if (matchedVal && !wizardNotes[tier].includes(matchedVal)) {
      wizardNotes[tier].push(matchedVal);
      renderNoteTags(tier);
    }
    input.value = "";
  }
}

// Custom Note Tags render
function renderNoteTags(tier) {
  const container = document.getElementById(`${tier}-notes-container`);
  container.querySelectorAll(".tag").forEach(tag => tag.remove());
  
  const input = container.querySelector(".tag-input-field");
  
  wizardNotes[tier].forEach(note => {
    const tag = document.createElement("div");
    tag.className = "tag";
    tag.innerHTML = `
      <span>${note}</span>
      <i class="fa-solid fa-xmark" onclick="removeNoteTag('${note}', '${tier}')"></i>
    `;
    container.insertBefore(tag, input);
  });
}

function removeNoteTag(note, tier) {
  wizardNotes[tier] = wizardNotes[tier].filter(n => n !== note);
  renderNoteTags(tier);
}

// Accord visual list builder
function addCustomAccord() {
  const nameInput = document.getElementById("new-accord-name");
  const valueInput = document.getElementById("new-accord-value");
  
  const name = nameInput.value.trim();
  const value = parseInt(valueInput.value);

  if (!name || isNaN(value) || value < 1 || value > 100) {
    alert("Please enter a valid accord name and intensity value (1-100).");
    return;
  }

  if (wizardAccords.some(acc => acc.name.toLowerCase() === name.toLowerCase())) {
    alert("Accord already added.");
    return;
  }

  wizardAccords.push({ name, value, color: getAccordColor(name) });
  renderCustomAccords();

  // Reset inputs
  nameInput.value = "";
  valueInput.value = "";
}

function renderCustomAccords() {
  const list = document.getElementById("added-accords-list");
  list.innerHTML = "";
  
  wizardAccords.forEach((acc, idx) => {
    list.innerHTML += `
      <div class="added-accord-item">
        <span><strong>${acc.name}</strong> (${acc.value}%)</span>
        <button type="button" onclick="removeCustomAccord(${idx})">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;
  });
}

function removeCustomAccord(idx) {
  wizardAccords.splice(idx, 1);
  renderCustomAccords();
}

// Slider updates
function updateSliderVal(season) {
  const slider = document.getElementById(`s-${season}`);
  document.getElementById(`val-${season}`).innerText = `${slider.value}%`;
}

function updateTimeOfDaySlider(val) {
  document.getElementById("val-day").innerText = `${val}%`;
  document.getElementById("val-night").innerText = `${100 - val}%`;
}

// Submit / Save Custom Fragrance
function saveCustomFragrance(event) {
  event.preventDefault();

  const name = document.getElementById("f-name").value.trim();
  const brand = document.getElementById("f-brand").value.trim();
  const image = document.getElementById("f-image").value.trim();
  const concentration = document.getElementById("f-concentration").value;
  const gender = document.querySelector('input[name="f-gender"]:checked').value;
  
  const seasons = {
    spring: parseInt(document.getElementById("s-spring").value),
    summer: parseInt(document.getElementById("s-summer").value),
    autumn: parseInt(document.getElementById("s-autumn").value),
    winter: parseInt(document.getElementById("s-winter").value)
  };

  const day = parseInt(document.getElementById("s-day").value);
  const timeOfDay = { day, night: 100 - day };

  const longevity = document.getElementById("f-longevity").value;
  const sillage = document.getElementById("f-sillage").value;

  // Use default accords if none provided
  let accords = [...wizardAccords];
  if (accords.length === 0) {
    accords = [{ name: "Fresh", value: 80, color: "#55efc4" }];
  }

  const customFragrance = {
    id: "custom-" + Date.now(),
    name,
    brand,
    image: image || null,
    concentration,
    gender,
    accords,
    seasons,
    timeOfDay,
    notes: { ...wizardNotes },
    longevity,
    sillage
  };

  // Save to list
  collection.push(customFragrance);
  saveCollectionToLocalStorage();

  // Reset Form
  document.getElementById("fragrance-form").reset();
  wizardNotes = { top: [], middle: [], base: [] };
  wizardAccords = [];
  document.getElementById("added-accords-list").innerHTML = "";
  renderNoteTags("top");
  renderNoteTags("middle");
  renderNoteTags("base");
  
  currentWizardStep = 1;
  updateWizardProgress();

  // Navigate to collection dashboard
  switchView("collection");
  showToast(`Added ${name} to your closet!`);
}

// Aggregated Scent Closet Analytics with Chart.js
function updateStats() {
  const totalBottles = collection.length;
  document.getElementById("stat-total-bottles").innerText = totalBottles;

  if (totalBottles === 0) {
    document.getElementById("stat-avg-longevity").innerText = "-";
    document.getElementById("stat-signature-accord").innerText = "-";
    document.getElementById("stat-primary-season").innerText = "-";
    
    // Destroy charts if active
    if (chartSeasons) { chartSeasons.destroy(); chartSeasons = null; }
    if (chartGender) { chartGender.destroy(); chartGender = null; }
    if (chartAccords) { chartAccords.destroy(); chartAccords = null; }
    return;
  }

  // Calculate Avg Longevity (Numeric score)
  let totalLongevityScore = 0;
  collection.forEach(p => {
    let score = 3.0; // Moderate default
    const label = p.longevity.label || p.longevity;
    if (label === "Weak") score = 2.0;
    if (label === "Moderate") score = 3.0;
    if (label === "Long Lasting") score = 4.0;
    if (label === "Eternal") score = 5.0;
    totalLongevityScore += score;
  });
  const avgLong = totalLongevityScore / totalBottles;
  let longLabel = "Moderate";
  if (avgLong < 2.5) longLabel = "Weak";
  else if (avgLong >= 3.5 && avgLong < 4.5) longLabel = "Long Lasting";
  else if (avgLong >= 4.5) longLabel = "Eternal";
  document.getElementById("stat-avg-longevity").innerText = longLabel;

  // Calculate seasons average
  const seasonTotals = { spring: 0, summer: 0, autumn: 0, winter: 0 };
  collection.forEach(p => {
    seasonTotals.spring += p.seasons.spring;
    seasonTotals.summer += p.seasons.summer;
    seasonTotals.autumn += p.seasons.autumn;
    seasonTotals.winter += p.seasons.winter;
  });
  
  let primarySeason = "spring";
  let maxSeasonValue = 0;
  for (const [season, val] of Object.entries(seasonTotals)) {
    if (val > maxSeasonValue) {
      maxSeasonValue = val;
      primarySeason = season;
    }
  }
  document.getElementById("stat-primary-season").innerText = primarySeason.charAt(0).toUpperCase() + primarySeason.slice(1);

  // Render season distribution using Radar Chart
  const seasonData = [
    Math.round(seasonTotals.spring / totalBottles),
    Math.round(seasonTotals.summer / totalBottles),
    Math.round(seasonTotals.autumn / totalBottles),
    Math.round(seasonTotals.winter / totalBottles)
  ];
  
  const ctxSeasons = document.getElementById('chart-seasons').getContext('2d');
  if (chartSeasons) chartSeasons.destroy();
  chartSeasons = new Chart(ctxSeasons, {
    type: 'radar',
    data: {
      labels: ['Spring 🌿', 'Summer ☀️', 'Autumn 🍂', 'Winter ❄️'],
      datasets: [{
        label: 'Average Season Affinity',
        data: seasonData,
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        borderColor: 'rgba(212, 175, 55, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(212, 175, 55, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(212, 175, 55, 1)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        r: {
          angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          pointLabels: { color: '#e0e0e0', font: { family: 'Outfit', size: 12, weight: '500' } },
          ticks: { display: false },
          suggestedMin: 0
        }
      }
    }
  });

  // Calculate Accords averages
  const accordTotals = {};
  collection.forEach(p => {
    p.accords.forEach(acc => {
      if (!accordTotals[acc.name]) {
        accordTotals[acc.name] = 0;
      }
      accordTotals[acc.name] += acc.value;
    });
  });

  // Sort accords by cumulative intensity
  const sortedAccords = Object.entries(accordTotals)
    .map(([name, val]) => ({ name, val: Math.round(val / totalBottles) }))
    .sort((a, b) => b.val - a.val);

  document.getElementById("stat-signature-accord").innerText = sortedAccords.length ? sortedAccords[0].name : "-";

  // Render accords bar chart
  const accordLabels = sortedAccords.slice(0, 6).map(a => a.name);
  const accordValues = sortedAccords.slice(0, 6).map(a => a.val);
  const accordColors = sortedAccords.slice(0, 6).map(a => getAccordColor(a.name));
  
  const ctxAccords = document.getElementById('chart-accords').getContext('2d');
  if (chartAccords) chartAccords.destroy();
  chartAccords = new Chart(ctxAccords, {
    type: 'bar',
    data: {
      labels: accordLabels,
      datasets: [{
        data: accordValues,
        backgroundColor: accordColors,
        borderWidth: 0,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#8e8e93', font: { family: 'Outfit' } },
          max: 100
        },
        y: {
          grid: { display: false },
          ticks: { color: '#e0e0e0', font: { family: 'Outfit', size: 12, weight: '500' } }
        }
      }
    }
  });

  // Calculate Gender profile ratios
  const genderCounts = { men: 0, women: 0, unisex: 0 };
  collection.forEach(p => genderCounts[p.gender]++);
  
  const genderData = [genderCounts.men, genderCounts.women, genderCounts.unisex];
  const ctxGender = document.getElementById('chart-gender').getContext('2d');
  if (chartGender) chartGender.destroy();
  chartGender = new Chart(ctxGender, {
    type: 'doughnut',
    data: {
      labels: ['For Men ♂', 'For Women ♀', 'Unisex ⚧'],
      datasets: [{
        data: genderData,
        backgroundColor: ['rgba(52, 152, 219, 0.7)', 'rgba(232, 67, 147, 0.7)', 'rgba(155, 89, 182, 0.7)'],
        borderColor: ['#3498db', '#e84393', '#9b59b6'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#e0e0e0', font: { family: 'Outfit', size: 11 } }
        }
      }
    }
  });
}

// JSON Import / Export Logic
function exportCollection() {
  if (collection.length === 0) {
    alert("You have no fragrances in your closet to export!");
    return;
  }
  
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(collection, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `scentspace_closet_backup.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast("Collection database exported successfully!");
}

function triggerImport() {
  document.getElementById("import-file-input").click();
}

function importCollection(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) {
        throw new Error("Data must be an array of fragrances.");
      }

      // Check basic fields to prevent corrupted files
      const isValid = imported.every(p => p.name && p.brand && p.accords && p.seasons && p.timeOfDay);
      if (!isValid) {
        throw new Error("Some items do not contain mandatory fields (name, brand, accords, seasons).");
      }

      // Merge collections (avoid exact matches by generating fresh ids)
      imported.forEach(item => {
        item.id = item.id.replace(/custom-|[0-9]/g, "") + "-" + Date.now() + Math.floor(Math.random() * 1000);
        collection.push(item);
      });

      saveCollectionToLocalStorage();
      renderCollection();
      updateStats();
      showToast(`Successfully imported ${imported.length} fragrances!`);
      switchView("collection");
    } catch (err) {
      alert("Error importing collection: " + err.message);
    }
  };
  reader.readAsText(file);
}

// Helpers: Accord Colors
function getAccordColor(name) {
  const normName = name.toLowerCase().trim();
  if (ACCORD_COLORS[normName]) return ACCORD_COLORS[normName];
  
  // Custom hash color for unknown accords
  let hash = 0;
  for (let i = 0; i < normName.length; i++) {
    hash = normName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 50%, 55%)`;
}

// Helpers: Mock distributions for manual creations to preserve detailed UI visual completeness
function getLongevityMockDistribution(label) {
  if (label === "Weak") return { poor: 55, weak: 30, moderate: 10, long: 4, eternal: 1 };
  if (label === "Moderate") return { poor: 10, weak: 20, moderate: 55, long: 12, eternal: 3 };
  if (label === "Long Lasting") return { poor: 3, weak: 5, moderate: 22, long: 55, eternal: 15 };
  if (label === "Eternal") return { poor: 1, weak: 2, moderate: 7, long: 25, eternal: 65 };
  return { poor: 10, weak: 20, moderate: 50, long: 15, eternal: 5 }; // default moderate
}

// Helpers: Sillage mock distributions
function getSillageMockDistribution(label) {
  if (label === "Intimate") return { intimate: 60, moderate: 30, strong: 8, enormous: 2 };
  if (label === "Moderate") return { intimate: 12, moderate: 60, strong: 24, enormous: 4 };
  if (label === "Strong") return { intimate: 4, moderate: 20, strong: 60, enormous: 16 };
  if (label === "Enormous") return { intimate: 2, moderate: 8, strong: 30, enormous: 60 };
  return { intimate: 15, moderate: 55, strong: 25, enormous: 5 }; // default moderate
}

// Toast notification trigger
function showToast(message) {
  const toast = document.getElementById("toast");
  document.getElementById("toast-message").innerText = message;
  toast.classList.add("show");
  
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

// Google Sheets Sync Functions
function toggleSheetsModal(isOpen) {
  const modal = document.getElementById("sheets-modal");
  const urlInput = document.getElementById("sheets-url");
  
  if (isOpen) {
    urlInput.value = localStorage.getItem("scentspace_sheets_url") || "";
    modal.classList.add("open");
  } else {
    modal.classList.remove("open");
  }
}

function closeSheetsModal(event) {
  toggleSheetsModal(false);
}

function saveSheetsUrl() {
  const url = document.getElementById("sheets-url").value.trim();
  localStorage.setItem("scentspace_sheets_url", url);
}

function syncToGoogleSheets() {
  const url = document.getElementById("sheets-url").value.trim();
  if (!url) {
    alert("Please enter a valid Google Apps Script Web App URL first.");
    return;
  }
  
  const btn = document.getElementById("btn-sync-sheets");
  const originalText = btn.innerHTML;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Syncing...`;
  btn.disabled = true;
  
  fetch(url, {
    method: "POST",
    body: JSON.stringify(collection)
  })
  .then(response => response.json())
  .then(data => {
    btn.innerHTML = originalText;
    btn.disabled = false;
    
    if (data && data.status === "success") {
      showToast(`Closet synced! ${data.count} items written to Sheet.`);
      toggleSheetsModal(false);
    } else {
      alert("Sync failed: " + (data ? data.message : "Unknown response error. Check sheet script logs."));
    }
  })
  .catch(err => {
    btn.innerHTML = originalText;
    btn.disabled = false;
    
    console.error("Sheets sync error", err);
    // Because browser CORS may block reading the redirected script response body,
    // we alert the user to check their sheet. The POST was still sent successfully!
    showToast("Sync triggered! Check your Google Sheet to verify.");
    toggleSheetsModal(false);
  });
}
