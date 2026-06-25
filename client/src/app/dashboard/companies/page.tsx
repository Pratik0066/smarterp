"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, AlertCircle } from "lucide-react";

interface Company {
  id: string;
  name: string;
  address: string | null;
  gst_number: string | null;
  state: string | null;
  contact_info: string | null;
  financial_year_start: string | null;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [error, setError] = useState("");
  const [maxReached, setMaxReached] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Company>();

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: Company[] }>("/companies");
      setCompanies(res.data);
      setMaxReached(res.data.length >= 5);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", address: "", gst_number: "", state: "", contact_info: "", financial_year_start: "" });
    setDialogOpen(true);
  };

  const openEdit = (c: Company) => {
    setEditing(c);
    reset(c);
    setDialogOpen(true);
  };

  const onSubmit = async (data: any) => {
    setError("");
    try {
      if (editing) {
        await api.put(`/companies/${editing.id}`, data);
      } else {
        await api.post("/companies", data);
      }
      setDialogOpen(false);
      fetchCompanies();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this company?")) return;
    try {
      await api.delete(`/companies/${id}`);
      fetchCompanies();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
          <p className="text-sm text-muted-foreground">{companies.length} / 5 companies used</p>
        </div>
        <Button onClick={openCreate} disabled={maxReached}>
          <Plus className="mr-2 h-4 w-4" /> Add Company
        </Button>
      </div>

      {maxReached && (
        <div className="flex items-center gap-2 rounded bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
          <AlertCircle className="h-4 w-4" /> Maximum 5 companies reached per account
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>GST</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Financial Year</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No companies yet</TableCell></TableRow>
              ) : companies.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.gst_number || "—"}</TableCell>
                  <TableCell>{c.state || "—"}</TableCell>
                  <TableCell>{c.financial_year_start || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle>{editing ? "Edit Company" : "Create Company"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input id="name" {...register("name", { required: "Name is required" })} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gst_number">GST Number</Label>
                <Input id="gst_number" {...register("gst_number")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" {...register("state")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="financial_year_start">Financial Year Start</Label>
              <Input id="financial_year_start" type="date" {...register("financial_year_start")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_info">Contact Info</Label>
              <Input id="contact_info" {...register("contact_info")} />
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
