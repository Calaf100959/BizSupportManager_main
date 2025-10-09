import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { type Office } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SearchPage() {
  const [searchCode, setSearchCode] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchRep, setSearchRep] = useState("");
  const [deleteOfficeId, setDeleteOfficeId] = useState<string | null>(null);
  const { toast } = useToast();

  const searchParams = {
    code: searchCode || undefined,
    name: searchName || undefined,
    representative: searchRep || undefined,
  };

  const { data: offices = [], isLoading } = useQuery<Office[]>({
    queryKey: ["/api/offices", searchParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchCode) params.set('code', searchCode);
      if (searchName) params.set('name', searchName);
      if (searchRep) params.set('representative', searchRep);
      const queryString = params.toString();
      const url = queryString ? `/api/offices?${queryString}` : "/api/offices";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error('Failed to fetch offices');
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/offices/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offices"] });
      toast({ title: "事業所を削除しました" });
      setDeleteOfficeId(null);
    },
    onError: () => {
      toast({ title: "削除に失敗しました", variant: "destructive" });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    queryClient.invalidateQueries({ queryKey: ["/api/offices"] });
  };

  const handleClearSearch = () => {
    setSearchCode("");
    setSearchName("");
    setSearchRep("");
    queryClient.invalidateQueries({ queryKey: ["/api/offices"] });
  };

  const getEngagementBadgeVariant = (type: string | null) => {
    switch (type) {
      case "active": return "default";
      case "past": return "secondary";
      case "seminar": return "outline";
      default: return "secondary";
    }
  };

  const getEngagementLabel = (type: string | null) => {
    switch (type) {
      case "active": return "関与先";
      case "past": return "（旧）関与先";
      case "seminar": return "セミナー系関与先";
      case "onetime": return "一見先";
      case "none": return "非関与先";
      default: return "-";
    }
  };

  const getIndustryLabel = (industry: string | null) => {
    switch (industry) {
      case "manufacturing": return "製造業";
      case "retail": return "小売業";
      case "service": return "サービス業";
      case "it": return "情報通信業";
      default: return industry || "-";
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
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  data-testid="input-search-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-name">事業所名・フリガナ</Label>
                <Input 
                  id="search-name" 
                  placeholder="例：山田商店" 
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  data-testid="input-search-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search-rep">代表者名・フリガナ</Label>
                <Input 
                  id="search-rep" 
                  placeholder="例：山田太郎"
                  value={searchRep}
                  onChange={(e) => setSearchRep(e.target.value)}
                  data-testid="input-search-rep"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClearSearch} data-testid="button-clear">
                クリア
              </Button>
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
          <CardDescription>
            {isLoading ? "検索中..." : `${offices.length}件の事業所が見つかりました`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
          ) : offices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">該当する事業所が見つかりませんでした</div>
          ) : (
            <div className="space-y-3">
              {offices.map((office) => (
                <div 
                  key={office.id} 
                  className="flex items-center justify-between border rounded-md p-4 hover-elevate"
                  data-testid={`office-result-${office.code}`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-muted-foreground" data-testid={`text-code-${office.code}`}>
                        {office.code}
                      </span>
                      <h3 className="font-medium" data-testid={`text-name-${office.code}`}>{office.name}</h3>
                      <Badge variant={getEngagementBadgeVariant(office.engagementType) as any} data-testid={`badge-engagement-${office.code}`}>
                        {getEngagementLabel(office.engagementType)}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span data-testid={`text-industry-${office.code}`}>
                        業種: {getIndustryLabel(office.industry)}
                      </span>
                      <span data-testid={`text-rep-${office.code}`}>
                        代表者: {office.representativeName || "-"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild data-testid={`button-view-${office.code}`}>
                      <Link href={`/office/${office.id}/detail`}>
                        詳細
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild data-testid={`button-edit-${office.code}`}>
                      <Link href={`/office/${office.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteOfficeId(office.id)}
                      data-testid={`button-delete-${office.code}`}
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

      <AlertDialog open={!!deleteOfficeId} onOpenChange={(open) => !open && setDeleteOfficeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>事業所を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。事業所に関連する全てのデータが削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOfficeId && deleteMutation.mutate(deleteOfficeId)}
              data-testid="button-confirm-delete"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
