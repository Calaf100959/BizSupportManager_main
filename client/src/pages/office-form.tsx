import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import { insertOfficeSchema, type Office } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const formSchema = insertOfficeSchema.extend({
  code: z.string()
    .min(1, "事業所コードは必須です")
    .max(5, "事業所コードは5桁以内で入力してください")
    .regex(/^\d+$/, "事業所コードは数字のみで入力してください"),
  name: z.string().min(1, "事業所名は必須です"),
  representativeName: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function OfficeFormPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: office, isLoading } = useQuery<Office>({
    queryKey: ["/api/offices", id],
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("/api/offices", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offices"] });
      toast({ title: "事業所を登録しました" });
      setLocation("/search");
    },
    onError: () => {
      toast({ title: "登録に失敗しました", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest(`/api/offices/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offices", id] });
      toast({ title: "事業所を更新しました" });
      setLocation("/search");
    },
    onError: () => {
      toast({ title: "更新に失敗しました", variant: "destructive" });
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      nameKana: "",
      representativeName: "",
      representativeKana: "",
      companyType: "",
      capital: undefined,
      corporateNumber: "",
      invoiceNumber: "",
      phone: "",
      representativeMobile: "",
      industry: "",
      employees: undefined,
      regularEmployees: undefined,
      companyCategory: "",
      engagementType: "",
      engagementDate: null,
      withdrawalDate: null,
      withdrawalReason: "",
      withdrawalReasonDetail: "",
      closureDate: null,
      postalCode: "",
      address: "",
      foundedDate: null,
      officePhone: "",
      fax: "",
      url: "",
      email1: "",
      email2: "",
      email3: "",
      sns1: "",
      sns2: "",
      sns3: "",
      referral: "",
    },
  });

  useEffect(() => {
    if (office) {
      form.reset({
        code: office.code || "",
        name: office.name || "",
        nameKana: office.nameKana || "",
        representativeName: office.representativeName || "",
        representativeKana: office.representativeKana || "",
        companyType: office.companyType || "",
        capital: office.capital || undefined,
        corporateNumber: office.corporateNumber || "",
        invoiceNumber: office.invoiceNumber || "",
        phone: office.phone || "",
        representativeMobile: office.representativeMobile || "",
        industry: office.industry || "",
        employees: office.employees || undefined,
        regularEmployees: office.regularEmployees || undefined,
        companyCategory: office.companyCategory || "",
        engagementType: office.engagementType || "",
        engagementDate: office.engagementDate || null,
        withdrawalDate: office.withdrawalDate || null,
        withdrawalReason: office.withdrawalReason || "",
        withdrawalReasonDetail: office.withdrawalReasonDetail || "",
        closureDate: office.closureDate || null,
        postalCode: office.postalCode || "",
        address: office.address || "",
        foundedDate: office.foundedDate || null,
        officePhone: office.officePhone || "",
        fax: office.fax || "",
        url: office.url || "",
        email1: office.email1 || "",
        email2: office.email2 || "",
        email3: office.email3 || "",
        sns1: office.sns1 || "",
        sns2: office.sns2 || "",
        sns3: office.sns3 || "",
        referral: office.referral || "",
      });
    }
  }, [office, form]);

  const onSubmit = (data: FormData) => {
    if (id) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/search")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            {id ? "事業所編集" : "事業所登録"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {id ? "事業所の情報を編集します" : "新規事業所の情報を登録します"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>事業所の基本的な情報を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>事業所コード *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                            field.onChange(value);
                          }}
                          placeholder="例：12345" 
                          inputMode="numeric"
                          data-testid="input-office-code" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>事業所名 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="例：株式会社山田商店" data-testid="input-office-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nameKana"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>フリガナ</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="例：カブシキガイシャヤマダショウテン" data-testid="input-office-kana" />
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
                      <FormLabel>代表者氏名</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="例：山田太郎" data-testid="input-representative" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="representativeKana"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>代表者フリガナ</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="例：ヤマダタロウ" data-testid="input-rep-kana" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>企業形態</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-company-type">
                            <SelectValue placeholder="選択してください" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="corporation">株式会社</SelectItem>
                          <SelectItem value="llc">合同会社</SelectItem>
                          <SelectItem value="partnership">合名会社</SelectItem>
                          <SelectItem value="individual">個人事業主</SelectItem>
                          <SelectItem value="other">その他</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capital"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>資本金（万円）</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="例：1000"
                          data-testid="input-capital"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="corporateNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>法人番号</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="13桁の番号" data-testid="input-corporate-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>インボイス番号</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="T + 13桁の番号" data-testid="input-invoice-number" />
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
                        <Input {...field} value={field.value || ""} type="tel" placeholder="例：03-1234-5678" data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="representativeMobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>代表者携帯番号</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="tel" placeholder="例：090-1234-5678" data-testid="input-mobile" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>事業所情報</CardTitle>
              <CardDescription>事業所の詳細情報を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>業種</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-industry">
                            <SelectValue placeholder="選択してください" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="manufacturing">製造業</SelectItem>
                          <SelectItem value="retail">小売業</SelectItem>
                          <SelectItem value="service">サービス業</SelectItem>
                          <SelectItem value="it">情報通信業</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>従業員数（人）</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="例：50"
                          data-testid="input-employees"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="regularEmployees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>常用雇用者数（人）</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="例：40"
                          data-testid="input-regular-employees"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>企業区分</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-company-category">
                            <SelectValue placeholder="選択してください" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="small">小規模事業者</SelectItem>
                          <SelectItem value="medium">中小企業</SelectItem>
                          <SelectItem value="midsize">中堅企業</SelectItem>
                          <SelectItem value="large">大企業</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="engagementType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>関与区分</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-engagement-type">
                            <SelectValue placeholder="選択してください" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">関与先</SelectItem>
                          <SelectItem value="past">（旧）関与先</SelectItem>
                          <SelectItem value="seminar">セミナー系関与先</SelectItem>
                          <SelectItem value="onetime">一見先</SelectItem>
                          <SelectItem value="none">非関与先</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="engagementDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>関与年月日</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="date" data-testid="input-engagement-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="withdrawalDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>離脱年月日</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="date" data-testid="input-withdrawal-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="withdrawalReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>離脱理由</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-withdrawal-reason">
                            <SelectValue placeholder="選択してください" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="completion">契約満了</SelectItem>
                          <SelectItem value="closure">廃業・解散・倒産</SelectItem>
                          <SelectItem value="other">その他</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="withdrawalReasonDetail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>離脱理由（詳細）</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ""} placeholder="詳細な理由を記入してください" data-testid="textarea-withdrawal-detail" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="closureDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>廃業年月日</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="date" data-testid="input-closure-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>郵便番号</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="例：100-0001" data-testid="input-postal-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>事業所所在地</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="例：東京都千代田区千代田1-1" data-testid="input-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="foundedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>創業年月日</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="date" data-testid="input-founded-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="officePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>電話番号</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="tel" placeholder="例：03-1234-5678" data-testid="input-office-phone" />
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
                        <Input {...field} value={field.value || ""} type="tel" placeholder="例：03-1234-5679" data-testid="input-fax" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="url" placeholder="https://example.com" data-testid="input-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>メールアドレス1</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="email" placeholder="info@example.com" data-testid="input-email1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>メールアドレス2</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="email" data-testid="input-email2" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>メールアドレス3</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="email" data-testid="input-email3" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sns1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SNSアカウント1</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="例：@company" data-testid="input-sns1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sns2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SNSアカウント2</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-sns2" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sns3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SNSアカウント3</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-sns3" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="referral"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>紹介先</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="紹介元を記入してください" data-testid="input-referral" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setLocation("/search")} data-testid="button-cancel">
              キャンセル
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save">
              <Save className="mr-2 h-4 w-4" />
              {createMutation.isPending || updateMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
