import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Mobile Header - Shows back button on sub-pages, logo on root pages
 */
export default function MobileHeader({ theme = "dark" }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Detect if this is a sub-page (has query params or nested route)
  const isSubPage = location.search.includes("?") || location.pathname.split("/").filter(Boolean).length > 1;
  
  // Root tab pages that should show logo instead of back
  const rootPages = ["", "Home", "BrowseTrips", "BrowseRequests", "Messages"];
  const currentPage = location.pathname.split("/").pop() || "Home";
  const isRootPage = rootPages.some(page => currentPage.includes(page));

  return (
    <motion.header
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      className={`md:hidden fixed top-0 left-0 right-0 z-40 border-b transition-colors ${
        theme === "dark"
          ? "bg-[#1a1a2e]/95 border-white/10"
          : "bg-white/95 border-gray-200"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center justify-between px-4 py-3 h-14">
        {isSubPage && !isRootPage ? (
          <button
            onClick={() => navigate(-1)}
            className={`p-2 -ml-2 rounded-lg transition-colors ${
              theme === "dark"
                ? "text-gray-400 hover:text-white hover:bg-white/10"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <Link to={createPageUrl("Home")} className="flex-1">
            <img
              src={
                theme === "dark"
                  ? "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69099ae0c2ff264b7aca7e74/65b2ef5f6_LogoDark.png"
                  : "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69099ae0c2ff264b7aca7e74/31e7876f4_Logolight.png"
              }
              alt="CarryMatch"
              className="h-8 w-auto"
            />
          </Link>
        )}

        <div className="flex-1" />
      </div>
    </motion.header>
  );
}