# RolDe — Role Taxonomy

The single source of truth for RolDe user roles. **Locked** names are final (with the
reasoning for each). **Active** roles are live in the `user_role` enum now; **Backlog** roles
have locked names but join the enum pre-launch when a clinic actually needs them (Postgres
adds a value in seconds — no speculative bloat).

Naming convention (Roland): warm, vocational, single-word, **C-words wherever they earn it**,
old or new English. Greenfield, so the C-word **is** the DB enum value — no internal-code
indirection (unlike mindate, which kept legacy codes to dodge a migration).

_Last updated 2026-06-08._

---

## Locked roles — and why we named them so

| # | Name | Conventional role | In enum? | Why named so |
|---|---|---|---|---|
| 1 | **Custodian** | Super Admin | ✅ active | Keeper of the keys to the whole platform; guards every clinic's world. |
| 2 | **Caretaker** | Admin | ✅ active | Looks after a single clinic with full authority — its principal / owner *(was Steward)*. |
| 3 | **Curator** | Practice manager (moderator) | ✅ active | Curates the clinic's day-to-day order — people, schedules, records. |
| 4 | **Concierge** | Receptionist / support | ✅ active | Front of house; greets and guides patients, handles bookings + help *(was Receptionist)*. |
| 5 | **Clinician** | Doctor / clinician | ✅ active | The professional who delivers clinical care — broader and truer than "Practitioner". |
| 6 | **Clinician – Locum** | Sessional clinician | ✅ active (`locum`) | The same clinical role, engaged sessionally; a Clinician with time-bounded scope. |
| 7 | **Chemist** | Pharmacist | ✅ active | The UK's everyday word for the pharmacist — understood instantly. |
| 8 | **Carer** | Healthcare Assistant | ⏳ backlog | Gives hands-on care support at the bedside. |
| 9 | **Collector** | Phlebotomist | ⏳ backlog | Draws and collects bloods + specimens. |
| 10 | **Cartographer** | Radiographer / imaging | ⏳ backlog | Maps the body through imaging. |
| 11 | **Counsellor** | Counsellor / psychologist | ⏳ backlog | Gives counselling + psychological support — already its own C. |
| 12 | **Clerk** | Medical Secretary | ⏳ backlog | Keeps the records and correspondence — the old word for a record-keeper. |
| 13 | **Coordinator** | Care / patient coordinator | ⏳ backlog | Coordinates patient pathways and appointments. |
| 14 | **Cellarer** | Stock / inventory | ⏳ backlog | The medieval officer of the stores — keeps stock + supplies. |
| 15 | **Crier** | Marketing / outreach | ⏳ backlog | The town crier who announces and draws the crowd. |
| 16 | **Comptroller** | Compliance / governance | ⏳ backlog | Holds oversight of standards, control and spend. |

---

## Still deciding — options

### Nurse
NMC-protected professional title. **Recommendation: keep "Nurse"** — a C-rename risks
diminishing a regulated profession whose registration literally reads "Registered Nurse".
If a C is wanted anyway: *Caregiver* · *Comforter* (both weaker, and overlap with Carer).

### Lab Technician
**Conner** *(rec)* — Old English *cunnere*, "one who tests / examiner" (the medieval
ale-conner tested ale + bread; 1288). · *Cultivator* (cultures) · *Collector* (taken by
phlebotomist) · *Biomedical Scientist* (accurate modern term, not a C).

### Accounts / finance *(currently "Actuarian" — not a C)*
- **Cofferer** *(rec)* — the medieval household officer "of the coffers" (treasury / accounts).
- **Chamberlain** — household officer managing finances / treasury.
- **Counter** *(Middle English "compter")* — literally one who counts + reckons accounts.
- *Actuarian* — Roland's earlier pick; a lovely word, though conventionally insurance-risk maths.

### Patient *(C-word, NOT "Client")*
- **Keep "Patient"** *(rec)* — clinically respectful; the protagonist of RolDe.
- **Charge** — a person "in one's care / in your charge"; warm, a C, evokes duty of care.
- *Convalescent* — only fits recovery (too narrow).

---

## Pre-launch action
Review the backlog (rows 8–16) before Phase 1 launch (tracked in `LAUNCH_CHECKLIST.md`):
confirm which roles each launch tenant (Doc For Skin, Doc For Drivers) actually needs, and add
their enum values + RLS coverage then. Don't add speculatively before that.
