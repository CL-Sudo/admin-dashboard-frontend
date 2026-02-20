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
    onSuccess: data => {
      toast('Password reset requested');
      // In dev, backend may return resetToken
      // Show it in the dialog so you can test without email infra.
    },
    onError: e =>
      toast('Reset request failed', {
        description: getErrorMessage(e),
      }),
  });

  const resetToken = (mut.data as any)?.resetToken;
  const expiresAt = (mut.data as any)?.expiresAt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Password Reset</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm">
            <div className="font-medium">{user?.email}</div>
            <div className="opacity-70">{user?.name}</div>
          </div>

          <Button
            onClick={() => mut.mutate()}
            disabled={mut.isPending || !user}
          >
            {mut.isPending ? 'Requesting...' : 'Request reset'}
          </Button>

          {resetToken && (
            <div className="space-y-2">
              <Label>Dev Reset Token</Label>
              <Input value={resetToken} readOnly />
              {expiresAt && (
                <div className="text-xs opacity-70">
                  Expires: {new Date(expiresAt).toLocaleString()}
                </div>
              )}
              <div className="text-xs opacity-70">
                Use it with <code>/auth/reset-password</code> on your
                reset page or Postman.
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
