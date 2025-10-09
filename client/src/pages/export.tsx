import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, CheckSquare, Square } from "lucide-react";

export default function ExportPage() {
  const [selectAll, setSelectAll] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  //todo: remove mock functionality
  const exportFields = [
    { id: "code", label: "事業所コード" },
    { id: "name", label: "事業所名" },
    { id: "kana", label: "フリガナ" },
    { id: "representative", label: "代表者氏名" },
    { id: "rep-kana", label: "代表者フリガナ" },
    { id: "company-type", label: "企業形態" },
    { id: "capital", label: "資本金" },
    { id: "industry", label: "業種" },
    { id: "employees", label: "従業員数" },
    { id: "engagement-type", label: "関与区分" },
    { id: "engagement-date", label: "関与年月日" },
    { id: "phone", label: "電話番号" },
    { id: "address", label: "事業所所在地" },
  ];

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedFields([]);
    } else {
      setSelectedFields(exportFields.map(f => f.id));
    }
    setSelectAll(!selectAll);
  };

  const handleFieldToggle = (fieldId: string) => {
    if (selectedFields.includes(fieldId)) {
      setSelectedFields(selectedFields.filter(id => id !== fieldId));
    } else {
      setSelectedFields([...selectedFields, fieldId]);
    }
  };

  const handleExport = () => {
    console.log("Exporting with fields:", selectedFields);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">CSV出力</h1>
        <p className="text-sm text-muted-foreground">事業所情報をCSV形式で出力します</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>抽出条件</CardTitle>
            <CardDescription>出力するデータの条件を指定してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="criteria-date">判定基準日</Label>
              <Input 
                id="criteria-date" 
                type="date" 
                data-testid="input-criteria-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="engagement-filter">関与区分</Label>
              <Select>
                <SelectTrigger id="engagement-filter" data-testid="select-engagement-filter">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="active">関与先のみ</SelectItem>
                  <SelectItem value="past">（旧）関与先のみ</SelectItem>
                  <SelectItem value="seminar">セミナー系関与先のみ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>出力項目選択</CardTitle>
            <CardDescription>CSV出力する項目を選択してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSelectAll}
                data-testid="button-select-all"
              >
                {selectAll ? <CheckSquare className="mr-2 h-4 w-4" /> : <Square className="mr-2 h-4 w-4" />}
                {selectAll ? "すべて解除" : "すべて選択"}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {exportFields.map((field) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`field-${field.id}`}
                    checked={selectedFields.includes(field.id)}
                    onCheckedChange={() => handleFieldToggle(field.id)}
                    data-testid={`checkbox-${field.id}`}
                  />
                  <label
                    htmlFor={`field-${field.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {field.label}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleExport} disabled={selectedFields.length === 0} data-testid="button-export">
          <Download className="mr-2 h-4 w-4" />
          CSV出力（{selectedFields.length}項目）
        </Button>
      </div>
    </div>
  );
}
