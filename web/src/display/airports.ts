// Bundled airport geometry, drawn at true geographic position so departures and
// arrivals visibly line up with the runways. Coordinates from OurAirports (KSFO).

export interface Runway {
  leIdent: string;
  heIdent: string;
  le: [number, number]; // [lat, lon]
  he: [number, number];
  widthFt: number;
}

export interface Airport {
  icao: string;
  name: string;
  runways: Runway[];
}

export const SFO: Airport = {
  icao: "KSFO",
  name: "SFO",
  runways: [
    { leIdent: "10L", heIdent: "28R", le: [37.628742, -122.39341], he: [37.613538, -122.35716], widthFt: 200 },
    { leIdent: "10R", heIdent: "28L", le: [37.626298, -122.393124], he: [37.61172, -122.358367], widthFt: 200 },
    { leIdent: "1L", heIdent: "19R", le: [37.607898, -122.38295], he: [37.626476, -122.37063], widthFt: 200 },
    { leIdent: "1R", heIdent: "19L", le: [37.606333, -122.381061], he: [37.627346, -122.367124], widthFt: 200 },
  ],
};

export const CMH: Airport = {
  icao: "KCMH",
  name: "CMH",
  runways: [
    { leIdent: "10R", heIdent: "28L", le: [39.993667, -82.909167], he: [39.991667, -82.873167], widthFt: 150 },
    { leIdent: "10L", heIdent: "28R", le: [40.003167, -82.907667], he: [40.001667, -82.879167], widthFt: 150 },
  ],
};

export const OSU: Airport = {
  icao: "KOSU",
  name: "OSU",
  runways: [
    { leIdent: "09R", heIdent: "27L", le: [40.077167, -83.081667], he: [40.077833, -83.063667], widthFt: 100 },
    { leIdent: "09L", heIdent: "27R", le: [40.082667, -83.078833], he: [40.083167, -83.068167], widthFt: 100 },
    { leIdent: "05",  heIdent: "23",  le: [40.076333, -83.078500], he: [40.082667, -83.068833], widthFt: 100 },
  ],
};

export const LCK: Airport = {
  icao: "KLCK",
  name: "LCK",
  runways: [
    { leIdent: "05R", heIdent: "23L", le: [39.801000, -82.942000], he: [39.824500, -82.911333], widthFt: 200 },
    { leIdent: "05L", heIdent: "23R", le: [39.803333, -82.944000], he: [39.826333, -82.914000], widthFt: 150 },
  ],
};

export const TZR: Airport = {
  icao: "KTZR",
  name: "TZR",
  runways: [
    { leIdent: "04", heIdent: "22", le: [39.894833, -83.142167], he: [39.907500, -83.131667], widthFt: 100 },
  ],
};

/** Airports drawn on the map. */
export const AIRPORTS: Airport[] = [CMH, OSU, TZR, LCK];
