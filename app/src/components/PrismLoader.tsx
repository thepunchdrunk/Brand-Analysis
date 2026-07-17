
import { motion } from 'framer-motion';

export const PrismLoader = () => {
    return (
        <div className="relative w-full h-[120px] flex items-center justify-center gap-8 perspective-1000 overflow-hidden rounded-2xl bg-white/50 backdrop-blur-md border border-slate-200">

            {/* 1. Visual Beam (Blue) */}
            <div className="flex flex-col items-center gap-2">
                <motion.div
                    className="w-2 h-[60px] bg-blue-500 rounded-full blur-md"
                    animate={{
                        height: [20, 80, 20],
                        opacity: [0.3, 1, 0.3],
                        boxShadow: ["0 0 10px #3b82f6", "0 0 30px #3b82f6", "0 0 10px #3b82f6"]
                    }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                />
                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-widest">Visual</span>
            </div>

            {/* 2. Tone Beam (Purple) */}
            <div className="flex flex-col items-center gap-2">
                <motion.div
                    className="w-2 h-[60px] bg-purple-500 rounded-full blur-md"
                    animate={{
                        height: [30, 90, 30],
                        opacity: [0.3, 1, 0.3],
                        boxShadow: ["0 0 10px #a855f7", "0 0 30px #a855f7", "0 0 10px #a855f7"]
                    }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.2, ease: "easeInOut" }}
                />
                <span className="text-[10px] uppercase font-bold text-purple-400 tracking-widest">Tone</span>
            </div>

            {/* 3. Risk Beam (Emerald) */}
            <div className="flex flex-col items-center gap-2">
                <motion.div
                    className="w-2 h-[60px] bg-emerald-500 rounded-full blur-md"
                    animate={{
                        height: [20, 70, 20],
                        opacity: [0.3, 1, 0.3],
                        boxShadow: ["0 0 10px #10b981", "0 0 30px #10b981", "0 0 10px #10b981"]
                    }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.4, ease: "easeInOut" }}
                />
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest">Risk</span>
            </div>

            {/* Background Grid scanning effect */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[20%]"
                animate={{ top: ["-20%", "120%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            />
        </div>
    );
};
