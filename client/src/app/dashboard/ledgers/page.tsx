"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface Ledger {
  id: string;
  company_id: string;
  group_id: string;
  group_name: string;
  name: string;
  opening_balance: number;
  current_balance: number;
  type: string;
}

const LEDGER_TYPES = [
  { value: "Customer", label: "Customer" },
  { value: "Supplier", label: "Supplier" },
  { value: "Bank", label: "Bank" },
  { value: "Cash", label: "Cash" },
  { value: "Expense", label: "Expense" },
  { value: "Income", label: "Income" },
];

export default function LedgersPage() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Ledger | null>(null);
  const [error, setError] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Ledger>();

  const fetchLedgers = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: Ledger[] }>("/ledgers");
      setLedgers(res.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLedgers(); }, [fetchLedgers]);

  const openCreate = () => {
    setEditing(null);
    reset({ company_id: "", group_id: "", name: "", opening_balance: 0, type: "" });
    setDialogOpen(true);
  };

  const openEdit = (l: Ledger) => {
    setEditing(l);
    reset(l);
    setDialogOpen(true);
  };

  const onSubmit = async (data: any) => {
    setError("");
    try {
      if (editing) {
        await api.put(`/ledgers/${editing.id}`, data);
      } else {
        await api.post("/ledgers", data);
      }
      setDialogOpen(false);
      fetchLedgers();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ledger?")) return;
    try {
      await api.delete(`/ledgers/${id}`);
      fetchLedgers();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ledgers</h1>
          <p className="text-sm text-muted-foreground">Manage ledgers (Customers, Suppliers, Bank, Cash, Expense, Income)</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Ledger</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Group</TableHead>
                <TableHead className="text-right">Opening Balance</TableHead>
                <TableHead className="text-right">Current Balance</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No ledgers yet</TableCell></TableRow>
              ) : ledgers.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell><span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{l.type}</span></TableCell>
                  <TableCell className="text-muted-foreground">{l.group_name}</TableCell>
                  <TableCell className="text-right font-mono">{l.opening_balance.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{l.current_balance.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(l.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Ledger" : "Create Ledger"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_id">Company ID *</Label>
              <Input id="company_id" {...register("company_id", { required: "Company ID is required" })} placeholder="UUID from Companies page" />
              {errors.company_id && <p className="text-sm text-destructive">{errors.company_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="group_id">Group ID *</Label>
              <Input id="group_id" {...register("group_id", { required: "Group ID is required" })} placeholder="UUID from Groups page" />
              {errors.group_id && <p className="text-sm text-destructive">{errors.group_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Ledger Name *</Label>
              <Input id="name" {...register("name", { required: "Name is required" })} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select id="type" options={LEDGER_TYPES} placeholder="Select type" {...register("type", { required: "Type is required" })} />
                {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="opening_balance">Opening Balance</Label>
                <Input id="opening_balance" type="number" step="0.01" {...register("opening_balance")} />
              </div>
            </div>
            {error && <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Update" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
