import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, User as UserIcon, LogOut, Save } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useAuth';

interface UserOffcanvasProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserOffcanvas({ open, onOpenChange }: UserOffcanvasProps) {
  const { user, updateUser, logout, getUser } = useAuth();

  const [username, setUsername] = React.useState(user?.username || '');
  const [email, setEmail] = React.useState(user?.email || '');
  const [password, setPassword] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      // Refresh user when opening and reset form
      getUser().then((u) => {
        setUsername(u?.username || '');
        setEmail(u?.email || '');
        setPassword('');
      }).catch(() => {
        // ignore
      });
      setMessage(null);
      setError(null);
    }
  }, [open, getUser]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const patch: any = { username, email };
      if (password.trim() !== '') patch.password = password;
      await updateUser(patch);
      setMessage('Datele au fost actualizate.');
      setPassword('');
    } catch (e: any) {
      setError(e?.message || 'Eroare la actualizare');
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    try {
      await logout();
      // onOpenChange will be handled by Header navigation
    } catch {
      // ignore
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content
          className="fixed top-0 right-0 h-full w-full max-w-md bg-gray-900 border-l border-gray-800 z-50 shadow-xl transform transition-transform data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-gray-300" />
              <Dialog.Title className="text-base font-semibold text-gray-100">Cont utilizator</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          <div className="p-4 space-y-4">
            {user && (
              <div className="text-sm text-gray-400">
                <div>ID: <span className="text-gray-200">{user.id}</span></div>
                {user.role && <div>Rol: <span className="text-gray-200">{user.role}</span></div>}
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-200 px-3 py-2 rounded text-sm">{error}</div>
            )}
            {message && (
              <div className="bg-green-900/30 border border-green-700 text-green-200 px-3 py-2 rounded text-sm">{message}</div>
            )}

            <form onSubmit={onSave} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Username</label>
                <input
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded outline-none focus:ring-2 focus:ring-purple-600"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Email</label>
                <input
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded outline-none focus:ring-2 focus:ring-purple-600"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Parola (opțional)</label>
                <input
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded outline-none focus:ring-2 focus:ring-purple-600"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Lasă gol pentru a păstra parola"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <Button type="submit" className="flex-1 inline-flex items-center justify-center" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Se salvează...' : 'Salvează'}
                </Button>
                <Dialog.Close asChild>
                  <Button variant="secondary">Închide</Button>
                </Dialog.Close>
              </div>
            </form>

            <div className="pt-4 border-t border-gray-800">
              <Button variant="destructive" className="w-full inline-flex items-center justify-center" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Delogare
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
