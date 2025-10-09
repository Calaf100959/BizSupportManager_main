import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, User } from "lucide-react";

export default function KartePage() {
  const [selectedOffice, setSelectedOffice] = useState("");

  //todo: remove mock functionality
  const karteHistory = [
    { id: 1, date: "2024-01-15", title: "経営課題ヒアリング", author: "山田太郎", summary: "売上向上施策について協議" },
    { id: 2, date: "2024-01-10", title: "財務分析結果報告", author: "佐藤花子", summary: "前期比較分析を実施" },
    { id: 3, date: "2024-01-05", title: "初回訪問", author: "山田太郎", summary: "事業概要と課題の確認" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Karte submitted");
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
                      <SelectItem value="OFF-001">株式会社山田商店</SelectItem>
                      <SelectItem value="OFF-002">田中工業株式会社</SelectItem>
                      <SelectItem value="OFF-003">鈴木製作所</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="karte-date">訪問日 *</Label>
                    <Input 
                      id="karte-date" 
                      type="date" 
                      data-testid="input-karte-date"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="karte-title">タイトル *</Label>
                    <Input 
                      id="karte-title" 
                      placeholder="例：経営課題ヒアリング" 
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
                    data-testid="textarea-karte-content"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="karte-next">次回アクション</Label>
                  <Textarea 
                    id="karte-next" 
                    placeholder="次回の支援内容や確認事項" 
                    data-testid="textarea-karte-next"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" data-testid="button-cancel">
                    キャンセル
                  </Button>
                  <Button type="submit" data-testid="button-save">
                    <FileText className="mr-2 h-4 w-4" />
                    保存
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
              <CardDescription>過去の記録</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {karteHistory.map((karte) => (
                <div 
                  key={karte.id} 
                  className="border rounded-md p-3 space-y-2 hover-elevate cursor-pointer"
                  data-testid={`karte-history-${karte.id}`}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-medium">{karte.title}</h4>
                    <Badge variant="outline" className="text-xs">{karte.date}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{karte.summary}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{karte.author}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
