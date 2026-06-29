import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { Clock, LogOut } from 'lucide-react';

const UserPendingApproval = ({ message }) => {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-slate-100 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-blue-50">
          <Clock className="w-10 h-10 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Pending Approval</h1>
        <p className="text-slate-600 mb-8">
          {message || "Your account has been created successfully and is currently awaiting administrator approval. You will be able to access the dashboard once approved."}
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-xl text-sm text-blue-700 text-left">
            <p className="font-semibold mb-1">What's next?</p>
            <p>Our administrators will review your registration. This usually takes less than 24 hours.</p>
          </div>

          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserPendingApproval;
