"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Settings, FileText, Play, BarChart2 } from "lucide-react"

export function Navbar() {
  const pathname = usePathname()

  const navItems = [
    { href: "/runs", label: "Run Comparison", icon: Play },
    { href: "/tests", label: "Tests", icon: FileText },
    { href: "/models", label: "Models", icon: Settings },
    { href: "/results", label: "Results History", icon: BarChart2 },
  ]

  return (
    <nav className="bg-gray-900 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold flex items-center">
          <Home className="mr-2 h-6 w-6" /> LLM Compare
        </Link>
        <div className="flex space-x-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Button key={item.href} asChild variant="ghost" className={cn("text-white", isActive && "bg-gray-700")}>
                <Link href={item.href}>
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
