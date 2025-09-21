import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, Settings, Volume2 } from "lucide-react";
import { useState } from "react";

export const VoiceInstallGuide = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <span className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Install Malayalam/Indian Voices
        </span>
        <span>{isOpen ? '▼' : '▶'}</span>
      </Button>

      {isOpen && (
        <Card className="mt-2 p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            How to Install Indian Voices on Windows
          </h3>
          
          <div className="space-y-4 text-sm">
            <div className="border-l-4 border-blue-500 pl-3">
              <p className="font-medium text-blue-300">Method 1: Windows Settings</p>
              <ol className="list-decimal list-inside space-y-1 text-xs mt-1">
                <li>Open Windows Settings (Windows + I)</li>
                <li>Go to "Time & Language" → "Speech"</li>
                <li>Click "Add languages" or "Manage voices"</li>
                <li>Download Hindi (India) or Tamil (India) voices</li>
                <li>Restart your browser</li>
              </ol>
            </div>

            <div className="border-l-4 border-green-500 pl-3">
              <p className="font-medium text-green-300">Method 2: Microsoft Store</p>
              <ol className="list-decimal list-inside space-y-1 text-xs mt-1">
                <li>Open Microsoft Store</li>
                <li>Search for "Mobile Plans" or language packs</li>
                <li>Install Indian language packs (Hindi, Tamil)</li>
                <li>Restart your browser</li>
              </ol>
            </div>

            <div className="border-l-4 border-purple-500 pl-3">
              <p className="font-medium text-purple-300">Why Hindi Instead of Malayalam?</p>
              <ul className="list-disc list-inside space-y-1 text-xs mt-1">
                <li><strong>Malayalam TTS not available:</strong> Microsoft doesn't include Malayalam voices in Windows</li>
                <li><strong>Hindi is closest alternative:</strong> Similar phonetics and Indian pronunciation</li>
                <li><strong>Better than English:</strong> Hindi voices handle Malayalam sounds much better</li>
                <li><strong>Actually works:</strong> Hindi voices are available in most Windows installations</li>
              </ul>
            </div>

            <div className="border-l-4 border-yellow-500 pl-3">
              <p className="font-medium text-yellow-300">Available Indian Voices:</p>
              <ul className="list-disc list-inside space-y-1 text-xs mt-1">
                <li><strong>Hindi:</strong> Microsoft Kalpana, Hemant (Best for Malayalam)</li>
                <li><strong>Tamil:</strong> Microsoft Valluvar (Also good for Malayalam)</li>
                <li><strong>Telugu:</strong> Microsoft Chitra</li>
                <li><strong>Bengali:</strong> Microsoft Bashkar</li>
                <li><strong>Malayalam:</strong> ❌ Not available in Windows</li>
              </ul>
            </div>

            <div className="border-l-4 border-green-500 pl-3">
              <p className="font-medium text-green-300">Alternative: Online Malayalam TTS</p>
              <ul className="list-disc list-inside space-y-1 text-xs mt-1">
                <li><strong>Google Translate:</strong> Has Malayalam TTS (copy text → translate.google.com)</li>
                <li><strong>Azure Cognitive Services:</strong> Professional Malayalam voices (for developers)</li>
                <li><strong>Browser Extensions:</strong> Some extensions provide additional TTS voices</li>
              </ul>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
              <p className="text-blue-200 text-xs">
                <strong>💡 Current Strategy:</strong> This app will use Malayalam voices if available on your system, 
                otherwise it falls back to Hindi voices (which sound much better than English for Malayalam text).
                After installing new voices, refresh this page and check the voice debugger.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};