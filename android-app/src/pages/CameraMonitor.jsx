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

  return (
    <div className="flex flex-col min-h-full w-full gap-4 relative animate-slide-up pb-10">
      {/* ── Immersive Full-Screen style Video Feed ── */}
      <div className="w-full aspect-[4/3] sm:aspect-video bg-zinc-950 rounded-[32px] overflow-hidden border border-border/50 relative shadow-2xl shrink-0 flex flex-col justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-700 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
        />
        <canvas ref={canvasOverlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Video Standby Overlay */}
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-900/95 backdrop-blur-md">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-xl">
              <CameraOff className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-xs font-black text-white/40 uppercase tracking-[0.25em]">Camera Standby</p>
            <p className="text-[10px] text-white/20 font-bold text-center px-6">
              Start the camera feed below to begin real-time face tracking analysis.
            </p>
          </div>
        )}

        {/* Floating AI Engine & Face Detection pill badges */}
        {cameraActive && (
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 text-[9px] font-black tracking-wider uppercase rounded-full shadow-lg text-white backdrop-blur-md border ${
                engineStatus === 'AI READY' ? 'bg-green-600/90 border-green-500/25' : 'bg-primary/90 border-primary/25'
              }`}>
                {engineStatus}
              </span>
              <span className={`px-3 py-1.5 text-[9px] font-black tracking-wider uppercase rounded-full shadow-lg text-white backdrop-blur-md border ${
                faceDetected ? 'bg-indigo-600/90 border-indigo-500/25' : 'bg-red-600/90 border-red-500/25'
              }`}>
                {faceDetected ? "FACE SYNCED" : "NO FACE"}
              </span>
            </div>
          </div>
        )}

        {/* Active Analysis Overlay card */}
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
      </div>

      {/* ── Diagnostics & Classroom Picker Controls ── */}
      <div className="grid grid-cols-1 gap-3 shrink-0">
        <div className="rounded-[24px] bg-card border border-border p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-primary" /> Target Classroom
            </label>
            {lastReportTime && (
              <span className="text-[9px] text-green-600 font-bold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                Synced: {lastReportTime}
              </span>
            )}
          </div>
          <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={autoAnalyze}>
            <SelectTrigger className="w-full h-12 rounded-2xl bg-secondary/40 border-none text-sm font-bold shadow-inner">
              <SelectValue placeholder="Choose classroom" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              {enrolledClasses.map(cls => (
                <SelectItem key={cls.id} value={cls.id} className="h-10 text-sm font-bold">{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Touch Brightness Gain (Only when active) */}
        {cameraActive && (
          <div className="rounded-[24px] bg-card border border-border p-3.5 shadow-sm flex items-center justify-between gap-4 animate-slide-up">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-xs font-bold text-foreground">Sensory Gain</span>
            </div>
            <div className="flex items-center gap-1">
              {[1.0, 1.2, 1.4, 1.6].map(val => (
                <button
                  key={val}
                  onClick={() => setBrightnessBoost(val)}
                  className={`w-9 h-8 rounded-lg text-xs font-bold border transition-all ${
                    brightnessBoost === val 
                      ? 'bg-primary border-primary text-primary-foreground font-black' 
                      : 'border-border text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {val}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Diagnostics Log overlay */}
        <div className="bg-zinc-900 border border-white/5 rounded-[20px] p-3 flex items-center gap-3 shadow-inner">
          <Terminal className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-wider">Engine Log</p>
            <p className="text-[10px] font-mono text-white/70 truncate italic leading-tight mt-0.5">{debugLog}</p>
          </div>
        </div>
      </div>

      {/* ── Metric Score Cards ── */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        <div className={`p-4 rounded-[24px] border transition-all flex flex-col justify-between h-20 shadow-sm ${
          analysisData?.status === 'attentive' ? 'bg-green-500/10 border-green-500/20' : 'bg-card border-border/50'
        }`}>
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Attention Score</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-xl font-black ${analysisData?.status === 'attentive' ? 'text-green-500' : 'text-foreground'}`}>
              {analysisData?.status === 'attentive' ? '100%' : analysisData ? '0%' : '—'}
            </span>
            <span className="text-[8px] font-bold text-muted-foreground uppercase">Real-time</span>
          </div>
        </div>

        <div className={`p-4 rounded-[24px] border transition-all flex flex-col justify-between h-20 shadow-sm ${
          analysisData?.status === 'sleepy' ? 'bg-red-500/10 border-red-500/20' : 
          analysisData?.status === 'distracted' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-card border-border/50'
        }`}>
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Session Status</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-xs font-black uppercase tracking-wide truncate max-w-[100px] ${
              analysisData?.status === 'sleepy' ? 'text-red-500 animate-pulse' :
              analysisData?.status === 'distracted' ? 'text-orange-500' : 
              analysisData?.status === 'attentive' ? 'text-green-500' : 'text-muted-foreground'
            }`}>
              {analysisData?.status || 'Inactive'}
            </span>
            <span className="text-[8px] font-bold text-muted-foreground uppercase">Analysis</span>
          </div>
        </div>
      </div>

      {/* ── Start/Stop Control Panel Fixed at Bottom ── */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        <button
          onClick={cameraActive ? stopCamera : startCamera}
          className={`h-14 text-xs font-black uppercase tracking-wider rounded-full shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all ${
            cameraActive 
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-destructive/10'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20'
          }`}
        >
          {cameraActive ? <><CameraOff className="w-4 h-4" /> Close Feed</> : <><Camera className="w-4 h-4" /> Open Camera</>}
        </button>

        <button
          onClick={() => setAutoAnalyze(v => !v)}
          disabled={!cameraActive}
          className={`h-14 text-xs font-black uppercase tracking-wider rounded-full shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 ${
            autoAnalyze 
              ? 'bg-zinc-800 text-white shadow-zinc-800/10 dark:bg-zinc-700' 
              : 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/20'
          }`}
        >
          {autoAnalyze ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Stop AI</>
          ) : (
            <><Eye className="w-4 h-4" /> Start AI</>
          )}
        </button>
      </div>
    </div>
  );
}
