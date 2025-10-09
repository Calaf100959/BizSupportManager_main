import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertWorklogSchema, type InsertWorklog, type Worklog } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Clock, Save, Edit, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function WorklogPage() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingWorklog, setEditingWorklog] = useState<Worklog | null>(null);
  const [deleteWorklogId, setDeleteWorklogId] = useState<string | null>(null);

  const { data: worklogs = [], isLoading } = useQuery<Worklog[]>({
    queryKey: [`/api/worklogs?date=${selectedDate}`],
  });

  const form = useForm<InsertWorklog>({
    resolver: zodResolver(insertWorklogSchema),
    defaultValues: {
      date: selectedDate,
      time: "",
      duration: "",
      activity: "",
      detail: "",
      relatedOffice: "",
      createdBy: "",
    },
  });

  useEffect(() => {
    if (editingWorklog) {
      form.reset(editingWorklog);
    }
  }, [editingWorklog, form]);

  const createMutation = useMutation({
    mutationFn: (data: InsertWorklog) => apiRequest<Worklog>("/api/worklogs", "POST", data),
    onSuccess: (log: Worklog) => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/worklogs?date=${log.date}`]
      });
      if (log.date !== selectedDate) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/worklogs?date=${selectedDate}`]
        });
      }
      toast({
        title: "登録しました",
        description: "業務日誌を登録しました",
      });
      form.reset({
        date: selectedDate,
        time: "",
        duration: "",
        activity: "",
        detail: "",
        relatedOffice: "",
        createdBy: "",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "登録に失敗しました",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, originalDate }: { id: string; data: InsertWorklog; originalDate: string }) => {
      const updatedLog = await apiRequest<Worklog>(`/api/worklogs/${id}`, "PATCH", data);
      return { updatedLog, originalDate };
    },
    onSuccess: ({ updatedLog, originalDate }: { updatedLog: Worklog; originalDate: string }) => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/worklogs?date=${updatedLog.date}`]
      });
      if (updatedLog.date !== originalDate) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/worklogs?date=${originalDate}`]
        });
      }
      if (updatedLog.date !== selectedDate && originalDate !== selectedDate) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/worklogs?date=${selectedDate}`]
        });
      }
      toast({
        title: "更新しました",
        description: "業務日誌を更新しました",
      });
      setEditingWorklog(null);
      form.reset({
        date: selectedDate,
        time: "",
        duration: "",
        activity: "",
        detail: "",
        relatedOffice: "",
        createdBy: "",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "更新に失敗しました",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, worklogDate }: { id: string; worklogDate: string }) => {
      await apiRequest(`/api/worklogs/${id}`, "DELETE");
      return { worklogDate };
    },
    onSuccess: ({ worklogDate }) => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/worklogs?date=${worklogDate}`]
      });
      if (worklogDate !== selectedDate) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/worklogs?date=${selectedDate}`]
        });
      }
      toast({
        title: "削除しました",
        description: "業務日誌を削除しました",
      });
      setDeleteWorklogId(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "削除に失敗しました",
      });
    },
  });

  const onSubmit = (data: InsertWorklog) => {
    if (editingWorklog && editingWorklog.id) {
      updateMutation.mutate({ id: editingWorklog.id, data, originalDate: editingWorklog.date });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    setEditingWorklog(null);
    form.reset({
      date: selectedDate,
      time: "",
      duration: "",
      activity: "",
      detail: "",
      relatedOffice: "",
      createdBy: "",
    });
  };

  const handleEdit = (log: Worklog) => {
    setEditingWorklog(log);
    if (log.date !== selectedDate) {
      setSelectedDate(log.date);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">業務日誌</h1>
          <p className="text-sm text-muted-foreground">日々の業務内容を記録します</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="date-filter" className="text-sm text-muted-foreground">表示日付:</label>
          <Input
            id="date-filter"
            type="date"
            value={selectedDate}
            onChange={(e) => {
              const newDate = e.target.value;
              setSelectedDate(newDate);
              if (!editingWorklog) {
                form.setValue('date', newDate);
              }
            }}
            disabled={!!editingWorklog}
            className="w-auto"
            data-testid="input-date-filter"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{editingWorklog ? "業務記録編集" : "業務記録"}</CardTitle>
              <CardDescription>
                {editingWorklog ? "業務内容を編集してください" : "本日の業務内容を入力してください"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>日付 *</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              data-testid="input-log-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>時刻</FormLabel>
                          <FormControl>
                            <Input 
                              type="time" 
                              {...field} 
                              value={field.value || ""}
                              data-testid="input-log-time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>所要時間</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="例：2時間" 
                              {...field} 
                              value={field.value || ""}
                              data-testid="input-log-duration"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="activity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>業務内容 *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="例：株式会社山田商店訪問" 
                            {...field} 
                            data-testid="input-log-activity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="detail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>詳細</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="業務の詳細を記載してください" 
                            className="min-h-24"
                            {...field} 
                            value={field.value || ""}
                            data-testid="textarea-log-detail"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="relatedOffice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>関連事業所</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="事業所名（任意）" 
                            {...field} 
                            value={field.value || ""}
                            data-testid="input-log-office"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-3">
                    {editingWorklog && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleCancel}
                        data-testid="button-cancel"
                      >
                        キャンセル
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {editingWorklog ? "更新" : "保存"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>選択日の記録</CardTitle>
              <CardDescription>{selectedDate}の業務ログ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">読み込み中...</div>
              ) : worklogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  記録がありません
                </div>
              ) : (
                worklogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="border rounded-md p-3 space-y-2"
                    data-testid={`log-entry-${log.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {log.time && (
                          <>
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium">{log.time}</span>
                          </>
                        )}
                      </div>
                      {log.duration && (
                        <Badge variant="secondary" className="text-xs">{log.duration}</Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium">{log.activity}</p>
                    {log.detail && (
                      <p className="text-sm text-muted-foreground">{log.detail}</p>
                    )}
                    {log.relatedOffice && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">関連: </span>
                        {log.relatedOffice}
                      </p>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(log)}
                        data-testid={`button-edit-worklog-${log.id}`}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteWorklogId(log.id)}
                        data-testid={`button-delete-worklog-${log.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={!!deleteWorklogId} onOpenChange={(open) => !open && setDeleteWorklogId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>業務日誌を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。業務日誌を完全に削除します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-worklog">キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteWorklogId) {
                  const worklogToDelete = worklogs.find(log => log.id === deleteWorklogId);
                  if (worklogToDelete) {
                    deleteMutation.mutate({ id: deleteWorklogId, worklogDate: worklogToDelete.date });
                  }
                }
              }}
              data-testid="button-confirm-delete-worklog"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
