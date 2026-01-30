
import React, { useState } from 'react';
import { GlobalLeader, GlobalGroup, User, UserRole, GroupMarker, TimeSlotConfig, LeaderAvailability } from '../types';
import { Trash2, ShieldCheck, Plus, FileUp, Key, RefreshCw, Palette, Clock, ChevronDown, ChevronRight, Check, Users, Database, Download, Lock, Save, HardDrive, AlertTriangle, Code, UserPlus, Edit2, CheckCircle2, CalendarDays } from 'lucide-react';
import { hashPassword } from '../services/securityUtils';

interface AdminViewProps {
  leaders: GlobalLeader[];
  groups: GlobalGroup[];
  setLeaders: React.Dispatch<React.SetStateAction<GlobalLeader[]>>;
  setGroups: React.Dispatch<React.SetStateAction<GlobalGroup[]>>;
  timeSlots: TimeSlotConfig[];
  setTimeSlots: React.Dispatch<React.SetStateAction<TimeSlotConfig[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  markers: GroupMarker[];
  setMarkers: React.Dispatch<React.SetStateAction<GroupMarker[]>>;
  onCsvUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  leaderPresence: LeaderAvailability;
  setLeaderPresence: React.Dispatch<React.SetStateAction<LeaderAvailability>>;
  addNotification: (msg: string, type?: 'error' | 'success' | 'info') => void;
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  onSystemExport: (masterPassword: string) => void;
  onSystemImport: (e: React.ChangeEvent<HTMLInputElement>, pass: string) => void;
  onDeleteUser: (id: string) => void;
  onDeleteLeader: (id: string) => void;
  onDeleteMarker: (id: string) => void;
  onDeleteSlot: (idx: number) => void;
  onDeleteGroup: (id: string) => void;
  onUpdateUserPassword: (id: string, hashedPass: string) => void;
  onResetApp: () => void;
  days: string[];
}

type AdminSection = 'period' | 'presence' | 'accounts' | 'markers' | 'groups' | 'slots' | 'backup' | 'hosting';

export const AdminView: React.FC<AdminViewProps> = ({ 
  leaders, groups, setLeaders, setGroups, 
  timeSlots, setTimeSlots, users, setUsers, 
  markers, setMarkers,
  onCsvUpload, isUploading,
  leaderPresence, setLeaderPresence,
  addNotification,
  startDate, setStartDate,
  endDate, setEndDate,
  onSystemExport, onSystemImport,
  onDeleteUser, onDeleteLeader, onDeleteMarker, onDeleteSlot, onDeleteGroup,
  onUpdateUserPassword, onResetApp,
  days
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection | null>('period');
  
  // Form States
  const [leaderName, setLeaderName] = useState('');
  const [uName, setUName] = useState('');
  const [uDisplay, setUDisplay] = useState('');
  const [uPass, setUPass] = useState('');
  const [uRole, setURole] = useState<UserRole>('LEITER');
  
  const [markerColor, setMarkerColor] = useState('#6366F1');
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('10:00');
  
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const toggleSection = (section: AdminSection) => setActiveSection(prev => prev === section ? null : section);

  const toggleAllDaysForLeader = (leaderId: string) => {
    const isPresentEverywhere = days.every(day => (leaderPresence[day] || []).includes(leaderId));
    
    setLeaderPresence(prev => {
      const updated = { ...prev };
      days.forEach(day => {
        const current = updated[day] || [];
        if (isPresentEverywhere) {
          updated[day] = current.filter(id => id !== leaderId);
        } else {
          if (!current.includes(leaderId)) {
            updated[day] = [...current, leaderId];
          }
        }
      });
      return updated;
    });
    
    addNotification(isPresentEverywhere ? "Leiter für alle Tage abgemeldet" : "Leiter für alle Tage angemeldet", "info");
  };

  const addLeaderToPool = (name: string) => {
    if (!name) return;
    const newId = Math.random().toString(36).substr(2, 9);
    setLeaders(prev => [...prev, { id: newId, name, role: 'LEITER' }]);
    
    setLeaderPresence(prev => {
      const updated = { ...prev };
      days.forEach(day => {
        updated[day] = [...(updated[day] || []), newId];
      });
      return updated;
    });

    setLeaderName('');
    addNotification(`Leiter '${name}' hinzugefügt und auf anwesend gesetzt.`, "success");
  };

  const addUserAccount = async () => {
    if (!uName || !uPass) return;
    const newUserId = Math.random().toString(36).substr(2, 9);
    const hashed = await hashPassword(uPass);
    const disp = uDisplay || uName;
    
    setUsers(prev => [...prev, { id: newUserId, username: uName, displayName: disp, password: hashed, role: uRole }]);
    
    if (!leaders.some(l => l.name === disp)) {
      addLeaderToPool(disp);
    }
    
    setUName(''); setUPass(''); setUDisplay('');
    addNotification(`Account @${uName} erstellt.`, "success");
  };

  const updateMarker = (id: string, updates: Partial<GroupMarker>) => {
    setMarkers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const toggleStandardLeaderForMarker = (markerId: string, leaderId: string) => {
    setMarkers(prev => prev.map(m => {
      if (m.id !== markerId) return m;
      const current = m.standardLeaderIds || [];
      const updated = current.includes(leaderId) 
        ? current.filter(id => id !== leaderId) 
        : [...current, leaderId];
      return { ...m, standardLeaderIds: updated };
    }));
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-8">
        <h2 className="text-3xl font-serif font-bold text-slate-800">Admin-Zentrale</h2>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Systemverwaltung & Konfiguration</p>
      </div>

      {/* ZEITRAUM KONFIGURATION */}
      <section className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <button onClick={() => toggleSection('period')} className="flex items-center justify-between w-full px-8 py-6 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-4"><CalendarDays size={20} className="text-blue-600" /> <h3 className="text-lg font-bold text-slate-800 uppercase">Zeltlager-Zeitraum</h3></div>
          {activeSection === 'period' ? <ChevronDown /> : <ChevronRight />}
        </button>
        {activeSection === 'period' && (
          <div className="p-8 border-t border-slate-50 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Startdatum</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm focus:ring-2 focus:ring-blue-100"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Enddatum</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm focus:ring-2 focus:ring-blue-100"
                  />
               </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
               <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-2">Vorschau der generierten Tage:</p>
               <div className="flex flex-wrap gap-2">
                  {days.map(d => (
                    <span key={d} className="px-3 py-1 bg-white rounded-lg text-[9px] font-black text-blue-500 shadow-sm border border-blue-50">{d}</span>
                  ))}
               </div>
            </div>
          </div>
        )}
      </section>

      {/* ANWESENHEIT */}
      <section className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <button onClick={() => toggleSection('presence')} className="flex items-center justify-between w-full px-8 py-6 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-4"><Check size={20} className="text-emerald-500" /> <h3 className="text-lg font-bold text-slate-800 uppercase">Anwesenheit</h3></div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] text-slate-400 font-bold uppercase mr-4">Doppelklick zum umschalten aller Tage</span>
            {activeSection === 'presence' ? <ChevronDown /> : <ChevronRight />}
          </div>
        </button>
        {activeSection === 'presence' && (
          <div className="p-8 border-t border-slate-50 overflow-x-auto no-scrollbar">
             <table className="w-full text-left text-xs">
                <thead><tr><th className="pb-2 text-[10px] font-black text-slate-400 uppercase">Leiter</th>{days.map(d => <th key={d} className="text-center font-black uppercase text-slate-400 px-2">{d.split(', ')[1].split('.')[0]}</th>)}</tr></thead>
                <tbody>{leaders.map(l => (
                  <tr key={l.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td 
                      className="py-3 font-bold text-slate-700 cursor-pointer select-none"
                      onDoubleClick={() => toggleAllDaysForLeader(l.id)}
                      title="Doppelklick: Alle Tage umschalten"
                    >
                      {l.name}
                    </td>
                    {days.map(d => (
                      <td key={d} className="text-center">
                        <button onClick={() => setLeaderPresence(prev => ({ ...prev, [d]: (prev[d] || []).includes(l.id) ? prev[d].filter(id => id !== l.id) : [...(prev[d] || []), l.id] }))}>
                          <div className={`w-5 h-5 rounded-lg mx-auto transition-all ${leaderPresence[d]?.includes(l.id) ? 'bg-emerald-500 shadow-md' : 'bg-slate-100'}`} />
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}</tbody>
             </table>
          </div>
        )}
      </section>

      {/* ACCOUNTS & LEITERPOOL */}
      <section className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <button onClick={() => toggleSection('accounts')} className="flex items-center justify-between w-full px-8 py-6 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-4"><Key size={20} className="text-blue-500" /> <h3 className="text-lg font-bold text-slate-800 uppercase">Accounts & Pool</h3></div>
          {activeSection === 'accounts' ? <ChevronDown /> : <ChevronRight />}
        </button>
        {activeSection === 'accounts' && (
          <div className="p-8 border-t border-slate-50 space-y-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neuen Login-Account erstellen</h4>
              <div className="grid grid-cols-2 gap-4">
                <input value={uName} onChange={e => setUName(e.target.value)} placeholder="Login Name..." className="bg-slate-50 p-4 rounded-2xl text-sm border-none focus:ring-2 focus:ring-blue-100" />
                <input value={uDisplay} onChange={e => setUDisplay(e.target.value)} placeholder="Anzeige Name..." className="bg-slate-50 p-4 rounded-2xl text-sm border-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <input type="password" value={uPass} onChange={e => setUPass(e.target.value)} placeholder="Initial-Passwort" className="w-full bg-slate-50 p-4 rounded-2xl text-sm border-none focus:ring-2 focus:ring-blue-100" />
              <div className="flex gap-2">
                 <button onClick={() => setURole('LEITER')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${uRole === 'LEITER' ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>Leiter</button>
                 <button onClick={() => setURole('ADMIN')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${uRole === 'ADMIN' ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>Admin</button>
              </div>
              <button onClick={addUserAccount} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-blue-700">Account Anlegen</button>
            </div>

            <div className="pt-8 border-t border-slate-100 space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Existierende Accounts</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {users.map(u => (
                   <div key={u.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                     <div className="flex justify-between items-center">
                       <div className="flex flex-col">
                         <span className="font-bold text-slate-700">{u.displayName}</span>
                         <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">@{u.username} • {u.role}</span>
                       </div>
                       <div className="flex gap-2">
                         <button onClick={() => setEditingUserId(editingUserId === u.id ? null : u.id)} className={`p-2 rounded-xl ${editingUserId === u.id ? 'bg-blue-500 text-white shadow-md' : 'text-slate-400 hover:bg-white'}`}><Edit2 size={16} /></button>
                         {u.username !== 'admin' && <button onClick={() => onDeleteUser(u.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2"><Trash2 size={16} /></button>}
                       </div>
                     </div>
                     {editingUserId === u.id && (
                       <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-2 animate-in slide-in-from-top-2 duration-200">
                          <input 
                            type="password" 
                            placeholder="Neues Passwort..." 
                            className="w-full text-xs p-2 bg-slate-50 rounded-lg outline-none focus:ring-1 focus:ring-blue-200"
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                const hashed = await hashPassword(e.currentTarget.value);
                                onUpdateUserPassword(u.id, hashed);
                                setEditingUserId(null);
                                addNotification("Passwort aktualisiert", "success");
                              }
                            }}
                          />
                          <p className="text-[8px] text-slate-400 text-center">Enter zum Speichern</p>
                       </div>
                     )}
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}
      </section>

      {/* MARKER & TEAMS */}
      <section className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <button onClick={() => toggleSection('markers')} className="flex items-center justify-between w-full px-8 py-6 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-4"><Palette size={20} className="text-indigo-500" /> <h3 className="text-lg font-bold text-slate-800 uppercase">Gruppenmarker & Teams</h3></div>
          {activeSection === 'markers' ? <ChevronDown /> : <ChevronRight />}
        </button>
        {activeSection === 'markers' && (
          <div className="p-8 border-t border-slate-50 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input value={uName} onChange={e => setUName(e.target.value)} placeholder="Marker Name..." className="bg-slate-50 p-4 rounded-2xl text-sm" />
              <input type="color" value={markerColor} onChange={e => setMarkerColor(e.target.value)} className="w-full h-full bg-slate-50 p-1 rounded-2xl cursor-pointer min-h-[50px]" />
              <button onClick={() => { setMarkers(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), label: uName, color: markerColor, standardLeaderIds: [] }]); setUName(''); }} className="bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs">Neu Erstellen</button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {markers.map(m => (
                <div key={m.id} className="bg-slate-50 rounded-3xl border border-slate-100 p-6 space-y-4">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <input 
                          type="color" 
                          value={m.color} 
                          onChange={e => updateMarker(m.id, { color: e.target.value })}
                          className="w-10 h-10 rounded-xl bg-transparent p-0 border-none cursor-pointer"
                        />
                        <input 
                          value={m.label}
                          onChange={e => updateMarker(m.id, { label: e.target.value })}
                          className="bg-transparent border-none font-bold text-slate-800 text-lg p-0 focus:ring-0"
                        />
                     </div>
                     <button onClick={() => onDeleteMarker(m.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={20} /></button>
                   </div>
                   
                   <div className="pt-2 border-t border-slate-200">
                     <div className="flex justify-between items-center mb-3">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Standard-Team für {m.label}</p>
                       <button onClick={() => setEditingMarkerId(editingMarkerId === m.id ? null : m.id)} className="text-[10px] font-bold text-indigo-500 uppercase flex items-center gap-1">
                          <Users size={12} /> Team verwalten
                       </button>
                     </div>
                     
                     <div className="flex flex-wrap gap-2">
                       {(m.standardLeaderIds || []).map(lId => {
                         const leader = leaders.find(l => l.id === lId);
                         return leader ? (
                           <span key={lId} className="px-3 py-1 bg-white border border-indigo-50 rounded-lg text-xs font-bold text-indigo-600">{leader.name}</span>
                         ) : null;
                       })}
                     </div>

                     {editingMarkerId === m.id && (
                       <div className="mt-4 bg-white p-4 rounded-2xl border border-indigo-100 grid grid-cols-2 md:grid-cols-4 gap-2 animate-in slide-in-from-top-2">
                         {leaders.map(l => {
                           const isActive = (m.standardLeaderIds || []).includes(l.id);
                           return (
                             <button 
                               key={l.id} 
                               onClick={() => toggleStandardLeaderForMarker(m.id, l.id)}
                               className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'}`}
                             >
                               {l.name}
                             </button>
                           );
                         })}
                       </div>
                     )}
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* SLOTVERWALTUNG */}
      <section className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <button onClick={() => toggleSection('slots')} className="flex items-center justify-between w-full px-8 py-6 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-4"><Clock size={20} className="text-orange-500" /> <h3 className="text-lg font-bold text-slate-800 uppercase">Zeitslots Editieren</h3></div>
          {activeSection === 'slots' ? <ChevronDown /> : <ChevronRight />}
        </button>
        {activeSection === 'slots' && (
          <div className="p-8 border-t border-slate-50 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <input value={newSlotName} onChange={e => setNewSlotName(e.target.value)} placeholder="Neuer Slot Name..." className="bg-slate-50 p-4 rounded-2xl text-sm md:col-span-2 border-none" />
               <div className="flex gap-2">
                 <input type="time" value={newSlotStart} onChange={e => setNewSlotStart(e.target.value)} className="flex-1 bg-slate-50 p-4 rounded-2xl text-sm border-none" />
                 <input type="time" value={newSlotEnd} onChange={e => setNewSlotEnd(e.target.value)} className="flex-1 bg-slate-50 p-4 rounded-2xl text-sm border-none" />
               </div>
               <button onClick={() => { setTimeSlots(prev => [...prev, { name: newSlotName, defaultStart: newSlotStart, defaultEnd: newSlotEnd }]); setNewSlotName(''); }} className="bg-orange-600 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-lg">Neu Hinzufügen</button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {timeSlots.map((s, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-4 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 items-center group">
                  <div className="flex-1 w-full md:w-auto">
                    <input 
                      value={s.name} 
                      onChange={e => setTimeSlots(prev => prev.map((item, i) => i === idx ? { ...item, name: e.target.value } : item))}
                      className="bg-transparent border-none font-bold text-slate-800 p-0 focus:ring-0 text-base w-full"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-inner border border-slate-100">
                    <input 
                      type="time" 
                      value={s.defaultStart} 
                      onChange={e => setTimeSlots(prev => prev.map((item, i) => i === idx ? { ...item, defaultStart: e.target.value } : item))}
                      className="bg-transparent border-none text-xs p-0 font-bold w-14"
                    />
                    <span className="text-slate-300">-</span>
                    <input 
                      type="time" 
                      value={s.defaultEnd} 
                      onChange={e => setTimeSlots(prev => prev.map((item, i) => i === idx ? { ...item, defaultEnd: e.target.value } : item))}
                      className="bg-transparent border-none text-xs p-0 font-bold w-14"
                    />
                  </div>
                  <button onClick={() => onDeleteSlot(idx)} className="text-slate-300 hover:text-red-500 p-2 transition-colors opacity-40 group-hover:opacity-100"><Trash2 size={20} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* BACKUP & IMPORT */}
      <section className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <button onClick={() => toggleSection('backup')} className="flex items-center justify-between w-full px-8 py-6 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-4"><Database size={20} className="text-slate-800" /> <h3 className="text-lg font-bold text-slate-800 uppercase">Backups</h3></div>
          {activeSection === 'backup' ? <ChevronDown /> : <ChevronRight />}
        </button>
        {activeSection === 'backup' && (
          <div className="p-8 border-t border-slate-50 space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">Sicherungs-Passwort</label>
              <input type="password" value={uPass} onChange={e => setUPass(e.target.value)} placeholder="Passwort für Verschlüsselung..." className="w-full bg-white border border-slate-100 p-4 rounded-2xl text-sm shadow-inner" />
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button 
                  onClick={() => onSystemExport(uPass)} 
                  disabled={!uPass} 
                  className="bg-slate-800 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-2 disabled:opacity-30"
                >
                  <Download size={18} /> Export (.enc)
                </button>
                <label className="bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-700 transition-all">
                  <FileUp size={18} /> Import
                  <input type="file" className="hidden" onChange={e => onSystemImport(e, uPass)} />
                </label>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* DANGER ZONE */}
      <section className="bg-red-50 border border-red-100 rounded-[2rem] overflow-hidden shadow-sm">
         <div className="p-8 space-y-6">
            <div className="flex items-center gap-3 text-red-600">
               <AlertTriangle size={24} />
               <h3 className="text-lg font-black uppercase tracking-widest">Gefahrenzone</h3>
            </div>
            <button onClick={onResetApp} className="w-full bg-white border-2 border-red-200 text-red-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm">
               Datenbank vollständig leeren
            </button>
         </div>
      </section>
    </div>
  );
};
