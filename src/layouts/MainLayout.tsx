import { Outlet } from "react-router-dom";
import Auth from "@/components/auth/Auth";
import ResponsiveLayout from "@/layouts/ResponsiveLayout";

function MainLayout() {
  return (
    <ResponsiveLayout>
      <Outlet />
    </ResponsiveLayout>
  );
}

export default MainLayout;