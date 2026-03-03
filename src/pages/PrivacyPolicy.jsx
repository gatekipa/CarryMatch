import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl("Home")} className="inline-block mb-4">
          <Button variant="ghost" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <Card className="p-6 sm:p-8 lg:p-12 bg-white/5 border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-[#9EFF00]" />
            <div>
              <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
              <p className="text-sm text-gray-400 mt-1">CarryMatch Privacy Policy</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-6">
            <div className="text-sm text-gray-400 border-l-2 border-[#9EFF00]/30 pl-4 mb-8">
              <p className="font-semibold text-white">Lawtekno LLC d/b/a CarryMatch</p>
              <p>Version 2.0 · Last updated: 15 January 2026</p>
            </div>

            <p className="text-gray-300 leading-relaxed">
              This Privacy Policy explains how Lawtekno LLC d/b/a CarryMatch ("CarryMatch," "we," "us," or "our") collects, uses, shares, and protects personal information when you use our websites, web applications, partner dashboards, and related services (the "Platform"). By using the Platform, you agree to this Policy. If you do not agree, please do not use the Platform. Where required by law, we will seek your consent separately.
            </p>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. Who we are & how to contact us</h2>
              <div className="text-gray-300 leading-relaxed space-y-2">
                <p><strong>Lawtekno LLC d/b/a CarryMatch</strong></p>
                <p>5000 Thayer Center STE C, Oakland, MD 21550, USA</p>
                <p>Email (privacy requests & general): <a href="mailto:info@carrymatch.com" className="text-[#9EFF00] hover:underline">info@carrymatch.com</a></p>
                <p className="text-sm text-gray-400">Optional privacy alias: privacy@carrymatched.com (if enabled)</p>
                <p className="mt-3">If you are in the EEA/UK/Switzerland, we may transfer your data to the United States and other countries where we and our providers operate (see §11 International Transfers).</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. Scope and roles (Travelers/Senders, Logistics Partners, Bus Tickets)</h2>
              <p className="text-gray-300 leading-relaxed mb-3">CarryMatch supports:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-3">
                <li>Traveler–Sender matching (peer-to-peer)</li>
                <li>Logistics Partner service (CarryMatch CML) for professional shipping/logistics businesses</li>
                <li>Bus Ticket Service (Cameroon only) for purchasing tickets from participating bus agencies</li>
              </ul>
              <p className="text-gray-300 leading-relaxed">
                <strong>Important:</strong> In the Logistics Partner module, CarryMatch may act as a service provider/processor for Logistics Partners for certain operational processing, while Logistics Partners may act as independent controllers for their customer data depending on the context. Partners must provide their own customer notices where required.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. What we collect</h2>
              <p className="text-gray-300 leading-relaxed mb-3">We collect information in three ways: you provide it, we collect it automatically, and we receive it from others.</p>

              <h3 className="text-lg font-semibold text-white mb-2">3.1 Information you provide</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                <li><strong>Account & profile:</strong> name, email, mobile number, password (hashed), country, preferred language, profile preferences.</li>
                <li><strong>Traveler/Shipment listings:</strong> origin/destination, dates, parcel descriptions/photos, size/weight, special instructions.</li>
                <li><strong>Communications:</strong> in-app chat, emails to support, support tickets, ratings/reviews.</li>
                <li><strong>Verification (optional):</strong> ID/selfie images and verification results through a vendor (if enabled).</li>
                <li><strong>PIN delivery (optional):</strong> hashed PIN and logs of attempts (if enabled).</li>
              </ul>

              <p className="text-gray-300 leading-relaxed mb-2"><strong>Logistics Partner (CarryMatch CML) data</strong> (if you are a Partner or Partner staff):</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                <li>business name, address, contact details, service lanes, pricing tables, staff/role assignments</li>
                <li>shipment records and operational data (sender/recipient details, parcel notes, labels, manifests, tracking scans, batching, pickup/dropoff events, ETAs)</li>
                <li>customer notifications metadata (e.g., "delivered," "ready for pickup," "out for delivery")</li>
              </ul>

              <p className="text-gray-300 leading-relaxed mb-2"><strong>Bus Ticket Service data</strong> (Cameroon only):</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                <li>passenger name and contact details (as required by operator)</li>
                <li>route selection, travel date, seat selection (if available), ticket identifiers</li>
                <li>operator-specific requirements (e.g., additional details if required by law/operator policy)</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-2">3.2 Information collected automatically</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                <li><strong>Device & log data:</strong> IP address, device type, browser, OS, pages viewed, request timestamps, referrer/UTM parameters.</li>
                <li><strong>Cookies & similar tech:</strong> session, security, preference, analytics, and limited marketing cookies (see §10).</li>
                <li><strong>Approximate location:</strong> derived from IP (city/country) for language/currency and route suggestions.</li>
                <li><strong>Scan events (partners):</strong> time, user ID, and optional location when a barcode/QR is scanned.</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-2">3.3 Information from third parties</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li><strong>Payments:</strong> payment intent IDs, last four digits, brand, country; we do not store full card numbers.</li>
                <li><strong>Messaging providers:</strong> SMS/WhatsApp/email delivery status and metadata (not full WhatsApp content).</li>
                <li><strong>Verification providers (if enabled):</strong> verification results and limited attributes.</li>
                <li><strong>Fraud prevention & analytics:</strong> anti-abuse signals and risk indicators.</li>
                <li><strong>Google Sign‑In (if you use it):</strong> basic profile info such as name, email, and a Google user identifier. We do not receive your Google password and do not access Gmail content.</li>
                <li><strong>Maps/Places providers (e.g., Google Places):</strong> location autocomplete inputs you type may be sent to that provider to return suggestions.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. How we use your information</h2>
              <p className="text-gray-300 leading-relaxed mb-3">We use personal information to:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li><strong>Provide the Platform:</strong> create accounts, authenticate, enable listings/matching, run partner operations tools, issue tickets/confirmations, and operate dashboards.</li>
                <li><strong>Payments and billing:</strong> process match fees, ticket purchases, and partner subscription billing.</li>
                <li><strong>Notifications:</strong> transactional emails/SMS/WhatsApp (match alerts, tracking updates, ticket confirmations).</li>
                <li><strong>Safety, compliance & moderation:</strong> enforce Terms, detect fraud/spam, investigate misuse, comply with lawful requests.</li>
                <li><strong>Improve and personalize:</strong> analytics, diagnostics, route suggestions, ranking, and feature testing.</li>
                <li><strong>Marketing (limited):</strong> optional product updates/promotions (opt out anytime).</li>
                <li><strong>Aggregate insights:</strong> de-identified statistics that cannot reasonably identify you.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. Legal bases (where applicable)</h2>
              <p className="text-gray-300 leading-relaxed mb-3">Where applicable (GDPR/UK GDPR and similar laws), we rely on:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Contractual necessity (to provide services you request)</li>
                <li>Legitimate interests (security, fraud prevention, product improvement)</li>
                <li>Consent (certain cookies, marketing opt-ins, optional verification, optional integrations)</li>
                <li>Legal obligations (lawful requests, tax/accounting, compliance)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">6. How we share information</h2>
              <p className="text-gray-300 leading-relaxed mb-3">We do not sell personal information. We share only as described below:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-3">
                <li><strong>Other users (Traveler–Sender matching):</strong> when a match is paid, we may reveal contact details to coordinate handoff; listings are visible by design.</li>
                <li><strong>Logistics Partners:</strong> when you book or ship via a partner, we share necessary sender/recipient/shipment details for fulfillment and notifications. Partners may have their own privacy practices.</li>
                <li><strong>Bus Agencies (Bus Ticket Service):</strong> we share ticket/passenger details necessary to issue tickets, manage boarding, and provide service.</li>
                <li><strong>Service providers (processors):</strong> hosting, analytics, security, email/SMS/WhatsApp delivery, payment processing, verification vendors, and customer support tools.</li>
                <li><strong>Legal & safety:</strong> to comply with law, enforce Terms, or protect safety/rights/property.</li>
                <li><strong>Business transfers:</strong> in merger/acquisition/asset sale, data may transfer under this Policy.</li>
              </ul>
              <p className="text-gray-300 leading-relaxed">We may share aggregated/de-identified insights that do not identify individuals.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">7. PIN delivery confirmation (optional)</h2>
              <p className="text-gray-300 leading-relaxed">
                If enabled, we store a hashed PIN and attempt logs. The PIN is a user/partner verification aid and does not make CarryMatch a party to delivery performance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">8. Data retention</h2>
              <p className="text-gray-300 leading-relaxed mb-3">We keep data only as long as needed:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li><strong>Account data:</strong> while active and up to 5 years after last activity (or shorter if law allows)</li>
                <li><strong>Listings/chat/ratings:</strong> typically 24 months after completion (may retain longer for safety/legal)</li>
                <li><strong>Partner shipment records/manifests/labels:</strong> typically 5 years from delivery (traceability/regulatory)</li>
                <li><strong>Logs & analytics:</strong> 12–24 months rolling</li>
                <li><strong>Payment records:</strong> per processor and legal requirements</li>
                <li><strong>Deletion requests:</strong> we delete or irreversibly de-identify unless we must retain certain data (fraud prevention, legal, tax).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">9. Your privacy rights</h2>
              <p className="text-gray-300 leading-relaxed mb-2">
                Depending on where you live, you may have rights to access, correct, delete, restrict/object, and opt out of marketing/targeted sharing.
              </p>
              <p className="text-gray-300 leading-relaxed">
                To exercise rights: email <a href="mailto:info@carrymatch.com" className="text-[#9EFF00] hover:underline">info@carrymatch.com</a> (or privacy@carrymatched.com if enabled). We may verify your identity. We typically respond within 30–45 days where required.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">10. Cookies & analytics</h2>
              <p className="text-gray-300 leading-relaxed mb-3">We use cookies and similar technologies:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-3">
                <li><strong>Strictly necessary:</strong> sign-in, security, fraud prevention</li>
                <li><strong>Preferences:</strong> language, currency, saved filters</li>
                <li><strong>Analytics:</strong> usage stats and diagnostics</li>
                <li><strong>Marketing (limited):</strong> product updates/route alerts; we do not run third‑party behavioral ads without notice/controls</li>
              </ul>
              <p className="text-gray-300 leading-relaxed">Where required, we provide cookie choices and honor applicable consent requirements.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">11. International transfers</h2>
              <p className="text-gray-300 leading-relaxed">
                We are based in the U.S. Data may be transferred to the U.S. and other countries where our providers operate. Where required, we use lawful transfer mechanisms (e.g., SCCs/UK Addendum) and you may request details at <a href="mailto:info@carrymatch.com" className="text-[#9EFF00] hover:underline">info@carrymatch.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">12. Security</h2>
              <p className="text-gray-300 leading-relaxed">
                We use reasonable safeguards such as TLS in transit, encryption at rest for key stores, access controls, and least-privilege practices. No system is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">13. Children</h2>
              <p className="text-gray-300 leading-relaxed">
                The Platform is not for children under 18. We do not knowingly collect children's personal data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">14. Third-party links & integrations</h2>
              <p className="text-gray-300 leading-relaxed">
                The Platform may link to or integrate third-party services (payments, messaging, maps). Their privacy practices are governed by their policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">15. Logistics Partners (special note)</h2>
              <p className="text-gray-300 leading-relaxed">
                Logistics Partners using CarryMatch must collect and process personal data lawfully and provide required notices to their customers. Partners must not upload prohibited or unnecessary personal data and must honor rights requests they receive. CarryMatch may act as a processor/service provider for certain partner processing and as an independent controller for platform security, fraud prevention, and core platform operations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">16. Changes to this Policy</h2>
              <p className="text-gray-300 leading-relaxed">
                We may update this Policy from time to time. Material changes will be posted with an updated date and, where required, additional notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">17. How to reach us</h2>
              <p className="text-gray-300 leading-relaxed">
                <strong>Questions or requests:</strong> <a href="mailto:info@carrymatch.com" className="text-[#9EFF00] hover:underline">info@carrymatch.com</a>
                <br />
                <strong>Mail:</strong> Lawtekno LLC d/b/a CarryMatch, 5000 Thayer Center STE C, Oakland, MD 21550, USA
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}