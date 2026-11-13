import { useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { useDrag } from "@use-gesture/react";
import { RefreshCw } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const controls = useAnimation();
  const { lightTap, successPattern } = useHaptics();

  const bind = useDrag(
    async ({ down, movement: [, my] }) => {
      // Only allow pull to refresh if we are at the top of the container
      if (window.scrollY > 0 || isRefreshing) return;

      if (down) {
        if (my > 80 && my < 85) {
          // Provide haptic when passing the threshold
          lightTap();
        }
        controls.start({ y: Math.min(my * 0.4, 100) });
      } else {
        if (my > 80) {
          setIsRefreshing(true);
          controls.start({ y: 60 });
          await onRefresh();
          successPattern();
          setIsRefreshing(false);
          controls.start({ y: 0 });
        } else {
          controls.start({ y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } });
        }
      }
    },
    { axis: "y", triggerAllEvents: true }
  );

  return (
    <div {...bind()} className="relative w-full h-full touch-pan-x touch-pan-y" style={{ touchAction: "pan-y" }}>
      <div className="absolute top-0 left-0 right-0 flex justify-center h-16 pointer-events-none z-0">
        <motion.div
          animate={controls}
          className="flex items-center justify-center -mt-10 bg-white rounded-full shadow-md w-10 h-10 border border-slate-100"
        >
          <RefreshCw className={`w-5 h-5 text-blue-600 ${isRefreshing ? "animate-spin" : ""}`} />
        </motion.div>
      </div>
      <motion.div animate={controls} className="relative z-10 w-full h-full bg-transparent">
        {children}
      </motion.div>
    </div>
  );
}
