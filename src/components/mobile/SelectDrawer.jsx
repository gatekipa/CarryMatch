import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Responsive Select - Uses native Select on desktop, Bottom Sheet Drawer on mobile
 * Pass all standard Select props and optionally control drawer mode with forceDrawer
 */
export default function SelectDrawer({
  value,
  onValueChange,
  children,
  placeholder = "Select...",
  forceDrawer = false,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const useDrawer = isMobile || forceDrawer;

  // Close drawer when switching to desktop breakpoint
  useEffect(() => {
    if (!useDrawer) setIsOpen(false);
  }, [useDrawer]);

  // Extract options from children
  const options = React.Children.toArray(children).map((child) => ({
    value: child.props.value,
    label: child.props.children,
  }));

  if (useDrawer) {
    return (
      <>
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <span className="text-muted-foreground">
            {options.find((opt) => opt.value === value)?.label || placeholder}
          </span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>

        {/* Drawer Modal */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
              />

              {/* Drawer */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 20 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a2e] rounded-t-2xl max-h-[80vh] overflow-y-auto md:hidden"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
              >
                <div className="sticky top-0 bg-[#1a1a2e] px-4 py-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{placeholder}</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1 p-4">
                  {options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onValueChange(option.value);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                        value === option.value
                          ? "bg-[#9EFF00]/20 text-[#9EFF00]"
                          : "text-gray-300 hover:bg-white/5"
                      }`}
                    >
                      <span>{option.label}</span>
                      {value === option.value && (
                        <Check className="w-5 h-5" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop: use standard Select
  return (
    <Select value={value} onValueChange={onValueChange} {...props}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}