import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, ExternalLink } from "lucide-react";
import { type SubsidyProgram } from "@shared/schema";

type LinkedOfficeRecord = {
  linkageId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  office: {
    id: string;
    code: string | null;
    name: string;
    representativeName: string | null;
    engagementType: string | null;
  };
};

export default function SubsidyProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  
  const { data: program, isLoading: programLoading, error: programError } = useQuery<SubsidyProgram>({
    queryKey: [`/api/subsidy-programs/${id}`],
    enabled: !!id,
  });
  
  const { data: linkedOffices = [], isLoading: officesLoading, error: officesError } = useQuery<LinkedOfficeRecord[]>({
    queryKey: [`/api/subsidy-programs/${id}/offices`],
    enabled: !!id && !!program,
  });
  
  // Set page title and meta tags for SEO
  useEffect(() => {
    if (program) {
      document.title = `${program.name} - 補助金詳細 | 顧客管理システム`;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', `${program.name}の詳細情報と紐づけられた事業所一覧を表示します。`);
      }
      
      // Open Graph tags
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', `${program.name} - 補助金詳細 | 顧客管理システム`);
      
      let ogDescription = document.querySelector('meta[property="og:description"]');
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
      }
      ogDescription.setAttribute('content', `${program.name}の詳細情報と紐づけられた事業所一覧を表示します。`);
    }
  }, [program]);
  
  if (programLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/subsidy-programs">
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">読み込み中...</div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (programError || !program) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/subsidy-programs">
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground" data-testid="text-error">
              補助金制度が見つかりませんでした
            </div>
            <div className="text-center mt-4">
              <Link href="/subsidy-programs">
                <Button variant="outline" data-testid="button-back-to-list">
                  一覧に戻る
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/subsidy-programs">
          <Button variant="outline" size="sm" data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle data-testid="text-program-name">{program.name}</CardTitle>
                <Badge variant="outline" data-testid="badge-status">
                  {program.status}
                </Badge>
              </div>
              {program.category && (
                <CardDescription data-testid="text-category">{program.category}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {program.provider && (
            <div>
              <p className="text-xs text-muted-foreground">提供機関</p>
              <p className="text-sm" data-testid="text-provider">{program.provider}</p>
            </div>
          )}
          
          {program.description && (
            <div>
              <p className="text-xs text-muted-foreground">説明</p>
              <p className="text-sm whitespace-pre-wrap" data-testid="text-description">{program.description}</p>
            </div>
          )}
          
          {program.urls && program.urls.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">関連URL</p>
              <div className="space-y-2">
                {program.urls.map((url, index) => (
                  <div key={index}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                      data-testid={`link-url-${index}`}
                    >
                      <ExternalLink className="h-3 w-3" />
                      {url}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {program.notes && (
            <div>
              <p className="text-xs text-muted-foreground">備考</p>
              <p className="text-sm whitespace-pre-wrap" data-testid="text-notes">{program.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle data-testid="text-linked-offices-title">紐づけられた事業所</CardTitle>
              <CardDescription>
                この補助金制度に紐づけられている事業所の一覧
              </CardDescription>
            </div>
            <Badge variant="outline" data-testid="badge-office-count">
              {linkedOffices.length}件
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {officesLoading ? (
            <div className="text-center text-muted-foreground py-4">読み込み中...</div>
          ) : officesError ? (
            <div className="text-center text-muted-foreground py-4" data-testid="text-offices-error">
              事業所一覧の読み込みに失敗しました
            </div>
          ) : linkedOffices.length === 0 ? (
            <div className="text-center text-muted-foreground py-4" data-testid="text-no-offices">
              紐づけられた事業所がありません
            </div>
          ) : (
            <div className="space-y-2">
              {linkedOffices.map((record) => (
                <Link key={record.linkageId} href={`/office/${record.office.id}/detail`}>
                  <div
                    className="flex items-center justify-between border rounded-md p-4 hover-elevate"
                    data-testid={`office-item-${record.linkageId}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium" data-testid={`office-name-${record.linkageId}`}>
                          {record.office.name}
                          {record.office.code && (
                            <span className="text-xs text-muted-foreground ml-2">({record.office.code})</span>
                          )}
                        </p>
                        {record.office.representativeName && (
                          <p className="text-xs text-muted-foreground" data-testid={`office-representative-${record.linkageId}`}>
                            代表者: {record.office.representativeName}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" data-testid={`office-record-status-${record.linkageId}`}>
                      {record.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
