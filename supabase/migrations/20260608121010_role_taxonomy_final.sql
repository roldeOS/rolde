-- ============================================================================
-- RolDe — Role taxonomy: final names (closes the C-word naming).
-- accountant -> cofferer (medieval treasury/accounts officer).
-- add cunnere (lab technician; OE "one who tests").
-- Nurse and Patient deliberately kept (regulated / clinically-weighty titles).
-- Full reasoning: docs/rolde_role_taxonomy.md.
-- ============================================================================

alter type user_role rename value 'accountant' to 'cofferer';
alter type user_role add value if not exists 'cunnere';
