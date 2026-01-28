
import React, { useState } from 'react';
import { User, LeaderAvailability, DAYS, GlobalLeader } from '../types';
import { X, LogOut, Shield, User as UserIcon, BadgeCheck, Key, Check, CalendarCheck, Lock, Loader2 } from 'lucide-react';
import { hashPassword } from '../services/securityUtils';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onLogout: () => void;
  onUpdatePassword: (newPass: string) => void;
  leaderPresence: LeaderAvailability;
  setLeaderPresence: (pres: LeaderAvailability) => void;
  leaders: GlobalLeader[];
  addNotification: (msg: string, type?: 'error' | 'success' | 'info') => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ 
  user, onClose, onLogout, onUpdatePassword, 
  leaderPresence, setLeaderPresence, leaders,
  addNotification
}) => {
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState(false);

  const currentLeader = leaders.find(l => l.name === user.displayName);

  const handlePasswordChange = async () => {
    if (newPassword.length < 4) {
      addNotification("Passwort muss mindestens 4 Zeichen lang sein.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      addNotification("Passwörter stimmen nicht überein.", "error");
      return;
    }
    
    setIsUpdating(true);
    try {
      const hashed = await hashPassword(newPassword);
      onUpdatePassword(hashed);
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccess(false);
        setShowPasswordChange(false);
      }, 2000);
    } catch (err) {
      addNotification("Fehler beim Hashen des Passworts.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleMyPresence = (day: string) => {
    if (!currentLeader) return;
    const currentDayPres = leaderPresence[day] || [];
    const updated = currentDayPres.includes(currentLeader.id)
      ? currentDayPres.filter(id => id !== currentLeader.id)
      : [...currentDayPres, currentLeader.id];
    
    setLeaderPresence({ ...leaderPresence, [day]: updated });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-start justify-end z-[60] p-4">
      <div 
        className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-right-8 duration-300 mt-16 flex flex-col max-h-[85vh]"
      >
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 shrink-0">
          <h3 className="font-serif font-bold text-slate-800">Dein Profil</h3>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 text-center space-y-6 overflow-y-auto flex-1 no-scrollbar">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-3xl bg-slate-800 flex items-center justify-center mx-auto shadow-xl rotate-3">
              <span className="text-3xl font-bold text-white rotate-[-3deg]">
                {user.displayName.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-xl border-4 border-white">
              {user.role === 'ADMIN' ? <Shield size={16} /> : <BadgeCheck size={16} />}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-800">{user.displayName}</h2>
            <p className="text-slate-400 text-sm font-medium">@{user.username}</p>
          </div>

          {currentLeader && (
            <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-2 justify-center mb-2">
                <CalendarCheck size={16} className="text-emerald-500" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Meine Anwesenheit</p>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {DAYS.map(day => {
                  const isPresent = (leaderPresence[day] || []).includes(currentLeader.id);
                  const dateShort = day.split(', ')[1].split('.')[0];
                  return (
                    <button 
                      key={day}
                      onClick={() => toggleMyPresence(day)}
                      className={`flex flex-col items-center py-2 rounded-xl transition-all border ${isPresent ? 'bg-white border-emerald-100 shadow-sm text-emerald-600' : 'bg-transparent border-transparent text-slate-300'}`}
                    >
                      <span className="text-[8px] font-black uppercase tracking-tighter mb-1">{day.substring(0,2)}</span>
                      <span className="text-xs font-bold">{dateShort}.</span>
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isPresent ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!showPasswordChange ? (
            <button 
              onClick={() => setShowPasswordChange(true)}
              className="w-full bg-slate-50 py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-all uppercase tracking-widest"
            >
              <Key size={14} /> Passwort ändern
            </button>
          ) : (
            <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4 animate-in fade-in duration-300">
               <div className="text-left space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Neues Passwort</label>
                 <input 
                   type="password" 
                   value={newPassword}
                   onChange={e => setNewPassword(e.target.value)}
                   className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100"
                   placeholder="••••••••"
                 />
               </div>
               <div className="text-left space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Wiederholen</label>
                 <input 
                   type="password" 
                   value={confirmPassword}
                   onChange={e => setConfirmPassword(e.target.value)}
                   className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100"
                   placeholder="••••••••"
                 />
               </div>
               <div className="flex gap-2">
                 <button onClick={() => setShowPasswordChange(false)} className="flex-1 bg-white border border-slate-100 py-3 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest">Abbrechen</button>
                 <button onClick={handlePasswordChange} disabled={isUpdating || success} className={`flex-1 py-3 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${success ? 'bg-emerald-500' : 'bg-slate-800 hover:bg-slate-700'}`}>
                   {isUpdating ? <Loader2 className="animate-spin" size={14} /> : (success ? 'Gespeichert' : 'Speichern')}
                 </button>
               </div>
            </div>
          )}

          <div className="pt-4 pb-4">
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all group"
            >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
