
import React, { useEffect, useState, useRef } from 'react';
import { ProgramPoint, GroupMarker, User } from '../types';
import { Clock, MapPin, Users, Coffee, Utensils, UsersRound, Gamepad2, Moon, Plus, Layers, Briefcase, CalendarDays, ShieldAlert } from 'lucide-react';

interface TimelineViewProps {
  program: ProgramPoint[];
  days: string[];
  onEdit: (point: ProgramPoint) => void;
  onAdd: (day: string) => void;
  markers: GroupMarker[];
  currentUser: User;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ program, days, onEdit, onAdd, markers, currentUser }) => {
  const [now, setNow] = useState(new Date());
  const nowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getIcon = (slot: string) => {
    const s = slot.toLowerCase();
    if (s.includes('frühstück') || s.includes('essen')) return <Utensils size={20} />;
    if (s.includes('morgen') || s.includes('nachmittag')) return <UsersRound size={20} />;
    if (s.includes('abendprogramm') || s.includes('spiel')) return <Gamepad2 size={20} />;
    if (s.includes('ruhe') || s.includes('nacht')) return <Moon size={20} />;
    return <CalendarDays size={20} />;
  };

  const isToday = (dayStr: string) => {
    const todayStr = new Date().toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }) + ".";
    return dayStr.includes(todayStr.split(' ')[1]);
  };

  /**
   * Berechnet die optimale Textfarbe (Weiß oder Dunkel) basierend auf der Hintergrundhelligkeit (YIQ).
   */
  const getContrastColor = (hex: string) => {
    if (!hex) return 'text-slate-600';
    const color = hex.replace('#', '');
    const r = parseInt(color.slice(0, 2), 16);
    const g = parseInt(color.slice(2, 4), 16);
    const b = parseInt(color.slice(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 140) ? 'text-slate-900' : 'text-white';
  };

  const renderPoint = (point: ProgramPoint, isParallel: boolean) => {
    const marker = markers.find(m => m.id === point.markerId);
    const isAssigned = point.leaders.some(l => l.name === currentUser.displayName);

    return (
      <div 
        key={point.id}
        onClick={() => onEdit(point)}
        className={`bg-white rounded-3xl p-5 shadow-sm border-l-[6px] transition-all cursor-pointer hover:shadow-md flex-1
          ${isAssigned ? 'border-l-orange-500 ring-1 ring-orange-100 scale-[1.02]' : 'border-l-slate-200'}
          ${isParallel ? 'min-w-[160px]' : 'w-full'}
        `}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="space-y-1 pr-2">
            <h3 className={`font-bold text-slate-800 leading-snug ${isParallel ? 'text-sm' : 'text-lg'}`}>{point.title || "Unbenannt"}</h3>
            <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">
               <span>{point.timeSlot}</span>
               {point.groupHint && <span className="text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md font-black">{point.groupHint}</span>}
            </div>
          </div>
          {isAssigned && (
             <div className="bg-orange-500 text-white text-[7px] font-black px-2 py-1 rounded-lg shrink-0 shadow-sm uppercase tracking-tighter">
               Zugeordnet
             </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-700">
            <Clock size={12} className="text-orange-500" />
            <span>{point.startTime} – {point.endTime}</span>
          </div>
          
          {marker && (
            <div 
              className={`inline-flex items-center justify-center px-4 py-2 rounded-2xl w-fit shadow-sm font-black uppercase tracking-widest text-[9px] transition-all border border-black/5`}
              style={{ backgroundColor: marker.color }}
            >
               <span className={getContrastColor(marker.color)}>{marker.label}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-${days.length} gap-10 pb-20`}>
      {days.map((day) => {
        const isVorzelten = day.includes("31.07.") || day.includes("01.08.");
        const dailyProgram = program
          .filter(p => p.day === day)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        const groupedPoints: ProgramPoint[][] = [];
        dailyProgram.forEach(point => {
          const lastGroup = groupedPoints[groupedPoints.length - 1];
          if (lastGroup && lastGroup[0].startTime === point.startTime) {
            lastGroup.push(point);
          } else {
            groupedPoints.push([point]);
          }
        });

        const currentTimeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        const todayStatus = isToday(day);

        return (
          <div key={day} className="flex-1 space-y-8">
            <div className="flex items-center justify-between px-3">
               <div className="flex flex-col">
                 <h2 className={`text-xs font-black uppercase tracking-[0.25em] ${todayStatus ? 'text-slate-900' : 'text-slate-400'}`}>
                   {day}
                 </h2>
                 {todayStatus && <span className="text-[8px] font-bold text-red-500 mt-0.5 animate-pulse tracking-widest">● HEUTE</span>}
               </div>
               <button 
                  onClick={() => onAdd(day)}
                  className="p-2.5 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-800 hover:text-white transition-all shadow-sm active:scale-90"
               >
                  <Plus size={18} />
               </button>
            </div>

            <div className="relative pl-14 space-y-10 timeline-line py-6 min-h-[500px]">
              {isVorzelten && (
                <div className="mb-8 -ml-14 animate-in fade-in slide-in-from-left-4 duration-500">
                   <div className="bg-amber-500/10 border border-amber-200/50 rounded-[2rem] p-4 flex items-center gap-3">
                      <div className="p-1.5 bg-amber-500 rounded-lg text-white shadow-md"><ShieldAlert size={14} /></div>
                      <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest">Aufbau-Phase</p>
                   </div>
                </div>
              )}

              {groupedPoints.length > 0 ? (
                groupedPoints.map((group, gIdx) => {
                  const startTime = group[0].startTime;
                  const isParallelGroup = group.length > 1;
                  
                  const showNowLine = todayStatus && 
                    ((gIdx === 0 && startTime > currentTimeStr) || 
                     (gIdx > 0 && groupedPoints[gIdx-1][0].startTime <= currentTimeStr && startTime > currentTimeStr));

                  return (
                    <React.Fragment key={startTime}>
                      {showNowLine && (
                        <div className="relative h-8 now-indicator-line -ml-14 flex items-center z-20">
                           <div className="absolute left-[19px] w-5 h-5 bg-red-500 rounded-full border-[3px] border-white z-30 shadow-xl animate-pulse" />
                           <div className="ml-16 bg-red-500 text-white text-[9px] font-black px-3 py-1 rounded-lg z-30 shadow-lg tracking-widest uppercase">
                              JETZT
                           </div>
                        </div>
                      )}

                      <div className="relative group/item">
                        <div className={`absolute -left-14 top-2 w-11 h-11 rounded-2xl border flex items-center justify-center z-10 transition-all shadow-md group-hover/item:scale-110
                          ${isVorzelten ? 'bg-amber-50 border-amber-100 text-amber-500' : 'bg-white border-slate-200 text-slate-400'}
                        `}>
                          {getIcon(group[0].timeSlot)}
                        </div>

                        <div className={`flex gap-4 overflow-x-auto no-scrollbar pb-3 ${isParallelGroup ? 'flex-row' : 'flex-col'}`}>
                           {group.map(point => renderPoint(point, isParallelGroup))}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              ) : (
                <div className="py-24 text-center bg-white/40 rounded-[3rem] border-2 border-dashed border-slate-100 mx-2">
                  <Layers className="mx-auto text-slate-200 mb-3 opacity-50" size={40} />
                  <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.3em] italic">Kein Programm</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
