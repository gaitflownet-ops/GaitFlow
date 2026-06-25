import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../supabase.types";

export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];

export function useExpenses(horseId?: string) {
  return useQuery<Expense[]>({
    queryKey: ["expenses", horseId],
    queryFn: async () => {
      let query = supabase.from("expenses").select("*").order("date", { ascending: false });
      if (horseId) {
        query = query.eq("horse_id", horseId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Expense[];
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newExpense: Omit<Database["public"]["Tables"]["expenses"]["Insert"], "organization_id">) => {
      const { data, error } = await (supabase.from("expenses") as any)
        .insert([newExpense])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["financial-aggregates"] });
    },
  });
}

export function usePayments() {
  return useQuery<any[]>({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          invoices:invoice_id (
            category,
            type,
            notes
          )
        `)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPayment: Omit<Database["public"]["Tables"]["payments"]["Insert"], "organization_id">) => {
      const { data, error } = await (supabase.from("payments") as any)
        .insert([newPayment])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["financial-aggregates"] });
    },
  });
}

export function useFinanceAggregates() {
  return useQuery({
    queryKey: ["financial-aggregates"],
    queryFn: async () => {
      // Fetch all expenses and invoices to compute metrics
      const { data: expensesData } = await supabase.from("expenses").select("*");
      const expenses = expensesData || [];
      const { data: invoicesData } = await supabase.from("invoices").select("*");
      const invoices = invoicesData || [];
      const { data: horsesData } = await supabase.from("horses").select("id, name");
      const horses = horsesData || [];

      // Compute total costs (expenses + invoices of type 'Expense')
      const totalExpenseFromInvoices = (invoices as any[])
        .filter((i: any) => i.type === "Expense")
        .reduce((sum: number, i: any) => sum + Number(i.amount), 0);
      const totalExpensesFromTable = (expenses as any[]).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
      
      const totalCost = totalExpenseFromInvoices + totalExpensesFromTable;

      // Group costs by category
      const categoryAnalysis: Record<string, number> = {};
      (invoices as any[])
        .filter((i: any) => i.type === "Expense")
        .forEach((i: any) => {
          categoryAnalysis[i.category] = (categoryAnalysis[i.category] || 0) + Number(i.amount);
        });
      (expenses as any[]).forEach((e: any) => {
        categoryAnalysis[e.category] = (categoryAnalysis[e.category] || 0) + Number(e.amount);
      });

      // Group costs by horse (cost per horse)
      const costPerHorse: Record<string, { horseName: string; amount: number }> = {};
      (expenses as any[]).forEach((e: any) => {
        if (e.horse_id) {
          const horse = (horses as any[]).find((h: any) => h.id === e.horse_id);
          const horseName = horse ? horse.name : `Horse #${e.horse_id.slice(0, 8)}`;
          if (!costPerHorse[e.horse_id]) {
            costPerHorse[e.horse_id] = { horseName, amount: 0 };
          }
          costPerHorse[e.horse_id].amount += Number(e.amount);
        }
      });

      // Group costs by month (monthly costs)
      const monthlyCosts: Record<string, number> = {};
      (expenses as any[]).forEach((e: any) => {
        if (e.date) {
          const monthKey = e.date.substring(0, 7); // 'YYYY-MM'
          monthlyCosts[monthKey] = (monthlyCosts[monthKey] || 0) + Number(e.amount);
        }
      });

      // Group costs by year (yearly costs)
      const yearlyCosts: Record<string, number> = {};
      (expenses as any[]).forEach((e: any) => {
        if (e.date) {
          const yearKey = e.date.substring(0, 4); // 'YYYY'
          yearlyCosts[yearKey] = (yearlyCosts[yearKey] || 0) + Number(e.amount);
        }
      });

      return {
        totalCost,
        categoryAnalysis,
        costPerHorse: Object.values(costPerHorse),
        monthlyCosts,
        yearlyCosts,
      };
    },
  });
}
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newInvoice: Omit<Database["public"]["Tables"]["invoices"]["Insert"], "organization_id">) => {
      const { data, error } = await (supabase.from("invoices") as any)
        .insert([newInvoice])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["financial-aggregates"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}
