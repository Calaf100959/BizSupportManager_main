import { Home, Building2, FileText, ClipboardList, Search, Download, LogOut, BookOpen, FileSpreadsheet, Settings2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ThemeColorPicker } from "@/components/theme-color-picker";

const menuItems = [
  {
    title: "ホーム",
    url: "/",
    icon: Home,
  },
  {
    title: "事業所検索",
    url: "/search",
    icon: Search,
  },
  {
    title: "事業所登録",
    url: "/office/new",
    icon: Building2,
  },
  {
    title: "経営カルテ",
    url: "/karte",
    icon: FileText,
  },
  {
    title: "業務日誌",
    url: "/worklog",
    icon: ClipboardList,
  },
  {
    title: "補助金管理",
    url: "/subsidy-programs",
    icon: BookOpen,
  },
  {
    title: "請求書管理",
    url: "/invoices",
    icon: FileSpreadsheet,
  },
  {
    title: "自社設定",
    url: "/company-settings",
    icon: Settings2,
  },
  {
    title: "CSV出力",
    url: "/export",
    icon: Download,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.lastName} ${user.firstName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.email) {
      return user.email;
    }
    return "ユーザー";
  };

  const getInitials = () => {
    if (user?.lastName) {
      return user.lastName.substring(0, 2);
    }
    if (user?.firstName) {
      return user.firstName.substring(0, 2);
    }
    return "U";
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">顧客管理システム</span>
            <span className="text-xs text-muted-foreground">中小企業診断士</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>メインメニュー</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.url.replace(/\//g, '-') || 'home'}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-3">
        <ThemeColorPicker currentTheme={user?.themeColor || "blue"} />
        <div className="flex items-center gap-3">
          <Avatar>
            {user?.profileImageUrl && <AvatarImage src={user.profileImageUrl} alt={getDisplayName()} />}
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium truncate">{getDisplayName()}</span>
            <span className="text-xs text-muted-foreground truncate">診断士</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
