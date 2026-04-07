**CarryMatch**

Product Requirements Document

The Operating System for Diaspora Shipping

Version 2.0 \| April 2026

Phase 1: Vendor Logistics (CML)

mycarrymatch.com

Confidential

Table of Contents

*↑ To populate: In Microsoft Word, right-click above and select "Update Field" → "Update Entire Table." In Google Docs, the TOC auto-populates on import.*

1\. The Problem

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **The Scenario**                                                                                                                                                                                                                                                                                                                                                                 |
|                                                                                                                                                                                                                                                                                                                                                                                  |
| You live in the US and want to send a phone to your mother in Cameroon. DHL charges \$80+ and takes 5-7 days. But there are informal freight consolidators in your community who buy airline luggage space (23kg bags) and resell it per-kilogram. They charge \$20/kg and deliver in 2 days. So you drive to their shop, hand over your phone, pay cash, and hope for the best. |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

This informal luggage-space freight model exists across every diaspora corridor worldwide --- not just Africa. It operates in African, Caribbean, South American, South Asian, and Southeast Asian diaspora communities. Thousands of micro-consolidators operate in every major diaspora city: DMV, NYC, Houston, Atlanta, London, Paris, Brussels, Toronto, Miami. They serve a market that DHL, FedEx, and UPS cannot serve cost-effectively. But they run their operations on paper receipts, WhatsApp group chats, phone calls, and memory. CarryMatch is corridor-agnostic: any vendor shipping on any route globally can use the platform.

1.1 Pain Points for the Customer (Sender/Receiver)

-   **No customer recognition:** the vendor does not remember you, cannot look you up by phone number, and has no record of your past shipments.

-   **No proof of drop-off:** you hand over your item and cash with no digital receipt, no confirmation, no tracking number.

-   **No notifications:** you do not know when your parcel left, when it arrived, or if there is a delay. Neither does your receiver.

-   **No tracking:** the only way to check status is to call or drive to the shop. Often nobody answers.

-   **No communication on delays:** if a flight is delayed or customs holds a shipment, nobody tells you. You find out when you show up and the parcel is not there.

-   **No receiver notification:** your mother in Cameroon does not know the parcel is coming until you tell her yourself.

-   **No insurance:** if your item is lost or damaged, there is no record that you sent it and no coverage.

1.2 Pain Points for the Vendor (Consolidator)

-   **No customer database:** cannot look up returning customers, their history, or their frequent receivers.

-   **No digital intake:** writes item descriptions on paper, sometimes loses them.

-   **Manual batch tracking:** groups items by trip mentally or on paper, no system to track what went on which flight.

-   **No bulk notifications:** cannot efficiently tell 30 customers their batch has arrived. Has to call each one.

-   **No payment records:** cash transactions with no receipt trail. Disputes are he-said-she-said.

-   **No staff management:** may have 2-3 helpers but no way to give them limited access to the system.

-   **Cannot scale:** everything breaks when volume goes from 20 to 100 parcels per week because it is all manual.

1.3 Market Size and Opportunity

The global diaspora population exceeds 280 million people. Remittances to low- and middle-income countries exceeded \$656 billion in 2023 (World Bank). Alongside cash, physical goods flow through both formal and informal channels in every corridor: Africa, Caribbean, South America, South Asia, Southeast Asia, and beyond. The informal consolidator market handles millions of parcels annually with virtually zero digitization.

Initial priority corridors: US/UK/EU to West and Central Africa (Cameroon, Nigeria, Ghana, Senegal). But the platform is designed to serve ANY corridor globally --- a vendor shipping from Miami to Haiti, or from London to Pakistan, or from Toronto to Jamaica, can use CarryMatch the same way.

2\. The Solution: CarryMatch

CarryMatch is the operating system for diaspora shipping. Starting with Phase 1 (Vendor Logistics), it gives micro freight consolidators a professional-grade digital platform to run their business, while giving their customers the transparency, tracking, and communication they deserve.

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **The Vision**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Any shipping consolidator, barrel collector, luggage-space reseller, container shipper, or local bus agency that moves parcels can sign up for CarryMatch and instantly run like a professional logistics company --- with customer lookup, digital intake, batch management, WhatsApp notifications, printable shipping labels, live tracking, insurance, payment records, and multi-staff access. Their customers get digital receipts, real-time updates via QR code scan, and proof of shipment --- all through WhatsApp, the channel they already use. |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

2.1 Phased Rollout Strategy

  ----------- ------------------------ ---------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Phase**   **Module**               **Timeline**     **Description**

  Phase 1     Vendor Logistics (CML)   Now -- Month 3   Core product. Digital operations platform for micro freight consolidators. Solves the primary pain points of no tracking, no receipts, no notifications, no customer records.

  Phase 2     P2P Delivery             Month 3 -- 6     Peer-to-peer matching between individual senders and travelers with spare luggage space. Expands the platform beyond business vendors to individual travelers.

  Phase 3     Bus Ticketing            Month 6 -- 9     Online ticket sales for bus/transport agencies anywhere. Different market segment but shares the same platform infrastructure.
  ----------- ------------------------ ---------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

This document focuses primarily on Phase 1. Phases 2 and 3 are summarized in Section 9.

3\. Target Users (Phase 1)

3.1 Primary User: The Vendor

CarryMatch serves three distinct types of vendors who all share the same pain points (no digital records, no tracking, no customer communication) and benefit from the same platform:

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Vendor Type 1: Airline Luggage Consolidators**                                                                                                                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                                                                                                              |
| Small operators who buy airline luggage space (23kg bags) and resell per-kilogram shipping to diaspora communities. They operate from storefronts, home offices, or market stalls. They ship via commercial flights, typically with 2--3 day delivery. Example: A vendor in Maryland buys 5 checked bags on a flight to Douala, fills them with customer parcels at \$20/kg. |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Vendor Type 2: Sea Container / Barrel Consolidators**                                                                                                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                                                                                 |
| Operators who collect items from many people and consolidate them into sea containers or barrels for ocean freight. Slower (4--8 weeks) but cheaper. They may collect electronics, household goods, clothing, cars, and equipment. Example: A vendor in Houston collects items over 2 weeks, fills a 20ft container, and ships to Lagos by sea. |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Vendor Type 3: Local Bus Agency Parcel Services**                                                                                                                                                                                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Bus and transport companies that also collect parcels from people and transport them between cities --- domestically or across borders. This is MASSIVE across Africa, South America, and the Caribbean where bus networks serve as the primary parcel delivery infrastructure. These agencies already have routes, schedules, vehicles, and staff. They just lack digital tools to manage the parcel side of their business. |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Real-world examples of bus agency parcel services that would use CarryMatch:

-   **Nigeria:** Lagos → Abuja, Lagos → Port Harcourt, Abuja → Kano. Agencies like ABC Transport, GIG, Peace Mass Transit already move parcels alongside passengers.

-   **Cameroon:** Douala → Yaoundé, Douala → Bafoussam, Bamenda → Buea, Yaoundé → Bertoua. Agencies like Touristique Express, Vatican Express, Musango operate parcel counters at bus terminals.

-   **Ghana:** Accra → Kumasi, Accra → Tamale, Kumasi → Takoradi. VIP, STC, and VVIP bus lines carry parcels on every trip.

-   **Kenya:** Nairobi → Mombasa, Nairobi → Kisumu, Nairobi → Nakuru. Easy Coach, Modern Coast handle parcel services alongside passenger transport.

-   **Rwanda:** Kigali → Butare, Kigali → Gisenyi. Volcano Express and other intercity operators.

-   **Cross-border:** Douala → Lagos, Accra → Lomé, Nairobi → Kampala. International bus routes that carry parcels across borders.

-   **Latin America:** Guatemala City → San Salvador, Bogotá → Medellín, Lima → Cusco. Same model exists across Central and South America.

For these bus agencies, CarryMatch replaces the paper ledger at the parcel counter. Staff scans or logs each parcel at origin, the system tracks it to destination, and the receiver gets a WhatsApp when it arrives. The agency's parcel division runs on CarryMatch while their passenger ticketing can run separately (or use CarryMatch Phase 3).

All three vendor types use the same CarryMatch platform. The system adapts to each through the Shipping Mode setting (Air, Sea, Road/Bus) which affects ETA calculations, batch sizes, and label formats.

  ----------------- --------------------------------------------------------- -------------------------------------------------------------- ------------------------------------------------------------
  **Attribute**     **Luggage Consolidator**                                  **Container/Barrel**                                           **Bus Agency Parcels**

  Business size     1--5 staff                                                1--10 staff                                                    5--50+ staff

  Volume            20--200 parcels/week                                      50--1000+ items/month                                          50--500 parcels/day

  Shipping method   Airline luggage (23kg bags)                               Sea containers (20/40ft), barrels                              Bus cargo hold, dedicated cargo vehicles

  Delivery speed    2--3 days                                                 4--8 weeks                                                     Same day to 2 days

  Pricing model     \$15--30 per kg                                           Per item, per barrel, or per cubic ft                          Per item, per kg, or flat rate by size

  Routes            International (diaspora corridors)                        International (large cargo)                                    Domestic or cross-border (city to city)

  Key need          Customer memory, WhatsApp receipts, batch notifications   Container manifest, collection tracking, long ETA management   High-volume intake, route-based batching, daily scheduling
  ----------------- --------------------------------------------------------- -------------------------------------------------------------- ------------------------------------------------------------

3.2 Secondary User: The Customer (Sender)

Diaspora members sending items to family abroad, or receiving items from their home country. They want affordable, fast, and trustworthy shipping with basic transparency: a receipt, a tracking update, and a notification when the item arrives.

3.3 Tertiary User: The Receiver

The person at the destination who receives the parcel. They want to know when something is coming, when it arrives, and where to pick it up. WhatsApp is the primary communication channel across most corridors.

3.4 All User Roles

  ------------------- ---------------------------------------------------------------------- -------------------------
  **Role**            **Description**                                                        **Access Level**

  Vendor Owner        Business owner who signed up. Full access to everything.               Full admin

  Vendor Admin        Trusted staff with management access (financials, reports, settings)   Management

  Vendor Staff        Staff who process intake and updates but no financials                 Operational

  Sender (Customer)   Person dropping off parcels. Interacts via WhatsApp notifications.     Receive-only (WhatsApp)

  Receiver            Person receiving parcels at destination. Gets WhatsApp updates.        Receive-only (WhatsApp)

  Super Admin         CarryMatch platform administrator                                      Platform-level

  CML Admin           CarryMatch logistics module administrator                              Module-level
  ------------------- ---------------------------------------------------------------------- -------------------------

4\. Phase 1 Features: Vendor Logistics (CML)

For the current build, Phase 1 CML is frozen to the launch-core slice only. The broader Phase 1 follow-on items in this PRD remain part of the roadmap, but they are not part of the first coding wave.

4.1 Vendor Onboarding and Access Control

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **⚠️ Access is Gated**                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                   |
| Vendors cannot simply sign up and start using the platform. There is an application → review → approval process. This protects the platform from fraud, ensures quality, and gives CarryMatch a direct onboarding relationship with every vendor. |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

4.1.1 Onboarding Flow

1.  **Sign Up:** Vendor visits mycarrymatch.com/partners and clicks "Apply as Partner." Creates account with email + password.

2.  **Application Form:** Vendor fills out partner application:

    -   Company/Business name

    -   Owner full name

    -   Phone number + WhatsApp number

    -   Email address

    -   Business type: Luggage Consolidator / Container-Barrel Shipper / Bus Agency Parcels / Other

    -   Primary corridors (origin → destination, can add multiple)

    -   Estimated monthly shipment volume

    -   Office address(es) --- origin and destination if applicable

    -   How did you hear about CarryMatch?

    -   Optional: Business registration number, social media links, references

3.  **Pending Review:** Application is submitted. Vendor sees: "Your application is under review. We'll notify you within 48 hours." Vendor CANNOT access the dashboard.

4.  **Admin Review:** CML Admin or Super Admin reviews the application. Can approve, reject (with reason), or request more info.

5.  **Approval:** On approval: Vendor record created with status=active. VendorStaff record created with role=owner. Vendor gets WhatsApp + email: "Welcome to CarryMatch! Your account is active." Vendor can now access the dashboard.

6.  **Initial Setup:** First login shows a guided setup wizard:

    -   Set vendor prefix (3-letter tracking code, e.g. ABC)

    -   Configure default origin (country/city)

    -   Add destination branch(es) with address, hours, ID requirements

    -   Set pricing model (per-kg or flat fee, see 4.1.3)

    -   Set insurance model (percentage or flat fee)

    -   Upload company logo (for labels and branding)

    -   Choose subscription plan or enter coupon code

4.1.2 Access Control Rules

  ---------------------------------------------------- -------------------------------------------------------------------------------------------------------------
  **Rule**                                             **Behavior**

  Unauthenticated user                                 Can see landing page, pricing page, and partner application form only. Cannot access any dashboard or data.

  Authenticated, no vendor record                      Redirect to "Apply as Partner" page. Cannot access dashboard.

  Authenticated, application pending                   Show "Application under review" status page. Cannot access dashboard.

  Authenticated, application rejected                  Show rejection reason + "Reapply" button. Cannot access dashboard.

  Authenticated, vendor active, no subscription        Can access dashboard on Free tier (limited to 50 shipments/month). Show upgrade prompts.

  Authenticated, vendor active, paid plan              Full access to plan features.

  Authenticated, subscription expired (grace period)   Full access for 3 days. Show prominent "Subscription expired" banner with renewal options.

  Authenticated, subscription expired (past grace)     Downgraded to Free tier. Data preserved. Pro features locked.

  Vendor suspended by admin                            Show "Account suspended" page with support contact. Cannot access any data.
  ---------------------------------------------------- -------------------------------------------------------------------------------------------------------------

4.1.3 Vendor Pricing Model Configuration

Vendors set their OWN pricing for their customers. CarryMatch does not set or control vendor prices. The vendor chooses their pricing model in Settings:

  ------------------- --------------------------------------------------------------------------------------------------------------------- -------------------------------------------------------
  **Pricing Model**   **How It Works**                                                                                                      **Example**

  Per-Kilogram        Vendor sets a rate per kg. At intake, staff enters weight and system calculates: base_price = weight × rate_per_kg.   \$20/kg. A 3kg parcel = \$60 base price.

  Flat Fee per Item   Vendor sets a fixed price per parcel regardless of weight. At intake, base_price = flat_fee × quantity.               \$25 per item. 2 items = \$50 base price.

  Custom / Manual     Vendor manually enters the base price at intake. No auto-calculation. For vendors with variable pricing.              Vendor types \$45 based on negotiation with customer.
  ------------------- --------------------------------------------------------------------------------------------------------------------- -------------------------------------------------------

Configuration stored on the Vendor entity:

  ------------------- ---------------------------------- --------------------------------------------------------------
  **Field**           **Type**                           **Notes**

  pricing_model       Enum: per_kg / flat_fee / manual   Determines how base price is calculated at intake

  rate_per_kg         Integer (cents)                    Used when pricing_model = per_kg. E.g. 2000 = \$20.00/kg

  flat_fee_per_item   Integer (cents)                    Used when pricing_model = flat_fee. E.g. 2500 = \$25.00/item

  default_currency    String (ISO 4217)                  E.g. USD, EUR, GBP. Default currency for all shipments.
  ------------------- ---------------------------------- --------------------------------------------------------------

At intake (Step 5), the base price field auto-calculates based on the vendor's pricing model and the parcel weight/quantity from Step 4. The vendor can always override the auto-calculated price before finalizing. Additional fees/discounts are added on top.

4.2 Vendor Dashboard

The central hub for the vendor. Shows real-time operational metrics and provides quick access to all functions.

  ----------------------- ---------------------------------------------------------------------------------------------------------------------------------------------------------- --------------
  **Component**           **Description**                                                                                                                                            **Priority**

  KPI Cards               Today's cut-offs, active batches, in transit, delivered this month, alerts/issues, revenue                                                                 P0

  Branch + Mode Filters   Filter all data by branch location and shipping mode (air/sea/road)                                                                                        P1

  Quick Actions Grid      One-tap access: New Shipment, Scan & Update, Manage Batches, View Shipments, Payments, Closeout, Notifications, Reports, Issues, Claims, Staff, Settings   P0

  Customize Layout        Vendor can rearrange/hide dashboard widgets                                                                                                                P2
  ----------------------- ---------------------------------------------------------------------------------------------------------------------------------------------------------- --------------

4.3 Customer Lookup and CRM

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Edge Feature: Phone-Based Customer Memory**                                                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                                             |
| When a vendor starts a new shipment, they type the sender's phone number. If this person has shipped before, their name, email, WhatsApp, frequent receivers, and past shipments auto-populate. This alone solves one of the biggest pain points: "they don't remember me." |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

  -------------------- -------------------------------------------------------------------------------------- --------------
  **Feature**          **Description**                                                                        **Priority**

  Phone-first lookup   Type phone number → auto-pull name, email, WhatsApp, country, city from past records   P0

  Frequent receivers   Show list of people this sender has shipped to before, one-tap to select               P0

  Customer history     View all past shipments for this sender: dates, items, tracking, status, payments      P0

  Quick re-ship        Copy details from a past shipment to create a new one with same sender/receiver        P1

  Customer notes       Vendor can add private notes per customer (e.g. "always pays on delivery")             P1

  Contact import       Bulk import existing customer list from CSV or phone contacts                          P2
  -------------------- -------------------------------------------------------------------------------------- --------------

4.4 Quick Intake Form (6-Step Shipment Creation)

The core workflow. A vendor takes in a parcel from a customer and creates a shipment record in under 60 seconds.

4.6.1 Step 1: Origin and Destination

  --------------- -------------------------------- -------------- ----------------------------------------------------------------------------------------------------------------------------------------------
  **Field**       **Type**                         **Required**   **Notes**

  From Country    Searchable dropdown (ISO 3166)   Yes            Pre-filled from vendor's default origin

  From City       Text with autocomplete           Yes            

  To Country      Searchable dropdown (ISO 3166)   Yes            

  To City         Text with autocomplete           Yes            

  Shipping Mode   Dropdown: Air / Sea / Road-Bus   Yes            Determines ETA calculation, label format, and batch type. Air = luggage consolidators, Sea = container/barrel, Road-Bus = bus agency parcels
  --------------- -------------------------------- -------------- ----------------------------------------------------------------------------------------------------------------------------------------------

4.6.2 Step 2: Sender Details

  ----------------- ------------------------- -------------- ------------------------------------------------------
  **Field**         **Type**                  **Required**   **Notes**

  Phone             Phone input with search   Yes            Auto-populates if returning customer

  Name              Text                      Yes            Auto-filled if found

  WhatsApp Number   Phone with country code   Yes            Primary notification channel. Pre-filled from phone.

  Email             Email                     No             Fallback notification channel

  Country           Searchable dropdown       Yes            

  City              Text                      Yes            
  ----------------- ------------------------- -------------- ------------------------------------------------------

4.5.3 Step 3: Receiver Details

Same fields as Sender. If the sender has shipped to this receiver before, one-tap to auto-fill from the frequent receivers list.

4.4.4 Step 4: Parcel Details

  ------------------------ ------------------------------ -------------- ----------------------------------------------------------------------------
  **Field**                **Type**                       **Required**   **Notes**

  Contents Description     Textarea                       Yes            What is being shipped (e.g. "2 iPhones, 3 pairs of shoes")

  Weight                   Number + unit (kg/lbs)         Yes            Determines pricing

  Quantity                 Number (default 1)             Yes            Number of items/packages

  Category                 Dropdown                       Yes            Documents, Electronics, Clothing, Food, Fragile, Household, Medical, Other

  Dimensions (L x W x H)   Number inputs + unit (cm/in)   No             Optional, for volumetric weight

  Volumetric Weight        Auto-calculated                N/A            L×W×H/5000 (cm). Shown if dimensions entered.

  Chargeable Weight        Auto-calculated                N/A            Higher of actual vs volumetric weight

  Estimated Value (USD)    Number                         No             For customs/insurance

  Special Handling         Textarea                       No             E.g. "fragile", "keep upright"

  Fragile                  Toggle                         No             Flags for special handling

  Hazardous Materials      Toggle + description           No             Warning shown if enabled

  Reference Number         Text                           No             Sender's own tracking/order ref

  Photos (PRO)             Camera capture + file upload   No             Up to 4 photos. PRO plan only. Greyed out on Free.
  ------------------------ ------------------------------ -------------- ----------------------------------------------------------------------------

4.4.5 Step 5: Pricing and Insurance

  --------------------------- --------------------------------- ----------------- -------------------------------------------------------------------------------------------------------
  **Field**                   **Type**                          **Required**      **Notes**

  Base Price                  Number (USD)                      Yes               Vendor enters their price

  Additional Fees/Discounts   Label + Amount (repeatable)       No                E.g. packing fee, loyalty discount

  Insurance Toggle            On/Off                            No                Rate/fee pulled from vendor settings

  Declared Value              Number (USD)                      If insurance on   Value of contents for insurance calc (used if % mode)

  Insurance Mode              Dropdown: Flat Fee / Percentage   If insurance on   Vendor chooses how to charge insurance

  Insurance Rate/Fee          Display (vendor-configured)       N/A               Either a flat fee (e.g. \$5) or a percentage (1--10%) of declared value. Set in Vendor Settings.

  Insurance Premium           Auto-calculated                   N/A               Flat fee or (declared value × rate%), whichever mode the vendor chose. Min premium applies if % mode.

  Total                       Auto-calculated                   N/A               Base + fees + insurance

  Payment Status              Paid Now / Pay Later              Yes               Records whether payment was collected at intake
  --------------------------- --------------------------------- ----------------- -------------------------------------------------------------------------------------------------------

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Insurance Model: 100% Vendor Revenue**                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Insurance is entirely the vendor's business. CarryMatch does not touch, process, or take any cut of insurance revenue. Vendors choose their own insurance model: a flat fee per parcel (e.g. \$5) or a percentage of declared value (e.g. 3%). They set this in their Settings. The insurance amount is collected by the vendor and kept by the vendor. CarryMatch simply provides the tool to calculate, display, and record it on the shipment. CarryMatch's only revenue is the monthly subscription fee. |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

4.4.6 Step 6: Confirm and Create

-   Summary: tracking number, route, sender/receiver, item description, total price, payment status

-   Create Shipment button → saves record, generates tracking number, triggers WhatsApp confirmations

-   Post-creation options: Print Shipping Label (PRO), Create Another Shipment, Back to Dashboard

-   WhatsApp confirmations sent automatically to both sender and receiver (see Section 4.6)

4.4.7 Shipping Labels (PRO Feature)

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Edge Feature: Printable Shipping Labels**                                                                                                                                                                                                                                                                              |
|                                                                                                                                                                                                                                                                                                                          |
| After creating a shipment, PRO vendors can print a professional shipping label to attach to the parcel. The label includes a QR code that links to the live tracking page --- anyone who scans it sees real-time status updates. This replaces handwritten tags and gives the vendor a professional, branded appearance. |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Label contents:

  ---------------------- ---------------------------------------------------------------------
  **Field**              **Details**

  Vendor Logo + Name     Pulled from vendor settings

  Tracking Number        Auto-generated unique ID (e.g. ABC-954198XYVC)

  QR Code                Encodes the tracking page URL. Scanning shows live shipment status.

  Barcode                Scannable barcode for vendor's Scan & Update feature

  Sender Name + City     Origin info

  Receiver Name + City   Destination info

  Receiver Phone         For destination office reference

  Shipping Mode          Air / Sea / Road-Bus

  Weight                 Actual or chargeable weight

  Parcel Description     Short contents summary (first 50 chars)

  Date                   Intake date

  Payment Status         PAID or PAY ON COLLECTION
  ---------------------- ---------------------------------------------------------------------

-   Labels can be printed on standard label printers (4x6 thermal) or regular paper (A4 with cut lines)

-   PRO feature: Free-tier vendors see a "Upgrade to Pro to print shipping labels" prompt

-   Batch print: PRO vendors can print all labels for a batch at once

4.4.8 Self-Service Tracking Page

Every shipment has a public tracking page accessible via URL or QR code scan. This page shows real-time status updates whenever the vendor updates the shipment in the system.

Tracking page shows:

-   Tracking number and shipment summary (origin → destination, shipping mode)

-   Current status with timestamp (e.g. "In Transit --- Apr 5, 2026 at 2:30pm")

-   Full status history timeline: Created → In Transit → Arrived → Ready for Pickup → Collected

-   ETA (if set by vendor)

-   Pickup office details (address, hours, ID requirements) --- shown when status is "Arrived" or later

-   Vendor contact info (phone, WhatsApp)

The tracking page updates automatically whenever the vendor updates the shipment status in the system. No app download required --- it is a web page accessible from any device. The QR code on the shipping label links directly to this page.

4.5 Batch Management

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Edge Feature: One-Click Batch Notifications**                                                                                                                                                                      |
|                                                                                                                                                                                                                      |
| When a vendor clicks "Ship Batch", every sender and receiver in that batch gets a WhatsApp message: "Your parcel is on its way! ETA: \[date\]." No more calling 30 people individually. One click notifies everyone. |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

  ------------------------- -------------------------------------------------------------------------------------------------------------------- --------------
  **Feature**               **Description**                                                                                                      **Priority**

  Create Batch              Group pending shipments into a batch (e.g. "Flight DL230 -- Apr 10")                                                 P0

  Add/Remove from Batch     Drag or select shipments to add/remove                                                                               P0

  Lock Batch                Freeze batch --- no more additions. Triggers cut-off notifications.                                                  P0

  Ship Batch                Mark batch as shipped. Sets departure date. Triggers "in transit" notifications to ALL senders/receivers in batch.   P0

  Batch Arrival             Mark batch as arrived at destination office. Triggers pickup notifications (see 4.5.2).                              P0

  Batch ETA                 Vendor enters ETA when shipping. Shown to customers in notifications.                                                P0

  Batch Manifest            Printable list of all items in the batch with sender/receiver/weight                                                 P1

  Batch Collection Status   Real-time view: Total parcels, Collected count, Pending count. "Send Reminder to Uncollected" button.                P0
  ------------------------- -------------------------------------------------------------------------------------------------------------------- --------------

4.6.1 Vendor Office / Branch Model

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **How Vendors Actually Operate**                                                                                                                                                                                                                                                                                                                                                                                                                                           |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| A vendor typically has offices on BOTH sides of the corridor. For example: an office in Maryland (US) where senders drop off parcels, and an office in Douala (Cameroon) where receivers pick them up. The sender pays at origin. The vendor ships a batch. When the batch arrives at the destination office, the destination office manager (or origin office) marks it as arrived. Receivers then come to the destination office with their ID to collect their parcels. |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Each vendor can have multiple branch offices. Each branch is a separate entity in the system:

  ------------------------ -------------------------------- -------------- ----------------------------------------------------
  **Field**                **Type**                         **Required**   **Notes**

  Branch Name              Text                             Yes            E.g. "Maryland Office", "Douala Office"

  Side                     Dropdown: Origin / Destination   Yes            Which side of the corridor this office serves

  Address                  Text                             Yes            Full street address for customer pickup/drop-off

  Location Link            URL                              No             Google Maps link or directions

  Phone                    Phone                            Yes            Office contact number

  WhatsApp                 Phone                            No             Office WhatsApp number

  Opening Hours            Text                             Yes            E.g. "Mon--Sat 9am--6pm"

  Manager                  Staff reference                  No             Staff member responsible for this branch

  Required ID for Pickup   Text                             Yes            E.g. "Valid government-issued photo ID"

  Special Instructions     Textarea                         No             E.g. "Call before coming", "Bring tracking number"
  ------------------------ -------------------------------- -------------- ----------------------------------------------------

Both origin and destination office staff can update shipment and batch statuses. The system supports dual-side management: a staff member in Maryland can mark a batch as shipped, and a staff member in Douala can mark it as arrived.

4.6.2 Destination Arrival and Pickup Flow

This is the critical last-mile flow that happens when a batch arrives at the destination office.

7.  **Batch Arrives:** Destination office manager (or origin office) clicks "Batch Arrived" on the batch. A form appears:

    -   Pickup Office: select from vendor's destination branches (pre-filled if only one)

    -   Pickup Address: auto-filled from branch settings, editable

    -   Opening Hours: auto-filled from branch settings, editable

    -   Required ID: auto-filled from branch settings (e.g. "Valid government photo ID")

    -   Special Instructions: optional (e.g. "Closed Sundays", "Parking available")

8.  **Pickup Notifications Sent:** WhatsApp messages go to ALL receivers in the batch:

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Sample Pickup Notification**                                                                                                                                                               |
|                                                                                                                                                                                              |
| "Your parcel has arrived! 📦\\nTracking: ABC-954198XYVC\\nPickup: Douala Office, Rue de la Joie, Akwa\\nHours: Mon--Sat 9am--6pm\\nBring: Valid government photo ID\\nFrom: \[sender name\]" |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

9.  **Collection Process:** When a receiver comes to collect:

    -   Staff searches by tracking number, receiver name, or phone number

    -   Staff verifies receiver's ID matches the name on the shipment

    -   Staff marks shipment as "Collected" with date/time and collector name

    -   Optional (PRO): Staff takes a photo of the item handover or receiver signing

    -   Sender gets automatic WhatsApp confirmation: "Your parcel \[tracking #\] has been collected by \[receiver name\] on \[date\]."

10. **Smart Pickup Reminders (Only Uncollected):** Follow-up reminders ONLY go to receivers whose parcels have NOT been collected yet. Once marked as collected, that receiver stops receiving reminders.

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Edge Feature: Smart Reminder Targeting**                                                                                                                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                                                                                    |
| A batch has 30 parcels. After 3 days, 22 have been collected. The vendor clicks "Send Reminder to Uncollected" and only the 8 remaining receivers get a WhatsApp: "Your parcel is still waiting for pickup at Douala Office. Hours: Mon--Sat 9am--6pm. Please collect soon." This is a massive time-saver versus calling each person individually. |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Configurable reminder schedule in Vendor Settings:

  ----------------- ----------------------- -------------------------------------------------------------------------------------------------------------
  **Reminder**      **Default Timing**      **Message**

  First Reminder    2 days after arrival    "Your parcel is waiting for pickup at \[office\]. Hours: \[hours\]."

  Second Reminder   5 days after arrival    "Reminder: Your parcel is still at \[office\]. Please collect soon."

  Final Reminder    10 days after arrival   "Urgent: Your parcel has been waiting 10 days. Please collect within \[X\] days or storage fees may apply."
  ----------------- ----------------------- -------------------------------------------------------------------------------------------------------------

Vendors can toggle reminders on/off, customize intervals, and edit message templates. Reminders can be automatic (on a schedule) or manual (vendor clicks "Send Reminder to Uncollected").

4.5.3 Batch Collection Dashboard

Each batch has a collection status view showing real-time progress:

  ------------------------- --------------------------------------------------------------------------------------
  **Component**             **Description**

  Total Parcels             Total number of shipments in the batch

  Collected (✅)            Count and list of parcels that have been picked up, with date/time of collection

  Pending Collection (⏳)   Count and list of parcels still waiting, with receiver name and phone number

  Collection Rate           Percentage bar (e.g. 22/30 = 73% collected)

  "Send Reminder" Button    Sends WhatsApp pickup reminder ONLY to receivers with pending/uncollected parcels

  Days Since Arrival        Shows how long the batch has been at the destination office

  Export List               Download list of uncollected parcels with receiver contact info for manual follow-up
  ------------------------- --------------------------------------------------------------------------------------

4.6 WhatsApp Notification System

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Edge Feature: WhatsApp-Native Communication**                                                                                                                                                                                 |
|                                                                                                                                                                                                                                 |
| Every notification goes through WhatsApp first --- the channel that 95%+ of the target market already uses daily. Email is automatic fallback if WhatsApp delivery fails. This is available on ALL pricing tiers, not just Pro. |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

4.6.1 Automated Notification Triggers

  ------------------------------ ----------------------------------------- --------------------------------------------------------------------------------------------------
  **Trigger Event**              **Recipient(s)**                          **Message Content**

  Shipment Created               Sender                                    Digital receipt: tracking #, item description, weight, price, payment status, receiver name, ETA

  Shipment Created               Receiver                                  "A parcel is being sent to you by \[sender\]. Tracking: \[#\]. ETA: \[date\]."

  Batch Shipped (In Transit)     All senders + receivers in batch          "Your parcel is on its way! Shipped on \[date\]. ETA: \[date\]."

  Batch Arrived at Destination   All receivers in batch                    Pickup details: office address, hours, required ID, tracking \# (see Section 4.5.2)

  Batch Arrived at Destination   All senders in batch                      "Your parcel has arrived in \[city\] and is ready for pickup by \[receiver\]."

  Pickup Reminder                ONLY receivers with UNCOLLECTED parcels   "Your parcel is still waiting for pickup at \[office\]. Hours: \[hours\]. Please collect soon."

  Parcel Collected               Sender                                    "Your parcel \[tracking #\] has been collected by \[receiver name\] on \[date\]."

  Delay Alert                    Sender + Receiver                         "Update: Your parcel is delayed. New ETA: \[date\]. Reason: \[reason\]."

  Payment Reminder               Sender (if Pay Later)                     "Reminder: Payment of \$\[amount\] is due for shipment \[tracking #\]."
  ------------------------------ ----------------------------------------- --------------------------------------------------------------------------------------------------

4.6.2 Vendor Notification Settings

-   WhatsApp Business number configuration (outbound number for sending)

-   Customizable message templates per trigger event

-   Toggle which triggers are active

-   Notification log: view delivery status of every message sent (delivered, read, failed)

-   Fallback: if WhatsApp fails, automatically send via email. If no email, log alert for vendor.

4.7 Additional Vendor Features

  ---------------------------- --------------------------------------------------------------------------------------------------------------- --------------
  **Feature**                  **Description**                                                                                                 **Priority**

  Scan & Update                Scan barcode/QR on shipping label to instantly pull up a shipment and update its status                         P0

  View Shipments               Full list with search, filters (status, date, batch, corridor, shipping mode), and detail view                  P0

  Shipping Labels (PRO)        Print professional labels with sender/receiver info, tracking #, QR code, and barcode. Single or batch print.   P0

  Self-Service Tracking Page   Public web page per shipment (linked via QR code on label). Updates in real-time when vendor updates status.    P0

  Payments Tracking            Record payments per shipment. Filter by paid/unpaid. Cash, Zelle, CashApp, mobile money.                        P0

  Closeout / End of Day        Reconcile all shipments and payments for the day. Generate daily summary.                                       P1

  Reports & Analytics          Revenue by period, shipments by corridor, top customers, batch performance, mode breakdown                      P1

  Issues Management            Flag delayed, on-hold, or problem shipments. Track resolution.                                                  P1

  Claims / Insurance           Process insurance claims for lost/damaged items                                                                 P1

  Staff Management             Add staff with role-based access: Owner, Admin (financials), Staff (operations only)                            P0

  Vendor Settings              Company profile, default origin, insurance config, notification config, branches, label branding                P0

  Customer Management          View all customers, their shipment history, contact info, and notes                                             P1
  ---------------------------- --------------------------------------------------------------------------------------------------------------- --------------

5\. Competitive Edge Capabilities

These features differentiate CarryMatch from generic freight software (GoFreight, Descartes, Logistaas) and from logistics aggregators (Sendbox, Topship, Terminal Africa). None of these competitors serve the informal micro-consolidator niche.

  -------------------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------
  **Capability**                         **Why It Matters**                                                                                                                                                         **Status**

  Phone-based customer memory            The single most requested feature. Vendors want to type a phone number and see everything about that customer. No existing tool does this for micro-consolidators.         Phase 1

  One-click batch notifications          Vendors currently call 30+ people per batch. One click to WhatsApp everyone saves hours per shipment cycle.                                                                Phase 1

  WhatsApp-native on all tiers           Target market lives on WhatsApp. Email-first tools fail here. Even free-tier vendors get WhatsApp notifications.                                                           Phase 1

  Digital receipt via WhatsApp           Replaces paper receipts. Sender gets instant proof of drop-off with tracking number, item details, and payment confirmation.                                               Phase 1

  Receiver gets notified automatically   Currently receivers have no idea something is coming. Automated WhatsApp to receiver at intake is transformative.                                                          Phase 1

  Printable shipping labels (PRO)        Professional labels with QR code, barcode, sender/receiver, tracking #. Replaces handwritten tags. QR links to live tracking page. Batch print for all items in a batch.   Phase 1

  Live tracking page via QR code         Anyone scans the label's QR code and sees real-time status. Updates automatically when vendor updates in system. No app download needed.                                   Phase 1

  Per-kg pricing model support           Most freight software assumes per-shipment or per-container pricing. CarryMatch natively supports per-kg, per-item, flat rate, and per-barrel pricing.                     Phase 1

  Smart pickup reminders                 Only uncollected receivers get reminded. As items are picked up, those people stop getting messages. Reduces noise and vendor workload.                                    Phase 1

  Multi-vendor-type platform             Same tool works for luggage consolidators, sea container/barrel shippers, AND local bus agency parcel services. Shipping mode adapts the experience.                       Phase 1

  Self-service tracking page             Customers text tracking \# to a WhatsApp bot or visit a link to check status. Reduces "where's my parcel?" calls by 70%+.                                                  Phase 1

  Vendor-owned insurance                 Vendors set their own insurance (flat fee or %). They collect and keep 100% of it. CarryMatch has zero involvement --- it's just a tool.                                   Phase 1

  Corridor-agnostic                      Works for ANY shipping corridor globally --- Africa, Caribbean, South America, South Asia, Southeast Asia. Not locked to one region.                                       Phase 1

  Multi-currency support                 Handle USD at origin, XAF/NGN/GHS at destination. Show pricing in both currencies.                                                                                         Phase 2

  Payment link in WhatsApp               Send a payment link via WhatsApp for Pay Later shipments. Customer pays online, vendor gets notification.                                                                  Phase 2

  Customer loyalty program               Frequent shippers get discounts or priority. Vendor configurable.                                                                                                          Phase 2

  Public vendor profile                  Vendors get a CarryMatch profile page showing their corridors, pricing, reviews. Customers can discover new vendors.                                                       Phase 2

  WhatsApp chatbot for tracking          Customers text "TRACK ABC123" to the vendor's WhatsApp and get instant status back. No app download required.                                                              Phase 2

  Proof of delivery photos               Staff takes a photo at collection. Sender gets it via WhatsApp as confirmation.                                                                                            Phase 1
  -------------------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- -------------

6\. Subscription Tiers and Pricing

For the Phase 1 CML launch, the commercial model is frozen to Free + Pro only.

  ------------------------------ -------------------------- ------------------------------------------
  **Feature**                    **Free**                   **Pro (\$49/mo)**

  Shipments per month            50                         Unlimited

  Customer lookup + CRM          Yes                        Yes

  Quick Intake Form              Yes                        Yes

  Batch management               Yes                        Yes

  WhatsApp notifications         Yes (all triggers)         Yes (all triggers)

  Email fallback notifications   Yes                        Yes

  Staff accounts                 1 (owner)                  Up to 5

  Role-based access              No                         Yes (Owner/Admin/Staff)

  Parcel photo documentation     No                         Yes (up to 4 per shipment)

  Shipping labels (printable)    No                         Yes (single + batch print, branded)

  Self-service tracking page     Yes (CarryMatch branded)   Yes (vendor branded)

  Advanced reports + analytics   Basic (this month only)    Full history + export

  Insurance configuration        Default 2% only            Flat fee or %, custom rate + min premium

  Branches / locations           1                          Up to 3

  Customer import (CSV)          No                         Yes

  Branded notifications          CarryMatch branding        Vendor branding

  API access                     No                         No

  Priority support               Community                  Email + WhatsApp
  ------------------------------ -------------------------- ------------------------------------------

Revenue model: Monthly SaaS subscription. No per-shipment fees. No cut of insurance, shipping fees, or any vendor revenue. CarryMatch earns ONLY from subscription fees. The platform is a tool --- vendors run their own business, set their own prices, and keep all their revenue.

6.1 Subscription Collection Methods

Most vendors in the target market operate in cash. CarryMatch supports two payment methods for subscriptions:

+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Method 1: Stripe (Online)**                                                                                                                                                                                                               |
|                                                                                                                                                                                                                                             |
| Standard online payment via Stripe. Vendor enters credit/debit card, subscription auto-renews monthly. This is the default path for vendors comfortable with online payments. Stripe handles billing, receipts, and failed payment retries. |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Method 2: Cash + Coupon Code**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| For vendors who prefer to pay cash (common in the target market), CarryMatch uses a coupon code system. The vendor pays cash to a CarryMatch representative or agent. The rep generates a coupon code in the admin panel. The vendor enters the coupon code in the app, which activates their subscription for that billing period (1 month). When the month ends, the subscription expires and the vendor needs a new coupon code to continue. This works exactly like a prepaid phone card --- pay, get a code, activate, use for 30 days, renew. |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Coupon code system details:

  ------------------ ---------------------------------------------------------------------------------------------------------------------------------------
  **Feature**        **Description**

  Code format        Unique alphanumeric code (e.g. CM-PRO-X7K9M2). Single-use.

  Code generation    Super Admin or CML Admin generates codes in bulk or individually via admin panel

  Plan binding       Each code is tied to a specific launch plan (currently Pro) and duration (1 month, 3 months, 6 months, 1 year)

  Activation         Vendor enters code in Settings → Subscription. System validates and activates immediately.

  Expiration         Subscription expires at the end of the paid period. Vendor sees countdown: "12 days remaining"

  Grace period       3-day grace period after expiration before downgrade to Free tier (no data loss, just feature restrictions)

  Renewal reminder   WhatsApp notification sent to vendor 7 days and 1 day before expiration: "Your Pro plan expires in X days. Contact \[rep\] to renew."

  Stacking           Codes can be stacked --- entering a new code while active extends the subscription by that duration

  Audit trail        Admin can see which codes were generated, who used them, when, and who sold them (for agent commissions)
  ------------------ ---------------------------------------------------------------------------------------------------------------------------------------

This dual approach (Stripe + coupon) ensures CarryMatch can onboard vendors regardless of their payment preferences or banking access. The coupon system also opens the door for local agents/resellers who sell CarryMatch subscriptions in their community for a commission.

7\. Technical Architecture

7.1 Stack

  ------------------------ ---------------------------- ---------------------------------------------------------------------------------------------------
  **Layer**                **Technology**               **Notes**

  Frontend                 React (Vite)                 Single-page application with component-based architecture

  Backend                  Supabase (PostgreSQL)        Auth, database, storage, serverless edge functions, Row Level Security

  Hosting                  Vercel or Supabase Hosting   CDN-backed, auto-deploy from Git

  Deployment               Git + CI/CD                  Push to main branch triggers build and deploy

  Subscription Billing     Stripe + Coupon Codes        Stripe for online card payments. Coupon code system for cash payments (prepaid activation codes).

  Notifications            Meta Cloud API direct        Primary channel. Company-owned Meta Business Manager / WhatsApp Business Account for launch, one dedicated CarryMatch logistics number, Meta webhooks via Vercel API routes.

  Email Fallback           Resend / SendGrid            Automatic when WhatsApp fails

  Web App                  PWA (Service Worker)         Installable from browser, works offline for UI shell

  Native Mobile (Future)   Capacitor                    Wrap PWA into native iOS/Android apps for App Store and Play Store distribution. Same codebase.

  KYC (Phase 2)            Manual review                ID + selfie upload for travelers
  ------------------------ ---------------------------- ---------------------------------------------------------------------------------------------------

7.2 Native Mobile Strategy

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **PWA First, Native Later**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| CarryMatch launches as a Progressive Web App (PWA) --- installable from the browser, works offline, and feels like a native app. This avoids the cost and delay of App Store/Play Store review processes during the critical launch phase. Once the product is stable and growing, the same codebase will be wrapped with Capacitor (by Ionic) to produce native iOS and Android apps for distribution through the Apple App Store and Google Play Store. Capacitor allows access to native device features (camera, push notifications, contacts, biometrics) while keeping a single codebase. No rewrite required. |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

Native app timeline:

-   Phase 1 (Launch): PWA only. Install via browser "Add to Home Screen."

-   Phase 2 (Month 3--6): Wrap with Capacitor. Submit to App Store and Play Store.

-   Phase 3 (Month 6+): Leverage native features --- push notifications, camera for scan & update, contacts import, biometric login.

7.3 Localization: Bilingual App (MANDATORY)

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **⚠️ NON-NEGOTIABLE REQUIREMENT**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| The CarryMatch application MUST be fully bilingual: English and French. This is not optional, not a Phase 2 feature, not a nice-to-have. It is a launch requirement. The target market includes Francophone Africa (Cameroon, Senegal, Côte d'Ivoire, DRC, Congo, Gabon, Mali, Burkina Faso, Guinea) AND Anglophone Africa (Nigeria, Ghana, Kenya, Rwanda, Tanzania) AND French-speaking diaspora (France, Belgium, Switzerland, Quebec). A vendor in Douala speaks French. A vendor in Lagos speaks English. Both must be fully served. |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

7.3.1 i18n Architecture

  -------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------
  **Component**        **Specification**

  i18n library         Use react-i18next (industry standard). All user-facing strings in JSON translation files, never hardcoded.

  Translation files    Two files: en.json (English) and fr.json (French). Organized by module: common, dashboard, intake, batch, notifications, settings, onboarding, auth.

  Language detection   Auto-detect from browser language on first visit. Default to English if ambiguous. Store preference in user profile.

  Language switcher    Visible in the top navigation bar at all times. Toggle between EN and FR with one click. Preference persists across sessions.

  RTL support          Not required for Phase 1 (French and English are both LTR). Plan for Arabic if expanding to North Africa later.

  Date/time formats    EN: MM/DD/YYYY, 12h. FR: DD/MM/YYYY, 24h. Use locale-aware formatting (Intl.DateTimeFormat).

  Currency formats     EN: \$1,000.00. FR: 1 000,00 \$. Use Intl.NumberFormat with locale.

  Number formats       EN: 1,000.50. FR: 1 000,50. Decimal separator differs.
  -------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------

7.3.2 What Must Be Translated

  --------------------------------- ------------------------------------------------------------------------------------------------------------- ----------------------------------------
  **Category**                      **Includes**                                                                                                  **Priority**

  All UI labels and buttons         Every button, menu item, form label, placeholder, tooltip, error message, success message, modal title        P0 --- launch blocker

  Dashboard content                 KPI card titles, Quick Action labels, filter labels, status badges                                            P0

  Intake form                       All 6 steps: field labels, placeholders, validation messages, helper text                                     P0

  WhatsApp notification templates   All notification messages must exist in BOTH languages. System sends in the recipient's preferred language.   P0 --- launch blocker

  Email notifications               Fallback emails in both languages                                                                             P0

  Tracking page                     Status labels, pickup info labels, vendor contact labels                                                      P0

  Shipping labels                   Field headers on printed labels (Sender/Expéditeur, Receiver/Destinataire, Weight/Poids, etc.)                P0

  Onboarding + auth                 Sign up, login, apply as partner, application status, setup wizard                                            P0

  Settings pages                    All settings labels, descriptions, and help text                                                              P0

  Error messages                    All validation errors, API errors, permission denied messages                                                 P0

  Admin panel                       CML Admin and Super Admin interfaces                                                                          P1 (can launch English-only for admin)
  --------------------------------- ------------------------------------------------------------------------------------------------------------- ----------------------------------------

7.3.3 WhatsApp Language Logic

WhatsApp notifications are sent in the RECIPIENT'S preferred language, not the vendor's.

  --------------------------------------------------------- ----------------------------------------------------------------------------------------------------------------------------------------
  **Scenario**                                              **Language Used**

  Sender is French-speaking, receiver is English-speaking   Sender gets French WhatsApp. Receiver gets English WhatsApp.

  Both French-speaking                                      Both get French.

  Language unknown (no preference set)                      Default to French if phone number has a Francophone African country code (+237, +225, +221, +243, etc.). Default to English otherwise.

  Vendor UI language                                        Independent of customer notification language. A French-speaking vendor can serve English-speaking customers and vice versa.
  --------------------------------------------------------- ----------------------------------------------------------------------------------------------------------------------------------------

Language preference is stored on the Customer entity (preferred_language: "en" or "fr"). Set at first contact based on phone country code, and overridable by the vendor or customer.

7.3.4 Translation Workflow

-   All English strings are written first (en.json is the source of truth)

-   French translations are done by a native French speaker (not machine translation for customer-facing content)

-   WhatsApp message templates must be submitted to WhatsApp for approval in BOTH languages separately

-   New features cannot ship without both EN and FR translations complete

-   Use a translation key naming convention: module.section.element (e.g. intake.sender.phone_label, dashboard.kpi.active_batches)

7.4 Key Technical Decisions

-   RLS policies should enforce vendor data isolation at the database level. If RLS templates are insufficient, enforce at the application layer via hooks that inject vendor_id into every query.

-   Most server-side logic (label generation, coupon validation, internal notification orchestration) runs as Supabase Edge Functions. Meta webhook ingress runs through Vercel API routes.

-   Database schema changes are version-controlled and deployed via migrations (e.g. Supabase CLI or Prisma).

-   Null query results must be defensively handled before property access to prevent runtime crashes.

-   WhatsApp integration uses Meta Cloud API direct: shipment status change -> server-side trigger -> Meta Cloud API -> WhatsApp message. Delivery receipts return through Meta webhooks handled in Vercel API routes.

7.5 Key Entities

  ------------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Entity**          **Key Fields**

  Vendor              id, user_id, email, company_name, status (pending/active/suspended), pricing_model (per_kg/flat_fee/manual), rate_per_kg, flat_fee_per_item, default_currency, ui_language (en/fr), insurance_mode (flat/percentage), insurance_rate, insurance_flat_fee, min_premium, default_origin, subscription_plan_id, logo_url, vendor_prefix

  VendorStaff         id, vendor_id, user_id, email, role (owner/admin/staff), status, branch_id

  Branch              id, vendor_id, name, side (origin/destination), address, location_link, phone, whatsapp, opening_hours, manager_staff_id, required_id_for_pickup, special_instructions

  Customer            id, vendor_id, phone, name, email, whatsapp, country, city, preferred_language (en/fr), notes, created_at

  Shipment            id, vendor_id, tracking, batch_id, sender (customer_id), receiver (customer_id), origin, destination, parcel_details, weight, category, pricing, payment_status, notification_channel, vendor_insurance_revenue, status, collected_at, collected_by, collection_photo_url, created_at

  Batch               id, vendor_id, name, shipment_ids, status (open/locked/shipped/arrived/collecting/completed), eta, shipped_at, arrived_at, pickup_branch_id, total_parcels, collected_count

  Notification        id, shipment_id, batch_id, recipient_phone, channel (whatsapp/email), trigger, status (sent/delivered/read/failed), sent_at

  SubscriptionPlan    id, name, price, features, limits

  CouponCode          id, code, plan_id, duration_months, status (unused/active/expired), vendor_id (null until used), generated_by, sold_by_agent, activated_at, expires_at

  VendorApplication   id, user_id, email, company_name, owner_name, phone, whatsapp, business_type, corridors (array), monthly_volume, office_addresses, referral_source, registration_number, status (pending/approved/rejected), rejection_reason, reviewed_by, reviewed_at, created_at
  ------------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

7.6 Implementation Specifications (CRITICAL FOR DEVELOPMENT)

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **⚠️ READ THIS SECTION CAREFULLY**                                                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                                |
| The following specifications resolve ambiguities that WILL cause bugs if left to developer interpretation. Every item below was identified as a gap where Claude Code, Codex, or any AI coding tool would make incorrect assumptions. When implementing any feature, check this section first. |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

7.6.1 Tracking Number Generation

  -------------------- ------------------------------------------------------------------------------------------------------------------------------
  **Spec**             **Value**

  Format               \[VENDOR_PREFIX\]-\[YYMMDD\]\[RANDOM6\]. Example: ABC-260405X7K9M2

  Vendor prefix        3-letter code set by vendor in Settings (default: first 3 chars of company name, uppercase). Must be unique across platform.

  Random portion       6 alphanumeric characters, uppercase, no ambiguous chars (no 0/O, 1/I/L). Use charset: ABCDEFGHJKMNPQRSTUVWXYZ23456789

  Uniqueness scope     GLOBAL. No two shipments on the entire platform can share a tracking number, regardless of vendor.

  Collision handling   On generation, query Shipment table to verify uniqueness. If collision, regenerate. Max 3 retries, then append extra char.

  Immutability         Once generated, tracking number NEVER changes. It is the permanent public identifier for the shipment.
  -------------------- ------------------------------------------------------------------------------------------------------------------------------

7.6.2 Shipment Status State Machine

This is the CANONICAL list of shipment statuses and their valid transitions. Do NOT allow transitions not listed here.

  ------------ ------------------------------------------------------------- -------------------------------------------------------- -------------------------------------------------
  **Status**   **Description**                                               **Valid Next Statuses**                                  **Who Can Set**

  draft        Created but not finalized (optional, for multi-step intake)   pending                                                  Staff, Admin, Owner

  pending      Shipment created, awaiting batch assignment                   in_batch, cancelled                                      Staff, Admin, Owner

  in_batch     Assigned to a batch, not yet shipped                          in_transit, pending (if removed from batch), cancelled   System (auto when added to batch), Admin, Owner

  in_transit   Batch has shipped, parcel is en route                         arrived, delayed                                         Admin, Owner, Destination Staff

  delayed      Shipment is delayed (vendor sets reason + new ETA)            in_transit (if resolved), arrived                        Admin, Owner

  arrived      Batch arrived at destination office, awaiting pickup          collected, returned                                      Admin, Owner, Destination Staff

  collected    Receiver has picked up the parcel. TERMINAL STATE.            None (final)                                             Staff, Admin, Owner

  returned     Uncollected after max period, returned to sender              None (final)                                             Admin, Owner

  cancelled    Shipment cancelled before shipping                            None (final)                                             Admin, Owner
  ------------ ------------------------------------------------------------- -------------------------------------------------------- -------------------------------------------------

IMPORTANT: The status field on the Shipment entity must be an ENUM (not free text). The UI must only show valid next-status buttons based on current status. Do NOT render a generic status dropdown.

7.6.3 Multi-Tenancy and Data Isolation

+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **⚠️ CRITICAL SECURITY REQUIREMENT**                                                                                                                                                                                                                                                                                                                                                                                                             |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| If RLS policies cannot reliably enforce vendor-scoped reads (e.g. due to template or auth context issues), then ALL data isolation MUST be enforced at the APPLICATION LAYER. Every .select() and query MUST include a vendor_id filter. Failure to do this means Vendor A can see Vendor B's customers, shipments, and revenue. Prefer database-level RLS enforcement where possible; fall back to app-layer filtering where RLS is unreliable. |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

  -------------------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Rule**                               **Implementation**

  Every query must filter by vendor_id   The auth hook returns the current user's vendor_id. This MUST be passed to every query: supabase.from(\'shipments\').select().eq(\'vendor_id\', vendorId), etc. Alternatively, enforce via RLS policy: (vendor_id = auth.uid()::vendor lookup).

  No cross-vendor data leakage           A vendor can NEVER see another vendor's customers, shipments, batches, staff, or revenue. Test this explicitly.

  Tracking page is public but limited    The tracking page (public URL) shows only: status timeline, ETA, pickup details. It does NOT show pricing, payment status, or vendor revenue.

  Super Admin bypass                     Only Super Admin and CML Admin can query across vendors (for platform analytics, dispute resolution).

  Staff sees own vendor only             VendorStaff can only access data for their own vendor_id. This is enforced by the hook, not by RLS.
  -------------------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

7.6.4 Customer Record Scoping

The Customer entity has a vendor_id field. This means the same physical person (same phone number) can have SEPARATE customer records with different vendors. This is intentional.

  ------------------------------ ---------------------------------------------------------------------------------------------------------------------------------
  **Scenario**                   **Behavior**

  Same phone, same vendor        Phone lookup finds the existing Customer record. Auto-populate fields.

  Same phone, different vendor   Each vendor has their own Customer record for this phone number. Vendor A cannot see that this person also ships with Vendor B.

  Phone lookup scope             Customer.filter({vendor_id: currentVendorId, phone: inputPhone}). ALWAYS scoped to current vendor.

  Frequent receivers             Stored per-customer, per-vendor. Receiver records are also vendor-scoped.
  ------------------------------ ---------------------------------------------------------------------------------------------------------------------------------

7.6.5 WhatsApp Integration Architecture

This is the most common area where AI coding tools will build something that does not actually work. Be explicit.

  ---------------------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Component**                      **Specification**

  Meta Cloud API direct              Use Meta Cloud API direct for Phase 1 CML. The launch setup uses a company-owned Meta Business Manager and WhatsApp Business Account with one dedicated CarryMatch logistics number for all vendors.

  Message templates                  All automated messages MUST use pre-approved WhatsApp message templates. WhatsApp requires template approval before sending. Template variables are injected at send time (e.g. {{1}} = tracking number, {{2}} = receiver name).

  Trigger mechanism                  When a shipment status changes OR a batch status changes, a server-side function fires. This function: (1) queries affected recipients, (2) builds the message from template + variables, (3) calls the Meta Cloud API directly to send.

  Webhook handling                   Meta delivery events and status webhooks terminate in Vercel API routes. Store sent -> delivered -> read -> failed in the Notification entity.

  Token strategy                     Use a permanent system user token from the start. Do NOT build the launch flow around temporary tokens.

  Fallback logic                     If WhatsApp send fails (returned error or no delivery after 5 min), automatically attempt email. If no email on file, create an alert in vendor's Issues dashboard.

  Rate limiting                      WhatsApp has rate limits. Batch notifications must be queued and sent with delays (e.g. 10 messages/second) to avoid throttling.

  Opt-in requirement                 WhatsApp requires user opt-in before sending messages. The intake form's WhatsApp number field serves as implicit opt-in. Store consent timestamp.

  Phone number format                ALL phone numbers must be stored in E.164 format (+1XXXXXXXXXX). The UI shows formatted, but storage is always E.164. Validate on input.
  ---------------------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

7.6.6 Photo Storage

  ------------------------- ----------------------------------------------------------------------------------------------------------------------
  **Spec**                  **Value**

  Storage backend           Supabase Storage

  Bucket name               shipment-photos

  File path convention      /{vendor_id}/{shipment_id}/{timestamp}\_{index}.jpg (e.g. /v123/s456/20260405143022_1.jpg)

  Max file size             5MB per photo

  Compression               Client-side compress to max 1920px on longest edge, 80% JPEG quality before upload. Do NOT upload raw camera images.

  Max photos per shipment   4 (intake photos) + 1 (collection proof photo) = 5 total

  Access control            Photos are private. Accessed via signed URLs with 1-hour expiry. Only vendor staff + sender can view.
  ------------------------- ----------------------------------------------------------------------------------------------------------------------

7.6.7 Label Generation

  ------------------- -------------------------------------------------------------------------------------------------------------------------
  **Spec**            **Value**

  Generation method   Server-side PDF generation using a Supabase Edge Function (or API endpoint). Return PDF as downloadable/printable file.

  QR code library     Use qrcode npm package. Encode URL: https://mycarrymatch.com/track/{tracking_number}

  Barcode format      Code 128. Encode the tracking number string.

  Label sizes         4x6 inches (thermal printer, default) and A4 (4 labels per page, with cut lines)

  Batch print         Generate a single PDF with all labels in the batch, one per page (4x6) or 4 per page (A4)

  Vendor branding     PRO: vendor logo (uploaded in Settings, max 200x200px PNG/JPG) + vendor name. Free: CarryMatch logo.
  ------------------- -------------------------------------------------------------------------------------------------------------------------

7.6.8 Batch-Shipment Relationship

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **⚠️ Dual Reference Anti-Pattern**                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| The Batch entity has shipment_ids (array) AND the Shipment entity has batch_id. This is a dual reference and WILL cause sync bugs. RULE: Shipment.batch_id is the SOURCE OF TRUTH. The Batch.shipment_ids array is a DENORMALIZED CACHE for performance. When adding/removing a shipment from a batch, ALWAYS update Shipment.batch_id first, then rebuild Batch.shipment_ids from a query. Never update Batch.shipment_ids directly without also updating Shipment.batch_id. |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

7.6.9 Insurance Logic (Precise)

  ------------------------------ -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Scenario**                   **Calculation**

  Mode = flat_fee                Insurance premium = vendor's flat fee amount (e.g. \$5.00). Declared value field is hidden (not needed).

  Mode = percentage, above min   Insurance premium = declared_value × (insurance_rate / 100). E.g. \$200 × 3% = \$6.00

  Mode = percentage, below min   Insurance premium = min_premium. E.g. \$50 × 3% = \$1.50, but min is \$5, so charge \$5.00

  Insurance off                  Insurance premium = \$0. No insurance fields shown. vendor_insurance_revenue = 0.

  Storage                        vendor_insurance_revenue field on Shipment stores the premium amount. This is NOT included in any CarryMatch revenue calculations.

  Per-shipment override          Insurance mode and rate come from Vendor Settings as DEFAULTS. The intake form auto-fills but allows per-shipment override at Step 5. Store the actual values used on the Shipment record, not a reference to Settings.
  ------------------------------ -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

7.6.10 Pricing and Currency

  --------------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------
  **Spec**              **Value**

  Currency field        Add a currency field to Shipment (default: USD). Even though multi-currency display is Phase 2, store the currency NOW so data isn't ambiguous later.

  Price storage         Store all monetary values as integers in CENTS (not floats). \$20.00 = 2000. This avoids floating-point rounding errors.

  Display               Format as currency string on the UI (e.g. \$20.00, ₣20,000). Never show raw cents to the user.

  Additional fees       Store as an array of objects: \[{label: "Packing fee", amount: 500}, {label: "Discount", amount: -200}\]. Amounts in cents. Negative = discount.

  Total calculation     total = base_price + sum(additional_fees) + insurance_premium. Calculated on save, stored on Shipment. Do not recalculate from Settings at display time.
  --------------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------

7.6.11 Payment Recording

The intake form captures Paid Now vs Pay Later. But payment recording needs more detail for the vendor to track their cash flow.

  ---------------- ------------------------------------------------------------ ----------------------------------------------------------------------------
  **Field**        **Type**                                                     **Notes**

  payment_status   Enum: paid / partial / unpaid                                Set at intake (Paid Now = paid, Pay Later = unpaid). Can be updated later.

  payment_method   Enum: cash / zelle / cashapp / mobile_money / card / other   How the vendor received payment. For vendor's own records.

  amount_paid      Integer (cents)                                              How much has been collected so far. Allows partial payments.

  amount_due       Integer (cents)                                              total - amount_paid. Auto-calculated.

  payment_notes    Text                                                         Optional notes (e.g. "Will pay on delivery", "Zelle ref #12345")

  paid_at          Timestamp                                                    When the last payment was recorded
  ---------------- ------------------------------------------------------------ ----------------------------------------------------------------------------

7.6.12 Staff Permissions Matrix

This MUST be enforced in the UI (hide/disable features) AND in the application layer (reject unauthorized actions). Do NOT rely on UI-only restrictions.

  ---------------------------------------- --------------- --------------- ---------------
  **Action**                               **Staff**       **Admin**       **Owner**

  Create shipment (intake)                 Yes             Yes             Yes

  View shipments (own branch)              Yes             Yes             Yes

  View shipments (all branches)            No              Yes             Yes

  Update shipment status                   Yes             Yes             Yes

  Edit shipment details after creation     No              Yes             Yes

  Cancel/void a shipment                   No              Yes             Yes

  View pricing and payment info            No              Yes             Yes

  Record payments                          No              Yes             Yes

  View revenue/reports                     No              Yes             Yes

  Manage batches (create/lock/ship)        Yes             Yes             Yes

  Manage staff (add/remove/change roles)   No              No              Yes

  Manage branches                          No              No              Yes

  Change vendor settings                   No              No              Yes

  Change subscription/enter coupon         No              No              Yes

  View customer history                    Yes (limited)   Yes             Yes

  Export data / reports                    No              Yes             Yes

  Delete customer records                  No              No              Yes
  ---------------------------------------- --------------- --------------- ---------------

7.6.13 Shipment Editing and Cancellation Rules

  --------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Rule**                          **Details**

  Editable when pending             All fields can be edited while status = pending (not yet in a batch).

  Editable when in_batch            Only weight, pricing, payment_status, and notes can be edited. Sender/receiver changes require removing from batch first.

  Locked when in_transit or later   No edits allowed once shipped. Only status transitions and payment recording. Admin can add notes.

  Cancellation                      Only from pending or in_batch status. Cancelling a shipment in a batch auto-removes it from the batch. Triggers WhatsApp to sender: "Your shipment \[tracking\] has been cancelled."

  Deletion                          Shipments are NEVER hard-deleted. Use status = cancelled. Soft delete preserves audit trail.

  Edit audit log                    Every edit records: who, when, what changed (old value → new value). Stored as an array on the Shipment or in a separate AuditLog entity.
  --------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

7.6.14 Notification Deduplication

  ----------------------------------------------------------- ------------------------------------------------------------------------------------------------------------------------------
  **Scenario**                                                **Rule**

  Receiver has multiple parcels in same batch                 Send ONE message listing all their parcels, not separate messages per parcel. Group by receiver phone number before sending.

  Sender sent multiple items in same batch                    Send ONE message listing all their items' status, not one per shipment.

  Same person is sender AND receiver in different shipments   Send separate messages for send vs receive roles. Different templates.

  Duplicate phone numbers (typos)                             Normalize all phones to E.164 before dedup. +1 (301) 555-1234 and 3015551234 are the same number.

  Reminder already sent today                                 Do not send more than one reminder per recipient per day, regardless of how many uncollected parcels they have.
  ----------------------------------------------------------- ------------------------------------------------------------------------------------------------------------------------------

7.6.15 Offline Capability (Realistic Scope)

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **⚠️ Be Honest About Limitations**                                                                                                                                                                                                                                                                                                                                                                                                                                               |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| The app is cloud-based. True offline-first with sync is NOT feasible without significant custom work. Do NOT promise or build offline shipment creation with sync. The PWA service worker caches the UI shell for fast loading, but all data operations require network. If the vendor is offline, show a clear message: "No internet connection. Please reconnect to create shipments." Do NOT queue offline writes --- this will cause data conflicts and duplicate shipments. |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

7.6.16 API and Database Query Limits

  ------------------- ---------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Constraint**      **Details**

  Default page size   Supabase returns max 1000 records by default, but ALWAYS paginate for large lists (shipments, customers, notifications). Use .range(from, to) for pagination.

  Filter syntax       Use Supabase's .eq(), .in(), .ilike() methods. Malformed query strings cause errors. Never concatenate raw SQL.

  Sort fields         Use exact column names from the schema. Use snake_case everywhere. Verify column exists before sorting.

  Nested queries      Supabase supports foreign key joins via .select(\'\*, customer(\*)\') syntax. Use this instead of querying inside loops.

  Batch operations    Supabase supports bulk inserts via .insert(\[array\]) and bulk updates via .update().in(\'id\', \[ids\]). Use these for batch operations.

  Rate limiting       Supabase has connection limits per plan. For batch notifications (30+ WhatsApp messages), use a queue with delays, not synchronous sends.
  ------------------- ---------------------------------------------------------------------------------------------------------------------------------------------------------------

7.6.17 Coupon Code Edge Cases

  ----------------------------------------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------
  **Edge Case**                                   **Behavior**

  Code already used                               Show error: "This code has already been redeemed." Do not activate.

  Code for wrong plan                             Code is always tied to a specific plan. If vendor enters a Pro code, they get Pro. Show what plan the code activates before confirming.

  Vendor already has active Stripe subscription   Allow coupon entry. Coupon time is ADDED to existing expiry. Pause Stripe billing for the coupon duration. Resume auto-billing after coupon period ends.

  Expired code                                    Codes do not expire before use (no expiry date on unused codes). They only expire after activation (activation_date + duration_months).

  Grace period overlap                            If vendor is in 3-day grace period and enters a new coupon, subscription is re-activated immediately. Grace period ends. New expiry = now + duration.

  Vendor downgrades during active period          Not allowed. Vendor keeps current plan until period ends. They can choose not to renew.
  ----------------------------------------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------

8\. Competitive Landscape

  ----------------------- -------------------------------------- --------------------------------------------------------------------------------------------------------------------------
  **Competitor**          **What They Do**                       **Why They Don't Serve This Market**

  DHL / FedEx / UPS       Global parcel delivery                 Too expensive (\$80+ per parcel to Africa). Not designed for community-based consolidation.

  Sendbox                 African e-commerce logistics           Serves online retailers, not informal consolidators. No per-kg model.

  Topship                 Shipping aggregator (Nigeria focus)    Rate comparison tool, not an operations platform. No intake forms, batch management, or CRM.

  Heroshe                 US-to-Nigeria consolidation            Only one corridor. Consumer-facing, not a tool for vendors to run their business.

  Terminal Africa         Delivery aggregator (Nigeria)          API-first for e-commerce. No WhatsApp-native notifications. Not for informal operators.

  GoFreight / Descartes   Enterprise freight forwarding TMS      Designed for licensed freight forwarders with containers. Too complex and expensive (\$500+/mo) for micro-consolidators.

  SEND (trysend.com)      Digital freight forwarder for Africa   They ARE a freight forwarder. CarryMatch empowers independent operators.

  WhatsApp groups         How vendors communicate today          No structure, no tracking, no receipts, no automation. The status quo we replace.
  ----------------------- -------------------------------------- --------------------------------------------------------------------------------------------------------------------------

+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Unique Positioning**                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| CarryMatch is the ONLY platform purpose-built for informal micro freight consolidators in ANY diaspora corridor worldwide. Enterprise TMS tools are too complex and expensive. Aggregators compete with vendors instead of empowering them. CarryMatch sits in the sweet spot: professional-grade operations at a price and simplicity level that a solo operator can adopt on day one. Whether you ship from Houston to Cameroon, Miami to Haiti, or London to Pakistan --- CarryMatch works. |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

9\. Future Phases (Summary)

9.1 Phase 2: P2P Delivery (Month 3--6)

Peer-to-peer matching between individual senders and travelers with spare luggage space. Travelers post upcoming trips with route and dates. Senders post delivery requests. The system matches them. Revenue: flat \$5 matching fee per successful match.

-   Traveler trip posting with route, dates, available capacity

-   Sender delivery request posting

-   Route and date matching algorithm

-   KYC verification for travelers (ID + selfie, manual review)

-   In-app messaging between matched parties

-   Ratings and reviews post-delivery

9.2 Phase 3: Bus Ticketing (Month 6--9)

Online ticket sales platform for bus/transport agencies anywhere. Agencies manage routes, schedules, fleet, and drivers. Passengers search and purchase tickets online. Revenue: 5% service fee per ticket.

-   Route and schedule management

-   Online ticket purchase with seat selection

-   Fleet and driver management

-   Passenger manifests and QR ticket validation

-   Same vendor platform architecture (can be used by bus companies who also ship parcels)

10\. Detailed Roadmap

  ---------------------- ------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Milestone**          **Timeline**        **Deliverables**

  UAT Complete           Now -- Week 2       Complete 31-case test plan, fix all critical bugs, stabilize intake form enhancements

  Phase 1 Launch (PWA)   Week 2 -- Month 1   Vendor Logistics live as bilingual PWA (EN/FR), launch-core only: intake, batches, proof-photo collection, WhatsApp notifications, CRM, shipping labels, tracking pages. Free + Pro subscription system. First 10 vendors onboarded.

  WhatsApp Integration   Month 1 -- 2        Meta Cloud API direct rollout for automated WhatsApp messaging, delivery-status tracking, and self-service tracking via WhatsApp.

  Growth + Iteration     Month 2 -- 3        50+ vendors onboarded. Iterate based on feedback. Add reports, closeout, claims. Multi-currency. Coupon agent/reseller program.

  Native Mobile Apps     Month 3 -- 4        Wrap PWA with Capacitor. Submit to Apple App Store and Google Play Store. Enable native camera, push notifications, contacts import.

  Phase 2 Start          Month 3             Begin P2P delivery module development

  Phase 2 Launch         Month 6             P2P delivery live. \$5 matching fee revenue stream active.

  Phase 3 Start          Month 6             Begin bus ticketing module

  Phase 3 Launch         Month 9             Bus ticketing live. 5% service fee revenue stream active.
  ---------------------- ------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

11\. Success Metrics

  ----------------------------- --------------------------------- ---------------------------------------------------
  **Metric**                    **Target (Phase 1, +6 months)**   **How Measured**

  Vendor partners onboarded     100+                              Vendor accounts with active subscriptions

  Shipments processed           25,000+                           Total shipments created on platform

  WhatsApp notifications sent   100,000+                          Notification logs

  Monthly Recurring Revenue     \$5,000+                          Stripe subscriptions + coupon code activations

  Customer retention (vendor)   80%+ monthly                      Subscription renewal rate

  Shipment creation time        \< 60 seconds                     Average time from intake start to Create Shipment

  Customer lookup hit rate      40%+ are returning                Phone lookups that find existing records

  WISMO call reduction          70% fewer                         Vendor-reported before/after
  ----------------------------- --------------------------------- ---------------------------------------------------

12\. Risks and Mitigations

  ----------------------------------- ------------ ---------------------------------------------------------------------------------------------------------------------------------------
  **Risk**                            **Impact**   **Mitigation**

  Solo founder bottleneck             High         Leverage Supabase + React for rapid development. Phase 1 only. Hire for Phase 2.

  Vendor adoption resistance          High         Free tier with immediate value. Onboarding in-person at vendor shops. Show ROI: fewer calls, faster intake, professional receipts.

  WhatsApp API costs at scale         Medium       \~\$0.005--\$0.01 per message. At 100K messages/month = \$500--1000. Covered by subscription revenue.

  WhatsApp Business API approval      Medium       Apply early through the company-owned Meta Business Manager / WhatsApp Business Account. Use the dedicated CarryMatch logistics number. Have fallback email ready.

  Trust with informal operators       Medium       Start with community referrals. Show product in-person. Offer free migration from paper to digital.

  Supabase free tier limits           Medium       Start on Supabase Pro (\$25/mo). Monitor connection limits, storage, and edge function invocations. Scale plan as vendor count grows.

  Regulatory (customs/cross-border)   Low          CarryMatch is a SaaS tool, not a freight company. Vendors handle their own customs compliance. Add declared value for documentation.
  ----------------------------------- ------------ ---------------------------------------------------------------------------------------------------------------------------------------

13\. Appendix

13.1 App Details

**App URL:** https://mycarrymatch.com

**Frontend:** React (Vite) + Tailwind CSS

**Backend:** Supabase (PostgreSQL + Edge Functions + Storage)

**Current Status:** UAT / Pre-Launch (migrating from Base44 to standalone React + Supabase)

**Founder:** Solo founder

13.2 Glossary

  -------------------- ----------------------------------------------------------------------------------------
  **Term**             **Definition**

  CML                  CarryMatch Logistics --- the vendor operations module

  Micro-consolidator   Small operator who buys airline luggage or container space and resells per-kg shipping

  Corridor             A shipping route between two regions (e.g. US → Cameroon, UK → Nigeria)

  Batch                A group of shipments traveling together on the same trip/flight

  RLS                  Row Level Security --- Supabase database-level access control

  Meta Cloud API       Direct WhatsApp integration path used in Phase 1 CML

  WISMO                Where Is My Order --- customer inquiry about shipment status

  P2P                  Peer-to-peer delivery via individual travelers

  PRO                  Paid subscription tier (\$49/month)

  KYC                  Know Your Customer --- identity verification for travelers

  UAT                  User Acceptance Testing
  -------------------- ----------------------------------------------------------------------------------------

13.3 Priority Corridors (Phase 1 Launch, Not Exclusive)

CarryMatch works on any corridor globally --- international AND domestic. These are initial priority corridors based on founder's market knowledge, but the platform imposes no restrictions.

International Diaspora Corridors:

  --------------------------------- -------------------------------------- ------------------------------ --------------
  **Origin**                        **Destination**                        **Community**                  **Priority**

  US (DMV, NYC, Houston, Atlanta)   Cameroon (Douala, Yaoundé)             Cameroonian diaspora           Highest

  US (NYC, Atlanta, Houston)        Nigeria (Lagos, Abuja)                 Nigerian diaspora              High

  US (NYC, DMV)                     Ghana (Accra)                          Ghanaian diaspora              High

  UK (London)                       Nigeria, Ghana                         West African diaspora          High

  France (Paris)                    Cameroon, Senegal, Côte d'Ivoire       Francophone African diaspora   Medium

  US (Miami, NYC)                   Haiti, Jamaica, Trinidad               Caribbean diaspora             Medium

  US (NYC, Miami, Houston)          Colombia, Dominican Republic, Brazil   Latin American diaspora        Medium

  UK/Canada                         Pakistan, India, Bangladesh            South Asian diaspora           Future
  --------------------------------- -------------------------------------- ------------------------------ --------------

Domestic / In-Country Corridors (Bus Agency Parcel Services):

  --------------------- ------------------------------------------------------------------------- ------------------------------------------------
  **Country**           **Routes**                                                                **Operators**

  Nigeria               Lagos → Abuja, Lagos → Port Harcourt, Abuja → Kano, Enugu → Lagos         ABC Transport, GIG, Peace Mass Transit, Chisco

  Cameroon              Douala → Yaoundé, Douala → Bafoussam, Bamenda → Buea, Yaoundé → Bertoua   Touristique Express, Vatican Express, Musango

  Ghana                 Accra → Kumasi, Accra → Tamale, Kumasi → Takoradi                         VIP, STC, VVIP, OA Travel

  Kenya                 Nairobi → Mombasa, Nairobi → Kisumu, Nairobi → Nakuru                     Easy Coach, Modern Coast, Mash East Africa

  Rwanda                Kigali → Butare, Kigali → Gisenyi, Kigali → Huye                          Volcano Express, Virunga Express

  Cross-border Africa   Douala → Lagos, Accra → Lomé, Nairobi → Kampala, Kigali → Bujumbura       Various intercity operators

  Latin America         Guatemala City → San Salvador, Bogotá → Medellín, Lima → Cusco            Pullman, Cruz del Sur, Tica Bus
  --------------------- ------------------------------------------------------------------------- ------------------------------------------------

  ------------------------------ ---------------------------------------------------------------------
                                 

  Any origin → Any destination   Any vendor, any corridor, any mode. The platform is route-agnostic.
  ------------------------------ ---------------------------------------------------------------------
