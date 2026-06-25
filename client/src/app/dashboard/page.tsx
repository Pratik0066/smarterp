"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  BookOpen,
  Users,
  Package,
  Receipt,
  FileSpreadsheet,
} from "lucide-react";

const gatewayItems = [
  {
    title: "Masters",
    items: [
      { label: "Companies", icon: Building2, href: "/dashboard/companies", desc: "Manage your companies (max 5)" },
      { label: "Groups", icon: BookOpen, href: "/dashboard/groups", desc: "Asset, Liability, Income, Expense, Stock" },
      { label: "Ledgers", icon: Users, href: "/dashboard/ledgers", desc: "Customers, Suppliers, Bank, Cash" },
      { label: "Stock Items", icon: Package, href: "#", desc: "Inventory management" },
    ],
  },
  {
    title: "Transactions",
    items: [
      { label: "Vouchers", icon: Receipt, href: "#", desc: "Sales, Purchase, Receipt, Payment, Contra, Journal" },
    ],
  },
  {
    title: "Reports",
    items: [
      { label: "Financial Reports", icon: FileSpreadsheet, href: "#", desc: "Balance Sheet, P&L, Trial Balance" },
    ],
  },
];

export default function GatewayPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gateway of SmartERP</h1>
        <p className="text-muted-foreground mt-1">Use arrow keys to navigate · F1-F8 for shortcuts · Esc to toggle sidebar</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {gatewayItems.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => item.href !== "#" && router.push(item.href)}
                  className="flex w-full items-center gap-3 rounded-md p-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  tabIndex={0}
                >
                  <item.icon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
