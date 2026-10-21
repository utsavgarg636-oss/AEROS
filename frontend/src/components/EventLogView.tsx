import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  AlertOctagon, 
  Activity, 
  Truck, 
  Building2, 
  Clock 
} from 'lucide-react';
import { useAeros } from '../context/AerosContext';

export const EventLogView: React.FC = () => {
  const { timelineEvents } = useAeros();
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEvents = timelineEvents.filter((evt) => {
    const matchesCat = filterCategory === 'ALL' || evt.category.toUpperCase() === filterCategory.toUpperCase();
    const matchesSearch = evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          evt.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'accident': return <AlertOctagon className="w-4 h-4 text-red-500" />;
      case 'traffic': return <Activity className="w-4 h-4 text-[#00A86B]" />;
      case 'ambulance': return <Truck className="w-4 h-4 text-blue-500" />;
      case 'hospital': return <Building2 className="w-4 h-4 text-emerald-600" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E3EEE8] shadow-xs select-none flex flex-col w-full">
      
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E6F4EA] flex items-center justify-center text-[#0F9D58]">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              System Event Log
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              Chronological Audit Trail • {timelineEvents.length} Events Logged
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 outline-none focus:border-[#00966A] w-48"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="ACCIDENT">Accident</option>
            <option value="TRAFFIC">Traffic</option>
            <option value="AMBULANCE">Ambulance</option>
            <option value="HOSPITAL">Hospital</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-mono">
            No events match your criteria.
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div 
              key={evt.id} 
              className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-[#A7F3D0] transition-all flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                {getCategoryIcon(evt.category)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">{evt.title}</span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                      evt.severity === 'critical' ? 'bg-red-100 text-red-700 border border-red-200' :
                      evt.severity === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      evt.severity === 'warning' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {evt.category.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{evt.timestamp}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{evt.description}</p>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
