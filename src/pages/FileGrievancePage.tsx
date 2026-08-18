import { useState, useEffect, useRef } from 'react';
import { Camera, FileText, MapPin, Mic, Send, Bot, CheckCircle2, ChevronRight, UploadCloud, Shield, Check, Sparkles, Building2, X, Video, Loader2, Download, ExternalLink } from 'lucide-react';
import { useVoiceInput } from '../lib/useVoiceInput';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { classifyDepartment } from '../lib/departmentClassifier';
import { LeafletMap } from '../components/ui/LeafletMap';
import { LocationSearchBox } from '../components/ui/LocationSearchBox';
import { detectDuplicates, calculateDistanceMeters } from '../lib/duplicateDetector';
import type { DuplicateCheckResult } from '../lib/duplicateDetector';
import { calculateSlaDeadline, formatSlaDeadline, SLA_RULES } from '../lib/slaConfig';
import { ADMIN_ACCOUNTS, getAdminIdForDepartment } from '../lib/adminConfig';
import { geocodeLocation } from '../lib/geocode';
import { AcknowledgementReceipt } from '../components/ui/AcknowledgementReceipt';
import { generateGrievancePdf } from '../lib/pdfUtils';

const FilePreview = ({ file, onRemove }: { file: File; onRemove: () => void }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <div className="relative group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-[#1A2332] aspect-square flex flex-col items-center justify-center">
      <button 
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-500"
      >
        <X size={14} />
      </button>
      {previewUrl ? (
        <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
      ) : (
        <div className="p-2 flex flex-col items-center text-center max-w-full">
          <Video size={24} className="text-gray-400 mb-2" />
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 truncate w-full px-1">{file.name}</span>
          <span className="text-[10px] text-gray-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
        </div>
      )}
    </div>
  );
};

export function FileGrievancePage() {
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState('');
  
  const { isListening, isCleaning, error: voiceError, startListening, stopListening } = useVoiceInput({
    onInterimTranscript: (text) => setDescription(text),
    onFinalCleanup: (cleanedText) => setDescription(cleanedText)
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [submittedGrievanceId, setSubmittedGrievanceId] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const hiddenReceiptRef = useRef<HTMLDivElement>(null);

  // GPS Coordinates & Location
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy?: number }>({
    lat: 26.8467,
    lng: 80.9462,
    accuracy: 10
  });
  const [locationAddress, setLocationAddress] = useState('Hazratganj Market Road, Lucknow');
  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatusText, setGpsStatusText] = useState('Automatic GPS permissions requested');

  // AI Classification & Duplicate Result State
  const [aiAnalysis, setAiAnalysis] = useState<{
    dept: string;
    assignedAdminId: string;
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    summary: string;
    priorityReason: string;
    reasonsList: string[];
    slaDeadline: number;
    duplicateResult?: DuplicateCheckResult;
  } | null>(null);

  const addressBoxRef = useRef<HTMLDivElement>(null);

  // Manual Geocoding State
  const [manualAddressInput, setManualAddressInput] = useState('');
  const [manualGeocodeLoading, setManualGeocodeLoading] = useState(false);
  const [manualGeocodeError, setManualGeocodeError] = useState('');
  const [manualGeocodeSuccess, setManualGeocodeSuccess] = useState(false);

  // Step 2 State
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const { addGrievance, grievances, masterIssues, createMasterIssue, linkToMasterIssue } = useStore();

  const watchIdRef = useRef<number | null>(null);


  // Automatic GPS Geolocation on step 3 mount
  useEffect(() => {
    if (step === 3) {
      handleLocation(true);
    } else {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [step]);

  const handleLocation = (isContinuous = false) => {
    setIsLocating(true);
    setGpsStatusText('Acquiring high-accuracy device location...');

    if ('geolocation' in navigator) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      const geoOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

      const successCb = async (position: GeolocationPosition) => {
        setIsLocating(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy || 8);

        setCoords(prev => {
          const dist = Math.abs(prev.lat - lat) + Math.abs(prev.lng - lng);
          if (dist > 0.0002) { // Only reverse geocode if significantly moved
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
              .then(r => r.json())
              .then(data => {
                if (data && data.display_name) {
                  setLocationAddress(data.display_name);
                }
              }).catch(() => {});
            return { lat, lng, accuracy };
          }
          return { ...prev, accuracy };
        });

        setGpsStatusText(`GPS Active (Accuracy: ~${accuracy}m)`);
      };

      const errorCb = (err: GeolocationPositionError) => {
        setIsLocating(false);
        setGpsStatusText('GPS Permission Denied or Unavailable. Please pick location manually on the map.');
        console.warn('Geolocation error:', err);
      };

      if (isContinuous) {
        watchIdRef.current = navigator.geolocation.watchPosition(successCb, errorCb, geoOptions);
      } else {
        navigator.geolocation.getCurrentPosition(successCb, errorCb, geoOptions);
      }
    } else {
      setIsLocating(false);
      setGpsStatusText('Geolocation not supported by browser. Pick location on map.');
    }
  };

  // Live Area Stats calculation
  const getAreaStats = () => {
    let active = 0;
    let resolved = 0;
    grievances.forEach(g => {
      const dist = calculateDistanceMeters(coords.lat, coords.lng, g.lat, g.lng);
      if (dist <= 2000) { // 2km radius
        if (g.status === 'Resolved') resolved++;
        else active++;
      }
    });
    return { active, resolved };
  };

  const validateAndAddFiles = (newFiles: File[]) => {
    setFileError('');
    const validTypes = ['image/jpeg', 'image/png', 'video/mp4'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 5;

    const validNewFiles: File[] = [];

    for (const file of newFiles) {
      if (!validTypes.includes(file.type)) {
        setFileError(`${file.name} — unsupported file type. Only JPG, PNG, and MP4 are allowed.`);
        return;
      }
      if (file.size > maxSize) {
        setFileError(`${file.name} — file exceeds 10MB limit.`);
        return;
      }
      validNewFiles.push(file);
    }

    if (stagedFiles.length + validNewFiles.length > maxFiles) {
      setFileError(`You can only attach up to ${maxFiles} files.`);
      return;
    }

    setStagedFiles(prev => [...prev, ...validNewFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndAddFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleManualGeocode = async () => {
    if (!manualAddressInput.trim()) return;
    setManualGeocodeLoading(true);
    setManualGeocodeError('');
    setManualGeocodeSuccess(false);

    try {
      const result = await geocodeLocation(manualAddressInput);
      if (result) {
        setCoords({ lat: result.lat, lng: result.lng, accuracy: 5 });
        setLocationAddress(manualAddressInput);
        setManualAddressInput('');
        setManualGeocodeSuccess(true);
        setTimeout(() => setManualGeocodeSuccess(false), 3000);
      } else {
        setManualGeocodeError("Couldn't find that address. Try adding city/area name, or search above, or drop a pin on the map.");
      }
    } catch (e) {
      setManualGeocodeError("Network error. Please try again or drop a pin on the map.");
    } finally {
      setManualGeocodeLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 3) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);

        // 1. Classify Department & Calculate Priority with Reasons
        const classResult = classifyDepartment(description);

        // 2. Perform AI Duplicate Detection
        const dupResult = detectDuplicates(
          {
            title: description.substring(0, 60),
            description,
            dept: classResult.department,
            lat: coords.lat,
            lng: coords.lng
          },
          masterIssues,
          grievances,
          500 // 500 meter radius
        );

        // 3. Compute SLA Deadline timestamp
        const deadlineMs = calculateSlaDeadline(classResult.department);

        setAiAnalysis({
          dept: classResult.department,
          assignedAdminId: classResult.assignedAdminId,
          priority: classResult.priority,
          summary: classResult.summary,
          priorityReason: classResult.priorityReason,
          reasonsList: classResult.reasonsList,
          slaDeadline: deadlineMs,
          duplicateResult: dupResult
        });

        setStep(4);
      }, 1400);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleDeptChange = (newDept: string) => {
    if (!aiAnalysis) return;
    const adminId = getAdminIdForDepartment(newDept);
    const deadlineMs = calculateSlaDeadline(newDept);
    setAiAnalysis(prev => prev ? {
      ...prev,
      dept: newDept,
      assignedAdminId: adminId,
      slaDeadline: deadlineMs
    } : null);
  };

  const handleSubmit = () => {
    const currentYear = new Date().getFullYear();
    const id = `NSETU-DEMO-${currentYear}-${Math.floor(10000 + Math.random() * 90000)}`;
    const dept = aiAnalysis?.dept || 'District Magistrate (DM)';
    const assignedAdminId = aiAnalysis?.assignedAdminId || getAdminIdForDepartment(dept);
    const nowTime = new Date().toLocaleString();
    const submissionMs = Date.now();
    const slaDeadline = aiAnalysis?.slaDeadline || calculateSlaDeadline(dept, submissionMs);

    let linkedMasterIssueId = aiAnalysis?.duplicateResult?.matchedMasterIssueId;

    // If duplicate score >= 90% and no master issue existed yet, create one
    if (aiAnalysis?.duplicateResult?.confidenceScore && aiAnalysis.duplicateResult.confidenceScore >= 90 && !linkedMasterIssueId) {
      linkedMasterIssueId = `MI-${Math.floor(1000 + Math.random() * 9000)}`;
      createMasterIssue({
        id: linkedMasterIssueId,
        title: description.substring(0, 60),
        dept,
        category: dept,
        priority: aiAnalysis.priority,
        status: 'Filed',
        lat: coords.lat,
        lng: coords.lng,
        location: locationAddress,
        linkedComplaintIds: [id],
        assignedAdminId,
        createdAt: nowTime,
        slaDeadline,
        escalatedToDM: false,
        auditTimeline: [
          { id: '1', timestamp: nowTime, event: `Master Issue auto-created from high confidence complaint cluster`, actor: 'AI Duplicate Engine' }
        ]
      });
    }

    addGrievance({
      id,
      title: description.substring(0, 60) + (description.length > 60 ? '...' : ''),
      citizen: 'Citizen Demo',
      dept,
      assignedAdminId,
      date: 'Just now',
      submissionTimeMs: submissionMs,
      status: 'Filed',
      priority: aiAnalysis?.priority || 'Medium',
      priorityReason: aiAnalysis?.priorityReason,
      sla: `${SLA_RULES[dept] || 48} hours expected resolution`,
      slaDeadline,
      slaColor: 'text-emerald-500',
      aiSummary: aiAnalysis?.summary || description,
      location: locationAddress,
      lat: coords.lat,
      lng: coords.lng,
      accuracy: coords.accuracy,
      reverseGeocodedLocation: locationAddress,
      masterIssueId: linkedMasterIssueId,
      duplicateConfidence: aiAnalysis?.duplicateResult?.confidenceScore,
      auditTimeline: [
        { id: '1', timestamp: nowTime, event: 'Complaint registered by citizen', actor: 'Citizen Demo' },
        { id: '2', timestamp: nowTime, event: `GPS captured (Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}, Accuracy: ~${coords.accuracy || 10}m)`, actor: 'Device Geolocation' },
        { id: '3', timestamp: nowTime, event: `Assigned to ${dept}`, actor: 'AI Routing Engine' },
        ...(linkedMasterIssueId ? [{ id: '4', timestamp: nowTime, event: `Linked to Master Issue ${linkedMasterIssueId} (${aiAnalysis?.duplicateResult?.confidenceScore}% confidence)`, actor: 'AI Duplicate Engine' }] : [])
      ],
      messages: [],
      attachments: stagedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      }))
    });

    if (linkedMasterIssueId && aiAnalysis?.duplicateResult?.confidenceScore) {
      linkToMasterIssue(id, linkedMasterIssueId, aiAnalysis.duplicateResult.confidenceScore);
    }

    setSubmittedGrievanceId(id);
    setStep(5);
  };

  const handleDownloadPdf = async () => {
    if (!hiddenReceiptRef.current || !submittedGrievanceId) return;
    setIsGeneratingPdf(true);
    try {
      await generateGrievancePdf(hiddenReceiptRef.current, submittedGrievanceId);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert("Couldn't generate PDF, please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (step === 5 && submittedGrievanceId) {
    const grievance = grievances.find(g => g.id === submittedGrievanceId);
    
    return (
      <div className="pt-24 pb-20 container mx-auto px-4 max-w-2xl text-center">
        <div className="bg-white dark:bg-surface-dark p-8 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Grievance Filed Successfully</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Your complaint has been registered and routed to the correct department.</p>

          <div className="bg-gray-50 dark:bg-[#1A2332] border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8 inline-block mx-auto text-left min-w-[300px] shadow-sm">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 text-center">Token / Registration No. (DEMO)</p>
            <p className="text-2xl md:text-3xl font-mono font-bold text-gray-900 dark:text-white tracking-widest text-center">{submittedGrievanceId}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="outline" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
              {isGeneratingPdf ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Download size={18} className="mr-2" />}
              Download Acknowledgement
            </Button>
            <Button variant="primary" onClick={() => navigate(`/track?id=${submittedGrievanceId}`)}>
              Track My Grievance <ExternalLink size={18} className="ml-2" />
            </Button>
          </div>
        </div>

        {/* Hidden receipt for PDF capture */}
        {grievance && (
          <div className="absolute top-0 left-0 opacity-0 pointer-events-none z-[-50]">
            <div ref={hiddenReceiptRef} className="w-[800px] bg-white text-black p-8">
              <AcknowledgementReceipt grievance={grievance} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 container mx-auto px-4 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">File a Grievance</h1>
        <p className="text-gray-500 dark:text-gray-400">Our AI will automatically capture your GPS, detect duplicates, and route to the correct department.</p>
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
                  placeholder="E.g., Large pothole on main highway link road causing traffic congestion and vehicle damage..."
                  className="min-h-[150px] resize-none pb-12"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                  <span className="text-xs text-gray-400">{description.length}/1000</span>
                  <div className="flex gap-2 items-center">
                    {isCleaning && <span className="text-xs text-primary animate-pulse flex items-center"><Sparkles size={12} className="mr-1" /> Cleaning text...</span>}
                    {voiceError && <span className="text-xs text-red-500">{voiceError}</span>}
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={isListening ? stopListening : startListening}
                      className={`h-8 transition-all ${isListening ? 'bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600' : 'text-primary bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100'}`}
                    >
                      {isListening ? (
                        <><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></div> Stop</>
                      ) : (
                        <><Mic size={16} className="mr-2" /> Voice Input</>
                      )}
                    </Button>
                  </div>
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Visual evidence helps AI verify and resolve issues 40% faster.</p>

              <div 
                className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
                  isDragging 
                    ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#1A2332] hover:bg-gray-100 dark:hover:bg-[#222d40]'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  accept="image/jpeg,image/png,video/mp4" 
                  onChange={handleFileSelect}
                />
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-primary mb-3">
                  <UploadCloud size={28} />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Click or drag photo here</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG or MP4 up to 10MB (max 5 files)</p>
                <Button type="button" variant="outline" size="sm" className="mt-4 pointer-events-none">
                  Browse Files
                </Button>
              </div>

              {fileError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800">
                  {fileError}
                </div>
              )}

              {stagedFiles.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mt-4">
                  {stagedFiles.map((file, i) => (
                    <FilePreview key={`${file.name}-${i}`} file={file} onRemove={() => setStagedFiles(prev => prev.filter((_, idx) => idx !== i))} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Automatic GPS + Leaflet Map */}
          {step === 3 && (
            <div className="space-y-6 animate-slide-in">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <MapPin className="mr-2 text-primary" size={20} />
                  Automatic GPS & Location Pin
                </h3>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                  {gpsStatusText}
                </span>
              </div>

              {/* Location Search + Real Leaflet Map (imperative API — do not swap for react-leaflet MapContainer) */}
              <div className="relative">
                <LocationSearchBox
                  onSelect={(result) => {
                    setCoords({ lat: result.lat, lng: result.lng, accuracy: 5 });
                    setLocationAddress(result.address);
                    setTimeout(() => {
                      addressBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 150);
                  }}
                />

                <div className="mt-2">
                  <LeafletMap
                    mode="picker"
                    center={[coords.lat, coords.lng]}
                    zoom={14}
                    pickerPosition={coords}
                    onPickerPositionChange={(pos) => {
                      setCoords({ lat: pos.lat, lng: pos.lng, accuracy: 5 });
                      if (pos.address) setLocationAddress(pos.address);
                    }}
                    height="340px"
                  />
                </div>

                <div ref={addressBoxRef} className="mt-3 flex justify-between items-center bg-gray-50 dark:bg-[#1A2332] p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                  <div className="text-xs text-gray-600 dark:text-gray-300 flex-1 mr-2">
                    <span className="font-semibold text-gray-900 dark:text-white block">Selected Address:</span>
                    <span className="truncate block">{locationAddress}</span>
                    <span className="font-mono text-[10px] text-gray-400">Lat: {coords.lat.toFixed(5)}, Lng: {coords.lng.toFixed(5)}</span>
                  </div>
                  <Button type="button" size="sm" onClick={() => handleLocation(false)} isLoading={isLocating} variant="outline" className="shrink-0 text-xs">
                    <MapPin size={14} className="mr-1" /> Re-sync GPS
                  </Button>
                </div>

                {/* Manual Address Input Field */}
                <div className="mt-3 bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Or type your full address
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={manualAddressInput}
                      onChange={(e) => setManualAddressInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualGeocode()}
                      placeholder="e.g., 123 Main St, IIT Kanpur, UP"
                      className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-[#1A2332] border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:text-white placeholder:text-gray-400"
                    />
                    <Button 
                      type="button" 
                      onClick={handleManualGeocode} 
                      isLoading={manualGeocodeLoading}
                      disabled={manualGeocodeLoading || !manualAddressInput.trim()}
                      className="shrink-0"
                    >
                      Locate
                    </Button>
                  </div>
                  {manualGeocodeError && (
                    <p className="mt-2 text-xs text-red-500 font-medium">
                      {manualGeocodeError}
                    </p>
                  )}
                  {manualGeocodeSuccess && (
                    <p className="mt-2 text-xs text-emerald-500 font-medium flex items-center">
                      <Check size={14} className="mr-1" /> Location found and pin updated
                    </p>
                  )}
                </div>

                {/* Live Area Statistics */}
                <div className="mt-4 bg-gradient-to-br from-primary/10 to-blue-50 dark:from-primary/20 dark:to-blue-900/10 rounded-xl p-4 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={18} className="text-primary" />
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Live Area Insights (2km Radius)</h4>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                    Before you submit, here's what's happening in your selected area:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-surface-dark p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Active Issues</span>
                      <span className="text-lg font-bold text-warning">{getAreaStats().active}</span>
                    </div>
                    <div className="bg-white dark:bg-surface-dark p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Resolved</span>
                      <span className="text-lg font-bold text-emerald-500">{getAreaStats().resolved}</span>
                    </div>
                  </div>
                </div>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Multi-Admin Routing Engine Processing...</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                Analyzing text keywords, calculating spatial distance, computing priority score, and matching with responsible department admin.
              </p>
            </div>
          )}

          {/* Step 4: AI Review & AI Duplicate Detection Results */}
          {step === 4 && !isAnalyzing && aiAnalysis && (
            <div className="space-y-6 animate-slide-in">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Shield className="mr-2 text-primary" size={20} />
                Review & Confirm Multi-Admin Routing
              </h3>

              {/* AI Duplicate Detection Banner */}
              {aiAnalysis.duplicateResult?.isDuplicate ? (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700 animate-pulse-subtle">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm mb-1">
                    <Sparkles size={18} className="text-amber-600" />
                    <span>AI DUPLICATE ISSUE DETECTED ({aiAnalysis.duplicateResult.confidenceScore}% Confidence)</span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                    {aiAnalysis.duplicateResult.reason}
                  </p>
                  <div className="p-2.5 bg-white dark:bg-[#1A2332] rounded-lg border border-amber-200 dark:border-amber-800 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Matched Issue: </span>
                      <span>{aiAnalysis.duplicateResult.matchedTitle}</span>
                    </div>
                    {aiAnalysis.duplicateResult.matchedMasterIssueId && (
                      <Badge variant="warning">
                        Master Issue {aiAnalysis.duplicateResult.matchedMasterIssueId}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 italic">
                    Your complaint will be automatically linked to Master Issue {aiAnalysis.duplicateResult.matchedMasterIssueId || 'Ticket'}, ensuring consolidated authority response while preserving your individual complaint tracking!
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <Check size={16} />
                  <span>AI Duplicate Engine verified: Distinct real-world problem (no spatial duplicates within 500m radius).</span>
                </div>
              )}

              {/* AI Classification & Department Routing Override Box */}
              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-lg flex items-center">
                  <Bot size={12} className="mr-1" /> Multi-Admin Routing Active
                </div>

                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Department Routing & Priority</h4>

                {/* Department Selection Selector */}
                <div className="mb-4 bg-white dark:bg-surface-dark p-3.5 rounded-lg border border-primary/30 shadow-xs">
                  <label className="text-xs font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                    <Building2 size={14} className="text-primary" />
                    Target Department Admin (AI Selected - Change if needed):
                  </label>
                  <select
                    value={aiAnalysis.dept}
                    onChange={(e) => handleDeptChange(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#1A2332] border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-xs font-semibold text-primary dark:text-blue-400 focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    {ADMIN_ACCOUNTS.map(acc => (
                      <option key={acc.id} value={acc.department}>
                        {acc.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Target Department</p>
                    <p className="font-semibold text-sm text-primary dark:text-blue-400">{aiAnalysis.dept}</p>
                  </div>
                  <div className="bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assigned Authority</p>
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Department Officer</p>
                  </div>
                  <div className="bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assigned Priority</p>
                    <Badge variant={aiAnalysis.priority === 'Critical' || aiAnalysis.priority === 'High' ? 'alert' : aiAnalysis.priority === 'Medium' ? 'warning' : 'primary'}>
                      {aiAnalysis.priority}
                    </Badge>
                  </div>
                </div>

                {/* Priority Reason Explanation */}
                <div className="p-3 bg-white dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-800 text-xs mb-4">
                  <span className="font-bold text-gray-900 dark:text-white block mb-1">AI Priority Rationale & SLA:</span>
                  <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">{aiAnalysis.priorityReason}</p>
                  <p className="text-gray-500 text-[11px]">SLA Target Deadline: <strong>{formatSlaDeadline(aiAnalysis.slaDeadline)}</strong></p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">AI Generated Summary</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                    "{aiAnalysis.summary}"
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-start">
                  <MapPin size={16} className="text-gray-400 mt-0.5 mr-2 shrink-0" />
                  <div>
                    <p className="font-medium">{locationAddress}</p>
                    <p className="text-xs text-gray-400 font-mono">Lat: {coords.lat.toFixed(5)}, Lng: {coords.lng.toFixed(5)}</p>
                  </div>
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
