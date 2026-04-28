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
        'relative px-1 py-1 transition-colors',
        active
          ? 'font-semibold text-brand-600 after:absolute after:inset-x-0 after:-bottom-[1.05rem] after:h-0.5 after:rounded-full after:bg-brand-600'
          : 'text-slate-600 hover:text-brand-600',
      )}
    >
      {children}
    </Link>
  );
}

export default function Nav({ admin = false }: { admin?: boolean }) {
  const pathname = usePathname() ?? '/';

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          <span className="text-brand-600">Jenosize</span> Affiliate
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          {admin ? (
            <>
              <NavLink href="/admin/dashboard" pathname={pathname}>Dashboard</NavLink>
              <NavLink href="/admin/products" pathname={pathname}>Products</NavLink>
              <NavLink href="/admin/campaigns" pathname={pathname}>Campaigns</NavLink>
              <NavLink href="/admin/links" pathname={pathname}>Links</NavLink>
              <form action="/api/logout" method="post">
                <button className="btn-outline">Logout</button>
              </form>
            </>
          ) : (
            <>
              <NavLink href="/" pathname={pathname}>Home</NavLink>
              <Link href="/admin/login" className="btn-outline">Admin</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
