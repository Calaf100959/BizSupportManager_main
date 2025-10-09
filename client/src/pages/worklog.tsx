import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Clock, Save } from "lucide-react";

export default function WorklogPage() {
  //todo: remove mock functionality
  const todayLogs = [
    { time: "09:00", activity: "メール対応", duration: "30分" },
    { time: "10:00", activity: "株式会社山田商店訪問", duration: "2時間" },
    { time: "13:00", activity: "資料作成", duration: "1時間" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Worklog submitted");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">業務日誌</h1>
        <p className="text-sm text-muted-foreground">日々の業務内容を記録します</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>業務記録</CardTitle>
              <CardDescription>本日の業務内容を入力してください</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="log-date">日付 *</Label>
                    <Input 
                      id="log-date" 
                      type="date" 
                      defaultValue={new Date().toISOString().split('T')[0]}
                      data-testid="input-log-date"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="log-time">時刻</Label>
                    <Input 
                      id="log-time" 
                      type="time" 
                      data-testid="input-log-time"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="log-duration">所要時間</Label>
                    <Input 
                      id="log-duration" 
                      placeholder="例：2時間" 
                      data-testid="input-log-duration"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="log-activity">業務内容 *</Label>
                  <Input 
                    id="log-activity" 
                    placeholder="例：株式会社山田商店訪問" 
                    data-testid="input-log-activity"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="log-detail">詳細</Label>
                  <Textarea 
                    id="log-detail" 
                    placeholder="業務の詳細を記載してください" 
                    className="min-h-24"
                    data-testid="textarea-log-detail"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="log-office">関連事業所</Label>
                  <Input 
                    id="log-office" 
                    placeholder="事業所名（任意）" 
                    data-testid="input-log-office"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" data-testid="button-cancel">
                    キャンセル
                  </Button>
                  <Button type="submit" data-testid="button-save">
                    <Save className="mr-2 h-4 w-4" />
                    保存
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>本日の記録</CardTitle>
              <CardDescription>今日の業務ログ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayLogs.map((log, idx) => (
                <div 
                  key={idx} 
                  className="border rounded-md p-3 space-y-1"
                  data-testid={`log-entry-${idx}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium">{log.time}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{log.duration}</Badge>
                  </div>
                  <p className="text-sm">{log.activity}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
