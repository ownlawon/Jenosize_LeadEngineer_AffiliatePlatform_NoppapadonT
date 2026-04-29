"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  type LucideIcon,
  Link as LinkIcon,
  LogOut,
  Megaphone,
  Package,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface NavLinkProps {
  href: string;
  pathname: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

function NavLink({ href, pathname, icon: Icon, children }: NavLinkProps) {
  // Active when on the link's exact route or any sub-route under it.
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
        active
          ? "font-medium text-slate-900 after:absolute after:inset-x-2.5 after:-bottom-[13px] after:h-px after:bg-slate-900"
          : "text-slate-500 hover:text-slate-900",
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden /> : null}
      {children}
    </Link>
  );
}

export default function Nav({ admin = false }: { admin?: boolean }) {
  const pathname = usePathname() ?? "/";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          aria-label="Jenosize Affiliate · Home"
          className="flex shrink-0 items-center gap-2 text-[15px] font-semibold tracking-tight"
        >
          <Image
            src="/jenosize-logo.png"
            alt=""
            width={24}
            height={24}
            priority
            className="h-6 w-6 object-contain"
            aria-hidden
          />
          <span className="hidden sm:inline">
            Jenosize <span className="text-slate-400">Affiliate</span>
          </span>
        </Link>
        <nav
          aria-label="Primary"
          className="flex flex-1 items-center justify-end gap-1 overflow-x-auto text-sm
            [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {admin ? (
            <>
              <NavLink
                href="/admin/dashboard"
                pathname={pathname}
                icon={BarChart3}
              >
                Dashboard
              </NavLink>
              <NavLink
                href="/admin/products"
                pathname={pathname}
                icon={Package}
              >
                Products
              </NavLink>
              <NavLink
                href="/admin/campaigns"
                pathname={pathname}
                icon={Megaphone}
              >
                Campaigns
              </NavLink>
              <NavLink href="/admin/links" pathname={pathname} icon={LinkIcon}>
                Links
              </NavLink>
              <form action="/api/logout" method="post" className="ml-2">
                <button
                  className="btn-ghost inline-flex items-center gap-1.5 text-[13px]"
                  aria-label="Logout"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden />
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <NavLink href="/" pathname={pathname}>
                Home
              </NavLink>
              <Link
                href="/admin/login"
                className="btn-outline ml-2 inline-flex items-center gap-1.5 text-[13px]"
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Admin
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
