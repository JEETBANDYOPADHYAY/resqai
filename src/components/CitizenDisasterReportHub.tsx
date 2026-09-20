import React, { useState, useRef } from 'react';
import {
  Camera,
  Video,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Sparkles,
  Radio,
  FileX2,
  Lock,
  UserCheck,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import {
  CitizenDisasterMediaReport,
  DisasterHazardCategory,
  VerificationCheckResult,
  EmergencyUnit,
} from '../types';
import {
  DEMO_PRESETS,
  SAMPLE_FLOOD_PHOTO_DATA_URL,
} from '../data/citizenReportSamples';
import { evaluateMediaIntegrityAndRelevance } from '../utils/mediaVerificationEngine';
import { audioEngine } from '../utils/audioAlert';

interface CitizenDisasterReportHubProps {
  reports: CitizenDisasterMediaReport[];
  onSubmitVerifiedReport: (report: CitizenDisasterMediaReport) => void;
  onFocusCoordinates?: (coords: [number, number]) => void;
  onToggleRoadBlockAtLocation?: (locationName: string) => void;
  currentProfile?: string;
  onCitizenReportAction?: (reportId: string, action: string) => void;
  onAssignUnit?: (unitId: string, incidentId: string) => void;
  units?: EmergencyUnit[];
}

export const CitizenDisasterReportHub: React.FC<CitizenDisasterReportHubProps> = ({
  reports,
  onSubmitVerifiedReport,
  onFocusCoordinates,
  onToggleRoadBlockAtLocation,
  currentProfile = 'CITIZEN',
  onCitizenReportAction,
  onAssignUnit,
  units = [],
}) => {
  const isCitizen = currentProfile === 'CITIZEN';

  // Sub-tabs for Emergency Command View only
  const [commandSubTab, setCommandSubTab] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');

  // Form State (Citizen Upload & Inform)
  const [citizenName, setCitizenName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [affectedAreaName, setAffectedAreaName] = useState('');
  const [coordinates, setCoordinates] = useState<[number, number]>([22.6050, 88.4250]);
  const [category, setCategory] = useState<DisasterHazardCategory>('URBAN_FLOODING');
  const [severity, setSeverity] = useState<'CRITICAL' | 'HIGH' | 'MODERATE'>('CRITICAL');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<'PHOTO' | 'VIDEO'>('PHOTO');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaFileName, setMediaFileName] = useState('');
  const [mediaFileSizeKb, setMediaFileSizeKb] = useState(0);
  const [captureTimestamp, setCaptureTimestamp] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );

  // Verification State for Citizen's own submission
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState<string>('');
  const [lastResult, setLastResult] = useState<{
    report: CitizenDisasterMediaReport;
    verification: VerificationCheckResult;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const approvedReports = reports.filter((r) => r.verificationStatus === 'APPROVED');
  const rejectedReports = reports.filter((r) => r.verificationStatus === 'REJECTED');

  // Clear uploaded media from upload section
  const handleClearMedia = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setMediaUrl('');
    setMediaFileName('');
    setMediaFileSizeKb(0);
    setMediaType('PHOTO');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Completely reset the form for the next user and report
  const handleResetForm = () => {
    handleClearMedia();
    setCitizenName('');
    setContactNumber('');
    setDescription('');
    setAffectedAreaName('');
    setCaptureTimestamp(new Date().toISOString().slice(0, 16));
    setLastResult(null);
  };

  // Handle file selection (photo / video)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');
    setMediaType(isVideo ? 'VIDEO' : 'PHOTO');
    setMediaFileName(file.name);
    setMediaFileSizeKb(Math.round(file.size / 1024));

    const fileDate = file.lastModified ? new Date(file.lastModified) : new Date();
    setCaptureTimestamp(fileDate.toISOString().slice(0, 16));

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setMediaUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
    setLastResult(null);
  };

  // Populate from demo test presets (available in citizen upload view for quick testing)
  const handleApplyPreset = (presetId: string) => {
    const preset = DEMO_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setAffectedAreaName(preset.areaName);
    setCoordinates(preset.coordinates);
    setCategory(preset.category);
    setSeverity(preset.severity);
    setDescription(preset.description);
    setMediaType(preset.mediaType);
    setMediaUrl(preset.mediaUrl);
    setMediaFileName(preset.fileName);
    setMediaFileSizeKb(preset.fileSizeKb);

    try {
      const dt = new Date(preset.captureTimestamp);
      setCaptureTimestamp(dt.toISOString().slice(0, 16));
    } catch {
      setCaptureTimestamp(new Date().toISOString().slice(0, 16));
    }

    setLastResult(null);
  };

  // Submit and verify workflow (for Citizen View)
  const handleVerifyAndSubmit = async () => {
    if (!affectedAreaName.trim() || !description.trim()) {
      alert('Please provide the affected location name and description of the hazard.');
      return;
    }
    if (!mediaUrl) {
      alert('Please upload a photo or video before submitting.');
      return;
    }

    setIsVerifying(true);
    setVerificationStep('Step 1/2: Validating timestamp recency (<24h active window)...');

    try {
      const payload = {
        citizenName,
        contactNumber,
        affectedAreaName,
        coordinates,
        category,
        severity,
        description,
        mediaType,
        mediaUrl,
        mediaFileName,
        mediaFileSizeKb,
        captureTimestamp,
      };

      setVerificationStep('Step 2/2: Multimodal AI screening for flood/landslide markers...');

      const response = await fetch('/api/citizen-reports/submit-and-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.report) {
          setLastResult({
            report: data.report,
            verification: data.verification,
          });
          onSubmitVerifiedReport(data.report);

          // Clear uploaded photo, citizen details & description so they do not stay visible for the next user
          handleClearMedia();
          setDescription('');
          setCitizenName('');
          setContactNumber('');
          setAffectedAreaName('');

          if (data.report.verificationStatus === 'APPROVED') {
            audioEngine.playSosSuccess();
          } else {
            audioEngine.playAlertChime();
          }
          return;
        }
      }

      // Offline / Local Fallback
      const localVerif = evaluateMediaIntegrityAndRelevance({
        fileName: mediaFileName,
        fileSizeBytes: mediaFileSizeKb * 1024,
        captureTimestamp,
        category,
        areaName: affectedAreaName,
        description,
        mediaType,
        mediaDataUrl: mediaUrl,
      });

      const fallbackReport: CitizenDisasterMediaReport = {
        id: `rep-cit-${Date.now()}`,
        citizenName,
        contactNumber,
        affectedAreaName,
        coordinates,
        category,
        severity,
        description,
        mediaType,
        mediaUrl,
        mediaFileName,
        mediaFileSizeKb,
        captureTimestamp,
        submittedAt: new Date().toISOString(),
        verificationStatus: localVerif.aiVerdict,
        verification: localVerif,
        managementNotified: localVerif.aiVerdict === 'APPROVED',
        notifiedAt: localVerif.aiVerdict === 'APPROVED' ? new Date().toISOString() : undefined,
      };

      setLastResult({
        report: fallbackReport,
        verification: localVerif,
      });
      onSubmitVerifiedReport(fallbackReport);

      // Clear uploaded photo, citizen details & description so they do not stay visible for the next user
      handleClearMedia();
      setDescription('');
      setCitizenName('');
      setContactNumber('');
      setAffectedAreaName('');

      if (fallbackReport.verificationStatus === 'APPROVED') {
        audioEngine.playSosSuccess();
      } else {
        audioEngine.playAlertChime();
      }
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setIsVerifying(false);
      setVerificationStep('');
    }
  };

  // Timestamp recency check calculation
  const captureDate = new Date(captureTimestamp);
  const now = new Date();
  const timeDiffMinutes = Math.round((now.getTime() - captureDate.getTime()) / (1000 * 60));
  const isStale = timeDiffMinutes > 24 * 60;
  const isFuture = timeDiffMinutes < -120;

  // ==========================================
  // 1. CITIZEN VIEW: UPLOAD & INFORM ONLY
  // No feed of other citizens, no rejected gallery
  // ==========================================
  if (isCitizen) {
    return (
      <div
        id="citizen-ground-report-portal"
        className="bg-slate-900/95 border border-slate-800/90 rounded-xl shadow-2xl p-4 sm:p-5 flex flex-col space-y-4 backdrop-blur-md"
      >
        {/* Citizen Portal Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                Citizen Disaster Ground Reporting
                <span className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  DIRECT TO EMERGENCY DISPATCH
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Upload real-time photos or videos to inform disaster management teams of waterlogging, submerged roads, landslides, or hazards.
              </p>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 self-start md:self-auto">
            Citizen Ground Intelligence Link
          </div>
        </div>

        {/* Quick Test Demo Scenarios (helps the user easily test photo/video upload & verification) */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quick Fill Demo Scenarios (Click to test photo/video upload):
            </span>
            <span className="text-[10px] text-slate-400 font-mono">1-click test fill</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {DEMO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset.id)}
                className={`text-left p-2 rounded-md border text-xs transition-all flex flex-col justify-between ${
                  preset.expectedVerdict === 'APPROVED'
                    ? 'border-emerald-800/60 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-200'
                    : 'border-rose-800/60 bg-rose-950/20 hover:bg-rose-900/30 text-rose-200'
                }`}
              >
                <div className="font-semibold text-[11px] truncate">{preset.name}</div>
                <div className="flex items-center justify-between mt-1 text-[10px] font-mono">
                  <span
                    className={`px-1 rounded ${
                      preset.expectedVerdict === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {preset.expectedVerdict === 'APPROVED' ? '✓ Fresh Footage' : '⚠️ Stale / Non-Disaster'}
                  </span>
                  <span className="text-slate-400">{preset.mediaType}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* The Citizen Upload & Inform Form */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left Column: Affected Location & Hazard Details */}
          <div className="md:col-span-5 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span>Affected Disaster Location / Landmark *</span>
                <span className="text-[10px] text-slate-400 font-mono">Type or select</span>
              </label>
              <input
                id="input-affected-area"
                type="text"
                value={affectedAreaName}
                onChange={(e) => setAffectedAreaName(e.target.value)}
                placeholder="e.g. VIP Road Underpass, College Street..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
              {/* Quick Location Chips */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {[
                  { name: 'Baguiati VIP Road', coords: [22.6050, 88.4250] },
                  { name: 'Kestopur Canal Breach', coords: [22.6120, 88.4310] },
                  { name: 'College Street Flooded', coords: [22.5760, 88.3630] },
                  { name: 'Belghoria Hillside', coords: [22.6520, 88.3880] },
                ].map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => {
                      setAffectedAreaName(loc.name);
                      setCoordinates(loc.coords as [number, number]);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Hazard Category & Severity */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Hazard Category</label>
                <select
                  id="select-hazard-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DisasterHazardCategory)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                >
                  <option value="URBAN_FLOODING">Urban Waterlogging / Flood</option>
                  <option value="DAM_OVERFLOW">Dam / Canal Overflow</option>
                  <option value="LANDSLIDE_DEBRIS">Landslide / Mud Debris</option>
                  <option value="STRUCTURAL_COLLAPSE">Structural Collapse</option>
                  <option value="ROAD_SUBMERGED">Submerged Road / Culvert</option>
                  <option value="ELECTRICAL_HAZARD">Downed Powerline Hazard</option>
                  <option value="STRANDED_CITIZENS">Stranded Civilians</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Severity Level</label>
                <select
                  id="select-severity-level"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-red-500 font-mono font-semibold"
                >
                  <option value="CRITICAL">Critical (Life Threatening)</option>
                  <option value="HIGH">High (Road Impassable)</option>
                  <option value="MODERATE">Moderate (Partial Hazard)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Ground Situation Description *</label>
              <textarea
                id="textarea-ground-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe water depth, vehicle stallings, road blockage, or civilians in need of evacuation..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            {/* Citizen Details */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Your Name / Handle</label>
                <input
                  id="input-citizen-name"
                  type="text"
                  autoComplete="off"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  placeholder="e.g. Volunteer / Citizen Name"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Contact Phone (Optional)</label>
                <input
                  id="input-contact-number"
                  type="tel"
                  autoComplete="off"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="e.g. +91 98310 00000"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-mono placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Photo / Video Upload & Timestamp */}
          <div className="md:col-span-7 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-red-400" />
                  Field Photo or Video Evidence *
                </span>
                <span className="text-[10px] text-slate-400">JPG, PNG, WEBP, MP4, MOV</span>
              </label>

              {/* Upload & Dropzone Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative cursor-pointer border-2 border-dashed border-slate-700 hover:border-red-500/80 bg-slate-950/70 hover:bg-slate-900/80 transition-all rounded-lg p-3 text-center overflow-hidden"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  capture="environment"
                  onClick={(e) => {
                    (e.target as HTMLInputElement).value = '';
                  }}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {mediaUrl ? (
                  <div className="space-y-2">
                    <div className="relative max-h-52 w-full rounded-md overflow-hidden bg-black/80 flex items-center justify-center border border-slate-700 shadow-inner">
                      {mediaType === 'VIDEO' ? (
                        <div className="w-full flex flex-col items-center justify-center p-4 bg-slate-950">
                          <Video className="w-12 h-12 text-red-400 animate-pulse mb-2" />
                          <span className="text-xs text-slate-300 font-mono">{mediaFileName}</span>
                          <span className="text-[10px] text-slate-500">Video Evidence Loaded ({mediaFileSizeKb} KB)</span>
                        </div>
                      ) : (
                        <img
                          src={mediaUrl}
                          alt="Uploaded disaster evidence preview"
                          className="max-h-52 w-full object-contain rounded"
                        />
                      )}

                      {/* Top badges & remove photo button */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Media Loaded
                      </div>
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono text-slate-200 border border-white/10">
                          {mediaType} • {mediaFileSizeKb} KB
                        </span>
                        <button
                          type="button"
                          title="Remove / clear this photo"
                          onClick={handleClearMedia}
                          className="p-1 rounded-md bg-rose-950/90 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-700/80 transition-colors shadow"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
                      <span className="font-mono text-[11px] text-slate-300 truncate max-w-[200px]">
                        {mediaFileName}
                      </span>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="text-blue-400 hover:text-blue-300 text-[11px] font-medium flex items-center gap-1 hover:underline"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={handleClearMedia}
                          className="text-rose-400 hover:text-rose-300 text-[11px] font-medium flex items-center gap-1 hover:underline"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove Photo
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-7 flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="text-xs text-slate-200 font-semibold">
                      Click to upload or drag & drop live photo / video
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Mobile device camera or photo gallery supported
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 bg-slate-900/90 px-2.5 py-0.5 rounded border border-slate-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Multimodal AI visual verification & recency screening
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timestamp Extraction & Recency Integrity */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  Capture Timestamp (When Photo/Video Was Clicked):
                </label>
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                    isStale
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : isFuture
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {isStale
                    ? '⚠️ STALE (>24H OLD)'
                    : isFuture
                    ? '⚠️ INVALID FUTURE TIMESTAMP'
                    : `✓ LIVE & FRESH (<24h)`}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <input
                  id="input-capture-timestamp"
                  type="datetime-local"
                  value={captureTimestamp}
                  onChange={(e) => setCaptureTimestamp(e.target.value)}
                  className="w-full sm:w-auto flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-red-500"
                />
                <div className="text-[11px] text-slate-400 font-mono w-full sm:w-auto">
                  {timeDiffMinutes <= 0
                    ? 'Clicked just now'
                    : timeDiffMinutes < 60
                    ? `Clicked ${timeDiffMinutes}m ago`
                    : timeDiffMinutes < 24 * 60
                    ? `Clicked ${Math.round(timeDiffMinutes / 60)}h ago`
                    : `Clicked ${Math.round(timeDiffMinutes / (24 * 60))} days ago (Stale)`}
                </div>
              </div>

              <p className="text-[10px] text-slate-400">
                To prevent false alerts, automated verification confirms that footage was clicked within the active 24-hour disaster window.
              </p>
            </div>

            {/* Submission Button */}
            <div>
              <button
                id="btn-verify-and-submit-media"
                type="button"
                disabled={isVerifying}
                onClick={handleVerifyAndSubmit}
                className={`w-full py-3 px-4 rounded-lg font-bold text-xs sm:text-sm text-white shadow-lg transition-all flex items-center justify-center space-x-2 ${
                  isVerifying
                    ? 'bg-slate-700 cursor-wait opacity-80'
                    : 'bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.99] border border-red-400/30 shadow-red-900/30'
                }`}
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>{verificationStep || 'Analyzing media relevance and timestamp...'}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 text-white" />
                    <span>Upload & Inform Emergency Operations Team</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* CITIZEN SUBMISSION RECEIPT (Shows feedback ONLY for their own submission) */}
        {lastResult && (
          <div
            className={`p-4 rounded-xl border transition-all animate-in fade-in duration-300 ${
              lastResult.report.verificationStatus === 'APPROVED'
                ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/50'
                : 'bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-950/50'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                {lastResult.report.mediaUrl && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-700 bg-black shrink-0 relative">
                    <img
                      src={lastResult.report.mediaUrl}
                      alt="Submitted media evidence"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-mono text-center text-slate-300 py-0.5">
                      Submitted
                    </span>
                  </div>
                )}
                <div
                  className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                    lastResult.report.verificationStatus === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {lastResult.report.verificationStatus === 'APPROVED' ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : (
                    <ShieldAlert className="w-6 h-6" />
                  )}
                </div>
                <div className="space-y-1">
                  <h3
                    className={`text-sm sm:text-base font-bold ${
                      lastResult.report.verificationStatus === 'APPROVED'
                        ? 'text-emerald-300'
                        : 'text-rose-300'
                    }`}
                  >
                    {lastResult.report.verificationStatus === 'APPROVED'
                      ? '✓ REPORT VERIFIED & DISPATCHED TO DISASTER MANAGEMENT TEAM'
                      : '⚠️ VERIFICATION NOTICE: REPORT NOT DISPATCHED'}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    {lastResult.verification.verdictSummary}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Location: <span className="text-slate-200 font-semibold">{lastResult.report.affectedAreaName}</span> • Reference ID: #{lastResult.report.id}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-end gap-2 shrink-0">
                <span
                  className={`text-[11px] font-mono px-2.5 py-1 rounded font-bold ${
                    lastResult.report.verificationStatus === 'APPROVED'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {lastResult.report.verificationStatus === 'APPROVED'
                    ? 'ALERT SENT'
                    : 'DISCARDED'}
                </span>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-600 transition-colors shadow flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3 text-blue-400" />
                  Report Another Incident
                </button>
                <button
                  type="button"
                  onClick={() => setLastResult(null)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 underline font-medium"
                >
                  Dismiss Receipt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. EMERGENCY VIEW: GROUND INTEL & VERIFIED MEDIA CENTER ONLY
  // Citizens upload; dispatchers command & review verified + rejected records
  // =========================================================================
  return (
    <div
      id="emergency-ground-intelligence-center"
      className="bg-slate-900/95 border border-slate-800/90 rounded-xl shadow-2xl p-4 sm:p-5 flex flex-col space-y-4 backdrop-blur-md"
    >
      {/* Header for Emergency Command Personnel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                Emergency Ground Intelligence & Citizen Media Center
                <span className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  <UserCheck className="w-3 h-3 mr-1" />
                  COMMAND PERSONNEL ONLY
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Review crowdsourced citizen photos and videos. Inspect AI-verified emergency escalations and audit rejected submissions.
              </p>
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setCommandSubTab('VERIFIED')}
            className={`px-3 py-1 rounded-md border flex items-center gap-1.5 font-mono text-xs transition-colors ${
              commandSubTab === 'VERIFIED'
                ? 'bg-emerald-950 border-emerald-600 text-emerald-200'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{approvedReports.length} Verified Reports</span>
          </button>
          <button
            onClick={() => setCommandSubTab('REJECTED')}
            className={`px-3 py-1 rounded-md border flex items-center gap-1.5 font-mono text-xs transition-colors ${
              commandSubTab === 'REJECTED'
                ? 'bg-rose-950 border-rose-600 text-rose-200'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <FileX2 className="w-3.5 h-3.5 text-rose-400" />
            <span>{rejectedReports.length} Rejected / Audit</span>
          </button>
        </div>
      </div>

      {/* Notice Banner explaining eligibility */}
      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Upload option is eligible only for citizens (active in Citizen View).</span>
        </span>
        <span className="text-[10px] font-mono text-emerald-400">
          Viewing All Crowdsourced Media Records
        </span>
      </div>

      {/* SUB-VIEW 1: VERIFIED COMMAND FEED */}
      {commandSubTab === 'VERIFIED' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">
              Verified Photographic & Video Evidence Dispatched to Emergency Units ({approvedReports.length})
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-emerald-400 flex items-center gap-1 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Field Link Active
              </span>
              {approvedReports.length > 0 && onCitizenReportAction && (
                <button
                  type="button"
                  title="Clear and delete all verified citizen photos and reports"
                  onClick={() => {
                    onCitizenReportAction('', 'CLEAR_ALL_VERIFIED');
                    audioEngine.playAlertChime();
                  }}
                  className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/40 text-[10px] font-mono flex items-center gap-1 transition-colors active:scale-95"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear All Verified Media
                </button>
              )}
            </div>
          </div>

          {approvedReports.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-lg border border-slate-800 text-slate-400 text-xs">
              No verified reports currently awaiting command action.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {approvedReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-3.5 flex flex-col justify-between space-y-3 transition-colors"
                >
                  <div className="space-y-2">
                    {/* Area & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                          {report.affectedAreaName}
                        </h4>
                        <div className="text-[11px] text-slate-400">
                          Eyewitness: <span className="text-slate-300 font-medium">{report.citizenName || 'Anonymous Citizen'}</span> ({report.contactNumber || 'Field Cell'})
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                        ✓ {report.verification?.relevanceConfidence || 95}% AI VERIFIED
                      </span>
                    </div>

                    {/* Media Thumbnail & Details */}
                    <div className="flex gap-3">
                      <div className="relative group w-28 h-20 bg-black/80 rounded-md overflow-hidden shrink-0 border border-slate-800 flex items-center justify-center">
                        {report.mediaType === 'VIDEO' ? (
                          <div className="flex flex-col items-center justify-center text-red-400">
                            <Video className="w-6 h-6 mb-1" />
                            <span className="text-[9px] font-mono text-slate-400">VIDEO</span>
                          </div>
                        ) : (
                          <img
                            src={report.mediaUrl}
                            alt="Verified disaster evidence"
                            className="w-full h-full object-cover"
                          />
                        )}
                        {onCitizenReportAction && (
                          <button
                            type="button"
                            title="Delete this photo/video"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCitizenReportAction(report.id, 'DELETE');
                              audioEngine.playAlertChime();
                            }}
                            className="absolute top-1 right-1 bg-black/75 hover:bg-rose-900 text-rose-300 hover:text-white p-1 rounded transition-colors shadow active:scale-95"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="flex-1 space-y-1 text-xs">
                        <p className="text-slate-300 text-xs line-clamp-2">{report.description}</p>
                        <div className="flex flex-wrap gap-1 text-[10px] font-mono text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {report.category.replace(/_/g, ' ')}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-red-950/60 border border-red-800/40 text-red-300">
                            {report.severity}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                            Clicked: {new Date(report.captureTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Verification Reasoning */}
                    {report.verification && (
                      <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono">
                          <span>Damage Severity: {report.verification.damageSeverity}</span>
                          <span>Freshness: &lt;24h Confirmed</span>
                        </div>
                        <p className="text-[10px] text-slate-400">{report.verification.relevanceReasoning}</p>
                      </div>
                    )}
                  </div>

                  {/* Tactical Action Row */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400">
                      Status: {report.managementAction && report.managementAction !== 'NONE' ? report.managementAction : 'Pending Dispatch'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {onCitizenReportAction && (
                        <button
                          type="button"
                          title="Delete citizen photo/video and report"
                          onClick={() => {
                            onCitizenReportAction(report.id, 'DELETE');
                            audioEngine.playAlertChime();
                          }}
                          className="px-2 py-1 rounded bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 text-xs font-semibold flex items-center gap-1 transition-colors active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          Delete Media
                        </button>
                      )}
                      {onFocusCoordinates && (
                        <button
                          type="button"
                          onClick={() => onFocusCoordinates(report.coordinates)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <MapPin className="w-3 h-3 text-red-400" />
                          Focus
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const freeUnit = units.find((u) => u.status === 'AVAILABLE') || units[0];
                          if (freeUnit && onAssignUnit) {
                            onAssignUnit(freeUnit.id, `inc-${report.id}`);
                            audioEngine.playSosSuccess();
                          }
                          if (onCitizenReportAction) {
                            onCitizenReportAction(report.id, 'DISPATCHED_RESCUE');
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-mono transition-colors shadow"
                      >
                        Dispatch Unit
                      </button>
                      {onToggleRoadBlockAtLocation && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleRoadBlockAtLocation(report.affectedAreaName);
                            if (onCitizenReportAction) {
                              onCitizenReportAction(report.id, 'ROAD_BLOCKED');
                            }
                          }}
                          className="px-2 py-1 rounded bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-200 text-xs font-semibold transition-colors"
                        >
                          Block Road
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: REJECTED & FLAGGED MEDIA AUDIT LOG */}
      {commandSubTab === 'REJECTED' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">
              Rejected / Inauthentic Citizen Submissions Filtered by Automated Engine ({rejectedReports.length})
            </span>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-mono text-[11px]">
                Protects Emergency Responders from False Deployment
              </span>
              {rejectedReports.length > 0 && onCitizenReportAction && (
                <button
                  type="button"
                  title="Clear and delete all rejected citizen photos and reports"
                  onClick={() => {
                    onCitizenReportAction('', 'CLEAR_ALL_REJECTED');
                    audioEngine.playAlertChime();
                  }}
                  className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/40 text-[10px] font-mono flex items-center gap-1 transition-colors active:scale-95"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear All Rejected
                </button>
              )}
            </div>
          </div>

          {rejectedReports.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-lg border border-slate-800 text-slate-400 text-xs">
              No rejected media records found in the audit queue.
            </div>
          ) : (
            <div className="space-y-3">
              {rejectedReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-slate-950 border border-rose-900/40 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start space-x-3">
                    {/* Media Thumbnail */}
                    <div className="relative group w-20 h-16 bg-black/80 rounded overflow-hidden shrink-0 border border-slate-800 flex items-center justify-center">
                      {report.mediaType === 'VIDEO' ? (
                        <div className="flex flex-col items-center justify-center text-red-400">
                          <Video className="w-5 h-5 mb-0.5" />
                          <span className="text-[8px] font-mono text-slate-400">VIDEO</span>
                        </div>
                      ) : (
                        <img
                          src={report.mediaUrl}
                          alt="Rejected citizen evidence"
                          className="w-full h-full object-cover"
                        />
                      )}
                      {onCitizenReportAction && (
                        <button
                          type="button"
                          title="Delete this rejected photo/video"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCitizenReportAction(report.id, 'DELETE');
                            audioEngine.playAlertChime();
                          }}
                          className="absolute top-0.5 right-0.5 bg-black/75 hover:bg-rose-900 text-rose-300 hover:text-white p-1 rounded transition-colors shadow active:scale-95"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{report.affectedAreaName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                          REJECTED BY AI / TIMESTAMP
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          From: {report.citizenName || 'Citizen Volunteer'}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs">{report.description}</p>
                      <p className="text-rose-300 text-[11px] font-mono">
                        Rejection Reason: {report.verification?.verdictSummary || 'Failed recency or relevance checks.'}
                      </p>
                      <div className="text-[10px] text-slate-500 font-mono">
                        File: {report.mediaFileName} • Clicked: {new Date(report.captureTimestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Manual Commander Override & Delete Actions */}
                  <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                    <span className="text-[10px] text-rose-400 font-mono font-semibold">
                      SUPPRESSED FROM DISPATCH
                    </span>
                    <div className="flex items-center gap-1.5">
                      {onCitizenReportAction && (
                        <button
                          type="button"
                          title="Delete this rejected citizen photo/video"
                          onClick={() => {
                            onCitizenReportAction(report.id, 'DELETE');
                            audioEngine.playAlertChime();
                          }}
                          className="px-2 py-1 rounded bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 text-xs font-semibold flex items-center gap-1 transition-colors active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          Delete Media
                        </button>
                      )}
                      {onCitizenReportAction && (
                        <button
                          type="button"
                          onClick={() => {
                            onCitizenReportAction(report.id, 'OVERRIDE_APPROVE');
                            audioEngine.playSosSuccess();
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3 text-amber-400" />
                          Commander Override & Approve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
