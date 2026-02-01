import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Building2, Plus, Trash2, Star, StarOff, Pencil, Search, Loader2 } from "lucide-react";
import { insertCompanySchema, insertBankAccountSchema, type Company, type BankAccount } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// 郵便番号から住所を検索する関数（住所自動入力）
async function searchAddressByPostalCode(postalCode: string): Promise<{ address: string } | null> {
  const cleaned = postalCode.replace(/[-ー－]/g, "");
  if (!/^\d{7}$/.test(cleaned)) {
    return null;
  }
  try {
    const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleaned}`);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        address: `${result.address1}${result.address2}${result.address3}`,
      };
    }
    return null;
  } catch (error) {
    console.error("Postal code search error:", error);
    return null;
  }
}

// デフォルト支払条件の選択肢
const paymentTermsOptions = [
  { value: "月末締め翌月末払い", label: "月末締め翌月末払い" },
  { value: "月末締め翌々月末払い", label: "月末締め翌々月末払い" },
  { value: "20日締め翌月末払い", label: "20日締め翌月末払い" },
  { value: "15日締め翌月末払い", label: "15日締め翌月末払い" },
  { value: "請求書発行後30日以内", label: "請求書発行後30日以内" },
  { value: "請求書発行後14日以内", label: "請求書発行後14日以内" },
  { value: "都度払い", label: "都度払い" },
  { value: "前払い", label: "前払い" },
];

const companyFormSchema = insertCompanySchema.omit({ userId: true }).extend({
  invoiceRegistrationNumber: z.string().optional().refine(
    (val) => !val || /^T\d{13}$/.test(val),
    { message: "T + 13桁の数字で入力してください (例: T1234567890123)" }
  ),
});

const bankAccountFormSchema = insertBankAccountSchema.omit({ companyId: true });

type CompanyFormData = z.infer<typeof companyFormSchema>;
type BankAccountFormData = z.infer<typeof bankAccountFormSchema>;

export default function CompanySettingsPage() {
  const { toast } = useToast();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [bankAccountDialogOpen, setBankAccountDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null);
  const [isSearchingPostalCode, setIsSearchingPostalCode] = useState(false);

  const { data: companies = [], isLoading: companiesLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const { data: bankAccounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/companies", selectedCompanyId, "bank-accounts"],
    enabled: !!selectedCompanyId,
  });

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
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
      defaultPaymentTerms: "",
      isDefault: "false",
    },
  });

  const bankAccountForm = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountFormSchema),
    defaultValues: {
      accountName: "",
      bankName: "",
      bankBranch: "",
      bankAccountType: "普通",
      bankAccountNumber: "",
      bankAccountHolder: "",
      isDefault: "false",
    },
  });

  // 最初の会社を選択状態にする
  if (!selectedCompanyId && companies.length > 0) {
    setSelectedCompanyId(companies[0].id);
  }

  const createCompanyMutation = useMutation({
    mutationFn: (data: CompanyFormData) => apiRequest("/api/companies", "POST", data),
    onSuccess: (newCompany: Company) => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "会社情報を追加しました" });
      setCompanyDialogOpen(false);
      setSelectedCompanyId(newCompany.id);
      companyForm.reset();
    },
    onError: () => {
      toast({ title: "追加に失敗しました", variant: "destructive" });
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CompanyFormData> }) =>
      apiRequest(`/api/companies/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "会社情報を更新しました" });
      setCompanyDialogOpen(false);
      setEditingCompany(null);
      companyForm.reset();
    },
    onError: () => {
      toast({ title: "更新に失敗しました", variant: "destructive" });
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/companies/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "会社情報を削除しました" });
      if (selectedCompanyId === editingCompany?.id) {
        setSelectedCompanyId(null);
      }
    },
    onError: () => {
      toast({ title: "削除に失敗しました", variant: "destructive" });
    },
  });

  const setDefaultCompanyMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/companies/${id}/set-default`, "PUT", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "デフォルト会社を設定しました" });
    },
    onError: () => {
      toast({ title: "設定に失敗しました", variant: "destructive" });
    },
  });

  const createBankAccountMutation = useMutation({
    mutationFn: (data: BankAccountFormData & { companyId: string }) =>
      apiRequest("/api/bank-accounts", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", selectedCompanyId, "bank-accounts"] });
      toast({ title: "口座情報を追加しました" });
      setBankAccountDialogOpen(false);
      bankAccountForm.reset();
    },
    onError: () => {
      toast({ title: "追加に失敗しました", variant: "destructive" });
    },
  });

  const updateBankAccountMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BankAccountFormData> }) =>
      apiRequest(`/api/bank-accounts/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", selectedCompanyId, "bank-accounts"] });
      toast({ title: "口座情報を更新しました" });
      setBankAccountDialogOpen(false);
      setEditingBankAccount(null);
      bankAccountForm.reset();
    },
    onError: () => {
      toast({ title: "更新に失敗しました", variant: "destructive" });
    },
  });

  const deleteBankAccountMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/bank-accounts/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", selectedCompanyId, "bank-accounts"] });
      toast({ title: "口座情報を削除しました" });
    },
    onError: () => {
      toast({ title: "削除に失敗しました", variant: "destructive" });
    },
  });

  const setDefaultBankAccountMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/bank-accounts/${id}/set-default`, "PUT", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", selectedCompanyId, "bank-accounts"] });
      toast({ title: "デフォルト口座を設定しました" });
    },
    onError: () => {
      toast({ title: "設定に失敗しました", variant: "destructive" });
    },
  });

  const handleOpenCompanyDialog = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      companyForm.reset({
        companyName: company.companyName || "",
        companyNameKana: company.companyNameKana || "",
        representativeName: company.representativeName || "",
        invoiceRegistrationNumber: company.invoiceRegistrationNumber || "",
        postalCode: company.postalCode || "",
        address: company.address || "",
        phone: company.phone || "",
        fax: company.fax || "",
        email: company.email || "",
        defaultPaymentTerms: company.defaultPaymentTerms || "",
        isDefault: company.isDefault || "false",
      });
    } else {
      setEditingCompany(null);
      companyForm.reset();
    }
    setCompanyDialogOpen(true);
  };

  const handleOpenBankAccountDialog = (account?: BankAccount) => {
    if (account) {
      setEditingBankAccount(account);
      bankAccountForm.reset({
        accountName: account.accountName || "",
        bankName: account.bankName || "",
        bankBranch: account.bankBranch || "",
        bankAccountType: account.bankAccountType || "普通",
        bankAccountNumber: account.bankAccountNumber || "",
        bankAccountHolder: account.bankAccountHolder || "",
        isDefault: account.isDefault || "false",
      });
    } else {
      setEditingBankAccount(null);
      bankAccountForm.reset();
    }
    setBankAccountDialogOpen(true);
  };

  // 郵便番号から住所を検索
  const handlePostalCodeSearch = async () => {
    const postalCode = companyForm.getValues("postalCode");
    if (!postalCode) {
      toast({ title: "郵便番号を入力してください", variant: "destructive" });
      return;
    }
    setIsSearchingPostalCode(true);
    try {
      const result = await searchAddressByPostalCode(postalCode);
      if (result) {
        companyForm.setValue("address", result.address);
        toast({ title: "住所を取得しました" });
      } else {
        toast({ title: "該当する住所が見つかりませんでした", variant: "destructive" });
      }
    } finally {
      setIsSearchingPostalCode(false);
    }
  };

  const onSubmitCompany = (data: CompanyFormData) => {
    if (editingCompany) {
      updateCompanyMutation.mutate({ id: editingCompany.id, data });
    } else {
      createCompanyMutation.mutate(data);
    }
  };

  const onSubmitBankAccount = (data: BankAccountFormData) => {
    if (!selectedCompanyId) return;

    if (editingBankAccount) {
      updateBankAccountMutation.mutate({ id: editingBankAccount.id, data });
    } else {
      createBankAccountMutation.mutate({ ...data, companyId: selectedCompanyId });
    }
  };

  if (companiesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">自社設定</h1>
            <p className="text-muted-foreground">複数の会社情報と口座情報を管理します</p>
          </div>
        </div>
        <Button onClick={() => handleOpenCompanyDialog()} data-testid="button-add-company">
          <Plus className="h-4 w-4 mr-2" />
          会社を追加
        </Button>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">会社情報が登録されていません</p>
            <Button onClick={() => handleOpenCompanyDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              最初の会社を登録
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={selectedCompanyId || undefined} onValueChange={setSelectedCompanyId}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {companies.map((company) => (
              <TabsTrigger key={company.id} value={company.id} className="flex items-center gap-2">
                {company.companyName}
                {company.isDefault === 'true' && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
              </TabsTrigger>
            ))}
          </TabsList>

          {selectedCompany && (
            <TabsContent value={selectedCompany.id} className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedCompany.companyName}
                      {selectedCompany.isDefault === 'true' && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3" />
                          デフォルト
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>会社の基本情報</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {selectedCompany.isDefault !== 'true' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultCompanyMutation.mutate(selectedCompany.id)}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        デフォルトに設定
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenCompanyDialog(selectedCompany)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      編集
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("この会社情報を削除しますか？関連する口座情報も削除されます。")) {
                          deleteCompanyMutation.mutate(selectedCompany.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-muted-foreground">会社名（カナ）</div>
                    <div>{selectedCompany.companyNameKana || "-"}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">代表者名</div>
                    <div>{selectedCompany.representativeName || "-"}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">登録番号</div>
                    <div className="font-mono">{selectedCompany.invoiceRegistrationNumber || "-"}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">電話番号</div>
                    <div>{selectedCompany.phone || "-"}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="font-medium text-muted-foreground">住所</div>
                    <div>
                      {selectedCompany.postalCode && `〒${selectedCompany.postalCode} `}
                      {selectedCompany.address || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">メールアドレス</div>
                    <div>{selectedCompany.email || "-"}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">デフォルト支払条件</div>
                    <div>{selectedCompany.defaultPaymentTerms || "-"}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>振込先口座</CardTitle>
                    <CardDescription>この会社の口座情報一覧</CardDescription>
                  </div>
                  <Button onClick={() => handleOpenBankAccountDialog()} data-testid="button-add-bank-account">
                    <Plus className="h-4 w-4 mr-2" />
                    口座を追加
                  </Button>
                </CardHeader>
                <CardContent>
                  {bankAccounts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      口座情報が登録されていません
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>口座名</TableHead>
                          <TableHead>銀行・支店</TableHead>
                          <TableHead>種別</TableHead>
                          <TableHead>口座番号</TableHead>
                          <TableHead>口座名義</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bankAccounts.map((account) => (
                          <TableRow key={account.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {account.accountName}
                                {account.isDefault === 'true' && (
                                  <Badge variant="secondary" className="text-xs gap-1">
                                    <Star className="h-2 w-2" />
                                    デフォルト
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{account.bankName} {account.bankBranch}</TableCell>
                            <TableCell>{account.bankAccountType}</TableCell>
                            <TableCell className="font-mono">{account.bankAccountNumber}</TableCell>
                            <TableCell>{account.bankAccountHolder}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {account.isDefault !== 'true' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDefaultBankAccountMutation.mutate(account.id)}
                                    title="デフォルトに設定"
                                  >
                                    <StarOff className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenBankAccountDialog(account)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm("この口座情報を削除しますか？")) {
                                      deleteBankAccountMutation.mutate(account.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* 会社追加・編集ダイアログ */}
      <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCompany ? "会社情報を編集" : "会社情報を追加"}</DialogTitle>
            <DialogDescription>
              請求書に表示される会社情報を入力してください
            </DialogDescription>
          </DialogHeader>
          <Form {...companyForm}>
            <form onSubmit={companyForm.handleSubmit(onSubmitCompany)} className="space-y-4">
              <FormField
                control={companyForm.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>会社名 / 事業者名 *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="株式会社サンプル" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={companyForm.control}
                name="companyNameKana"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>会社名（カナ）</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="カブシキガイシャサンプル" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={companyForm.control}
                  name="representativeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>代表者名</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="山田 太郎" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="invoiceRegistrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>適格請求書登録番号</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="T1234567890123" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={companyForm.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>郵便番号</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="123-4567" data-testid="input-postal-code" />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handlePostalCodeSearch}
                          disabled={isSearchingPostalCode}
                          title="住所を検索"
                          data-testid="button-search-postal-code"
                        >
                          {isSearchingPostalCode ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>電話番号</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="03-1234-5678" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={companyForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>住所</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} placeholder="東京都千代田区..." className="min-h-[60px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={companyForm.control}
                  name="fax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FAX番号</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="03-1234-5679" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>メールアドレス</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="email" placeholder="info@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={companyForm.control}
                name="defaultPaymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>デフォルト支払条件</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-terms">
                          <SelectValue placeholder="支払条件を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentTermsOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCompanyDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={createCompanyMutation.isPending || updateCompanyMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingCompany ? "更新する" : "追加する"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 口座追加・編集ダイアログ */}
      <Dialog open={bankAccountDialogOpen} onOpenChange={setBankAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBankAccount ? "口座情報を編集" : "口座情報を追加"}</DialogTitle>
            <DialogDescription>
              振込先口座の情報を入力してください
            </DialogDescription>
          </DialogHeader>
          <Form {...bankAccountForm}>
            <form onSubmit={bankAccountForm.handleSubmit(onSubmitBankAccount)} className="space-y-4">
              <FormField
                control={bankAccountForm.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>口座名（識別用）*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="メイン口座" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={bankAccountForm.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>銀行名 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="〇〇銀行" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={bankAccountForm.control}
                  name="bankBranch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>支店名 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="〇〇支店" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={bankAccountForm.control}
                  name="bankAccountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>口座種別 *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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
                  control={bankAccountForm.control}
                  name="bankAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>口座番号 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="1234567" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={bankAccountForm.control}
                name="bankAccountHolder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>口座名義 *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="カ）サンプル" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setBankAccountDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={createBankAccountMutation.isPending || updateBankAccountMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingBankAccount ? "更新する" : "追加する"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
