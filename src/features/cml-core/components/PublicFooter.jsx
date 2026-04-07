import React from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function PublicFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
                <Package className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">CarryMatch</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t("footer.product")}</h3>
            <ul className="mt-3 space-y-2">
              {[
                { to: "/pricing", label: t("footer.pricing") },
                { to: "/track", label: t("footer.trackShipment") },
                { to: "/p2p", label: t("footer.p2pDelivery") },
                { to: "/bus-tickets", label: t("footer.busTickets") },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-slate-500 transition hover:text-brand">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t("footer.company")}</h3>
            <ul className="mt-3 space-y-2">
              {["about", "contact", "partners", "careers", "blog"].map((key) => (
                <li key={key}>
                  <a href="#" className="text-sm text-slate-500 transition hover:text-brand">
                    {t(`footer.${key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t("footer.legal")}</h3>
            <ul className="mt-3 space-y-2">
              {["privacy", "terms", "cookies"].map((key) => (
                <li key={key}>
                  <a href="#" className="text-sm text-slate-500 transition hover:text-brand">
                    {t(`footer.${key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} CarryMatch. {t("footer.rights")}
          </p>
          <p className="text-xs text-slate-400">
            {t("footer.madeWith")}
          </p>
        </div>
      </div>
    </footer>
  );
}
