
import { useAuth } from "@/App";
import FarmProfileForm from "@/components/FarmProfileForm";
import { useLanguage } from "@/components/LanguageToggle";

function Profile() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="space-y-6 p-4 md:p-6 flex flex-col items-center">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">{t('profileTitle')}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t('welcomeProfile')}, {user?.email}!</p>
        <p>{t('viewUpdateDetails')}</p>
      </div>
      <FarmProfileForm />
    </div>
  );
}

export default Profile;
