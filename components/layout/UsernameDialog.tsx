'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface UsernameDialogProps {
  open: boolean;
  onSubmit: (username: string) => void;
}

export function UsernameDialog({ open, onSubmit }: UsernameDialogProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError('Please enter a username');
      return;
    }

    if (trimmedUsername.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }

    if (trimmedUsername.length > 50) {
      setError('Username must be less than 50 characters');
      return;
    }

    onSubmit(trimmedUsername);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Welcome!</DialogTitle>
          <DialogDescription className="text-center pt-2">
            What should we call you?
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              className="text-center text-lg"
              autoFocus
            />
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          </div>
          <Button type="submit" className="w-full bg-[#cc785c] hover:bg-[#b86a4f]">
            Get Started
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
