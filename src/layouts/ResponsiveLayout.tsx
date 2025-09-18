
import { Outlet } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";

function ResponsiveLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen">
      {isMobile ? <MobileNav /> : <Sidebar />}
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}

export default ResponsiveLayout;
