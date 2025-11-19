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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import karteMasterData from "@shared/data/karte-master.json";

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
      nextVisitDate: "",
      guidanceItem: "",
      guidanceCategory: "",
      guidanceContent: "",
      createdBy: "",
    },
  });

  // Watch guidance selections for cascading
  const selectedGuidanceItem = form.watch("guidanceItem");
  const selectedGuidanceCategory = form.watch("guidanceCategory");

  // Track previous values and hydration state to avoid resetting on form.reset()
  const prevGuidanceItem = useRef<string | null>(null);
  const prevGuidanceCategory = useRef<string | null>(null);
  const isHydrating = useRef(false);

  // Filter guidance categories based on selected item
  const availableCategories = useMemo(() => {
    if (!selectedGuidanceItem) return [];
    return karteMasterData.guidanceCategories.filter(
      (cat) => cat.itemCode === selectedGuidanceItem
    );
  }, [selectedGuidanceItem]);

  // Filter guidance contents based on selected item and category
  const availableContents = useMemo(() => {
    if (!selectedGuidanceItem || !selectedGuidanceCategory) return [];
    return karteMasterData.guidanceContents.filter(
      (content) =>
        content.itemCode === selectedGuidanceItem &&
        content.categoryCode === selectedGuidanceCategory
    );
  }, [selectedGuidanceItem, selectedGuidanceCategory]);

  // Reset dependent fields only when parent selection actually changes (not during form.reset)
  useEffect(() => {
    if (!isHydrating.current && prevGuidanceItem.current !== null && prevGuidanceItem.current !== selectedGuidanceItem) {
      form.setValue("guidanceCategory", "");
      form.setValue("guidanceContent", "");
    }
    prevGuidanceItem.current = selectedGuidanceItem || null;
  }, [selectedGuidanceItem, form]);

  useEffect(() => {
    if (!isHydrating.current && prevGuidanceCategory.current !== null && prevGuidanceCategory.current !== selectedGuidanceCategory) {
      form.setValue("guidanceContent", "");
    }
    prevGuidanceCategory.current = selectedGuidanceCategory || null;
  }, [selectedGuidanceCategory, form]);

  useEffect(() => {
    if (karte && isEditing) {
      isHydrating.current = true;
      form.reset(karte);
      // Use setTimeout to ensure the reset completes before clearing the flag
      setTimeout(() => {
        isHydrating.current = false;
      }, 0);
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

              <FormField
                control={form.control}
                name="nextVisitDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>次回訪問予定日</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        type="date"
                        data-testid="input-next-visit-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>指導分類</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="guidanceItem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>指導事項</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-guidance-item">
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {karteMasterData.guidanceItems.map((item) => (
                          <SelectItem key={item.code} value={item.code}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guidanceCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>指導内容区分</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                      disabled={!selectedGuidanceItem}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-guidance-category">
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCategories.map((category) => (
                          <SelectItem key={`${category.itemCode}-${category.code}`} value={category.code}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guidanceContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>指導内容</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                      disabled={!selectedGuidanceCategory}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-guidance-content">
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableContents.map((content) => (
                          <SelectItem
                            key={`${content.itemCode}-${content.categoryCode}-${content.code}`}
                            value={content.code}
                          >
                            {content.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
