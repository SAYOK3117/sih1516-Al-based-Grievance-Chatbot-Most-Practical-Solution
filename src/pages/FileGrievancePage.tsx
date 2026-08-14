import { useState } from 'react';
import { Camera, FileText, MapPin, Mic, Send, Bot, CheckCircle2, ChevronRight, UploadCloud, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';

export function FileGrievancePage() {
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{ dept: string; priority: string; summary: string } | null>(null);
  const [locationAddress, setLocationAddress] = useState('Sector 4 Market Road, City Center');
  const [isLocating, setIsLocating] = useState(false);
  const navigate = useNavigate();
  const { addGrievance } = useStore();

  const handleNext = () => {
    if (step === 3) {
      // Analyze with AI before review step
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        setAiAnalysis({
          dept: 'General Public Issue',
          priority: 'Medium',
          summary: description || 'No description provided.'
        });
        setStep(4);
      }, 2000);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          setLocationAddress(`Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`);
        },
        () => {
          setIsLocating(false);
          alert('Could not get location. Please enter manually.');
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  const handleSubmit = () => {
    const id = `G-2023-${Math.floor(1000 + Math.random() * 9000)}`;
    addGrievance({
      id,
      title: description.substring(0, 50) + '...',
      citizen: 'Citizen Demo',
      dept: aiAnalysis?.dept || 'General',
      date: 'Just now',
      status: 'Filed',
      priority: aiAnalysis?.priority || 'Medium',
      sla: '7 days left',
      slaColor: 'text-emerald-500',
      aiSummary: aiAnalysis?.summary || description,
      location: locationAddress,
      messages: []
    });
    navigate(`/track?id=${id}`);
  };

  return (
    <div className="pt-24 pb-20 container mx-auto px-4 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">File a Grievance</h1>
        <p className="text-gray-500 dark:text-gray-400">Our AI will automatically route this to the correct department.</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center mb-8 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto">
        {['Details', 'Attachments', 'Location', 'Review'].map((label, i) => (
          <div key={label} className="flex items-center shrink-0">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${step > i + 1 ? 'bg-accent text-white' : step === i + 1 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}`}>
              {step > i + 1 ? <CheckCircle2 size={16} /> : i + 1}
            </div>
            <span className={`ml-2 text-sm font-medium ${step >= i + 1 ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
              {label}
            </span>
            {i < 3 && <ChevronRight size={16} className="mx-4 text-gray-300 dark:text-gray-700" />}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 md:p-8">
          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-6 animate-slide-in">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FileText className="mr-2 text-primary" size={20} />
                  Describe the Issue
                </h3>
                <div className="flex items-center space-x-2 text-sm text-primary dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                  <Bot size={16} />
                  <span>AI Smart Detect enabled</span>
                </div>
              </div>
              
              <div className="relative">
                <Textarea 
                  placeholder="E.g., The open drain near Sector 4 market is blocked and dirty water is flowing onto the street..."
                  className="min-h-[150px] resize-none pb-12"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                  <span className="text-xs text-gray-400">{description.length}/1000</span>
                  <Button type="button" variant="ghost" size="sm" className="h-8 text-primary bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100">
                    <Mic size={16} className="mr-2" /> Voice Input
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Attachments */}
          {step === 2 && (
            <div className="space-y-6 animate-slide-in">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Camera className="mr-2 text-primary" size={20} />
                Add Photos/Videos
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Visual evidence helps officers resolve the issue 40% faster.</p>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-10 flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-[#1A2332] hover:bg-gray-100 dark:hover:bg-[#222d40] transition-colors cursor-pointer">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-primary mb-4">
                  <UploadCloud size={32} />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Click or drag files here</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">JPG, PNG or MP4 up to 10MB</p>
                <Button type="button" variant="outline" size="sm" className="mt-4">
                  Browse Files
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-6 animate-slide-in">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <MapPin className="mr-2 text-primary" size={20} />
                Pin Location
              </h3>
              
              <div className="h-[300px] bg-gray-200 dark:bg-gray-800 rounded-xl relative overflow-hidden flex items-center justify-center">
                {/* Mock Map Background */}
                <div className="absolute inset-0 opacity-30 dark:opacity-20" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-alert">
                  <MapPin size={48} fill="currentColor" className="drop-shadow-lg" />
                </div>
                
                <div className="absolute top-4 left-4 right-4 bg-white dark:bg-surface-dark p-2 rounded-lg shadow-md flex items-center">
                  <MapPin size={16} className="text-gray-400 ml-2 mr-3" />
                  <input type="text" value={locationAddress} onChange={(e) => setLocationAddress(e.target.value)} className="w-full bg-transparent border-none focus:outline-none text-sm dark:text-white" />
                </div>
                
                <Button type="button" onClick={handleLocation} isLoading={isLocating} className="absolute bottom-4 right-4 shadow-lg">
                  <MapPin size={16} className="mr-2" /> Use Current Location
                </Button>
              </div>
            </div>
          )}

          {/* AI Analysis Loading State */}
          {isAnalyzing && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-slide-in">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-100 dark:border-gray-800 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                <Bot size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI is analyzing your complaint...</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                Extracting details, determining priority, and routing to the correct department.
              </p>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && !isAnalyzing && aiAnalysis && (
            <div className="space-y-6 animate-slide-in">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Shield className="mr-2 text-primary" size={20} />
                Review & Submit
              </h3>
              
              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center">
                  <Bot size={12} className="mr-1" /> AI Processed
                </div>
                
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Detected Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Department</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{aiAnalysis.dept}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assigned Priority</p>
                    <Badge variant={aiAnalysis.priority === 'High' ? 'alert' : 'warning'}>{aiAnalysis.priority}</Badge>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">AI Summary</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                    "{aiAnalysis.summary}"
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <div className="flex items-start mb-2">
                  <MapPin size={16} className="text-gray-400 mt-0.5 mr-2" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">{locationAddress}</p>
                </div>
                <div className="flex items-start">
                  <Camera size={16} className="text-gray-400 mt-0.5 mr-2" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">2 files attached</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isAnalyzing && (
            <div className="mt-8 flex justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" variant="ghost" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>
                Back
              </Button>
              
              {step < 4 ? (
                <Button type="button" onClick={handleNext} disabled={step === 1 && description.length < 10}>
                  Next Step <ChevronRight size={18} className="ml-2" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} className="bg-accent hover:bg-emerald-700">
                  Submit Grievance <Send size={18} className="ml-2" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
