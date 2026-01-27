import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Building2 } from "lucide-react";
import { insertCompanySettingsSchema, type CompanySettings, type InsertCompanySettings } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { z } from "zod";

const formSchema = insertCompanySettingsSchema.omit({ userId: true }).extend({
  invoiceRegistrationNumber: z.string().optional().refine(
    (val) => !val || /^T\d{13}$/.test(val),
    { message: "T + 13桁の数字で入力してください (例: T1234567890123)" }
  ),
});

type FormData = z.infer<typeof formSchema>;

export default function CompanySettingsPage() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<CompanySettings | null>({
    queryKey: ["/api/company-settings"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      companyNameKana: "",
      representativeName: "",
      invoiceRegistrationNumber: "",
      postalCode: "",
      address: "",
      phone: "",
      fax: "",
      email: "",
      bankName: "",
      bankBranch: "",
      bankAccountType: "",
      bankAccountNumber: "",
      bankAccountHolder: "",
      defaultPaymentTerms: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        companyName: settings.companyName || "",
        companyNameKana: settings.companyNameKana || "",
        representativeName: settings.representativeName || "",
        invoiceRegistrationNumber: settings.invoiceRegistrationNumber || "",
        postalCode: settings.postalCode || "",
        address: settings.address || "",
        phone: settings.phone || "",
        fax: settings.fax || "",
        email: settings.email || "",
        bankName: settings.bankName || "",
        bankBranch: settings.bankBranch || "",
        bankAccountType: settings.bankAccountType || "",
        bankAccountNumber: settings.bankAccountNumber || "",
        bankAccountHolder: settings.bankAccountHolder || "",
        defaultPaymentTerms: settings.defaultPaymentTerms || "",
      });
    }
  }, [settings, form]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("/api/company-settings", "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-settings"] });
      toast({ title: "自社情報を保存しました" });
    },
    onError: () => {
      toast({ title: "保存に失敗しました", variant: "destructive" });
    },
  });

  const onSubmit = (data: FormData) => {
    saveMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">自社設定</h1>
          <p className="text-muted-foreground">請求書に表示される自社情報を設定します</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>会社情報</CardTitle>
              <CardDescription>基本的な会社情報を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>会社名 / 事業者名 *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="株式会社サンプル" data-testid="input-company-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyNameKana"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>会社名（カナ）</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="カブシキガイシャサンプル" data-testid="input-company-name-kana" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="representativeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>代表者名</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="山田 太郎" data-testid="input-representative-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="invoiceRegistrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>適格請求書発行事業者登録番号</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="T1234567890123" data-testid="input-invoice-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>連絡先</CardTitle>
              <CardDescription>住所・電話番号などの連絡先情報</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>郵便番号</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="123-4567" data-testid="input-postal-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>住所</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} placeholder="東京都千代田区..." className="min-h-[80px]" data-testid="input-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>電話番号</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="03-1234-5678" data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FAX番号</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="03-1234-5679" data-testid="input-fax" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>メールアドレス</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} type="email" placeholder="info@example.com" data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>振込先口座</CardTitle>
              <CardDescription>請求書に記載する振込先口座情報</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>銀行名</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="〇〇銀行" data-testid="input-bank-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankBranch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>支店名</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="〇〇支店" data-testid="input-bank-branch" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankAccountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>口座種別</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-account-type">
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="普通">普通</SelectItem>
                        <SelectItem value="当座">当座</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankAccountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>口座番号</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="1234567" data-testid="input-account-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankAccountHolder"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>口座名義</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="カ）サンプル" data-testid="input-account-holder" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>デフォルト設定</CardTitle>
              <CardDescription>新規請求書作成時のデフォルト値</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="defaultPaymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>デフォルト支払条件</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="月末締め翌月末払い" data-testid="input-payment-terms" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save">
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "保存中..." : "保存する"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
