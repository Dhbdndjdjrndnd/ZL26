
import React, { useState } from 'react';
import { Tent, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { User } from '../types';
import { hashPassword } from '../services/securityUtils';

interface LoginViewProps {
  onLogin: (user: User) => void;
  users: User[];
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const hashedInput = await hashPassword(password);
      const user = users.find(u => u.username === username && u.password === hashedInput);
      
      if (user) {
        onLogin(user);
      } else {
        setError('Ungültiger Benutzername oder Passwort.');
      }
    } catch (err) {
      setError('Login-Fehler. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFC] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto shadow-2xl rotate-3">
            <Tent size={40} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-serif font-bold text-slate-800">Zeltlager</h1>
            <p className="text-slate-400 font-medium">Melde dich an, um fortzufahren</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Benutzername</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-12 py-4 text-sm focus:ring-2 focus:ring-blue-100"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Passwort</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-12 py-4 text-sm focus:ring-2 focus:ring-blue-100"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Anmelden'}
            </button>
          </form>
          <div className="text-center pt-2">
             <p className="text-[10px] text-slate-300 uppercase font-bold tracking-tighter">Sicheres Login-Verfahren aktiv</p>
          </div>
        </div>
      </div>
    </div>
  );
};
