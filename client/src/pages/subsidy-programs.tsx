import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, BookOpen, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { insertSubsidyProgramSchema, type SubsidyProgram, type InsertSubsidyProgram } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SubsidyProgramsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<SubsidyProgram | null>(null);
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
      url: "",
      notes: "",
    },
  });

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
    if (editingProgram) {
      updateMutation.mutate({ id: editingProgram.id, program: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (program: SubsidyProgram) => {
    setEditingProgram(program);
    form.reset({
      name: program.name,
      description: program.description || "",
      category: program.category || "",
      provider: program.provider || "",
      url: program.url || "",
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

      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">読み込み中...</div>
          </CardContent>
        </Card>
      ) : programs.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              補助金制度が登録されていません
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <Card key={program.id} className="hover-elevate" data-testid={`program-card-${program.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg">{program.name}</CardTitle>
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
                <div className="flex items-center gap-2 pt-2">
                  {program.url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={program.url} target="_blank" rel="noopener noreferrer" data-testid={`link-program-${program.id}`}>
                        <ExternalLink className="h-3 w-3 mr-1" />
                        詳細
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleEdit(program)} data-testid={`button-edit-${program.id}`}>
                    <Pencil className="h-3 w-3 mr-1" />
                    編集
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(program.id)} data-testid={`button-delete-${program.id}`}>
                    <Trash2 className="h-3 w-3 mr-1" />
                    削除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
