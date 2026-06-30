import { useMemo } from "react";
import { useApp } from "../store";
import { useTasks } from "./useTasks";
import { usePharmaceuticals } from "./usePharmaceuticals";
import { useHealthRecords } from "./useHealth";
import type { AppNotification } from "../supabase.types";

export function useDynamicNotifications() {
  const { state } = useApp();
  const { data: tasks = [] } = useTasks();
  const { data: pharmaceuticals = [] } = usePharmaceuticals();
  const { data: healthRecords = [] } = useHealthRecords();

  const combinedNotifications = useMemo(() => {
    const stateNotifs = state.notifications;
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const dynamic: AppNotification[] = [];

    // 1. Low Stock alerts
    pharmaceuticals.forEach((p) => {
      if ((p.stock_quantity ?? 0) <= (p.min_stock_alert ?? 5)) {
        dynamic.push({
          id: `low-stock-${p.id}`,
          user_id: state.user?.id || "local",
          title: "Alerta de Stock Bajo",
          body: `El stock de ${p.name} está bajo (quedan ${p.stock_quantity} ${p.unit}).`,
          kind: "reminder",
          read: false,
          horse_id: null,
          at: "Alerta Stock",
          organization_id: state.user?.organization_id || null,
          created_at: new Date().toISOString(),
        });
      }
    });

    // 2. Expiration alerts
    pharmaceuticals.forEach((p) => {
      if (p.expiry_date) {
        const expDate = new Date(p.expiry_date);
        if (expDate < now) {
          dynamic.push({
            id: `expired-${p.id}`,
            user_id: state.user?.id || "local",
            title: "Alerta de Medicación Vencida",
            body: `${p.name} venció el ${p.expiry_date}.`,
            kind: "health",
            read: false,
            horse_id: null,
            at: "Vencido",
            organization_id: state.user?.organization_id || null,
            created_at: new Date().toISOString(),
          });
        } else if (expDate < thirtyDaysFromNow) {
          dynamic.push({
            id: `expiring-${p.id}`,
            user_id: state.user?.id || "local",
            title: "Medicación por Vencer",
            body: `${p.name} vencerá el ${p.expiry_date}.`,
            kind: "health",
            read: false,
            horse_id: null,
            at: "Por vencer",
            organization_id: state.user?.organization_id || null,
            created_at: new Date().toISOString(),
          });
        }
      }
    });

    // 3. Task alerts
    tasks.forEach((t) => {
      if (t.status !== "completed" && t.due_date) {
        const dueDate = new Date(t.due_date);
        if (dueDate < now) {
          dynamic.push({
            id: `task-overdue-${t.id}`,
            user_id: state.user?.id || "local",
            title: "Alerta de Tarea Atrasada",
            body: `"${t.title}" está atrasada (vencimiento ${t.due_date}).`,
            kind: "reminder",
            read: false,
            horse_id: t.horse_id,
            at: "Atrasada",
            organization_id: state.user?.organization_id || null,
            created_at: new Date().toISOString(),
          });
        } else if (dueDate < threeDaysFromNow) {
          dynamic.push({
            id: `task-due-${t.id}`,
            user_id: state.user?.id || "local",
            title: "Tarea Próxima a Vencer",
            body: `"${t.title}" vence el ${t.due_date}.`,
            kind: "reminder",
            read: false,
            horse_id: t.horse_id,
            at: "Próxima",
            organization_id: state.user?.organization_id || null,
            created_at: new Date().toISOString(),
          });
        }
      }
    });

    // 4. Health Care alerts
    healthRecords.forEach((r) => {
      if (r.next_due && r.status !== "completed" && r.status !== "clear") {
        const nextDue = new Date(r.next_due);
        if (nextDue < now) {
          dynamic.push({
            id: `health-overdue-${r.id}`,
            user_id: state.user?.id || "local",
            title: "Medical Care Overdue",
            body: `"${r.title}" for ${r.horse_name || "horse"} was due on ${r.next_due}.`,
            kind: "health",
            read: false,
            horse_id: r.horse_id,
            at: "Overdue",
            organization_id: state.user?.organization_id || null,
            created_at: new Date().toISOString(),
          });
        } else if (nextDue < sevenDaysFromNow) {
          dynamic.push({
            id: `health-due-${r.id}`,
            user_id: state.user?.id || "local",
            title: "Upcoming Medical Care",
            body: `"${r.title}" for ${r.horse_name || "horse"} is scheduled for ${r.next_due}.`,
            kind: "health",
            read: false,
            horse_id: r.horse_id,
            at: "Upcoming",
            organization_id: state.user?.organization_id || null,
            created_at: new Date().toISOString(),
          });
        }
      }
    });

    const processedDynamic = dynamic.map((d) => {
      const dbNotif = stateNotifs.find((sn) => sn.id === d.id || sn.at === d.id);
      return {
        ...d,
        read: !!(dbNotif?.read),
      };
    });

    const dynamicIds = new Set(processedDynamic.map((d) => d.id));
    const uniqueStateNotifs = stateNotifs.filter((n) => !dynamicIds.has(n.id));

    return [...processedDynamic, ...uniqueStateNotifs].sort((a, b) => {
      return (b.created_at || "") > (a.created_at || "") ? 1 : -1;
    });
  }, [state.notifications, state.user, tasks, pharmaceuticals, healthRecords]);

  const unreadCount = combinedNotifications.filter((n) => !n.read).length;

  return { combinedNotifications, unreadCount };
}
