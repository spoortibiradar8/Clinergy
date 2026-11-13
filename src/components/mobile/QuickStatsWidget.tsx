import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IndianRupee, AlertTriangle, Zap } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";

const STATS = [
  {
    id: "cost",
    title: "Today's Cost",
    value: "₹24,500",
    trend: "+2.4%",
    trendDown: false,
    icon: IndianRupee,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  {
    id: "energy",
    title: "Current Usage",
    value: "1,245 kWh",
    trend: "-1.2%",
    trendDown: true,
    icon: Zap,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    id: "alerts",
    title: "Critical Alerts",
    value: "3 Active",
    trend: "Requires Attention",
    trendDown: false,
    icon: AlertTriangle,
    color: "text-rose-600",
    bg: "bg-rose-100",
  },
];

export function QuickStatsWidget() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const { lightTap } = useHaptics();

  const handleNext = () => {
    lightTap();
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % STATS.length);
  };

  const handlePrev = () => {
    lightTap();
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + STATS.length) % STATS.length);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  const currentStat = STATS[currentIndex];

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative touch-pan-y">
      <div className="flex items-center justify-between p-4">
        <div className="flex flex-col relative w-full h-[80px]">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="absolute inset-0 flex items-center gap-4 w-full"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(_, { offset, velocity }) => {
                const swipe = Math.abs(offset.x) * velocity.x;
                if (swipe < -10000 || offset.x < -50) {
                  handleNext();
                } else if (swipe > 10000 || offset.x > 50) {
                  handlePrev();
                }
              }}
            >
              <div className={`p-3 rounded-full ${currentStat.bg} ${currentStat.color}`}>
                <currentStat.icon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500">{currentStat.title}</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-bold text-slate-900 leading-none">{currentStat.value}</h3>
                  <span className={`text-xs font-medium mb-0.5 ${currentStat.trendDown ? "text-emerald-600" : "text-rose-600"}`}>
                    {currentStat.trend}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      {/* Pagination Dots */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
        {STATS.map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIndex ? "w-4 bg-blue-600" : "w-1.5 bg-slate-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
