import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { type Office, type Karte, type InsertKarte } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import karteMasterData from "@shared/data/karte-master.json";

export default function KartePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedOffice, setSelectedOffice] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextVisitDate, setNextVisitDate] = useState("");
  const [guidanceItem, setGuidanceItem] = useState("");
  const [guidanceCategory, setGuidanceCategory] = useState("");
  const [guidanceContent, setGuidanceContent] = useState("");

  // Filter guidance categories based on selected item
  const availableCategories = useMemo(() => {
    if (!guidanceItem) return [];
    return karteMasterData.guidanceCategories.filter(
      (cat) => cat.itemCode === guidanceItem
    );
  }, [guidanceItem]);

  // Filter guidance contents based on selected item and category
  const availableContents = useMemo(() => {
    if (!guidanceItem || !guidanceCategory) return [];
    return karteMasterData.guidanceContents.filter(
      (content) =>
        content.itemCode === guidanceItem &&
        content.categoryCode === guidanceCategory
    );
  }, [guidanceItem, guidanceCategory]);

  const { data: offices, isLoading: isLoadingOffices } = useQuery<Office[]>({
    queryKey: ["/api/offices"],
  });

  const { data: kartes, isLoading: isLoadingKartes } = useQuery<Karte[]>({
    queryKey: [`/api/offices/${selectedOffice}/kartes`],
    enabled: !!selectedOffice,
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertKarte) => apiRequest("/api/kartes", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/offices/${selectedOffice}/kartes`] });
      toast({
        title: "登録しました",
        description: "経営カルテを登録しました",
      });
      setVisitDate("");
      setTitle("");
      setContent("");
      setNextAction("");
      setNextVisitDate("");
      setGuidanceItem("");
      setGuidanceCategory("");
      setGuidanceContent("");
      if (selectedOffice) {
        setLocation(`/office/${selectedOffice}/detail`);
      }
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "登録に失敗しました",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffice) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "事業所を選択してください",
      });
      return;
    }
    createMutation.mutate({
      officeId: selectedOffice,
      visitDate,
      title,
      content,
      nextAction: nextAction || null,
      nextVisitDate: nextVisitDate || null,
      guidanceItem: guidanceItem || null,
      guidanceCategory: guidanceCategory || null,
      guidanceContent: guidanceContent || null,
      createdBy: "",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">経営カルテ</h1>
        <p className="text-sm text-muted-foreground">支援履歴をカルテ形式で記録します</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>新規カルテ作成</CardTitle>
              <CardDescription>支援内容を記録してください</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="office-select">対象事業所 *</Label>
                  <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                    <SelectTrigger id="office-select" data-testid="select-office">
                      <SelectValue placeholder="事業所を選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingOffices ? (
                        <SelectItem value="loading" disabled>読み込み中...</SelectItem>
                      ) : offices && offices.length > 0 ? (
                        offices.map((office) => (
                          <SelectItem key={office.id} value={office.id}>
                            {office.code ? `[${office.code}] ` : ""}{office.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-offices" disabled>登録された事業所がありません</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="karte-date">訪問日 *</Label>
                    <Input 
                      id="karte-date" 
                      type="date" 
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      data-testid="input-karte-date"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="karte-title">タイトル *</Label>
                    <Input 
                      id="karte-title" 
                      placeholder="例：経営課題ヒアリング"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      data-testid="input-karte-title"
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="karte-content">支援内容 *</Label>
                  <Textarea 
                    id="karte-content" 
                    placeholder="支援内容を詳しく記載してください" 
                    className="min-h-32"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    data-testid="textarea-karte-content"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="karte-next">次回アクション</Label>
                  <Textarea 
                    id="karte-next" 
                    placeholder="次回の支援内容や確認事項"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    data-testid="textarea-karte-next"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="karte-next-visit">次回訪問予定日</Label>
                  <Input 
                    id="karte-next-visit" 
                    type="date"
                    value={nextVisitDate}
                    onChange={(e) => setNextVisitDate(e.target.value)}
                    data-testid="input-karte-next-visit"
                  />
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h3 className="text-sm font-medium">指導分類</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="guidance-item">指導事項</Label>
                      <Select 
                        value={guidanceItem} 
                        onValueChange={(value) => {
                          setGuidanceItem(value);
                          setGuidanceCategory("");
                          setGuidanceContent("");
                        }}
                      >
                        <SelectTrigger id="guidance-item" data-testid="select-guidance-item">
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          {karteMasterData.guidanceItems.map((item) => (
                            <SelectItem key={item.code} value={item.code}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guidance-category">指導内容区分</Label>
                      <Select 
                        value={guidanceCategory} 
                        onValueChange={(value) => {
                          setGuidanceCategory(value);
                          setGuidanceContent("");
                        }}
                        disabled={!guidanceItem}
                      >
                        <SelectTrigger id="guidance-category" data-testid="select-guidance-category">
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCategories.map((category) => (
                            <SelectItem key={`${category.itemCode}-${category.code}`} value={category.code}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guidance-content">指導内容</Label>
                      <Select 
                        value={guidanceContent} 
                        onValueChange={setGuidanceContent}
                        disabled={!guidanceCategory}
                      >
                        <SelectTrigger id="guidance-content" data-testid="select-guidance-content">
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
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
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setVisitDate("");
                      setTitle("");
                      setContent("");
                      setNextAction("");
                      setGuidanceItem("");
                      setGuidanceCategory("");
                      setGuidanceContent("");
                    }}
                    data-testid="button-cancel"
                  >
                    キャンセル
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-save"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {createMutation.isPending ? "保存中..." : "保存"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>支援履歴</CardTitle>
              <CardDescription>
                {selectedOffice ? "過去の記録" : "事業所を選択してください"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!selectedOffice ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  事業所を選択すると支援履歴が表示されます
                </p>
              ) : isLoadingKartes ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  読み込み中...
                </p>
              ) : kartes && kartes.length > 0 ? (
                kartes.map((karte) => (
                  <div 
                    key={karte.id} 
                    className="border rounded-md p-3 space-y-2 hover-elevate cursor-pointer"
                    onClick={() => setLocation(`/office/${selectedOffice}/karte/${karte.id}`)}
                    data-testid={`karte-history-${karte.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-medium">{karte.title}</h4>
                      <Badge variant="outline" className="text-xs">{karte.visitDate}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{karte.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  まだ支援履歴がありません
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
