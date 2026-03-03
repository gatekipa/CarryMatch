import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TermsAndConditions() {
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
            <FileText className="w-8 h-8 text-[#9EFF00]" />
            <div>
              <h1 className="text-3xl font-bold text-white">Terms and Conditions</h1>
              <p className="text-sm text-gray-400 mt-1">CarryMatch Terms of Use</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-6">
            <div className="text-sm text-gray-400 border-l-2 border-[#9EFF00]/30 pl-4 mb-8">
              <p className="font-semibold text-white">Lawtekno LLC d/b/a CarryMatch</p>
              <p>Version 2.0 · Last updated 15 January 2026</p>
            </div>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. Introduction</h2>
              <p className="text-gray-300 leading-relaxed">
                Lawtekno LLC, a Maryland limited-liability company, does business as CarryMatch ("CarryMatch," "we," "our," or "us"). These Terms of Use ("Terms") form a binding agreement between CarryMatch and any person or entity who visits, registers, subscribes, or otherwise uses our websites, web applications, mobile experiences, dashboards, or related services (collectively, the "Platform"). By creating an account, subscribing as a partner, posting a listing, purchasing a ticket, or clicking "I agree," you ("User," "you") accept these Terms.
              </p>
              <p className="text-gray-300 leading-relaxed mt-3">
                If you are using the Platform on behalf of a company (including a Logistics Partner or Bus Agency), you represent that you have authority to bind that company, and "you" includes that company.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. What CarryMatch Does—and Does Not Do</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                CarryMatch provides multiple services. Each service has different roles and responsibilities.
              </p>

              <h3 className="text-lg font-semibold text-white mb-2">2.1 Traveler–Sender Matching (peer-to-peer)</h3>
              <p className="text-gray-300 leading-relaxed mb-3">
                CarryMatch introduces:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4 mb-3">
                <li><strong>Shippers/Senders</strong> – users who want to send personal items; and</li>
                <li><strong>Travelers</strong> – users who have unused luggage space.</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mb-2">
                For the Traveler–Sender matching service, CarryMatch does not:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4 mb-4">
                <li>possess, inspect, package, store, or transport any item;</li>
                <li>act as a carrier, freight forwarder, customs broker, escrow agent, or insurer;</li>
                <li>guarantee identity, conduct, legality, delivery, timing, or item condition; or</li>
                <li>mediate disputes between Shipper and Traveler beyond basic Platform tools.</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-2">2.2 Logistics Partner Service (CarryMatch CML)</h3>
              <p className="text-gray-300 leading-relaxed mb-3">
                A Logistics Partner in CarryMatch is a professional logistics or shipping business—such as a bus agency, courier, parcel forwarder, freight forwarder, container shipper, or cross-border shop—that uses CarryMatch CML as an operating system to run day‑to‑day logistics operations, including parcel intake, batching/manifests, tracking, staff management, payments, and customer notifications.
              </p>
              <p className="text-gray-300 leading-relaxed mb-2">
                For the Logistics Partner service:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4 mb-4">
                <li>CarryMatch provides software tools to help Logistics Partners digitize and manage operations.</li>
                <li>The Logistics Partner, not CarryMatch, is responsible for transportation, custody, handling, storage, routing, delivery performance, driver/staff conduct, warehousing (if any), customs declarations (if any), and compliance with applicable law.</li>
                <li>Unless expressly stated in writing, CarryMatch is not the carrier, forwarder, broker, or shipping provider for Logistics Partner transactions.</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-2">2.3 Bus Ticket Service (Cameroon only)</h3>
              <p className="text-gray-300 leading-relaxed mb-3">
                CarryMatch may provide a feature allowing users to search and purchase bus tickets from participating bus agencies for routes within Cameroon (the "Bus Ticket Service"). Bus agencies may also use CarryMatch tools to manage routes, fleets, drivers, schedules, seat inventory, and operations if they subscribe.
              </p>
              <p className="text-gray-300 leading-relaxed mb-2">
                For Bus Ticket Service:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                <li>The bus agency (or transport operator) is the seller and operator of transportation services.</li>
                <li>CarryMatch acts as a technology platform and may facilitate ticket discovery, purchase, and delivery of confirmations/notifications.</li>
                <li>Bus schedules, routes, prices, seat availability, and operator policies are determined by the bus agency and may change.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. Eligibility & Account Security</h2>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>You must be 18 years or older and legally able to enter contracts.</li>
                <li>You must provide accurate account information and keep it updated.</li>
                <li>Keep your password and login credentials secure; you are responsible for all activity under your account.</li>
                <li>We may suspend, restrict, or terminate any account at our discretion, including for safety, fraud prevention, compliance, or repeated policy violations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. Roles, Listings, Ticket Purchases, and Accuracy</h2>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>One account may participate as a Traveler, Shipper/Sender, Logistics Partner staff/admin, or ticket purchaser, depending on the features you use.</li>
                <li>All listings, shipment records, manifests, route information, and ticket-related data must be accurate, current, and complete. You must update or cancel information if circumstances change.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. User Responsibilities (Compliance and Conduct)</h2>
              <p className="text-gray-300 leading-relaxed mb-3">
                You, not CarryMatch, are solely responsible for:
              </p>

              <h3 className="text-lg font-semibold text-white mb-2">5.1 Traveler–Sender Matching compliance</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                <li><strong>Legal compliance:</strong> ensuring items are lawful to export/import/transport; fully declaring items to airlines, customs, and other authorities; obeying sanctions, export-control, and dangerous-goods rules.</li>
                <li><strong>Fees & taxes:</strong> paying any duties, tariffs, carrier fees, taxes, or penalties that apply.</li>
                <li><strong>Safety:</strong> contacting local law enforcement if you suspect criminal activity.</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-2">5.2 Logistics Partners compliance</h3>
              <p className="text-gray-300 leading-relaxed mb-2">
                If you are a Logistics Partner (or act on behalf of one), you are responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mb-4">
                <li>lawful parcel intake, custody, storage, transport, delivery, and customer service;</li>
                <li>regulatory compliance, including licensing, permits, customs, and consumer protection obligations;</li>
                <li>staff access controls and ensuring staff use the Platform appropriately;</li>
                <li>your own customer-facing policies (refunds, claims, prohibited items, delivery SLAs).</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-2">5.3 Bus Ticket Service compliance</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li><strong>If you purchase tickets:</strong> you are responsible for providing accurate passenger details, complying with operator rules, and arriving on time.</li>
                <li><strong>If you are a bus agency:</strong> you are responsible for the safe operation of routes, drivers, vehicles, schedules, refunds, and compliance with applicable transport rules and consumer laws in Cameroon.</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-3">
                CarryMatch may remove listings, content, routes, or accounts that violate the law or these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">6. Fees, Payments, Subscriptions, and Refunds</h2>
              
              <h3 className="text-lg font-semibold text-white mb-2">6.1 Traveler–Sender Platform Fee</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                When a Traveler clicks "Accept Request," the Shipper must pay a non-refundable Platform Fee (currently US $5) through our payment provider (e.g., Stripe or another processor). After successful payment, CarryMatch may release each party's direct contact details so they may arrange the handoff off-Platform. CarryMatch's role for the match ends once those details are displayed, except for enforcing these Terms.
              </p>

              <h3 className="text-lg font-semibold text-white mb-2">6.2 Bus Ticket Payments</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Ticket prices, taxes, and availability are set by bus agencies. CarryMatch may facilitate payment processing. Refunds, cancellations, rescheduling, and no‑show rules are determined by the bus agency's policies unless the Platform explicitly states otherwise. If you initiate a chargeback or payment dispute, we may suspend your account pending review.
              </p>

              <h3 className="text-lg font-semibold text-white mb-2">6.3 Logistics Partner Subscriptions and Charges</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Logistics Partners may subscribe to CarryMatch CML plans. Subscription terms, billing cycles, and included features are shown at purchase or in your partner agreement. Unless otherwise required by law or a written agreement, subscription fees are non-refundable once a billing cycle begins.
              </p>

              <h3 className="text-lg font-semibold text-white mb-2">6.4 Payment Processing</h3>
              <p className="text-gray-300 leading-relaxed">
                Payments may be processed by third-party processors. We do not store full card numbers. You agree to comply with processor terms and authorize us and/or our processors to charge your payment method for applicable fees.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">7. Prohibited Items and Prohibited Conduct</h2>
              
              <h3 className="text-lg font-semibold text-white mb-2">7.1 Prohibited items (Traveler–Sender and Logistics)</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                The Platform must never be used to transport firearms, ammunition, explosives, narcotics, counterfeit goods, hazardous materials, endangered wildlife, or any item prohibited by applicable law. This list is illustrative, not exhaustive.
              </p>

              <h3 className="text-lg font-semibold text-white mb-2">7.2 Prohibited conduct (all services)</h3>
              <p className="text-gray-300 leading-relaxed mb-2">
                You may not:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>misuse the Platform to commit fraud, harassment, or illegal activity;</li>
                <li>attempt unauthorized access, scraping, or security testing without permission;</li>
                <li>upload malware or interfere with Platform performance;</li>
                <li>post false listings, fake routes, or misleading ticket inventory;</li>
                <li>violate the rights of others.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">8. Disclaimers & No Warranties</h2>
              <p className="text-gray-300 leading-relaxed mb-3">
                The Platform is provided "as is" and "as available." CarryMatch disclaims all warranties—express, implied, statutory, or otherwise—including merchantability, fitness for a particular purpose, title, and non-infringement.
              </p>
              <p className="text-gray-300 leading-relaxed mb-2">
                Without limiting the above:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>For Traveler–Sender matching, CarryMatch does not guarantee delivery, item condition, legality, or user conduct.</li>
                <li>For Logistics Partner service, CarryMatch does not guarantee partner performance, delivery outcomes, or compliance.</li>
                <li>For Bus Ticket Service, CarryMatch does not guarantee schedules, route timing, seat availability, or operator performance.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">9. Limitation of Liability</h2>
              <p className="text-gray-300 leading-relaxed mb-3">
                To the fullest extent allowed by law, CarryMatch's total aggregate liability for any claim arising out of or relating to the Platform is limited to the greater of:
              </p>
              <p className="text-gray-300 leading-relaxed mb-3 ml-4">
                (a) US $50, or<br />
                (b) the total Platform Fees you paid to CarryMatch in the twelve (12) months before the claim arose.
              </p>
              <p className="text-gray-300 leading-relaxed mb-3">
                CarryMatch is not liable for lost, damaged, delayed, stolen, seized, or misdeclared items; missed trips; denied boarding; delays or cancellations by operators; personal injury; or property damage occurring off‑Platform or caused by third parties.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Some jurisdictions do not allow certain limitations. In those jurisdictions, our liability will be limited to the maximum extent permitted by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">10. Indemnification</h2>
              <p className="text-gray-300 leading-relaxed">
                You will defend, indemnify, and hold harmless CarryMatch, its officers, directors, employees, and agents from any claim, demand, loss, or damage (including reasonable attorneys' fees) arising out of your:<br />
                (a) use of the Platform,<br />
                (b) breach of these Terms, or<br />
                (c) violation of another's rights or of any law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">11. Governing Law & Venue</h2>
              <p className="text-gray-300 leading-relaxed">
                These Terms are governed by the laws of the State of Maryland, USA, without regard to conflict-of-law rules. You consent to the exclusive jurisdiction and venue of the state courts of Maryland sitting in Garrett County and the United States District Court for the District of Maryland (Greenbelt Division) for federal matters. You waive any objection to venue or inconvenient forum.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">12. Termination</h2>
              <p className="text-gray-300 leading-relaxed">
                CarryMatch may suspend or terminate your account or access to the Platform at any time, with or without notice. Sections 6–12 survive termination.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">13. Changes to These Terms</h2>
              <p className="text-gray-300 leading-relaxed">
                We may update these Terms by posting a revised version and indicating the "Last updated" date above. Material changes become effective thirty (30) days after posting. Continued use of the Platform after that date constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">14. Contact</h2>
              <p className="text-gray-300 leading-relaxed">
                Questions about these Terms: <a href="mailto:info@carrymatch.com" className="text-[#9EFF00] hover:underline">info@carrymatch.com</a>
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}