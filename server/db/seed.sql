INSERT INTO restaurants (id, name, cuisines, rating, eta_mins, image_tint, tags, delivery_fee_inr)
VALUES
  ('r1', 'Biryani Brotherhood', ARRAY['Hyderabadi','North Indian'], 4.6, '25–35 min', '#7C3AED', ARRAY['veg','spicy'], 39),
  ('r2', 'Neon Slice Lab', ARRAY['Pizza','Italian'], 4.4, '30–40 min', '#F97316', ARRAY['cheesy','late-night'], 49),
  ('r3', 'Sakura Bowls', ARRAY['Japanese','Healthy'], 4.7, '20–30 min', '#0EA5E9', ARRAY['healthy','low-oil'], 29),
  ('r4', 'Midnight Dosai Co.', ARRAY['South Indian','Street food'], 4.5, '15–25 min', '#10B981', ARRAY['veg','comfort'], 19)
ON CONFLICT (id) DO NOTHING;

INSERT INTO menu_items (id, restaurant_id, name, description, price_inr, veg, popular) VALUES
  ('m1', 'r1', 'Dum Gosht Biryani', 'Slow-cooked lamb, fragrant basmati, sealed handi.', 289, false, true),
  ('m2', 'r1', 'Subz Hyderabadi', 'Seasonal vegetables, mint, browned onions.', 219, true, false),
  ('m3', 'r1', 'Mirchi Ka Salan', 'Roasted chilli peanut curry — sharp and nutty.', 129, true, false),
  ('m4', 'r2', 'Charred Pepperoni', 'San Marzano, fior di latte, cup-and-char pepperoni.', 349, false, true),
  ('m5', 'r2', 'Wild Mushroom', 'Truffle oil, taleggio, thyme.', 379, true, false),
  ('m6', 'r3', 'Salmon Aburi Bowl', 'Miso barley, pickles, sesame crunch.', 399, false, true),
  ('m7', 'r3', 'Tofu Katsu Curry', 'Panko tofu, heirloom carrots, short grain.', 279, true, false),
  ('m8', 'r4', 'Podi Molaga Dosa', 'Ghee-roasted millets, gunpowder chutney.', 149, true, true),
  ('m9', 'r4', 'Filter Kaapi Float', 'Cold brew jaggery, vanilla foam.', 99, true, false)
ON CONFLICT (id) DO NOTHING;
