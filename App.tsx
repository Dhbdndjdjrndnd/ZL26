
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ProgramPoint, GlobalLeader, GlobalGroup, DAYS, DEFAULT_TIME_SLOTS, DEFAULT_MARKERS, TimeSlotConfig, GroupMarker, User, LeaderAvailability } from './types';
import { TimelineView } from './components/TimelineView';
import { ProgramModal } from './components/ProgramModal';
import { KitchenView } from './components/KitchenView';
import { AdminView } from './components/AdminView';
import { LoginView } from './components/LoginView';
import { ProfileModal } from './components/ProfileModal';
import { NotificationToast } from './components/NotificationToast';
import { parseCsvData } from './services/geminiService';
import { encryptData, decryptData, hashPassword } from './services/securityUtils';
import { Tent, Calendar, ShoppingBasket, Settings2 } from 'lucide-react';

const INITIAL_USERS: User[] = [
  { 
    id: '1', 
    username: 'admin', 
    displayName: 'Administrator', 
    password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // SHA-256 von "password"
    role: 'ADMIN' 
  }
];

export interface AppNotification {
  id: string;
  type: 'error' | 'success' | 'info';
  message: string;
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [activeTab, setActiveTab] = useState<'schedule' | 'kitchen' | 'admin'>('schedule');
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [program, setProgram] = useState<ProgramPoint[]>([]);
  const [leaders, setLeaders] = useState<GlobalLeader[]>([]);
  const [groups, setGroups] = useState<GlobalGroup[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotConfig[]>(DEFAULT_TIME_SLOTS);
  const [markers, setMarkers] = useState<GroupMarker[]>(DEFAULT_MARKERS);
  const [leaderPresence, setLeaderPresence] = useState<LeaderAvailability>({});
  
  const [editingPoint, setEditingPoint] = useState<ProgramPoint | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [daysToShow, setDaysToShow] = useState(1);

  const addNotification = useCallback((message: string, type: 'error' | 'success' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  // Sync special markers (HL, Alle, Leiter)
  useEffect(() => {
    const allLeaderIds = leaders.map(l => l.id);
    const adminNames = users.filter(u => u.role === 'ADMIN').map(u => u.displayName);
    const adminLeaderIds = leaders.filter(l => adminNames.includes(l.name)).map(l => l.id);

    setMarkers(prev => prev.map(m => {
      // "Leiter" (id: 1) oder "Alle" (id: 4) marker
      if (m.id === '1' || m.label === 'Leiter' || m.id === '4' || m.label === 'Alle') {
        return { ...m, standardLeaderIds: allLeaderIds };
      }
      // "HL" (id: 6) marker
      if (m.id === '6' || m.label === 'HL') {
        return { ...m, standardLeaderIds: adminLeaderIds };
      }
      return m;
    }));
  }, [leaders, users]);

  // Initial Load & Auth Sync
  useEffect(() => {
    const p = localStorage.getItem('z_prog');
    const u = localStorage.getItem('z_users');
    const l = localStorage.getItem('z_lead');
    const g = localStorage.getItem('z_group');
    const s = localStorage.getItem('z_slots');
    const m = localStorage.getItem('z_markers');
    const pres = localStorage.getItem('z_presence');
    const session = localStorage.getItem('z_session');

    const loadedUsers = u ? JSON.parse(u) : INITIAL_USERS;
    setUsers(loadedUsers);

    if (p) setProgram(JSON.parse(p));
    if (l) setLeaders(JSON.parse(l));
    if (g) setGroups(JSON.parse(g));
    if (s) setTimeSlots(JSON.parse(s));
    if (m) setMarkers(JSON.parse(m));
    if (pres) setLeaderPresence(JSON.parse(pres));
    
    if (session) {
      try {
        const sessionData = JSON.parse(session);
        const user = loadedUsers.find((x: User) => x.id === sessionData.userId);
        if (user && sessionData.expiry > Date.now()) {
          const { password, ...userSafe } = user;
          setCurrentUser(userSafe as User);
        } else {
          localStorage.removeItem('z_session');
        }
      } catch (e) {
        localStorage.removeItem('z_session');
      }
    }

    const handleResize = () => {
      if (window.innerWidth >= 1280) setDaysToShow(3);
      else if (window.innerWidth >= 768) setDaysToShow(2);
      else setDaysToShow(1);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem('z_prog', JSON.stringify(program));
    localStorage.setItem('z_users', JSON.stringify(users));
    localStorage.setItem('z_lead', JSON.stringify(leaders));
    localStorage.setItem('z_group', JSON.stringify(groups));
    localStorage.setItem('z_slots', JSON.stringify(timeSlots));
    localStorage.setItem('z_markers', JSON.stringify(markers));
    localStorage.setItem('z_presence', JSON.stringify(leaderPresence));
  }, [program, users, leaders, groups, timeSlots, markers, leaderPresence]);

  const handleLogin = useCallback((user: User) => {
    const { password, ...userSafe } = user;
    setCurrentUser(userSafe as User);
    localStorage.setItem('z_session', JSON.stringify({
      userId: user.id,
      expiry: Date.now() + 7 * 24 * 60 * 60 * 1000
    }));
    addNotification(`Willkommen zurück, ${user.displayName}!`, "success");
  }, [addNotification]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setIsProfileOpen(false);
    setActiveTab('schedule');
    localStorage.removeItem('z_session');
    addNotification("Erfolgreich abgemeldet", "info");
  }, [addNotification]);

  const resetAppData = useCallback(() => {
    if (window.confirm("BIST DU SICHER? Alle Programmpunkte, Leiter und Einstellungen werden unwiderruflich gelöscht.")) {
      setProgram([]);
      setLeaders([]);
      setGroups([]);
      setTimeSlots(DEFAULT_TIME_SLOTS);
      setMarkers(DEFAULT_MARKERS);
      setLeaderPresence({});
      addNotification("Datenbank vollständig zurückgesetzt.", "error");
    }
  }, [addNotification]);

  const sortedTimeSlots = useMemo(() => {
    return [...timeSlots].sort((a, b) => a.defaultStart.localeCompare(b.defaultStart));
  }, [timeSlots]);

  const handleCsvUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    addNotification("KI analysiert die Datei...", "info");
    try {
      const text = await file.text();
      const parsedPoints = await parseCsvData(text, DAYS, timeSlots.map(s => s.name));
      
      const newProgramPoints: ProgramPoint[] = parsedPoints.map((p: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        day: p.day || DAYS[0],
        timeSlot: p.timeSlot || (sortedTimeSlots.length > 0 ? sortedTimeSlots[0].name : 'Morgenprogramm'),
        startTime: p.startTime || '09:00',
        endTime: p.endTime || '12:00',
        title: p.title || 'Neuer Programmpunkt',
        description: '',
        leaders: [],
        groups: [],
        materials: [],
        groupHint: p.groupHint
      }));

      setProgram(prev => [...prev, ...newProgramPoints]);
      addNotification(`${newProgramPoints.length} Programmpunkte erfolgreich importiert.`, "success");
    } catch (error: any) {
      addNotification(error.message || "Fehler beim CSV-Import.", "error");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  }, [timeSlots, sortedTimeSlots, addNotification]);

  const visibleDays = useMemo(() => {
    if (activeTab !== 'schedule') return [selectedDay];
    const startIdx = DAYS.indexOf(selectedDay);
    return DAYS.slice(startIdx, Math.min(startIdx + daysToShow, DAYS.length));
  }, [selectedDay, daysToShow, activeTab]);

  const deleteUser = useCallback((userId: string) => {
    if (userId === '1') return addNotification("Der Haupt-Admin kann nicht gelöscht werden.", "error");
    setUsers(prev => prev.filter(u => u.id !== userId));
    addNotification("Account entfernt.", "info");
  }, [addNotification]);

  const deleteLeader = useCallback((leaderId: string) => {
    setLeaders(prev => prev.filter(l => l.id !== leaderId));
    setProgram(prev => prev.map(p => ({ ...p, leaders: p.leaders.filter(l => l.id !== leaderId) })));
    setMarkers(prev => prev.map(m => ({ ...m, standardLeaderIds: (m.standardLeaderIds || []).filter(id => id !== leaderId) })));
    setLeaderPresence(prev => {
      const upd = { ...prev };
      Object.keys(upd).forEach(d => upd[d] = (upd[d] || []).filter(id => id !== leaderId));
      return upd;
    });
    addNotification("Leiter entfernt.", "info");
  }, [addNotification]);

  if (!currentUser) return <LoginView onLogin={handleLogin} users={users} />;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 px-6 flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center shadow-lg">
            <Tent size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-400 leading-none tracking-[0.2em] uppercase">Zeltlager</p>
            <h1 className="text-sm font-serif font-bold text-slate-800 leading-tight">Planungs-Tool</h1>
          </div>
        </div>
        <button onClick={() => setIsProfileOpen(true)} className="flex items-center gap-2 bg-slate-50 py-1 pl-2.5 pr-1 rounded-full hover:bg-slate-100 transition-all border border-slate-100">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">{currentUser.displayName.split(' ')[0]}</span>
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-white shadow-sm flex items-center justify-center font-black text-white text-[9px]">
            {currentUser.displayName.substring(0,2).toUpperCase()}
          </div>
        </button>
      </header>

      {activeTab !== 'admin' && activeTab !== 'kitchen' && (
        <div className="bg-white/90 backdrop-blur-sm border-b border-slate-50 sticky top-16 z-40">
          <div className="flex gap-1 overflow-x-auto no-scrollbar py-2 px-6">
            {DAYS.map((day) => {
              const isActive = selectedDay === day;
              const isToday = day.includes(new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }));
              const [weekday, date] = day.split(', ');
              return (
                <button 
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`min-w-[56px] flex flex-col items-center py-2 transition-all relative rounded-2xl 
                    ${isActive ? 'bg-slate-800 text-white shadow-xl scale-105 z-10' : isToday ? 'text-blue-600 bg-blue-50' : 'text-slate-300'}`}
                >
                  <span className="text-[7px] font-black uppercase tracking-widest mb-0.5">{weekday}</span>
                  <span className="text-base font-serif font-bold leading-none">{date.split('.')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <main className={`flex-1 w-full mx-auto pb-32 px-6 mt-6 transition-all duration-500 ${activeTab === 'schedule' && daysToShow > 1 ? (daysToShow === 2 ? 'max-w-5xl' : 'max-w-7xl') : 'max-w-2xl'}`}>
          {activeTab === 'schedule' && (
            <TimelineView 
              program={program} days={visibleDays} onEdit={setEditingPoint} currentUser={currentUser} markers={markers}
              onAdd={(day) => setEditingPoint({
                id: Math.random().toString(36).substr(2, 9), day, timeSlot: sortedTimeSlots[0].name, 
                startTime: sortedTimeSlots[0].defaultStart, endTime: sortedTimeSlots[0].defaultEnd,
                title: '', description: '', leaders: [], groups: [], materials: []
              })}
            />
          )}
          {activeTab === 'kitchen' && (
            <KitchenView 
              program={program} days={DAYS} currentUser={currentUser}
              onToggleMaterial={(pId, mId) => setProgram(prev => prev.map(p => p.id === pId ? { ...p, materials: p.materials.map(m => m.id === mId ? { ...m, checked: !m.checked } : m) } : p))} 
            />
          )}
          {activeTab === 'admin' && currentUser.role === 'ADMIN' && (
            <AdminView 
              leaders={leaders} groups={groups} setLeaders={setLeaders} setGroups={setGroups} 
              timeSlots={sortedTimeSlots} setTimeSlots={setTimeSlots} users={users} setUsers={setUsers} 
              markers={markers} setMarkers={setMarkers} onCsvUpload={handleCsvUpload} isUploading={isUploading}
              leaderPresence={leaderPresence} setLeaderPresence={setLeaderPresence}
              addNotification={addNotification}
              onSystemExport={async (pass) => {
                const backup = { program, users, leaders, groups, timeSlots, markers, leaderPresence, exportedAt: new Date().toISOString() };
                const encrypted = await encryptData(backup, pass);
                const blob = new Blob([encrypted], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `zeltlager_backup_${new Date().toISOString().split('T')[0]}.enc`;
                link.click();
              }}
              onSystemImport={async (e, pass) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const content = await file.text();
                  const data = await decryptData(content, pass);
                  setProgram(data.program); setUsers(data.users); setLeaders(data.leaders); setGroups(data.groups);
                  setTimeSlots(data.timeSlots); setMarkers(data.markers); setLeaderPresence(data.leaderPresence);
                  addNotification("Backup erfolgreich eingespielt!", "success");
                } catch (err) { addNotification("Fehler beim Import. Passwort falsch?", "error"); }
              }}
              onDeleteUser={deleteUser} onDeleteLeader={deleteLeader}
              onDeleteMarker={id => setMarkers(prev => prev.filter(m => m.id !== id))}
              onDeleteSlot={idx => setTimeSlots(prev => prev.filter((_, i) => i !== idx))}
              onDeleteGroup={id => setGroups(prev => prev.filter(g => g.id !== id))}
              onUpdateUserPassword={(id, hash) => setUsers(prev => prev.map(u => u.id === id ? { ...u, password: hash } : u))}
              onResetApp={resetAppData}
            />
          )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-10 py-4 flex justify-around items-center z-50 shadow-2xl">
        <button onClick={() => setActiveTab('schedule')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'schedule' ? 'text-slate-900' : 'text-slate-300'} transition-all`}>
          <div className={`p-2 rounded-xl ${activeTab === 'schedule' ? 'bg-slate-100' : ''}`}><Calendar size={22} /></div>
          <span className="text-[9px] font-black uppercase tracking-widest">Plan</span>
        </button>
        <button onClick={() => setActiveTab('kitchen')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'kitchen' ? 'text-slate-900' : 'text-slate-300'} transition-all`}>
          <div className={`p-2 rounded-xl ${activeTab === 'kitchen' ? 'bg-slate-100' : ''}`}><ShoppingBasket size={22} /></div>
          <span className="text-[9px] font-black uppercase tracking-widest">Küche</span>
        </button>
        {currentUser.role === 'ADMIN' && (
          <button onClick={() => setActiveTab('admin')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'admin' ? 'text-slate-900' : 'text-slate-300'} transition-all`}>
            <div className={`p-2 rounded-xl ${activeTab === 'admin' ? 'bg-slate-100' : ''}`}><Settings2 size={22} /></div>
            <span className="text-[9px] font-black uppercase tracking-widest">Admin</span>
          </button>
        )}
      </nav>

      <div className="fixed top-20 right-6 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-xs">
        {notifications.map(n => <NotificationToast key={n.id} notification={n} />)}
      </div>

      {isProfileOpen && (
        <ProfileModal 
          user={currentUser} onClose={() => setIsProfileOpen(false)} onLogout={handleLogout}
          onUpdatePassword={p => { setUsers(prev => prev.map(u => u.id === currentUser.id ? {...u, password: p} : u)); addNotification("Passwort geändert", "success"); }}
          leaderPresence={leaderPresence} setLeaderPresence={setLeaderPresence} leaders={leaders}
          addNotification={addNotification}
        />
      )}

      {editingPoint && (
        <ProgramModal 
          point={editingPoint} onClose={() => setEditingPoint(null)} 
          onSave={(u) => { setProgram(prev => { const idx = prev.findIndex(p => p.id === u.id); if (idx !== -1) { const c = [...prev]; c[idx] = u; return c; } return [...prev, u]; }); setEditingPoint(null); addNotification("Gespeichert", "success"); }}
          onDelete={(id) => { if (window.confirm("Löschen?")) { setProgram(p => p.filter(x => x.id !== id)); setEditingPoint(null); addNotification("Gelöscht", "info"); } }}
          availableLeaders={leaders} availableGroups={groups} availableSlots={sortedTimeSlots} markers={markers} leaderPresence={leaderPresence}
          addNotification={addNotification}
        />
      )}
    </div>
  );
};

export default App;
