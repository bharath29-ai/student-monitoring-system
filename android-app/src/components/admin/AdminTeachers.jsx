import React, { useState, useEffect } from 'react';
import { Trash2, Search, UserPlus, Eye, Mail, Phone, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { db } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

const SUBJECTS = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Other'];

export default function AdminTeachers() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', subject: '', class_name: '', phone: '', join_date: '' });
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
    const unsub = onSnapshot(q, (snapshot) => {
      setTeachers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const createMutation = useMutation({
    mutationFn: (data) => addDoc(collection(db, 'users'), {
      ...data,
      role: 'teacher',
      status: 'approved',
      created_date: serverTimestamp()
    }),
    onSuccess: () => {
      setShowAdd(false);
      resetForm();
      toast({ title: "Success", description: "Teacher added successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to add teacher: " + error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDoc(doc(db, 'users', id)),
    onSuccess: () => {
      toast({ title: "Success", description: "Teacher deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to delete teacher: " + error.message, variant: "destructive" });
    }
  });

  const resetForm = () => setForm({ name: '', email: '', subject: '', class_name: '', phone: '', join_date: '' });

  const handleAdd = () => {
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim()) return;
    createMutation.mutate({ ...form, status: 'active' });
  };

  const filtered = teachers.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase()) ||
    t.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const avatarColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search teachers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No teachers found. Add one to get started.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((teacher, i) => {
            const initials = teacher.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
            const color = avatarColors[i % avatarColors.length];
            return (
              <div key={teacher.id} className="rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl ${teacher.avatar_url ? '' : color} flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden`}>
                    {teacher.avatar_url
                      ? <img src={teacher.avatar_url} alt={teacher.name} className="w-full h-full object-cover" />
                      : initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground truncate">{teacher.name}</h3>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${teacher.status === 'active' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                        {teacher.status || 'active'}
                      </Badge>
                    </div>
                    <div className="mt-1.5 space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 shrink-0" /> {teacher.subject}
                        {teacher.class_name && <span>· {teacher.class_name}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 shrink-0" /> {teacher.email}
                      </p>
                      {teacher.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Phone className="w-3 h-3 shrink-0" /> {teacher.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                  <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => setSelected(teacher)}>
                    <Eye className="w-3.5 h-3.5" /> View
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Teacher?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete <strong>{teacher.name}</strong>. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(teacher.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Teacher Dialog */}
      <Dialog open={showAdd} onOpenChange={(v) => { if (!v) { setShowAdd(false); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. Dr. Anil Kumar" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input type="email" placeholder="teacher@school.edu" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Subject <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. Mathematics" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} list="subjects-list" />
                <datalist id="subjects-list">{SUBJECTS.map(s => <option key={s} value={s} />)}</datalist>
              </div>
              <div className="space-y-1.5">
                <Label>Class / Section</Label>
                <Input placeholder="e.g. CS-A" value={form.class_name} onChange={e => setForm(f => ({ ...f, class_name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Join Date</Label>
                <Input type="date" value={form.join_date} onChange={e => setForm(f => ({ ...f, join_date: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.name.trim() || !form.email.trim() || !form.subject.trim() || createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Add Teacher'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teacher Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl ${avatarColors[0]} flex items-center justify-center text-white font-bold text-lg overflow-hidden`}>
                  {selected.avatar_url
                    ? <img src={selected.avatar_url} alt={selected.name} className="w-full h-full object-cover" />
                    : selected.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selected.name}</h3>
                  <p className="text-sm text-muted-foreground">{selected.subject}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Email', value: selected.email },
                  { label: 'Phone', value: selected.phone || '—' },
                  { label: 'Class', value: selected.class_name || '—' },
                  { label: 'Status', value: selected.status || 'active' },
                  { label: 'Join Date', value: selected.join_date || '—' },
                  { label: 'Added', value: selected.created_date ? new Date(selected.created_date).toLocaleDateString() : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-secondary rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5 break-all">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}