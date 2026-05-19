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
  },
];

export const updates = [
  {
    id: "u1",
    horseId: "northern-flame",
    type: "competition",
    title: "1st Place — Ocala Spring Derby",
    body: "Clear round, 38.2s. Qualified for the WEC Grand Prix.",
    at: "Today · 4:21 PM",
    by: "Henrik Larsen",
    media: hero,
  },
  {
    id: "u2",
    horseId: "ember-rose",
    type: "training",
    title: "Worked 5f in 1:01.3",
    body: "Easy gallop, breathing recovered in 4 minutes.",
    at: "Today · 8:10 AM",
    by: "Sofía Marín",
    media: chestnut,
  },
  {
    id: "u3",
    horseId: "midnight-oak",
    type: "farrier",
    title: "Farrier visit completed",
    body: "Full reset, aluminum shoes on front. Next visit in 6 weeks.",
    at: "Yesterday",
    by: "Tom Beckett",
  },
  {
    id: "u4",
    horseId: "northern-flame",
    type: "media",
    title: "Training video uploaded",
    body: "Grid work · 1m20 jumps · poles clean.",
    at: "Yesterday",
    by: "Henrik Larsen",
    media: stable,
  },
  {
    id: "u5",
    horseId: "ember-rose",
    type: "health",
    title: "Spring vaccinations complete",
    body: "EEE/WEE, West Nile, Rabies, Influenza. Cleared by Dr. Patel.",
    at: "May 14",
    by: "Dr. Anika Patel",
  },
  {
    id: "u6",
    horseId: "midnight-oak",
    type: "note",
    title: "Easy hack in the back paddock",
    body: "Relaxed and forward. Good recovery from Sunday's class.",
    at: "May 13",
    by: "Henrik Larsen",
    media: farm,
  },
];

export const competitions = [
  { id: "c1", horseId: "northern-flame", event: "Ocala Spring Derby", date: "May 18, 2026", location: "World Equestrian Center, Ocala", category: "1.45m Grand Prix", placement: "1st", rider: "Henrik Larsen", prize: "$42,000" },
  { id: "c2", horseId: "ember-rose", event: "Wellington PSG Finals", date: "Apr 06, 2026", location: "Wellington, FL", category: "Prix St. Georges", placement: "Champion", rider: "Sofía Marín", prize: "$18,500" },
  { id: "c3", horseId: "northern-flame", event: "HITS Ocala Week IX", date: "Mar 22, 2026", location: "HITS Post Time Farm", category: "1.40m Classic", placement: "3rd", rider: "Henrik Larsen", prize: "$7,800" },
  { id: "c4", horseId: "midnight-oak", event: "Live Oak International", date: "Mar 09, 2026", location: "Ocala, FL", category: "Hunter Derby 3'6\"", placement: "Reserve", rider: "Mia Chen", prize: "$3,200" },
];

export const team = [
  { name: "Henrik Larsen", role: "Head Trainer", initials: "HL", last: "Logged session for Northern Flame", color: "forest" },
  { name: "Sofía Marín", role: "Dressage Trainer", initials: "SM", last: "Uploaded video for Ember Rose", color: "leather" },
  { name: "Dr. Anika Patel", role: "Veterinarian", initials: "AP", last: "Closed vaccination record", color: "bronze" },
  { name: "Tom Beckett", role: "Farrier", initials: "TB", last: "Completed farrier visit", color: "gold" },
  { name: "Mia Chen", role: "Rider", initials: "MC", last: "Hunter Derby — Reserve", color: "charcoal" },
  { name: "Marisol Vega", role: "Owner", initials: "MV", last: "Reviewed Spring Derby recap", color: "forest" },
];

export const notifications = [
  { id: "n1", title: "Northern Flame won 1st place", body: "Ocala Spring Derby · 1.45m Grand Prix", at: "2h ago", kind: "win" },
  { id: "n2", title: "New training video available", body: "Ember Rose — grid work · 1m20", at: "5h ago", kind: "media" },
  { id: "n3", title: "Vaccination reminder", body: "Midnight Oak — Influenza booster due Friday", at: "1d ago", kind: "health" },
  { id: "n4", title: "Farrier scheduled", body: "Northern Flame · June 2 · 9:00 AM with Tom Beckett", at: "1d ago", kind: "service" },
];

export const events = [
  { id: "e1", title: "WEC Summer Series · Week 1", date: "May 24", time: "08:00", where: "World Equestrian Center", horse: "Northern Flame" },
  { id: "e2", title: "Vet check — coggins update", date: "May 26", time: "10:30", where: "Live Oak Stables", horse: "Ember Rose" },
  { id: "e3", title: "Breeding consult", date: "May 29", time: "14:00", where: "Pinewood Farm", horse: "Midnight Oak" },
];

export function horseById(id: string) {
  return horses.find((h) => h.id === id);
}
