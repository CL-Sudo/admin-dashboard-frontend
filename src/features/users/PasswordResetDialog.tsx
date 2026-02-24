import { useMutation } from '@tanstack/react-query';
import { requestUserPasswordReset, type UserRow } from '@/api/users';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/httpError';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
type ResetResponse = Awaited<
  ReturnType<typeof requestUserPasswordReset>
>;

export default function PasswordResetDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: UserRow | null;
}) {
  const mut = useMutation({
    mutationFn: () => requestUserPasswordReset(user!.id),
    onSuccess: () => {
      toast('Password reset requested');
      setHasRequested(true);
    },
    onError: e =>
      toast('Reset request failed', {
        description: getErrorMessage(e),
      }),
  });

  const [hasRequested, setHasRequested] = useState(false);
  const [copied, setCopied] = useState(false);

  const resetData: ResetResponse | undefined = mut.data;
  const resetToken =
    resetData && 'resetToken' in resetData
      ? resetData.resetToken
      : undefined;
  const expiresAt =
    resetData && 'expiresAt' in resetData
      ? resetData.expiresAt
      : undefined;

  const handleCopy = async () => {
    if (!resetToken) return;
    try {
      await navigator.clipboard.writeText(resetToken);
      toast.success('Token copied to clipboard');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy token');
    }
  };

  const onClose = () => {
    setHasRequested(false);
    setCopied(false);
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setHasRequested(false);
      setCopied(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Password Reset</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm">
            <div className="font-medium">{user?.email}</div>
            <div className="opacity-70">{user?.name}</div>
          </div>

          {!hasRequested && (
            <div className="flex justify-center">
              <Button
                onClick={() => mut.mutate()}
                disabled={mut.isPending || !user || hasRequested}
              >
                {mut.isPending ? 'Requesting...' : 'Request reset'}
              </Button>
            </div>
          )}

          {hasRequested && resetToken && (
            <div className="space-y-2">
              <Label>Reset Token</Label>
              <div className="flex gap-2">
                <Input
                  value={resetToken}
                  readOnly
                  className="flex-1"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          void handleCopy();
                        }}
                        className="shrink-0"
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {copied ? 'Copied!' : 'Copy to clipboard'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {expiresAt && (
                <div className="text-xs opacity-70">
                  Expires: {new Date(expiresAt).toLocaleString()}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
