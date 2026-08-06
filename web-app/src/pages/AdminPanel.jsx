import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Shield, UserCheck, Users, GraduationCap } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import AdminStudents from '@/components/admin/AdminStudents';
import AdminTeachers from '@/components/admin/AdminTeachers';
import AdminApprovals from '@/components/admin/AdminApprovals';
import AdminClasses from '@/components/admin/AdminClasses';

export default function AdminPanel() {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <Shield className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Admin Access Required</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          You need administrator privileges to access this panel. Please contact your system administrator.
        </p>
        <p className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg">
          Logged in as: <span className="font-medium">{user?.email || 'Unknown'}</span> · Role: <span className="font-medium">{user?.role || 'user'}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage approvals, users and class assignments</p>
        </div>
      </div>

      <Tabs defaultValue="approvals">
        <TabsList className="bg-secondary p-1">
          <TabsTrigger value="approvals" className="flex items-center gap-2" data-testid="tab-approvals">
            <UserCheck className="w-4 h-4" /> Approvals
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center gap-2" data-testid="tab-classes">
            <GraduationCap className="w-4 h-4" /> Classes
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2" data-testid="tab-students">
            <Users className="w-4 h-4" /> Students
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2" data-testid="tab-teachers">
            <Users className="w-4 h-4" /> Teachers
          </TabsTrigger>
        </TabsList>
        <TabsContent value="approvals" className="mt-6">
          <AdminApprovals />
        </TabsContent>
        <TabsContent value="classes" className="mt-6">
          <AdminClasses />
        </TabsContent>
        <TabsContent value="students" className="mt-6">
          <AdminStudents />
        </TabsContent>
        <TabsContent value="teachers" className="mt-6">
          <AdminTeachers />
        </TabsContent>
      </Tabs>
    </div>
  );
}
