
import { UserProfile } from "@clerk/clerk-react";
import FarmProfileForm from "@/components/FarmProfileForm";

function Profile() {
  return (
    <div className="flex flex-col lg:flex-row justify-center items-start gap-8 p-8">
      <div className="w-full lg:w-1/2">
        <UserProfile />
      </div>
      <div className="w-full lg:w-1/2">
        <FarmProfileForm />
      </div>
    </div>
  );
}

export default Profile;
