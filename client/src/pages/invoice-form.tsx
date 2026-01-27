import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, FileSpreadsheet, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { type Office, type Invoice, type InvoiceItem } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { format } from "date-fns";

const itemSchema = z.object({
  description: z.string().min(1, "品目を入力してください"),
  quantity: z.coerce.number().min(1),
  unit: z.string().optional(),
  unitPrice: z.coerce.number().min(0),
  taxRate: z.coerce.number().default(10),
});

const formSchema = z.object({
  officeId: z.string().min(1, "請求先を選択してください"),
  issueDate: z.string().min(1, "発行日を入力してください"),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, "明細を1件以上入力してください"),
});

type FormData = z.infer<typeof formSchema>;

export default function InvoiceFormPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditing = !!id;

  const { data: offices = [] } = useQuery<Office[]>({
    queryKey: ["/api/offices"],
  });

  const { data: existingData, isLoading: isLoadingInvoice } = useQuery<{ invoice: Invoice; items: InvoiceItem[]; office: Office }>({
    queryKey: ["/api/invoices", id],
    enabled: isEditing,
  });

  const { data: nextNumber } = useQuery<{ invoiceNumber: string }>({
    queryKey: ["/api/invoices/next-number"],
    enabled: !isEditing,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      officeId: "",
      issueDate: format(new Date(), "yyyy-MM-dd"),
      dueDate: "",
      notes: "",
      items: [{ description: "", quantity: 1, unit: "", unitPrice: 0, taxRate: 10 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (existingData) {
      form.reset({
        officeId: existingData.invoice.officeId,
        issueDate: existingData.invoice.issueDate,
        dueDate: existingData.invoice.dueDate || "",
        notes: existingData.invoice.notes || "",
        items: existingData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || "",
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
        })),
      });
    }
  }, [existingData, form]);

  const createMutation = useMutation({
    mutationFn: (data: FormData & { invoiceNumber: string; status: string; subtotal: number; taxAmount10: number; taxAmount8: number; totalAmount: number }) => 
      apiRequest("/api/invoices", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "請求書を作成しました" });
      navigate("/invoices");
    },
    onError: () => {
      toast({ title: "作成に失敗しました", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest(`/api/invoices/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "請求書を更新しました" });
      navigate(`/invoices/${id}/detail`);
    },
    onError: () => {
      toast({ title: "更新に失敗しました", variant: "destructive" });
    },
  });

  const calculateItemAmount = (quantity: number, unitPrice: number) => quantity * unitPrice;

  const calculateTotals = () => {
    const items = form.watch("items") || [];
    let subtotal = 0;
    let tax10 = 0;
    let tax8 = 0;

    items.forEach(item => {
      const amount = calculateItemAmount(item.quantity || 0, item.unitPrice || 0);
      subtotal += amount;
      if (item.taxRate === 8) {
        tax8 += Math.floor(amount * 0.08);
      } else {
        tax10 += Math.floor(amount * 0.10);
      }
    });

    return {
      subtotal,
      taxAmount10: tax10,
      taxAmount8: tax8,
      totalAmount: subtotal + tax10 + tax8,
    };
  };

  const totals = calculateTotals();

  const onSubmit = (data: FormData) => {
    const itemsWithAmounts = data.items.map(item => ({
      ...item,
      amount: calculateItemAmount(item.quantity, item.unitPrice),
    }));

    const totals = calculateTotals();
    const invoiceData = {
      ...data,
      items: itemsWithAmounts,
      ...totals,
    };

    if (isEditing) {
      updateMutation.mutate(invoiceData);
    } else {
      createMutation.mutate({
        ...invoiceData,
        invoiceNumber: nextNumber?.invoiceNumber || "",
        status: "下書き",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
  };

  if (isEditing && isLoadingInvoice) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{isEditing ? "請求書編集" : "請求書作成"}</h1>
            <p className="text-muted-foreground font-mono">
              {isEditing ? existingData?.invoice.invoiceNumber : nextNumber?.invoiceNumber || "番号自動採番"}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="officeId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>請求先事業所 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-office">
                          <SelectValue placeholder="事業所を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {offices.map(office => (
                          <SelectItem key={office.id} value={office.id}>{office.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>発行日 *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" data-testid="input-issue-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>支払期限</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" data-testid="input-due-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>明細</CardTitle>
                <CardDescription>請求内容を入力してください</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: "", quantity: 1, unit: "", unitPrice: 0, taxRate: 10 })}
                data-testid="button-add-item"
              >
                <Plus className="h-4 w-4 mr-1" />
                明細追加
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">品目・内容</TableHead>
                    <TableHead className="w-[10%]">数量</TableHead>
                    <TableHead className="w-[10%]">単位</TableHead>
                    <TableHead className="w-[15%]">単価</TableHead>
                    <TableHead className="w-[10%]">税率</TableHead>
                    <TableHead className="w-[10%] text-right">金額</TableHead>
                    <TableHead className="w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const quantity = form.watch(`items.${index}.quantity`) || 0;
                    const unitPrice = form.watch(`items.${index}.unitPrice`) || 0;
                    const amount = calculateItemAmount(quantity, unitPrice);
                    return (
                      <TableRow key={field.id}>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder="品目" data-testid={`input-item-description-${index}`} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} type="number" min="1" data-testid={`input-item-quantity-${index}`} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.unit`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} placeholder="個" data-testid={`input-item-unit-${index}`} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.unitPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} type="number" min="0" data-testid={`input-item-price-${index}`} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.taxRate`}
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={(v) => field.onChange(parseInt(v))} value={String(field.value)}>
                                  <FormControl>
                                    <SelectTrigger data-testid={`select-item-tax-${index}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="10">10%</SelectItem>
                                    <SelectItem value="8">8%※</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(amount)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => fields.length > 1 && remove(index)}
                            disabled={fields.length <= 1}
                            data-testid={`button-remove-item-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-2">※ 軽減税率対象品目</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>合計</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-right">
                <div className="flex justify-end gap-8">
                  <span className="text-muted-foreground">小計（税抜）</span>
                  <span className="font-mono w-32">{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.taxAmount10 > 0 && (
                  <div className="flex justify-end gap-8">
                    <span className="text-muted-foreground">消費税（10%）</span>
                    <span className="font-mono w-32">{formatCurrency(totals.taxAmount10)}</span>
                  </div>
                )}
                {totals.taxAmount8 > 0 && (
                  <div className="flex justify-end gap-8">
                    <span className="text-muted-foreground">消費税（8%）※</span>
                    <span className="font-mono w-32">{formatCurrency(totals.taxAmount8)}</span>
                  </div>
                )}
                <div className="flex justify-end gap-8 pt-2 border-t">
                  <span className="font-bold">合計（税込）</span>
                  <span className="font-mono font-bold w-32 text-lg">{formatCurrency(totals.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>備考</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} placeholder="備考欄（振込先情報など）" className="min-h-[100px]" data-testid="input-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Link href="/invoices">
              <Button type="button" variant="outline" data-testid="button-cancel">
                キャンセル
              </Button>
            </Link>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save">
              <Save className="h-4 w-4 mr-2" />
              {createMutation.isPending || updateMutation.isPending ? "保存中..." : "保存する"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
