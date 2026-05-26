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
    perfume.notes.top.map(n => `<span class="note-tag">${getNoteEmoji(n)} ${n}</span>`).join("") :
    `<span style="font-size: 0.85rem; color: var(--text-muted);">None documented</span>`;

  middleNotesContainer.innerHTML = perfume.notes && perfume.notes.middle.length ? 
    perfume.notes.middle.map(n => `<span class="note-tag">${getNoteEmoji(n)} ${n}</span>`).join("") :
    `<span style="font-size: 0.85rem; color: var(--text-muted);">None documented</span>`;

  baseNotesContainer.innerHTML = perfume.notes && perfume.notes.base.length ? 
    perfume.notes.base.map(n => `<span class="note-tag">${getNoteEmoji(n)} ${n}</span>`).join("") :
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
      <span>${getNoteEmoji(note)} ${note}</span>
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
        backgroundColor: 'rgba(255, 105, 180, 0.15)',
        borderColor: 'HSL(327, 85%, 64%)',
        borderWidth: 2,
        pointBackgroundColor: 'HSL(327, 85%, 64%)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'HSL(327, 85%, 64%)'
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
          angleLines: { color: 'rgba(220, 160, 180, 0.15)' },
          grid: { color: 'rgba(220, 160, 180, 0.15)' },
          pointLabels: { color: 'HSL(325, 45%, 22%)', font: { family: 'Outfit', size: 12, weight: '500' } },
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
          grid: { color: 'rgba(220, 160, 180, 0.12)' },
          ticks: { color: 'HSL(325, 20%, 42%)', font: { family: 'Outfit' } },
          max: 100
        },
        y: {
          grid: { display: false },
          ticks: { color: 'HSL(325, 45%, 22%)', font: { family: 'Outfit', size: 12, weight: '500' } }
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
        backgroundColor: ['rgba(74, 185, 255, 0.65)', 'rgba(255, 105, 180, 0.65)', 'rgba(162, 155, 254, 0.65)'],
        borderColor: ['HSL(200, 75%, 60%)', 'HSL(327, 85%, 66%)', 'HSL(275, 65%, 68%)'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: 'HSL(325, 20%, 42%)', font: { family: 'Outfit', size: 11 } }
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

// ==========================================
// FRAGRANTICA CLIPBOARD IMPORTER & NOTE EMOJIS
// ==========================================

const NOTE_EMOJIS = {
  // Citrus
  "bergamot": "🍋", "lemon": "🍋", "lime": "🍋", "grapefruit": "🍊", "orange": "🍊", "mandarin": "🍊", "mandarin orange": "🍊", "neroli": "🌸", "yuzu": "🍋", "citruses": "🍋", "citrus": "🍋", "verbena": "🌱",
  // Fruits
  "pineapple": "🍍", "apple": "🍎", "green apple": "🍏", "pear": "🍐", "peach": "🍑", "plum": "🍑", "cherry": "🍒", "coconut": "🥥", "blackcurrant": "🫐", "black currant": "🫐", "blackberry": "🫐", "raspberry": "🍓", "strawberry": "🍓", "litchi": "🍒", "fig": "🍃", "melon": "🍈", "pomegranate": "🍎", "red berries": "🍓", "fruits": "🍒", "apricot": "🍑",
  // Flowers
  "rose": "🌹", "turkish rose": "🌹", "bulgarian rose": "🌹", "jasmine": "🪷", "moroccan jasmine": "🪷", "lavender": "🪻", "iris": "🪻", "violet": "🪻", "violet accord": "🪻", "geranium": "🌸", "ylang-ylang": "🌼", "orange blossom": "🌸", "tuberose": "🪷", "peony": "🌸", "orchid": "🪻", "freesia": "🌸", "magnolia": "🌸", "gardenia": "🪷", "heliotrope": "🪻", "lily-of-the-valley": "🔔", "lily": "🪷", "osmanthus": "🌼", "carnation": "🌸", "white flowers": "🌸", "floral notes": "🌸", "floral": "🌸",
  // Spices
  "cinnamon": "🪵", "ginger": "🫚", "cardamom": "🌱", "pepper": "🫑", "pink pepper": "🫑", "sichuan pepper": "🌶️", "black pepper": "🌶️", "cloves": "🪵", "nutmeg": "🌰", "saffron": "🌱", "vanilla": "🍦", "madagascar vanilla": "🍦", "vanilla bean": "🍦", "black vanilla husk": "🍦", "star anise": "⭐️", "anise": "⭐️", "coriander": "🌱", "cumin": "🌱", "spicy notes": "🌶️",
  // Woods
  "cedar": "🪵", "cedarwood": "🪵", "sandalwood": "🪵", "vetiver": "🌾", "haitian vetiver": "🌾", "patchouli": "🌿", "oakmoss": "🌳", "moss": "🌳", "guaiac wood": "🪵", "birch": "🪵", "ebony": "🪵", "agarwood": "🪵", "oud": "🪵", "cypress": "🌲", "pine": "🌲", "pine needles": "🌲", "fir resin": "🌲", "woody notes": "🪵", "cashmere wood": "🪵", "cashmeran": "🪵", "papyrus": "📜",
  // Sweet / Gourmand
  "honey": "🍯", "cacao": "🍫", "chocolate": "🍫", "caramel": "🍯", "praline": "🍬", "tonka bean": "🫘", "tonka": "🫘", "coffee": "☕️", "rum": "🥃", "cognac": "🥃", "almond": "🥜", "bitter almond": "🥜", "sugar": "🍬", "sweet notes": "🍬",
  // Amber / Resin / Musk
  "amber": "☄️", "amberwood": "🪵", "ambergris": "🐋", "musk": "🐾", "white musk": "🐾", "incense": "💨", "myrrh": "🪵", "benzoin": "🪵", "labdanum": "🪵", "styrax": "🪵", "opoponax": "🪵", "resins": "🌲", "leather": "💼", "suede": "💼", "civet": "🐱", "castoreum": "🪵",
  // Fresh / Green / Marine
  "sea notes": "🌊", "marine notes": "🌊", "aquatic notes": "🌊", "calone": "🌊", "seaweed": "🌿", "salt": "🧂", "mint": "🌱", "green leaves": "🍃", "basil": "🌿", "sage": "🌿", "clary sage": "🌿", "rosemary": "🌿", "tea": "🍵", "green tea": "🍵", "black tea": "🍵", "aldehydes": "🫧", "tobacco": "🍂", "tobacco leaf": "🍂", "gunpowder": "💨"
};

function getNoteEmoji(noteName) {
  if (!noteName) return "🍃";
  const lower = noteName.toLowerCase().trim();
  if (NOTE_EMOJIS[lower]) return NOTE_EMOJIS[lower];
  for (const [key, emoji] of Object.entries(NOTE_EMOJIS)) {
    if (lower.includes(key) || key.includes(lower)) {
      return emoji;
    }
  }
  return "🍃";
}

const KNOWN_BRANDS = [
  "Chanel", "Dior", "Creed", "Tom Ford", "Maison Francis Kurkdjian", "Yves Saint Laurent", "YSL", 
  "Giorgio Armani", "Armani", "Maison Margiela", "Le Labo", "Parfums de Marly", "Byredo", 
  "Viktor & Rolf", "Hermes", "Dolce & Gabbana", "D&G", "Guerlain", "Versace", "Kilian", 
  "Jean Paul Gaultier", "JPG", "Roja Dove", "Roja Parfums", "Amouage", "Xerjoff", "Initio Parfums Prives", 
  "Initio", "Prada", "Gucci", "Givenchy", "Bvlgari", "Valentino", "Paco Rabanne", "Rabanne", 
  "Lalique", "Mancera", "Montale", "Diptyque", "Penhaligon's", "Jo Malone", "Jo Malone London", 
  "Acqua di Parma", "Cartier", "Narciso Rodriguez", "Hermès", "Burberry", "Hugo Boss", "Boss", 
  "Calvin Klein", "CK", "Davidoff", "Dunhill", "Montblanc", "Azzaro", "Mugler", "Thierry Mugler", 
  "Viktor&Rolf", "Lancome", "Lancôme", "Chloé", "Chloe", "Marc Jacobs", "Coach", "Jimmy Choo", 
  "Ralph Lauren", "Estee Lauder", "Estée Lauder", "Carolina Herrera", "Tauer Parfums", 
  "Tauer", "Nasomatto", "Orto Parisi", "Lorenzo Villoresi", "Serge Lutens", "Frederic Malle", 
  "Frédéric Malle", "By Kilian", "L'Artisan Parfumeur", "L'Artisan", "Dyptique", "Etat Libre d'Orange", 
  "ELDO", "Histoires de Parfums", "Memo Paris", "Memo", "Vilhelm Parfumerie", "Atelier Cologne", 
  "Goldfield & Banks", "Juliette Has A Gun", "JHAG", "Escentric Molecules", "Bond No 9", 
  "Zoologist", "Kajal", "Kerosene", "Nishane", "Maison Crivelli", "BDK Parfums", "BDK", 
  "Afragance", "Phaedon", "Affinessence", "Teo Cabanel", "Frapin", "Carner Barcelona"
];

function toggleQuickPaste() {
  const body = document.getElementById("quick-paste-body");
  const chevron = document.getElementById("quick-paste-chevron");
  body.classList.toggle("hidden");
  if (body.classList.contains("hidden")) {
    chevron.style.transform = "rotate(0deg)";
  } else {
    chevron.style.transform = "rotate(180deg)";
  }
}

function processFragranticaPaste() {
  const pasteText = document.getElementById("fragrantica-raw-paste").value;
  if (!pasteText.trim()) {
    alert("Please paste some text from a Fragrantica page first.");
    return;
  }

  const result = parseFragranticaPaste(pasteText);

  // 1. Basic Info
  if (result.name) document.getElementById("f-name").value = result.name;
  if (result.brand) document.getElementById("f-brand").value = result.brand;
  if (result.image) document.getElementById("f-image").value = result.image;
  if (result.concentration) document.getElementById("f-concentration").value = result.concentration;

  // Gender
  const genderRadios = document.getElementsByName("f-gender");
  genderRadios.forEach(radio => {
    if (radio.value === result.gender) {
      radio.checked = true;
    }
  });

  // 2. Notes
  wizardNotes = result.notes;
  renderNoteTags("top");
  renderNoteTags("middle");
  renderNoteTags("base");

  // 3. Accords
  wizardAccords = result.accords;
  renderCustomAccords();

  // 4. Seasons & Time of Day & Performance
  document.getElementById("s-spring").value = result.seasons.spring;
  document.getElementById("s-summer").value = result.seasons.summer;
  document.getElementById("s-autumn").value = result.seasons.autumn;
  document.getElementById("s-winter").value = result.seasons.winter;
  updateSliderVal("spring");
  updateSliderVal("summer");
  updateSliderVal("autumn");
  updateSliderVal("winter");

  document.getElementById("s-day").value = result.timeOfDay.day;
  updateTimeOfDaySlider(result.timeOfDay.day);

  document.getElementById("f-longevity").value = result.longevity;
  document.getElementById("f-sillage").value = result.sillage;

  // Visual success notification and auto-close accordion
  showToast("Successfully parsed Fragrantica data!");
  document.getElementById("quick-paste-body").classList.add("hidden");
  document.getElementById("quick-paste-chevron").style.transform = "rotate(0deg)";
}

function parseFragranticaPaste(text) {
  const textLower = text.toLowerCase();
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  // 1. Brand & Name extraction
  let brand = "";
  let name = "";
  let titleLine = "";

  for (let i = 0; i < Math.min(25, lines.length); i++) {
    const line = lines[i];
    if (/\b(for\s+men|for\s+women|for\s+women\s+and\s+men|for\s+men\s+and\s+women|perfume\s+for|cologne\s+for)\b/i.test(line)) {
      titleLine = line;
      break;
    }
  }
  
  if (!titleLine && lines.length > 0) {
    titleLine = lines[0];
  }

  if (titleLine) {
    let foundBrand = "";
    for (const kb of KNOWN_BRANDS) {
      const regex = new RegExp("\\b" + kb.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "\\b", "i");
      if (regex.test(titleLine)) {
        foundBrand = kb;
        break;
      }
    }
    
    if (foundBrand) {
      brand = foundBrand;
      let namePart = titleLine;
      const brandRegex = new RegExp("\\b" + foundBrand.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "\\b", "ig");
      namePart = namePart.replace(brandRegex, "");
      namePart = namePart.replace(/\b(for\s+men|for\s+women|for\s+women\s+and\s+men|for\s+men\s+and\s+women|perfume|cologne|unisex)\b.*/i, "");
      namePart = namePart.replace(/\b(eau\s+de\s+parfum|eau\s+de\s+toilette|extrait\s+de\s+parfum|cologne|eau\s+de\s+cologne|parfum|edp|edt|aftershave)\b/i, "");
      name = namePart.replace(/\s+/g, " ").replace(/^[\s,-]+|[\s,-]+$/g, "").trim();
    } else {
      const match = titleLine.match(/(.+?)\s+(?:for\s+men|for\s+women|for\s+women\s+and\s+men|for\s+men\s+and\s+women|unisex)/i);
      if (match) {
        const parts = match[1].split(/\s+/);
        if (parts.length > 1) {
          brand = parts[parts.length - 1];
          name = parts.slice(0, -1).join(" ");
        } else {
          name = match[1];
          brand = "Unknown Brand";
        }
      } else {
        name = titleLine.replace(/^[\s,-]+|[\s,-]+$/g, "").trim();
        brand = "Unknown Brand";
      }
    }
  }

  // 2. Gender Suitability
  let gender = "unisex";
  if (textLower.includes("for women and men") || textLower.includes("for men and women") || textLower.includes("unisex")) {
    gender = "unisex";
  } else if (textLower.includes("for women") || textLower.includes("perfume for women") || textLower.includes("women's")) {
    gender = "women";
  } else if (textLower.includes("for men") || textLower.includes("cologne for men") || textLower.includes("men's")) {
    gender = "men";
  }

  // 3. Concentration
  let concentration = "Eau de Parfum";
  if (textLower.includes("eau de toilette") || textLower.includes(" edt")) {
    concentration = "Eau de Toilette";
  } else if (textLower.includes("extrait") || textLower.includes("pure parfum") || textLower.includes("extrait de parfum")) {
    concentration = "Parfum";
  } else if (textLower.includes("eau de cologne") || textLower.includes(" edc") || textLower.includes("cologne")) {
    concentration = "Eau de Cologne";
  } else if (textLower.includes("aftershave") || textLower.includes("body spray")) {
    concentration = "Aftershave";
  }

  // 4. Image URL extraction if present
  const imgMatch = text.match(/(https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|webp|gif))/i);
  let image = imgMatch ? imgMatch[1] : "";
  if (image && image.includes("fimgs.net/images/perfume/")) {
    // Keep it if it is a fimgs.net url
  } else {
    image = "";
  }

  // 5. Notes pyramid
  let notes = { top: [], middle: [], base: [] };
  const textOneLine = text.replace(/\s+/g, " ");
  
  const notesDescRegex = /(?:top\s+notes?\s+(?:are|is)\s+)(.+?);?\s*(?:middle\s+notes?\s+(?:are|is)|heart\s+notes?\s+(?:are|is))\s+(.+?);?\s*(?:base\s+notes?\s+(?:are|is))\s+(.+?)(?:\.|$)/i;
  const descMatch = textOneLine.match(notesDescRegex);

  if (descMatch) {
    const parseList = (str) => {
      return str
        .replace(/,\s*and\s+/gi, ", ")
        .replace(/\s+and\s+/gi, ", ")
        .split(",")
        .map(n => n.replace(/[\.\*;]/g, "").trim())
        .filter(n => n.length > 0 && n.toLowerCase() !== "and" && n.toLowerCase() !== "the");
    };
    notes.top = parseList(descMatch[1]);
    notes.middle = parseList(descMatch[2]);
    notes.base = parseList(descMatch[3]);
  }

  if (notes.top.length === 0 && notes.middle.length === 0 && notes.base.length === 0) {
    let currentTier = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^top\s+notes/i.test(line)) {
        currentTier = "top";
        continue;
      } else if (/^(middle|heart)\s+notes/i.test(line)) {
        currentTier = "middle";
        continue;
      } else if (/^base\s+notes/i.test(line)) {
        currentTier = "base";
        continue;
      }
      
      if (currentTier) {
        if (/^(longevity|sillage|vote|about|description|buy|bottle|sponsored|reviews|comments|main\s+accords)/i.test(line) || line.split(" ").length > 3) {
          currentTier = null;
          continue;
        }
        const parts = line.split(",").map(p => p.trim()).filter(p => p.length > 0 && p.length < 30);
        for (const p of parts) {
          if (p && !notes[currentTier].includes(p)) {
            notes[currentTier].push(p);
          }
        }
      }
    }
  }

  // 6. Accords list
  const commonAccords = [
    "Woody", "Citrus", "Amber", "Warm Spicy", "Fresh Spicy", "Sweet", "Leather", "Vanilla", 
    "Aromatic", "Coffee", "Floral", "Rose", "White Floral", "Marine", "Aquatic", "Aldehydic", 
    "Powdery", "Musky", "Musk", "Fresh", "Green", "Earthy", "Smoky", "Balsamic", "Fruity", 
    "Animalic", "Herbal", "Soft Spicy", "Patchouli", "Lavender", "Tropical", "Metallic", 
    "Coconut", "Tobacco", "Salty", "Sour", "Bitter", "Mossy", "Coniferous", "Oud"
  ];
  
  let accords = [];
  let startAccords = false;
  let accordLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^main accords/i.test(line)) {
      startAccords = true;
      continue;
    }
    if (startAccords) {
      if (/^(pyramid|notes|longevity|sillage|vote|about|description|buy|bottle|sponsored|reviews)/i.test(line) || line.split(" ").length > 4) {
        break;
      }
      accordLines.push(line);
    }
  }

  if (accordLines.length > 0) {
    let currentAccordName = "";
    for (let line of accordLines) {
      const numMatch = line.match(/^(\d+)%?$/);
      if (numMatch && currentAccordName) {
        accords.push({ name: currentAccordName, value: parseInt(numMatch[1]), color: getAccordColor(currentAccordName) });
        currentAccordName = "";
      } else {
        const matchedAccord = commonAccords.find(a => a.toLowerCase() === line.toLowerCase());
        if (matchedAccord) {
          if (currentAccordName) {
            accords.push({ name: currentAccordName, value: 0, color: getAccordColor(currentAccordName) });
          }
          currentAccordName = matchedAccord;
        } else if (line.length > 2 && line.length < 20 && !line.includes(" ")) {
          if (currentAccordName) {
            accords.push({ name: currentAccordName, value: 0, color: getAccordColor(currentAccordName) });
          }
          currentAccordName = line.charAt(0).toUpperCase() + line.slice(1).toLowerCase();
        }
      }
    }
    if (currentAccordName) {
      accords.push({ name: currentAccordName, value: 0, color: getAccordColor(currentAccordName) });
    }
    
    let currentVal = 100;
    accords = accords.map(acc => {
      if (acc.value === 0) {
        const newAcc = { ...acc, value: currentVal, color: getAccordColor(acc.name) };
        currentVal = Math.max(30, currentVal - 15);
        return newAcc;
      }
      currentVal = Math.max(30, acc.value - 15);
      return acc;
    });
  } else {
    let foundAccords = [];
    for (const line of lines) {
      for (const ca of commonAccords) {
        if (new RegExp("\\b" + ca + "\\b", "i").test(line) && !foundAccords.includes(ca)) {
          foundAccords.push(ca);
        }
      }
      if (foundAccords.length >= 6) break;
    }
    let currentVal = 100;
    accords = foundAccords.map(name => {
      const acc = { name, value: currentVal, color: getAccordColor(name) };
      currentVal = Math.max(30, currentVal - 15);
      return acc;
    });
  }

  // 7. Seasons
  let seasons = { spring: 25, summer: 25, autumn: 25, winter: 25 };
  const seasonsPattern = /(spring|summer|autumn|winter)[\s\(\:]*(\d+)/gi;
  let seasonVotes = { spring: 0, summer: 0, autumn: 0, winter: 0 };
  let sMatch;
  let totalSeasonVotes = 0;

  while ((sMatch = seasonsPattern.exec(textLower)) !== null) {
    const season = sMatch[1].toLowerCase();
    const votes = parseInt(sMatch[2]);
    if (votes > 0) {
      seasonVotes[season] = votes;
      totalSeasonVotes += votes;
    }
  }

  if (totalSeasonVotes === 0) {
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].toLowerCase();
      const nextLine = lines[i+1];
      if (["spring", "summer", "autumn", "winter"].includes(line)) {
        const numMatch = nextLine.match(/^(\d+)$/);
        if (numMatch) {
          const votes = parseInt(numMatch[1]);
          seasonVotes[line] = votes;
          totalSeasonVotes += votes;
        }
      }
    }
  }

  if (totalSeasonVotes > 0) {
    seasons.spring = Math.round((seasonVotes.spring / totalSeasonVotes) * 100);
    seasons.summer = Math.round((seasonVotes.summer / totalSeasonVotes) * 100);
    seasons.autumn = Math.round((seasonVotes.autumn / totalSeasonVotes) * 100);
    seasons.winter = 100 - (seasons.spring + seasons.summer + seasons.autumn);
  } else {
    let springWeight = 25, summerWeight = 25, autumnWeight = 25, winterWeight = 25;
    const allNotes = [...notes.top, ...notes.middle, ...notes.base].map(n => n.toLowerCase());
    const allAccords = accords.map(a => a.name.toLowerCase());
    
    const freshTerms = ["citrus", "marine", "aquatic", "mint", "lemon", "lime", "bergamot", "orange", "grapefruit", "sea notes", "calone", "cucumber", "watermelon", "yuzu", "neroli"];
    const warmTerms = ["amber", "vanilla", "cinnamon", "tobacco", "oud", "incense", "cloves", "nutmeg", "leather", "cocoa", "chocolate", "caramel", "honey", "benzoin", "myrrh"];
    const springTerms = ["rose", "jasmine", "lavender", "iris", "violet", "lily", "peony", "green leaves", "basil", "herbal", "fresh spicy"];
    
    allNotes.forEach(note => {
      if (freshTerms.some(term => note.includes(term))) { summerWeight += 15; springWeight += 10; winterWeight -= 10; }
      if (warmTerms.some(term => note.includes(term))) { winterWeight += 15; autumnWeight += 12; summerWeight -= 15; }
      if (springTerms.some(term => note.includes(term))) { springWeight += 15; summerWeight += 5; }
    });
    allAccords.forEach(acc => {
      if (freshTerms.some(term => acc.includes(term))) { summerWeight += 20; springWeight += 10; winterWeight -= 10; }
      if (warmTerms.some(term => acc.includes(term))) { winterWeight += 20; autumnWeight += 15; summerWeight -= 15; }
      if (springTerms.some(term => acc.includes(term))) { springWeight += 15; summerWeight += 5; }
    });
    
    springWeight = Math.max(5, springWeight);
    summerWeight = Math.max(5, summerWeight);
    autumnWeight = Math.max(5, autumnWeight);
    winterWeight = Math.max(5, winterWeight);
    
    const totalWeight = springWeight + summerWeight + autumnWeight + winterWeight;
    seasons.spring = Math.round((springWeight / totalWeight) * 100);
    seasons.summer = Math.round((summerWeight / totalWeight) * 100);
    seasons.autumn = Math.round((autumnWeight / totalWeight) * 100);
    seasons.winter = 100 - (seasons.spring + seasons.summer + seasons.autumn);
  }

  // 8. Time of Day
  let timeOfDay = { day: 50, night: 50 };
  let dayVotes = 0;
  let nightVotes = 0;
  let timeMatch;
  const timePattern = /\b(day|night)\b[\s\(\:]*(\d+)/gi;

  while ((timeMatch = timePattern.exec(textLower)) !== null) {
    const time = timeMatch[1].toLowerCase();
    const votes = parseInt(timeMatch[2]);
    if (time === "day") dayVotes = votes;
    if (time === "night") nightVotes = votes;
  }

  if (dayVotes === 0 && nightVotes === 0) {
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].toLowerCase();
      const nextLine = lines[i+1];
      if (line === "day") {
        const numMatch = nextLine.match(/^(\d+)$/);
        if (numMatch) dayVotes = parseInt(numMatch[1]);
      } else if (line === "night") {
        const numMatch = nextLine.match(/^(\d+)$/);
        if (numMatch) nightVotes = parseInt(numMatch[1]);
      }
    }
  }

  if (dayVotes > 0 || nightVotes > 0) {
    const totalTimeVotes = dayVotes + nightVotes;
    timeOfDay.day = Math.round((dayVotes / totalTimeVotes) * 100);
    timeOfDay.night = 100 - timeOfDay.day;
  } else {
    let dayWeight = 50;
    let nightWeight = 50;
    const allNotes = [...notes.top, ...notes.middle, ...notes.base].map(n => n.toLowerCase());
    const allAccords = accords.map(a => a.name.toLowerCase());
    
    const dayTerms = ["citrus", "marine", "aquatic", "mint", "lemon", "lime", "bergamot", "orange", "grapefruit", "white flowers", "neroli", "tea", "fresh"];
    const nightTerms = ["amber", "vanilla", "cinnamon", "tobacco", "oud", "incense", "leather", "smoky", "cacao", "chocolate", "caramel", "resins", "patchouli", "sandalwood"];
    
    allNotes.forEach(note => {
      if (dayTerms.some(term => note.includes(term))) dayWeight += 10;
      if (nightTerms.some(term => note.includes(term))) nightWeight += 10;
    });
    allAccords.forEach(acc => {
      if (dayTerms.some(term => acc.includes(term))) dayWeight += 15;
      if (nightTerms.some(term => acc.includes(term))) nightWeight += 15;
    });
    
    timeOfDay.day = Math.round((dayWeight / (dayWeight + nightWeight)) * 100);
    timeOfDay.night = 100 - timeOfDay.day;
  }

  // 9. Performance
  let longevity = "Moderate";
  let sillage = "Moderate";
  let longVotes = { "very weak": 0, "weak": 0, "moderate": 0, "long lasting": 0, "eternal": 0 };
  let silVotes = { "intimate": 0, "moderate": 0, "strong": 0, "enormous": 0 };

  const longPattern = /\b(very\s+weak|weak|moderate|long\s+lasting|eternal)\b[\s\(\:]*(\d+)/gi;
  let longMatch;
  let totalLong = 0;
  while ((longMatch = longPattern.exec(textLower)) !== null) {
    const label = longMatch[1].toLowerCase();
    const votes = parseInt(longMatch[2]);
    if (votes > 0) {
      longVotes[label] = votes;
      totalLong += votes;
    }
  }

  const silPattern = /\b(intimate|moderate|strong|enormous)\b[\s\(\:]*(\d+)/gi;
  let silMatch;
  let totalSil = 0;
  while ((silMatch = silPattern.exec(textLower)) !== null) {
    const label = silMatch[1].toLowerCase();
    const votes = parseInt(silMatch[2]);
    if (votes > 0) {
      silVotes[label] = votes;
      totalSil += votes;
    }
  }

  if (totalLong === 0) {
    const lLabels = ["very weak", "weak", "moderate", "long lasting", "eternal"];
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].toLowerCase();
      const nextLine = lines[i+1];
      if (lLabels.includes(line)) {
        const numMatch = nextLine.match(/^(\d+)$/);
        if (numMatch) {
          longVotes[line] = parseInt(numMatch[1]);
          totalLong += parseInt(numMatch[1]);
        }
      }
    }
  }

  if (totalSil === 0) {
    const sLabels = ["intimate", "moderate", "strong", "enormous"];
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].toLowerCase();
      const nextLine = lines[i+1];
      if (sLabels.includes(line)) {
        const numMatch = nextLine.match(/^(\d+)$/);
        if (numMatch) {
          silVotes[line] = parseInt(numMatch[1]);
          totalSil += parseInt(numMatch[1]);
        }
      }
    }
  }

  if (totalLong > 0) {
    let maxVotes = 0;
    let bestLabel = "Moderate";
    for (const [label, votes] of Object.entries(longVotes)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        bestLabel = label;
      }
    }
    if (bestLabel === "very weak" || bestLabel === "weak") longevity = "Weak";
    else if (bestLabel === "moderate") longevity = "Moderate";
    else if (bestLabel === "long lasting") longevity = "Long Lasting";
    else if (bestLabel === "eternal") longevity = "Eternal";
  } else {
    let weight = 0;
    const allNotes = [...notes.top, ...notes.middle, ...notes.base].map(n => n.toLowerCase());
    const heavyNotes = ["oud", "amber", "vanilla", "tobacco", "cinnamon", "patchouli", "sandalwood", "incense", "leather", "musk", "benzoin"];
    allNotes.forEach(n => {
      if (heavyNotes.some(hn => n.includes(hn))) weight += 2;
    });
    if (weight >= 6) longevity = "Eternal";
    else if (weight >= 3) longevity = "Long Lasting";
    else if (weight >= 1) longevity = "Moderate";
    else longevity = "Weak";
  }

  if (totalSil > 0) {
    let maxVotes = 0;
    let bestLabel = "Moderate";
    for (const [label, votes] of Object.entries(silVotes)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        bestLabel = label;
      }
    }
    if (bestLabel === "intimate") sillage = "Intimate";
    else if (bestLabel === "moderate") sillage = "Moderate";
    else if (bestLabel === "strong") sillage = "Strong";
    else if (bestLabel === "enormous") sillage = "Enormous";
  } else {
    let weight = 0;
    const allNotes = [...notes.top, ...notes.middle, ...notes.base].map(n => n.toLowerCase());
    const heavyNotes = ["oud", "amber", "vanilla", "tobacco", "cinnamon", "patchouli", "sandalwood", "incense", "leather", "musk", "benzoin"];
    allNotes.forEach(n => {
      if (heavyNotes.some(hn => n.includes(hn))) weight += 2;
    });
    if (weight >= 5) sillage = "Strong";
    else if (weight >= 2) sillage = "Moderate";
    else sillage = "Intimate";
  }

  return {
    name,
    brand,
    gender,
    concentration,
    image,
    notes,
    accords,
    seasons,
    timeOfDay,
    longevity,
    sillage
  };
}

function switchImportTab(type) {
  const urlTab = document.getElementById("tab-url-btn");
  const textTab = document.getElementById("tab-text-btn");
  const urlSection = document.getElementById("import-url-section");
  const textSection = document.getElementById("import-text-section");

  if (type === "url") {
    urlTab.classList.add("active");
    urlTab.style.color = "var(--accent-gold)";
    urlTab.style.fontWeight = "600";
    
    textTab.classList.remove("active");
    textTab.style.color = "var(--text-secondary)";
    textTab.style.fontWeight = "400";
    
    urlSection.classList.remove("hidden");
    textSection.classList.add("hidden");
  } else {
    textTab.classList.add("active");
    textTab.style.color = "var(--accent-gold)";
    textTab.style.fontWeight = "600";
    
    urlTab.classList.remove("active");
    urlTab.style.color = "var(--text-secondary)";
    urlTab.style.fontWeight = "400";
    
    textSection.classList.remove("hidden");
    urlSection.classList.add("hidden");
  }
}

async function importFromFragranticaURL() {
  const inputVal = document.getElementById("fragrantica-url-input").value.trim();
  const statusSpan = document.getElementById("import-url-status");
  const btn = document.getElementById("btn-import-url");
  
  if (!inputVal) {
    alert("Please enter a fragrance name or a Fragrantica URL.");
    return;
  }
  
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;
  
  let url = inputVal;
  const isURL = url.startsWith("http://") || url.startsWith("https://");
  
  try {
    if (!isURL) {
      statusSpan.innerText = `Searching for "${inputVal}" on Fragrantica...`;
      statusSpan.style.color = "var(--accent-gold)";
      
      // Perform DuckDuckGo Search via Proxy
      const searchUrl = `https://html.duckduckgo.com/html/?q=site:fragrantica.com/perfume/+${encodeURIComponent(inputVal)}`;
      const proxySearchUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(searchUrl)}`;
      
      const searchResponse = await fetch(proxySearchUrl);
      if (!searchResponse.ok) throw new Error("Search failed");
      const searchHtmlText = await searchResponse.text();
      
      const parser = new DOMParser();
      const searchDoc = parser.parseFromString(searchHtmlText, "text/html");
      
      const links = Array.from(searchDoc.querySelectorAll('a'))
        .map(a => a.getAttribute('href') || '')
        .filter(href => href.includes('fragrantica.com/perfume/'));
        
      if (links.length === 0) {
        throw new Error("No Fragrantica links found in search results.");
      }
      
      let targetUrl = links[0];
      if (targetUrl.includes('uddg=')) {
        const match = targetUrl.match(/uddg=([^&]+)/);
        if (match) {
          targetUrl = decodeURIComponent(match[1]);
        }
      }
      
      if (targetUrl.startsWith('//')) {
        targetUrl = 'https:' + targetUrl;
      }
      
      url = targetUrl;
      console.log("Found Fragrantica URL:", url);
    }
    
    // Now fetch the Fragrantica page URL
    statusSpan.innerText = `Fetching profile from Fragrantica...`;
    statusSpan.style.color = "var(--accent-gold)";
    
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Network response was not ok");
    const htmlText = await response.text();
    
    if (htmlText.includes("cloudflare") || htmlText.includes("Checking your browser") || htmlText.includes("Access denied")) {
      throw new Error("Cloudflare Bot Protection blocked direct scraping.");
    }
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    
    const bodyText = doc.body ? doc.body.textContent : "";
    if (!bodyText || bodyText.length < 500) {
      throw new Error("Empty page or parsing failed.");
    }
    
    const result = parseFragranticaPaste(bodyText);
    
    const h1 = doc.querySelector('h1[itemprop="name"]');
    if (h1 && h1.textContent.trim()) {
      let parsedTitle = h1.textContent.trim();
      const brandElem = doc.querySelector('[itemprop="brand"]');
      let parsedBrand = brandElem ? brandElem.textContent.trim() : "";
      
      if (parsedBrand) {
        result.brand = parsedBrand;
        if (parsedTitle.toLowerCase().includes(parsedBrand.toLowerCase())) {
          parsedTitle = parsedTitle.replace(new RegExp(parsedBrand, "gi"), "").trim();
        }
      }
      result.name = parsedTitle.replace(/^[\s,-]+|[\s,-]+$/g, "").trim();
    }
    
    const ogImage = doc.querySelector('meta[property="og:image"]');
    if (ogImage && ogImage.getAttribute("content")) {
      result.image = ogImage.getAttribute("content").trim();
    }
    
    // Populate form fields
    if (result.name) document.getElementById("f-name").value = result.name;
    if (result.brand) document.getElementById("f-brand").value = result.brand;
    if (result.image) document.getElementById("f-image").value = result.image;
    if (result.concentration) document.getElementById("f-concentration").value = result.concentration;
    
    const genderRadios = document.getElementsByName("f-gender");
    genderRadios.forEach(radio => {
      if (radio.value === result.gender) {
        radio.checked = true;
      }
    });
    
    wizardNotes = result.notes;
    renderNoteTags("top");
    renderNoteTags("middle");
    renderNoteTags("base");
    
    wizardAccords = result.accords;
    renderCustomAccords();
    
    document.getElementById("s-spring").value = result.seasons.spring;
    document.getElementById("s-summer").value = result.seasons.summer;
    document.getElementById("s-autumn").value = result.seasons.autumn;
    document.getElementById("s-winter").value = result.seasons.winter;
    updateSliderVal("spring");
    updateSliderVal("summer");
    updateSliderVal("autumn");
    updateSliderVal("winter");
    
    document.getElementById("s-day").value = result.timeOfDay.day;
    updateTimeOfDaySlider(result.timeOfDay.day);
    
    document.getElementById("f-longevity").value = result.longevity;
    document.getElementById("f-sillage").value = result.sillage;
    
    showToast("Successfully fetched and auto-filled fragrance!");
    statusSpan.innerText = "Import successful!";
    statusSpan.style.color = "#2ecc71";
    
    document.getElementById("quick-paste-body").classList.add("hidden");
    document.getElementById("quick-paste-chevron").style.transform = "rotate(0deg)";
    
  } catch (error) {
    console.error("Scraper URL fetch failed:", error);
    statusSpan.innerText = "Blocked or search failed. Please use 'Import via Paste' tab.";
    statusSpan.style.color = "#e74c3c";
    
    switchImportTab("text");
    alert("Fragrantica's Cloudflare or DuckDuckGo search blocked automated access. We have switched you to the 'Import via Paste' tab - just copy-paste the page text to auto-fill!");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Auto-Fill`;
  }
}
