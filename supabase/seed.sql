-- Seed file for EquiSales

-- Use a deterministic UUID for the main profile (for testing)
-- You must first create a user in the Supabase Dashboard Authentication tab, then copy their UUID here.
-- Assuming user id: '00000000-0000-0000-0000-000000000000' for this script.
-- Note: Replace with your actual auth.user UUID if you want them assigned to your account.

-- Farms
INSERT INTO farms (id, slug, name, location, description, logo_initials, cover_image_url, specialties, badges)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'live-oak-stables', 'Live Oak Stables', 'Ocala, Florida', 'A premier 50-acre equestrian facility specializing in the development of elite show jumping and dressage prospects. Home to world-class trainers and top-tier breeding operations.', 'LOS', '/src/assets/farm-aerial.jpg', ARRAY['Show Jumping', 'Dressage', 'Breeding'], ARRAY['Premier Facility', 'Elite Breeding']),
  ('22222222-2222-2222-2222-222222222222', 'pinewood-farm', 'Pinewood Farm', 'Wellington, Florida', 'An exclusive boutique training center focused on producing top-level Hunter and Equitation horses for the North American market.', 'PWF', '/src/assets/horse-hero.jpg', ARRAY['Hunters', 'Equitation', 'Sales'], ARRAY['Top Seller']);

-- Horses
INSERT INTO horses (id, slug, name, barn_name, breed, age, sex, color, discipline, trainer, location, farm_id, bloodline, latest_achievement, image_url, status, wins, earnings, price, sale_status, badges, temperament, story)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'northern-flame', 'Northern Flame', 'Flame', 'Thoroughbred', 5, 'Stallion', 'Bay', 'Show Jumping', 'Henrik Larsen', 'Live Oak Stables · Ocala, FL', '11111111-1111-1111-1111-111111111111', 'Tapit × Storm Cat', '1st — Ocala Spring Derby', '/src/assets/horse-portrait-3.jpg', 'Competing', 14, '$284,000', NULL, 'Not for Sale', ARRAY['Hot Sire', 'Champion Bloodline', 'Multi-Event Winner'], 7, 'Northern Flame is a striking 5-year-old Thoroughbred stallion with a commanding presence and explosive jumping scope. Known for his fierce competitive drive, he has quickly become a standout on the Ocala circuit.'),
  ('44444444-4444-4444-4444-444444444444', 'ember-rose', 'Ember Rose', 'Rosie', 'Hanoverian', 7, 'Mare', 'Chestnut', 'Dressage', 'Sofía Marín', 'Live Oak Stables · Ocala, FL', '11111111-1111-1111-1111-111111111111', 'Sir Donnerhall × Florencio', 'PSG Champion — Wellington', '/src/assets/horse-portrait-2.jpg', 'In Training', 9, '$142,500', '$250,000', 'For Sale', ARRAY['Elite Breeding Candidate', 'Wellington Champion'], 4, 'Ember Rose is a breathtaking Hanoverian mare with floating, expressive gaits. She has consistently scored above 72% at PSG and is currently schooling Grand Prix movements. An outstanding prospect for a professional or ambitious amateur.'),
  ('55555555-5555-5555-5555-555555555555', 'midnight-oak', 'Midnight Oak', 'Oakley', 'Andalusian', 9, 'Gelding', 'Black', 'Hunter', 'Henrik Larsen', 'Pinewood Farm · Ocala, FL', '22222222-2222-2222-2222-222222222222', 'Invasor × Soñador', 'Reserve Champion — HITS', '/src/assets/horse-portrait-4.jpg', 'Resting', 7, '$98,200', 'Private Treaty', 'Private Treaty', ARRAY['Proven Winner', 'Amateur Friendly'], 2, 'Midnight Oak is the epitome of the classic Hunter. With a metronome-like canter and flawless form over fences, he is a true packer who will safely carry his rider to the winner''s circle every time.');

-- Genetics
INSERT INTO genetics (type, sire, dam, price, availability, description, expected_traits, image_url)
VALUES
  ('Embryo', 'Northern Flame', 'Ember Rose', '$35,000', 'Available Now', 'A rare opportunity to acquire an embryo combining the explosive power of Northern Flame with the expressive, elastic gaits of Ember Rose. Expected to produce a world-class sport horse suitable for jumping or dressage.', ARRAY['Exceptional Scope', 'Elastic Gaits', 'Brave Temperament'], '/src/assets/horse-portrait-3.jpg'),
  ('Foal in Utero', 'Chacco-Blue', 'Quick Star Mare', 'Private Treaty', 'Due April 2027', 'Direct Chacco-Blue offspring out of a proven 1.60m Quick Star mare. This is investment-grade genetics at its absolute peak.', ARRAY['Limitless Scope', 'Careful Technique', 'Modern Blood'], '/src/assets/horse-hero.jpg');

-- Updates
INSERT INTO updates (horse_id, type, title, body, media_url, likes, comments, by, at)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'competition', '1st Place — Ocala Spring Derby', 'Clear round, 38.2s. Qualified for the WEC Grand Prix. The crowd was electric — Flame was absolutely on fire today.', '/src/assets/horse-portrait-3.jpg', 24, 6, 'Henrik Larsen', 'Today · 4:21 PM'),
  ('44444444-4444-4444-4444-444444444444', 'training', 'Worked 5f in 1:01.3', 'Easy gallop, breathing recovered in 4 minutes. Looking sharp for the Wellington final.', '/src/assets/horse-portrait-2.jpg', 11, 2, 'Sofía Marín', 'Today · 8:10 AM'),
  ('55555555-5555-5555-5555-555555555555', 'farrier', 'Farrier visit completed', 'Full reset, aluminum shoes on front. Tom noted good hoof quality — no concerns. Next visit in 6 weeks.', NULL, 3, 0, 'Tom Beckett', 'Yesterday'),
  ('33333333-3333-3333-3333-333333333333', 'media', 'Training video uploaded', 'Grid work · 1m20 jumps · poles clean. Excellent round, Flame was focused and responsive.', '/src/assets/horse-hero.jpg', 18, 4, 'Henrik Larsen', 'Yesterday'),
  ('44444444-4444-4444-4444-444444444444', 'health', 'Spring vaccinations complete', 'EEE/WEE, West Nile, Rabies, Influenza. Cleared by Dr. Patel. All good — back to full work tomorrow.', NULL, 7, 1, 'Dr. Anika Patel', 'May 14'),
  ('55555555-5555-5555-5555-555555555555', 'note', 'Easy hack in the back paddock', 'Relaxed and forward. Good recovery from Sunday''s class. Oakley seems happy to be resting this week.', '/src/assets/farm-aerial.jpg', 5, 0, 'Henrik Larsen', 'May 13');

-- Competitions
INSERT INTO competitions (horse_id, event, date, location, category, placement, rider, prize, notes, judges)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'Ocala Spring Derby', 'May 18, 2026', 'World Equestrian Center, Ocala', '1.45m Grand Prix', '1st', 'Henrik Larsen', '$42,000', 'Clear round in 38.2 seconds. Fault-free across all three phases.', ARRAY['Judge M. Castillo', 'Judge R. Hoffmann', 'Judge L. Petit']),
  ('44444444-4444-4444-4444-444444444444', 'Wellington PSG Finals', 'Apr 06, 2026', 'Wellington, FL', 'Prix St. Georges', 'Champion', 'Sofía Marín', '$18,500', 'Score 72.4%. Outstanding passage and piaffe work.', ARRAY['Judge H. Klippert', 'Judge A. Stückelberger']),
  ('33333333-3333-3333-3333-333333333333', 'HITS Ocala Week IX', 'Mar 22, 2026', 'HITS Post Time Farm', '1.40m Classic', '3rd', 'Henrik Larsen', '$7,800', 'One rail in the jump-off. Excellent time, strong performance.', ARRAY['Judge S. Watkins']),
  ('55555555-5555-5555-5555-555555555555', 'Live Oak International', 'Mar 09, 2026', 'Ocala, FL', 'Hunter Derby 3''6"', 'Reserve', 'Mia Chen', '$3,200', 'Beautifully consistent round. Judges praised the quality of movement.', ARRAY['Judge P. Atkinson', 'Judge C. Drummond']);

-- Health Records
INSERT INTO health_records (horse_id, horse_name, type, title, notes, professional, date, next_due, status)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'Northern Flame', 'vaccination', 'Spring vaccinations', 'EEE/WEE · West Nile · Rabies · Influenza — all administered without reaction.', 'Dr. Anika Patel', 'May 14, 2026', 'Nov 2026', 'clear'),
  ('44444444-4444-4444-4444-444444444444', 'Ember Rose', 'farrier', 'Farrier — full reset', 'Steel plates on hinds, aluminum on fronts. Slight left-front flare corrected.', 'Tom Beckett', 'May 12, 2026', 'Jun 23, 2026', 'clear'),
  ('55555555-5555-5555-5555-555555555555', 'Midnight Oak', 'vet', 'Lameness exam — clean', 'Flexion tests negative all four limbs. Dr. Rivera cleared for full work.', 'Dr. Rivera', 'May 10, 2026', NULL, 'clear'),
  ('33333333-3333-3333-3333-333333333333', 'Northern Flame', 'dental', 'Dental floating', 'Routine · no points or hooks found. Next floating recommended in 12 months.', 'Dr. Rivera', 'Apr 02, 2026', 'Apr 2027', 'clear');
