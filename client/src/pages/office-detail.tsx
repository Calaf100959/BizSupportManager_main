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
import { Building2, Edit, Trash2, UserPlus, User, FileText, Plus, BookOpen, Calendar, History } from "lucide-react";
import { type Office, type Person, type Karte, type OfficeSubsidyRecord, type SubsidyProgram, insertOfficeSubsidyRecordSchema, type InsertOfficeSubsidyRecord, type AuditLog } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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
    // Ensure we always use the current officeId
    const safeData = { ...data, officeId: officeId || "" };
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
              <div>
                <p className="text-sm text-muted-foreground">業種</p>
                <p className="font-medium">{office.industry || "-"}</p>
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

      <Tabs defaultValue="subsidy" className="w-full" data-testid="tabs-office-details">
        <TabsList data-testid="tabs-list-office-details">
          <TabsTrigger value="subsidy" data-testid="tab-subsidy">
            <BookOpen className="h-4 w-4 mr-2" />
            補助金管理
          </TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit">
            <History className="h-4 w-4 mr-2" />
            変更履歴
          </TabsTrigger>
        </TabsList>

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
                          {log.fieldChanges && typeof log.fieldChanges === 'object' && Object.keys(log.fieldChanges as object).length > 0 && (
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
                          )}
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
