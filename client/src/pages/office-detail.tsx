import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Building2, Edit, Trash2, UserPlus, User } from "lucide-react";
import { type Office, type Person } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function OfficeDetailPage() {
  const { officeId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deletePersonId, setDeletePersonId] = useState<string | null>(null);

  const { data: office, isLoading: officeLoading } = useQuery<Office>({
    queryKey: [`/api/offices/${officeId}`],
    enabled: !!officeId,
  });

  const { data: persons = [], isLoading: personsLoading } = useQuery<Person[]>({
    queryKey: [`/api/offices/${officeId}/persons`],
    enabled: !!officeId,
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
                <p className="font-medium">{office.phone || "-"}</p>
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
    </div>
  );
}
