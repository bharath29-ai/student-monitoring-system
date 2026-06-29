import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Search, Users, UserPlus, Camera, Upload, X, FlipHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import StudentCard from '@/components/students/StudentCard';
import useClassroomData from '@/hooks/useClassroomData';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';

const DEFAULT_STUDENTS = [
  { name: 'Rahul Sharma', roll_number: 'CS001', class_name: 'CS-A' },
  { name: 'Priya Patel', roll_number: 'CS002', class_name: 'CS-A' },
  { name: 'Amit Kumar', roll_number: 'CS003', class_name: 'CS-A' },
  { name: 'Sneha Gupta', roll_number: 'CS004', class_name: 'CS-A' },
  { name: 'Vikram Singh', roll_number: 'CS005', class_name: 'CS-A' },
  { name: 'Ananya Reddy', roll_number: 'CS006', class_name: 'CS-A' },
  { name: 'Rohan Joshi', roll_number: 'CS007', class_name: 'CS-A' },
  { name: 'Kavita Nair', roll_number: 'CS008', class_name: 'CS-A' },
  { name: 'Arjun Mehta', roll_number: 'CS009', class_name: 'CS-A' },
  { name: 'Meera Iyer', roll_number: 'CS010', class_name: 'CS-A' },
  { name: 'Suresh Verma', roll_number: 'CS011', class_name: 'CS-A' },
  { name: 'Divya Menon', roll_number: 'CS012', class_name: 'CS-A' },
  { name: 'Kiran Das', roll_number: 'CS013', class_name: 'CS-A' },
  { name: 'Neha Kapoor', roll_number: 'CS014', class_name: 'CS-A' },
  { name: 'Sanjay Rao', roll_number: 'CS015', class_name: 'CS-A' },
  { name: 'Pooja Agarwal', roll_number: 'CS016', class_name: 'CS-A' },
  { name: 'Deepak Thakur', roll_number: 'CS017', class_name: 'CS-A' },
  { name: 'Ritu Saxena', roll_number: 'CS018', class_name: 'CS-A' },
  { name: 'Manish Yadav', roll_number: 'CS019', class_name: 'CS-A' },
  { name: 'Swati Bhat', roll_number: 'CS020', class_name: 'CS-A' },
  { name: 'Rajesh Pandey', roll_number: 'CS021', class_name: 'CS-A' },
  { name: 'Lakshmi Pillai', roll_number: 'CS022', class_name: 'CS-A' },
  { name: 'Arun Mishra', roll_number: 'CS023', class_name: 'CS-A' },
  { name: 'Geeta Choudhary', roll_number: 'CS024', class_name: 'CS-A' },
  { name: 'Nitin Bansal', roll_number: 'CS025', class_name: 'CS-A' },
  { name: 'Sunita Devi', roll_number: 'CS026', class_name: 'CS-A' },
  { name: 'Vivek Tiwari', roll_number: 'CS027', class_name: 'CS-A' },
  { name: 'Asha Kulkarni', roll_number: 'CS028', class_name: 'CS-A' },
  { name: 'Prakash Shetty', roll_number: 'CS029', class_name: 'CS-A' },
  { name: 'Nandini Roy', roll_number: 'CS030', class_name: 'CS-A' },
];

function assignStatuses(data, studentList) {
  if (!data) return studentList.map(s => ({ ...s, status: 'attentive', attention_score: 85 }));
  
  const shuffled = [...studentList].sort(() => Math.random() - 0.5);
  return shuffled.map((student, i) => {
    let status = 'attentive';
    let score = Math.floor(Math.random() * 15) + 85;

    if (i < data.distracted) {
      status = 'distracted';
      score = Math.floor(Math.random() * 30) + 20;
    } else if (i < data.distracted + data.sleepy) {
      status = 'sleepy';
      score = Math.floor(Math.random() * 20) + 10;
    }

    return { ...student, status, attention_score: score };
  });
}

export default function Students() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data } = useClassroomData(3000);
  const [studentList, setStudentList] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  // Load students from Firebase
  useEffect(() => {
    const q = query(collection(db, 'students'), orderBy('created_date', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudentList(list.length > 0 ? list : DEFAULT_STUDENTS);
    });
    return () => unsub();
  }, []);
  const [form, setForm] = useState({ name: '', roll_number: '', class_name: 'CS-A' });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const fileInputRef = useRef(null);
  const liveVideoRef = useRef(null);
  const liveCaptureRef = useRef(null);

  const students = useMemo(() => assignStatuses(data, studentList), [data, studentList]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const openLiveCamera = async () => {
    setCameraOpen(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    setCameraStream(stream);
    // Wait for video element to render after state update
    setTimeout(() => {
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
      }
    }, 100);
  };

  const closeLiveCamera = () => {
    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setCameraOpen(false);
  };

  const captureFromCamera = () => {
    const video = liveVideoRef.current;
    const canvas = liveCaptureRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhotoPreview(dataUrl);
    // Convert dataURL to File
    canvas.toBlob(blob => {
      setPhotoFile(new File([blob], 'student-photo.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.85);
    closeLiveCamera();
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.roll_number.trim()) return;
    setUploading(true);
    try {
      // Typically you'd upload to Firebase Storage here
      // For now we'll just save the data to Firestore
      await addDoc(collection(db, 'students'), {
        ...form,
        avatar_url: null, // Placeholder for now
        created_date: serverTimestamp()
      });
      setForm({ name: '', roll_number: '', class_name: 'CS-A' });
      setPhotoPreview(null);
      setPhotoFile(null);
      setShowAdd(false);
    } catch (err) {
      console.error("Error adding student:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleCloseAdd = () => {
    closeLiveCamera();
    setShowAdd(false);
    setPhotoPreview(null);
    setPhotoFile(null);
    setForm({ name: '', roll_number: '', class_name: 'CS-A' });
  };

  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.roll_number.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [students, search, statusFilter]);

  const counts = useMemo(() => ({
    all: students.length,
    attentive: students.filter(s => s.status === 'attentive').length,
    distracted: students.filter(s => s.status === 'distracted').length,
    sleepy: students.filter(s => s.status === 'sleepy').length,
  }), [students]);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground mt-1">{students.length} students monitored</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
            {counts.attentive} Attentive
          </Badge>
          <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
            {counts.distracted} Distracted
          </Badge>
          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
            {counts.sleepy} Sleepy
          </Badge>
          {user?.role === 'admin' && (
            <Button size="sm" onClick={() => setShowAdd(true)} className="gap-2">
              <UserPlus className="w-4 h-4" /> Add Student
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search students..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs defaultValue="all" onValueChange={setStatusFilter}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="attentive">Attentive</TabsTrigger>
            <TabsTrigger value="distracted">Distracted</TabsTrigger>
            <TabsTrigger value="sleepy">Sleepy</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Add Student Dialog */}
      <Dialog open={showAdd} onOpenChange={handleCloseAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Photo Upload */}
            <div className="space-y-1.5">
              <Label>Student Photo <span className="text-muted-foreground text-xs">(so AI can identify them)</span></Label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              <canvas ref={liveCaptureRef} className="hidden" />

              {/* Live Camera View */}
              {cameraOpen && (
                <div className="rounded-xl overflow-hidden border border-border bg-black relative">
                  <video ref={liveVideoRef} autoPlay playsInline muted className="w-full aspect-video object-cover" />
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                    <button
                      onClick={captureFromCamera}
                      className="w-12 h-12 rounded-full bg-white border-4 border-primary shadow-lg hover:scale-105 transition-transform"
                    />
                    <button
                      onClick={closeLiveCamera}
                      className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Preview or Buttons */}
              {!cameraOpen && (
                <>
                  {photoPreview ? (
                    <div className="flex flex-col items-center gap-2 py-3">
                      <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-primary/30" />
                      <p className="text-xs text-primary font-medium">Photo captured</p>
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={openLiveCamera}
                      className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-3 text-sm text-muted-foreground hover:border-primary/50 hover:bg-secondary/50 transition-colors"
                    >
                      <Camera className="w-4 h-4" /> Take Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-3 text-sm text-muted-foreground hover:border-primary/50 hover:bg-secondary/50 transition-colors"
                    >
                      <Upload className="w-4 h-4" /> Upload File
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                placeholder="e.g. Rahul Sharma"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Roll Number</Label>
              <Input
                placeholder="e.g. CS031"
                value={form.roll_number}
                onChange={e => setForm(f => ({ ...f, roll_number: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Class / Section</Label>
              <Input
                placeholder="e.g. CS-A"
                value={form.class_name}
                onChange={e => setForm(f => ({ ...f, class_name: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseAdd}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.name.trim() || !form.roll_number.trim() || uploading} className="gap-2">
              {uploading ? <><Upload className="w-4 h-4 animate-bounce" /> Uploading...</> : 'Add Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-sm font-medium">No students found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((student, i) => (
            <StudentCard key={student.roll_number} student={student} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}