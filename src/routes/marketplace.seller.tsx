import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SellerDashboard } from "@/components/marketplace/SellerDashboard";

export const Route = createFileRoute("/marketplace/seller")({
  head: () => ({
    meta: [{ title: "Seller Center — GaitFlow" }],
  }),
  component: SellerCenterPage,
});

function SellerCenterPage() {
  return (
    <AppShell>
      <div className="mb-8">
        <div className="eyebrow">Gestión Comercial</div>
        <h1 className="font-display text-4xl mt-2">Seller Center</h1>
        <p className="text-muted-foreground mt-2">
          Administra tus publicaciones, responde consultas y analiza tus ventas.
        </p>
      </div>

      <SellerDashboard />
    </AppShell>
  );
}
