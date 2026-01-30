
import React, { useState, useMemo } from 'react';
import { ProgramPoint, GlobalLeader, GlobalGroup, GroupMarker, TimeSlotConfig, LeaderAvailability, ProcurementType } from '../types';
import { X, Clock, MapPin, Package, Users, Star, ArrowLeft, CheckCircle2, Trash2, Tag, ShoppingCart, Hammer, Calendar } from 'lucide-react';
import { suggestMaterials } from '../services/geminiService';

interface ProgramModalProps {
  point: ProgramPoint;
  onClose: () => void;
  onSave: (point: ProgramPoint) => void;
  onDelete?: (id: string) => void;
  availableLeaders: GlobalLeader[];
  availableGroups: GlobalGroup[];
  availableSlots: TimeSlotConfig[];
  markers: GroupMarker[];
  leaderPresence: LeaderAvailability;
  addNotification: (msg: string, type?: 'error' | 'success' | 'info') => void;
  days: string[];
}

export const ProgramModal: React.FC<ProgramModalProps> = ({ 
  point, 
  onClose, 
  onSave, 
  onDelete, 
  availableLeaders, 
  availableGroups,
  availableSlots,
  markers,
  leaderPresence,
  addNotification,
  days
}) => {
  const [edited, setEdited] = useState<ProgramPoint>({ ...point });
  const [isSuggesting, setIsSuggesting] = useState(false);

  const presentLeaders = useMemo(() => {
    const presentIds = leaderPresence[edited.day] || [];
    return availableLeaders.filter(l => presentIds.includes(l.id));
  }, [availableLeaders, leaderPresence, edited.day]);

  const handleSave = () => {
    if (!edited.title.trim()) {
      addNotification("Bitte gib dem Programmpunkt einen Namen.", "error");
      return;
    }
    onSave(edited);
  };

  const handleMarkerChange = (markerId: string) => {
    const selectedMarker = markers.find(m => m.id === markerId);
    let newLeaders = [...edited.leaders];

    if (selectedMarker && selectedMarker.standardLeaderIds) {
      selectedMarker.standardLeaderIds.forEach(leaderId => {
        const leaderObj = availableLeaders.find(l => l.id === leaderId);
        const isPresent = (leaderPresence[edited.day] || []).includes(leaderId);
        const isAlreadyAdded = newLeaders.some(l => l.id === leaderId);
        
        if (leaderObj && isPresent && !isAlreadyAdded) {
          newLeaders.push(leaderObj);
        }
      });
    }

    setEdited({ 
      ...edited, 
      markerId: markerId,
      leaders: newLeaders 
    });
  };

  const handleSlotChange = (slotName: string) => {
    const config = availableSlots.find(s => s.name === slotName);
    if (config) {
      setEdited({ 
        ...edited, 
        timeSlot: slotName, 
        startTime: config.defaultStart, 
        endTime: config.defaultEnd 
      });
    } else {
      setEdited({ ...edited, timeSlot: slotName });
    }
  };

  const toggleLeader = (leader: GlobalLeader) => {
    const exists = edited.leaders.some(l => l.id === leader.id);
    if (exists) {
      setEdited({ ...edited, leaders: edited.leaders.filter(l => l.id !== leader.id) });
    } else {
      setEdited({ ...edited, leaders: [...edited.leaders, leader] });
    }
  };

  const toggleGroup = (group: GlobalGroup) => {
    const exists = edited.groups.some(g => g.id === group.id);
    if (exists) {
      setEdited({ ...edited, groups: edited.groups.filter(g => g.id !== group.id) });
    } else {
      setEdited({ ...edited, groups: [...edited.groups, group] });
    }
  };

  const updateMaterialType = (id: string, type: ProcurementType) => {
    setEdited({
      ...edited,
      materials: edited.materials.map(m => m.id === id ? { ...m, procurementType: type } : m)
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#FDFDFC] w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-slate-50 mb-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">{edited.day}</p>
            <p className="text-[10px] text-slate-400 uppercase font-black">Details Bearbeiten</p>
          </div>
          {onDelete ? (
            <button onClick={() => onDelete(edited.id)} className="p-2 hover:bg-red-50 rounded-full text-red-400 transition-colors">
              <Trash2 size={24} />
            </button>
          ) : <div className="w-10"></div>}
        </div>

        <div className="px-8 pb-10 space-y-8 max-h-[75vh] overflow-y-auto no-scrollbar">
          <div className="space-y-4">
             <input value={edited.title} onChange={e => setEdited({ ...edited, title: e.target.value })} placeholder="TITEL..." className="w-full text-4xl font-serif font-bold text-slate-800 bg-transparent border-none focus:ring-0 outline-none p-0 uppercase placeholder:text-slate-200" />
             
             {/* Tag verschieben Selector */}
             <div className="flex flex-wrap gap-2 items-center">
                <div className="relative group">
                  <select 
                    value={edited.day} 
                    onChange={e => setEdited({ ...edited, day: e.target.value })} 
                    className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border-none cursor-pointer appearance-none shadow-sm pr-10 focus:ring-2 focus:ring-slate-200 transition-all"
                  >
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                
                <select value={edited.timeSlot} onChange={e => handleSlotChange(e.target.value)} className="bg-slate-800 text-white text-[10px] font-bold px-4 py-2 rounded-xl border-none cursor-pointer appearance-none shadow-sm">
                  <option value="">Individueller Slot</option>
                  {availableSlots.map(s => <option key={s.name} value={s.name}>{s.name} ({s.defaultStart})</option>)}
                </select>

                <div className="relative">
                  <select value={edited.markerId || ""} onChange={e => handleMarkerChange(e.target.value)} className="bg-white border border-slate-200 text-[10px] font-bold px-4 py-2 rounded-xl text-slate-600 outline-none cursor-pointer appearance-none pr-8 shadow-sm">
                    <option value="">Kein Gruppen-Marker</option>
                    {markers.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                  <Tag size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-3">
               <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 tracking-widest uppercase"><Clock size={14} /> Zeit</div>
               <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  <input type="time" value={edited.startTime} onChange={e => setEdited({ ...edited, startTime: e.target.value })} className="text-lg font-bold text-slate-800 bg-white p-2 rounded-xl border-none w-full focus:ring-2 focus:ring-blue-100 shadow-inner appearance-none" />
                  <span className="text-slate-300 font-bold shrink-0">to</span>
                  <input type="time" value={edited.endTime} onChange={e => setEdited({ ...edited, endTime: e.target.value })} className="text-lg font-bold text-slate-400 bg-white p-2 rounded-xl border-none w-full focus:ring-2 focus:ring-blue-100 shadow-inner appearance-none" />
               </div>
            </div>
            <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-3">
               <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 tracking-widest uppercase"><MapPin size={14} /> Ort</div>
               <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 h-full">
                <input value={edited.location} onChange={e => setEdited({ ...edited, location: e.target.value })} placeholder="Ort eingeben..." className="text-lg font-bold text-slate-800 bg-transparent border-none p-2 w-full focus:ring-0 uppercase placeholder:text-slate-200" />
               </div>
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex justify-between items-end">
                <h3 className="text-lg font-serif font-bold text-slate-800 uppercase tracking-widest">Leiter (Anwesend)</h3>
             </div>
             {presentLeaders.length > 0 ? (
               <div className="flex flex-wrap gap-2">
                  {presentLeaders.map((leader) => {
                    const isSelected = edited.leaders.some(l => l.id === leader.id);
                    return (
                      <button key={leader.id} onClick={() => toggleLeader(leader)} className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${isSelected ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'}`}>
                        {leader.name}
                      </button>
                    );
                  })}
               </div>
             ) : (
               <p className="text-xs text-red-400 font-bold bg-red-50 p-4 rounded-2xl border border-red-100">Keine Leiter anwesend am {edited.day}.</p>
             )}

             <h3 className="text-lg font-serif font-bold text-slate-800 uppercase tracking-widest pt-4">Gruppen</h3>
             <div className="flex flex-wrap gap-2">
                {availableGroups.map((group) => {
                  const isSelected = edited.groups.some(g => g.id === group.id);
                  return (
                    <button key={group.id} onClick={() => toggleGroup(group)} className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'}`}>
                      {group.name}
                    </button>
                  );
                })}
             </div>
          </div>

          <div className="bg-[#F3F4F1] p-6 rounded-[1.5rem] space-y-4">
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <Package size={18} />
                   <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Material</p>
                </div>
                <button onClick={async () => { 
                  setIsSuggesting(true); 
                  const suggestions = await suggestMaterials(edited.title, edited.description);
                  setEdited({ ...edited, materials: [...edited.materials, ...suggestions.map((s:any)=>({...s, id: Math.random().toString(), procurementType: 'Vorbereiten'}))]}); 
                  setIsSuggesting(false); 
                  addNotification("KI-Materialvorschläge hinzugefügt", "success"); 
                }} className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                  <Star size={12} className={isSuggesting ? 'animate-spin' : ''} /> {isSuggesting ? 'Lädt...' : 'KI Hilfe'}
                </button>
             </div>
             <div className="space-y-3">
                {edited.materials.map(m => (
                  <div key={m.id} className="flex flex-col gap-2 bg-white/50 p-3 rounded-2xl border border-white">
                    <div className="flex items-center gap-2">
                      <input value={m.name} onChange={e => setEdited({...edited, materials: edited.materials.map(x => x.id === m.id ? {...x, name: e.target.value} : x)})} className="flex-1 bg-transparent border-none text-sm p-0 font-bold focus:ring-0" placeholder="Material Name..." />
                      <input value={m.quantity} onChange={e => setEdited({...edited, materials: edited.materials.map(x => x.id === m.id ? {...x, quantity: e.target.value} : x)})} className="w-16 bg-transparent border-none text-sm p-0 focus:ring-0 text-blue-600 font-bold text-right" placeholder="Menge" />
                      <button onClick={() => setEdited({...edited, materials: edited.materials.filter(x => x.id !== m.id)})} className="text-slate-300 hover:text-red-500 ml-2"><X size={14} /></button>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updateMaterialType(m.id, 'Vorbereiten')} 
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${m.procurementType === 'Vorbereiten' ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-400 border border-slate-100'}`}
                      >
                        <Hammer size={10} /> Vorbereiten
                      </button>
                      <button 
                        onClick={() => updateMaterialType(m.id, 'Kaufen')} 
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${m.procurementType === 'Kaufen' ? 'bg-orange-500 text-white shadow-sm' : 'bg-white text-slate-400 border border-slate-100'}`}
                      >
                        <ShoppingCart size={10} /> Besorgen
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setEdited({...edited, materials: [...edited.materials, { id: Math.random().toString(), name: '', quantity: '1x', category: 'Sonstiges', procurementType: 'Vorbereiten' }]})} className="w-full py-2 border border-dashed border-slate-300 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest">Material hinzufügen</button>
             </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase ml-1">Beschreibung / Ablauf</h3>
            <textarea value={edited.description} onChange={e => setEdited({...edited, description: e.target.value})} placeholder="Beschreibung, Regeln & Ablauf..." className="w-full min-h-[120px] bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 focus:ring-2 focus:ring-slate-100 border-none resize-none shadow-inner" />
          </div>
        </div>

        <div className="p-8 pt-4 bg-white/80 backdrop-blur-md sticky bottom-0 border-t border-slate-50">
           <button onClick={handleSave} className="w-full bg-[#1E293B] text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:bg-slate-700 transition-all active:scale-[0.99]"><CheckCircle2 size={24} /> Speichern</button>
        </div>
      </div>
    </div>
  );
};
