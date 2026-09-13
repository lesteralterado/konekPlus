import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { signOut } from "@/app/dashboard/actions";
import {
  ArrowLeftIcon,
  GridIcon,
  CreditCardIcon,
  KeyIcon,
  LogOutIcon,
  UsersIcon,
} from "./icons";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: GridIcon },
  { href: "/admin/tags", label: "Tags", icon: CreditCardIcon },
  { href: "/admin/keychains", label: "Keychains", icon: KeyIcon },
  { href: "/admin/customers", label: "Customers", icon: UsersIcon },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 md:flex-row">
      <aside className="flex shrink-0 flex-col gap-1 border-b border-slate-200 bg-white p-4 md:w-56 md:border-b-0 md:border-r md:p-6">
        <div className="mb-4 px-2 text-lg font-semibold text-brand-900">
          Konek+ Admin
        </div>
        <nav className="flex flex-1 flex-row gap-1 md:flex-col">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 flex flex-col gap-1 border-t border-slate-100 pt-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to site
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-500 transition hover:bg-slate-100"
            >
              <LogOutIcon className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
