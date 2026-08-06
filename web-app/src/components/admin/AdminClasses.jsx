import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, GraduationCap, User } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminClasses() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [newClassName, setNewClassName] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch Classes
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });

    // Fetch Teachers
    const qTeachers = query(collection(db, 'users'), where('role', '==', 'teacher'), where('status', '==', 'approved'));
    const unsubTeachers = onSnapshot(qTeachers, (snapshot) => {
      setTeachers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubClasses();
      unsubTeachers();
    };
  }, []);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName || !selectedTeacherId) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    const teacher = teachers.find(t => t.id === selectedTeacherId);

    try {
      await addDoc(collection(db, 'classes'), {
        name: newClassName,
        teacherId: selectedTeacherId,
        teacherName: teacher.name,
        createdAt: new Date().toISOString()
      });
      setNewClassName('');
      setSelectedTeacherId('');
      toast({ title: "Success", description: "Class created and teacher assigned." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create class.", variant: "destructive" });
    }
  };

  const handleDeleteClass = async (id) => {
    try {
      await deleteDoc(doc(db, 'classes', id));
      toast({ title: "Deleted", description: "Class removed." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete class.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Create New Class</h3>
        <form onSubmit={handleCreateClass} className="grid sm:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label>Class Name</Label>
            <Input
              placeholder="e.g. Physics 101"
              value={newClassName}
              onChange={e => setNewClassName(e.target.value)}
              data-testid="class-name-input"
            />
          </div>
          <div className="space-y-2">
            <Label>Assign Teacher</Label>
            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
              <SelectTrigger data-testid="teacher-select-trigger">
                <SelectValue placeholder="Select Teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map(t => (
                  <SelectItem key={t.id} value={t.id} data-testid={`teacher-option-${t.id}`}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="flex items-center gap-2" data-testid="create-class-button">
            <Plus className="w-4 h-4" /> Create Class
          </Button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map(cls => (
          <div key={cls.id} className="p-4 bg-white border border-border rounded-xl shadow-sm relative group">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
              onClick={() => handleDeleteClass(cls.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-lg">{cls.name}</h4>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>Teacher: {cls.teacherName}</span>
            </div>
          </div>
        ))}
        {classes.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-secondary/20 rounded-xl border border-dashed">
            No classes created yet.
          </div>
        )}
      </div>
    </div>
  );
}
