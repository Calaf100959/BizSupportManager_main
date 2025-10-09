import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { insertKarteSchema, type InsertKarte, type Karte } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

export default function KarteFormPage() {
  const { officeId, karteId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isEditing = !!karteId;

  const { data: karte } = useQuery<Karte>({
    queryKey: [`/api/kartes/${karteId}`],
    enabled: isEditing,
  });

  const form = useForm<InsertKarte>({
    resolver: zodResolver(insertKarteSchema),
    defaultValues: {
      officeId: officeId || "",
      visitDate: "",
      title: "",
      content: "",
      nextAction: "",
      createdBy: "",
    },
  });

  useEffect(() => {
    if (karte && isEditing) {
      form.reset(karte);
    }
  }, [karte, isEditing, form]);

  const createMutation = useMutation({
    mutationFn: (data: InsertKarte) => apiRequest("/api/kartes", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/offices/${officeId}/kartes`] });
      toast({
        title: "登録しました",
        description: "経営カルテを登録しました",
      });
      setLocation(`/office/${officeId}/detail`);
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
    mutationFn: (data: InsertKarte) => apiRequest(`/api/kartes/${karteId}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/offices/${officeId}/kartes`] });
      toast({
        title: "更新しました",
        description: "経営カルテを更新しました",
      });
      setLocation(`/office/${officeId}/detail`);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "更新に失敗しました",
      });
    },
  });

  const onSubmit = (data: InsertKarte) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate({ ...data, officeId: officeId || "" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(`/office/${officeId}/detail`)}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          {isEditing ? "経営カルテ編集" : "経営カルテ作成"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="visitDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>訪問日 *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-visit-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>タイトル *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="例：経営課題ヒアリング" data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>支援内容 *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="支援内容を詳しく記載してください"
                        className="min-h-32"
                        data-testid="textarea-content"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextAction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>次回アクション</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="次回の支援内容や確認事項"
                        data-testid="textarea-next-action"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation(`/office/${officeId}/detail`)}
              data-testid="button-cancel"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-submit"
            >
              {createMutation.isPending || updateMutation.isPending ? "処理中..." : isEditing ? "更新" : "登録"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
