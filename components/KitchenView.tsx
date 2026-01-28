
import React, { useState, useMemo } from 'react';
import { ProgramPoint, ProcurementType, User, DAYS } from '../types';
import { Utensils, Scissors, Hammer, Package, Download, CheckCircle2, Circle, Calendar, ShoppingCart, Search, Layers, CalendarRange } from 'lucide-react';

interface KitchenViewProps {
  program: ProgramPoint[];
  onToggleMaterial: (programId: string, materialId: string) => void;
  days: string[];
  currentUser: User;
}

type MaterialTypeFilter = ProcurementType | 'Beides';
type TimeScope = 'day' | 'all';

export const KitchenView: React.FC<KitchenViewProps> = ({ program, onToggleMaterial, days, currentUser }) => {
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [activeType, setActiveType] = useState<MaterialTypeFilter>('Beides');
  const [timeScope, setTimeScope] = useState<TimeScope>('day');

  const materials = useMemo(() => {
    // 1. Filtern nach Zeitraum
    const filteredByTime = timeScope === 'all' 
      ? program 
      : program.filter(p => p.day === selectedDay);

    // 2. Sortieren nach chronologischem Ablauf (Tag-Index + Startzeit)
    const sortedProgram = [...filteredByTime].sort((a, b) => {
      const dayIdxA = DAYS.indexOf(a.day);
      const dayIdxB = DAYS.indexOf(b.day);
      if (dayIdxA !== dayIdxB) return dayIdxA - dayIdxB;
      return a.startTime.localeCompare(b.startTime);
    });

    // 3. Materialien extrahieren und nach Typ filtern
    return sortedProgram.flatMap(p => p.materials.map(m => ({ 
      ...m, 
      programId: p.id, 
      programTitle: p.title, 
      day: p.day,
      slot: p.timeSlot,
      isMyProgram: p.leaders.some(l => l.name === currentUser.displayName)
    })))
    .filter(m => activeType === 'Beides' || m.procurementType === activeType);
  }, [program, selectedDay, activeType, timeScope, currentUser.displayName]);

  const getIcon = (cat: string) => {
    switch (cat) {
      case 'Küche': return <Utensils size={16} className="text-orange-500" />;
      case 'Basteln': return <Scissors size={16} className="text-pink-500" />;
      case 'Technik': return <Hammer size={16} className="text-blue-500" />;
      default: return <Package size={16} className="text-slate-400" />;
    }
  };

  const downloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Tag;Typ;Kategorie;Artikel;Menge;Programm;Status\n";
    days.forEach(day => {
      const daily = program.filter(p => p.day === day).flatMap(p => p.materials.map(m => ({...m, title: p.title})));
      daily.forEach(m => {
        csvContent += `${day};${m.procurementType};${m.category};${m.name};${m.quantity};${m.title};${m.checked ? "Erledigt" : "Offen"}\n`;
      });
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `materialliste_zeltlager.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-800">Material & Orga</h2>
          <p className="text-slate-400 text-xs">
            {timeScope === 'all' ? 'Gesamter Zeitraum' : `Planung für ${selectedDay}`}
          </p>
        </div>
        <button 
          onClick={downloadCSV} 
          className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center gap-2 font-bold text-xs uppercase tracking-widest transition-transform active:scale-95"
        >
          <Download size={16} /> Export
        </button>
      </div>

      {/* Zeitraum-Filter */}
      <div className="bg-slate-100 p-1 rounded-[1.5rem] flex gap-1 shadow-inner">
        <button 
          onClick={() => setTimeScope('day')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeScope === 'day' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-400'}`}
        >
          <Calendar size={16} /> Gewählter Tag
        </button>
        <button 
          onClick={() => setTimeScope('all')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeScope === 'all' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-400'}`}
        >
          <CalendarRange size={16} /> Alle Tage
        </button>
      </div>

      {/* Typ-Filter */}
      <div className="bg-white p-2 rounded-[1.5rem] border border-slate-100 flex gap-1 shadow-sm overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveType('Vorbereiten')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeType === 'Vorbereiten' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Search size={16} /> Rauszusuchen
        </button>
        <button 
          onClick={() => setActiveType('Kaufen')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeType === 'Kaufen' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <ShoppingCart size={16} /> Zu besorgen
        </button>
        <button 
          onClick={() => setActiveType('Beides')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeType === 'Beides' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Layers size={16} /> Beides
        </button>
      </div>

      {timeScope === 'day' && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          {days.map(day => (
            <button 
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap border transition-all ${selectedDay === day ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-white text-slate-400 border-slate-100'}`}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {materials.length > 0 ? (
          ['Küche', 'Basteln', 'Technik', 'Sonstiges'].map(cat => {
            const items = materials.filter(m => m.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="bg-white rounded-[2rem] border border-slate-50 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">
                  {getIcon(cat)} {cat}
                </div>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div 
                      key={`${item.programId}-${item.id}`} 
                      onClick={() => onToggleMaterial(item.programId, item.id)} 
                      className={`flex items-center gap-4 cursor-pointer group p-3 rounded-2xl transition-all border
                        ${item.isMyProgram ? 'bg-orange-50/70 border-orange-200 ring-2 ring-orange-100' : 'bg-white border-slate-100 hover:bg-slate-50'}
                        ${item.checked ? 'opacity-40' : ''}`}
                    >
                       {item.checked ? <CheckCircle2 size={24} className="text-emerald-500" /> : <Circle size={24} className="text-slate-200 group-hover:text-blue-400 transition-colors" />}
                       <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${item.checked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {item.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                            {(timeScope === 'all' || activeType === 'Beides') && (
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter shrink-0">
                                {item.day.split(',')[0]}
                              </span>
                            )}
                            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{item.programTitle}</p>
                            {activeType === 'Beides' && (
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter ${item.procurementType === 'Kaufen' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                                {item.procurementType}
                              </span>
                            )}
                          </div>
                       </div>
                       <div className={`text-xs font-black px-3 py-1.5 rounded-xl shadow-sm whitespace-nowrap ${item.isMyProgram ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
                         {item.quantity}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-24 text-center bg-white/40 rounded-[3rem] border-2 border-dashed border-slate-200">
             <Layers className="mx-auto text-slate-200 mb-2 opacity-40" size={40} />
             <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Keine Einträge gefunden</p>
             <p className="text-[10px] text-slate-300 mt-1 uppercase">Bereich: {timeScope === 'all' ? 'Alle Tage' : selectedDay}</p>
          </div>
        )}
      </div>
    </div>
  );
};
