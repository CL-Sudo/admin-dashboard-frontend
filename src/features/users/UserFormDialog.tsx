import { useEffect } from 'react';
import { z } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createUser, updateUser, type UserRow } from '@/api/users';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  initialPassword: z.string().optional(),
  role: z.enum(['ADMIN', 'STAFF', 'VIEWER']),
});
type FormValues = z.infer<typeof schema>;

export default function UserFormDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: UserRow | null;
}) {
  const qc = useQueryClient();
  const isEdit = !!user?.id;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      name: '',
      initialPassword: '',
      role: 'VIEWER',
    },
  });
  const selectedRole = useWatch({
    control: form.control,
    name: 'role',
  });

  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email,
        name: user.name,
        initialPassword: '',
        role: user.roles?.[0] ?? 'VIEWER',
      });
    } else if (open) {
      form.reset({
        email: '',
        name: '',
        initialPassword: '',
        role: 'VIEWER',
      });
    }
  }, [user, form, open]);

  const createMut = useMutation({
    mutationFn: (v: FormValues) => {
      const initialPassword = v.initialPassword?.trim();
      return createUser({
        email: v.email,
        name: v.name,
        initialPassword:
          initialPassword && initialPassword.length > 0
            ? initialPassword
            : undefined,
        roles: [v.role],
      });
    },
    onSuccess: async () => {
      toast('User created');
      await qc.invalidateQueries({ queryKey: usersKeys.all });
      onOpenChange(false);
    },
    onError: e =>
      toast('Create failed', {
        description: getErrorMessage(e),
      }),
  });

  const updateMut = useMutation({
    mutationFn: (v: FormValues) =>
      updateUser(user!.id, { email: v.email, name: v.name }),
    onSuccess: async () => {
      toast('User updated');
      await qc.invalidateQueries({ queryKey: usersKeys.all });
      onOpenChange(false);
    },
    onError: e =>
      toast('Update failed', {
        description: getErrorMessage(e),
      }),
  });

  const onSubmit = (v: FormValues) => {
    const pwd = v.initialPassword?.trim();
    if (pwd && pwd.length < 6) {
      form.setError('initialPassword', {
        message: 'Password must be at least 6 characters',
      });
      return;
    }

    if (isEdit) return updateMut.mutate(v);
    return createMut.mutate({
      ...v,
      initialPassword: pwd && pwd.length > 0 ? pwd : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit User' : 'Create User'}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={event => {
            event.preventDefault();
            void form.handleSubmit(values => onSubmit(values))(event);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>Email</Label>
            <Input {...form.register('email')} disabled={isEdit} />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label>Initial Password (optional)</Label>
              <Input
                type="password"
                {...form.register('initialPassword')}
              />
              {form.formState.errors.initialPassword && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.initialPassword.message}
                </p>
              )}
              <p className="text-xs opacity-70">
                Enterprise note: real systems prefer reset-token flow;
                this is for demo convenience.
              </p>
            </div>
          )}

          {!isEdit && (
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={selectedRole}
                onValueChange={v => {
                  if (
                    v === 'ADMIN' ||
                    v === 'STAFF' ||
                    v === 'VIEWER'
                  ) {
                    form.setValue('role', v);
                  }
                }}
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
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMut.isPending || updateMut.isPending}
            >
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
