'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

interface NavLinkProps {
  href: string;
  pathname: string;
  children: React.ReactNode;
}

function NavLink({ href, pathname, children }: NavLinkProps) {
  // Active when on the link's exact route or any sub-route under it.
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
        active
          ? 'font-medium text-slate-900 after:absolute after:inset-x-2.5 after:-bottom-[13px] after:h-px after:bg-slate-900'
          : 'text-slate-500 hover:text-slate-900',
      )}
    >
      {children}
    </Link>
  );
}

export default function Nav({ admin = false }: { admin?: boolean }) {
  const pathname = usePathname() ?? '/';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <span
            className="grid h-6 w-6 place-items-center rounded-md bg-slate-900 text-[11px] font-bold text-white"
            aria-hidden
          >
            J
          </span>
          <span>Jenosize <span className="text-slate-400">Affiliate</span></span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {admin ? (
            <>
              <NavLink href="/admin/dashboard" pathname={pathname}>Dashboard</NavLink>
              <NavLink href="/admin/products" pathname={pathname}>Products</NavLink>
              <NavLink href="/admin/campaigns" pathname={pathname}>Campaigns</NavLink>
              <NavLink href="/admin/links" pathname={pathname}>Links</NavLink>
              <form action="/api/logout" method="post" className="ml-2">
                <button className="btn-ghost text-[13px]">Logout</button>
              </form>
            </>
          ) : (
            <>
              <NavLink href="/" pathname={pathname}>Home</NavLink>
              <Link href="/admin/login" className="btn-outline ml-2 text-[13px]">Admin</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
