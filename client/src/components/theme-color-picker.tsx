import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Palette } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const THEME_COLORS = [
  { id: "blue", name: "ブルー", color: "hsl(211, 100%, 35%)" },
  { id: "pink", name: "ピンク", color: "hsl(0, 70%, 60%)" },
  { id: "aqua", name: "アクア", color: "hsl(190, 80%, 50%)" },
  { id: "mint", name: "ミント", color: "hsl(155, 60%, 50%)" },
  { id: "purple", name: "パープル", color: "hsl(260, 50%, 65%)" },
  { id: "orange", name: "オレンジ", color: "hsl(30, 90%, 55%)" },
  { id: "beige", name: "ベージュ", color: "hsl(35, 40%, 60%)" },
];

interface ThemeColorPickerProps {
  currentTheme?: string;
}

export function ThemeColorPicker({ currentTheme = "blue" }: ThemeColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setSelectedTheme(currentTheme);
  }, [currentTheme]);

  const updateThemeMutation = useMutation({
    mutationFn: async (themeColor: string) => {
      const res = await apiRequest("PUT", "/api/user/theme", { themeColor });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "テーマを変更しました" });
      setOpen(false);
    },
    onError: () => {
      toast({ title: "テーマの変更に失敗しました", variant: "destructive" });
    },
  });

  const applyTheme = (themeId: string) => {
    document.documentElement.classList.remove(
      "theme-pink", "theme-aqua", "theme-mint", "theme-purple", "theme-orange", "theme-beige"
    );
    if (themeId !== "blue") {
      document.documentElement.classList.add(`theme-${themeId}`);
    }
  };

  const handleSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    applyTheme(themeId);
    updateThemeMutation.mutate(themeId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" data-testid="button-theme-picker">
          <Palette className="h-4 w-4" />
          <span>テーマカラー</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>テーマカラー</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          {THEME_COLORS.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleSelect(theme.id)}
              className="flex flex-col items-center gap-2 group"
              data-testid={`button-theme-${theme.id}`}
            >
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center transition-transform hover:scale-105"
                style={{ backgroundColor: theme.color }}
              >
                {selectedTheme === theme.id && (
                  <Check className="h-8 w-8 text-white drop-shadow-md" />
                )}
              </div>
              <span className="text-sm text-muted-foreground">{theme.name}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useThemeColor(themeColor?: string | null) {
  useEffect(() => {
    document.documentElement.classList.remove(
      "theme-pink", "theme-aqua", "theme-mint", "theme-purple", "theme-orange", "theme-beige"
    );
    if (themeColor && themeColor !== "blue") {
      document.documentElement.classList.add(`theme-${themeColor}`);
    }
  }, [themeColor]);
}
