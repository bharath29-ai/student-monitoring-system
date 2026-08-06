import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, Eye, GraduationCap, CheckCircle2, AlertTriangle, Scan, Activity, Zap, Terminal, Shield, User, Sun, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, query, where, onSnapshot, doc } from 'firebase/firestore';
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
  const [teacherName, setTeacherName] = useState('Teacher');
  const [wakeLock, setWakeLock] = useState(null);

  // 0. Background / Wake Lock Support
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        console.log("Wake Lock Active: Screen will stay on.");
      }
    } catch (err) {
      console.warn("Wake Lock Error:", err.message);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLock) {
      wakeLock.release().then(() => setWakeLock(null));
    }
  };

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

  // 2. Class & Teacher Sync
  useEffect(() => {
    if (user?.id && user?.role === 'student') {
      const q = query(collection(db, 'classes'), where('students', 'array-contains', user.id));
      const unsub = onSnapshot(q, (snapshot) => {
        setEnrolledClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      // Fetch assigned teacher name
      if (user.teacherId) {
        onSnapshot(doc(db, 'users', user.teacherId), (docSnap) => {
          if (docSnap.exists()) {
            setTeacherName(docSnap.data().name || 'Teacher');
          }
        });
      }

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

  // 3. The Core Analysis Logic (NOW BACKGROUND CAPABLE)
  const runAnalysis = useCallback(async () => {
    if (isAnalyzingRef.current || !cameraActive || !detectorRef.current || !videoRef.current) return;

    if (videoRef.current.readyState < 2 || videoRef.current.videoWidth === 0) {
       if (document.visibilityState === 'visible') {
         requestAnimationFrame(runAnalysis);
       } else {
         timerRef.current = setTimeout(runAnalysis, 1000);
       }
       return;
    }

    isAnalyzingRef.current = true;

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
        setAnalysisData({ status: "Distracted", observations: "Face not visible", attention_percentage: 0 });
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        setFaceDetected(true);
        const face = faces[0];
        const points = face.keypoints;
        const dist = (p1, p2) => {
          if (!p1 || !p2) return 0;
          return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
        };

        // Precision EAR Logic (Eyes) - Added safety checks
        const leftEAR = (dist(points[160], points[144]) + dist(points[158], points[153])) / (2 * dist(points[33], points[133]) || 1);
        const rightEAR = (dist(points[385], points[380]) + dist(points[387], points[373])) / (2 * dist(points[362], points[263]) || 1);
        const avgEAR = (leftEAR + rightEAR) / 2;

        // YAW (Left/Right)
        const faceW = dist(points[234], points[454]) || 1;
        const noseOffset = (points[1]?.x || 0) - ((points[234]?.x || 0) + (points[454]?.x || 0)) / 2;
        const headYaw = (noseOffset / faceW) * 100;

        // PITCH (Up/Down)
        const upperFace = dist(points[10], points[1]);
        const lowerFace = dist(points[1], points[152]) || 1;
        const headPitch = (upperFace / lowerFace);

        // ROLL (Tilt)
        const eyeDiffY = (points[263]?.y || 0) - (points[33]?.y || 0);
        const eyeDiffX = (points[263]?.x || 0) - (points[33]?.x || 0);
        const headRoll = Math.atan2(eyeDiffY, eyeDiffX || 1) * (180 / Math.PI);

        let status = "Attentive";
        let score = 100;
        let msg = "Focused & Engaged";

        if (avgEAR < 0.16) {
          status = "Sleepy"; score = 20; msg = "Eyes closed detected";
        } else if (headYaw > 28 || headYaw < -28) {
          status = "Distracted"; score = 40; msg = "Looking away from screen";
        } else if (headPitch > 1.6) {
          status = "Distracted"; score = 50; msg = "Looking down (Phone/Book)";
        } else if (headPitch < 0.6) {
          status = "Distracted"; score = 55; msg = "Looking up (Daydreaming)";
        } else if (headRoll > 30 || headRoll < -30) {
          status = "Distracted"; score = 60; msg = "Head tilted excessively";
        }

        setAnalysisData({ status, attention_percentage: score, observations: msg });
        setDebugLog(`LIVE: ${status.toUpperCase()} | Y:${headYaw.toFixed(0)} P:${headPitch.toFixed(1)} R:${headRoll.toFixed(0)}`);

        if (ctx) {
           ctx.clearRect(0, 0, canvas.width, canvas.height);
           const color = status === 'Sleepy' ? '#ff0000' : status === 'Distracted' ? '#ffaa00' : '#00ff00';
           ctx.strokeStyle = color;
           ctx.lineWidth = 10;
           ctx.strokeRect(face.box.xMin, face.box.yMin, face.box.width, face.box.height);

           ctx.fillStyle = color;
           [1, 33, 133, 362, 263].forEach(idx => {
              if (points[idx]) {
                ctx.beginPath();
                ctx.arc(points[idx].x, points[idx].y, 12, 0, 2 * Math.PI);
                ctx.fill();
              }
           });
        }

        // Real-time Firestore Sync (Instant updates when status changes or every 2s)
        const now = Date.now();
        const statusChanged = !lastReportTime || analysisData?.status !== status;
        const intervalPassed = !lastReportTime || now - new Date(lastReportTime).getTime() > 2000;

        if (selectedClassId && (statusChanged || intervalPassed)) {
          const cls = enrolledClasses.find(c => c.id === selectedClassId);
          const finalTeacherName = cls?.teacherName || teacherName;

          const report = {
            studentId: user.id,
            studentName: user.displayName || user.name || 'Student',
            studentEmail: user.email || '',
            classId: selectedClassId || 'general',
            className: cls?.name || 'General Session',
            teacherId: cls?.teacherId || user.teacherId || 'unknown',
            teacherName: finalTeacherName,
            status, score, observations: msg,
            timestamp: serverTimestamp()
          };
          await addDoc(collection(db, 'reports'), report);
          if (score < 50 && (!lastReportTime || now - new Date(lastReportTime).getTime() > 15000)) {
             await addDoc(collection(db, 'alerts'), report);
          }
          setLastReportTime(new Date().toISOString());
        } else if (!selectedClassId && user.teacherId && (statusChanged || intervalPassed)) {
          // Direct sync if student has a teacher but no specific class feed selected
          const report = {
            studentId: user.id,
            studentName: user.displayName || user.name || 'Student',
            classId: 'general',
            className: 'General Session',
            teacherId: user.teacherId,
            teacherName: teacherName,
            status, score, observations: msg,
            timestamp: serverTimestamp()
          };
          await addDoc(collection(db, 'reports'), report);
          if (score < 50 && (!lastReportTime || now - new Date(lastReportTime).getTime() > 15000)) {
             await addDoc(collection(db, 'alerts'), report);
          }
          setLastReportTime(new Date().toISOString());
        }
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setDebugLog(`AI ERROR: ${err.message}`);
    } finally {
      isAnalyzingRef.current = false;
      if (autoAnalyze && cameraActive) {
        if (document.visibilityState === 'visible') {
          requestAnimationFrame(runAnalysis);
        } else {
          // Tab is in background - use persistent timer instead of RAF
          timerRef.current = setTimeout(runAnalysis, 2000);
        }
      }
    }
  }, [user, cameraActive, selectedClassId, enrolledClasses, autoAnalyze, brightnessBoost, lastReportTime]);

  useEffect(() => {
    if (autoAnalyze && cameraActive) {
      requestWakeLock();
      runAnalysis();
    } else {
      releaseWakeLock();
      if (timerRef.current) clearTimeout(timerRef.current);
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && autoAnalyze && cameraActive) {
        requestWakeLock();
        runAnalysis();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      releaseWakeLock();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
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
        wakeLock={wakeLock}
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
      wakeLock={wakeLock}
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
  setSelectedClassId,
  wakeLock
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
          <div className="absolute bottom-4 left-4 right-4 pointer-events-none z-10">
            <div className={`rounded-2xl px-4 py-3.5 text-xs font-black text-white shadow-2xl border border-white/15 backdrop-blur-xl animate-slide-up flex items-center gap-2.5 ${
              analysisData.status === 'sleepy' ? 'bg-red-600/90' :
              analysisData.status === 'distracted' ? 'bg-orange-600/90' : 'bg-green-600/90'
            }`}>
              <Activity className="w-4 h-4 animate-pulse shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="uppercase font-extrabold tracking-wider leading-none text-[10px] opacity-75">Behavior State</p>
                <p className="font-bold text-[11px] truncate mt-0.5">{analysisData.observations}</p>
              </div>
            </div>
          </div>
        )}

        {/* Floating Sync Badge - Matching Android Native */}
        {cameraActive && (
          <div className="absolute top-4 right-4 z-10 pointer-events-none">
            <div className={`px-4 py-1.5 rounded-xl shadow-lg flex items-center gap-2 border border-white/10 backdrop-blur-md ${
              faceDetected ? 'bg-green-600/90' : 'bg-red-600/90'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full bg-white ${faceDetected ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-black text-white uppercase tracking-wider">
                {faceDetected ? "FACE SYNCED" : "NO FACE"}
              </span>
            </div>
          </div>
        )}

        {wakeLock && (
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
             <div className="bg-amber-500/90 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 shadow-lg">
                <span className="text-[8px] font-black text-white uppercase tracking-tighter">BG-Active</span>
             </div>
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
        {/* Native Style Gauge Circular Progress simulation */}
        <div className="col-span-2 rounded-[28px] bg-card border border-border p-5 shadow-sm flex items-center justify-between">
           <div className="flex flex-col gap-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Focus Level</p>
              <h3 className={`text-3xl font-black ${analysisData?.status === 'attentive' ? 'text-green-500' : 'text-foreground'}`}>
                {analysisData?.status === 'attentive' ? '100%' : analysisData ? '0%' : '—'}
              </h3>
           </div>
           <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                 <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="6" className="text-secondary/50" />
                 <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="6" strokeDasharray="176"
                    strokeDashoffset={176 - (176 * (analysisData?.status === 'attentive' ? 100 : 0)) / 100}
                    className={`transition-all duration-700 ${analysisData?.status === 'attentive' ? 'text-green-500' : 'text-red-500'}`}
                 />
              </svg>
              <Activity className={`absolute w-5 h-5 ${analysisData?.status === 'attentive' ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
           </div>
        </div>

        <div className={`p-4 rounded-[24px] border transition-all flex flex-col justify-between h-20 ${
          analysisData?.status === 'distracted' ? 'bg-orange-500/10 border-orange-500/20' : 
          analysisData?.status === 'sleepy' ? 'bg-red-500/10 border-red-500/20' : 'bg-card border-border'
        }`}>
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Alert State</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-sm font-black uppercase tracking-wide ${
              analysisData?.status === 'sleepy' ? 'text-red-500 animate-pulse' :
              analysisData?.status === 'distracted' ? 'text-orange-500' : 'text-muted-foreground'
            }`}>
              {analysisData?.status || 'Standby'}
            </span>
            <span className="text-[9px] font-bold text-muted-foreground">Status</span>
          </div>
        </div>

        <div className="p-4 rounded-[24px] border border-border bg-zinc-900 flex flex-col justify-between h-20 shadow-inner">
          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Engine Log</span>
          <p className="text-[10px] font-mono text-white/60 truncate italic leading-tight mt-1">{debugLog}</p>
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
  setSelectedClassId,
  wakeLock
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
            <Badge variant={faceDetected ? "default" : "destructive"} className="px-4 py-1.5 text-xs font-black rounded-full shadow-lg text-white">
             {faceDetected ? "DETECTION ACTIVE" : "NO FACE"}
           </Badge>
           {wakeLock && (
             <Badge className="bg-amber-500 text-white px-3 py-1 text-[10px] font-black rounded-full shadow-md animate-pulse">
               STAY-ALIVE ON
             </Badge>
           )}
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
              <div className="text-3xl font-black text-green-500">{analysisData?.status?.toLowerCase() === 'attentive' ? 1 : 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-none shadow-lg rounded-[28px] p-2 border-l-4 border-orange-500">
            <CardHeader className="pb-1">
              <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-orange-500" /> Distracted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-orange-500">{analysisData?.status?.toLowerCase() === 'distracted' ? 1 : 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-none shadow-lg rounded-[28px] p-2 border-l-4 border-red-600">
            <CardHeader className="pb-1">
              <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-3 h-3 text-red-500" /> Sleepy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-red-500">{analysisData?.status?.toLowerCase() === 'sleepy' ? 1 : 0}</div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
