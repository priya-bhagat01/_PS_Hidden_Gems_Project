"use strict";

/* =========================================================
   Hidden Gems - script.js

   How this file is organised:
   1. DATA         - stations, interests, and the list of places
   2. STATE        - one object that remembers what the user chose
   3. HELPERS      - small reusable functions (money, lookups, links)
   4. FILTERING    - decides which places are visible
   5. RENDERING    - turns data into HTML on the page
   6. TRIP PLANNER - add/remove places, totals, budget meter
   7. DETAILS      - the pop-up window for one place
   8. EVENTS       - connects clicks and typing to the functions above
   9. START        - runs everything once when the page loads

   The main idea: change the STATE, then call renderAll().
   The page is always redrawn from the STATE, so it never gets out of sync.
   ========================================================= */


/* =========================================================
   1. DATA
   ========================================================= */

// Listed in the order you meet them travelling out from Mumbai.
// (Please double-check the order and the Google Maps names for your demo.)
// mapsName is the text Google Maps searches for when giving directions.
const STATIONS = [
  { id: "dadar",      name: "Dadar",      mapsName: "Dadar Central Railway Station, Mumbai" },
  { id: "dombivli",   name: "Dombivli",   mapsName: "Dombivli Railway Station, Maharashtra" },
  { id: "kalyan",     name: "Kalyan",     mapsName: "Kalyan Junction Railway Station, Maharashtra" },
  { id: "ulhasnagar", name: "Ulhasnagar", mapsName: "Ulhasnagar Railway Station, Maharashtra" },
  { id: "badlapur",   name: "Badlapur",   mapsName: "Badlapur Railway Station, Maharashtra" }
];

const INTEREST_OPTIONS = [
  "Nature", "Food", "Heritage", "Temples", "Shopping", "Hangout", "Photography"
];

// How each travel mode is written on a card, and which mode Google Maps should use.
const TRAVEL_MODES = {
  walk: { phrase: "on foot",        mapsMode: "walking" },
  auto: { phrase: "by auto-rickshaw", mapsMode: "driving" },
  bus:  { phrase: "by bus",         mapsMode: "transit" }
};

/*
  PLACES: every destination is one object.

  IMPORTANT: every number below (distance, minutes, rupees) is an ILLUSTRATIVE
  SAMPLE, not a verified fact. Replace them as your team verifies each place,
  and write down your source. Records with isPlaceholder: true are not real
  places at all; swap them for real ones.

  Fields:
    id              unique text, no spaces
    name            shown on the card
    stationId       must match an id in STATIONS
    interests       must come from INTEREST_OPTIONS
    distanceKm      distance from the station (sample)
    travelMode      "walk", "auto" or "bus"
    travelMinutes   one-way travel time (sample)
    timeNeeded      how long a visit takes (sample)
    costs           in rupees per person: entry, transport (round trip), food
    description     one or two plain sentences
    checkBefore     what to confirm before going
    mapsQuery       text for Google Maps. Leave "" if it is a placeholder.
    isPlaceholder   true = not a real place yet
*/
const PLACES = [
  // ----- Dadar -----
  {
    id: "dadar-flower-market",
    name: "Dadar Flower Market",
    stationId: "dadar",
    interests: ["Photography", "Shopping"],
    distanceKm: 0.5,
    travelMode: "walk",
    travelMinutes: 8,
    timeNeeded: "About 1 hour",
    costs: { entry: 0, transport: 0, food: 0 },
    description: "A busy wholesale flower market close to the station. Good for colourful photos and people-watching.",
    checkBefore: "Market timings and the best time of day to visit.",
    mapsQuery: "Dadar Flower Market, Mumbai",
    isPlaceholder: false
  },
  {
    id: "shivaji-park",
    name: "Shivaji Park",
    stationId: "dadar",
    interests: ["Hangout", "Nature"],
    distanceKm: 1.5,
    travelMode: "auto",
    travelMinutes: 10,
    timeNeeded: "1 to 2 hours",
    costs: { entry: 0, transport: 60, food: 50 },
    description: "A large public park and ground in Dadar West, used for walks and evening hangouts.",
    checkBefore: "Park opening hours and any events that may crowd the area.",
    mapsQuery: "Shivaji Park, Dadar, Mumbai",
    isPlaceholder: false
  },
  {
    id: "chaityabhoomi",
    name: "Chaityabhoomi",
    stationId: "dadar",
    interests: ["Heritage"],
    distanceKm: 1.5,
    travelMode: "auto",
    travelMinutes: 10,
    timeNeeded: "About 1 hour",
    costs: { entry: 0, transport: 60, food: 0 },
    description: "A memorial site near Dadar beach, visited for its historical importance.",
    checkBefore: "Visiting hours and any rules for visitors.",
    mapsQuery: "Chaityabhoomi, Dadar, Mumbai",
    isPlaceholder: false
  },
  {
    id: "dadar-portuguese-church",
    name: "Portuguese Church, Dadar",
    stationId: "dadar",
    interests: ["Heritage", "Photography"],
    distanceKm: 1.0,
    travelMode: "walk",
    travelMinutes: 15,
    timeNeeded: "About 45 minutes",
    costs: { entry: 0, transport: 0, food: 0 },
    description: "A well-known old church in Dadar West, interesting for its architecture.",
    checkBefore: "Opening hours and whether photography is allowed inside.",
    mapsQuery: "Portuguese Church, Dadar, Mumbai",
    isPlaceholder: false
  },

  // ----- Dombivli -----
  {
    id: "dombivli-ganesh-mandir",
    name: "Shri Ganesh Mandir, Dombivli",
    stationId: "dombivli",
    interests: ["Temples"],
    distanceKm: 2.0,
    travelMode: "auto",
    travelMinutes: 10,
    timeNeeded: "About 1 hour",
    costs: { entry: 0, transport: 60, food: 0 },
    description: "A well-known Ganesh temple in Dombivli East.",
    checkBefore: "Temple timings and dress guidelines.",
    mapsQuery: "Shri Ganesh Mandir Sansthan, Dombivli East",
    isPlaceholder: false
  },
  {
    id: "dombivli-phadke-road",
    name: "Phadke Road area",
    stationId: "dombivli",
    interests: ["Food", "Shopping", "Hangout"],
    distanceKm: 1.0,
    travelMode: "walk",
    travelMinutes: 12,
    timeNeeded: "1 to 2 hours",
    costs: { entry: 0, transport: 0, food: 100 },
    description: "A busy road near Dombivli East station with shops, snacks and local gatherings.",
    checkBefore: "Which shops and stalls are open at the time you plan to go.",
    mapsQuery: "Phadke Road, Dombivli East",
    isPlaceholder: false
  },

  // ----- Kalyan -----
  {
    id: "durgadi-fort",
    name: "Durgadi Fort",
    stationId: "kalyan",
    interests: ["Heritage", "Temples", "Photography"],
    distanceKm: 2.5,
    travelMode: "auto",
    travelMinutes: 15,
    timeNeeded: "1 to 2 hours",
    costs: { entry: 0, transport: 80, food: 0 },
    description: "A historic fort site in Kalyan West, linked to a well-known temple.",
    checkBefore: "Entry rules, timings, and the condition of the site.",
    mapsQuery: "Durgadi Fort, Kalyan",
    isPlaceholder: false
  },
  {
    id: "kalyan-street-food-placeholder",
    name: "Street-food stretch near Kalyan station",
    stationId: "kalyan",
    interests: ["Food", "Hangout"],
    distanceKm: 0.4,
    travelMode: "walk",
    travelMinutes: 5,
    timeNeeded: "About 45 minutes",
    costs: { entry: 0, transport: 0, food: 80 },
    description: "Placeholder record. Replace it with a real, checked food spot before the demo.",
    checkBefore: "Everything. This is not a real place yet.",
    mapsQuery: "",
    isPlaceholder: true
  },

  // ----- Ulhasnagar -----
  {
    id: "ulhasnagar-market",
    name: "Ulhasnagar market area",
    stationId: "ulhasnagar",
    interests: ["Shopping"],
    distanceKm: 1.5,
    travelMode: "auto",
    travelMinutes: 10,
    timeNeeded: "1 to 2 hours",
    costs: { entry: 0, transport: 50, food: 60 },
    description: "A large local market area, usually visited for clothes, household goods and bargains.",
    checkBefore: "Which lanes you want to visit and the weekly closing day.",
    mapsQuery: "Ulhasnagar Market, Ulhasnagar",
    isPlaceholder: false
  },
  {
    id: "ulhasnagar-cafe-placeholder",
    name: "Local cafe or hangout in Ulhasnagar",
    stationId: "ulhasnagar",
    interests: ["Hangout", "Food"],
    distanceKm: 1.0,
    travelMode: "walk",
    travelMinutes: 10,
    timeNeeded: "About 1 hour",
    costs: { entry: 0, transport: 0, food: 120 },
    description: "Placeholder record. Replace it with a real, checked place before the demo.",
    checkBefore: "Everything. This is not a real place yet.",
    mapsQuery: "",
    isPlaceholder: true
  },

  // ----- Badlapur -----
  {
    id: "barvi-dam",
    name: "Barvi Dam",
    stationId: "badlapur",
    interests: ["Nature", "Photography", "Hangout"],
    distanceKm: 10,
    travelMode: "auto",
    travelMinutes: 35,
    timeNeeded: "3 to 4 hours",
    costs: { entry: 0, transport: 400, food: 80 },
    description: "A dam and reservoir area near Badlapur, suited to a nature day out.",
    checkBefore: "Current access rules, the road conditions, and monsoon safety advice.",
    mapsQuery: "Barvi Dam, Badlapur",
    isPlaceholder: false
  },
  {
    id: "kondeshwar-temple",
    name: "Kondeshwar Temple",
    stationId: "badlapur",
    interests: ["Temples", "Nature"],
    distanceKm: 12,
    travelMode: "auto",
    travelMinutes: 40,
    timeNeeded: "3 to 4 hours",
    costs: { entry: 0, transport: 450, food: 60 },
    description: "A Shiva temple area near Badlapur, set in greenery.",
    checkBefore: "Temple timings, how to get there, and safety advice in the rainy season.",
    mapsQuery: "Kondeshwar Temple, Badlapur",
    isPlaceholder: false
  }
];


/* =========================================================
   2. STATE
   Everything the user has chosen lives in this one object.
   ========================================================= */

const DEFAULT_MAX_BUDGET = 1000;

const state = {
  stationId: "all",                 // "all" or a station id
  maxBudget: DEFAULT_MAX_BUDGET,    // budget filter, in rupees
  selectedInterests: [],            // empty list means "show every interest"
  sortBy: "cheapest",               // "cheapest", "nearest" or "name"
  tripPlaceIds: [],                 // ids of places added to the trip
  tripBudget: 500                   // the trip's own budget, in rupees
};

// Keep a handle on every page element we need, so we look each one up only once.
const els = {
  stationLine:     document.getElementById("stationLine"),
  budgetRange:     document.getElementById("budgetRange"),
  budgetOutput:    document.getElementById("budgetOutput"),
  sortSelect:      document.getElementById("sortSelect"),
  interestChips:   document.getElementById("interestChips"),
  resetFilters:    document.getElementById("resetFilters"),
  emptyReset:      document.getElementById("emptyResetButton"),
  resultsSummary:  document.getElementById("resultsSummary"),
  results:         document.getElementById("results"),
  emptyState:      document.getElementById("emptyState"),
  tripPanel:       document.getElementById("tripPanel"),
  tripHeading:     document.getElementById("tripHeading"),
  tripBar:         document.getElementById("tripBar"),
  tripBarSummary:  document.getElementById("tripBarSummary"),
  closeTrip:       document.getElementById("closeTrip"),
  tripBudgetInput: document.getElementById("tripBudgetInput"),
  meterFill:       document.getElementById("meterFill"),
  tripStatus:      document.getElementById("tripStatus"),
  tripList:        document.getElementById("tripList"),
  tripBreakdown:   document.getElementById("tripBreakdown"),
  clearTrip:       document.getElementById("clearTrip"),
  detailsDialog:   document.getElementById("detailsDialog"),
  detailsContent:  document.getElementById("detailsContent")
};

// Remembers which place is open in the details window.
let currentDetailsPlaceId = null;


/* =========================================================
   3. HELPERS
   ========================================================= */

// 1500 becomes "₹1,500" (Indian number grouping).
function formatRupees(amount) {
  return "₹" + amount.toLocaleString("en-IN");
}

// Total cost of one place = entry + transport + food. Calculated, never typed in.
function getTotalCost(place) {
  return place.costs.entry + place.costs.transport + place.costs.food;
}

function findPlaceById(placeId) {
  return PLACES.find(function (place) { return place.id === placeId; });
}

function findStationById(stationId) {
  return STATIONS.find(function (station) { return station.id === stationId; });
}

function isInTrip(placeId) {
  return state.tripPlaceIds.includes(placeId);
}

// Places text into HTML safely, so a name like "Tom & Jerry" or "<b>" cannot break the page.
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// "1 place" or "3 places"
function pluralisePlaces(count) {
  return count + (count === 1 ? " place" : " places");
}

// Link that shows the place on Google Maps (a search link, so it needs no API key).
function buildMapLink(place) {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(place.mapsQuery);
}

// Link that opens directions from the place's station to the place.
function buildDirectionsLink(place) {
  const station = findStationById(place.stationId);
  const params = new URLSearchParams({
    api: "1",
    origin: station.mapsName,
    destination: place.mapsQuery,
    travelmode: TRAVEL_MODES[place.travelMode].mapsMode
  });
  return "https://www.google.com/maps/dir/?" + params.toString();
}

// Only real places with a search text get map links.
function hasMapLinks(place) {
  return !place.isPlaceholder && place.mapsQuery !== "";
}


/* =========================================================
   4. FILTERING
   A place is shown only if it passes ALL three checks.
   ========================================================= */

function getVisiblePlaces() {
  const matches = PLACES.filter(function (place) {
    // Check 1: station ("all" means every station passes)
    const matchesStation =
      state.stationId === "all" || place.stationId === state.stationId;

    // Check 2: total cost must not be above the budget
    const withinBudget = getTotalCost(place) <= state.maxBudget;

    // Check 3: interests. With none selected, every place passes.
    // With some selected, the place needs at least ONE of them.
    const matchesInterests =
      state.selectedInterests.length === 0 ||
      state.selectedInterests.some(function (interest) {
        return place.interests.includes(interest);
      });

    return matchesStation && withinBudget && matchesInterests;
  });

  // Sort the matches (matches is already a new array, so PLACES stays untouched).
  matches.sort(function (a, b) {
    if (state.sortBy === "nearest") {
      return a.distanceKm - b.distanceKm || a.name.localeCompare(b.name);
    }
    if (state.sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    // default: cheapest first
    return getTotalCost(a) - getTotalCost(b) || a.name.localeCompare(b.name);
  });

  return matches;
}


/* =========================================================
   5. RENDERING
   ========================================================= */

// Draws the station "stops" once. Each stop is a radio button, so arrow keys work.
function renderStationLine() {
  const stops = [{ id: "all", name: "All stations" }].concat(STATIONS);

  els.stationLine.innerHTML = stops.map(function (stop) {
    const count = stop.id === "all"
      ? PLACES.length
      : PLACES.filter(function (place) { return place.stationId === stop.id; }).length;
    const isChecked = stop.id === state.stationId ? "checked" : "";

    return `
      <label class="stop">
        <input type="radio" class="stop-input" name="station" value="${stop.id}" ${isChecked}>
        <span class="stop-dot" aria-hidden="true"></span>
        <span class="stop-name">${escapeHtml(stop.name)}</span>
        <span class="stop-count">${pluralisePlaces(count)}</span>
      </label>`;
  }).join("");
}

// Draws the interest checkboxes once.
function renderInterestChips() {
  els.interestChips.innerHTML = INTEREST_OPTIONS.map(function (interest) {
    return `
      <label class="chip">
        <input type="checkbox" class="chip-input" value="${escapeHtml(interest)}">
        <span class="chip-label">${escapeHtml(interest)}</span>
      </label>`;
  }).join("");
}

// Builds the HTML for one destination card.
function buildCardHtml(place) {
  const station = findStationById(place.stationId);
  const mode = TRAVEL_MODES[place.travelMode];
  const total = getTotalCost(place);
  const inTrip = isInTrip(place.id);
  const titleId = "card-title-" + place.id;
  const statusLabel = place.isPlaceholder ? "Placeholder" : "Sample data";

  const tagsHtml = place.interests.map(function (interest) {
    return "<li>" + escapeHtml(interest) + "</li>";
  }).join("");

  const tripButtonHtml = inTrip
    ? `<button type="button" class="btn btn-remove" data-action="toggle-trip" data-place-id="${place.id}"
         aria-label="Remove ${escapeHtml(place.name)} from trip">Remove from trip</button>`
    : `<button type="button" class="btn btn-primary" data-action="toggle-trip" data-place-id="${place.id}"
         aria-label="Add ${escapeHtml(place.name)} to trip">Add to trip</button>`;

  return `
    <article class="card" aria-labelledby="${titleId}">
      <div class="card-body">
        <div class="card-top">
          <span class="station-tag">${escapeHtml(station.name)}</span>
          <span class="status-tag">${statusLabel}</span>
        </div>
        <h3 class="card-title" id="${titleId}">${escapeHtml(place.name)}</h3>
        <p class="card-desc">${escapeHtml(place.description)}</p>
        <dl class="facts">
          <div><dt>From station</dt><dd>${place.distanceKm} km ${mode.phrase}</dd></div>
          <div><dt>Travel time</dt><dd>About ${place.travelMinutes} min</dd></div>
          <div><dt>Time there</dt><dd>${escapeHtml(place.timeNeeded)}</dd></div>
        </dl>
        <ul class="tag-list" aria-label="Interests">${tagsHtml}</ul>
      </div>
      <div class="ticket-stub">
        <div class="stub-cost">
          <span class="stub-label">Estimated cost per person</span>
          <span class="stub-amount">${formatRupees(total)}</span>
          <span class="stub-break">
            Entry ${formatRupees(place.costs.entry)},
            transport ${formatRupees(place.costs.transport)},
            food ${formatRupees(place.costs.food)}
          </span>
        </div>
        <div class="stub-actions">
          <button type="button" class="btn btn-quiet" data-action="details" data-place-id="${place.id}"
            aria-label="Details for ${escapeHtml(place.name)}">Details</button>
          ${tripButtonHtml}
        </div>
      </div>
    </article>`;
}

// A sentence describing the current filters, shown above the cards.
function buildSummaryText(count) {
  let text = "Showing " + pluralisePlaces(count);

  if (state.stationId === "all") {
    text += " across all stations";
  } else {
    text += " near " + findStationById(state.stationId).name;
  }

  if (state.maxBudget < DEFAULT_MAX_BUDGET) {
    text += state.maxBudget === 0
      ? ", free only"
      : ", up to " + formatRupees(state.maxBudget);
  }

  if (state.selectedInterests.length > 0) {
    text += ", interests: " + state.selectedInterests.join(", ");
  }

  return text + ".";
}

// Redraws the card list (or the empty state).
function renderResults() {
  const visiblePlaces = getVisiblePlaces();

  els.resultsSummary.textContent = buildSummaryText(visiblePlaces.length);

  if (visiblePlaces.length === 0) {
    els.results.innerHTML = "";
    els.results.hidden = true;
    els.emptyState.hidden = false;
  } else {
    els.results.hidden = false;
    els.emptyState.hidden = true;
    els.results.innerHTML = visiblePlaces.map(buildCardHtml).join("");
  }
}

// Redraws everything that depends on the state.
function renderAll() {
  renderResults();
  renderTrip();
  if (els.detailsDialog.open) {
    updateDetailsTripButton();
  }
}


/* =========================================================
   6. TRIP PLANNER
   ========================================================= */

function toggleTrip(placeId) {
  if (isInTrip(placeId)) {
    state.tripPlaceIds = state.tripPlaceIds.filter(function (id) { return id !== placeId; });
  } else {
    state.tripPlaceIds.push(placeId);
  }
  renderAll();
}

// Adds up entry, transport and food across every place in the trip.
function calculateTripTotals() {
  const totals = { entry: 0, transport: 0, food: 0, all: 0 };

  state.tripPlaceIds.forEach(function (placeId) {
    const place = findPlaceById(placeId);
    totals.entry += place.costs.entry;
    totals.transport += place.costs.transport;
    totals.food += place.costs.food;
  });

  totals.all = totals.entry + totals.transport + totals.food;
  return totals;
}

function renderTrip() {
  const totals = calculateTripTotals();
  const budget = state.tripBudget;
  const count = state.tripPlaceIds.length;
  const isOverBudget = totals.all > budget;

  // 1. The list of places in the trip
  if (count === 0) {
    els.tripList.innerHTML =
      '<li class="trip-empty">Nothing here yet. Choose "Add to trip" on a place and your total will appear.</li>';
  } else {
    els.tripList.innerHTML = state.tripPlaceIds.map(function (placeId) {
      const place = findPlaceById(placeId);
      const station = findStationById(place.stationId);
      return `
        <li class="trip-item">
          <div>
            <div class="trip-item-name">${escapeHtml(place.name)}</div>
            <div class="trip-item-meta">${escapeHtml(station.name)}, ${formatRupees(getTotalCost(place))}</div>
          </div>
          <button type="button" class="btn btn-quiet" data-action="remove-from-trip" data-place-id="${place.id}"
            aria-label="Remove ${escapeHtml(place.name)} from trip">Remove</button>
        </li>`;
    }).join("");
  }

  // 2. The cost breakdown (hidden while the trip is empty)
  els.tripBreakdown.hidden = count === 0;
  els.clearTrip.hidden = count === 0;
  els.tripBreakdown.innerHTML = `
    <div><dt>Entry fees</dt><dd>${formatRupees(totals.entry)}</dd></div>
    <div><dt>Transport</dt><dd>${formatRupees(totals.transport)}</dd></div>
    <div><dt>Food</dt><dd>${formatRupees(totals.food)}</dd></div>
    <div class="is-total"><dt>Trip total</dt><dd>${formatRupees(totals.all)}</dd></div>`;

  // 3. The budget meter. Width is a percentage, capped at 100.
  let percentUsed = 0;
  if (budget > 0) {
    percentUsed = Math.min(100, Math.round((totals.all / budget) * 100));
  } else if (totals.all > 0) {
    percentUsed = 100;
  }
  els.meterFill.style.width = percentUsed + "%";
  els.meterFill.classList.toggle("is-over", isOverBudget);

  // 4. The sentence under the meter (text, so colour is not the only signal)
  els.tripStatus.classList.toggle("is-over", isOverBudget);
  if (count === 0) {
    els.tripStatus.textContent = "Add places to see what your day will cost.";
  } else if (isOverBudget) {
    els.tripStatus.textContent =
      formatRupees(totals.all - budget) + " over your " + formatRupees(budget) +
      " budget. Remove a place or raise the budget.";
  } else {
    els.tripStatus.textContent =
      formatRupees(totals.all) + " of " + formatRupees(budget) +
      " used. " + formatRupees(budget - totals.all) + " left.";
  }

  // 5. The summary on the phone bar
  els.tripBarSummary.textContent =
    pluralisePlaces(count) + ", " + formatRupees(totals.all) + " of " + formatRupees(budget);
}

// Opens or closes the trip sheet (phones only; on desktop it is always visible).
function setTripSheetOpen(shouldOpen) {
  const wasOpen = els.tripPanel.classList.contains("is-open");
  els.tripPanel.classList.toggle("is-open", shouldOpen);
  els.tripBar.setAttribute("aria-expanded", String(shouldOpen));

  // Move keyboard focus into the sheet when it opens, and back to the bar when it closes.
  if (shouldOpen) {
    els.closeTrip.focus();
  } else if (wasOpen) {
    els.tripBar.focus();
  }
}


/* =========================================================
   7. DETAILS WINDOW
   ========================================================= */

function buildDetailsHtml(place) {
  const station = findStationById(place.stationId);
  const mode = TRAVEL_MODES[place.travelMode];
  const statusLabel = place.isPlaceholder ? "Placeholder" : "Sample data";

  // Map links only exist for real places with a search text.
  const linksHtml = hasMapLinks(place)
    ? `<div class="link-row">
         <a class="btn btn-quiet btn-link" href="${buildDirectionsLink(place)}" target="_blank" rel="noopener noreferrer">
           Directions from ${escapeHtml(station.name)} station<span class="visually-hidden"> (opens in a new tab)</span>
         </a>
         <a class="btn btn-quiet btn-link" href="${buildMapLink(place)}" target="_blank" rel="noopener noreferrer">
           View on Google Maps<span class="visually-hidden"> (opens in a new tab)</span>
         </a>
       </div>
       <p class="hint">Links search Google Maps by name. Check that the pin matches the real place.</p>`
    : `<p>No map links yet. This is a placeholder, so there is no real location to open.</p>`;

  return `
    <div class="details-head">
      <div>
        <div class="card-top">
          <span class="station-tag">${escapeHtml(station.name)}</span>
          <span class="status-tag">${statusLabel}</span>
        </div>
        <h2 id="detailsTitle">${escapeHtml(place.name)}</h2>
      </div>
      <button type="button" class="btn btn-quiet" data-action="close-details">Close</button>
    </div>

    <p class="details-section">${escapeHtml(place.description)}</p>

    <div class="details-section">
      <h3>Getting there</h3>
      <p>
        About ${place.distanceKm} km from ${escapeHtml(station.name)} station, ${mode.phrase}
        (around ${place.travelMinutes} minutes one way). Plan for ${escapeHtml(place.timeNeeded.toLowerCase())} at the place.
      </p>
    </div>

    <div class="details-section">
      <h3>Estimated cost per person</h3>
      <table class="cost-table">
        <tbody>
          <tr><th scope="row">Entry fee</th><td>${formatRupees(place.costs.entry)}</td></tr>
          <tr><th scope="row">Transport (round trip)</th><td>${formatRupees(place.costs.transport)}</td></tr>
          <tr><th scope="row">Food</th><td>${formatRupees(place.costs.food)}</td></tr>
          <tr class="is-total"><th scope="row">Total</th><td>${formatRupees(getTotalCost(place))}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="details-section">
      <h3>Check before you go</h3>
      <p>${escapeHtml(place.checkBefore)}</p>
    </div>

    <div class="details-section">
      <h3>Map</h3>
      ${linksHtml}
    </div>

    <p class="sample-note">
      <strong>Sample data.</strong> Distances, times and costs are rough placeholders
      until the team verifies them.
    </p>

    <div class="details-actions">
      <button type="button" class="btn btn-primary" data-action="toggle-trip-details" data-place-id="${place.id}"></button>
    </div>`;
}

function openDetails(placeId) {
  const place = findPlaceById(placeId);
  currentDetailsPlaceId = placeId;
  els.detailsContent.innerHTML = buildDetailsHtml(place);
  updateDetailsTripButton();
  els.detailsDialog.showModal(); // native dialog: traps focus and closes with Escape
}

// Keeps the button inside the details window in step with the trip.
function updateDetailsTripButton() {
  const button = els.detailsContent.querySelector('[data-action="toggle-trip-details"]');
  if (!button) { return; }

  const place = findPlaceById(currentDetailsPlaceId);
  const inTrip = isInTrip(place.id);

  button.textContent = inTrip ? "Remove from trip" : "Add to trip";
  button.classList.toggle("btn-remove", inTrip);
  button.classList.toggle("btn-primary", !inTrip);
}


/* =========================================================
   8. EVENTS
   ========================================================= */

function resetFilters() {
  state.stationId = "all";
  state.maxBudget = DEFAULT_MAX_BUDGET;
  state.selectedInterests = [];
  state.sortBy = "cheapest";

  // Put the visible controls back to match the state.
  document.querySelector('input[name="station"][value="all"]').checked = true;
  els.budgetRange.value = DEFAULT_MAX_BUDGET;
  updateBudgetOutput();
  els.sortSelect.value = "cheapest";
  els.interestChips.querySelectorAll("input").forEach(function (box) { box.checked = false; });

  renderAll();
}

function updateBudgetOutput() {
  els.budgetOutput.textContent = state.maxBudget === 0
    ? "Free only"
    : "Up to " + formatRupees(state.maxBudget);
}

// Station chosen
els.stationLine.addEventListener("change", function (event) {
  state.stationId = event.target.value;
  renderAll();
});

// Budget slider moved
els.budgetRange.addEventListener("input", function () {
  state.maxBudget = Number(els.budgetRange.value);
  updateBudgetOutput();
  renderAll();
});

// Interest ticked or unticked: rebuild the list from whichever boxes are checked
els.interestChips.addEventListener("change", function () {
  const checkedBoxes = els.interestChips.querySelectorAll("input:checked");
  state.selectedInterests = Array.from(checkedBoxes).map(function (box) { return box.value; });
  renderAll();
});

// Sort option changed
els.sortSelect.addEventListener("change", function () {
  state.sortBy = els.sortSelect.value;
  renderAll();
});

els.resetFilters.addEventListener("click", resetFilters);
els.emptyReset.addEventListener("click", resetFilters);

// Buttons on the cards. One listener on the grid handles every card (event delegation).
els.results.addEventListener("click", function (event) {
  const button = event.target.closest("[data-action]");
  if (!button) { return; }

  const placeId = button.dataset.placeId;

  if (button.dataset.action === "details") {
    openDetails(placeId);
  }

  if (button.dataset.action === "toggle-trip") {
    toggleTrip(placeId);
    // The card was redrawn, so give keyboard focus back to the same button.
    const newButton = els.results.querySelector('[data-action="toggle-trip"][data-place-id="' + placeId + '"]');
    if (newButton) { newButton.focus(); }
  }
});

// Buttons inside the details window, plus clicking the dark backdrop to close it.
els.detailsDialog.addEventListener("click", function (event) {
  if (event.target === els.detailsDialog) {
    els.detailsDialog.close();
    return;
  }

  const button = event.target.closest("[data-action]");
  if (!button) { return; }

  if (button.dataset.action === "close-details") {
    els.detailsDialog.close();
  }
  if (button.dataset.action === "toggle-trip-details") {
    toggleTrip(button.dataset.placeId);
  }
});

// Remove buttons in the trip list
els.tripList.addEventListener("click", function (event) {
  const button = event.target.closest('[data-action="remove-from-trip"]');
  if (!button) { return; }

  toggleTrip(button.dataset.placeId);

  // Keep keyboard focus somewhere sensible after the list is redrawn.
  const nextRemoveButton = els.tripList.querySelector("button");
  (nextRemoveButton || els.tripHeading).focus();
});

els.clearTrip.addEventListener("click", function () {
  state.tripPlaceIds = [];
  renderAll();
  els.tripHeading.focus();
});

// Trip budget typed. An empty or negative value counts as 0.
els.tripBudgetInput.addEventListener("input", function () {
  state.tripBudget = Math.max(0, Number(els.tripBudgetInput.value) || 0);
  renderTrip();
});

// Phone trip sheet
els.tripBar.addEventListener("click", function () {
  setTripSheetOpen(!els.tripPanel.classList.contains("is-open"));
});
els.closeTrip.addEventListener("click", function () {
  setTripSheetOpen(false);
});

// Escape closes the trip sheet (the details window handles Escape by itself).
document.addEventListener("keydown", function (event) {
  const sheetIsOpen = els.tripPanel.classList.contains("is-open");
  if (event.key === "Escape" && sheetIsOpen && !els.detailsDialog.open) {
    setTripSheetOpen(false);
  }
});


/* =========================================================
   9. START
   ========================================================= */

renderStationLine();
renderInterestChips();
updateBudgetOutput();
renderAll();
