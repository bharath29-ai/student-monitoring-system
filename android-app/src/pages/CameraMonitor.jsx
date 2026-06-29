import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, Eye, GraduationCap, CheckCircle2, AlertTriangle, Scan, Activity, Zap, Terminal, Shield, User, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

// 26.0 SUPREME ENGINE (Fixed Stats + Sensitivity)
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-wasm';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

const ANALYSIS_INTERVAL = 2500;

export default function CameraMonitor() {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const canvasOverlayRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const isAnalyzingRef = useRef(false);
  const isMobile = useIsMobile();

  const [cameraActive, setCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [lastReportTime, setLastReportTime] = useState(null);
  const [engineStatus, setEngineStatus] = useState("Initializing...");
  const [debugLog, setDebugLog] = useState("AI is loading...");
  const [faceDetected, setFaceDetected] = useState(false);
  const [brightnessBoost, setBrightnessBoost] = useState(1.4);

  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');

  // 1. Initialize AI Model
  useEffect(() => {
    async function initAI() {
      try {
        await tf.ready();
        try { await tf.setBackend('webgl'); } catch { await tf.setBackend('wasm'); }

        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        detectorRef.current = await faceLandmarksDetection.createDetector(model, {
          runtime: 'tfjs',
          refineLandmarks: true,
          maxFaces: 1
        });

        setEngineStatus("AI READY");
        setDebugLog("AI Logic Active. Open Camera.");
      } catch (e) {
        setEngineStatus("AI ERROR");
        setDebugLog("Error: " + e.message);
      }
    }
    initAI();
  }, []);

  // 2. Class Sync
  useEffect(() => {
    if (user?.id && user?.role === 'student') {
      const q = query(collection(db, 'classes'), where('students', 'array-contains', user.id));
      const unsub = onSnapshot(q, (snapshot) => {
        setEnrolledClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsub();
    }
  }, [user]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
          setDebugLog("Camera Connected.");
          setAutoAnalyze(true);
        };
      }
    } catch (err) {
      setDebugLog("Camera Error: Permission Denied.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
    setAutoAnalyze(false);
    setFaceDetected(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    const ctx = canvasOverlayRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvasOverlayRef.current.width, canvasOverlayRef.current.height);
    setDebugLog("Standby.");
  };

  // 3. The Core Analysis Logic
  const runAnalysis = useCallback(async () => {
    if (isAnalyzingRef.current || !cameraActive || !detectorRef.current || !videoRef.current) return;

    if (videoRef.current.readyState < 2 || videoRef.current.videoWidth === 0) {
       timerRef.current = setTimeout(runAnalysis, 500);
       return;
    }

    isAnalyzingRef.current = true;
    setAnalyzing(true);

    try {
      // Create high-visibility buffer
      const source = videoRef.current;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = source.videoWidth;
      tempCanvas.height = source.videoHeight;
      const tCtx = tempCanvas.getContext('2d');
      tCtx.filter = `brightness(${brightnessBoost * 100}%) contrast(110%)`;
      tCtx.drawImage(source, 0, 0);

      const faces = await detectorRef.current.estimateFaces(tempCanvas, { flipHorizontal: false });

      const canvas = canvasOverlayRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas) {
          canvas.width = source.videoWidth;
          canvas.height = source.videoHeight;
      }

      if (!faces || faces.length === 0) {
        setFaceDetected(false);
        setAnalysisData({ status: "distracted", observations: "Face not visible", attention_percentage: 0 });
        setDebugLog("SCANNING... FACE NOT FOUND.");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        setFaceDetected(true);
        const face = faces[0];
        const points = face.keypoints;
        const dist = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

        // Precision EAR Logic
        const leftEAR = (dist(points[160], points[144]) + dist(points[158], points[153])) / (2 * dist(points[33], points[133]));
        const rightEAR = (dist(points[385], points[380]) + dist(points[387], points[373])) / (2 * dist(points[362], points[263]));
        const avgEAR = (leftEAR + rightEAR) / 2;

        const faceW = dist(points[234], points[454]);
        const noseOffset = Math.abs(points[1].x - (points[234].x + points[454].x) / 2);
        const headTurn = noseOffset / faceW;

        let status = "attentive";
        let score = 100;
        let msg = "Focused & Engaged";

        if (avgEAR < 0.17) {
          status = "sleepy"; score = 25; msg = "Warning: Student is Sleepy";
        } else if (headTurn > 0.32) {
          status = "distracted"; score = 45; msg = "Warning: Looking Away";
        }

        setAnalysisData({ status, attention_percentage: score, observations: msg });
        setDebugLog(`SUCCESS: ${status.toUpperCase()} (EAR: ${avgEAR.toFixed(2)})`);

        if (ctx) {
           ctx.clearRect(0, 0, canvas.width, canvas.height);
           const color = status === 'sleepy' ? '#ff0000' : status === 'distracted' ? '#ffaa00' : '#00ff00';
           ctx.strokeStyle = color;
           ctx.lineWidth = 10;
           ctx.strokeRect(face.box.xMin, face.box.yMin, face.box.width, face.box.height);

           ctx.fillStyle = color;
           [1, 33, 133, 362, 263].forEach(idx => {
              ctx.beginPath();
              ctx.arc(points[idx].x, points[idx].y, 12, 0, 2 * Math.PI);
              ctx.fill();
           });
        }

        if (selectedClassId) {
          const cls = enrolledClasses.find(c => c.id === selectedClassId);
          const report = {
            studentId: user.id,
            studentName: user.displayName || user.name || 'Student',
            classId: selectedClassId,
            className: cls?.name || 'Class',
            teacherId: cls?.teacherId || 'unknown',
            status, score, observations: msg,
            timestamp: serverTimestamp()
          };
          await addDoc(collection(db, 'reports'), report);
          if (score < 50) await addDoc(collection(db, 'alerts'), report);
          setLastReportTime(new Date().toLocaleTimeString());
        }
      }
    } catch (err) {
      setDebugLog("AI Logic Lag.");
    } finally {
      setAnalyzing(false);
      isAnalyzingRef.current = false;
      if (autoAnalyze && cameraActive) {
        timerRef.current = setTimeout(runAnalysis, ANALYSIS_INTERVAL);
      }
    }
  }, [user, cameraActive, selectedClassId, enrolledClasses, autoAnalyze, brightnessBoost]);

  useEffect(() => {
    if (autoAnalyze && cameraActive) {
      runAnalysis();
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [autoAnalyze, cameraActive, runAnalysis]);

  if (!user) return null;

  if (isMobile) {
    return (
      <MobileCameraMonitor
        videoRef={videoRef}
        canvasOverlayRef={canvasOverlayRef}
        cameraActive={cameraActive}
        startCamera={startCamera}
        stopCamera={stopCamera}
        analyzing={analyzing}
        autoAnalyze={autoAnalyze}
        setAutoAnalyze={setAutoAnalyze}
        analysisData={analysisData}
        lastReportTime={lastReportTime}
        engineStatus={engineStatus}
        debugLog={debugLog}
        faceDetected={faceDetected}
        brightnessBoost={brightnessBoost}
        setBrightnessBoost={setBrightnessBoost}
        enrolledClasses={enrolledClasses}
        selectedClassId={selectedClassId}
        setSelectedClassId={setSelectedClassId}
      />
    );
  }

  return (
    <DesktopCameraMonitor
      videoRef={videoRef}
      canvasOverlayRef={canvasOverlayRef}
      cameraActive={cameraActive}
      startCamera={startCamera}
      stopCamera={stopCamera}
      analyzing={analyzing}
      autoAnalyze={autoAnalyze}
      setAutoAnalyze={setAutoAnalyze}
      analysisData={analysisData}
      lastReportTime={lastReportTime}
      engineStatus={engineStatus}
      debugLog={debugLog}
      faceDetected={faceDetected}
      brightnessBoost={brightnessBoost}
      setBrightnessBoost={setBrightnessBoost}
      enrolledClasses={enrolledClasses}
      selectedClassId={selectedClassId}
      setSelectedClassId={setSelectedClassId}
    />
  );
}

// ── MOBILE CAMERA MONITOR COMPONENT (Android / Native Look) ──
function MobileCameraMonitor({
  videoRef,
  canvasOverlayRef,
  cameraActive,
  startCamera,
  stopCamera,
  analyzing,
  autoAnalyze,
  setAutoAnalyze,
  analysisData,
  lastReportTime,
  engineStatus,
  debugLog,
  faceDetected,
  brightnessBoost,
  setBrightnessBoost,
  enrolledClasses,
  selectedClassId,
  setSelectedClassId
}) {
  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] w-full gap-4 relative animate-slide-up pb-10">
      {/* Immersive Video Feed */}
      <div className="flex-1 w-full bg-zinc-950 rounded-[32px] overflow-hidden border-4 border-card relative shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-1000 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
        />
        <canvas ref={canvasOverlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Video Standby Overlay */}
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-900/90 backdrop-blur-md">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-xl">
              <CameraOff className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-[0.25em]">Camera Standby</p>
          </div>
        )}

        {/* Active Analysis Overlay */}
        {analysisData && cameraActive && faceDetected && (
          <div className={`absolute top-4 left-4 right-4 rounded-2xl px-4 py-3 text-xs font-black text-white shadow-2xl border border-white/15 backdrop-blur-xl animate-slide-up flex items-center gap-2.5 ${
            analysisData.status === 'sleepy' ? 'bg-red-600/90' :
            analysisData.status === 'distracted' ? 'bg-orange-600/90' : 'bg-green-600/90'
          }`}>
            <Activity className="w-4 h-4 animate-pulse" />
            <span className="uppercase font-extrabold tracking-wider">{analysisData.status}</span>: {analysisData.observations}
          </div>
        )}

        {/* Status Badges Overlay */}
        {cameraActive && (
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
            <Badge className={`px-3 py-1.5 text-[9px] font-black rounded-full shadow-lg ${engineStatus === 'AI READY' ? 'bg-green-600' : 'bg-primary'}`}>
              {engineStatus}
            </Badge>
            <Badge variant={faceDetected ? "default" : "destructive"} className="px-3 py-1.5 text-[9px] font-black rounded-full shadow-lg">
              {faceDetected ? "DETECTION ONLINE" : "NO FACE DETECTED"}
            </Badge>
          </div>
        )}
      </div>

      {/* Target Class & Diagnostics Widget */}
      <div className="grid grid-cols-1 gap-3 shrink-0">
        <div className="rounded-[24px] bg-card border border-border p-4 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-primary" /> Target Classroom
            </label>
            {lastReportTime && (
              <span className="text-[9px] text-green-600 font-bold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                Synced: {lastReportTime}
              </span>
            )}
          </div>
          <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={autoAnalyze}>
            <SelectTrigger className="w-full h-12 rounded-xl bg-secondary/35 border-none text-sm font-bold shadow-inner">
              <SelectValue placeholder="Choose classroom" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              {enrolledClasses.map(cls => (
                <SelectItem key={cls.id} value={cls.id} className="h-10 text-sm font-bold">{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Touch brightness control */}
        {cameraActive && (
          <div className="rounded-[24px] bg-card border border-border p-4 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-foreground">Sensory Gain</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[1.0, 1.2, 1.4, 1.6].map(val => (
                <button
                  key={val}
                  onClick={() => setBrightnessBoost(val)}
                  className={`w-9 h-8 rounded-lg text-xs font-bold border transition-all ${
                    brightnessBoost === val ? 'bg-primary border-primary text-primary-foreground font-black' : 'border-border text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {val}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Diagnostics Output */}
        <div className="bg-zinc-900 border border-white/5 rounded-[20px] p-3 flex items-center gap-3 shadow-inner">
          <Terminal className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-white/25 uppercase tracking-wider">Diagnostics Console</p>
            <p className="text-[11px] font-mono text-white/70 truncate italic">{debugLog}</p>
          </div>
        </div>
      </div>

      {/* Large Attention Score Cards (Mobile Native Look) */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        <div className={`p-4 rounded-[24px] border transition-all flex flex-col justify-between h-20 ${
          analysisData?.status === 'attentive' ? 'bg-green-500/10 border-green-500/20' : 'bg-card border-border'
        }`}>
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Attention</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-2xl font-black ${analysisData?.status === 'attentive' ? 'text-green-500' : 'text-foreground'}`}>
              {analysisData?.status === 'attentive' ? '100%' : analysisData ? '0%' : '—'}
            </span>
            <span className="text-[9px] font-bold text-muted-foreground">Focus</span>
          </div>
        </div>

        <div className={`p-4 rounded-[24px] border transition-all flex flex-col justify-between h-20 ${
          analysisData?.status === 'distracted' ? 'bg-orange-500/10 border-orange-500/20' : 
          analysisData?.status === 'sleepy' ? 'bg-red-500/10 border-red-500/20' : 'bg-card border-border'
        }`}>
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Alert State</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-sm font-black uppercase tracking-wide ${
              analysisData?.status === 'sleepy' ? 'text-red-500' :
              analysisData?.status === 'distracted' ? 'text-orange-500' : 'text-muted-foreground'
            }`}>
              {analysisData?.status || 'No Session'}
            </span>
            <span className="text-[9px] font-bold text-muted-foreground">Status</span>
          </div>
        </div>
      </div>

      {/* Large Tappable Control Buttons */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        <button
          onClick={cameraActive ? stopCamera : startCamera}
          className={`h-16 text-xs font-black uppercase tracking-wider rounded-[20px] shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all ${
            cameraActive 
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-destructive/10'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20'
          }`}
        >
          {cameraActive ? <><CameraOff className="w-5 h-5" /> Close Feed</> : <><Camera className="w-5 h-5" /> Open Feed</>}
        </button>

        <button
          onClick={() => setAutoAnalyze(v => !v)}
          disabled={!cameraActive}
          className={`h-16 text-xs font-black uppercase tracking-wider rounded-[20px] shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 ${
            autoAnalyze 
              ? 'bg-zinc-800 text-white shadow-zinc-800/10' 
              : 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/20'
          }`}
        >
          {autoAnalyze ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Stop Sync</>
          ) : (
            <><Eye className="w-4 h-4" /> Start AI</>
          )}
        </button>
      </div>
    </div>
  );
}

// ── DESKTOP CAMERA MONITOR COMPONENT (Untouched Original) ──
function DesktopCameraMonitor({
  videoRef,
  canvasOverlayRef,
  cameraActive,
  startCamera,
  stopCamera,
  analyzing,
  autoAnalyze,
  setAutoAnalyze,
  analysisData,
  lastReportTime,
  engineStatus,
  debugLog,
  faceDetected,
  brightnessBoost,
  setBrightnessBoost,
  enrolledClasses,
  selectedClassId,
  setSelectedClassId
}) {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-slide-up pb-20 px-4 pt-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-foreground tracking-tighter flex items-center gap-3 uppercase italic">
            <Zap className="w-8 h-8 text-green-500 fill-green-500" /> SMART MONITOR Pro
          </h1>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-60">Engine v26.0 - Full Behavioral Stats</p>
        </div>
        <div className="flex items-center gap-3">
           <Badge className={`px-4 py-1.5 text-xs font-black rounded-full shadow-lg ${engineStatus === 'AI READY' ? 'bg-green-600' : 'bg-primary'}`}>
             {engineStatus}
           </Badge>
           <Badge variant={faceDetected ? "default" : "destructive"} className="px-4 py-1.5 text-xs font-black rounded-full shadow-lg">
             {faceDetected ? "DETECTION ACTIVE" : "NO FACE"}
           </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-[40px] bg-zinc-950 border-[8px] border-card overflow-hidden shadow-2xl relative aspect-video">
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity duration-1000 ${cameraActive ? 'opacity-100' : 'opacity-0'}`} />
            <canvas ref={canvasOverlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />

            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-zinc-900/90 backdrop-blur-md">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-2xl">
                  <CameraOff className="w-10 h-10 text-white/20" />
                </div>
                <p className="text-sm font-black text-white/40 uppercase tracking-[0.4em]">Hardware Ready</p>
              </div>
            )}

            {analysisData && cameraActive && faceDetected && (
              <div className={`absolute top-6 left-6 rounded-2xl px-6 py-3 text-sm font-black text-white shadow-2xl border-2 border-white/20 backdrop-blur-xl animate-slide-up flex items-center gap-3 ${
                analysisData.status === 'sleepy' ? 'bg-red-600 scale-105' :
                analysisData.status === 'distracted' ? 'bg-orange-600' : 'bg-green-600'
              }`}>
                <Activity className="w-4 h-4" />
                {analysisData.status.toUpperCase()}: {analysisData.observations}
              </div>
            )}
          </div>

          <div className="bg-zinc-900 border border-white/5 rounded-[24px] p-5 flex items-center gap-4 shadow-inner">
             <Terminal className="w-5 h-5 text-primary" />
             <div className="flex-1 space-y-1">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest px-1">Diagnostics Output</p>
                <p className="text-xs font-mono font-bold text-white/60 px-1 truncate italic uppercase">{debugLog}</p>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] bg-card border border-border p-6 shadow-xl space-y-6">
            <div className="space-y-3 px-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                 <GraduationCap className="w-4 h-4 text-primary" /> Target Class
              </label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={autoAnalyze}>
                <SelectTrigger className="w-full h-14 rounded-2xl bg-secondary/20 border-none text-base font-bold shadow-inner">
                  <SelectValue placeholder="Choose classroom" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  {enrolledClasses.map(cls => (
                    <SelectItem key={cls.id} value={cls.id} className="h-12 font-bold">{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {lastReportTime && (
              <div className="flex items-center gap-3 text-[10px] text-green-600 font-black bg-green-50 p-4 rounded-2xl border border-green-100 animate-slide-up">
                <CheckCircle2 className="w-4 h-4" /> REPORT SYNCED: {lastReportTime}
              </div>
            )}
          </div>

          <div className="grid gap-4">
            <Button
              variant={cameraActive ? "destructive" : "default"}
              onClick={cameraActive ? stopCamera : startCamera}
              size="lg"
              className="h-24 text-base font-black gap-4 rounded-[32px] shadow-2xl w-full transition-all active:scale-95 shadow-primary/10"
            >
              {cameraActive ? <><CameraOff className="w-7 h-7" /> CLOSE FEED</> : <><Camera className="w-7 h-7" /> OPEN CAMERA</>}
            </Button>

            <Button
              onClick={() => setAutoAnalyze(v => !v)}
              size="lg"
              className={`h-24 text-base font-black gap-4 rounded-[32px] shadow-2xl w-full transition-all active:scale-95 ${autoAnalyze ? 'bg-zinc-800' : 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/20'}`}
              disabled={!cameraActive}
            >
              {autoAnalyze ? (
                <><RefreshCw className="w-6 h-6 animate-spin" /> STOP MONITOR</>
              ) : (
                <><Eye className="w-6 h-6" /> START MONITOR</>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
          <Card className="bg-card border-none shadow-lg rounded-[28px] p-2">
            <CardHeader className="pb-1">
              <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <User className="w-3 h-3 text-primary" /> Session Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">{faceDetected ? 1 : 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-none shadow-lg rounded-[28px] p-2 border-l-4 border-green-600">
            <CardHeader className="pb-1">
              <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-500" /> Attentive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-green-500">{analysisData?.status === 'attentive' ? 1 : 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-none shadow-lg rounded-[28px] p-2 border-l-4 border-orange-500">
            <CardHeader className="pb-1">
              <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-orange-500" /> Distracted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-orange-500">{analysisData?.status === 'distracted' ? 1 : 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-none shadow-lg rounded-[28px] p-2 border-l-4 border-red-600">
            <CardHeader className="pb-1">
              <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-3 h-3 text-red-500" /> Sleepy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-red-500">{analysisData?.status === 'sleepy' ? 1 : 0}</div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
