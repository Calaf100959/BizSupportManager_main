import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, BookOpen, ExternalLink, Pencil, Trash2, X } from "lucide-react";
import { Link } from "wouter";
import { insertSubsidyProgramSchema, type SubsidyProgram, type InsertSubsidyProgram } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS = ['開始前', '公募中', '事業期間中', '事業終了'] as const;

export default function SubsidyProgramsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<SubsidyProgram | null>(null);
  const [activeStatuses, setActiveStatuses] = useState<Set<string>>(new Set(STATUS_OPTIONS));
  const { toast } = useToast();

  const { data: programs = [], isLoading } = useQuery<SubsidyProgram[]>({
    queryKey: ["/api/subsidy-programs"],
  });

  const form = useForm<InsertSubsidyProgram>({
    resolver: zodResolver(insertSubsidyProgramSchema.omit({ createdBy: true, updatedBy: true })),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      provider: "",
      status: "開始前",
      urls: [],
      notes: "",
    },
  });
  
  const filteredPrograms = useMemo(() => {
    // If no statuses are selected, show all programs
    if (activeStatuses.size === 0) {
      return programs;
    }
    return programs.filter(program => activeStatuses.has(program.status));
  }, [programs, activeStatuses]);
  
  const toggleStatus = (status: string) => {
    setActiveStatuses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };
  
  const selectAllStatuses = () => {
    setActiveStatuses(new Set(STATUS_OPTIONS));
  };
  
  const clearAllStatuses = () => {
    setActiveStatuses(new Set());
  };

  const createMutation = useMutation({
    mutationFn: (data: InsertSubsidyProgram) => apiRequest("/api/subsidy-programs", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subsidy-programs"] });
      toast({ title: "補助金制度を登録しました" });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "登録に失敗しました", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; program: Partial<InsertSubsidyProgram> }) => 
      apiRequest(`/api/subsidy-programs/${data.id}`, "PATCH", data.program),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subsidy-programs"] });
      toast({ title: "補助金制度を更新しました" });
      setDialogOpen(false);
      setEditingProgram(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "更新に失敗しました", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/subsidy-programs/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subsidy-programs"] });
      toast({ title: "補助金制度を削除しました" });
    },
    onError: () => {
      toast({ title: "削除に失敗しました", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertSubsidyProgram) => {
    // Normalize URLs: trim, filter empty, remove duplicates, limit to 5
    const normalizedData = {
      ...data,
      urls: data.urls
        ? Array.from(new Set(
            data.urls
              .map(url => url.trim())
              .filter(url => url.length > 0)
          )).slice(0, 5)
        : undefined,
    };
    
    if (editingProgram) {
      updateMutation.mutate({ id: editingProgram.id, program: normalizedData });
    } else {
      createMutation.mutate(normalizedData);
    }
  };

  const handleEdit = (program: SubsidyProgram) => {
    setEditingProgram(program);
    form.reset({
      name: program.name,
      description: program.description || "",
      category: program.category || "",
      provider: program.provider || "",
      status: program.status,
      urls: program.urls || [],
      notes: program.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("本当に削除しますか？")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingProgram(null);
      form.reset();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">補助金・支援制度マスタ</h1>
          <p className="text-sm text-muted-foreground">補助金や助成金の情報を管理</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-program">
              <Plus className="mr-2 h-4 w-4" />
              新規登録
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingProgram ? "補助金制度編集" : "新規補助金制度登録"}</DialogTitle>
              <DialogDescription>
                補助金・助成金・支援制度の情報を登録します
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>制度名 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="例：ものづくり補助金" data-testid="input-program-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>区分</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="区分を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="補助金">補助金</SelectItem>
                          <SelectItem value="助成金">助成金</SelectItem>
                          <SelectItem value="支援制度">支援制度</SelectItem>
                          <SelectItem value="融資">融資</SelectItem>
                          <SelectItem value="その他">その他</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>提供機関</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="例：中小企業庁" data-testid="input-provider" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ステータス *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="ステータスを選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUS_OPTIONS.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>説明</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="制度の概要" rows={3} data-testid="textarea-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="urls"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL（最大5つ）</FormLabel>
                      <div className="space-y-2">
                        {[0, 1, 2, 3, 4].map(index => {
                          const hasValue = Boolean(field.value?.[index]);
                          return (
                            <div key={index} className="flex gap-2">
                              <FormControl>
                                <Input
                                  type="url"
                                  placeholder={`URL ${index + 1}`}
                                  value={field.value?.[index] || ""}
                                  onChange={(e) => {
                                    const currentUrls = field.value || [];
                                    const newUrls = [...currentUrls];
                                    newUrls[index] = e.target.value;
                                    field.onChange(newUrls);
                                  }}
                                  data-testid={`input-url-${index}`}
                                />
                              </FormControl>
                              {hasValue && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    const newUrls = (field.value || []).filter((_, i) => i !== index);
                                    field.onChange(newUrls);
                                  }}
                                  data-testid={`button-remove-url-${index}`}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>備考</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="その他メモ" rows={2} data-testid="textarea-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => handleDialogClose(false)} data-testid="button-cancel">
                    キャンセル
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save">
                    {editingProgram ? "更新" : "登録"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 items-center" data-testid="status-filter-container">
          <p className="text-sm text-muted-foreground flex items-center">ステータスフィルター:</p>
          {STATUS_OPTIONS.map(status => {
            const isActive = activeStatuses.has(status);
            const count = programs.filter(p => p.status === status).length;
            return (
              <Badge
                key={status}
                variant={isActive ? "default" : "outline"}
                className={`cursor-pointer toggle-elevate ${!isActive ? 'opacity-50' : ''}`}
                onClick={() => toggleStatus(status)}
                data-testid={`badge-status-${status}`}
              >
                {status} ({count})
              </Badge>
            );
          })}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllStatuses}
              disabled={activeStatuses.size === STATUS_OPTIONS.length}
              data-testid="button-select-all-statuses"
            >
              全て選択
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllStatuses}
              disabled={activeStatuses.size === 0}
              data-testid="button-clear-all-statuses"
            >
              クリア
            </Button>
          </div>
        </div>
        {activeStatuses.size === 0 && (
          <p className="text-xs text-muted-foreground" data-testid="text-filter-status">
            フィルターが設定されていないため、すべての補助金制度を表示しています
          </p>
        )}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">読み込み中...</div>
          </CardContent>
        </Card>
      ) : filteredPrograms.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              {programs.length === 0 ? "補助金制度が登録されていません" : "選択されたステータスの補助金制度がありません"}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPrograms.map((program) => (
            <Link href={`/subsidy-program/${program.id}`} data-testid={`link-program-detail-${program.id}`}>
              <Card key={program.id} className="hover-elevate cursor-pointer" data-testid={`program-card-${program.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{program.name}</CardTitle>
                        <Badge variant="outline" className="shrink-0" data-testid={`badge-program-status-${program.id}`}>
                          {program.status}
                        </Badge>
                      </div>
                      {program.category && (
                        <CardDescription className="mt-1">{program.category}</CardDescription>
                      )}
                    </div>
                    <BookOpen className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {program.provider && (
                    <div>
                      <p className="text-xs text-muted-foreground">提供機関</p>
                      <p className="text-sm">{program.provider}</p>
                    </div>
                  )}
                  {program.description && (
                    <div>
                      <p className="text-xs text-muted-foreground">説明</p>
                      <p className="text-sm line-clamp-2">{program.description}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pt-2" onClick={(e) => e.preventDefault()}>
                    {program.urls && program.urls.length > 0 && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={program.urls[0]} target="_blank" rel="noopener noreferrer" data-testid={`link-url-${program.id}`}>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          URL
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={(e) => { e.preventDefault(); handleEdit(program); }} data-testid={`button-edit-${program.id}`}>
                      <Pencil className="h-3 w-3 mr-1" />
                      編集
                    </Button>
                    <Button variant="outline" size="sm" onClick={(e) => { e.preventDefault(); handleDelete(program.id); }} data-testid={`button-delete-${program.id}`}>
                      <Trash2 className="h-3 w-3 mr-1" />
                      削除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
