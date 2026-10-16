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

// The major stations, in the order you meet them travelling out from Mumbai.
// (Kalyan to Badlapur is on the Karjat branch of the line.)
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
  walk:  { phrase: "on foot",             mapsMode: "walking" },
  auto:  { phrase: "by auto-rickshaw",    mapsMode: "driving" },
  bus:   { phrase: "by bus",              mapsMode: "transit" },
  mixed: { phrase: "by auto and on foot", mapsMode: "driving" }
};

// The label shown on a card for how trustworthy its data is.
//   sample  = illustrative numbers, not researched
//   reel    = found in an Instagram reel, not yet checked by the team
//   visited = a teammate has actually been there
const DATA_STATUS_LABELS = {
  sample:  "Sample data",
  reel:    "From reel, unverified",
  visited: "Visited by team"
};

/*
  PLACES: every destination is one object.

  IMPORTANT: every number below (distance, minutes, rupees) is an ESTIMATE.
  Records marked "sample" are illustrative only. Records marked "reel" come
  from Instagram reels and the team's notes and still need checking.
  Change dataStatus to "visited" only after someone has really been there.

  Fields:
    id              unique text, no spaces
    name            shown on the card
    stationId       the major station it is filed under (must match STATIONS)
    nearestStation  OPTIONAL. Use it when the real nearest station is a smaller
                    one, e.g. { name: "Thakurli", mapsName: "..." }. It is used
                    for the card label and for the directions link.
    interests       must come from INTEREST_OPTIONS
    distanceKm      distance from the station
    travelMode      "walk", "auto", "bus" or "mixed"
    travelMinutes   one-way travel time
    timeNeeded      how long a visit takes. "" means not researched yet.
    costs           in rupees per person: entry, transport (round trip), food
                    Where we had a range, the higher number is used so that
                    budgets are not underestimated.
    unknownCosts    OPTIONAL list of cost names we have not researched yet,
                    e.g. ["entry"]. Their number in costs is 0 but the page
                    says "not researched" instead of showing a free price.
    costNote        OPTIONAL extra sentence about costs
    description     one or two plain sentences
    checkBefore     what to confirm before going
    mapsQuery       text for Google Maps. Leave "" if it is a placeholder.
    isPlaceholder   true = not a real place yet
    dataStatus      "sample", "reel" or "visited" (see DATA_STATUS_LABELS)
    verificationNote OPTIONAL plain sentence on how we know this
    sourceUrl       OPTIONAL link to the reel the place came from
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
    isPlaceholder: false,
    dataStatus: "sample"
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
    isPlaceholder: false,
    dataStatus: "sample"
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
    isPlaceholder: false,
    dataStatus: "sample"
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
    isPlaceholder: false,
    dataStatus: "sample"
  },
  {
    id: "marine-aqua-zoo",
    name: "Marine Aqua Zoo, Dadar (W)",
    stationId: "dadar",
    interests: ["Nature", "Heritage", "Hangout", "Photography"],
    distanceKm: 1.4,
    travelMode: "bus",
    travelMinutes: 10,
    timeNeeded: "",
    costs: { entry: 20, transport: 20, food: 0 },
    costNote: "Optional animal interaction costs about ₹100 extra (not included in the total).",
    description: "A small zoo park with birds and animals such as an ostrich, monitor lizard, blue parrot and snakes, plus an aquarium.",
    checkBefore: "Reported timings are 11am to 8pm. Check the crowd and any safety rules for animal interaction.",
    mapsQuery: "Marine Aqua Zoo, Dadar West, Mumbai",
    isPlaceholder: false,
    dataStatus: "reel",
    verificationNote: "Seen in a reel. Not yet checked by the team on Maps or in person.",
    sourceUrl: "https://www.instagram.com/reel/C2pg2jKoEYC/"
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
    isPlaceholder: false,
    dataStatus: "sample"
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
    isPlaceholder: false,
    dataStatus: "sample"
  },
  {
    id: "clay-pool-bar-kitchen",
    name: "Clay - Pool Bar & Kitchen",
    stationId: "dombivli",
    interests: ["Food", "Hangout", "Photography"],
    distanceKm: 3.6,
    travelMode: "auto",
    travelMinutes: 12,
    timeNeeded: "",
    costs: { entry: 0, transport: 60, food: 2000 },
    unknownCosts: ["entry"],
    costNote: "Transport was reported as ₹50 to 60. The food figure is as reported; confirm whether it is per person.",
    description: "A pool bar with rooftop dining and a DJ at night. Reviews are mixed on the taste of the food.",
    checkBefore: "Closes around 1:30am, so plan a safe way home. It is a bar, so check age rules for entry and any cover charge.",
    mapsQuery: "Clay Pool Bar & Kitchen, Dombivli",
    isPlaceholder: false,
    dataStatus: "reel",
    verificationNote: "Seen in a reel. Google Maps rating reported as 3.5 with mixed comments; not checked by the team in person.",
    sourceUrl: "https://www.instagram.com/reel/DXCAoKYjWHP/"
  },
  {
    id: "khidkaleshwar-mahadev-mandir",
    name: "Shri Khidkaleshwar Mahadev Mandir",
    stationId: "dombivli",
    interests: ["Heritage", "Temples"],
    distanceKm: 8,
    travelMode: "auto",
    travelMinutes: 30,
    timeNeeded: "",
    costs: { entry: 0, transport: 100, food: 0 },
    costNote: "Transport was reported as ₹80 to 100.",
    description: "A Shiv temple in Khidkali, described in the reel as very old and linked to the Pandavas. That history has not been verified.",
    checkBefore: "Opens at 6am. Check closing time, closed days and the crowd.",
    mapsQuery: "Shri Khidkaleshwar Mahadev Mandir, Khidkali",
    isPlaceholder: false,
    dataStatus: "reel",
    verificationNote: "Seen in a reel only. The Pandava connection is a claim from the reel, not a checked fact.",
    sourceUrl: "https://www.instagram.com/reel/DV5kxlOjbEM/"
  },
  {
    id: "samudreshwar-shiv-mandir",
    name: "Samudreshwar Shiv Mandir (Khambalpada)",
    stationId: "dombivli",
    nearestStation: { name: "Thakurli", mapsName: "Thakurli Railway Station, Maharashtra" },
    interests: ["Nature", "Heritage", "Temples", "Hangout", "Photography"],
    distanceKm: 2,
    travelMode: "auto",
    travelMinutes: 10,
    timeNeeded: "",
    costs: { entry: 0, transport: 30, food: 0 },
    description: "A Shiv temple beside a river, close to Thakurli station.",
    checkBefore: "Timings, closed days, the crowd and safety near the water.",
    mapsQuery: "Samudreshwar Shiv Mandir, Khambalpada, Thakurli",
    isPlaceholder: false,
    dataStatus: "visited",
    verificationNote: "Found in a reel and later visited by a team member, who rated it about 4 stars and called it a nice place.",
    sourceUrl: "https://www.instagram.com/reel/C63pkjXpFY1/"
  },
  {
    id: "radhe-krishna-temple",
    name: "Radhe Krishna Temple",
    stationId: "dombivli",
    interests: ["Nature", "Heritage", "Temples", "Hangout", "Photography"],
    distanceKm: 13,
    travelMode: "auto",
    travelMinutes: 40,
    timeNeeded: "",
    costs: { entry: 0, transport: 150, food: 0 },
    costNote: "Transport was reported as ₹100 to 150.",
    description: "A temple described as beautiful and peaceful.",
    checkBefore: "Reported timings are 5am to 9pm. Several temples share this name, so confirm the exact one from the reel. Also check closed days and the crowd.",
    mapsQuery: "Radhe Krishna Temple, Dombivli",
    isPlaceholder: false,
    dataStatus: "reel",
    verificationNote: "Seen in a reel only. The exact location still needs to be confirmed.",
    sourceUrl: "https://www.instagram.com/reel/DZfi09dsAJ5/"
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
    isPlaceholder: false,
    dataStatus: "sample"
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
    isPlaceholder: true,
    dataStatus: "sample"
  },
  {
    id: "underwater-fish-tunnel-expo",
    name: "Under Water Fish Tunnel Expo",
    stationId: "kalyan",
    interests: ["Nature", "Heritage", "Hangout", "Photography"],
    distanceKm: 5,
    travelMode: "auto",
    travelMinutes: 20,
    timeNeeded: "",
    costs: { entry: 100, transport: 120, food: 0 },
    description: "A fish tunnel exhibition. The team has not written a full description yet.",
    checkBefore: "Opens at 5pm. Expos are often temporary, so confirm it is still running, plus closed days and the crowd.",
    mapsQuery: "Under Water Fish Tunnel Expo, Kalyan",
    isPlaceholder: false,
    dataStatus: "reel",
    verificationNote: "Seen in a reel only. Not yet checked by the team.",
    sourceUrl: "https://www.instagram.com/reel/C1ovfQCKMO-/"
  },
  {
    id: "aura-restaurant",
    name: "Aura Restaurant",
    stationId: "kalyan",
    interests: ["Food", "Hangout", "Photography"],
    distanceKm: 6,
    travelMode: "auto",
    travelMinutes: 20,
    timeNeeded: "",
    costs: { entry: 0, transport: 100, food: 400 },
    costNote: "Food was reported as ₹200 to 400 per person.",
    description: "A friendly restaurant serving both veg and non-veg food.",
    checkBefore: "Reported timings are 12pm to 12am. Several places share this name, so confirm the exact one from the reel. Check the crowd and the closed day too.",
    mapsQuery: "Aura Restaurant, Kalyan",
    isPlaceholder: false,
    dataStatus: "reel",
    verificationNote: "Seen in a reel only. Not yet checked by the team.",
    sourceUrl: "https://www.instagram.com/reel/DCMYNGxvWms/"
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
    isPlaceholder: false,
    dataStatus: "sample"
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
    isPlaceholder: true,
    dataStatus: "sample"
  },
  {
    id: "pawai-shiv-dham-mandir",
    name: "Pawai Shiv Dham Mandir (Shiv Vishwa Shaanti Dham)",
    stationId: "ulhasnagar",
    nearestStation: { name: "Vitthalwadi", mapsName: "Vitthalwadi Railway Station, Maharashtra" },
    interests: ["Heritage", "Temples"],
    distanceKm: 1,
    travelMode: "walk",
    travelMinutes: 15,
    timeNeeded: "",
    costs: { entry: 20, transport: 0, food: 0 },
    description: "A temple complex with a walk through cave-style passages, a 36 ft Shiv statue, 108 shivlings, an Ashtavinayak Ganpati and an ice shivling.",
    checkBefore: "Reported timings are 7am to 10pm. Check the crowd and safety, especially in the cave sections.",
    mapsQuery: "Pawai Shiv Dham Mandir, Ulhasnagar",
    isPlaceholder: false,
    dataStatus: "reel",
    verificationNote: "Seen in a reel. Google Maps rating reported as 4.7; not checked by the team in person.",
    sourceUrl: "https://www.instagram.com/reel/DFFE1gmR-3m/"
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
    isPlaceholder: false,
    dataStatus: "sample"
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
    isPlaceholder: false,
    dataStatus: "sample"
  },
  {
    id: "chikhloli-dam",
    name: "Chikhloli Dam",
    stationId: "badlapur",
    interests: ["Nature", "Heritage", "Hangout", "Photography"],
    distanceKm: 5,
    travelMode: "mixed",
    travelMinutes: 40,
    timeNeeded: "",
    costs: { entry: 0, transport: 50, food: 0 },
    unknownCosts: ["food"],
    description: "A dam and a peaceful place to hang out.",
    checkBefore: "Timings, closed days, the crowd and safety near the water, especially in the monsoon.",
    mapsQuery: "Chikhloli Dam, Badlapur",
    isPlaceholder: false,
    dataStatus: "reel",
    verificationNote: "Seen in a reel only. Not yet checked by the team.",
    sourceUrl: "https://www.instagram.com/reel/DaVMoxCTTFy/"
  }
];


/* =========================================================
   2. STATE
   Everything the user has chosen lives in this one object.
   ========================================================= */

// The highest price on the slider. It must be at least the dearest place's
// known cost, or that place could never appear. Keep it equal to the "max"
// and "value" of the slider in index.html.
const DEFAULT_MAX_BUDGET = 2500;

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
// Costs we have not researched count as 0 here (see getUnknownCosts).
function getTotalCost(place) {
  return place.costs.entry + place.costs.transport + place.costs.food;
}

// Names of the costs we have not researched yet, e.g. ["entry"]. Often an empty list.
function getUnknownCosts(place) {
  return place.unknownCosts || [];
}

// Shows one cost as rupees, or "not researched" if we do not know it yet.
// costName is "entry", "transport" or "food".
function formatCostPart(place, costName) {
  if (getUnknownCosts(place).includes(costName)) {
    return "not researched";
  }
  return formatRupees(place.costs[costName]);
}

// The total as text. A trailing "+" means "at least this much".
function formatTotalCost(place) {
  const hasUnknown = getUnknownCosts(place).length > 0;
  return formatRupees(getTotalCost(place)) + (hasUnknown ? "+" : "");
}

// "Not researched yet" when we have no visit length for a place.
function getTimeNeededText(place) {
  return place.timeNeeded || "Not researched yet";
}

// The label showing how much we trust a record: "Sample data", "From reel, unverified"...
function getStatusLabel(place) {
  if (place.isPlaceholder) { return "Placeholder"; }
  return DATA_STATUS_LABELS[place.dataStatus];
}

function findPlaceById(placeId) {
  return PLACES.find(function (place) { return place.id === placeId; });
}

function findStationById(stationId) {
  return STATIONS.find(function (station) { return station.id === stationId; });
}

// The station to measure from. Usually the major station the place is filed under,
// but some places have a smaller nearest station (e.g. Thakurli, Vitthalwadi).
function getOriginStation(place) {
  return place.nearestStation || findStationById(place.stationId);
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

// Link that opens directions from the place's nearest station to the place.
function buildDirectionsLink(place) {
  const origin = getOriginStation(place);
  const params = new URLSearchParams({
    api: "1",
    origin: origin.mapsName,
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

    // Check 2: total known cost must not be above the budget
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
  const origin = getOriginStation(place);
  const mode = TRAVEL_MODES[place.travelMode];
  const hasUnknownCosts = getUnknownCosts(place).length > 0;
  const inTrip = isInTrip(place.id);
  const titleId = "card-title-" + place.id;
  const statusLabel = getStatusLabel(place);

  const tagsHtml = place.interests.map(function (interest) {
    return "<li>" + escapeHtml(interest) + "</li>";
  }).join("");

  const tripButtonHtml = inTrip
    ? `<button type="button" class="btn btn-remove" data-action="toggle-trip" data-place-id="${place.id}"
         aria-label="Remove ${escapeHtml(place.name)} from trip">Remove from trip</button>`
    : `<button type="button" class="btn btn-primary" data-action="toggle-trip" data-place-id="${place.id}"
         aria-label="Add ${escapeHtml(place.name)} to trip">Add to trip</button>`;

  // Optional extra sentence about costs (ranges, optional fees...)
  const costNoteHtml = place.costNote
    ? `<span class="stub-break">${escapeHtml(place.costNote)}</span>`
    : "";

  return `
    <article class="card" aria-labelledby="${titleId}">
      <div class="card-body">
        <div class="card-top">
          <span class="station-tag">${escapeHtml(origin.name)}</span>
          <span class="status-tag">${statusLabel}</span>
        </div>
        <h3 class="card-title" id="${titleId}">${escapeHtml(place.name)}</h3>
        <p class="card-desc">${escapeHtml(place.description)}</p>
        <dl class="facts">
          <div><dt>From station</dt><dd>${place.distanceKm} km ${mode.phrase}</dd></div>
          <div><dt>Travel time</dt><dd>About ${place.travelMinutes} min</dd></div>
          <div><dt>Time there</dt><dd>${escapeHtml(getTimeNeededText(place))}</dd></div>
        </dl>
        <ul class="tag-list" aria-label="Interests">${tagsHtml}</ul>
      </div>
      <div class="ticket-stub">
        <div class="stub-cost">
          <span class="stub-label">${hasUnknownCosts ? "Known costs per person" : "Estimated cost per person"}</span>
          <span class="stub-amount">${formatTotalCost(place)}</span>
          <span class="stub-break">
            Entry ${formatCostPart(place, "entry")},
            transport ${formatCostPart(place, "transport")},
            food ${formatCostPart(place, "food")}
          </span>
          ${costNoteHtml}
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
// hasUnknown becomes true if any place has a cost we have not researched.
function calculateTripTotals() {
  const totals = { entry: 0, transport: 0, food: 0, all: 0, hasUnknown: false };

  state.tripPlaceIds.forEach(function (placeId) {
    const place = findPlaceById(placeId);
    totals.entry += place.costs.entry;
    totals.transport += place.costs.transport;
    totals.food += place.costs.food;
    if (getUnknownCosts(place).length > 0) {
      totals.hasUnknown = true;
    }
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
      const origin = getOriginStation(place);
      return `
        <li class="trip-item">
          <div>
            <div class="trip-item-name">${escapeHtml(place.name)}</div>
            <div class="trip-item-meta">${escapeHtml(origin.name)}, ${formatTotalCost(place)}</div>
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
    <div class="is-total"><dt>Trip total</dt><dd>${formatRupees(totals.all)}${totals.hasUnknown ? "+" : ""}</dd></div>`;

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
  if (count > 0 && totals.hasUnknown) {
    els.tripStatus.textContent +=
      " Some costs are not researched yet, so the real total may be higher.";
  }

  // 5. The summary on the phone bar
  els.tripBarSummary.textContent =
    pluralisePlaces(count) + ", " + formatRupees(totals.all) + (totals.hasUnknown ? "+" : "") +
    " of " + formatRupees(budget);
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
  const origin = getOriginStation(place);
  const mode = TRAVEL_MODES[place.travelMode];
  const statusLabel = getStatusLabel(place);
  const hasUnknownCosts = getUnknownCosts(place).length > 0;

  // Map links only exist for real places with a search text.
  const linksHtml = hasMapLinks(place)
    ? `<div class="link-row">
         <a class="btn btn-quiet btn-link" href="${buildDirectionsLink(place)}" target="_blank" rel="noopener noreferrer">
           Directions from ${escapeHtml(origin.name)} station<span class="visually-hidden"> (opens in a new tab)</span>
         </a>
         <a class="btn btn-quiet btn-link" href="${buildMapLink(place)}" target="_blank" rel="noopener noreferrer">
           View on Google Maps<span class="visually-hidden"> (opens in a new tab)</span>
         </a>
       </div>
       <p class="hint">Links search Google Maps by name. Check that the pin matches the real place.</p>`
    : `<p>No map links yet. This is a placeholder, so there is no real location to open.</p>`;

  // Only add the "plan for..." sentence when we actually know the visit length.
  const timeSentence = place.timeNeeded
    ? " Plan for " + escapeHtml(place.timeNeeded.toLowerCase()) + " at the place."
    : "";

  // Notes under the cost table: unknown costs and the optional cost note.
  const unknownCostHtml = hasUnknownCosts
    ? `<p class="hint">Costs marked "not researched" are not in the total, so the real cost may be higher.</p>`
    : "";
  const costNoteHtml = place.costNote
    ? `<p class="hint">${escapeHtml(place.costNote)}</p>`
    : "";

  // "Where this came from": how much to trust the record, and the reel link if there is one.
  const verificationText = place.verificationNote ||
    "Illustrative numbers that the team has not verified yet.";
  const sourceHtml = place.sourceUrl
    ? `<p><a href="${place.sourceUrl}" target="_blank" rel="noopener noreferrer">Original Instagram reel<span class="visually-hidden"> (opens in a new tab)</span></a></p>`
    : "";

  return `
    <div class="details-head">
      <div>
        <div class="card-top">
          <span class="station-tag">${escapeHtml(origin.name)}</span>
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
        About ${place.distanceKm} km from ${escapeHtml(origin.name)} station, ${mode.phrase}
        (around ${place.travelMinutes} minutes one way).${timeSentence}
      </p>
    </div>

    <div class="details-section">
      <h3>Estimated cost per person</h3>
      <table class="cost-table">
        <tbody>
          <tr><th scope="row">Entry fee</th><td>${formatCostPart(place, "entry")}</td></tr>
          <tr><th scope="row">Transport (round trip)</th><td>${formatCostPart(place, "transport")}</td></tr>
          <tr><th scope="row">Food</th><td>${formatCostPart(place, "food")}</td></tr>
          <tr class="is-total"><th scope="row">Total</th><td>${formatTotalCost(place)}</td></tr>
        </tbody>
      </table>
      ${unknownCostHtml}
      ${costNoteHtml}
    </div>

    <div class="details-section">
      <h3>Check before you go</h3>
      <p>${escapeHtml(place.checkBefore)}</p>
    </div>

    <div class="details-section">
      <h3>Map</h3>
      ${linksHtml}
    </div>

    <div class="details-section">
      <h3>Where this came from</h3>
      <p><strong>${statusLabel}.</strong> ${escapeHtml(verificationText)}</p>
      ${sourceHtml}
    </div>

    <p class="sample-note">
      <strong>Estimates only.</strong> Distances, times and costs are rough
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
