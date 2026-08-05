import React, { useState, useEffect } from 'react';
import { Trash2, Search, Eye, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { db } from '@/lib/firebase';
import { collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

const statusColors = {
  attentive: 'bg-green-500/10 text-green-600 border-green-500/20',
  distracted: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  sleepy: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  absent: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export default function AdminStudents() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsub = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDoc(doc(db, 'users', id)),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete student: " + error.message,
        variant: "destructive",
      });
    }
  });
const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(search.toLowerCase()) ||
    s.class_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Badge variant="outline" className="shrink-0">{filtered.length} students</Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No students found</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Student</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Roll No.</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Class</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((student) => {
                const initials = student.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
                return (
                  <tr key={student.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0 overflow-hidden">
                          {student.avatar_url
                            ? <img src={student.avatar_url} alt={student.name} className="w-full h-full object-cover" />
                            : initials}
                        </div>
                        <span className="font-medium text-foreground">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{student.roll_number}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{student.class_name || '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {student.status && (
                        <Badge variant="outline" className={`text-[10px] ${statusColors[student.status] || ''}`}>
                          {student.status}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSelected(student)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Student?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete <strong>{student.name}</strong> and all their data. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(student.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Student Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg overflow-hidden">
                  {selected.avatar_url
                    ? <img src={selected.avatar_url} alt={selected.name} className="w-full h-full object-cover" />
                    : selected.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selected.name}</h3>
                  <p className="text-sm text-muted-foreground">Roll No: {selected.roll_number}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Class', value: selected.class_name || '—' },
                  { label: 'Status', value: selected.status || '—' },
                  { label: 'Attention Score', value: selected.attention_score != null ? `${selected.attention_score}%` : '—' },
                  { label: 'Added', value: selected.created_date ? new Date(selected.created_date).toLocaleDateString() : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-secondary rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              {selected.attention_score != null && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Attention Score</p>
                  <Progress value={selected.attention_score} className="h-2" />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}