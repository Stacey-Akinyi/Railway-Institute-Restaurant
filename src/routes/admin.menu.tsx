import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Plus, Edit, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { SignedImage } from "@/components/SignedImage";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/menu")({
  head: () => ({ meta: [{ title: "Manage Menu — RTI Canteen" }] }),
  component: AdminMenu,
});

function AdminMenu() {
  const { hasRole, loading } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const [logoBust, setLogoBust] = useState(0);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("app_settings").select("value").eq("key", "logo_path").maybeSingle().then(({ data }) => {
      const v: any = data?.value;
      if (typeof v === "string") setCurrentLogo(v);
      else if (v && typeof v === "object" && typeof v.path === "string") setCurrentLogo(v.path);
    });
  }, []);

  const { data: items } = useQuery({
    queryKey: ["admin-menu"],
    queryFn: async () => {
      const { data } = await (supabase as any).rpc("get_staff_menu_items");
      const rows = (data || []) as any[];
      const catIds = Array.from(new Set(rows.map((r) => r.category_id).filter(Boolean)));
      let catMap: Record<string, string> = {};
      if (catIds.length) {
        const { data: cs } = await supabase.from("categories").select("id,name").in("id", catIds);
        catMap = Object.fromEntries((cs || []).map((c: any) => [c.id, c.name]));
      }
      return rows.map((r) => ({ ...r, categories: r.category_id ? { name: catMap[r.category_id] } : null }));
    },
  });
  const { data: cats } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("display_order")).data || [],
  });

  if (loading) return <div className="p-8">Loading…</div>;
  if (!hasRole("admin")) {
    return <div className="p-8 text-center text-muted-foreground">Admin access only. <Link to="/" className="text-accent underline">Go home</Link></div>;
  }

  async function uploadImage(file: File, prefix: string): Promise<string | null> {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("restaurant-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (error) { toast.error(error.message); return null; }
    return path;
  }

  async function onPickItemImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = await uploadImage(file, "menu");
    setUploading(false);
    if (path) { setImagePath(path); toast.success("Image uploaded"); }
    e.target.value = "";
  }

  async function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    // unique filename so signed-url caches refresh across browsers
    const path = `branding/logo-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("restaurant-images").upload(path, file, {
      cacheControl: "3600", upsert: false, contentType: file.type,
    });
    if (upErr) return toast.error(upErr.message);

    const { error: sErr } = await supabase
      .from("app_settings")
      .upsert({ key: "logo_path", value: path as any, updated_by: (await supabase.auth.getUser()).data.user?.id ?? null }, { onConflict: "key" });
    if (sErr) return toast.error(sErr.message);

    // best-effort cleanup of any previous local pointer
    try { localStorage.removeItem("rti_logo_path"); } catch {}
    window.dispatchEvent(new Event("rti-logo-updated"));
    setLogoBust(Date.now());
    setCurrentLogo(path);
    toast.success("Logo updated — visible on every device");
    e.target.value = "";
  }

  async function save(form: FormData) {
    const { error } = await (supabase as any).rpc("upsert_menu_item", {
      _id: edit?.id ?? null,
      _name: String(form.get("name")),
      _description: String(form.get("description") || "") || null,
      _price: Number(form.get("price")),
      _category_id: String(form.get("category_id")) || null,
      _meal_time: String(form.get("meal_time") || "") || null,
      _stock_quantity: Number(form.get("stock_quantity") || 0),
      _is_available: form.get("is_available") === "on",
      _image_url: imagePath,
    });
    if (error) return toast.error(error.message);
    toast.success(edit ? "Item updated" : "Item added");
    setOpen(false); setEdit(null); setImagePath(null);
    qc.invalidateQueries({ queryKey: ["admin-menu"] });
    qc.invalidateQueries({ queryKey: ["menu-items"] });
  }

  async function del(id: string) {
    if (!confirm("Delete this item?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-menu"] });
  }

  

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <PageHeader
        title="Manage Menu"
        description="Add, edit, and stock your menu items."
        actions={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEdit(null); setImagePath(null); } }}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEdit(null); setImagePath(null); }}><Plus className="h-4 w-4 mr-2" /> New item</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{edit ? "Edit item" : "New menu item"}</DialogTitle></DialogHeader>
              <form action={save as any} className="space-y-3">
                <div>
                  <Label>Item photo</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="h-20 w-20 rounded-md border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {imagePath ? (
                        <SignedImage path={imagePath} alt="preview" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickItemImage} />
                      <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                        <Upload className="h-4 w-4 mr-2" /> {uploading ? "Uploading…" : imagePath ? "Replace photo" : "Upload photo"}
                      </Button>
                      {imagePath && <Button type="button" variant="ghost" size="sm" onClick={() => setImagePath(null)}>Remove</Button>}
                    </div>
                  </div>
                </div>
                <div><Label>Name</Label><Input name="name" defaultValue={edit?.name || ""} required /></div>
                <div><Label>Description</Label><Textarea name="description" defaultValue={edit?.description || ""} rows={2} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Price (KES)</Label><Input name="price" type="number" step="1" defaultValue={edit?.price || ""} required /></div>
                  <div><Label>Stock</Label><Input name="stock_quantity" type="number" defaultValue={edit?.stock_quantity ?? 0} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Category</Label>
                    <Select name="category_id" defaultValue={edit?.category_id || ""}>
                      <SelectTrigger><SelectValue placeholder="Pick…" /></SelectTrigger>
                      <SelectContent>{cats?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Meal time</Label>
                    <Select name="meal_time" defaultValue={edit?.meal_time || ""}>
                      <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                      <SelectContent>
                        {["breakfast","lunch","dinner","snacks","drinks"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch name="is_available" defaultChecked={edit?.is_available ?? true} />
                  <Label>Available on menu</Label>
                </div>
                <DialogFooter><Button type="submit">{edit ? "Save changes" : "Add item"}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-md border bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {currentLogo ? (
              <SignedImage key={logoBust} path={currentLogo} alt="logo" className="h-full w-full object-contain" />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium">Restaurant logo</div>
            <div className="text-xs text-muted-foreground">Shown in the sidebar. PNG or SVG with transparent background works best.</div>
          </div>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onPickLogo} />
          <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" /> {currentLogo ? "Replace logo" : "Upload logo"}
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 w-16"></th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Category</th>
                <th className="text-right p-3">Price</th>
                <th className="text-right p-3">Stock</th>
                <th className="text-left p-3">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items?.map((i: any) => (
                <tr key={i.id} className="border-t">
                  <td className="p-2">
                    <div className="h-12 w-12 rounded bg-muted overflow-hidden flex items-center justify-center">
                      {i.image_url
                        ? <SignedImage path={i.image_url} alt={i.name} className="h-full w-full object-cover" />
                        : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </td>
                  <td className="p-3 font-medium">{i.name}</td>
                  <td className="p-3 text-muted-foreground">{i.categories?.name || "—"}</td>
                  <td className="p-3 text-right whitespace-nowrap">KES {Number(i.price)}</td>
                  <td className="p-3 text-right">
                    <span className={i.stock_quantity <= 5 ? "text-warning font-medium" : ""}>{i.stock_quantity}</span>
                  </td>
                  <td className="p-3"><Badge variant={i.is_available ? "default" : "outline"}>{i.is_available ? "Available" : "Hidden"}</Badge></td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <Button variant="ghost" size="icon" onClick={() => { setEdit(i); setImagePath(i.image_url || null); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => del(i.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
