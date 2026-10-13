import { useState } from 'react';
import { 
  History, 
  Download, 
  Clock, 
  AlertOctagon, 
  Truck, 
  Building2, 
  Activity
} from 'lucide-react';
import { useAeros } from '../context/AerosContext';
import type { EventCategory } from '../types';

export const TimelineLog: React.FC = () => {
  const { timelineEvents } = useAeros();
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('All');

  const filteredEvents = timelineEvents.filter(evt => {
    if (selectedCategory === 'All') return true;
    return evt.category === selectedCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Accident':
        return <AlertOctagon className="w-3.5 h-3.5 text-[#FF4057]" />;
      case 'Ambulance':
        return <Truck className="w-3.5 h-3.5 text-[#00D9FF]" />;
      case 'Hospital':
        return <Building2 className="w-3.5 h-3.5 text-[#00E5B0]" />;
      case 'Traffic':
        return <Activity className="w-3.5 h-3.5 text-[#FFB547]" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'border-[#FF4057]/40 bg-red-950/40 text-[#FF4057]';
      case 'warning':
        return 'border-amber-500/40 bg-amber-950/40 text-[#FFB547]';
      case 'success':
        return 'border-[#00E5B0]/40 bg-emerald-950/40 text-[#00E5B0]';
      default:
        return 'border-slate-800 bg-[#0B1220] text-slate-300';
    }
  };

  const handleExportLog = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(timelineEvents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aeros_timeline_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="spatial-glass rounded-2xl p-4 flex flex-col gap-3 border border-[#00D9FF]/20 shadow-xl">
      
      {/* Header & Category Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#00D9FF]" />
          <h2 className="text-sm font-bold tracking-wider font-hud text-white uppercase">
            Incident Event Log & Operations Audit
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            {filteredEvents.length} Recorded
          </span>
        </div>

        {/* Filter Badges & Export */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          {(['All', 'Accident', 'Ambulance', 'Hospital', 'Traffic'] as EventCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#00D9FF]/15 border-[#00D9FF] text-[#00D9FF] font-bold'
                  : 'bg-[#0B1220] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}

          <button
            onClick={handleExportLog}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 ml-1 cursor-pointer"
            title="Download JSON Log"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Events Timeline Scroll Container */}
      <div className="max-h-56 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
        {filteredEvents.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No incident events currently registered in this category.
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className={`p-2.5 rounded-xl border flex items-start gap-3 transition-colors ${getSeverityBadge(evt.severity)}`}
            >
              <div className="mt-0.5 shrink-0">
                {getCategoryIcon(evt.category)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-white tracking-wide">{evt.title}</span>
                  <span className="text-slate-400 text-[10px] shrink-0 ml-2">{evt.timestamp}</span>
                </div>
                <p className="text-slate-300 text-[11px] mt-0.5 leading-snug">{evt.description}</p>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
