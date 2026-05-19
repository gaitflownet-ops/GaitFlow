import hero from "@/assets/horse-portrait-3.jpg";
import chestnut from "@/assets/horse-portrait-2.jpg";
import black from "@/assets/horse-portrait-4.jpg";
import stable from "@/assets/horse-hero.jpg";
import farm from "@/assets/farm-aerial.jpg";

export const images = { hero, chestnut, black, stable, farm };

export type Horse = {
  id: string;
  name: string;
  barnName: string;
  breed: string;
  age: number;
  sex: "Stallion" | "Mare" | "Gelding";
  color: string;
  discipline: string;
  owner: string;
  trainer: string;
  location: string;
  bloodline: string;
  latestAchievement: string;
  image: string;
  status: "In Training" | "Resting" | "Breeding" | "Competing";
  wins?: number;
  earnings?: string;
};

export const horses: Horse[] = [
  {
    id: "northern-flame",
    name: "Northern Flame",
    barnName: "Flame",
    breed: "Thoroughbred",
    age: 5,
    sex: "Stallion",
    color: "Bay",
    discipline: "Show Jumping",
    owner: "Marisol Vega",
    trainer: "Henrik Larsen",
    location: "Live Oak Stables · Ocala, FL",
    bloodline: "Tapit × Storm Cat",
    latestAchievement: "1st — Ocala Spring Derby",
    image: hero,
    status: "Competing",
    wins: 14,
    earnings: "$284,000",
  },
  {
    id: "ember-rose",
    name: "Ember Rose",
    barnName: "Rosie",
    breed: "Hanoverian",
    age: 7,
    sex: "Mare",
    color: "Chestnut",
    discipline: "Dressage",
    owner: "Marisol Vega",
    trainer: "Sofía Marín",
    location: "Live Oak Stables · Ocala, FL",
    bloodline: "Sir Donnerhall × Florencio",
    latestAchievement: "PSG Champion — Wellington",
    image: chestnut,
    status: "In Training",
    wins: 9,
    earnings: "$142,500",
  },
  {
    id: "midnight-oak",
    name: "Midnight Oak",
    barnName: "Oakley",
    breed: "Andalusian",
    age: 9,
    sex: "Gelding",
    color: "Black",
    discipline: "Hunter",
    owner: "Marisol Vega",
    trainer: "Henrik Larsen",
    location: "Pinewood Farm · Ocala, FL",
    bloodline: "Invasor × Soñador",
    latestAchievement: "Reserve Champion — HITS",
    image: black,
    status: "Resting",
    wins: 7,
    earnings: "$98,200",
  },
];

export type Update = {
  id: string;
  horseId: string;
  type: "competition" | "training" | "farrier" | "media" | "health" | "note";
  title: string;
  body: string;
  at: string;
  by: string;
  media?: string;
  likes?: number;
  comments?: number;
};

export const updates: Update[] = [
  {
    id: "u1",
    horseId: "northern-flame",
    type: "competition",
    title: "1st Place — Ocala Spring Derby",
    body: "Clear round, 38.2s. Qualified for the WEC Grand Prix. The crowd was electric — Flame was absolutely on fire today.",
    at: "Today · 4:21 PM",
    by: "Henrik Larsen",
    media: hero,
    likes: 24,
    comments: 6,
  },
  {
    id: "u2",
    horseId: "ember-rose",
    type: "training",
    title: "Worked 5f in 1:01.3",
    body: "Easy gallop, breathing recovered in 4 minutes. Looking sharp for the Wellington final.",
    at: "Today · 8:10 AM",
    by: "Sofía Marín",
    media: chestnut,
    likes: 11,
    comments: 2,
  },
  {
    id: "u3",
    horseId: "midnight-oak",
    type: "farrier",
    title: "Farrier visit completed",
    body: "Full reset, aluminum shoes on front. Tom noted good hoof quality — no concerns. Next visit in 6 weeks.",
    at: "Yesterday",
    by: "Tom Beckett",
    likes: 3,
    comments: 0,
  },
  {
    id: "u4",
    horseId: "northern-flame",
    type: "media",
    title: "Training video uploaded",
    body: "Grid work · 1m20 jumps · poles clean. Excellent round, Flame was focused and responsive.",
    at: "Yesterday",
    by: "Henrik Larsen",
    media: stable,
    likes: 18,
    comments: 4,
  },
  {
    id: "u5",
    horseId: "ember-rose",
    type: "health",
    title: "Spring vaccinations complete",
    body: "EEE/WEE, West Nile, Rabies, Influenza. Cleared by Dr. Patel. All good — back to full work tomorrow.",
    at: "May 14",
    by: "Dr. Anika Patel",
    likes: 7,
    comments: 1,
  },
  {
    id: "u6",
    horseId: "midnight-oak",
    type: "note",
    title: "Easy hack in the back paddock",
    body: "Relaxed and forward. Good recovery from Sunday's class. Oakley seems happy to be resting this week.",
    at: "May 13",
    by: "Henrik Larsen",
    media: farm,
    likes: 5,
    comments: 0,
  },
];

export type Competition = {
  id: string;
  horseId: string;
  event: string;
  date: string;
  location: string;
  category: string;
  placement: string;
  rider: string;
  prize: string;
  notes?: string;
  judges?: string[];
};

export const competitions: Competition[] = [
  {
    id: "c1",
    horseId: "northern-flame",
    event: "Ocala Spring Derby",
    date: "May 18, 2026",
    location: "World Equestrian Center, Ocala",
    category: "1.45m Grand Prix",
    placement: "1st",
    rider: "Henrik Larsen",
    prize: "$42,000",
    notes: "Clear round in 38.2 seconds. Fault-free across all three phases.",
    judges: ["Judge M. Castillo", "Judge R. Hoffmann", "Judge L. Petit"],
  },
  {
    id: "c2",
    horseId: "ember-rose",
    event: "Wellington PSG Finals",
    date: "Apr 06, 2026",
    location: "Wellington, FL",
    category: "Prix St. Georges",
    placement: "Champion",
    rider: "Sofía Marín",
    prize: "$18,500",
    notes: "Score 72.4%. Outstanding passage and piaffe work.",
    judges: ["Judge H. Klippert", "Judge A. Stückelberger"],
  },
  {
    id: "c3",
    horseId: "northern-flame",
    event: "HITS Ocala Week IX",
    date: "Mar 22, 2026",
    location: "HITS Post Time Farm",
    category: "1.40m Classic",
    placement: "3rd",
    rider: "Henrik Larsen",
    prize: "$7,800",
    notes: "One rail in the jump-off. Excellent time, strong performance.",
    judges: ["Judge S. Watkins"],
  },
  {
    id: "c4",
    horseId: "midnight-oak",
    event: "Live Oak International",
    date: "Mar 09, 2026",
    location: "Ocala, FL",
    category: "Hunter Derby 3'6\"",
    placement: "Reserve",
    rider: "Mia Chen",
    prize: "$3,200",
    notes: "Beautifully consistent round. Judges praised the quality of movement.",
    judges: ["Judge P. Atkinson", "Judge C. Drummond"],
  },
];

export type HealthRecord = {
  id: string;
  horseId: string;
  horse: string;
  type: "vaccination" | "vet" | "farrier" | "dental" | "coggins" | "xray";
  title: string;
  notes: string;
  professional: string;
  date: string;
  nextDue?: string;
  status: "clear" | "requires_followup" | "pending";
};

export const healthRecords: HealthRecord[] = [
  {
    id: "h1",
    horseId: "northern-flame",
    horse: "Northern Flame",
    type: "vaccination",
    title: "Spring vaccinations",
    notes: "EEE/WEE · West Nile · Rabies · Influenza — all administered without reaction.",
    professional: "Dr. Anika Patel",
    date: "May 14, 2026",
    nextDue: "Nov 2026",
    status: "clear",
  },
  {
    id: "h2",
    horseId: "ember-rose",
    horse: "Ember Rose",
    type: "farrier",
    title: "Farrier — full reset",
    notes: "Steel plates on hinds, aluminum on fronts. Slight left-front flare corrected.",
    professional: "Tom Beckett",
    date: "May 12, 2026",
    nextDue: "Jun 23, 2026",
    status: "clear",
  },
  {
    id: "h3",
    horseId: "midnight-oak",
    horse: "Midnight Oak",
    type: "vet",
    title: "Lameness exam — clean",
    notes: "Flexion tests negative all four limbs. Dr. Rivera cleared for full work.",
    professional: "Dr. Rivera",
    date: "May 10, 2026",
    status: "clear",
  },
  {
    id: "h4",
    horseId: "northern-flame",
    horse: "Northern Flame",
    type: "dental",
    title: "Dental floating",
    notes: "Routine · no points or hooks found. Next floating recommended in 12 months.",
    professional: "Dr. Rivera",
    date: "Apr 02, 2026",
    nextDue: "Apr 2027",
    status: "clear",
  },
  {
    id: "h5",
    horseId: "ember-rose",
    horse: "Ember Rose",
    type: "coggins",
    title: "Coggins · negative",
    notes: "EIA negative. Certificate valid 12 months for travel.",
    professional: "Dr. Anika Patel",
    date: "Mar 28, 2026",
    nextDue: "Mar 2027",
    status: "clear",
  },
  {
    id: "h6",
    horseId: "midnight-oak",
    horse: "Midnight Oak",
    type: "xray",
    title: "Hoof X-rays",
    notes: "Front feet · balanced pedal bone position · no pathology detected.",
    professional: "Tom Beckett + Dr. Patel",
    date: "Mar 12, 2026",
    status: "clear",
  },
  {
    id: "h7",
    horseId: "midnight-oak",
    horse: "Midnight Oak",
    type: "vaccination",
    title: "Influenza booster due",
    notes: "Booster overdue by 3 days — schedule with Dr. Patel.",
    professional: "Pending — Dr. Anika Patel",
    date: "Due May 22, 2026",
    status: "requires_followup",
  },
];

export const team = [
  {
    id: "henrik-larsen",
    name: "Henrik Larsen",
    role: "Head Trainer",
    initials: "HL",
    last: "Logged session for Northern Flame",
    color: "forest",
    email: "henrik@liveoakstables.com",
    phone: "+1 (352) 555-0191",
    speciality: "Show Jumping · Grand Prix",
    since: "2021",
  },
  {
    id: "sofia-marin",
    name: "Sofía Marín",
    role: "Dressage Trainer",
    initials: "SM",
    last: "Uploaded video for Ember Rose",
    color: "leather",
    email: "sofia@marinequestrian.com",
    phone: "+1 (352) 555-0204",
    speciality: "Prix St. Georges · Intermediaire",
    since: "2022",
  },
  {
    id: "dr-anika-patel",
    name: "Dr. Anika Patel",
    role: "Veterinarian",
    initials: "AP",
    last: "Closed vaccination record",
    color: "bronze",
    email: "dr.patel@ocalaequestrianvet.com",
    phone: "+1 (352) 555-0278",
    speciality: "Sports Medicine · Lameness",
    since: "2020",
  },
  {
    id: "tom-beckett",
    name: "Tom Beckett",
    role: "Farrier",
    initials: "TB",
    last: "Completed farrier visit",
    color: "gold",
    email: "tom@beckettshoeing.com",
    phone: "+1 (352) 555-0315",
    speciality: "Performance Shoeing · Corrective",
    since: "2020",
  },
  {
    id: "mia-chen",
    name: "Mia Chen",
    role: "Rider",
    initials: "MC",
    last: "Hunter Derby — Reserve",
    color: "charcoal",
    email: "mia.chen@equestrian.com",
    phone: "+1 (352) 555-0389",
    speciality: "Hunter · Equitation",
    since: "2023",
  },
  {
    id: "marisol-vega",
    name: "Marisol Vega",
    role: "Owner",
    initials: "MV",
    last: "Reviewed Spring Derby recap",
    color: "forest",
    email: "marisol@liveoakstables.com",
    phone: "+1 (352) 555-0182",
    speciality: "Owner · Investor",
    since: "2019",
  },
];

export const notifications = [
  {
    id: "n1",
    title: "Northern Flame won 1st place",
    body: "Ocala Spring Derby · 1.45m Grand Prix",
    at: "2h ago",
    kind: "win" as const,
    horseId: "northern-flame",
  },
  {
    id: "n2",
    title: "New training video available",
    body: "Ember Rose — grid work · 1m20",
    at: "5h ago",
    kind: "media" as const,
    horseId: "ember-rose",
  },
  {
    id: "n3",
    title: "Vaccination reminder",
    body: "Midnight Oak — Influenza booster due Friday",
    at: "1d ago",
    kind: "health" as const,
    horseId: "midnight-oak",
  },
  {
    id: "n4",
    title: "Farrier scheduled",
    body: "Northern Flame · June 2 · 9:00 AM with Tom Beckett",
    at: "1d ago",
    kind: "service" as const,
    horseId: "northern-flame",
  },
  {
    id: "n5",
    title: "Competition entry confirmed",
    body: "WEC Summer Series Week 1 · Northern Flame",
    at: "2d ago",
    kind: "win" as const,
    horseId: "northern-flame",
  },
  {
    id: "n6",
    title: "Vet check-up completed",
    body: "Ember Rose — coggins update, all clear",
    at: "3d ago",
    kind: "health" as const,
    horseId: "ember-rose",
  },
];

export const events = [
  {
    id: "e1",
    title: "WEC Summer Series · Week 1",
    date: "May 24",
    time: "08:00",
    where: "World Equestrian Center",
    horse: "Northern Flame",
    horseId: "northern-flame",
  },
  {
    id: "e2",
    title: "Vet check — coggins update",
    date: "May 26",
    time: "10:30",
    where: "Live Oak Stables",
    horse: "Ember Rose",
    horseId: "ember-rose",
  },
  {
    id: "e3",
    title: "Breeding consult",
    date: "May 29",
    time: "14:00",
    where: "Pinewood Farm",
    horse: "Midnight Oak",
    horseId: "midnight-oak",
  },
];

export function horseById(id: string) {
  return horses.find((h) => h.id === id);
}
