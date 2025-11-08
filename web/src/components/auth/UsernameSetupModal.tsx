'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Check, X } from 'lucide-react';

export function UsernameSetupModal({ open }: { open: boolean }) {
  const [username, setUsername] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { setUsername: saveUsername, checkUsernameAvailable } = useAuthContext();

  const handleUsernameChange = async (value: string) => {
    setUsername(value);

    const normalized = value.toLowerCase().trim();

    // Reset availability if empty or invalid format
    if (!normalized || !/^[a-z0-9_]{3,20}$/.test(normalized)) {
      setAvailable(null);
      return;
    }

    // Check availability
    setChecking(true);
    try {
      const isAvailable = await checkUsernameAvailable(normalized);
      setAvailable(isAvailable);
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!available) {
      toast.error('Please choose an available username');
      return;
    }

    setSubmitting(true);
    try {
      await saveUsername(username);
      toast.success('Welcome to Branch!');
    } catch (error: any) {
      console.error('Error setting username:', error);
      toast.error(error.message || 'Failed to set username');
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = /^[a-z0-9_]{3,20}$/.test(username.toLowerCase().trim());

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Choose Your Username</DialogTitle>
          <DialogDescription>
            Pick a unique username to get started. You'll use this to connect with friends.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                placeholder="e.g., study_master_2024"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className="pr-10"
                autoFocus
              />
              {checking && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                </div>
              )}
              {!checking && isValid && available !== null && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {available ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-red-600" />
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              3-20 characters, lowercase letters, numbers, and underscores only
            </p>
            {!checking && !isValid && username.length > 0 && (
              <p className="text-xs text-red-600">Invalid username format</p>
            )}
            {!checking && isValid && available === false && (
              <p className="text-xs text-red-600">This username is already taken</p>
            )}
            {!checking && isValid && available === true && (
              <p className="text-xs text-green-600">This username is available!</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-[#6fb168] hover:bg-[#5a9a54] text-white"
            disabled={!available || submitting}
          >
            {submitting ? 'Setting up...' : 'Continue'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
