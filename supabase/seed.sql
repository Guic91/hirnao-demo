-- Seed: Paris-based friend group for Hirnao demo

INSERT INTO users (id, email, full_name, city, interests, preferred_areas, social_preferences, onboarding_completed) VALUES
  ('00000000-0000-0000-0000-000000000001', 'lea.martin@email.fr', 'Léa Martin', 'Paris',
   ARRAY['restaurants', 'expositions', 'apéros', 'randonnée urbaine'],
   ARRAY['Marais', 'Bastille', 'Canal Saint-Martin', 'Montmartre'],
   '{"group_size": "4-6 personnes", "spontaneity": "modéré", "budget": "moyen"}'::jsonb, true);

INSERT INTO contacts (user_id, name, email, relationship, neighborhood) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Thomas Dubois', 'thomas.d@email.fr', 'ami', 'Bastille'),
  ('00000000-0000-0000-0000-000000000001', 'Camille Rousseau', 'camille.r@email.fr', 'ami', 'Marais'),
  ('00000000-0000-0000-0000-000000000001', 'Hugo Bernard', 'hugo.b@email.fr', 'collègue', 'République'),
  ('00000000-0000-0000-0000-000000000001', 'Emma Laurent', 'emma.l@email.fr', 'ami', 'Montmartre'),
  ('00000000-0000-0000-0000-000000000001', 'Lucas Petit', 'lucas.p@email.fr', 'ami', 'Canal Saint-Martin'),
  ('00000000-0000-0000-0000-000000000001', 'Chloé Moreau', 'chloe.m@email.fr', 'collègue', 'Oberkampf');
