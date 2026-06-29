import React from 'react';
import { Key } from 'lucide-react';
import ChangePassword from '@/components/admin/ChangePassword';

export default function Security() {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Key className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Security Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account password and security</p>
        </div>
      </div>

      <div className="mt-8">
        <ChangePassword />
      </div>
    </div>
  );
}
