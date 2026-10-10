import { Menu, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Topbar = ({ onMenuClick }: { onMenuClick: () => void }) => (
  <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6 lg:px-8">
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onMenuClick}
      aria-label="Open menu"
      className="lg:hidden"
    >
      <Menu className="h-5 w-5" />
    </Button>

    <div className="relative hidden w-full max-w-sm sm:block">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input placeholder="Search..." className="h-9 pl-9" />
    </div>

    <div className="ml-auto">
      <Avatar className="h-9 w-9">
        <AvatarFallback className="bg-primary/15 text-sm text-accent-foreground">
          A
        </AvatarFallback>
      </Avatar>
    </div>
  </header>
);
