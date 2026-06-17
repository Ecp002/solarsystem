export interface PlanetStats {
  diameter: string;
  mass: string;
  gravity: string;
  temp: string;
  distance: string;
  dayLength: string;
  yearLength: string;
}

export interface MoonObjectData {
  name: string;
  size: number;
  orbitRadius: number;
  orbitSpeed: number;
  color: string;
}

export interface PlanetData {
  name: string;
  size: number;
  orbitRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  color: string;
  hasRings: boolean;
  ringType: 'saturn' | 'uranus' | 'neptune' | 'jupiter' | null;
  hasAtmosphere: boolean;
  atmosphereColor: string;
  stats: PlanetStats;
  overview: string;
  funFacts: string[];
  moons: string[];
  missions: string[];
  moonObjects?: MoonObjectData[];
}

export const PLANETS_DATA: PlanetData[] = [
  {
    name: 'Sun',
    size: 2.5,
    orbitRadius: 0,
    orbitSpeed: 0,
    rotationSpeed: 0.005,
    color: '#ffbb00',
    hasRings: false,
    ringType: null,
    hasAtmosphere: true,
    atmosphereColor: '#ff5500',
    stats: {
      diameter: '1,392,700 km',
      mass: '1.989 × 10^30 kg',
      gravity: '274 m/s²',
      temp: '5,500°C to 15,000,000°C',
      distance: '0 AU (Center)',
      dayLength: '25-35 Earth days',
      yearLength: 'N/A'
    },
    overview: 'The Sun is the star at the center of the Solar System. It is a nearly perfect sphere of hot plasma, heated to incandescence by nuclear fusion reactions in its core, radiating energy mainly as light and infrared radiation.',
    funFacts: [
      'The Sun accounts for 99.86% of the total mass of the entire Solar System.',
      'Light from the Sun takes approximately 8 minutes and 20 seconds to reach Earth.',
      'Inside the Sun’s core, nuclear fusion converts 600 million tons of hydrogen into helium every second.'
    ],
    moons: ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'],
    missions: [
      'SOHO (Studying solar interior & atmosphere, ESA/NASA 1995)',
      'Parker Solar Probe (Closest approach to Sun, NASA 2018-Present)',
      'Solar Orbiter (Close-up polar region imaging, ESA/NASA 2020-Present)'
    ]
  },
  {
    name: 'Mercury',
    size: 0.35,
    orbitRadius: 7,
    orbitSpeed: 0.04,
    rotationSpeed: 0.02,
    color: '#9E9E9E',
    hasRings: false,
    ringType: null,
    hasAtmosphere: false,
    atmosphereColor: '',
    stats: {
      diameter: '4,879 km',
      mass: '3.285 × 10^23 kg',
      gravity: '3.7 m/s²',
      temp: '-173°C to 427°C',
      distance: '0.39 AU',
      dayLength: '59 Earth days',
      yearLength: '88 Earth days'
    },
    overview: 'Mercury is the smallest planet in our solar system and the closest to the Sun. It experiences extreme temperature swings—roasting on the side facing the Sun and freezing in deep darkness on the other—because it lacks a substantial atmosphere to trap heat.',
    funFacts: [
      'A year on Mercury is just 88 Earth days, but a single day-night cycle takes 176 Earth days!',
      'Despite being closest to the Sun, it is not the hottest planet; Venus is hotter.',
      'Mercury is shrinking; its iron core is cooling, causing the crust to wrinkle.'
    ],
    moons: [],
    missions: [
      'Mariner 10 (First flyby, 1974-1975)',
      'MESSENGER (Mapped entire surface, 2011-2015)',
      'BepiColombo (En route, arriving 2025)'
    ]
  },
  {
    name: 'Venus',
    size: 0.55,
    orbitRadius: 10,
    orbitSpeed: 0.03,
    rotationSpeed: -0.015, // Retrograde
    color: '#E0A96D',
    hasRings: false,
    ringType: null,
    hasAtmosphere: true,
    atmosphereColor: '#ffaa66',
    stats: {
      diameter: '12,104 km',
      mass: '4.867 × 10^24 kg',
      gravity: '8.87 m/s²',
      temp: '462°C',
      distance: '0.72 AU',
      dayLength: '243 Earth days',
      yearLength: '225 Earth days'
    },
    overview: "Venus is the second planet from the Sun and Earth's closest planetary twin. It is wrapped in a thick, toxic atmosphere of carbon dioxide and sulfuric acid clouds that trap heat in a runaway greenhouse effect, making it the hottest planet in our solar system.",
    funFacts: [
      'Venus spins backward on its axis, meaning the Sun rises in the west.',
      'One day on Venus (243 Earth days) is longer than its orbital year (225 Earth days).',
      'The atmospheric pressure is 92 times that of Earth, equivalent to diving 1km deep in the ocean.'
    ],
    moons: [],
    missions: [
      'Venera 7 (First landing on another planet, USSR 1970)',
      'Magellan (Mapped surface using radar, NASA 1990-1994)',
      'Venus Express (Studied atmosphere, ESA 2006-2014)'
    ]
  },
  {
    name: 'Earth',
    size: 0.60,
    orbitRadius: 13.5,
    orbitSpeed: 0.024,
    rotationSpeed: 0.03,
    color: '#1a53ff',
    hasRings: false,
    ringType: null,
    hasAtmosphere: true,
    atmosphereColor: '#3388ff',
    stats: {
      diameter: '12,742 km',
      mass: '5.972 × 10^24 kg',
      gravity: '9.81 m/s²',
      temp: '-88°C to 58°C',
      distance: '1.00 AU',
      dayLength: '24 hours',
      yearLength: '365.25 days'
    },
    overview: 'Earth, our home, is the third planet from the Sun and the only astronomical object known to support life. Over 70% of its surface is covered by liquid water oceans, and its nitrogen-oxygen atmosphere shields the biosphere from hazardous radiation and space debris.',
    funFacts: [
      'Earth is the only planet in the solar system not named after a mythological god or goddess.',
      'The planet’s magnetic shield is generated by electric currents flowing in its liquid metal outer core.',
      'We are spinning around the Sun at roughly 107,000 kilometers per hour.'
    ],
    moons: ['The Moon'],
    missions: [
      'Apollo Program (Landed humans on Moon, 1961-1972)',
      'Voyager 1 & 2 (Interstellar messengers launched 1977)',
      'International Space Station (Continuous human presence, 1998-Present)'
    ],
    moonObjects: [
      { name: 'Moon', size: 0.10, orbitRadius: 1.3, orbitSpeed: 1.4, color: '#d3d3d3' }
    ]
  },
  {
    name: 'Mars',
    size: 0.45,
    orbitRadius: 17.5,
    orbitSpeed: 0.019,
    rotationSpeed: 0.028,
    color: '#cc4422',
    hasRings: false,
    ringType: null,
    hasAtmosphere: true,
    atmosphereColor: '#ff8844',
    stats: {
      diameter: '6,779 km',
      mass: '6.39 × 10^23 kg',
      gravity: '3.71 m/s²',
      temp: '-143°C to 35°C',
      distance: '1.52 AU',
      dayLength: '24.6 hours',
      yearLength: '687 Earth days'
    },
    overview: 'Mars is a cold, rusty desert world covered in iron oxide dust, giving it its distinct reddish hue. It features extreme topography, including Olympus Mons—the largest volcano in the solar system—and Valles Marineris, a canyon system that dwarf the Grand Canyon.',
    funFacts: [
      'Mars has two tiny, lumpy moons, Phobos and Deimos, which are likely captured asteroids.',
      'Liquid water once flowed in rivers, lakes, and oceans across the red planet billions of years ago.',
      'A Martian day (a sol) is only about 39 minutes longer than an Earth day.'
    ],
    moons: ['Phobos', 'Deimos'],
    missions: [
      'Viking 1 & 2 (First successful long-term landers, 1976)',
      'Curiosity Rover (Exploring Gale Crater, 2012-Present)',
      'Perseverance Rover (Searching for past signs of life, 2021-Present)'
    ],
    moonObjects: [
      { name: 'Phobos', size: 0.07, orbitRadius: 0.9, orbitSpeed: 2.2, color: '#8b8682' },
      { name: 'Deimos', size: 0.06, orbitRadius: 1.2, orbitSpeed: 1.5, color: '#a9a9a9' }
    ]
  },
  {
    name: 'Jupiter',
    size: 1.6,
    orbitRadius: 24,
    orbitSpeed: 0.012,
    rotationSpeed: 0.05, // Fast rotation
    color: '#D4A373',
    hasRings: true,
    ringType: 'jupiter',
    hasAtmosphere: true,
    atmosphereColor: '#eeaabb',
    stats: {
      diameter: '139,820 km',
      mass: '1.898 × 10^27 kg',
      gravity: '24.79 m/s²',
      temp: '-108°C',
      distance: '5.20 AU',
      dayLength: '9.9 hours',
      yearLength: '12 Earth years'
    },
    overview: 'Jupiter is the largest planet in our solar system, with a mass more than double that of all other planets combined. Composed mostly of hydrogen and helium, it is a turbulent gas giant covered in bands of clouds, ammonia storms, and the century-old Great Red Spot.',
    funFacts: [
      'Jupiter’s Great Red Spot is a persistent anticyclonic storm wider than Earth itself.',
      'It acts as a gravitational shield for Earth, sucking in or deflection incoming comets and asteroids.',
      'Jupiter hosts Ganymede, the largest moon in the Solar System, which is larger than the planet Mercury.'
    ],
    moons: ['Ganymede', 'Callisto', 'Io', 'Europa', 'Amalthea', 'Himalia', 'Valetudo'],
    missions: [
      'Pioneer 10 & 11 (First close-up photography, 1973-1974)',
      'Galileo (Dropped probe into atmosphere, 1995-2003)',
      'Juno (Probing core and atmospheric depth, 2016-Present)'
    ],
    moonObjects: [
      { name: 'Io', size: 0.12, orbitRadius: 2.4, orbitSpeed: 1.8, color: '#f5d742' },
      { name: 'Europa', size: 0.11, orbitRadius: 2.9, orbitSpeed: 1.3, color: '#b7c9ad' },
      { name: 'Ganymede', size: 0.15, orbitRadius: 3.5, orbitSpeed: 0.9, color: '#a99f92' },
      { name: 'Callisto', size: 0.13, orbitRadius: 4.1, orbitSpeed: 0.6, color: '#7f7f7f' }
    ]
  },
  {
    name: 'Saturn',
    size: 1.30,
    orbitRadius: 31,
    orbitSpeed: 0.009,
    rotationSpeed: 0.045,
    color: '#E9D5B3',
    hasRings: true,
    ringType: 'saturn',
    hasAtmosphere: true,
    atmosphereColor: '#ffddaa',
    stats: {
      diameter: '116,460 km',
      mass: '5.683 × 10^26 kg',
      gravity: '10.44 m/s²',
      temp: '-139°C',
      distance: '9.58 AU',
      dayLength: '10.7 hours',
      yearLength: '29 Earth years'
    },
    overview: 'Saturn is the second-largest planet in the solar system, famous for its grand ring system. These structures are made of ice, dust, and rock fragments ranging from microscopic dust to house-sized boulders, locked in a stable flat orbital plane.',
    funFacts: [
      'Saturn is the least dense planet in the solar system; it has a density lower than water.',
      'The rings are incredibly vast but paper-thin, averaging only 10 meters (30 feet) in thickness.',
      'One of Saturn’s moons, Enceladus, shoots geysers of liquid water out of ice fractures into space.'
    ],
    moons: ['Titan', 'Enceladus', 'Mimas', 'Rhea', 'Dione', 'Tethys', 'Iapetus'],
    missions: [
      'Pioneer 11 (First Saturn flyby, 1979)',
      'Voyager 1 & 2 (Revealed complex ring structures, 1980-1981)',
      'Cassini-Huygens (Orbit study and Titan probe lander, 2004-2017)'
    ],
    moonObjects: [
      { name: 'Enceladus', size: 0.09, orbitRadius: 3.8, orbitSpeed: 1.6, color: '#ffffff' },
      { name: 'Titan', size: 0.16, orbitRadius: 4.5, orbitSpeed: 0.8, color: '#e5a04d' },
      { name: 'Rhea', size: 0.11, orbitRadius: 5.2, orbitSpeed: 0.5, color: '#c0c0c0' }
    ]
  },
  {
    name: 'Uranus',
    size: 0.90,
    orbitRadius: 37,
    orbitSpeed: 0.006,
    rotationSpeed: -0.025, // Retrograde
    color: '#AFEEEE',
    hasRings: true,
    ringType: 'uranus',
    hasAtmosphere: true,
    atmosphereColor: '#66eeff',
    stats: {
      diameter: '50,724 km',
      mass: '8.681 × 10^25 kg',
      gravity: '8.69 m/s²',
      temp: '-197°C',
      distance: '19.20 AU',
      dayLength: '17.2 hours',
      yearLength: '84 Earth years'
    },
    overview: 'Uranus is an ice giant composed of water, ammonia, and methane ices overlying a small rocky core. Methane in its upper atmosphere absorbs red light, giving the planet its pale cyan-blue coloring. Its most striking feature is its axial tilt of 98 degrees.',
    funFacts: [
      'Uranus rotates on its side, rolling like a bowling ball as it orbits the Sun.',
      'It was the first planet discovered in the modern era, found by William Herschel in 1781.',
      'Its vertical ring system contains 13 dark rings, likely formed by shattered moons.'
    ],
    moons: ['Titania', 'Oberon', 'Umbriel', 'Ariel', 'Miranda', 'Puck', 'Sycorax'],
    missions: [
      'Voyager 2 (Only spacecraft to visit, flyby in 1986)'
    ],
    moonObjects: [
      { name: 'Ariel', size: 0.09, orbitRadius: 2.3, orbitSpeed: 1.5, color: '#dcdcdc' },
      { name: 'Umbriel', size: 0.09, orbitRadius: 2.8, orbitSpeed: 1.1, color: '#708090' },
      { name: 'Titania', size: 0.12, orbitRadius: 3.3, orbitSpeed: 0.8, color: '#b0c4de' },
      { name: 'Oberon', size: 0.11, orbitRadius: 3.8, orbitSpeed: 0.5, color: '#a9a9a9' }
    ]
  },
  {
    name: 'Neptune',
    size: 0.85,
    orbitRadius: 43,
    orbitSpeed: 0.004,
    rotationSpeed: 0.027,
    color: '#2b65ec',
    hasRings: true,
    ringType: 'neptune',
    hasAtmosphere: true,
    atmosphereColor: '#33aaff',
    stats: {
      diameter: '49,244 km',
      mass: '1.024 × 10^26 kg',
      gravity: '11.15 m/s²',
      temp: '-201°C',
      distance: '30.07 AU',
      dayLength: '16.1 hours',
      yearLength: '165 Earth years'
    },
    overview: 'Neptune is the most distant planet in our solar system, swept by supersonic winds that can exceed 2,000 kilometers per hour. A deep blue ice giant, it has a core of rock and ice surrounded by a mantle of water, methane, and ammonia.',
    funFacts: [
      'Neptune was discovered by math! Astronomers calculated its position before ever seeing it.',
      'Its largest moon, Triton, orbits backward (retrograde orbit) and is slowly spiral-falling into the planet.',
      'Neptune has a set of faint, thin rings and a storm called the Great Dark Spot.'
    ],
    moons: ['Triton', 'Proteus', 'Nereid', 'Larissa', 'Galatea', 'Despina', 'Neso'],
    missions: [
      'Voyager 2 (Only spacecraft to visit, flyby in 1989)'
    ],
    moonObjects: [
      { name: 'Triton', size: 0.13, orbitRadius: 2.2, orbitSpeed: -1.0, color: '#dcdcdc' }
    ]
  },
  {
    name: 'Pluto',
    size: 0.20,
    orbitRadius: 49,
    orbitSpeed: 0.003,
    rotationSpeed: 0.01,
    color: '#c5a080',
    hasRings: false,
    ringType: null,
    hasAtmosphere: true,
    atmosphereColor: '#88aaff',
    stats: {
      diameter: '2,376 km',
      mass: '1.303 × 10^22 kg',
      gravity: '0.62 m/s²',
      temp: '-228°C to -238°C',
      distance: '39.5 AU',
      dayLength: '6.4 Earth days',
      yearLength: '248 Earth years'
    },
    overview: 'Pluto is a complex and mysterious dwarf planet in the Kuiper Belt, a region of icy bodies beyond the orbit of Neptune. It has a thin, tenuous atmosphere primarily composed of nitrogen, methane, and carbon monoxide.',
    funFacts: [
      'Pluto was considered the ninth planet until 2006 when the IAU reclassified it as a dwarf planet.',
      'It has a giant, prominent heart-shaped glacier made of nitrogen ice named Tombaugh Regio.',
      'Pluto has five known moons, the largest being Charon, which is so big Pluto and Charon orbit each other like a double planet system.'
    ],
    moons: ['Charon', 'Nix', 'Hydra', 'Kerberos', 'Styx'],
    missions: [
      'New Horizons (First flyby, NASA 2015)'
    ],
    moonObjects: [
      { name: 'Charon', size: 0.09, orbitRadius: 0.8, orbitSpeed: 1.4, color: '#a09080' }
    ]
  }
];
