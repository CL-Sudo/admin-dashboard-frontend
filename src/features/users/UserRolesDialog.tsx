import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  setUserRoles,
  type RoleName,
  type UserRow,
} from '@/api/users';
import { usersKeys } from './users.keys';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/httpError';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function UserRolesDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: UserRow | null;
}) {
  const qc = useQueryClient();
  const [role, setRole] = useState<RoleName>('VIEWER');

  useEffect(() => {
    if (user?.roles?.length) setRole(user.roles[0]);
  }, [user]);

  const mut = useMutation({
    mutationFn: () => setUserRoles(user!.id, [role]),
    onSuccess: async () => {
      toast('Roles updated');
      await qc.invalidateQueries({ queryKey: usersKeys.all });
      onOpenChange(false);
    },
    onError: e =>
      toast('Role update failed', {
        description: getErrorMessage(e),
      }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Roles</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm">
            <div className="font-medium">{user?.email}</div>
            <div className="opacity-70">{user?.name}</div>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={role}
              onValueChange={v => setRole(v as RoleName)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEWER">VIEWER</SelectItem>
                <SelectItem value="STAFF">STAFF</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => mut.mutate()}
              disabled={mut.isPending || !user}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
