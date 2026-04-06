# CarryMatch Rebuild Scope V1

## 1. What CarryMatch is

CarryMatch is a logistics and transport platform.

It helps people and businesses move items in different ways:

- travelers can post trips
- customers can post shipment requests
- the system can help match travelers with shipment requests
- bus operators can manage routes, vehicles, branches, trips, tickets, and boarding
- vendors can manage parcel intake, manifests, and shipment tracking
- staff and admins can manage operations behind the scenes

For the rebuild, Base44 is reference only. It helps us understand the old system, but it is not the product foundation anymore.

## 2. Who the users are

The main user groups are:

- travelers posting trips
- customers posting shipment requests
- senders and recipients tracking deliveries
- bus passengers booking and managing tickets
- bus operators managing transport operations
- branch staff and boarding staff
- logistics vendors handling parcels and manifests
- admins and operations staff managing the platform

## 3. Main product areas

The main product areas are:

- traveler trip posting
- shipment request posting
- matching between trips and shipment requests
- bus operator setup and management
- bus routes, vehicles, branches, and trips
- bus booking, ticketing, and boarding
- vendor logistics and parcel intake
- manifests and shipment tracking
- admin, operations, and staff tools

## 4. MVP for version 1

Version 1 should focus on the smallest complete product that is still useful and real.

The MVP should include:

- user accounts and sign-in
- traveler trip posting
- shipment request posting
- basic matching between trips and shipment requests
- bus operator accounts
- bus routes, vehicles, branches, and trip setup
- bus ticket booking
- ticket confirmation
- basic boarding and check-in
- parcel intake for vendor/logistics flows
- manifest generation
- shipment status tracking
- basic admin and staff management tools

The MVP should be usable, understandable, and operational.

## 5. What is NOT in MVP

Version 1 should not try to include everything.

These items should stay out unless they are proven essential:

- advanced automation everywhere
- complicated analytics dashboards
- every edge case from the old system
- every old workflow copied exactly
- large redesign experiments during backend setup
- low-value legacy features that add confusion

The goal is to launch a clean product, not a perfect copy of the old one.

## 6. Rebuild order by phase

### Phase 1: Define the product properly

Decide what the new CarryMatch should include, what should be simplified, and what should be removed.

### Phase 2: Design the new architecture

Plan the new backend, database, auth, frontend structure, and major product flows.

### Phase 3: Build the foundation

Set up the new app-owned backend, frontend structure, database, auth, and server logic.

### Phase 4: Build the core user flows

Start with the most important user-facing flows:

- sign-in
- trip posting
- shipment request posting
- matching

### Phase 5: Build the bus operations area

Add:

- operator setup
- branches
- routes
- vehicles
- trips
- booking
- tickets
- boarding

### Phase 6: Build vendor logistics flows

Add:

- parcel intake
- manifests
- shipment tracking

### Phase 7: Build admin and staff tools

Add the tools needed to run the platform safely and efficiently.

## 7. Questions we still need to answer before design

Before design starts, we still need clear answers to questions like:

- Which user type matters most for version 1?
- What is the single most important business flow to get right first?
- Should CarryMatch feel like one product with several modules, or several products under one brand?
- Which old features are truly essential, and which were just added over time?
- What should the matching flow do in version 1: simple matching, manual review, or both?
- How much of the bus product needs to be in version 1 to be commercially useful?
- How much of the vendor logistics side needs to be in version 1 to be operationally useful?
- Which staff/admin tools are truly required on day one?
- What reports or manifests are mandatory for real operations?
- What should be postponed until after the first stable release?

These answers should guide the rebuild before heavy coding starts.
