import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileSpreadsheet, ArrowLeft, Pencil, Trash2, Send, Plus, CreditCard, Mail, CheckCircle, AlertCircle, Printer, Download } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { type Invoice, type InvoiceItem, type Office, type Payment, type CompanySettings } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { format } from "date-fns";
import { InvoicePrintView } from "@/components/invoice-print-view";
import { downloadInvoicePDF } from "@/lib/invoice-pdf";

const paymentSchema = z.object({
  paymentDate: z.string().min(1, "入金日を入力してください"),
  amount: z.coerce.number().min(1, "入金額を入力してください"),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const emailSchema = z.object({
  to: z.string().email("正しいメールアドレスを入力してください"),
  subject: z.string().min(1, "件名を入力してください"),
  body: z.string().min(1, "本文を入力してください"),
});

type EmailFormData = z.infer<typeof emailSchema>;

const statusColors: Record<string, string> = {
  '下書き': 'bg-muted text-muted-foreground',
  '発行済': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  '送付済': 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  '一部入金': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
  '入金済': 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  'キャンセル': 'bg-destructive/10 text-destructive',
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);

  const { data, isLoading } = useQuery<{ invoice: Invoice; items: InvoiceItem[]; office: Office }>({
    queryKey: ["/api/invoices", id],
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/invoices", id, "payments"],
    enabled: !!id,
  });

  const { data: companySettings } = useQuery<CompanySettings | null>({
    queryKey: ["/api/company-settings"],
  });

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentDate: format(new Date(), "yyyy-MM-dd"),
      amount: 0,
      paymentMethod: "銀行振込",
      notes: "",
    },
  });

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      to: "",
      subject: "",
      body: "",
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest(`/api/invoices/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "請求書を削除しました" });
      navigate("/invoices");
    },
    onError: () => {
      toast({ title: "削除に失敗しました", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => apiRequest(`/api/invoices/${id}`, "PUT", { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", id] });
      toast({ title: "ステータスを更新しました" });
    },
    onError: () => {
      toast({ title: "更新に失敗しました", variant: "destructive" });
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data: PaymentFormData) => apiRequest(`/api/invoices/${id}/payments`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", id, "payments"] });
      toast({ title: "入金を記録しました" });
      setPaymentDialogOpen(false);
      paymentForm.reset();
    },
    onError: () => {
      toast({ title: "登録に失敗しました", variant: "destructive" });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId: string) => apiRequest(`/api/payments/${paymentId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", id, "payments"] });
      toast({ title: "入金記録を削除しました" });
    },
    onError: () => {
      toast({ title: "削除に失敗しました", variant: "destructive" });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (data: EmailFormData) => apiRequest(`/api/invoices/${id}/send-email`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", id] });
      toast({ title: "メールを送信しました" });
      setEmailDialogOpen(false);
      emailForm.reset();
    },
    onError: () => {
      toast({ title: "送信に失敗しました", variant: "destructive" });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
  };

  const handleDelete = () => {
    if (confirm("この請求書を削除してもよろしいですか？")) {
      deleteMutation.mutate();
    }
  };

  const handleOpenEmailDialog = () => {
    if (data) {
      const office = data.office;
      emailForm.reset({
        to: office.email1 || "",
        subject: `請求書送付のご案内 (${data.invoice.invoiceNumber})`,
        body: `${office.name} 御中\n\nいつもお世話になっております。\n\n請求書を送付させていただきます。\nご確認のほど、よろしくお願いいたします。\n\n請求書番号: ${data.invoice.invoiceNumber}\n請求金額: ${formatCurrency(data.invoice.totalAmount)}\n支払期限: ${data.invoice.dueDate ? format(new Date(data.invoice.dueDate), "yyyy年MM月dd日") : "未定"}\n\n何かご不明な点がございましたら、お気軽にお問い合わせください。`,
      });
    }
    setEmailDialogOpen(true);
  };

  const handleOpenPaymentDialog = () => {
    if (data) {
      const remainingAmount = data.invoice.totalAmount - (data.invoice.paidAmount || 0);
      paymentForm.reset({
        paymentDate: format(new Date(), "yyyy-MM-dd"),
        amount: remainingAmount,
        paymentMethod: "銀行振込",
        notes: "",
      });
    }
    setPaymentDialogOpen(true);
  };

  const handlePrint = () => {
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      setShowPrintView(false);
    }, 100);
  };

  const handleDownloadPDF = () => {
    if (data) {
      downloadInvoicePDF({
        invoice: data.invoice,
        items: data.items,
        office: data.office,
        companySettings: companySettings || null,
      });
      toast({ title: "PDFをダウンロードしました" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">請求書が見つかりません</div>
      </div>
    );
  }

  const { invoice, items, office } = data;
  const remainingAmount = invoice.totalAmount - (invoice.paidAmount || 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold font-mono">{invoice.invoiceNumber}</h1>
              <div className="flex items-center gap-2">
                <Badge className={statusColors[invoice.status] || ''} data-testid="badge-status">
                  {invoice.status}
                </Badge>
                {invoice.emailSentAt && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {format(new Date(invoice.emailSentAt), "yyyy/MM/dd")} 送信済
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handlePrint} data-testid="button-print">
            <Printer className="h-4 w-4 mr-2" />
            印刷
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} data-testid="button-download-pdf">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          {invoice.status === '下書き' && (
            <Button variant="outline" onClick={() => updateStatusMutation.mutate('発行済')} data-testid="button-issue">
              発行する
            </Button>
          )}
          {(invoice.status === '発行済' || invoice.status === '下書き') && (
            <Button variant="outline" onClick={handleOpenEmailDialog} data-testid="button-send-email">
              <Send className="h-4 w-4 mr-2" />
              メール送信
            </Button>
          )}
          <Link href={`/invoices/${id}/edit`}>
            <Button variant="outline" data-testid="button-edit">
              <Pencil className="h-4 w-4 mr-2" />
              編集
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete} data-testid="button-delete">
            <Trash2 className="h-4 w-4 mr-2" />
            削除
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>請求先</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-lg font-bold">{office.name} 御中</div>
            {office.address && <div className="text-sm text-muted-foreground">{office.address}</div>}
            {office.phone1 && <div className="text-sm text-muted-foreground">TEL: {office.phone1}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>請求情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">発行日</span>
              <span>{format(new Date(invoice.issueDate), "yyyy年MM月dd日")}</span>
            </div>
            {invoice.dueDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">支払期限</span>
                <span>{format(new Date(invoice.dueDate), "yyyy年MM月dd日")}</span>
              </div>
            )}
            {companySettings?.invoiceRegistrationNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">登録番号</span>
                <span className="font-mono">{companySettings.invoiceRegistrationNumber}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>明細</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>品目・内容</TableHead>
                <TableHead className="text-right">数量</TableHead>
                <TableHead>単位</TableHead>
                <TableHead className="text-right">単価</TableHead>
                <TableHead className="text-right">税率</TableHead>
                <TableHead className="text-right">金額</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id} data-testid={`row-item-${index}`}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell>{item.unit || '-'}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right">{item.taxRate}%{item.taxRate === 8 ? '※' : ''}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(item.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <Separator className="my-4" />
          
          <div className="space-y-2 text-right">
            <div className="flex justify-end gap-8">
              <span className="text-muted-foreground">小計（税抜）</span>
              <span className="font-mono w-32">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {(invoice.taxAmount10 || 0) > 0 && (
              <div className="flex justify-end gap-8">
                <span className="text-muted-foreground">消費税（10%）</span>
                <span className="font-mono w-32">{formatCurrency(invoice.taxAmount10 || 0)}</span>
              </div>
            )}
            {(invoice.taxAmount8 || 0) > 0 && (
              <div className="flex justify-end gap-8">
                <span className="text-muted-foreground">消費税（8%）※</span>
                <span className="font-mono w-32">{formatCurrency(invoice.taxAmount8 || 0)}</span>
              </div>
            )}
            <div className="flex justify-end gap-8 pt-2 border-t">
              <span className="font-bold">合計（税込）</span>
              <span className="font-mono font-bold w-32 text-lg">{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>
          
          {(invoice.taxAmount8 || 0) > 0 && (
            <p className="text-xs text-muted-foreground mt-4">※ 軽減税率対象品目</p>
          )}
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>備考</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              入金状況
            </CardTitle>
            <CardDescription>
              入金済: {formatCurrency(invoice.paidAmount || 0)} / 残額: {formatCurrency(remainingAmount)}
            </CardDescription>
          </div>
          {invoice.status !== '入金済' && invoice.status !== 'キャンセル' && (
            <Button onClick={handleOpenPaymentDialog} data-testid="button-add-payment">
              <Plus className="h-4 w-4 mr-2" />
              入金登録
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              入金記録がありません
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>入金日</TableHead>
                  <TableHead>方法</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead>備考</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                    <TableCell>{format(new Date(payment.paymentDate), "yyyy/MM/dd")}</TableCell>
                    <TableCell>{payment.paymentMethod || '-'}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.notes || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("この入金記録を削除しますか？")) {
                            deletePaymentMutation.mutate(payment.id);
                          }
                        }}
                        data-testid={`button-delete-payment-${payment.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {invoice.status === '入金済' && (
            <div className="flex items-center justify-center gap-2 py-4 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>入金完了</span>
            </div>
          )}
          
          {remainingAmount > 0 && invoice.status !== 'キャンセル' && invoice.status !== '下書き' && (
            <div className="flex items-center justify-center gap-2 py-4 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              <span>未入金: {formatCurrency(remainingAmount)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>入金登録</DialogTitle>
            <DialogDescription>
              入金情報を記録します
            </DialogDescription>
          </DialogHeader>
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit((data) => createPaymentMutation.mutate(data))} className="space-y-4">
              <FormField
                control={paymentForm.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>入金日 *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" data-testid="input-payment-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>入金額 *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" data-testid="input-payment-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>入金方法</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="銀行振込">銀行振込</SelectItem>
                        <SelectItem value="現金">現金</SelectItem>
                        <SelectItem value="その他">その他</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>備考</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} data-testid="input-payment-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={createPaymentMutation.isPending} data-testid="button-submit-payment">
                  {createPaymentMutation.isPending ? "登録中..." : "登録する"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>請求書メール送信</DialogTitle>
            <DialogDescription>
              請求書をメールで送信します
            </DialogDescription>
          </DialogHeader>
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit((data) => sendEmailMutation.mutate(data))} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>宛先 *</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" data-testid="input-email-to" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={emailForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>件名 *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-email-subject" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={emailForm.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>本文 *</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-[200px]" data-testid="input-email-body" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEmailDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={sendEmailMutation.isPending} data-testid="button-submit-email">
                  <Send className="h-4 w-4 mr-2" />
                  {sendEmailMutation.isPending ? "送信中..." : "送信する"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {showPrintView && (
        <InvoicePrintView
          invoice={invoice}
          items={items}
          office={office}
          companySettings={companySettings || null}
        />
      )}
    </div>
  );
}
