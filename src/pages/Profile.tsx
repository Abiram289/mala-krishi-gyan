
import { useAuth } from "@/App";

function Profile() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Profile</h1>
      <p>Welcome, {user?.email}!</p>
      <p>This is your profile page. You can display and edit user information here.</p>
      {/* You will build your custom profile display here using Supabase user data */}
    </div>
  );
}

export default Profile;
