
import React from 'react';
// Removed TimeSlot from imports as it is not exported from '../types'
// Removed DAYS from imports as it is not exported from '../types'
import { TIME_SLOTS, ProgramPoint } from '../types';
import { Plus, Users, Wrench, ChevronRight } from 'lucide-react';

interface ScheduleGridProps {
  program: ProgramPoint[];
  // Added days prop to support dynamic date ranges from parent component
  days: string[];
  onEdit: (point: ProgramPoint) => void;
  // Replaced non-existent TimeSlot type with string
  onAdd: (day: string, slot: string) => void;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({ program, days, onEdit, onAdd }) => {
  // Replaced non-existent TimeSlot type with string
  const getProgramPoint = (day: string, slot: string) => {
    return program.find(p => p.day === day && p.timeSlot === slot);
  };

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-200">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-emerald-700 text-white">
            <th className="p-4 border-r border-emerald-600 sticky left-0 bg-emerald-700 z-10 w-32">Zeitslot</th>
            {/* Use days prop instead of missing DAYS constant */}
            {days.map(day => (
              <th key={day} className="p-4 min-w-[200px] border-r border-emerald-600 last:border-0">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map(slot => (
            <tr key={slot} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
              <td className="p-4 font-semibold text-gray-700 border-r border-gray-100 sticky left-0 bg-white z-10">
                {slot}
              </td>
              {/* Use days prop instead of missing DAYS constant */}
              {days.map(day => {
                const point = getProgramPoint(day, slot);
                return (
                  <td 
                    key={`${day}-${slot}`} 
                    className="p-3 border-r border-gray-100 last:border-0 align-top"
                  >
                    {point ? (
                      <div 
                        onClick={() => onEdit(point)}
                        className="group bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded-r-lg shadow-sm cursor-pointer hover:shadow-md hover:bg-emerald-100 transition-all"
                      >
                        <h4 className="font-bold text-emerald-900 line-clamp-2">{point.title}</h4>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-emerald-700">
                          {point.leaders.length > 0 && (
                            <span className="flex items-center gap-1 bg-emerald-200 px-1.5 py-0.5 rounded">
                              <Users size={12} /> {point.leaders.length} Leiter
                            </span>
                          )}
                          {point.materials.length > 0 && (
                            <span className="flex items-center gap-1 bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                              <Wrench size={12} /> {point.materials.length} Mat.
                            </span>
                          )}
                        </div>
                        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                           <ChevronRight size={16} className="text-emerald-600" />
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => onAdd(day, slot)}
                        className="w-full h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50 transition-all group"
                      >
                        <Plus size={24} className="group-hover:scale-110 transition-transform" />
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
