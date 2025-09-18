import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ExternalLink, FileText, Users, IndianRupee, Calendar, CheckCircle } from "lucide-react";
import { useLanguage } from "@/components/LanguageToggle";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Scheme {
  id: string;
  title: string;
  titleMl: string;
  description: string;
  descriptionMl: string;
  eligibility: string;
  eligibilityMl: string;
  benefit: string;
  benefitMl: string;
  deadline: string;
  status: 'open' | 'closing-soon' | 'closed';
  category: 'subsidy' | 'insurance' | 'loan' | 'training';
  amount: string;
  department: string;
}

export default function GovernmentSchemes() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [enrollmentData, setEnrollmentData] = useState({
    name: '',
    phone: '',
    aadhaar: '',
    landSize: '',
    cropType: '',
    address: ''
  });
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);

  const schemes: Scheme[] = [
    {
      id: '1',
      title: 'PM-KISAN Scheme',
      titleMl: 'പ്രധാനമന്ത്രി കിസാൻ സമ്മാൻ നിധി',
      description: 'Direct income support to small and marginal farmers',
      descriptionMl: 'ചെറുകിടവും നാമമാത്ര കർഷകർക്കും നേരിട്ടുള്ള വരുമാന പിന്തുണ',
      eligibility: 'Farmers with cultivable land up to 2 hectares',
      eligibilityMl: '2 ഹെക്ടർ വരെ കൃഷിയോഗ്യമായ ഭൂമിയുള്ള കർഷകർ',
      benefit: '₹6,000 per year in 3 installments',
      benefitMl: 'വർഷത്തിൽ 3 തവണകളായി ₹6,000',
      deadline: '2024-12-31',
      status: 'open',
      category: 'subsidy',
      amount: '₹6,000',
      department: 'Ministry of Agriculture'
    },
    {
      id: '2',
      title: 'Crop Insurance Scheme',
      titleMl: 'പ്രധാനമന്ത്രി ഫസൽ ബീമാ യോജന',
      description: 'Insurance coverage for crop loss due to natural calamities',
      descriptionMl: 'പ്രകൃതി ദുരന്തങ്ങൾ കാരണം വിളനഷ്ടത്തിനുള്ള ഇൻഷുറൻസ് പരിരക്ഷ',
      eligibility: 'All farmers growing notified crops in notified areas',
      eligibilityMl: 'വിജ്ഞാപനം ചെയ്ത പ്രദേശങ്ങളിൽ വിജ്ഞാപിത വിളകൾ വളർത്തുന്ന എല്ലാ കർഷകരും',
      benefit: 'Insurance coverage up to sum insured',
      benefitMl: 'ഇൻഷുർ ചെയ്ത തുക വരെ ഇൻഷുറൻസ് പരിരക്ഷ',
      deadline: '2024-10-15',
      status: 'closing-soon',
      category: 'insurance',
      amount: 'Variable',
      department: 'Ministry of Agriculture'
    },
    {
      id: '3',
      title: 'Kerala Coconut Development Scheme',
      titleMl: 'കേരള തെങ്ങ് വികസന പദ്ധതി',
      description: 'Subsidy for coconut cultivation and processing',
      descriptionMl: 'തെങ്ങ് കൃഷിക്കും സംസ്കരണത്തിനുമുള്ള സബ്സിഡി',
      eligibility: 'Kerala farmers with minimum 0.25 acres coconut plantation',
      eligibilityMl: 'മിനിമം 0.25 ഏക്കർ തെങ്ങ് തോട്ടമുള്ള കേരള കർഷകർ',
      benefit: '50% subsidy up to ₹50,000',
      benefitMl: '₹50,000 വരെ 50% സബ്സിഡി',
      deadline: '2024-11-30',
      status: 'open',
      category: 'subsidy',
      amount: 'Up to ₹50,000',
      department: 'Kerala Coconut Development Board'
    },
    {
      id: '4',
      title: 'Organic Farming Promotion',
      titleMl: 'ജൈവിക കൃഷി പ്രോത്സാഹന പദ്ധതി',
      description: 'Financial assistance for organic farming practices',
      descriptionMl: 'ജൈവിക കൃഷി രീതികൾക്കുള്ള സാമ്പത്തിക സഹായം',
      eligibility: 'Farmers converting to organic farming methods',
      eligibilityMl: 'ജൈവിക കൃഷി രീതികളിലേക്ക് മാറുന്ന കർഷകർ',
      benefit: '₹20,000 per hectare for 3 years',
      benefitMl: '3 വർഷത്തേക്ക് ഹെക്ടറിന് ₹20,000',
      deadline: '2024-09-30',
      status: 'closing-soon',
      category: 'training',
      amount: '₹20,000/hectare',
      department: 'Kerala Agriculture Department'
    },
    {
      id: '5',
      title: 'Kisan Credit Card',
      titleMl: 'കിസാൻ ക്രെഡിറ്റ് കാർഡ്',
      description: 'Credit facility for agricultural expenses',
      descriptionMl: 'കാർഷിക ചെലവുകൾക്കുള്ള വായ്പാ സൗകര്യം',
      eligibility: 'All farmers with agricultural land documents',
      eligibilityMl: 'കാർഷിക ഭൂമി രേഖകളുള്ള എല്ലാ കർഷകരും',
      benefit: 'Loan up to ₹3 lakh at 7% interest',
      benefitMl: '7% പലിശയിൽ ₹3 ലക്ഷം വരെ വായ്പ',
      deadline: 'Ongoing',
      status: 'open',
      category: 'loan',
      amount: 'Up to ₹3 lakh',
      department: 'All Nationalized Banks'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-primary text-primary-foreground';
      case 'closing-soon': return 'bg-destructive text-destructive-foreground';
      case 'closed': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'subsidy': return <IndianRupee className="h-4 w-4" />;
      case 'insurance': return <FileText className="h-4 w-4" />;
      case 'loan': return <ExternalLink className="h-4 w-4" />;
      case 'training': return <Users className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleEnrollment = (scheme: Scheme) => {
    setSelectedScheme(scheme);
    setIsEnrollDialogOpen(true);
  };

  const submitEnrollment = () => {
    if (!enrollmentData.name || !enrollmentData.phone || !enrollmentData.aadhaar) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    // Simulate enrollment submission
    toast({
      title: language === 'ml' ? "അപേക്ഷ സമർപ്പിച്ചു" : "Application Submitted",
      description: language === 'ml' 
        ? "നിങ്ങളുടെ അപേക്ഷ വിജയകരമായി സമർപ്പിച്ചു" 
        : "Your application has been submitted successfully",
    });

    setIsEnrollDialogOpen(false);
    setEnrollmentData({
      name: '', phone: '', aadhaar: '', landSize: '', cropType: '', address: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-kerala-spice via-kerala-coconut to-kerala-rice p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="outline" size="sm" className="bg-white/90">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('back')}
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{t('schemes')}</h1>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">
                {language === 'ml' ? 'ലഭ്യമായ സർക്കാർ പദ്ധതികൾ' : 'Available Government Schemes'}
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              {language === 'ml' 
                ? 'കർഷകർക്കായുള്ള സർക്കാർ പദ്ധതികളും സബ്സിഡികളും' 
                : 'Government schemes and subsidies for farmers'
              }
            </p>

            <div className="space-y-4">
              {schemes.map(scheme => (
                <Card key={scheme.id} className="p-4 border-l-4 border-l-primary hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="text-primary mt-1">
                          {getCategoryIcon(scheme.category)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-foreground">
                            {language === 'ml' ? scheme.titleMl : scheme.title}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {language === 'ml' ? scheme.descriptionMl : scheme.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-primary">
                            {language === 'ml' ? 'യോഗ്യത:' : 'Eligibility:'}
                          </span>
                          <p className="text-muted-foreground">
                            {language === 'ml' ? scheme.eligibilityMl : scheme.eligibility}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-primary">
                            {language === 'ml' ? 'ആനുകൂല്യം:' : 'Benefit:'}
                          </span>
                          <p className="text-muted-foreground">
                            {language === 'ml' ? scheme.benefitMl : scheme.benefit}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className={getStatusColor(scheme.status)}>
                          {scheme.status === 'open' && (language === 'ml' ? 'തുറന്നത്' : 'Open')}
                          {scheme.status === 'closing-soon' && (language === 'ml' ? 'ശീഘ്രം അവസാനിക്കുന്നു' : 'Closing Soon')}
                          {scheme.status === 'closed' && (language === 'ml' ? 'അവസാനിച്ചു' : 'Closed')}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{language === 'ml' ? 'അവസാന തീയതി:' : 'Deadline:'} {scheme.deadline}</span>
                        </div>
                        <span className="text-sm font-medium text-primary">{scheme.amount}</span>
                      </div>
                    </div>

                    <div className="ml-4">
                      {scheme.status !== 'closed' && (
                        <Button 
                          onClick={() => handleEnrollment(scheme)}
                          size="sm"
                          className="bg-primary hover:bg-primary-light"
                        >
                          {language === 'ml' ? 'അപേക്ഷിക്കുക' : 'Apply Now'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>

        <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
          <DialogContent className="w-[90vw] sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {language === 'ml' ? 'പദ്ധതിയിൽ അപേക്ഷിക്കുക' : 'Apply for Scheme'}
              </DialogTitle>
            </DialogHeader>
            {selectedScheme && (
              <div className="space-y-4 pt-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <h4 className="font-semibold text-primary">
                    {language === 'ml' ? selectedScheme.titleMl : selectedScheme.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ml' ? selectedScheme.benefitMl : selectedScheme.benefit}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'ml' ? 'പൂർണ്ണ നാമം *' : 'Full Name *'}</Label>
                    <Input
                      value={enrollmentData.name}
                      onChange={(e) => setEnrollmentData({...enrollmentData, name: e.target.value})}
                      placeholder={language === 'ml' ? 'നിങ്ങളുടെ പേര്' : 'Your name'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'ml' ? 'ഫോൺ നമ്പർ *' : 'Phone Number *'}</Label>
                    <Input
                      value={enrollmentData.phone}
                      onChange={(e) => setEnrollmentData({...enrollmentData, phone: e.target.value})}
                      placeholder={language === 'ml' ? 'ഫോൺ നമ്പർ' : 'Phone number'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'ml' ? 'ആധാർ നമ്പർ *' : 'Aadhaar Number *'}</Label>
                    <Input
                      value={enrollmentData.aadhaar}
                      onChange={(e) => setEnrollmentData({...enrollmentData, aadhaar: e.target.value})}
                      placeholder={language === 'ml' ? 'ആധാർ നമ്പർ' : 'Aadhaar number'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'ml' ? 'ഭൂമിയുടെ വലിപ്പം' : 'Land Size'}</Label>
                    <Input
                      value={enrollmentData.landSize}
                      onChange={(e) => setEnrollmentData({...enrollmentData, landSize: e.target.value})}
                      placeholder={language === 'ml' ? 'ഏക്കറിൽ' : 'In acres'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ml' ? 'പ്രധാന വിള' : 'Main Crop Type'}</Label>
                  <Input
                    value={enrollmentData.cropType}
                    onChange={(e) => setEnrollmentData({...enrollmentData, cropType: e.target.value})}
                    placeholder={language === 'ml' ? 'നെല്ല്, തെങ്ങ്, കുരുമുളക്' : 'Rice, Coconut, Pepper, etc.'}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ml' ? 'വിലാസം' : 'Address'}</Label>
                  <Textarea
                    value={enrollmentData.address}
                    onChange={(e) => setEnrollmentData({...enrollmentData, address: e.target.value})}
                    placeholder={language === 'ml' ? 'പൂർണ്ണ വിലാസം' : 'Complete address'}
                    rows={3}
                  />
                </div>

                <Button onClick={submitEnrollment} className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {language === 'ml' ? 'അപേക്ഷ സമർപ്പിക്കുക' : 'Submit Application'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}