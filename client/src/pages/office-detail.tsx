import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Edit, Trash2, UserPlus, User, FileText, Plus, BookOpen, Calendar, History, TrendingUp, Brain, Loader2, Save, X, Sparkles, FileDown } from "lucide-react";
import { type Office, type Person, type Karte, type OfficeSubsidyRecord, type SubsidyProgram, insertOfficeSubsidyRecordSchema, type InsertOfficeSubsidyRecord, type AuditLog, type SwotAnalysis } from "@shared/schema";
import { getIndustryLabel } from "@/lib/industry-classifications";
import { generateSwotPdf } from "@/lib/swot-pdf";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function OfficeDetailPage() {
  const { officeId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deletePersonId, setDeletePersonId] = useState<string | null>(null);
  const [deleteKarteId, setDeleteKarteId] = useState<string | null>(null);
  const [deleteSubsidyId, setDeleteSubsidyId] = useState<string | null>(null);
  const [subsidyDialogOpen, setSubsidyDialogOpen] = useState(false);
  const [editingSubsidy, setEditingSubsidy] = useState<OfficeSubsidyRecord | null>(null);

  // SWOT editing state
  const [swotLocal, setSwotLocal] = useState<{
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    soStrategies: string[];
    woStrategies: string[];
    stStrategies: string[];
    wtStrategies: string[];
  } | null>(null);

  const { data: office, isLoading: officeLoading } = useQuery<Office>({
    queryKey: [`/api/offices/${officeId}`],
    enabled: !!officeId,
  });

  const { data: persons = [], isLoading: personsLoading } = useQuery<Person[]>({
    queryKey: [`/api/offices/${officeId}/persons`],
    enabled: !!officeId,
  });

  const { data: kartes = [], isLoading: kartesLoading } = useQuery<Karte[]>({
    queryKey: [`/api/offices/${officeId}/kartes`],
    enabled: !!officeId,
  });

  const { data: subsidyRecords = [], isLoading: subsidyRecordsLoading } = useQuery<OfficeSubsidyRecord[]>({
    queryKey: [`/api/offices/${officeId}/subsidy-records`],
    enabled: !!officeId,
  });

  const { data: subsidyPrograms = [] } = useQuery<SubsidyProgram[]>({
    queryKey: ["/api/subsidy-programs"],
  });

  const { data: auditLogs = [], isLoading: auditLogsLoading } = useQuery<AuditLog[]>({
    queryKey: [`/api/audit-logs/office/${officeId}`],
    enabled: !!officeId,
  });

  const { data: swotData, isLoading: swotLoading } = useQuery<SwotAnalysis | null>({
    queryKey: [`/api/offices/${officeId}/swot`],
    enabled: !!officeId,
  });

  // Reset swotLocal whenever officeId changes (prevents stale data leaking between offices)
  useEffect(() => {
    setSwotLocal(null);
  }, [officeId]);

  // Sync swotLocal from server data when it loads or changes
  useEffect(() => {
    if (swotData) {
      setSwotLocal({
        strengths: (swotData.strengths as string[]) || [],
        weaknesses: (swotData.weaknesses as string[]) || [],
        opportunities: (swotData.opportunities as string[]) || [],
        threats: (swotData.threats as string[]) || [],
        soStrategies: (swotData.soStrategies as string[]) || [],
        woStrategies: (swotData.woStrategies as string[]) || [],
        stStrategies: (swotData.stStrategies as string[]) || [],
        wtStrategies: (swotData.wtStrategies as string[]) || [],
      });
    } else if (swotData === null) {
      setSwotLocal(null);
    }
  }, [swotData]);

  const generateSwotMutation = useMutation({
    mutationFn: () => apiRequest(`/api/offices/${officeId}/swot/generate`, "POST"),
    onSuccess: (data: SwotAnalysis) => {
      queryClient.setQueryData([`/api/offices/${officeId}/swot`], data);
      toast({ title: "SWOT分析を生成しました" });
    },
    onError: () => {
      toast({ title: "SWOT分析の生成に失敗しました", variant: "destructive" });
    },
  });

  const generateCrossSwotMutation = useMutation({
    mutationFn: () => apiRequest(`/api/offices/${officeId}/swot/cross`, "POST"),
    onSuccess: (data: SwotAnalysis) => {
      queryClient.setQueryData([`/api/offices/${officeId}/swot`], data);
      toast({ title: "クロスSWOT戦略を生成しました" });
    },
    onError: () => {
      toast({ title: "クロスSWOT生成に失敗しました", variant: "destructive" });
    },
  });

  const [augmentingCrossField, setAugmentingCrossField] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const augmentCrossFieldMutation = useMutation({
    mutationFn: (field: string) => apiRequest(`/api/offices/${officeId}/swot/augment-cross`, "POST", { field }),
    onSuccess: (data: { swot: SwotAnalysis; added: string[]; field: string }) => {
      queryClient.setQueryData([`/api/offices/${officeId}/swot`], data.swot);
      setAugmentingCrossField(null);
      if (data.added.length > 0) {
        toast({ title: `${data.added.length}件の戦略をAIが追加しました` });
      } else {
        toast({ title: "新たな戦略の追加はありませんでした", description: "既存の戦略が十分に網羅されています" });
      }
    },
    onError: () => {
      setAugmentingCrossField(null);
      toast({ title: "AIによる追加に失敗しました", variant: "destructive" });
    },
  });

  const augmentSwotMutation = useMutation({
    mutationFn: () => apiRequest(`/api/offices/${officeId}/swot/augment`, "POST"),
    onSuccess: (data: { swot: SwotAnalysis; added: Record<string, string[]>; totalAdded: number }) => {
      queryClient.setQueryData([`/api/offices/${officeId}/swot`], data.swot);
      if (data.totalAdded > 0) {
        toast({ title: `${data.totalAdded}件の新しい項目をAIが追加しました` });
      } else {
        toast({ title: "新たな追加項目はありませんでした", description: "既存の分析が十分に網羅されています" });
      }
    },
    onError: () => {
      toast({ title: "AI追加に失敗しました", variant: "destructive" });
    },
  });

  const saveSwotMutation = useMutation({
    mutationFn: (data: typeof swotLocal) => apiRequest(`/api/offices/${officeId}/swot`, "PUT", data),
    onSuccess: (data: SwotAnalysis) => {
      queryClient.setQueryData([`/api/offices/${officeId}/swot`], data);
      toast({ title: "SWOT分析を保存しました" });
    },
    onError: () => {
      toast({ title: "保存に失敗しました", variant: "destructive" });
    },
  });

  const subsidyForm = useForm<InsertOfficeSubsidyRecord>({
    resolver: zodResolver(insertOfficeSubsidyRecordSchema),
    defaultValues: {
      officeId: officeId || "",
      programId: "",
      status: "検討中",
      deadlineDate: "",
      notes: "",
    },
  });

  // Update officeId when it changes
  useEffect(() => {
    if (officeId && !editingSubsidy) {
      subsidyForm.setValue("officeId", officeId);
    }
  }, [officeId, subsidyForm, editingSubsidy]);

  const deletePersonMutation = useMutation({
    mutationFn: (personId: string) => apiRequest(`/api/persons/${personId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/offices/${officeId}/persons`] });
      toast({
        title: "削除しました",
        description: "個人情報を削除しました",
      });
      setDeletePersonId(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "削除に失敗しました",
      });
    },
  });

  const deleteKarteMutation = useMutation({
    mutationFn: (karteId: string) => apiRequest(`/api/kartes/${karteId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/offices/${officeId}/kartes`] });
      toast({
        title: "削除しました",
        description: "経営カルテを削除しました",
      });
      setDeleteKarteId(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "削除に失敗しました",
      });
    },
  });

  const createSubsidyRecordMutation = useMutation({
    mutationFn: (data: InsertOfficeSubsidyRecord) => apiRequest("/api/subsidy-records", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/offices/${officeId}/subsidy-records`] });
      queryClient.invalidateQueries({ queryKey: ["/api/subsidy-programs"] });
      toast({ title: "補助金を登録しました" });
      setSubsidyDialogOpen(false);
      setEditingSubsidy(null);
      subsidyForm.reset();
    },
    onError: () => {
      toast({ title: "登録に失敗しました", variant: "destructive" });
    },
  });

  const updateSubsidyRecordMutation = useMutation({
    mutationFn: (data: { id: string; record: Partial<InsertOfficeSubsidyRecord> }) =>
      apiRequest(`/api/subsidy-records/${data.id}`, "PATCH", data.record),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/offices/${officeId}/subsidy-records`] });
      queryClient.invalidateQueries({ queryKey: ["/api/subsidy-programs"] });
      toast({ title: "補助金情報を更新しました" });
      setSubsidyDialogOpen(false);
      setEditingSubsidy(null);
      subsidyForm.reset();
    },
    onError: () => {
      toast({ title: "更新に失敗しました", variant: "destructive" });
    },
  });

  const deleteSubsidyRecordMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/subsidy-records/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/offices/${officeId}/subsidy-records`] });
      toast({
        title: "削除しました",
        description: "補助金情報を削除しました",
      });
      setDeleteSubsidyId(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "削除に失敗しました",
      });
    },
  });

  const onSubsidySubmit = (data: InsertOfficeSubsidyRecord) => {
    // Validate officeId is available
    if (!officeId) {
      toast({
        title: "エラー",
        description: "事業所情報が取得できません",
        variant: "destructive",
      });
      return;
    }
    // Ensure we always use the current officeId
    const safeData = { ...data, officeId };
    if (editingSubsidy) {
      // Exclude read-only fields from PATCH request
      const { officeId: _, ...updateFields } = safeData;
      updateSubsidyRecordMutation.mutate({ id: editingSubsidy.id, record: updateFields });
    } else {
      createSubsidyRecordMutation.mutate(safeData);
    }
  };

  const handleEditSubsidy = (subsidy: OfficeSubsidyRecord) => {
    setEditingSubsidy(subsidy);
    subsidyForm.reset({
      officeId: subsidy.officeId,
      programId: subsidy.programId,
      status: subsidy.status || "検討中",
      deadlineDate: subsidy.deadlineDate || "",
      notes: subsidy.notes || "",
    });
    setSubsidyDialogOpen(true);
  };

  const handleSubsidyDialogClose = (open: boolean) => {
    setSubsidyDialogOpen(open);
    if (!open) {
      setEditingSubsidy(null);
      subsidyForm.reset();
    }
  };

  if (officeLoading) {
    return <div className="flex items-center justify-center h-full">読み込み中...</div>;
  }

  if (!office) {
    return <div className="flex items-center justify-center h-full">事業所が見つかりません</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-office-name">{office.name}</h1>
          <p className="text-sm text-muted-foreground">{office.code}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild data-testid="button-financials">
            <Link href={`/office/${officeId}/financials`}>
              <TrendingUp className="h-4 w-4 mr-2" />
              財務情報
            </Link>
          </Button>
          <Button variant="outline" asChild data-testid="button-edit-office">
            <Link href={`/office/${officeId}`}>
              <Edit className="h-4 w-4 mr-2" />
              編集
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              基本情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">事業所コード</p>
                <p className="font-medium" data-testid="text-office-code">{office.code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">事業所名</p>
                <p className="font-medium">{office.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">代表者名</p>
                <p className="font-medium">{office.representativeName || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">企業形態</p>
                <p className="font-medium">{office.companyType || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">業種（日本標準産業分類）</p>
                <p className="font-medium">
                  {office.industryCategoryMajor
                    ? getIndustryLabel(office.industryCategoryMajor, office.industryCategoryMiddle, office.industryCategoryMinor)
                    : office.industry || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">従業員数</p>
                <p className="font-medium">{office.employees ? `${office.employees}名` : "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>連絡先</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">電話番号</p>
                <p className="font-medium">{office.phone1 || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">FAX</p>
                <p className="font-medium">{office.fax || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">メールアドレス</p>
                <p className="font-medium">{office.email1 || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">住所</p>
                <p className="font-medium">{office.address || "-"}</p>
              </div>
              {office.notes && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">備考</p>
                  <p className="font-medium whitespace-pre-wrap">{office.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                個人情報
              </CardTitle>
              <CardDescription>事業所に紐づく個人情報の一覧</CardDescription>
            </div>
            <Button asChild data-testid="button-add-person">
              <Link href={`/office/${officeId}/person/new`}>
                <UserPlus className="h-4 w-4 mr-2" />
                個人追加
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {personsLoading ? (
            <div className="text-center py-4 text-muted-foreground">読み込み中...</div>
          ) : persons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              個人情報が登録されていません
            </div>
          ) : (
            <div className="space-y-2">
              {persons.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-4 border rounded-md hover-elevate"
                  data-testid={`person-${person.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium" data-testid={`person-name-${person.id}`}>{person.name}</p>
                      {person.personCategory && (
                        <Badge variant="secondary">{person.personCategory}</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1 mt-1">
                      {person.phone && <p>TEL: {person.phone}</p>}
                      {person.email1 && <p>Email: {person.email1}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      data-testid={`button-edit-person-${person.id}`}
                    >
                      <Link href={`/office/${officeId}/person/${person.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletePersonId(person.id)}
                      data-testid={`button-delete-person-${person.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                経営カルテ
              </CardTitle>
              <CardDescription>支援履歴の記録</CardDescription>
            </div>
            <Button asChild data-testid="button-add-karte">
              <Link href={`/office/${officeId}/karte/new`}>
                <Plus className="h-4 w-4 mr-2" />
                カルテ作成
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {kartesLoading ? (
            <div className="text-center py-4 text-muted-foreground">読み込み中...</div>
          ) : kartes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              経営カルテが登録されていません
            </div>
          ) : (
            <div className="space-y-2">
              {kartes.map((karte) => (
                <div
                  key={karte.id}
                  className="flex items-start justify-between p-4 border rounded-md hover-elevate"
                  data-testid={`karte-${karte.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium" data-testid={`karte-title-${karte.id}`}>{karte.title}</p>
                      <Badge variant="outline">{karte.visitDate}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{karte.content}</p>
                    {karte.nextAction && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <span className="font-medium">次回: </span>
                        {karte.nextAction}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      data-testid={`button-edit-karte-${karte.id}`}
                    >
                      <Link href={`/office/${officeId}/karte/${karte.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteKarteId(karte.id)}
                      data-testid={`button-delete-karte-${karte.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="swot" className="w-full" data-testid="tabs-office-details">
        <TabsList data-testid="tabs-list-office-details">
          <TabsTrigger value="swot" data-testid="tab-swot">
            <Brain className="h-4 w-4 mr-2" />
            SWOT分析
          </TabsTrigger>
          <TabsTrigger value="subsidy" data-testid="tab-subsidy">
            <BookOpen className="h-4 w-4 mr-2" />
            補助金管理
          </TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit">
            <History className="h-4 w-4 mr-2" />
            変更履歴
          </TabsTrigger>
        </TabsList>

        <TabsContent value="swot" data-testid="tab-content-swot">
          {(() => {
            const swot = swotLocal;
            const hasSWOT = swot && (swot.strengths.length > 0 || swot.weaknesses.length > 0 || swot.opportunities.length > 0 || swot.threats.length > 0);
            const hasCross = swot && (swot.soStrategies.length > 0 || swot.woStrategies.length > 0 || swot.stStrategies.length > 0 || swot.wtStrategies.length > 0);

            const updateList = (field: keyof NonNullable<typeof swotLocal>, idx: number, value: string) => {
              setSwotLocal(prev => {
                if (!prev) return prev;
                const arr = [...(prev[field] as string[])];
                arr[idx] = value;
                return { ...prev, [field]: arr };
              });
            };

            const removeItem = (field: keyof NonNullable<typeof swotLocal>, idx: number) => {
              setSwotLocal(prev => {
                if (!prev) return prev;
                const arr = [...(prev[field] as string[])];
                arr.splice(idx, 1);
                return { ...prev, [field]: arr };
              });
            };

            const addItem = (field: keyof NonNullable<typeof swotLocal>) => {
              setSwotLocal(prev => {
                if (!prev) return { strengths: [], weaknesses: [], opportunities: [], threats: [], soStrategies: [], woStrategies: [], stStrategies: [], wtStrategies: [], [field]: [''] };
                return { ...prev, [field]: [...(prev[field] as string[]), ''] };
              });
            };

            const SwotCell = ({ label, field, color }: { label: string; field: keyof NonNullable<typeof swotLocal>; color: string }) => (
              <div className="p-4 border rounded-md space-y-2 flex-1 min-h-[160px]">
                <p className={`font-semibold text-sm ${color}`}>{label}</p>
                {swot ? (
                  <div className="space-y-1">
                    {(swot[field] as string[]).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <Input
                          value={item}
                          onChange={e => updateList(field, idx, e.target.value)}
                          className="h-7 text-sm"
                          placeholder="項目を入力"
                          data-testid={`swot-input-${String(field)}-${idx}`}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          onClick={() => removeItem(field, idx)}
                          data-testid={`swot-remove-${String(field)}-${idx}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs w-full"
                      onClick={() => addItem(field)}
                      data-testid={`swot-add-${String(field)}`}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      追加
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">SWOT分析を生成してください</p>
                )}
              </div>
            );

            const CrossCell = ({ label, field, bgClass }: { label: string; field: keyof NonNullable<typeof swotLocal>; bgClass: string }) => {
              const isCellAiLoading = augmentingCrossField === String(field) && augmentCrossFieldMutation.isPending;
              const handleAiAdd = () => {
                setAugmentingCrossField(String(field));
                augmentCrossFieldMutation.mutate(String(field));
              };
              return (
                <div className={`p-3 border rounded-md space-y-2 ${bgClass}`}>
                  <p className="font-semibold text-sm">{label}</p>
                  {swot ? (
                    <div className="space-y-1">
                      {(swot[field] as string[]).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <Input
                            value={item}
                            onChange={e => updateList(field, idx, e.target.value)}
                            className="h-7 text-xs bg-background"
                            placeholder="戦略を入力"
                            data-testid={`cross-input-${String(field)}-${idx}`}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0"
                            onClick={() => removeItem(field, idx)}
                            data-testid={`cross-remove-${String(field)}-${idx}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-1 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={() => addItem(field)}
                          data-testid={`cross-add-${String(field)}`}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          追加
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={handleAiAdd}
                          disabled={isCellAiLoading || augmentCrossFieldMutation.isPending}
                          data-testid={`cross-ai-add-${String(field)}`}
                        >
                          {isCellAiLoading ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3 mr-1" />
                          )}
                          AIで追加
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">-</p>
                  )}
                </div>
              );
            }

            const emptySwot = { strengths: [], weaknesses: [], opportunities: [], threats: [], soStrategies: [], woStrategies: [], stStrategies: [], wtStrategies: [] };

            return (
              <div className="space-y-4">
                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={() => generateSwotMutation.mutate()}
                    disabled={generateSwotMutation.isPending}
                    data-testid="button-generate-swot"
                  >
                    {generateSwotMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4 mr-2" />
                    )}
                    SWOT分析を生成
                  </Button>
                  {!swot && !swotLoading && (
                    <Button
                      variant="outline"
                      onClick={() => setSwotLocal(emptySwot)}
                      data-testid="button-create-swot-manual"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      手入力で作成
                    </Button>
                  )}
                  {swotData && (
                    <Button
                      variant="outline"
                      onClick={() => augmentSwotMutation.mutate()}
                      disabled={augmentSwotMutation.isPending}
                      data-testid="button-augment-swot"
                    >
                      {augmentSwotMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      AIで項目を追加
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => generateCrossSwotMutation.mutate()}
                    disabled={!swotData || generateCrossSwotMutation.isPending}
                    data-testid="button-generate-cross-swot"
                  >
                    {generateCrossSwotMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4 mr-2" />
                    )}
                    クロスSWOT生成
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => swot && saveSwotMutation.mutate(swot)}
                    disabled={!swot || saveSwotMutation.isPending}
                    data-testid="button-save-swot"
                  >
                    {saveSwotMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    保存
                  </Button>
                  {swot && (
                    <Button
                      variant="outline"
                      onClick={async () => {
                        if (!swot || !office) return;
                        setPdfGenerating(true);
                        try {
                          const industryLabel = office.industryCategoryMajor
                            ? getIndustryLabel(office.industryCategoryMajor, office.industryCategoryMiddle ?? undefined, office.industryCategoryMinor ?? undefined)
                            : undefined;
                          await generateSwotPdf({
                            officeName: office.name,
                            industry: industryLabel ?? undefined,
                            address: office.address ?? undefined,
                            strengths: swot.strengths,
                            weaknesses: swot.weaknesses,
                            opportunities: swot.opportunities,
                            threats: swot.threats,
                            soStrategies: swot.soStrategies,
                            woStrategies: swot.woStrategies,
                            stStrategies: swot.stStrategies,
                            wtStrategies: swot.wtStrategies,
                          });
                        } catch (e) {
                          toast({ title: "PDFの生成に失敗しました", variant: "destructive" });
                        } finally {
                          setPdfGenerating(false);
                        }
                      }}
                      disabled={pdfGenerating}
                      data-testid="button-swot-pdf"
                    >
                      {pdfGenerating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileDown className="h-4 w-4 mr-2" />
                      )}
                      PDFレポート
                    </Button>
                  )}
                </div>

                {swotLoading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    読み込み中...
                  </div>
                ) : (
                  <>
                    {/* SWOT 2x2 Grid */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">SWOT分析</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          <SwotCell label="強み (Strengths)" field="strengths" color="text-blue-600 dark:text-blue-400" />
                          <SwotCell label="弱み (Weaknesses)" field="weaknesses" color="text-orange-600 dark:text-orange-400" />
                          <SwotCell label="機会 (Opportunities)" field="opportunities" color="text-green-600 dark:text-green-400" />
                          <SwotCell label="脅威 (Threats)" field="threats" color="text-red-600 dark:text-red-400" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Cross SWOT 3x3 Matrix */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <CardTitle className="text-base">クロスSWOT分析</CardTitle>
                          {!hasCross && (
                            <p className="text-xs text-muted-foreground">
                              {hasSWOT ? "各セルに手動で戦略を追加するか、「クロスSWOT生成」でAIが作成します" : "先にSWOT分析を作成してください"}
                            </p>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <div className="grid" style={{ gridTemplateColumns: '130px 1fr 1fr', gridTemplateRows: 'auto 1fr 1fr', gap: '8px', minWidth: '480px' }}>
                            {/* Row 0: header */}
                            <div /> {/* empty top-left */}
                            <div className="text-center text-sm font-semibold text-blue-600 dark:text-blue-400 py-2 border rounded-md bg-blue-50 dark:bg-blue-950/30">強み (S)</div>
                            <div className="text-center text-sm font-semibold text-orange-600 dark:text-orange-400 py-2 border rounded-md bg-orange-50 dark:bg-orange-950/30">弱み (W)</div>

                            {/* Row 1: Opportunities */}
                            <div className="text-center text-sm font-semibold text-green-600 dark:text-green-400 py-2 px-1 border rounded-md bg-green-50 dark:bg-green-950/30 flex items-center justify-center">機会 (O)</div>
                            <CrossCell
                              label="積極戦略 (SO)"
                              field="soStrategies"
                              bgClass="bg-blue-50/50 dark:bg-blue-950/20"
                            />
                            <CrossCell
                              label="改善戦略 (WO)"
                              field="woStrategies"
                              bgClass="bg-green-50/50 dark:bg-green-950/20"
                            />

                            {/* Row 2: Threats */}
                            <div className="text-center text-sm font-semibold text-red-600 dark:text-red-400 py-2 px-1 border rounded-md bg-red-50 dark:bg-red-950/30 flex items-center justify-center">脅威 (T)</div>
                            <CrossCell
                              label="差別化戦略 (ST)"
                              field="stStrategies"
                              bgClass="bg-orange-50/50 dark:bg-orange-950/20"
                            />
                            <CrossCell
                              label="致命傷回避 (WT)"
                              field="wtStrategies"
                              bgClass="bg-red-50/50 dark:bg-red-950/20"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="subsidy" data-testid="tab-content-subsidy">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    補助金管理
                  </CardTitle>
                  <CardDescription>申請中・検討中の補助金情報</CardDescription>
                </div>
                <Button onClick={() => setSubsidyDialogOpen(true)} data-testid="button-add-subsidy">
                  <Plus className="h-4 w-4 mr-2" />
                  補助金追加
                </Button>
              </div>
            </CardHeader>
        <CardContent>
          {subsidyRecordsLoading ? (
            <div className="text-center py-4 text-muted-foreground">読み込み中...</div>
          ) : subsidyRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              補助金情報が登録されていません
            </div>
          ) : (
            <div className="space-y-2">
              {subsidyRecords.map((record) => {
                const program = subsidyPrograms.find(p => p.id === record.programId);
                return (
                  <div
                    key={record.id}
                    className="flex items-start justify-between p-4 border rounded-md hover-elevate"
                    data-testid={`subsidy-record-${record.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium" data-testid={`subsidy-name-${record.id}`}>
                          {program?.name || "不明な補助金"}
                        </p>
                        <Badge variant="outline" data-testid={`subsidy-status-${record.id}`}>
                          {record.status}
                        </Badge>
                      </div>
                      {record.deadlineDate && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          期限: {record.deadlineDate}
                        </p>
                      )}
                      {record.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{record.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSubsidy(record)}
                        data-testid={`button-edit-subsidy-${record.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteSubsidyId(record.id)}
                        data-testid={`button-delete-subsidy-${record.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" data-testid="tab-content-audit">
          <Card data-testid="card-audit-history">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                変更履歴
              </CardTitle>
              <CardDescription>事業所情報の変更履歴</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogsLoading ? (
                <div className="text-center py-4 text-muted-foreground" data-testid="audit-loading">読み込み中...</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="audit-empty">
                  変更履歴はありません
                </div>
              ) : (
                <div className="space-y-4" data-testid="audit-timeline">
                  {auditLogs.map((log) => {
                    // Safely format field changes
                    const formatValue = (value: any): string => {
                      if (value === undefined || value === null) return '(空)';
                      if (typeof value === 'object') {
                        try {
                          return JSON.stringify(value, null, 2);
                        } catch {
                          return String(value);
                        }
                      }
                      return String(value);
                    };

                    return (
                      <div key={log.id} className="relative pl-6 pb-4 last:pb-0 border-l-2 border-border" data-testid={`audit-log-${log.id}`}>
                        <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-primary" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" data-testid={`audit-operation-${log.id}`}>
                              {log.operation}
                            </Badge>
                            <span className="text-xs text-muted-foreground" data-testid={`audit-timestamp-${log.id}`}>
                              {log.createdAt ? new Date(log.createdAt).toLocaleString('ja-JP') : ''}
                            </span>
                          </div>
                          {log.fieldChanges && typeof log.fieldChanges === 'object' && Object.keys(log.fieldChanges as object).length > 0 ? (
                            <div className="text-sm space-y-1 mt-2" data-testid={`audit-changes-${log.id}`}>
                              {Object.entries(log.fieldChanges as Record<string, { from: any; to: any }>).map(([field, change]) => (
                                <div key={field} className="text-muted-foreground break-words">
                                  <span className="font-medium">{field}</span>: 
                                  <span className="ml-1">
                                    {formatValue(change.from)}
                                  </span>
                                  <span className="mx-1">→</span>
                                  <span className="text-foreground">{formatValue(change.to)}</span>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          {log.userId && (
                            <p className="text-xs text-muted-foreground" data-testid={`audit-user-${log.id}`}>変更者: {log.userId}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={subsidyDialogOpen} onOpenChange={handleSubsidyDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubsidy ? "補助金情報編集" : "補助金追加"}</DialogTitle>
            <DialogDescription>
              事業所が申請・検討中の補助金情報を管理します
            </DialogDescription>
          </DialogHeader>
          <Form {...subsidyForm}>
            <form onSubmit={subsidyForm.handleSubmit(onSubsidySubmit)} className="space-y-4">
              <FormField
                control={subsidyForm.control}
                name="programId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>補助金制度 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-subsidy-program">
                          <SelectValue placeholder="補助金制度を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subsidyPrograms.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={subsidyForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>状態 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-subsidy-status">
                          <SelectValue placeholder="状態を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="検討中">検討中</SelectItem>
                        <SelectItem value="申請準備中">申請準備中</SelectItem>
                        <SelectItem value="申請済">申請済</SelectItem>
                        <SelectItem value="採択">採択</SelectItem>
                        <SelectItem value="不採択">不採択</SelectItem>
                        <SelectItem value="辞退">辞退</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={subsidyForm.control}
                name="deadlineDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>申請期限</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} type="date" data-testid="input-deadline-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={subsidyForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>備考</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} placeholder="補足情報" rows={3} data-testid="textarea-subsidy-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => handleSubsidyDialogClose(false)} data-testid="button-subsidy-cancel">
                  キャンセル
                </Button>
                <Button type="submit" disabled={createSubsidyRecordMutation.isPending || updateSubsidyRecordMutation.isPending} data-testid="button-subsidy-save">
                  {editingSubsidy ? "更新" : "登録"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteSubsidyId} onOpenChange={(open) => !open && setDeleteSubsidyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>補助金情報を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。補助金情報を完全に削除します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-subsidy">キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSubsidyId && deleteSubsidyRecordMutation.mutate(deleteSubsidyId)}
              data-testid="button-confirm-delete-subsidy"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletePersonId} onOpenChange={(open) => !open && setDeletePersonId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>個人情報を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。個人情報を完全に削除します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-person">キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePersonId && deletePersonMutation.mutate(deletePersonId)}
              data-testid="button-confirm-delete-person"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteKarteId} onOpenChange={(open) => !open && setDeleteKarteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>経営カルテを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。経営カルテを完全に削除します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-karte">キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteKarteId && deleteKarteMutation.mutate(deleteKarteId)}
              data-testid="button-confirm-delete-karte"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
