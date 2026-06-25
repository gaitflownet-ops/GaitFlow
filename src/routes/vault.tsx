import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { FileText, Upload, Download, Search, Plus, FolderOpen } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/vault")({
  head: () => ({
    meta: [{ title: "Document Vault — GaitFlow" }],
  }),
  component: VaultPage,
});

const placeholderDocs = [
  {
    id: "1",
    name: "Passport — Chestnut King.pdf",
    category: "Identity",
    size: "1.2 MB",
    date: "2026-03-12",
    horse: "Chestnut King",
  },
  {
    id: "2",
    name: "Health Certificate — Annual 2026.pdf",
    category: "Health",
    size: "840 KB",
    date: "2026-01-08",
    horse: "All",
  },
  {
    id: "3",
    name: "Sale Contract — Firefly.docx",
    category: "Legal",
    size: "220 KB",
    date: "2025-12-01",
    horse: "Firefly",
  },
  {
    id: "4",
    name: "Embryo Transfer Agreement.pdf",
    category: "Breeding",
    size: "1.8 MB",
    date: "2026-02-14",
    horse: "N/A",
  },
  {
    id: "5",
    name: "Insurance Policy 2026.pdf",
    category: "Finance",
    size: "3.1 MB",
    date: "2026-01-01",
    horse: "All",
  },
  {
    id: "6",
    name: "Training Log — Q1 2026.xlsx",
    category: "Training",
    size: "590 KB",
    date: "2026-04-01",
    horse: "Multiple",
  },
];

const catColors: Record<string, string> = {
  Identity: "bg-blue-500/10 text-blue-500",
  Health: "bg-green-500/10 text-green-500",
  Legal: "bg-amber-500/10 text-amber-500",
  Breeding: "bg-rose-500/10 text-rose-500",
  Finance: "bg-purple-500/10 text-purple-500",
  Training: "bg-primary/10 text-primary",
};

function VaultPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const categories = ["All", ...Array.from(new Set(placeholderDocs.map((d) => d.category)))];

  const filtered = placeholderDocs.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.horse.toLowerCase().includes(search.toLowerCase());
    const matchCat = filter === "All" || d.category === filter;
    return matchSearch && matchCat;
  });

  return (
    <AppShell>
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <div className="eyebrow">Operations</div>
          <h1 className="font-display text-4xl lg:text-5xl mt-2">Document Vault</h1>
          <p className="text-muted-foreground mt-2">
            {placeholderDocs.length} documents · Passports, contracts, health certificates &amp;
            more
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors">
            <Upload className="h-4 w-4" /> Upload
          </button>
          <button className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-95 transition-opacity">
            <Plus className="h-4 w-4" /> New Folder
          </button>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-card text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === c ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Document grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="lux-card p-5 group hover:border-primary/30 transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <FileText className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm leading-tight truncate">{doc.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {doc.horse} · {doc.size}
                </div>
                <div className="text-xs text-muted-foreground">{doc.date}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColors[doc.category] ?? "bg-secondary"}`}
              >
                {doc.category}
              </span>
              <button className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="lux-card p-12 text-center text-muted-foreground mt-4">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p>No documents found. Upload your first document to get started.</p>
        </div>
      )}
    </AppShell>
  );
}
