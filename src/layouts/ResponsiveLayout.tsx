import { Outlet } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import Navbar from "@/components/Navbar"; // Import the new Navbar

function ResponsiveLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Navbar /> {/* Add Navbar at the top */}
      <div className="flex flex-1">
        {isMobile ? <MobileNav /> : <Sidebar />}
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default ResponsiveLayout;