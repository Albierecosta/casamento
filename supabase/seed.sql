-- ============================================================
-- Optional demo seed for a single wedding row.
-- Replace :owner_uuid with a real auth.users id and run in SQL editor
-- to quickly populate the UI for a demo account.
-- ============================================================

do $$
declare
  v_wedding uuid;
begin
  -- Change this UUID to match an existing auth.users.id
  -- (e.g. select id from auth.users where email = 'demo@casal.com';)
  insert into public.weddings (owner_id, couple_name, bride_name, groom_name,
    wedding_date, city, ceremony_location, reception_location,
    initial_budget, style, estimated_guests, onboarded)
  values (
    '00000000-0000-0000-0000-000000000000', -- :owner_uuid
    'Sofia & Rafael',
    'Sofia',
    'Rafael',
    current_date + interval '180 days',
    'São Paulo — SP',
    'Igreja N. S. do Carmo',
    'Quinta do Capricho',
    120000,
    'Clássico romântico',
    180,
    true
  )
  returning id into v_wedding;

  insert into public.guests (wedding_id, name, group_type, rsvp_status, companions, invited_by, vip) values
    (v_wedding, 'Ana Souza', 'familia', 'confirmado', 1, 'noiva', true),
    (v_wedding, 'Carlos Lima', 'amigos', 'pendente', 0, 'noivo', false),
    (v_wedding, 'Beatriz Alves', 'trabalho', 'confirmado', 1, 'noivo', false),
    (v_wedding, 'Diego Rocha', 'amigos', 'recusado', 0, 'noiva', false);

  insert into public.budget_items (wedding_id, title, category, planned_amount, actual_amount, status, due_date) values
    (v_wedding, 'Buffet', 'buffet', 40000, 12000, 'pago_parcial', current_date + interval '60 days'),
    (v_wedding, 'Fotografia', 'fotografia', 12000, 4000, 'pago_parcial', current_date + interval '90 days'),
    (v_wedding, 'Decoração', 'decoracao', 18000, 0, 'pendente', current_date + interval '120 days'),
    (v_wedding, 'Vestido', 'vestido', 9000, 9000, 'pago', null);

  insert into public.wedding_party_members (wedding_id, name, role, side, confirmed) values
    (v_wedding, 'João Silva', 'padrinho', 'noivo', true),
    (v_wedding, 'Marina Costa', 'madrinha', 'noiva', true),
    (v_wedding, 'Lucas Almeida', 'padrinho', 'noivo', false);

  insert into public.vendors (wedding_id, name, category, negotiation_status, estimated_price, final_price, personal_rating) values
    (v_wedding, 'Estúdio Luz & Amor', 'fotografia', 'fechado', 14000, 12000, 5),
    (v_wedding, 'Buffet Pagu', 'buffet', 'fechado', 45000, 40000, 4);
end $$;
