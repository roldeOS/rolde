import { getSessionContext } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function Home() {
  const ctx = await getSessionContext();

  const name = ctx?.membership?.display_name ?? ctx?.user.email ?? "there";
  const clinic = ctx?.membership?.tenants?.name ?? "—";
  const role = ctx?.membership?.role ? titleCase(ctx.membership.role) : "—";

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-10 text-center shadow-sm">
        <p className="font-serif text-2xl font-semibold tracking-tight">RolDe</p>

        <h1 className="mt-8 font-serif text-3xl font-semibold tracking-tight">
          Welcome, {name}
        </h1>
        <p className="mt-2 text-muted">
          {clinic} · {role}
        </p>

        <p className="mt-8 text-sm text-muted">
          Signed in as {ctx?.user.email}
        </p>
        <div className="mt-6">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
