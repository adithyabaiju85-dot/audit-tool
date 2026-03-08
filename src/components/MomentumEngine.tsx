import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Target, 
  Wind, 
  Clock, 
  ChevronRight, 
  Plus, 
  MoreHorizontal,
  LayoutGrid,
  Settings,
  Bell,
  Search
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
  momentum: number;
}

export const ZenithEngine: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Architect the core momentum loop', completed: false, momentum: 15 },
    { id: '2', text: 'Refine atmospheric shaders', completed: true, momentum: 10 },
    { id: '3', text: 'Deep work: Interface synthesis', completed: false, momentum: 25 },
  ]);
  const [newTask, setNewTask] = useState('');
  const [momentum, setMomentum] = useState(64);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const task: Task = {
      id: Math.random().toString(36).substr(2, 9),
      text: newTask,
      completed: false,
      momentum: Math.floor(Math.random() * 20) + 5,
    };
    setTasks([task, ...tasks]);
    setNewTask('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const newCompleted = !t.completed;
        if (newCompleted) setMomentum(prev => Math.min(100, prev + t.momentum));
        else setMomentum(prev => Math.max(0, prev - t.momentum));
        return { ...t, completed: newCompleted };
      }
      return t;
    }));
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden">
      <div className="atmosphere" />
      
      {/* Navigation Rail */}
      <nav className="fixed left-0 top-0 bottom-0 w-20 flex flex-col items-center py-8 border-r border-white/5 bg-black/20 backdrop-blur-md z-50">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-12">
          <Zap className="w-6 h-6 text-black fill-current" />
        </div>
        <div className="flex flex-col gap-8 flex-1">
          <NavItem icon={<LayoutGrid size={20} />} active />
          <NavItem icon={<Target size={20} />} />
          <NavItem icon={<Wind size={20} />} />
          <NavItem icon={<Bell size={20} />} />
        </div>
        <div className="flex flex-col gap-8">
          <NavItem icon={<Search size={20} />} />
          <NavItem icon={<Settings size={20} />} />
        </div>
      </nav>

      {/* Top Bar */}
      <header className="fixed top-0 left-20 right-0 h-20 flex items-center justify-between px-12 z-40">
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono tracking-[0.2em] text-white/40 uppercase">System Status</span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <span className="text-xs font-mono text-emerald-500/80">Optimal</span>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-2xl font-light tracking-tight">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
              {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
            <span className="text-xs font-medium">AB</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mt-20 ml-20">
        
        {/* Left Column: Momentum Score */}
        <section className="lg:col-span-5 flex flex-col gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[40px] p-12 flex flex-col items-center justify-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
              <motion.div 
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${momentum}%` }}
                transition={{ duration: 1, ease: "circOut" }}
              />
            </div>
            
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] mb-4">Current Momentum</span>
            <div className="relative">
              <motion.h1 
                key={momentum}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[160px] font-serif italic leading-none text-glow momentum-pulse"
              >
                {momentum}
              </motion.h1>
              <span className="absolute -right-8 top-8 text-2xl font-serif italic text-white/20">%</span>
            </div>
            
            <div className="mt-8 flex gap-4">
              <div className="flex flex-col items-center px-6 py-3 rounded-full border border-white/5 bg-white/5">
                <span className="text-[10px] font-mono text-white/30 uppercase">Streak</span>
                <span className="text-xl font-light">12d</span>
              </div>
              <div className="flex flex-col items-center px-6 py-3 rounded-full border border-white/5 bg-white/5">
                <span className="text-[10px] font-mono text-white/30 uppercase">Focus</span>
                <span className="text-xl font-light">4.2h</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-[32px] p-8"
          >
            <h3 className="text-sm font-medium mb-6 flex items-center gap-2">
              <Wind size={16} className="text-white/40" />
              Ambient Flow
            </h3>
            <div className="space-y-4">
              <FlowItem label="Deep Focus" active />
              <FlowItem label="Creative Pulse" />
              <FlowItem label="Restorative Drift" />
            </div>
          </motion.div>
        </section>

        {/* Right Column: Task Stream */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-serif italic tracking-tight">Today's Trajectory</h2>
            <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
              <MoreHorizontal size={20} className="text-white/40" />
            </button>
          </div>

          <form onSubmit={addTask} className="relative group">
            <input 
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Define your next move..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-white/30 transition-all placeholder:text-white/20 text-lg"
            />
            <button 
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center opacity-0 group-focus-within:opacity-100 transition-opacity"
            >
              <Plus size={20} />
            </button>
          </form>

          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    "group relative flex items-center gap-4 p-6 rounded-2xl cursor-pointer transition-all duration-500",
                    task.completed 
                      ? "bg-white/5 opacity-40 grayscale" 
                      : "bg-white/5 hover:bg-white/[0.08] border border-white/5"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-500",
                    task.completed ? "bg-white border-white" : "border-white/20 group-hover:border-white/40"
                  )}>
                    {task.completed && <ChevronRight size={14} className="text-black" />}
                  </div>
                  
                  <span className={cn(
                    "flex-1 text-lg transition-all duration-500",
                    task.completed ? "line-through text-white/40" : "text-white/80"
                  )}>
                    {task.text}
                  </span>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-mono text-white/40">+{task.momentum}</span>
                    <Zap size={14} className="text-white/40" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Footer Stats */}
      <footer className="fixed bottom-8 left-32 right-12 flex items-center justify-between text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">
        <div className="flex gap-12">
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-white/40" />
            <span>Latency: 12ms</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-white/40" />
            <span>Sync: Active</span>
          </div>
        </div>
        <div>Zenith Engine v1.0.4 // Built for deep work</div>
      </footer>
    </div>
  );
};

const NavItem = ({ icon, active = false }: { icon: React.ReactNode, active?: boolean }) => (
  <button className={cn(
    "p-3 rounded-xl transition-all relative group",
    active ? "text-white" : "text-white/30 hover:text-white/60"
  )}>
    {icon}
    {active && (
      <motion.div 
        layoutId="nav-active"
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"
      />
    )}
  </button>
);

const FlowItem = ({ label, active = false }: { label: string, active?: boolean }) => (
  <div className={cn(
    "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
    active ? "bg-white/10 border-white/20" : "border-transparent hover:bg-white/5"
  )}>
    <span className={cn("text-sm", active ? "text-white" : "text-white/40")}>{label}</span>
    {active && (
      <div className="flex gap-1">
        {[1, 2, 3].map(i => (
          <motion.div 
            key={i}
            animate={{ height: [4, 12, 4] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            className="w-0.5 bg-white/60 rounded-full"
          />
        ))}
      </div>
    )}
  </div>
);
