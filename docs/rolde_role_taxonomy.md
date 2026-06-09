# RolDe — Role Taxonomy

The single source of truth for RolDe user roles (canonical — bibles point here). **Active**
roles are live in the `user_role` enum; **Backlog** roles have locked names but join the enum
pre-launch when a clinic actually needs them (Postgres adds a value in seconds — no bloat).

Naming convention (Roland): warm, vocational, single-word, **C-words wherever they earn it**,
old or new English. Greenfield, so the C-word **is** the DB enum value — no internal-code
indirection (unlike mindate, which kept legacy codes to dodge a migration). Two regulated /
clinically-weighty titles are kept as-is on principle: **Nurse** and **Patient**.

_Last updated 2026-06-08. All names LOCKED._

---

## Active roles (live in the enum) — and why named so

| Enum value | Name | Conventional role | Why named so |
|---|---|---|---|
| `custodian` | **Custodian** | Super Admin | Keeper of the keys to the whole platform; guards every clinic's world. |
| `caretaker` | **Caretaker** | Admin | Looks after a single clinic with full authority — its principal/owner. |
| `curator` | **Curator** | Practice manager | Curates the clinic's day-to-day order — people, schedules, records. |
| `concierge` | **Concierge** | Receptionist / support | Front of house; greets + guides patients, handles bookings. |
| `clinician` | **Clinician** | Doctor / clinician | The professional who delivers clinical care. |
| `locum` | **Clinician – Locum** | Sessional clinician | Same clinical role, engaged sessionally; time-bounded scope. |
| `nurse` | **Nurse** | Nurse | Kept — NMC-protected title; renaming a regulated profession would diminish it. |
| `chemist` | **Chemist** | Pharmacist | The UK's everyday word for the pharmacist — understood instantly. |
| `cunnere` | **Cunnere** | Lab Technician | Old English *cunnere*, "one who tests" (the medieval ale-conner, 1288). |
| `cofferer` | **Cofferer** | Accounts / finance | The medieval household officer "of the coffers" — treasury + accounts. |
| `patient` | **Patient** | Patient | Kept — clinically respectful; RolDe's protagonist. |

---

## Backlog (locked names; join the enum pre-launch as clinics require)

| Name | Conventional role | Why named so |
|---|---|---|
| **Carer** | Healthcare Assistant | Gives hands-on care support at the bedside. |
| **Collector** | Phlebotomist | Draws + collects bloods and specimens. |
| **Cartographer** | Radiographer / imaging | Maps the body through imaging. |
| **Counsellor** | Counsellor / psychologist | Counselling + psychological support — already its own C. |
| **Clerk** | Medical Secretary | Keeps records + correspondence — old word for a record-keeper. |
| **Coordinator** | Care / patient coordinator | Coordinates patient pathways and appointments. |
| **Cellarer** | Stock / inventory | The medieval officer of the stores — keeps stock + supplies. |
| **Crier** | Marketing / outreach | The town crier who announces and draws the crowd. |
| **Comptroller** | Compliance / governance | Holds oversight of standards, control + spend. |

---

## Pre-launch action
Review the backlog before Phase 1 launch (tracked in `LAUNCH_CHECKLIST.md`): confirm which
roles each launch tenant (Doc For Skin, Doc For Drivers) actually needs, and add their enum
values + RLS coverage then. Don't add speculatively before that.
