-- Seed: demo event for development

INSERT INTO users (id, email, display_name, locale, role, email_verified) VALUES
  ('00000000-0000-0000-0000-000000000001', 'organizer@hirnao.app', 'Marie Organisatrice', 'fr', 'organizer', true),
  ('00000000-0000-0000-0000-000000000002', 'sophie@demo.app', 'Sophie Martin', 'fr', 'participant', true),
  ('00000000-0000-0000-0000-000000000003', 'alex@demo.app', 'Alex Chen', 'en', 'participant', true),
  ('00000000-0000-0000-0000-000000000004', 'lucas@demo.app', 'Lucas Dubois', 'fr', 'participant', true);

INSERT INTO user_settings (user_id) VALUES
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000004');

INSERT INTO events (id, organizer_id, slug, title, description, venue_name, starts_at, ends_at, status, qr_code_token) VALUES
  ('10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'ai-summit-paris-2026',
   'AI Summit Paris 2026',
   'Conférence sur l''IA appliquée à l''événementiel et au networking.',
   'Station F',
   NOW() + INTERVAL '1 day',
   NOW() + INTERVAL '1 day 8 hours',
   'published',
   'demo-qr-ai-summit-2026');

INSERT INTO event_zones (event_id, name, zone_type, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Salle principale', 'main_hall', 1),
  ('10000000-0000-0000-0000-000000000001', 'Bar', 'bar', 2),
  ('10000000-0000-0000-0000-000000000001', 'Terrasse', 'terrace', 3);

INSERT INTO card_profiles (user_id, context_type, context_id, headline, bio, activity, interests, expertises, intentions, seeking, offering) VALUES
  ('00000000-0000-0000-0000-000000000002', 'event', '10000000-0000-0000-0000-000000000001',
   'Product Manager IA', 'Passionnée par l''IA appliquée aux produits B2B.',
   'Product Management', ARRAY['IA', 'SaaS', 'UX'], ARRAY['Product strategy', 'LLM integration'],
   ARRAY['Rencontrer des experts techniques'], ARRAY['Co-fondateur technique'], ARRAY['Vision produit', 'Go-to-market']),
  ('00000000-0000-0000-0000-000000000003', 'event', '10000000-0000-0000-0000-000000000001',
   'ML Engineer', 'Building production ML systems.',
   'Engineering', ARRAY['ML', 'NLP', 'Startups'], ARRAY['Python', 'Vector search', 'LLM fine-tuning'],
   ARRAY['Find business partners'], ARRAY['Technical co-founder'], ARRAY['ML architecture', 'MLOps']),
  ('00000000-0000-0000-0000-000000000004', 'event', '10000000-0000-0000-0000-000000000001',
   'Event Tech Founder', 'Je crée des outils pour l''événementiel.',
   'Entrepreneur', ARRAY['Événementiel', 'IA', 'Networking'], ARRAY['Event platforms', 'Matchmaking'],
   ARRAY['Investisseurs', 'Clients B2B'], ARRAY['Innovation événementielle'], ARRAY['Démos', 'Partenariats']);
