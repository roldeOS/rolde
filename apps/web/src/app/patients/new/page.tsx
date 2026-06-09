import Link from "next/link";
import { createPatient } from "../actions";

const inputClass =
  "mt-1 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/15";

export default function NewPatientPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 p-6">
      <Link href="/patients" className="text-sm text-muted hover:underline">
        ← Patients
      </Link>
      <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight">
        New patient
      </h1>

      <form
        action={createPatient}
        className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium">
              First name
            </label>
            <input id="first_name" name="first_name" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium">
              Last name
            </label>
            <input id="last_name" name="last_name" required className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="date_of_birth" className="block text-sm font-medium">
            Date of birth
          </label>
          <input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="sex_at_birth" className="block text-sm font-medium">
            Sex at birth
          </label>
          <select id="sex_at_birth" name="sex_at_birth" required className={inputClass}>
            <option value="">Select…</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="intersex">Intersex</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email <span className="text-muted">(optional)</span>
          </label>
          <input id="email" name="email" type="email" className={inputClass} />
        </div>

        <div>
          <label htmlFor="phone_mobile" className="block text-sm font-medium">
            Mobile <span className="text-muted">(optional)</span>
          </label>
          <input id="phone_mobile" name="phone_mobile" className={inputClass} />
        </div>

        <button
          type="submit"
          className="h-11 w-full rounded-md bg-foreground text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Add patient
        </button>
      </form>
    </main>
  );
}
