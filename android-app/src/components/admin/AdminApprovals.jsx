import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Check, X, User } from 'lucide-react';

export default function AdminApprovals() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'users'), where('status', '==', 'pending'));
    const unsub = onSnapshot(q, (snapshot) => {
      setPendingUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const handleApprove = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'approved'
      });
      toast({ title: "Approved", description: "User has been approved successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to approve user.", variant: "destructive" });
    }
  };

  const handleReject = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'rejected'
      });
      toast({ title: "Rejected", description: "User has been rejected." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to reject user.", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pending Approvals</h3>
      {pendingUsers.length === 0 ? (
        <div className="text-center py-12 bg-secondary/20 rounded-xl border border-dashed text-muted-foreground">
          No pending approvals found.
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map(user => (
            <div key={user.id} className="flex items-center justify-between p-4 bg-white border border-border rounded-xl shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold">{user.name || 'No Name'}</h4>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge variant="secondary" className="mt-1 capitalize">{user.role}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleReject(user.id)}>
                  <X className="w-4 h-4 mr-1" /> Reject
                </Button>
                <Button size="sm" onClick={() => handleApprove(user.id)}>
                  <Check className="w-4 h-4 mr-1" /> Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
