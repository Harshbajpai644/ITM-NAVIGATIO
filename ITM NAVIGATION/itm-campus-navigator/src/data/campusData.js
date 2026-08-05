export const CAMPUS_CENTER = { lat: 26.13820, lng: 78.20780 };

export const PURPOSES = [
  "Admission Enquiry",
  "Fee Payment",
  "Faculty se milna hai",
  "Library",
  "Examination Cell",
  "Hostel Enquiry",
  "Placement Cell",
  "Other",
];

export const CATEGORIES = [
  { id: "all", label: "ALL" },
  { id: "blocks", label: "BLOCKS" },
  { id: "hostel", label: "HOSTEL" },
  { id: "library", label: "LIBRARY" },
  { id: "admission", label: "ADMISSION" },
  { id: "canteen", label: "CANTEEN" },
];

/**
 * Live GPS pins from campus walk (Aug 2026).
 * Library / Admission / LDV shared one pin — slight offsets so 3D models don't stack.
 * Boys hostel pin was incomplete in the list — placed along Hostel Road.
 */
export const BLOCKS = [
  {
    id: "admission",
    name: "Admission Cell(LDV BLOCK)",
    category: "admission",
    lat: 26.13770,
    lng: 78.20805,
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200&auto=format&fit=crop",
    description:
      "Your one-stop destination for admissions, guidance, and personalized counseling to support every step of your academic journey.",
    hours: "Mon–Sat, 9:30 AM – 5:00 PM",
    facilities: ["Admission Desk", "Accounts / Fee Counter", "Examination Cell", "Registrar Office", "Waiting Lounge"],
    nearby: ["library", "ldv-block"],
    people: [
      { name: "Admission Cell", designation: "Admissions & Enquiry Desk", room: "Ground Floor, Room 5" },
      { name: "Accounts Section", designation: "Fee & Accounts", room: "Ground Floor, Room 8" },
      { name: "Examination Cell", designation: "Exam Records & Results", room: "First Floor, Room 14" },
      { name: "Registrar Office", designation: "Registrar", room: "First Floor, Room 20" },
    ],
  },
  {
    id: "mg-block",
    name: "MG BLOCK",
    category: "School of Engineering & Technology",
    lat: 26.138308,
    lng: 78.207320,
    image: "/itm-university-gwalior-352158.webp",
    description:
      "Offering industry-focused education across Computer Science, Artificial Intelligence & Data Science, Information Technology, Electronics & Communication, Electrical, Mechanical, Civil, and related engineering disciplines, supported by advanced laboratories, experienced faculty, and hands-on learning.",
    hours: "Mon–Sat, 8:30 AM – 5:30 PM",
    facilities: ["Computer Labs", "Electronics Lab", "Mechanical Workshop", "Faculty Cabins", "Seminar Hall"],
    nearby: ["library", "pc-block", "kirloskar-block"],
    people: [
      // Ground Floor
      { name: "Dr. Mukesh Pandety", designation: "Dean Office", room: "103", floor: "Ground Floor" },
      { name: "Dr. Sanjay Jain", designation: "Faculty", room: "105", floor: "Ground Floor" },
      { name: "Dr. Nidhi Dandotiya", designation: "Faculty", room: "109", floor: "Ground Floor" },
      { name: "Dr. Keerti Shrivastava", designation: "Faculty", room: "112", floor: "Ground Floor" },
      { name: "Dr. Manali Shukla", designation: "Faculty", room: "114", floor: "Ground Floor" },
      { name: "Dr. Geetanjali Surange", designation: "Faculty", room: "115", floor: "Ground Floor" },
      { name: "Mr. Suraj Sharma", designation: "Faculty", room: "117", floor: "Ground Floor" },
      { name: "Mr. Yash Jha", designation: "Faculty", room: "117", floor: "Ground Floor" },
      { name: "Mr. V. Naveen Chainlu", designation: "Faculty", room: "117", floor: "Ground Floor" },
      { name: "Mr. Hirendra Singh Sengar", designation: "Faculty", room: "117", floor: "Ground Floor" },
      { name: "Dr. Pallavi Khatri", designation: "Faculty", room: "122", floor: "Ground Floor" },
      // First Floor
      { name: "Ms. Bharati Gole", designation: "Faculty", room: "206", floor: "First Floor" },
      { name: "Ms. Anjali Saraswat", designation: "Faculty", room: "206", floor: "First Floor" },
      { name: "Mr. Shubham Dhakarey", designation: "Faculty", room: "206", floor: "First Floor" },
      { name: "Ms. Gauri Sharma", designation: "Faculty", room: "206", floor: "First Floor" },
      { name: "Dr. Shashikant Gupta", designation: "Faculty", room: "211", floor: "First Floor" },
      // Second Floor
      { name: "Ms. Pooja Sengar", designation: "Faculty", room: "307", floor: "Second Floor" },
      { name: "Ms. Anchal Bhatt", designation: "Faculty", room: "307", floor: "Second Floor" },
      { name: "Ms. Anisha Agrawal", designation: "Faculty", room: "307", floor: "Second Floor" },
      { name: "Ms. Manali Singh", designation: "Faculty", room: "307", floor: "Second Floor" },
      { name: "Mr. H.N. Verma", designation: "Faculty", room: "PCB-300", floor: "Second Floor" },
      { name: "Mr. Neeraj Goyal", designation: "Faculty", room: "309", floor: "Second Floor" },
      { name: "Mr. Vipin Jadon", designation: "Faculty", room: "309", floor: "Second Floor" },
      { name: "Mr. Manoj Sharma", designation: "Faculty", room: "309", floor: "Second Floor" },
      { name: "Mr. Manish Kumar Jain", designation: "Faculty", room: "309", floor: "Second Floor" },
      { name: "Mr. Saurabh Chaturvedi", designation: "Faculty", room: "309", floor: "Second Floor" },
      { name: "Mr. Ashish Singh Yadav", designation: "Faculty", room: "309", floor: "Second Floor" },
      { name: "Mr. Somesh Sharma", designation: "Faculty", room: "309", floor: "Second Floor" },
      // Third Floor
      { name: "Dr. Aravendra Kumar Sharma", designation: "Faculty", room: "404", floor: "Third Floor" },
      { name: "Mr. Gajendra Singh Rajput", designation: "Faculty", room: "404", floor: "Third Floor" },
      { name: "Mr. Sudhir Sharma", designation: "Faculty", room: "404", floor: "Third Floor" },
      { name: "Ms. Anupama Bhadauriya", designation: "Faculty", room: "404", floor: "Third Floor" },
      { name: "Ms. Pragya Jain", designation: "Faculty", room: "404", floor: "Third Floor" },
      // Fourth Floor
      { name: "Dr. Rakesh Prasad Sarang", designation: "Faculty", room: "504", floor: "Fourth Floor" },
      { name: "Dr. Anjali Kedawat", designation: "Faculty", room: "504", floor: "Fourth Floor" },
      { name: "Dr. Jyoti Balakaundal", designation: "Faculty", room: "504", floor: "Fourth Floor" },
    ],
  },
  {
    id: "ldv-block",
    name: "LDV BLOCK",
    category: "School of Management Studies",
    lat: 26.13780,
    lng: 78.20830,
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop",
    description:
      "Offering industry-focused programs in BBA, MBA, B.Com, M.Com, Hospitality & Hotel Management, Tourism Management, and related business disciplines, with a strong emphasis on leadership, entrepreneurship, and practical learning.",
    hours: "Mon–Sat, 9:00 AM – 5:00 PM",
    facilities: ["Case Study Room", "Seminar Hall", "Faculty Cabins", "Placement Prep Room"],
    nearby: ["admission", "library"],
    people: [
      { name: "Dr. N. Kapoor", designation: "HOD, Management Studies", room: "Room 30" },
      { name: "Prof. D. Nair", designation: "Assistant Professor, Marketing", room: "Room 45" },
    ],
  },
  {
    id: "pc-block",
    name: "PCB BLOCK",
    category: "School of Nursing",
    lat: 26.138499,
    lng: 78.206909,
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1200&auto=format&fit=crop",
    description:
      "Offering comprehensive programs B.Sc. Nursing, Post Basic B.Sc. Nursing, and M.Sc. Nursing, with advanced clinical training, experienced faculty, and hands-on healthcare education.",
    hours: "Mon–Sat, 9:00 AM – 4:30 PM",
    facilities: ["Skill Lab", "Demonstration Room", "Faculty Cabins"],
    nearby: ["placement", "mg-block"],
    people: [{ name: "", designation: "HOD, School of Nursing", room: "Room 5" }],
  },
  {
    id: "library",
    name: "CENTRAL LIBRARY",
    category: "library",
    lat: 26.137636,
    lng: 78.208172,
    image: "/central.library.webp",
    description:
      "A fully air-conditioned library with spacious seating, an extensive collection of books and digital resources, and a quiet, comfortable environment for learning and research.",
    hours: "Mon–Sat, 8:00 AM – 8:00 PM",
    facilities: ["Reading Hall", "Digital Library", "Book Issue Counter", "Reference Section"],
    nearby: ["admission", "ldv-block", "mg-block"],
    people: [
      { name: "Dr. P. Joshi", designation: "Chief Librarian", room: "Reading Hall Desk" },
      { name: "Book Issue Counter", designation: "Issue / Return", room: "Ground Floor" },
    ],
  },
  {
    id: "kirloskar-block",
    name: "KIRLOSKAR BLOCK",
    category: "School of fashion & design",
    lat: 26.138395,
    lng: 78.207484,
    image: "/kirloskar-block.jpg",
    description:
      "Fostering creativity and innovation through industry-focused education, modern design studios, and hands-on learning in fashion and design.",
    hours: "9:00 AM – 5:00 PM",
    facilities: ["Design Studios", "Faculty Cabins", "Seminar Space"],
    nearby: ["mg-block", "jcb-block", "canteen"],
    people: [
      { name: "Events Coordinator", designation: "Cultural & Events Cell", room: "Backstage Office" },
    ],
  },
  {
    id: "jcb-block",
    name: "JCB BLOCK",
    category: "blocks",
    lat: 26.138327,
    lng: 78.207775,
    image: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1200&auto=format&fit=crop",
    description: "Academic block on the campus central stretch.",
    hours: "Mon–Sat, 9:00 AM – 5:00 PM",
    facilities: ["Classrooms", "Faculty Cabins"],
    nearby: ["kirloskar-block", "mg-block"],
    people: [],
  },
  {
    id: "placement",
    name: "PLACEMENT CELL",
    category: "blocks",
    lat: 26.138015,
    lng: 78.206967,
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop",
    description: "Campus placement and career services cell.",
    hours: "Mon–Sat, 9:30 AM – 5:00 PM",
    facilities: ["Counseling Desk", "Interview Rooms"],
    nearby: ["pc-block", "mg-block"],
    people: [{ name: "Placement Office", designation: "Training & Placement", room: "Ground Floor" }],
  },
  {
    id: "hostel",
    name: "BOYS HOSTEL",
    category: "hostel",
    // Exact pin missing in list — placed along Hostel Road (east). Confirm next visit.
    lat: 26.13780,
    lng: 78.21240,
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=1200&auto=format&fit=crop",
    description:
      "Experience comfortable campus living with spacious, well-maintained rooms, 24/7 security, essential facilities, and a conveniently located mess hall.",
    hours: "24 Hours (Warden Office: 9 AM – 7 PM)",
    facilities: ["Mess Hall", "Common Room", "Warden Office"],
    nearby: ["hostel-road", "canteen"],
    people: [{ name: "Hostel Warden", designation: "Boys Hostel Warden", room: "Warden Office" }],
  },
  {
    id: "sports-arena",
    name: "SPORTS ARENA",
    category: "School of physical education",
    lat: 26.137437,
    lng: 78.209005,
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba6851?q=80&w=1200&auto=format&fit=crop",
    description:
      "Promoting fitness, sports excellence, and holistic student development through modern facilities, expert coaching, and quality physical education.",
    hours: "9 AM – 5 PM",
    facilities: ["Sports Ground", "Courts"],
    nearby: ["playground", "library"],
    people: [{ name: "Sports Coordinator", designation: "Physical Education", room: "" }],
  },
  {
    id: "playground",
    name: "PLAYGROUND",
    category: "blocks",
    lat: 26.138411,
    lng: 78.208944,
    image: "https://images.unsplash.com/photo-1459865264687-595d652dea73?q=80&w=1200&auto=format&fit=crop",
    description: "Open playground near the sports arena.",
    hours: "Sunrise – Sunset",
    facilities: ["Open Field"],
    nearby: ["sports-arena", "library"],
    people: [],
  },
  {
    id: "canteen",
    name: "CANTEEN",
    category: "canteen",
    lat: 26.140382,
    lng: 78.207215,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
    description:
      "A clean and spacious canteen serving fresh, hygienic, and affordable meals and refreshments in a comfortable dining environment for students and staff.",
    hours: "Mon–Sat, 8:00 AM – 8:00 PM",
    facilities: ["Dining Area", "Snacks Counter"],
    nearby: ["kirloskar-block", "hostel"],
    people: [{ name: "Canteen Staff", designation: "Canteen", room: "" }],
  },
  {
    id: "itm-gate",
    name: "ITM GATE",
    category: "blocks",
    lat: 26.139144,
    lng: 78.207284,
    image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1200&auto=format&fit=crop",
    description: "Main campus gate entry.",
    hours: "As per campus schedule",
    facilities: ["Security", "Entry Gate"],
    nearby: ["canteen", "kirloskar-block"],
    people: [],
  },
  {
    id: "main-parking",
    name: "MAIN PARKING",
    category: "blocks",
    lat: 26.136379,
    lng: 78.209489,
    image: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=1200&auto=format&fit=crop",
    description: "Main vehicle parking area.",
    hours: "Campus hours",
    facilities: ["Parking"],
    nearby: ["sports-arena", "itm-global-school"],
    people: [],
  },
  {
    id: "itm-global-school",
    name: "ITM GLOBAL SCHOOL",
    category: "blocks",
    lat: 26.134653,
    lng: 78.209040,
    image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1200&auto=format&fit=crop",
    description: "ITM Global School on campus approach.",
    hours: "School hours",
    facilities: ["Campus"],
    nearby: ["main-parking"],
    people: [],
  },
];

/** Path / approach pins for camera preview (not always shown as full buildings). */
export const PATH_POINTS = [
  { id: "parking-access", name: "Parking access (vehicle + walk)", lat: 26.137452, lng: 78.211487 },
  { id: "parking-2-access", name: "Parking 2 access", lat: 26.137246, lng: 78.210159 },
  { id: "walking-rasta", name: "Walking path", lat: 26.137447, lng: 78.209702 },
  { id: "hostel-road", name: "Hostel road", lat: 26.137119, lng: 78.213063 },
  { id: "mg-side-path", name: "Campus path (MG side)", lat: 26.137537, lng: 78.207301 },
];

/** Straight campus spine for far-away fly-through preview. */
export const CAMPUS_SPINE = [
  [78.209040, 26.134653], // Global School
  [78.209489, 26.136379], // Main parking
  [78.210159, 26.137246], // Parking 2 access
  [78.209702, 26.137447], // Walking path
  [78.209005, 26.137437], // Sports arena
  [78.208172, 26.137636], // Library cluster
  [78.207484, 26.138395], // Kirloskar
  [78.207320, 26.138308], // MG Block
  [78.207775, 26.138327], // JCB
  [78.207284, 26.139144], // Gate
  [78.207215, 26.140382], // Canteen
];
