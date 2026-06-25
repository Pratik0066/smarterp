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

interface Group {
  id: string;
  company_id: string;
  name: string;
  parent_group_id: string | null;
  type: string;
}

const GROUP_TYPES = [
  { value: "Asset", label: "Asset" },
  { value: "Liability", label: "Liability" },
  { value: "Income", label: "Income" },
  { value: "Expense", label: "Expense" },
  { value: "Stock", label: "Stock" },
];

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [error, setError] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Group>();

  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: Group[] }>("/groups");
      setGroups(res.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const openCreate = () => {
    setEditing(null);
    reset({ company_id: "", name: "", parent_group_id: "", type: "" });
    setDialogOpen(true);
  };

  const openEdit = (g: Group) => {
    setEditing(g);
    reset(g);
    setDialogOpen(true);
  };

  const onSubmit = async (data: any) => {
    setError("");
    try {
      if (editing) {
        await api.put(`/groups/${editing.id}`, data);
      } else {
        await api.post("/groups", data);
      }
      setDialogOpen(false);
      fetchGroups();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this group?")) return;
    try {
      await api.delete(`/groups/${id}`);
      fetchGroups();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Groups</h1>
          <p className="text-sm text-muted-foreground">Manage accounting groups (Assets, Liabilities, Income, Expense, Stock)</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Group</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Parent Group</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No groups yet</TableCell></TableRow>
              ) : groups.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell><span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{g.type}</span></TableCell>
                  <TableCell>{g.parent_group_id || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(g)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(g.id)}><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle>{editing ? "Edit Group" : "Create Group"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_id">Company ID *</Label>
              <Input id="company_id" {...register("company_id", { required: "Company ID is required" })} placeholder="UUID from Companies page" />
              {errors.company_id && <p className="text-sm text-destructive">{errors.company_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Group Name *</Label>
              <Input id="name" {...register("name", { required: "Name is required" })} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select id="type" options={GROUP_TYPES} placeholder="Select type" {...register("type", { required: "Type is required" })} />
              {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent_group_id">Parent Group ID (optional)</Label>
              <Input id="parent_group_id" {...register("parent_group_id")} placeholder="UUID of parent group" />
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
