import Link from "next/link"
import LogoutButton from "./LogoutButton"

const menu = [
  { name: "Dashboard", href: "/admin/dashboard" },
  { name: "Products", href: "/admin/dashboard/products" },
  { name: "Orders", href: "/admin/dashboard/orders" },
  { name: "Customers", href: "/admin/dashboard/customers" },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-[#3C6D53] font-benguiat">
      {/* Sidebar */}
      <aside className="w-64 bg-[#3C6D53] text-white flex flex-col">
        <div className="p-6 border-b border-r border-white">
          <h1 className="text-2xl font-bold tracking-widest">VIISLEEPERS</h1>
        </div>

        <nav className="flex-1 py-6 border-r border-white">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-6 py-3 hover:bg-green-900 transition"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-6 border border-white">
          <LogoutButton />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col w-full h-min-screen bg-[#3C6D53]">
        {/* Navbar */}
        <header className="h-16 flex items-center justify-between px-8 text-white border-b border-white">
          <h2 className="text-xl font-semibold">Admin Dashboard</h2>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  )
}
