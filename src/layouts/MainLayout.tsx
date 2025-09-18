import { Outlet } from "react-router-dom";
import ResponsiveLayout from "@/layouts/ResponsiveLayout";

function MainLayout() {
  return (
    <ResponsiveLayout>
      <Outlet />
    </ResponsiveLayout>
  );
}

export default MainLayout;