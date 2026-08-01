/**
 * Seed destination dataset.
 *
 * Costs are per-person, low–high estimate ranges expressed in a single
 * reference currency (USD — see `src/rates.js`) and are converted to the
 * user's currency by the engine when needed. They are HONEST, SOURCED-STYLE
 * estimates built from public cost-of-living and travel guides — they are NOT
 * live/bookable prices and should never be presented as such. Every estimate
 * carries a data source + last-checked timestamp and is shown to the user.
 *
 * Image provenance is recorded per destination (source, license, credit) and
 * surfaced in the UI with credit lines.
 */

export const COST_SOURCE = 'Compiled estimate from public travel-cost guides';
export const COST_LAST_CHECKED = '2026-07-01';

export const SHARED_ASSUMPTIONS = [
  'Economy-class transport or standard-class rail',
  '3-star (or equivalent) accommodation',
  '50/50 mix of casual restaurants and street food for meals',
  'Public-transit based local travel with occasional ride-share',
  'A selection of two to four paid activities',
];

export const DESTINATIONS = [
  {
    id: 'prague',
    name: 'Prague',
    country: 'Czechia',
    region: 'Central Europe',
    tagline: 'Gothic spires, old-town lanes, and world-class lager',
    overview:
      'Prague pairs dense medieval streetscapes with a famously affordable food and drink scene, making it one of the easiest cities in Europe to travel well on a careful budget.',
    bestSeason: 'April–June & September–October',
    seasonMonths: ['April', 'May', 'June', 'September', 'October'],
    travelTime: {
      label: '≈ 2h 50m',
      note: 'Direct flight from most major European hubs',
    },
    suggestedStayNights: [2, 5],
    transportMode: 'flight',
    image: {
      url: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1200&q=80&auto=format&fit=crop',
      alt: 'Prague Old Town rooftops and spires at golden hour',
      credit: 'Photo by Olesya Grichina on Unsplash',
      source: 'Unsplash',
      license: 'Unsplash License (free to use)',
    },
    costs: {
      flightsPerPerson: { low: 95, high: 220 },
      accommodationPerRoomPerNight: { low: 60, high: 110 },
      mealsPerPersonPerNight: { low: 35, high: 60 },
      localTransportPerPersonPerNight: { low: 10, high: 18 },
      activitiesPerPersonPerNight: { low: 15, high: 30 },
      taxesFeesPerPerson: { low: 12, high: 20 },
      contingencyPercent: 10,
    },
    assumptions: [
      'Tram/metro tickets plus two paid sights per day',
      'Often cheapest for rail travellers from central Europe',
    ],
  },
  {
    id: 'lisbon',
    name: 'Lisbon',
    country: 'Portugal',
    region: 'Iberia',
    tagline: 'Sun-soaked hills, trams, and pastéis de nata',
    overview:
      'Lisbon offers Atlantic light, a dramatic hilltop layout, and a relaxed, affordable pace — a great fit for longer stays where value matters more than pace.',
    bestSeason: 'March–June & September–October',
    seasonMonths: ['March', 'April', 'May', 'June', 'September', 'October'],
    travelTime: {
      label: '≈ 3h 00m',
      note: 'Direct flight from most major European hubs',
    },
    suggestedStayNights: [4, 7],
    transportMode: 'flight',
    image: {
      url: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&q=80&auto=format&fit=crop',
      alt: 'A yellow tram climbing a Lisbon street',
      credit: 'Photo by George Kedenburg III on Unsplash',
      source: 'Unsplash',
      license: 'Unsplash License (free to use)',
    },
    costs: {
      flightsPerPerson: { low: 130, high: 290 },
      accommodationPerRoomPerNight: { low: 65, high: 120 },
      mealsPerPersonPerNight: { low: 40, high: 70 },
      localTransportPerPersonPerNight: { low: 12, high: 20 },
      activitiesPerPersonPerNight: { low: 15, high: 30 },
      taxesFeesPerPerson: { low: 15, high: 25 },
      contingencyPercent: 10,
    },
    assumptions: [
      'Tram/train day-passes and one or two day-trip sights',
      'Value is strongest for longer, slower stays',
    ],
  },
  {
    id: 'rome',
    name: 'Rome',
    country: 'Italy',
    region: 'Southern Europe',
    tagline: 'Two thousand years of history, one straight shot',
    overview:
      'Rome layers ancient ruins, Renaissance art, and extraordinary food in one walkable core. Entry fees add up, so it rewards travellers who plan which sights matter most.',
    bestSeason: 'April–June & September–October',
    seasonMonths: ['April', 'May', 'June', 'September', 'October'],
    travelTime: {
      label: '≈ 2h 30m',
      note: 'Direct flight from most major European hubs',
    },
    suggestedStayNights: [3, 6],
    transportMode: 'flight',
    image: {
      url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80&auto=format&fit=crop',
      alt: 'The Colosseum in Rome at dusk',
      credit: 'Photo by David Köhler on Unsplash',
      source: 'Unsplash',
      license: 'Unsplash License (free to use)',
    },
    costs: {
      flightsPerPerson: { low: 120, high: 270 },
      accommodationPerRoomPerNight: { low: 70, high: 130 },
      mealsPerPersonPerNight: { low: 45, high: 75 },
      localTransportPerPersonPerNight: { low: 14, high: 22 },
      activitiesPerPersonPerNight: { low: 20, high: 40 },
      taxesFeesPerPerson: { low: 20, high: 30 },
      contingencyPercent: 10,
    },
    assumptions: [
      'Combined metro/bus tickets; sight entry at two to three majors',
      'Monuments pass can lower per-day entrance costs',
    ],
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    country: 'Spain',
    region: 'Iberia',
    tagline: 'Gaudí, beaches, and tapas on the Mediterranean',
    overview:
      'Barcelona blends architecture, coastline, and a lively food culture into one compact, highly walkable city — an energetic pick with a wide range of price points.',
    bestSeason: 'May–June & September–October',
    seasonMonths: ['May', 'June', 'September', 'October'],
    travelTime: {
      label: '≈ 2h 00m',
      note: 'Direct flight from most major European hubs',
    },
    suggestedStayNights: [3, 6],
    transportMode: 'flight',
    image: {
      url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=80&auto=format&fit=crop',
      alt: 'Sagrada Família in Barcelona',
      credit: 'Photo by Marc Llop on Unsplash',
      source: 'Unsplash',
      license: 'Unsplash License (free to use)',
    },
    costs: {
      flightsPerPerson: { low: 95, high: 230 },
      accommodationPerRoomPerNight: { low: 75, high: 140 },
      mealsPerPersonPerNight: { low: 40, high: 70 },
      localTransportPerPersonPerNight: { low: 15, high: 25 },
      activitiesPerPersonPerNight: { low: 20, high: 35 },
      taxesFeesPerPerson: { low: 20, high: 30 },
      contingencyPercent: 10,
    },
    assumptions: [
      'Metro T-casual passes and two to three ticketed sights',
      'Dining spans tapas bars to one nicer sit-down meal',
    ],
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    region: 'Western Europe',
    tagline: 'Museums, cafés, and grand boulevards',
    overview:
      'Paris is as enchanting as it is beloved, and with sensible planning — Métro passes, free museums on certain days, picnic lunches — it can stay within reach.',
    bestSeason: 'April–June & September–October',
    seasonMonths: ['April', 'May', 'June', 'September', 'October'],
    travelTime: {
      label: '≈ 2h 10m by rail',
      note: 'High-speed rail from major hubs; flights slightly faster',
    },
    suggestedStayNights: [2, 5],
    transportMode: 'either',
    image: {
      url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80&auto=format&fit=crop',
      alt: 'The Eiffel Tower seen across Paris rooftops',
      credit: 'Photo by Chris Karidis on Unsplash',
      source: 'Unsplash',
      license: 'Unsplash License (free to use)',
    },
    costs: {
      flightsPerPerson: { low: 95, high: 240 },
      trainPerPerson: { low: 90, high: 170 },
      accommodationPerRoomPerNight: { low: 90, high: 160 },
      mealsPerPersonPerNight: { low: 50, high: 85 },
      localTransportPerPersonPerNight: { low: 18, high: 28 },
      activitiesPerPersonPerNight: { low: 20, high: 40 },
      taxesFeesPerPerson: { low: 25, high: 35 },
      contingencyPercent: 12,
    },
    assumptions: [
      'Métro carnet/ten-ticket pass; museums via days of free entry',
      'Low end assumes rail travel and picnic-style lunches',
    ],
  },
  {
    id: 'vienna',
    name: 'Vienna',
    country: 'Austria',
    region: 'Central Europe',
    tagline: 'Coffee houses, imperial palaces, and calm order',
    overview:
      'Vienna offers imperial grandeur and an exceptionally walkable center, with easy rail access from much of central Europe — a refined, relaxed escape.',
    bestSeason: 'April–May & September–October',
    seasonMonths: ['April', 'May', 'September', 'October'],
    travelTime: {
      label: '≈ 1h 45m by rail',
      note: 'Short high-speed rail hop from central Europe',
    },
    suggestedStayNights: [2, 5],
    transportMode: 'either',
    image: {
      url: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1200&q=80&auto=format&fit=crop',
      alt: 'St. Stephen’s Cathedral and Vienna city rooftops',
      credit: 'Photo by Alex Azabache on Unsplash',
      source: 'Unsplash',
      license: 'Unsplash License (free to use)',
    },
    costs: {
      flightsPerPerson: { low: 100, high: 230 },
      trainPerPerson: { low: 80, high: 150 },
      accommodationPerRoomPerNight: { low: 70, high: 120 },
      mealsPerPersonPerNight: { low: 45, high: 75 },
      localTransportPerPersonPerNight: { low: 14, high: 22 },
      activitiesPerPersonPerNight: { low: 20, high: 35 },
      taxesFeesPerPerson: { low: 18, high: 25 },
      contingencyPercent: 10,
    },
    assumptions: [
      'U-Bahn/tram day pass and one or two palace or museum visits',
      'Low end assumes rail travel from central Europe',
    ],
  },
  {
    id: 'amsterdam',
    name: 'Amsterdam',
    country: 'Netherlands',
    region: 'Western Europe',
    tagline: 'Canals, bicycles, museums, and cafés',
    overview:
      'Amsterdam is best explored by bike and canal, compact enough for a short stay yet deep enough to reward a longer one. Prices sit higher, so it favors tighter trips.',
    bestSeason: 'April–May & September',
    seasonMonths: ['April', 'May', 'September'],
    travelTime: {
      label: '≈ 1h 20m by rail',
      note: 'Short high-speed rail hop from many hubs',
    },
    suggestedStayNights: [2, 4],
    transportMode: 'either',
    image: {
      url: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200&q=80&auto=format&fit=crop',
      alt: 'Canal houses beside an Amsterdam canal',
      credit: 'Photo by Daniel Göransson on Unsplash',
      source: 'Unsplash',
      license: 'Unsplash License (free to use)',
    },
    costs: {
      flightsPerPerson: { low: 110, high: 270 },
      trainPerPerson: { low: 80, high: 160 },
      accommodationPerRoomPerNight: { low: 95, high: 160 },
      mealsPerPersonPerNight: { low: 45, high: 75 },
      localTransportPerPersonPerNight: { low: 16, high: 26 },
      activitiesPerPersonPerNight: { low: 20, high: 35 },
      taxesFeesPerPerson: { low: 20, high: 30 },
      contingencyPercent: 12,
    },
    assumptions: [
      'Bike/tram rental and two museum or canal visits',
      'Short stays give the best value-to-budget ratio here',
    ],
  },
  {
    id: 'budapest',
    name: 'Budapest',
    country: 'Hungary',
    region: 'Central Europe',
    tagline: 'Thermal baths, ruin bars, and grand boulevards',
    overview:
      'Budapest is brilliantly affordable among big European cities, with thermal baths, a grand riverfront, and a rich ruin-bar and food scene at refreshingly low prices.',
    bestSeason: 'April–June & September–October',
    seasonMonths: ['April', 'May', 'June', 'September', 'October'],
    travelTime: {
      label: '≈ 2h 30m',
      note: 'Direct flight from most major European hubs',
    },
    suggestedStayNights: [3, 6],
    transportMode: 'flight',
    image: {
      url: 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=1200&q=80&auto=format&fit=crop',
      alt: 'The Hungarian Parliament building reflected along the Danube',
      credit: 'Photo by Tim Trad on Unsplash',
      source: 'Unsplash',
      license: 'Unsplash License (free to use)',
    },
    costs: {
      flightsPerPerson: { low: 75, high: 195 },
      accommodationPerRoomPerNight: { low: 45, high: 90 },
      mealsPerPersonPerNight: { low: 28, high: 50 },
      localTransportPerPersonPerNight: { low: 10, high: 18 },
      activitiesPerPersonPerNight: { low: 12, high: 25 },
      taxesFeesPerPerson: { low: 12, high: 20 },
      contingencyPercent: 10,
    },
    assumptions: [
      'Tram/metro day pass and one thermal-bath visit',
      'One of the best value-per-day returns in Europe',
    ],
  },
  {
    id: 'athens',
    name: 'Athens',
    country: 'Greece',
    region: 'Southern Europe',
    tagline: 'Ancient wonders beside a lively modern city',
    overview:
      'Athens wraps the Acropolis and classical antiquity in a warm, easygoing city with great food at honest prices — a strong pick for history-minded budget travellers.',
    bestSeason: 'April–June & September–October',
    seasonMonths: ['April', 'May', 'June', 'September', 'October'],
    travelTime: {
      label: '≈ 3h 00m',
      note: 'Direct flight from most major European hubs',
    },
    suggestedStayNights: [3, 5],
    transportMode: 'flight',
    image: {
      url: 'https://images.unsplash.com/photo-1596516109370-29001ec8ec36?w=1200&q=80&auto=format&fit=crop',
      alt: 'The Acropolis in Athens above the city',
      credit: 'Photo by Christopher Czermak on Unsplash',
      source: 'Unsplash',
      license: 'Unsplash License (free to use)',
    },
    costs: {
      flightsPerPerson: { low: 120, high: 280 },
      accommodationPerRoomPerNight: { low: 60, high: 110 },
      mealsPerPersonPerNight: { low: 35, high: 65 },
      localTransportPerPersonPerNight: { low: 12, high: 20 },
      activitiesPerPersonPerNight: { low: 20, high: 40 },
      taxesFeesPerPerson: { low: 20, high: 30 },
      contingencyPercent: 10,
    },
    assumptions: [
      'Metro day pass and one combined archaeological-site ticket',
      'Flights are the largest single line in the estimate',
    ],
  },
  {
    id: 'porto',
    name: 'Porto',
    country: 'Portugal',
    region: 'Iberia',
    tagline: 'Tile façades, riverfront, and port-wine cellars',
    overview:
      'Porto is compact, walkable, and notably affordable, with riverside promenades, azulejo-tiled streets, and port-cellars to tour — a relaxed Iberian escape.',
    bestSeason: 'May–June & September–October',
    seasonMonths: ['May', 'June', 'September', 'October'],
    travelTime: {
      label: '≈ 2h 40m',
      note: 'Direct flight from most major European hubs',
    },
    suggestedStayNights: [3, 5],
    transportMode: 'flight',
    image: {
      url: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&q=80&auto=format&fit=crop',
      alt: 'Colourful houses along the Douro riverfront in Porto',
      credit: 'Photo by Andrzej Kryński on Unsplash',
      source: 'Unsplash',
      license: 'Unsplash License (free to use)',
    },
    costs: {
      flightsPerPerson: { low: 105, high: 250 },
      accommodationPerRoomPerNight: { low: 50, high: 100 },
      mealsPerPersonPerNight: { low: 35, high: 60 },
      localTransportPerPersonPerNight: { low: 12, high: 20 },
      activitiesPerPersonPerNight: { low: 15, high: 30 },
      taxesFeesPerPerson: { low: 15, high: 25 },
      contingencyPercent: 10,
    },
    assumptions: [
      'Bus/tram passes and a riverside cruise or cellar tour',
      'Walkable centre keeps local-transport costs low',
    ],
  },
];

export function getDestination(id) {
  return DESTINATIONS.find((d) => d.id === id) || null;
}
