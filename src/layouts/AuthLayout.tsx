import { Outlet } from "react-router-dom";
import MainLayout from "./MainLayout";

function AuthLayout() {
  return (
    <MainLayout showNav={false}>
      <div className="flex justify-center items-center h-full">
        <Outlet />
      </div>
    </MainLayout>
  );
}

export default AuthLayout;
