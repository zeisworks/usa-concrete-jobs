// Concrete Cutting + Waterproofing — Data Layer
// Tier 1 States: TX, FL, CA, AZ, CO

export const states = [
  {
    slug: "texas",
    name: "Texas",
    abbr: "TX",
    licenseAuthority: "Texas Department of Licensing and Regulation",
    licenseUrl: "https://www.tdlr.texas.gov",
    avgCuttingCost: "$350 – $2,500",
    avgWaterproofingCost: "$3,000 – $15,000",
    climateNote: "Texas' expansive clay soil and extreme heat create significant foundation movement, making waterproofing essential for most homes. Concrete cutting is in high demand for both new construction and remodeling.",
    permitNote: "Most Texas cities require permits for structural concrete cutting. Waterproofing work generally does not require permits unless it involves structural modifications.",
    counties: [
      { slug: "harris", name: "Harris County", cities: ["Houston", "Katy", "Pasadena", "Baytown", "League City", "Pearland", "Sugar Land", "Missouri City", "Spring", "Cypress", "Humble", "Tomball"] },
      { slug: "dallas", name: "Dallas County", cities: ["Dallas", "Irving", "Grand Prairie", "Mesquite", "Richardson", "Garland", "Carrollton", "Plano", "Frisco", "McKinney", "Denton", "Lewisville"] },
      { slug: "tarrant", name: "Tarrant County", cities: ["Fort Worth", "Arlington", "Grand Prairie", "Mansfield", "Grapevine", "Southlake", "Keller", "Hurst", "Euless", "Bedford", "North Richland Hills", "Colleyville"] },
      { slug: "bexar", name: "Bexar County", cities: ["San Antonio", "Schertz", "Cibolo", "Universal City", "Converse", "Live Oak", "Helotes", "Alamo Heights", "Terrell Hills", "Olmos Park", "Castle Hills", "Windcrest"] },
      { slug: "travis", name: "Travis County", cities: ["Austin", "Round Rock", "Cedar Park", "Georgetown", "Pflugerville", "Kyle", "Buda", "Lakeway", "Bee Cave", "Manor", "Leander", "Hutto"] },
      { slug: "collin", name: "Collin County", cities: ["Plano", "Frisco", "McKinney", "Allen", "Prosper", "Celina", "Anna", "Melissa", "Princeton", "Farmersville", "Blue Ridge", "Nevada"] },
      { slug: "hidalgo", name: "Hidalgo County", cities: ["McAllen", "Edinburg", "Mission", "Pharr", "Weslaco", "Harlingen", "Donna", "Alamo", "San Juan", "Mercedes", "La Joya", "Rio Grande City"] },
      { slug: "el-paso", name: "El Paso County", cities: ["El Paso", "Socorro", "Horizon City", "Anthony", "Canutillo", "Clint", "Fabens", "San Elizario", "Tornillo", "Vinton", "Westway", "Upper Valley"] }
    ]
  },
  {
    slug: "florida",
    name: "Florida",
    abbr: "FL",
    licenseAuthority: "Florida Department of Business and Professional Regulation",
    licenseUrl: "https://www.myfloridalicense.com",
    avgCuttingCost: "\$400 – \$3,000",
    avgWaterproofingCost: "\$4,000 – \$18,000",
    climateNote: "Florida's high water table, hurricane flooding, and sinkhole activity make waterproofing one of the most critical home maintenance services. Concrete cutting is in demand for pool decks, seawalls, and foundation repair.",
    permitNote: "Florida requires state licensing for waterproofing contractors. Most counties require permits for concrete cutting that affects structural elements. Hurricane zone requirements may apply.",
    counties: [
      { slug: "miami-dade", name: "Miami-Dade County", cities: ["Miami", "Hialeah", "Miami Beach", "Coral Gables", "Doral", "Kendall", "Homestead", "South Miami", "North Miami", "Aventura", "Sunny Isles Beach", "Key Biscayne"] },
      { slug: "broward", name: "Broward County", cities: ["Fort Lauderdale", "Hollywood", "Pompano Beach", "Davie", "Plantation", "Sunrise", "Deerfield Beach", "Coral Springs", "Miramar", "Weston", "Tamarac", "Lauderhill"] },
      { slug: "palm-beach", name: "Palm Beach County", cities: ["West Palm Beach", "Boca Raton", "Boynton Beach", "Delray Beach", "Jupiter", "Wellington", "Royal Palm Beach", "Lake Worth", "Greenacres", "Palm Beach Gardens", "Riviera Beach", "Belle Glade"] },
      { slug: "orange", name: "Orange County", cities: ["Orlando", "Winter Park", "Kissimmee", "Apopka", "Ocoee", "Winter Garden", "Maitland", "Lake Mary", "Altamonte Springs", "Casselberry", "Oviedo", "Windermere"] },
      { slug: "hillsborough", name: "Hillsborough County", cities: ["Tampa", "Plant City", "Temple Terrace", "Brandon", "Riverview", "Lutz", "Wesley Chapel", "New Tampa", "Carrollwood", "Town 'n' Country", "Egypt Lake-Leto", "University"] },
      { slug: "duval", name: "Duval County", cities: ["Jacksonville", "Atlantic Beach", "Neptune Beach", "Jacksonville Beach", "Baldwin", "Callahan", "Fernandina Beach", "Green Cove Springs", "Orange Park", "Middleburg", "Ponte Vedra Beach", "St. Johns"] },
      { slug: "pinellas", name: "Pinellas County", cities: ["St. Petersburg", "Clearwater", "Largo", "Dunedin", "Tarpon Springs", "Seminole", "Safety Harbor", "Oldsmar", "Gulfport", "Treasure Island", "Madeira Beach", "Redington Shores"] },
      { slug: "lee", name: "Lee County", cities: ["Fort Myers", "Cape Coral", "Bonita Springs", "Sanibel", "Fort Myers Beach", "Estero", "Lehigh Acres", "North Fort Myers", "Alva", "Bokeelia", "Captiva", "Matlacha"] }
    ]
  },
  {
    slug: "california",
    name: "California",
    abbr: "CA",
    licenseAuthority: "California Contractors State License Board",
    licenseUrl: "https://www.cslb.ca.gov",
    avgCuttingCost: "\$500 – \$3,500",
    avgWaterproofingCost: "\$5,000 – \$20,000",
    climateNote: "California's seismic activity and hillside construction create high demand for concrete cutting (seismic retrofitting, foundation repair). Waterproofing is critical for hillside homes and below-grade structures.",
    permitNote: "California requires a C-8 (Concrete) or C-12 (Earthwork and Paving) license for concrete cutting. Waterproofing requires a C-39 (Roofing) or C-57 (Waterproofing) license. Permits required in most jurisdictions.",
    counties: [
      { slug: "los-angeles", name: "Los Angeles County", cities: ["Los Angeles", "Long Beach", "Pasadena", "Glendale", "Santa Clarita", "Pomona", "Torrance", "El Monte", "Downey", "Inglewood", "West Covina", "Norwalk"] },
      { slug: "san-diego", name: "San Diego County", cities: ["San Diego", "Chula Vista", "Oceanside", "Escondido", "Carlsbad", "El Cajon", "Vista", "San Marcos", "Encinitas", "La Mesa", "Santee", "National City"] },
      { slug: "orange", name: "Orange County", cities: ["Anaheim", "Santa Ana", "Irvine", "Huntington Beach", "Garden Grove", "Fullerton", "Orange", "Costa Mesa", "Mission Viejo", "Newport Beach", "Brea", "Laguna Beach"] },
      { slug: "riverside", name: "Riverside County", cities: ["Riverside", "Moreno Valley", "Corona", "Temecula", "Murrieta", "Hemet", "Indio", "Palm Desert", "Cathedral City", "La Quinta", "Coachella", "Blythe"] },
      { slug: "san-bernardino", name: "San Bernardino County", cities: ["San Bernardino", "Fontana", "Ontario", "Rancho Cucamonga", "Victorville", "Rialto", "Hesperia", "Chino", "Upland", "Apple Valley", "Redlands", "Yucaipa"] },
      { slug: "sacramento", name: "Sacramento County", cities: ["Sacramento", "Elk Grove", "Citrus Heights", "Folsom", "Rancho Cordova", "Galt", "Isleton", "Walnut Grove", "Courtland", "Hood", "Locke", "Ryde"] },
      { slug: "alameda", name: "Alameda County", cities: ["Oakland", "Fremont", "Hayward", "Berkeley", "Livermore", "Pleasanton", "San Leandro", "Union City", "Alameda", "Dublin", "Newark", "Castro Valley"] },
      { slug: "santa-clara", name: "Santa Clara County", cities: ["San Jose", "Sunnyvale", "Santa Clara", "Mountain View", "Palo Alto", "Milpitas", "Cupertino", "Gilroy", "Morgan Hill", "Campbell", "Los Gatos", "Saratoga"] }
    ]
  },
  {
    slug: "arizona",
    name: "Arizona",
    abbr: "AZ",
    licenseAuthority: "Arizona Registrar of Contractors",
    licenseUrl: "https://roc.az.gov",
    avgCuttingCost: "\$350 – \$2,500",
    avgWaterproofingCost: "\$3,500 – \$14,000",
    climateNote: "Arizona's extreme heat and monsoon season create unique waterproofing challenges. Concrete cutting is in high demand for pool construction, patio expansion, and commercial tenant improvements.",
    permitNote: "Arizona requires a dual license (commercial and residential) for concrete work. Waterproofing falls under the A-12 (Waterproofing) classification. Permits required for structural work in most jurisdictions.",
    counties: [
      { slug: "maricopa", name: "Maricopa County", cities: ["Phoenix", "Mesa", "Chandler", "Gilbert", "Scottsdale", "Tempe", "Peoria", "Glendale", "Surprise", "Goodyear", "Avondale", "Buckeye"] },
      { slug: "pima", name: "Pima County", cities: ["Tucson", "Oro Valley", "Marana", "Sahuarita", "South Tucson", "Green Valley", "Catalina Foothills", "Flowing Wells", "Drexel Heights", "Tanque Verde", "Vail", "Valencia West"] },
      { slug: "pinal", name: "Pinal County", cities: ["Casa Grande", "Apache Junction", "Coolidge", "Eloy", "Florence", "Maricopa", "Gold Canyon", "San Tan Valley", "Queen Creek", "Arizona City", "Superior", "Kearny"] },
      { slug: "yavapai", name: "Yavapai County", cities: ["Prescott", "Prescott Valley", "Cottonwood", "Sedona", "Camp Verde", "Chino Valley", "Dewey-Humboldt", "Clarkdale", "Mayer", "Cordes Lakes", "Cornville", "Lake Montezuma"] },
      { slug: "mohave", name: "Mohave County", cities: ["Kingman", "Lake Havasu City", "Bullhead City", "Mohave Valley", "Golden Valley", "Desert Hills", "Dolan Springs", "Meadview", "Peach Springs", "Seligman", "Tusayan", "Williams"] },
      { slug: "coconino", name: "Coconino County", cities: ["Flagstaff", "Sedona", "Page", "Williams", "Tusayan", "Kachina Village", "Mountainaire", "Munds Park", "Parks", "Bellemont", "Fort Valley", "Doney Park"] }
    ]
  },
  {
    slug: "colorado",
    name: "Colorado",
    abbr: "CO",
    licenseAuthority: "Colorado Department of Regulatory Agencies",
    licenseUrl: "https://dora.colorado.gov",
    avgCuttingCost: "\$400 – \$2,800",
    avgWaterproofingCost: "\$4,000 – \$16,000",
    climateNote: "Colorado's freeze-thaw cycles and expansive soils create significant foundation and waterproofing challenges. Concrete cutting is in demand for mountain construction, basement finishing, and commercial tenant improvements.",
    permitNote: "Colorado does not have statewide contractor licensing, but most cities and counties require local licenses and permits for concrete and waterproofing work. Check local jurisdiction requirements.",
    counties: [
      { slug: "denver", name: "Denver County", cities: ["Denver", "Lakewood", "Arvada", "Westminster", "Thornton", "Centennial", "Broomfield", "Commerce City", "Englewood", "Lone Tree", "Parker", "Littleton"] },
      { slug: "jefferson", name: "Jefferson County", cities: ["Golden", "Lakewood", "Arvada", "Evergreen", "Conifer", "Morrison", "Idledale", "Indian Hills", "Kittredge", "Bailey", "Pine", "Fairmount"] },
      { slug: "douglas", name: "Douglas County", cities: ["Castle Rock", "Parker", "Lone Tree", "Highlands Ranch", "Larkspur", "Sedalia", "Franktown", "Elizabeth", "Kiowa", "Castle Pines", "Stonegate", "Grand View Estates"] },
      { slug: "el-paso", name: "El Paso County", cities: ["Colorado Springs", "Manitou Springs", "Woodland Park", "Monument", "Palmer Lake", "Black Forest", "Falcon", "Peyton", "Calhan", "Fountain", "Security", "Widefield"] },
      { slug: "larimer", name: "Larimer County", cities: ["Fort Collins", "Loveland", "Estes Park", "Berthoud", "Wellington", "Timnath", "Windsor", "Red Feather Lakes", "Livermore", "Bellvue", "Laporte", "Carter Lake"] },
      { slug: "weld", name: "Weld County", cities: ["Greeley", "Windsor", "Erie", "Frederick", "Firestone", "Dacono", "Fort Lupton", "Johnstown", "Mead", "Platteville", "Milliken", "La Salle"] },
      { slug: "boulder", name: "Boulder County", cities: ["Boulder", "Longmont", "Louisville", "Lafayette", "Superior", "Nederland", "Lyons", "Ward", "Jamestown", "Gold Hill", "Gunbarrel", "Erie"] },
      { slug: "summit", name: "Summit County", cities: ["Breckenridge", "Frisco", "Silverthorne", "Dillon", "Keystone", "Copper Mountain", "Heeney", "Montezuma", "Breckenridge", "Wildernest", "Blue River", "Alma"] }
    ]
  }
];

export const services = [
  {
    slug: "concrete-cutting",
    name: "Concrete Cutting",
    description: "Precision concrete cutting, sawing, and coring for walls, floors, and structural elements. We handle residential and commercial projects of all sizes.",
    avgCost: "$350 – $3,500",
    permitNote: "Permits typically required for structural concrete cutting. Check with your local building department.",
    keyFacts: [
      "Wall sawing for doorways, windows, and HVAC openings",
      "Flat sawing for floor removal, trenching, and repair",
      "Core drilling for plumbing, electrical, and HVAC penetrations",
      "Wire sawing for large structural cuts and demolition",
      "All work performed by licensed, insured contractors"
    ]
  },
  {
    slug: "waterproofing",
    name: "Waterproofing",
    description: "Basement, foundation, and exterior waterproofing solutions to protect your property from water damage, flooding, and moisture intrusion.",
    avgCost: "$3,000 – $18,000",
    permitNote: "Waterproofing work generally does not require permits unless it involves structural modifications or exterior drainage systems.",
    keyFacts: [
      "Interior waterproofing: sealants, drainage systems, sump pumps",
      "Exterior waterproofing: membranes, drainage boards, French drains",
      "Foundation repair: crack injection, carbon fiber reinforcement",
      "Crawl space encapsulation: vapor barriers, dehumidification",
      "Free inspections and written estimates"
    ]
  },
  {
    slug: "concrete-finishing",
    name: "Concrete Finishing & Repair",
    description: "Concrete resurfacing, staining, sealing, and structural repair for driveways, patios, pool decks, and interior floors.",
    avgCost: "$1,500 – $8,000",
    permitNote: "Resurfacing and sealing generally do not require permits. Structural repairs may require permits depending on scope.",
    keyFacts: [
      "Concrete resurfacing for worn or damaged surfaces",
      "Decorative staining and stamping for aesthetic upgrades",
      "Sealing to protect against moisture, stains, and freeze-thaw damage",
      "Structural repair for cracks, spalling, and settlement",
      "Epoxy coatings for garage floors and commercial spaces"
    ]
  },
  {
    slug: "core-drilling",
    name: "Core Drilling",
    description: "Precision core drilling for plumbing, electrical, HVAC, and structural penetrations in concrete walls, floors, and slabs.",
    avgCost: "$75 – $350 per hole",
    permitNote: "Core drilling into structural elements (load-bearing walls, foundations) typically requires a permit and engineering review. Non-structural penetrations may not require permits.",
    keyFacts: [
      "Plumbing and electrical conduit penetrations",
      "HVAC duct and pipe openings through concrete slabs",
      "Anchor bolt and rebar installation holes",
      "Drainage and utility sleeves for new construction",
      "Precise diameter control from 1\" to 36\" diameter cores"
    ]
  },
  {
    slug: "driveway-replacement",
    name: "Driveway Replacement",
    description: "Full concrete driveway removal and replacement, including grading, rebar reinforcement, forming, and finishing for residential and commercial properties.",
    avgCost: "$3,000 – $12,000",
    permitNote: "Driveway replacement typically requires a permit when connecting to a public street or alley. Check with your local municipality for specific requirements.",
    keyFacts: [
      "Full tear-out and disposal of existing concrete or asphalt",
      "Grading and compacted base preparation",
      "Rebar or wire mesh reinforcement for longevity",
      "Control joint placement to minimize cracking",
      "Broom or exposed-aggregate finish options"
    ]
  },
  {
    slug: "foundation-repair",
    name: "Foundation Repair",
    description: "Concrete foundation crack repair, underpinning, slab lifting, and structural reinforcement for homes and commercial buildings.",
    avgCost: "$2,500 – $15,000",
    permitNote: "Foundation repair almost always requires a building permit and often requires an engineer's report. Our contractors handle the permitting process and documentation.",
    keyFacts: [
      "Crack injection (epoxy or polyurethane) for hairline to major cracks",
      "Piering and underpinning for settling foundations",
      "Slab lifting and leveling (mudjacking or foam injection)",
      "Carbon fiber straps for bowing basement walls",
      "Full written assessment and engineer-approved repair plans"
    ]
  },
  {
    slug: "stamped-concrete",
    name: "Stamped Concrete",
    description: "Decorative stamped concrete for patios, driveways, pool decks, and walkways — replicating the look of brick, stone, slate, or wood at a fraction of the cost.",
    avgCost: "$2,000 – $10,000",
    permitNote: "Stamped concrete flatwork typically does not require permits unless it involves structural changes or exceeds a certain square footage. Check with your local building department.",
    keyFacts: [
      "100+ pattern options: brick, cobblestone, flagstone, wood plank",
      "Color hardeners and release agents for realistic finishes",
      "Sealed and protected against UV fading and staining",
      "Custom patterns and borders for unique designs",
      "Ideal for patios, pool decks, driveways, and walkways"
    ]
  },
  {
    slug: "concrete-pool-deck",
    name: "Concrete Pool Deck",
    description: "New concrete pool deck installation, resurfacing, and repair. Slip-resistant finishes, cool-to-the-touch coatings, and decorative options for residential and commercial pools.",
    avgCost: "$3,500 – $14,000",
    permitNote: "Pool deck work typically requires a permit, especially when tied to a new pool installation or significant expansion. Resurfacing of an existing deck may not require a permit.",
    keyFacts: [
      "Slip-resistant broom, travertine, and kool-deck finishes",
      "Cool-deck coatings to reduce surface temperature",
      "Expansion joint installation to prevent cracking",
      "Drainage design to direct water away from pool and structure",
      "Resurfacing and overlay options to refresh existing decks"
    ]
  }
];
