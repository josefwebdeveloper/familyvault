"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useVaultStore, useAuthStore } from "@/stores/vault-store";
import { signOut } from "@/lib/firebase/auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/vaults", label: "Vaults", icon: "🔐" },
  { href: "/detox", label: "Password Detox", icon: "🔄" },
  { href: "/security", label: "Security Health", icon: "🛡️" },
  { href: "/backup", label: "Backup", icon: "💾" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { lock } = useVaultStore();
  const router = useRouter();

  const handleLock = () => {
    lock();
    router.push("/unlock");
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 min-h-screen">
      <div className="p-6 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🔒</span>
          <span className="font-bold text-lg text-slate-100">FamilyVault</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
              pathname === item.href || pathname.startsWith(item.href + "/")
                ? "bg-emerald-600/20 text-emerald-400"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <button
          onClick={handleLock}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
        >
          <span>🔒</span> Lock Vault
        </button>
      </div>
    </aside>
  );
}

export function Topbar() {
  const { user } = useAuthStore();
  const { userProfile } = useVaultStore();
  const router = useRouter();

  const handleSignOut = async () => {
    useVaultStore.getState().lock();
    await signOut();
    router.push("/");
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between px-4 md:px-6">
      <div className="md:hidden flex items-center gap-2">
        <span className="text-xl">🔒</span>
        <span className="font-bold text-slate-100">FamilyVault</span>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <span className="hidden sm:inline text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
          Vault unlocked
        </span>
        {user?.photoURL && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoURL}
            alt=""
            className="w-8 h-8 rounded-full"
          />
        )}
        <span className="text-sm text-slate-300 hidden sm:inline">
          {userProfile?.displayName || user?.displayName}
        </span>
        <button
          onClick={handleSignOut}
          className="text-xs text-slate-400 hover:text-slate-200 transition"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around py-2 z-40">
      {NAV_ITEMS.slice(0, 5).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-col items-center gap-0.5 text-xs px-2 py-1",
            pathname.startsWith(item.href)
              ? "text-emerald-400"
              : "text-slate-500"
          )}
        >
          <span className="text-lg">{item.icon}</span>
          <span className="truncate max-w-[60px]">{item.label.split(" ")[0]}</span>
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
