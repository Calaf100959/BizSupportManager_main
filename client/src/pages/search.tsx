import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit } from "lucide-react";
import { Link } from "wouter";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");

  //todo: remove mock functionality
  const mockResults = [
    { 
      code: "OFF-001", 
      name: "株式会社山田商店", 
      industry: "小売業", 
      engagementType: "active",
      engagementLabel: "関与先",
      representative: "山田太郎" 
    },
    { 
      code: "OFF-002", 
      name: "田中工業株式会社", 
      industry: "製造業", 
      engagementType: "active",
      engagementLabel: "関与先",
      representative: "田中次郎" 
    },
    { 
      code: "OFF-003", 
      name: "鈴木製作所", 
      industry: "製造業", 
      engagementType: "past",
      engagementLabel: "（旧）関与先",
      representative: "鈴木三郎" 
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
  };

  const getEngagementBadgeVariant = (type: string) => {
    switch (type) {
      case "active": return "default";
      case "past": return "secondary";
      case "seminar": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">事業所検索</h1>
          <p className="text-sm text-muted-foreground">事業所コード、事業所名、代表者名で検索できます</p>
        </div>
        <Button asChild data-testid="button-new-office">
          <Link href="/office/new">
            <Plus className="mr-2 h-4 w-4" />
            新規登録
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>検索条件</CardTitle>
          <CardDescription>事業所の情報を検索します</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="search-code">事業所コード</Label>
                <Input 
                  id="search-code" 
                  placeholder="例：OFF-001" 
                  data-testid="input-search-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-name">事業所名・フリガナ</Label>
                <Input 
                  id="search-name" 
                  placeholder="例：山田商店" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-rep">代表者名・フリガナ</Label>
                <Input 
                  id="search-rep" 
                  placeholder="例：山田太郎" 
                  data-testid="input-search-rep"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" data-testid="button-search">
                <Search className="mr-2 h-4 w-4" />
                検索
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>検索結果</CardTitle>
          <CardDescription>{mockResults.length}件の事業所が見つかりました</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockResults.map((result) => (
              <div 
                key={result.code} 
                className="flex items-center justify-between border rounded-md p-4 hover-elevate"
                data-testid={`office-result-${result.code}`}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground" data-testid={`text-code-${result.code}`}>
                      {result.code}
                    </span>
                    <h3 className="font-medium" data-testid={`text-name-${result.code}`}>{result.name}</h3>
                    <Badge variant={getEngagementBadgeVariant(result.engagementType) as any} data-testid={`badge-engagement-${result.code}`}>
                      {result.engagementLabel}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span data-testid={`text-industry-${result.code}`}>業種: {result.industry}</span>
                    <span data-testid={`text-rep-${result.code}`}>代表者: {result.representative}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild data-testid={`button-edit-${result.code}`}>
                  <Link href={`/office/${result.code}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
