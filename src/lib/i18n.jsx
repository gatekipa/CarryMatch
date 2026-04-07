import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const I18nContext = createContext(null);

const STORAGE_KEY = "carrymatch-cml-language";

const translations = {
  en: {
    app: { brand: "CarryMatch CML", tagline: "Vendor logistics launch-core" },
    nav: {
      landing: "Home",
      pricing: "Pricing",
      apply: "Apply",
      dashboard: "Dashboard",
      shipments: "Shipments",
      newShipment: "New shipment",
      scanUpdate: "Scan / Update",
      batches: "Batches",
      customers: "Customers",
      notificationLog: "Notification log",
      notificationSettings: "Notification settings",
      companyProfile: "Company profile",
      branches: "Branches",
      subscription: "Subscription",
      admin: "Admin",
      login: "Log in",
      signup: "Sign up",
      logout: "Log out",
      menu: "Menu",
    },
    common: {
      loading: "Loading",
      loadingShort: "Loading...",
      loadingMessage: "Checking your session and access state.",
      retry: "Retry",
      backHome: "Back to home",
      backToDashboard: "Back to dashboard",
      viewPricing: "View pricing",
      createAccount: "Create account",
      signIn: "Sign in",
      signOut: "Sign out",
      continue: "Continue",
      submit: "Submit",
      save: "Save",
      saving: "Saving...",
      notAvailableYet: "Not available yet",
      environmentWarning: "Supabase auth is not configured yet for this environment.",
      accessRoutingNote:
        "Access routing now checks app-owned onboarding records first and only falls back when those records are not available yet.",
      deferredDataTitle: "Deferred workflow",
      deferredDataDescription:
        "This screen is wired into the rebuild path, but the later operational workflows still stay out of scope for now.",
      language: "Language",
      english: "EN",
      french: "FR",
      sessionDetails: "Session details",
      email: "Email",
      password: "Password",
      fullName: "Full name",
      companyName: "Company name",
      phone: "Phone number",
      whatsAppNumber: "WhatsApp number",
      businessType: "Business type",
      monthlyVolume: "Estimated monthly volume",
      corridors: "Primary corridors",
      officeAddresses: "Office addresses",
      notes: "Notes",
      status: "Status",
      reason: "Reason",
      submittedAt: "Submitted",
      preferredLanguage: "Preferred language",
      defaultOriginCountry: "Default origin country",
      defaultOriginCity: "Default origin city",
      destinationBranches: "Destination branches",
      accountEmail: "Account email",
      plan: "Plan",
    },
    phone: {
      countryPlaceholder: "Select country",
      numberPlaceholder: "National number",
      callingCode: "Calling code:",
      savedAs: "Saved as:",
      requiredError: "Enter a valid phone number.",
      optionalError: "Enter a valid WhatsApp number or leave it blank.",
    },
    customerUpdates: {
      statusLabels: {
        shipment_created: "Parcel received",
        batch_shipped: "In transit",
        batch_arrived: "Arrived at destination branch",
        ready_for_pickup: "Ready for pickup",
        delayed: "Delayed",
        customs_hold: "Delayed at customs",
        out_for_last_mile_delivery: "Out for local delivery",
        collected: "Collected",
        returned: "Returned",
        cancelled: "Cancelled",
        processing_update: "Shipment update",
      },
      eventLabels: {
        shipment_created: {
          public: "Parcel received",
          sender: "Shipment created",
          receiver: "Parcel received",
        },
        batch_shipped: "In transit",
        batch_arrived: "Arrived at destination branch",
        ready_for_pickup: "Ready for pickup",
        delayed: "Delayed",
        customs_hold: "Delayed at customs",
        out_for_last_mile_delivery: "Out for local delivery",
        collected: "Collected",
        eta_updated: "Estimated arrival updated",
        processing_update: "Shipment update",
      },
    },
    accessState: {
      public: "Public",
      no_vendor_record: "No vendor record",
      application_pending: "Application pending",
      application_rejected: "Application rejected",
      setup_required: "Setup required",
      active_vendor: "Active vendor",
      suspended_vendor: "Suspended vendor",
    },
    errors: {
      title: "Something needs attention",
      signUpFailed: "We could not create your account.",
      signInFailed: "We could not sign you in.",
      missingConfig:
        "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set before Supabase auth can work.",
      profileWarning:
        "We could not read the full app-owned access records, so routing is using the best available fallback.",
      applicationLoadFailed: "We could not load the application record right now.",
      applicationSubmitFailed: "We could not save your application.",
      applicationAlreadyExists: "An application already exists for this account.",
      setupLoadFailed: "We could not load your setup state right now.",
      setupSaveFailed: "We could not save your setup details.",
      vendorProfileSaveFailed: "We could not save your company profile changes.",
      branchSaveFailed: "We could not save your branch changes.",
      shipmentLookupFailed: "We could not look up the customer right now.",
      shipmentBranchLoadFailed: "We could not load the destination branches right now.",
      shipmentSaveFailed: "We could not save the shipment right now.",
      shipmentDetailLoadFailed: "We could not load the shipment detail right now.",
      publicTrackingLoadFailed: "We could not load the public tracking record right now.",
      batchLoadFailed: "We could not load the batch records right now.",
      batchSaveFailed: "We could not save the batch details right now.",
      batchStatusFailed: "We could not update the batch status right now.",
      batchAssignmentFailed: "We could not update the shipment assignment right now.",
      shipmentCollectionFailed: "We could not mark the shipment as collected right now.",
      paymentUpdateFailed: "We could not save the payment update right now.",
      scanLookupFailed: "We could not find that shipment right now.",
      scanQuickUpdateFailed: "We could not save that quick shipment update right now.",
      notificationLogLoadFailed: "We could not load the notification log right now.",
      notificationSettingsSaveFailed: "We could not save the notification settings right now.",
      labelGenerationFailed: "We could not generate the shipping label right now.",
      setupRequiresApprovedApplication:
        "Your application must be approved before this setup flow can continue.",
      vendorPrefixInUse: "That vendor prefix is already in use.",
    },
    landing: {
      eyebrow: "Phase 1 CML",
      title: "App shell and access control, rebuilt on app-owned foundations.",
      description:
        "This first launch-core coding path wires Supabase auth, real onboarding records, routing, and EN/FR support without turning on shipment operations yet.",
      primaryCta: "Get started",
      secondaryCta: "See pricing",
      card1Title: "Public entry",
      card1Body: "Landing, pricing, sign up, and login are live as the new entry shell.",
      card2Title: "Access-state gating",
      card2Body:
        "Users are routed to apply, application status, setup, or dashboard from real app-owned onboarding records.",
      card3Title: "Bilingual foundation",
      card3Body: "EN/FR switching is visible now and ready to expand across later screens.",
    },
    pricing: {
      title: "Launch pricing",
      description: "Phase 1 CML launch is locked to Free and Pro only.",
      freeTitle: "Free",
      freePrice: "$0",
      freeFeatureOne: "Up to 50 shipments per month",
      freeFeatureTwo: "Core onboarding and tracking foundation",
      freeFeatureThree: "CarryMatch-branded public tracking",
      proTitle: "Pro",
      proPrice: "$49/mo",
      proFeatureOne: "Unlimited shipments",
      proFeatureTwo: "Team access and branded labels",
      proFeatureThree: "Expanded settings and media support",
      footer:
        "Billing, coupon activation, and feature enforcement stay outside this coding slice.",
    },
    signup: {
      title: "Create your partner account",
      description:
        "This slice wires Supabase email/password sign up and hands the user into the launch-core access flow.",
      submit: "Create account",
      successTitle: "Account created",
      successBody:
        "If email confirmation is enabled in Supabase, finish that step first. After sign-in, routing will send you to the correct CML launch-core screen.",
      existingAccount: "Already have an account?",
      signInLink: "Log in",
    },
    login: {
      title: "Log in to CarryMatch CML",
      description:
        "This slice wires real Supabase sign in and resolves your launch-core access state after login.",
      submit: "Log in",
      createAccountPrompt: "Need an account first?",
      createAccountLink: "Sign up",
    },
    apply: {
      title: "Partner application",
      description:
        "Signed-in users without a vendor record can submit their Phase 1 CML partner application here.",
      signInPrompt:
        "Create an account or log in first to submit your partner application in the rebuild path.",
      accountRequiredCta: "Go to sign up",
      formTitle: "Application details",
      helper:
        "This saves the real launch-core application record. Approval still happens later outside this slice.",
      businessTypePlaceholder: "Select a business type",
      businessTypeRequired: "Select a business type.",
      otherBusinessTypeLabel: "Please specify",
      otherBusinessTypeRequired: "Please specify the business type.",
      monthlyVolumePlaceholder: "For example: 250",
      monthlyVolumeHelp: "Enter an estimated number of shipments or parcels per month using digits only.",
      corridorsHelp: "Add one main corridor per line so review can read it quickly.",
      corridorsHint: "One corridor per line, for example: Douala to Yaounde",
      officeAddressesHelp: "Add one office location per line. Include city or neighborhood when useful.",
      officeAddressesHint: "One office address per line.",
      submit: "Submit application",
      resubmit: "Resubmit application",
      successTitle: "Application submitted",
      successBody: "Your application was saved and is now waiting for review.",
      resubmitSuccessBody:
        "Your updated application was resubmitted and is now waiting for review again.",
      existingApplicationTitle: "Application already on file",
      existingApplicationBody:
        "This account already has an application record. Open the status screen to see the current review state.",
      existingApplicationCta: "View application status",
      rejectedApplicationTitle: "Update and resubmit this application",
      rejectedApplicationBody:
        "This application was rejected earlier. You can correct the details below and submit it again for review.",
      businessTypeOptions: {
        "Airline Luggage Consolidator": "Airline Luggage Consolidator",
        "Container / Barrel Shipper": "Container / Barrel Shipper",
        "Bus Agency Parcels": "Bus Agency Parcels",
        Other: "Other",
      },
    },
    applicationStatus: {
      title: "Application status",
      description:
        "This page reads your real application and vendor state from Supabase and keeps dashboard access gated until you are ready.",
      pendingTitle: "Your application is under review",
      pendingBody: "You cannot access the vendor dashboard yet.",
      rejectedTitle: "Your application was not approved",
      rejectedBody: "Dashboard access stays blocked until this application is reviewed again.",
      suspendedTitle: "Your vendor account is suspended",
      suspendedBody: "Dashboard access is blocked while this account remains suspended.",
      defaultTitle: "Status unavailable",
      defaultBody: "We could not match this account to a current application or vendor state.",
      detailsTitle: "Application details",
      nextStepsTitle: "What happens next",
      pendingNextStep:
        "An admin review still happens outside this slice. Once your application is approved, routing will send you to setup.",
      rejectedNextStep:
        "You can update the application details and resubmit from this screen when you are ready.",
      suspendedNextStep:
        "Suspension review is intentionally not built in this slice, so this screen only explains the current state.",
      defaultNextStep: "If this looks wrong, refresh your session after the underlying record is corrected.",
      noApplicationTitle: "No application found",
      noApplicationBody: "This account does not have a saved application yet.",
      reapplyCta: "Update and resubmit application",
    },
    setup: {
      title: "First-login setup wizard",
      description:
        "Approved vendors complete the minimum launch-core setup here before they enter the dashboard.",
      sectionOne: "Vendor identity",
      sectionOneHelp:
        "Set the business name and 3-letter tracking prefix that will identify this vendor in launch-core records.",
      sectionTwo: "Main origin office and pickup office setup",
      sectionTwoHelp:
        "Start with the main office your shipments usually leave from, then list the pickup or destination offices customers will use later.",
      sectionThree: "Default pricing, insurance, and plan",
      sectionThreeHelp:
        "Choose your starting defaults here. You can still adjust price, fees, and insurance later during shipment intake.",
      companyName: "Company name",
      companyNameHelp:
        "This starts with the approved application name when available, but you can adjust it before saving if the operating name should differ.",
      vendorPrefix: "Vendor prefix",
      vendorPrefixHelp:
        "Use exactly 3 letters. This prefix appears in tracking numbers, for example CML.",
      vendorPrefixError: "Enter exactly 3 letters for the vendor prefix.",
      defaultOriginCountry: "Main / origin office country",
      defaultOriginCountryPlaceholder: "Select the main office country",
      defaultOriginCountryHelp:
        "Choose the country for your main or origin office so the setup stores a clean filterable location value.",
      defaultOriginCountryError: "Select the country for the main / origin office.",
      defaultOriginCity: "Main / origin office city",
      defaultOriginCityHelp: "Enter the city for the office where most shipments begin.",
      destinationBranches: "Pickup / destination offices",
      destinationBranchesHelp:
        "Add each pickup office with a clear office name, country, city, and address so customers and staff can identify the right destination later. Example: Yaounde Pickup Office, CM, Yaounde, Mvan near Total station.",
      destinationBranchesHint:
        "Add each office separately with a name, country, city, and address.",
      destinationOfficesEmpty:
        "No pickup office has been added yet. Add at least one pickup / destination office before you complete setup.",
      destinationOfficesRequired: "Add at least one pickup / destination office before completing setup.",
      destinationOfficeCard: "Pickup office",
      destinationOfficeAdd: "Add office",
      destinationOfficeRemove: "Remove",
      destinationOfficeName: "Office name",
      destinationOfficeNamePlaceholder: "For example: Yaounde Pickup Office",
      destinationOfficeNameHelp:
        "Use the name staff and customers will recognize later when they choose or confirm a pickup office.",
      destinationOfficeNameError: "Enter the office name for this pickup / destination office.",
      destinationOfficeCountry: "Country",
      destinationOfficeCountryPlaceholder: "Select the pickup office country",
      destinationOfficeCountryHelp:
        "Choose the country where this pickup office operates so destination selection can stay clean later.",
      destinationOfficeCountryError:
        "Select the country for this pickup / destination office.",
      destinationOfficeCity: "City",
      destinationOfficeCityPlaceholder: "For example: Yaounde",
      destinationOfficeCityHelp:
        "Enter the city for this pickup office so shipment intake can prefill destination city more reliably later.",
      destinationOfficeCityError:
        "Enter the city for this pickup / destination office.",
      destinationOfficeAddress: "Address",
      destinationOfficeAddressPlaceholder: "For example: Mvan, near Total station",
      destinationOfficeAddressHelp:
        "Add the address or location details customers will need to find this office.",
      destinationOfficeAddressError:
        "Enter the address for this pickup / destination office.",
      pricingModel: "Default pricing method",
      pricingModelHelp:
        "Choose the default method you want to start from. You can still change the actual shipment price or add fees later during intake.",
      insuranceModel: "Default insurance method",
      insuranceModelHelp:
        "Choose the default insurance approach you want to start from. You can still adjust declared value or insurance per shipment later.",
      planChoice: "Launch plan",
      pricingPerKg: "Default per kilogram",
      pricingFlatFee: "Default flat fee",
      pricingManual: "Default manual pricing",
      insurancePercentage: "Default percentage insurance",
      insuranceFlat: "Default flat insurance amount",
      planFree: "Free",
      planPro: "Pro",
      defaultsNoticeTitle: "These are only launch defaults",
      defaultsNoticeBody:
        "You are choosing how pricing and insurance should start by default. Your team can still adjust price, extra fees, and insurance later during shipment intake.",
      submit: "Complete setup",
      successTitle: "Setup completed",
      successBody: "Your vendor records were saved and this account is now active.",
      approvedNoticeTitle: "Approved and ready for setup",
      approvedNoticeBody:
        "This setup flow writes the minimal vendor, owner, and branch records needed for launch-core access.",
    },
    dashboard: {
      title: "Vendor dashboard",
      description:
        "This is the launch-core dashboard shell for active vendors. Shipment, batch, billing, and notification work stays out of this slice.",
      activeVendorLabel: "Active business",
      statOne: "Access state",
      statTwo: "Language",
      statThree: "Session",
      shipmentIntakeTitle: "New shipment intake",
      shipmentIntakeBody:
        "Start a real shipment from here with vendor-scoped customer lookup and a generated tracking number.",
      startNewShipment: "Start new shipment",
      scanUpdateTitle: "Scan / Update",
      scanUpdateBody:
        "Retrieve a shipment fast by tracking number or QR and use one safe quick action from the result card.",
      openScanUpdate: "Open Scan / Update",
      batchManagementTitle: "Batch management",
      batchManagementBody:
        "Group pending shipments into operational batches and move the first core batch states forward here.",
      manageBatches: "Manage batches",
      businessManagementTitle: "Business settings",
      businessManagementBody:
        "Manage your existing business details here without re-running onboarding.",
      manageCompanyProfile: "Manage company profile",
      manageBranches: "Manage branches",
      notificationLogTitle: "Notifications",
      notificationLogBody:
        "Review the real notification events the platform is recording and set the first vendor-level notification defaults here.",
      viewNotificationLog: "View notification log",
      manageNotificationSettings: "Notification settings",
      nextStepsTitle: "Next slices",
      nextStepOne: "Admin approval workflow",
      nextStepTwo: "Shipment and batch modules",
      nextStepThree: "Payments, labels, and notifications",
      todoTitle: "Intentional TODOs",
      todoBody:
        "Dashboard metrics and operational widgets are intentionally deferred until the next feature slices begin.",
    },
    vendorSettings: {
      title: "Vendor settings / company profile",
      description:
        "Active vendors can update the core business details and pricing defaults already saved during onboarding.",
      cardTitle: "Company profile",
      cardDescription:
        "Keep your business name, tracking prefix, main origin office details, and pricing defaults up to date.",
      companyNameHelp:
        "Update the operating business name that should appear across the active vendor record.",
      companyNameError: "Enter the company name before saving.",
      defaultOriginCityError: "Enter the main / origin office city before saving.",
      pricingDefaultsTitle: "Default pricing for intake",
      pricingDefaultsDescription:
        "Set the starting pricing rule and currency you want intake to use automatically. Staff can still override the shipment price later when needed.",
      pricingModel: "Pricing model",
      pricingModelHelp:
        "Choose how intake should start pricing new shipments by default.",
      pricingModelError: "Select the default pricing model before saving.",
      pricingModelOptions: {
        per_kg: "Per kilogram",
        flat_fee: "Flat fee per item",
        manual: "Manual",
      },
      defaultCurrency: "Default currency",
      defaultCurrencyHelp:
        "Choose the vendor's default pricing currency. CarryMatch saves only the clean 3-letter currency code.",
      defaultCurrencyError: "Enter a valid 3-letter currency code.",
      currencyOptions: {
        USD: "USD - US Dollar",
        XAF: "XAF - Central African CFA franc (FCFA)",
        NGN: "NGN - Nigerian Naira",
        GHS: "GHS - Ghanaian Cedi",
        EUR: "EUR - Euro",
        GBP: "GBP - British Pound",
      },
      ratePerKg: "Rate per kilogram",
      ratePerKgPlaceholder: "For example: 20",
      ratePerKgHelp:
        "Required only when the pricing model is per kilogram. Intake will calculate base price as weight × rate.",
      ratePerKgError: "Enter a valid rate per kilogram greater than zero.",
      flatFeePerItem: "Flat fee per item",
      flatFeePerItemPlaceholder: "For example: 25",
      flatFeePerItemHelp:
        "Required only when the pricing model is flat fee. Intake will calculate base price as quantity × flat fee.",
      flatFeePerItemError: "Enter a valid flat fee per item greater than zero.",
      noVendorTitle: "Vendor record not available",
      noVendorBody:
        "We could not find the active vendor record needed for business settings.",
      submit: "Save company profile",
      successTitle: "Company profile updated",
      successBody: "Your active vendor record was updated successfully.",
    },
    branchManagement: {
      title: "Branch management",
      description:
        "Manage the pickup / destination offices your active business uses after onboarding, including the country and city for each branch.",
      helperTitle: "Existing business offices",
      helperBody:
        "This page edits the real vendor branch records already linked to the active business so each office has a usable country, city, and address.",
      actionsHelp:
        "Add, edit, or remove pickup / destination offices, then save when the list looks right.",
      addBranch: "Add branch",
      addFirstBranch: "Add first branch",
      removeBranch: "Remove",
      save: "Save branches",
      emptyTitle: "No branches yet",
      emptyBody:
        "This active vendor does not have any saved pickup / destination offices yet.",
      branchCard: "Branch",
      branchCardHelp: "Keep the office name and address clear for later operations.",
      officeNameHelp:
        "Use the office name customers and staff will recognize later.",
      officeNameError: "Enter the office name for this branch.",
      country: "Country",
      countryPlaceholder: "Select branch country",
      countryHelp:
        "Choose the country for this office so the branch can be filtered and grouped correctly later.",
      countryError: "Select the country for this branch.",
      city: "City",
      cityPlaceholder: "For example: Yaounde",
      cityHelp:
        "Enter the city for this office so destination selection can prefill city more reliably later.",
      cityError: "Enter the city for this branch.",
      addressHelp:
        "Add the address or location details customers will need to find this branch.",
      addressError: "Enter the address for this branch.",
      noVendorTitle: "Vendor record not available",
      noVendorBody:
        "We could not find the active vendor record needed for branch management.",
      minOneBranchError:
        "Keep at least one saved pickup / destination branch so shipment intake does not lose its real destination branch options.",
      successTitle: "Branches updated",
      successBody: "Your branch list was saved successfully.",
    },
    notifications: {
      openLog: "Open notification log",
      openSettings: "Notification settings",
      noVendorTitle: "Vendor record not available",
      noVendorBody:
        "We could not find the active vendor record needed for notification visibility and settings.",
      logTitle: "Notification log",
      logDescription:
        "Review the real notification event records already being generated for this vendor before delivery sending goes live.",
      logCardTitle: "Recorded notification events",
      logCardDescription:
        "This log shows the vendor-scoped notification records currently being captured from shipment and batch activity.",
      loadingBody: "Loading the recorded notification events for this vendor.",
      emptyTitle: "No notification events yet",
      emptyBody:
        "Notification records will appear here once shipment and batch actions trigger real events.",
      createdAt: "Created",
      recipientRole: "Recipient role",
      recipientRoleOptions: {
        sender: "Sender",
        receiver: "Receiver",
      },
      recipientName: "Recipient name",
      recipientContact: "Recipient contact",
      shipmentReference: "Shipment reference",
      batchReference: "Batch reference",
      plannedChannel: "Planned channel",
      plannedChannelOptions: {
        whatsapp: "WhatsApp",
        email: "Email",
      },
      deliveryStatus: "Delivery status",
      deliveryStatusOptions: {
        recorded: "Recorded",
        queued: "Queued",
        sent: "Sent",
        delivered: "Delivered",
        read: "Read",
        failed: "Failed",
        skipped: "Skipped",
      },
      settingsTitle: "Notification settings",
      settingsDescription:
        "Set the first vendor-level notification defaults here while real event recording continues underneath for later delivery integration.",
      settingsCardTitle: "Notification defaults",
      settingsCardDescription:
        "Save the minimum vendor-level notification choices now so later sending can reuse the same foundation cleanly.",
      notificationsEnabled: "Notifications enabled",
      notificationsEnabledHelp:
        "This is the vendor-level sending toggle for the future delivery layer. Internal event recording still continues so your log stays complete.",
      defaultPlannedChannel: "Default planned channel",
      defaultPlannedChannelHelp:
        "Choose which channel future delivery should prefer by default when both contact paths exist.",
      recordingNoticeTitle: "Internal event capture is already live",
      recordingNoticeBody:
        "CarryMatch is already recording structured notification events from real shipment and batch actions. This page saves the vendor-level defaults that future Meta and email sending can use later.",
      metaPlaceholderTitle: "Meta Cloud API direct placeholder",
      metaPlaceholderBody:
        "Company-owned Meta Business Manager, WABA, number, templates, and delivery wiring stay for a later slice. This page only prepares the vendor-facing foundation.",
      emailPlaceholderTitle: "Email fallback placeholder",
      emailPlaceholderBody:
        "Fallback provider connection and template rules stay for a later slice. This page only stores the vendor-level default channel choice.",
      saveButton: "Save notification settings",
      saveSuccess: "Your notification settings were saved successfully.",
      notAvailable: "Not available",
    },
    shippingLabel: {
      title: "Shipping label",
      sender: "Sender",
      receiver: "Receiver",
      destinationBranch: "Destination branch",
      destination: "Destination",
      shippingMode: "Shipping mode",
      weight: "Weight",
      contents: "Contents",
      paymentStatus: "Payment status",
      scanToTrack: "Scan or open this tracking link",
      companyFallback: "CarryMatch vendor",
      notAvailable: "Not available",
      loadingPreview: "Preparing your shipping label...",
      preparingAction: "Preparing label...",
    },
    scanUpdate: {
      title: "Scan / Update",
      description:
        "Open a real shipment quickly by tracking number or QR so front-desk and ops staff can move faster.",
      noVendorTitle: "Active vendor record not available",
      noVendorBody:
        "We could not find the active vendor record needed for scan and update.",
      successTitle: "Scan / update action completed",
      trackingLabel: "Tracking number",
      trackingPlaceholder: "Enter or scan the tracking number",
      trackingHelp:
        "You can enter the tracking number directly or paste the public tracking URL from the QR label.",
      trackingRequired: "Enter or scan a tracking number first.",
      lookupTitle: "Find a shipment fast",
      lookupDescription:
        "Use manual entry first, then scan a QR code when the browser and device camera support it cleanly.",
      lookupAction: "Find shipment",
      normalizeAction: "Clean tracking value",
      scannerTitle: "QR scanner",
      scannerDescription:
        "Use the device camera to scan the shipment QR code when browser support is available. Manual tracking entry always stays available.",
      scannerUnavailableTitle: "Scanner not available here",
      scannerUnavailableBody:
        "This browser or device does not expose native QR scanning cleanly yet, so use manual tracking lookup on this page for now.",
      scannerErrorTitle: "Scanner needs attention",
      scannerStartFailed:
        "We could not start the camera scanner. Check camera permissions and try again.",
      scannerReadFailed:
        "We could not read a valid QR code from the camera feed right now.",
      scanInvalidResult:
        "The scanned QR result did not contain a usable tracking value.",
      startScanner: "Start QR scanner",
      stopScanner: "Stop scanner",
      resultTitle: "Shipment result",
      resultDescription:
        "Once a shipment is found, this card gives the key operational facts plus a quick link to the full shipment detail.",
      emptyTitle: "No shipment opened yet",
      emptyBody:
        "Find a shipment by tracking number or QR and the operational result will appear here.",
      notFoundBody:
        "We could not find a shipment for that tracking number inside this active vendor account.",
      senderReceiver: "Sender / receiver",
      destinationBranch: "Destination branch",
      destinationBranchMissing: "No destination branch saved on this shipment",
      destination: "Destination",
      shippingMode: "Shipping mode",
      openShipmentDetail: "Open shipment detail",
      quickCollectAction: "Mark as collected",
      quickCollectSuccess: "The shipment was marked as collected successfully.",
      quickActionHelp:
        "Quick collect only appears when the shipment is already in pickup or last-mile stage. Use full shipment detail for broader updates.",
      notAvailable: "Not available",
    },
    batches: {
      listTitle: "Batch list",
      listDescription:
        "View, create, and open the operational batches your active business is using.",
      createBatch: "Create batch",
      createFirstBatch: "Create your first batch",
      summaryTitle: "Operational batches",
      summaryBody:
        "Keep batch creation and daily grouping moving from one place, then open each batch to assign shipments and update status.",
      summaryTotalBatches: "total batches",
      summaryEditableBatches: "open or locked",
      summaryGroupedShipments: "shipments grouped",
      summaryCreateHint:
        "Create a new batch when operations is ready to group pending shipments and set an ETA.",
      existingTitle: "Existing batches",
      existingDescription:
        "These are the real batches already saved for your active vendor record.",
      noVendorTitle: "Vendor record not available",
      noVendorBody:
        "We could not find the active vendor record needed for batch management.",
      emptyTitle: "No batches yet",
      emptyBody:
        "Create the first operational batch once you are ready to group pending shipments.",
      batchName: "Batch name",
      batchNamePlaceholder: "For example: Douala to Yaounde - April run",
      batchNameHelp:
        "Use a practical batch name your operations team will recognize later.",
      batchNameError: "Enter the batch name before saving.",
      eta: "ETA",
      etaHelp:
        "Optional. Add the expected arrival time only if you already know it.",
      etaDate: "ETA date",
      etaDateHelp: "Optional. Choose the expected arrival date for this batch.",
      etaDateError: "Add the ETA date if you want to save a time.",
      etaTime: "ETA time",
      etaTimeHelp: "Optional. Add the expected arrival time once the date is set.",
      etaTimeError: "Add the ETA time if you want to save an ETA date.",
      etaPreviewTitle: "ETA preview",
      etaPreviewEmpty: "No ETA has been set for this batch yet.",
      etaPropagationHelp:
        "This batch ETA becomes the main operational ETA shown on linked shipment detail and public tracking.",
      noEta: "No ETA set",
      shipmentCount: "Shipment count",
      createdDate: "Created",
      openBatch: "Open batch",
      backToList: "Back to batch list",
      createTitle: "Create batch",
      createDescription:
        "Start a new batch with a name and optional ETA, then add pending shipments after it is saved.",
      detailTitle: "Batch detail / management",
      detailDescription:
        "Manage one operational batch, assign pending shipments, and move the first core batch states forward.",
      batchDetailsTitle: "Batch details",
      batchDetailsDescription:
        "Keep the batch name and ETA clear so the rest of the team can understand this run.",
      createPanelTitle: "Create the batch first",
      createPanelBody:
        "Save the batch basics here first. Once the record exists, you can start assigning pending shipments right away.",
      createPanelNext:
        "This screen keeps the first batch setup lean: save the batch, review the ETA, then move into shipment assignment.",
      createPanelStepOne: "1. Save the batch name and optional ETA.",
      createPanelStepTwo: "2. Add pending shipments once the batch record exists.",
      createPanelStepThree: "3. Move the batch through status changes as operations progress.",
      saveCreateHint:
        "Create the batch record first. Shipment assignment and status changes open on the next screen.",
      saveEditHint:
        "Save any change to the batch name or ETA here, then use the status and shipment sections below to manage the run.",
      detailsLockedNotice:
        "This batch is locked. Reopen it first if you need to add a missed shipment, remove a shipment, or update the batch details.",
      detailsReadOnlyNotice:
        "This batch has already moved beyond the open stage, so batch details stay read-only here.",
      saveBatch: "Save batch details",
      successTitle: "Batch updated",
      saveSuccess: "The batch details were saved successfully.",
      statusSuccess: "The batch status was updated successfully.",
      reopenSuccess: "The batch was reopened and can be edited again.",
      addShipmentSuccess: "The shipment was added to the batch successfully.",
      removeShipmentSuccess: "The shipment was removed from the batch successfully.",
      notFoundTitle: "Batch not found",
      notFoundBody:
        "We could not find a saved batch for this vendor and route.",
      statusSectionTitle: "Batch status",
      statusSectionDescription:
        "Move the batch forward only through the next practical statuses for this slice.",
      statusActionsTitle: "Next available status actions",
      statusActionsDescription:
        "Use only the next status actions shown here so the batch stays aligned with the current operational flow.",
      receivingStageTitle: "Receiving-side controls",
      receivingStageDescriptions: {
        arrived:
          "This batch has reached the receiving side. Move it into pickup or last-mile stage once the branch is ready for the next handoff.",
        ready_for_pickup:
          "These shipments are now ready at the receiving branch. Mark each shipment as collected as customers pick up.",
        out_for_last_mile_delivery:
          "These shipments are already on the final local delivery leg. Mark each shipment as collected once handoff is complete.",
      },
      receivingSummaryTitle: "Receiving-stage summary",
      receivingSummaryDescription:
        "Use these counts to see what is waiting at the branch, what is already on last-mile handling, and what has already been collected.",
      delayEtaTitle: "Delay / customs ETA update",
      delayEtaDescription:
        "Delayed and customs-hold batches need a revised ETA before the new status is saved.",
      delayEtaDescriptions: {
        delayed:
          "This batch is delayed. Save the latest ETA here so linked shipments and public tracking both show the current estimate.",
        customs_hold:
          "This batch is in customs hold. Save the latest ETA here so linked shipments and public tracking both show the current estimate.",
      },
      delayEtaDateHelp:
        "Choose the revised arrival date that should become the active ETA for this batch.",
      delayEtaTimeHelp:
        "Choose the revised arrival time that should become the active ETA for this batch.",
      delayEtaDateError:
        "Add the revised ETA date if you want to save a revised ETA time.",
      delayEtaTimeError:
        "Add the revised ETA time if you want to save a revised ETA date.",
      delayEtaRequired:
        "Add the revised ETA date and time before saving this delay update.",
      delayEtaPreviewTitle: "Revised ETA preview",
      saveEtaAndChangePrefix: "Save ETA and change status to",
      updateEtaOnly: "Update ETA only",
      delayEtaUpdateSuccess: "The revised ETA was saved successfully.",
      delayStatusSuccess: "The batch status and revised ETA were saved successfully.",
      reopenTitle: "Need to reopen this batch?",
      reopenBody:
        "Use this only when a shipment was missed or a correction is needed before the batch progresses further. Reopening returns the batch to open so you can edit details and shipment assignment again.",
      reopenBatch: "Reopen batch",
      noFurtherStatusActions:
        "No further status changes are available for this batch in the current slice.",
      inBatchTitle: "Shipments already in this batch",
      inBatchDescription:
        "These shipments are already grouped into the current batch.",
      inBatchEmpty:
        "No shipments have been added to this batch yet. Add pending shipments from the panel on the right when you are ready.",
      availableShipmentsTitle: "Pending shipments available for assignment",
      availableShipmentsDescription:
        "Only pending shipments that are not already assigned to another batch appear here.",
      availableShipmentsEmpty:
        "There are no pending shipments available to add right now. Create more shipments first if this run still needs items.",
      assignmentLockedNotice:
        "Shipment assignment is only available while the batch is open. Reopen a locked batch first if you need to make corrections.",
      addShipment: "Add shipment",
      removeShipment: "Remove shipment",
      markCollected: "Mark as collected",
      markCollectedSuccess: "The shipment was marked as collected.",
      pickupManagementTitle: "Pickup / receiving shipment list",
      pickupManagementDescription:
        "Use this list to see what is waiting for pickup or onward delivery and mark each completed handoff as collected.",
      shipmentTracking: "Tracking",
      shipmentParties: "Sender / receiver",
      shipmentReceiver: "Receiver",
      shipmentSender: "Sender",
      shipmentDestination: "Destination",
      shipmentDestinationMissing: "Destination not set",
      shipmentDestinationBranch: "Destination branch",
      shipmentDestinationBranchMissing: "No linked branch",
      shipmentDestinationBranchLocationMissing: "No saved branch city yet",
      shipmentMode: "Mode",
      changeStatusPrefix: "Change status to",
      statusOptions: {
        open: "Open",
        locked: "Locked",
        shipped: "Shipped",
        delayed: "Delayed",
        customs_hold: "Customs hold",
        arrived: "Arrived",
        ready_for_pickup: "Ready for pickup",
        out_for_last_mile_delivery: "Out for last-mile delivery",
      },
      shipmentStatusOptions: {
        draft: "Draft",
        pending: "Pending",
        in_batch: "In batch",
        in_transit: "In transit",
        delayed: "Delayed",
        customs_hold: "Customs hold",
        arrived: "Arrived",
        ready_for_pickup: "Ready for pickup",
        out_for_last_mile_delivery: "Out for last-mile delivery",
        collected: "Collected",
        returned: "Returned",
        cancelled: "Cancelled",
      },
    },
    shipmentIntake: {
      title: "New shipment intake",
      description:
        "Create the first real shipment record for your active business with lean customer lookup and intake details.",
      noVendorTitle: "Active vendor record not available",
      noVendorBody:
        "We could not find the active vendor record needed to create a shipment.",
      lookupTitle: "Customer lookup",
      lookupDescription:
        "Search the active vendor customer list by sender phone before entering new sender details.",
      lookupAction: "Look up sender",
      lookupPhoneRequiredTitle: "Sender phone required",
      lookupPhoneRequiredBody:
        "Enter a valid sender phone number before running customer lookup.",
      lookupFoundTitle: "Customer found",
      lookupFoundBody: "Existing sender details loaded for",
      lookupNotFoundTitle: "Customer not found",
      lookupNotFoundBody:
        "No existing sender record matched this phone number. Continue entering sender details inline.",
      lookupErrorTitle: "Lookup could not finish",
      senderSection: "Sender details",
      senderSectionHelp:
        "If lookup does not find a customer, complete the sender details here and they will be saved in vendor scope.",
      senderPhone: "Sender phone",
      senderName: "Sender name",
      senderNameHelp: "Use the name the vendor team should see for this sender.",
      senderNameError: "Enter the sender name.",
      senderWhatsApp: "Sender WhatsApp number",
      senderEmail: "Sender email",
      senderEmailHelp: "Optional. Add an email only if the sender uses it.",
      receiverSection: "Receiver details",
      receiverSectionHelp:
        "Capture the basic receiver contact details for this shipment.",
      receiverPhone: "Receiver phone",
      receiverName: "Receiver name",
      receiverNameHelp: "Use the name the receiving branch should recognize.",
      receiverNameError: "Enter the receiver name.",
      receiverWhatsApp: "Receiver WhatsApp number",
      receiverEmail: "Receiver email",
      receiverEmailHelp: "Optional. Add an email only if the receiver uses it.",
      shipmentSection: "Shipment basics",
      shipmentSectionHelp:
        "Keep this first intake slice lean: route, shipping mode, contents, weight, quantity, and category.",
      originCountry: "Origin country",
      originCountryPlaceholder: "Select origin country",
      originCountryHelp:
        "This starts from the vendor default origin, but you can change it for this shipment.",
      originCountryError: "Select the origin country.",
      originCity: "Origin city",
      originCityHelp: "Enter the origin city for this shipment.",
      originCityError: "Enter the origin city.",
      destinationBranch: "Destination branch",
      destinationBranchPlaceholder: "Select a saved pickup / destination office",
      destinationBranchHelp:
        "Choose the real receiving branch this shipment is heading to. The saved branch country will fill automatically here.",
      destinationBranchError: "Select the destination branch for this shipment.",
      destinationBranchCountryError:
        "The selected branch is missing a saved country. Update that branch before creating this shipment.",
      destinationBranchLoadErrorTitle: "Destination branches could not load",
      destinationBranchEmptyTitle: "Add a destination branch first",
      destinationBranchEmptyBody:
        "This vendor does not have any saved pickup / destination branches yet, so intake cannot target a real receiving office.",
      destinationBranchEmptyCta: "Open branch management",
      destinationBranchSummary: "Selected destination branch",
      destinationBranchAddress: "Saved branch address",
      destinationBranchAddressMissing: "No saved branch address yet",
      destinationCountry: "Destination country",
      destinationCountryPlaceholder: "Select destination country",
      destinationCountryHelp: "Choose the country where this shipment is going.",
      destinationCountryError: "Select the destination country.",
      destinationCountryDerivedHelp:
        "This country is derived from the selected destination branch so the shipment stays tied to a real receiving office.",
      destinationCity: "Destination city",
      destinationCityHelp: "Enter the destination city for this shipment.",
      destinationCityAutoHelp:
        "This city was prefilled from the selected branch. You can still adjust it if this shipment needs a more precise destination.",
      destinationCityManualHelp:
        "Enter the destination city for this shipment. The selected branch does not have a saved city yet, so you can fill it here for now.",
      destinationCityError: "Enter the destination city.",
      shippingMode: "Shipping mode",
      shippingModeHelp: "Choose the mode the vendor will use for this shipment.",
      shippingModeError: "Select the shipping mode.",
      shippingModeOptions: {
        air: "Air",
        sea: "Sea",
        "road-bus": "Road / bus",
      },
      contentsDescription: "Contents description",
      contentsDescriptionPlaceholder: "For example: 2 phones and accessories",
      contentsDescriptionHelp:
        "Keep the description practical enough for intake and later operations.",
      contentsDescriptionError: "Enter the contents description.",
      weightKg: "Weight (kg)",
      weightKgPlaceholder: "For example: 4.5",
      weightKgHelp: "Use kilograms for this first shipment intake slice.",
      weightError: "Enter a valid shipment weight greater than zero.",
      quantity: "Quantity",
      quantityHelp: "Enter the number of parcels or items in this shipment.",
      quantityError: "Enter a valid quantity greater than zero.",
      category: "Category",
      categoryPlaceholder: "Select a shipment category",
      categoryHelp:
        "Use one of the platform categories for intake consistency. Choose Other only when the shipment does not fit the preset list.",
      categoryError: "Select the shipment category.",
      categoryOptions: {
        Documents: "Documents",
        Electronics: "Electronics",
        Clothing: "Clothing",
        Food: "Food",
        Fragile: "Fragile",
        Household: "Household",
        Medical: "Medical",
        Other: "Other",
      },
      categoryOther: "Other category",
      categoryOtherPlaceholder: "Specify the shipment category",
      categoryOtherHelp:
        "Add the category name you want staff to see when the shipment does not fit the preset list.",
      categoryOtherError: "Specify the shipment category.",
      pricingSection: "Pricing basics",
      pricingSectionHelp:
        "Use the vendor default pricing rule when it is available, then adjust the shipment price or add one discount if needed.",
      pricingDefaultLabel: "Vendor default pricing rule",
      pricingRulePerKg: "Per kilogram",
      pricingRuleFlatFee: "Flat fee per item",
      pricingRuleManual: "Manual pricing",
      pricingDefaultUnavailable: "Saved rate not available yet",
      perKgSuffix: " / kg",
      perItemSuffix: " / item",
      basePrice: "Base price",
      basePricePlaceholder: "For example: 15000",
      basePriceHelp: "Enter the agreed base price for this shipment.",
      basePriceManualHelp:
        "This vendor uses manual pricing by default, so enter the shipment base price directly.",
      basePriceMissingDefaultHelp:
        "This vendor default pricing method needs a saved rate before auto-calculation can run, so enter the base price manually for now.",
      basePriceAwaitingWeightHelp:
        "Enter the shipment weight to auto-calculate the base price from the vendor default per-kilogram rule.",
      basePriceAwaitingQuantityHelp:
        "Enter the shipment quantity to auto-calculate the base price from the vendor default flat-fee rule.",
      basePriceAutoPerKgHelp:
        "The base price is auto-calculated from the saved per-kilogram default, but you can still edit it for this shipment.",
      basePriceAutoFlatFeeHelp:
        "The base price is auto-calculated from the saved flat fee per item, but you can still edit it for this shipment.",
      basePriceOverrideHelp:
        "You overrode the default calculation for this shipment. The saved total below updates immediately.",
      basePriceError: "Enter a valid base price.",
      discountAmount: "Discount",
      discountAmountPlaceholder: "Optional discount amount",
      discountAmountHelp:
        "Optional. Enter one discount amount for this shipment and the total will update below.",
      discountAmountError: "Enter a valid discount amount.",
      discountAmountExceedsBaseError:
        "Discount cannot be greater than the base price.",
      paymentStatus: "Payment status",
      paymentStatusHelp:
        "Choose unpaid or fully paid at intake. Record partial payment later from shipment detail when the exact collected amount is known.",
      paymentStatusError: "Select the payment status.",
      paymentStatusOptions: {
        unpaid: "Unpaid",
        partial: "Partial",
        paid: "Paid",
      },
      pricingSummaryTitle: "Pricing summary",
      pricingSummaryHelp:
        "Review the current base price, discount, and total before creating the shipment.",
      summaryBasePrice: "Base price",
      summaryDiscount: "Discount",
      summaryTotal: "Total",
      referenceNote: "Reference / note",
      referenceNotePlaceholder: "Optional note or customer reference",
      referenceNoteHelp:
        "Optional. Add a short note or reference only if it helps this intake record.",
      submit: "Create shipment",
      reset: "Reset form",
      successTitle: "Shipment created",
      successBody:
        "The shipment record, customer records, pricing summary, and tracking number were saved successfully.",
      openShippingLabel: "Open shipping label",
      summaryTracking: "Tracking number",
      summaryRoute: "Route",
      summaryDestinationBranch: "Destination branch",
      summaryDestinationBranchFallback: "Saved on the shipment record",
      summaryParties: "Sender / receiver",
      summaryShipment: "Shipment summary",
      summaryWeightQuantity: "Weight / quantity",
      summaryPaymentStatus: "Payment status",
      createAnother: "Create another shipment",
      openShipmentDetail: "Open shipment detail",
    },
    shipmentDetail: {
      title: "Shipment detail",
      description:
        "Open one shipment and see the real operational record, current state, pricing, route, and status timeline in one place.",
      loadingBody: "Loading the shipment record and timeline.",
      successTitle: "Shipment action completed",
      openShippingLabel: "Open shipping label",
      noVendorTitle: "Active vendor record not available",
      noVendorBody:
        "We could not find the active vendor record needed to open shipment detail.",
      notFoundTitle: "Shipment not found",
      notFoundBody:
        "We could not find a saved shipment for this vendor and route.",
      currentStatus: "Current status",
      createdAt: "Created",
      eta: "Operational ETA",
      etaHelp: "When this shipment is linked to a batch, the batch ETA is the ETA used here.",
      etaEmpty: "No batch ETA available yet",
      linkedBatch: "Linked batch",
      noLinkedBatch: "Not linked to a batch yet",
      openLinkedBatch: "Open linked batch",
      removeFromBatch: "Remove from batch",
      removeFromBatchLocked:
        "This shipment can only be removed from the linked batch while that batch is still open.",
      senderSection: "Sender",
      receiverSection: "Receiver",
      routeSection: "Route and operations",
      routeSectionHelp:
        "Use this section to confirm where the shipment started, where it is going, and which operational branch it is tied to.",
      origin: "Origin",
      destination: "Destination",
      destinationBranch: "Destination branch",
      destinationBranchMissing: "No destination branch saved on this shipment",
      shippingMode: "Shipping mode",
      parcelSection: "Parcel details",
      parcelSectionHelp:
        "Keep the shipment contents, weight, quantity, category, and note readable for day-to-day operations.",
      contentsDescription: "Contents description",
      weight: "Weight",
      quantity: "Quantity",
      category: "Category",
      referenceNote: "Reference / note",
      referenceNoteEmpty: "No reference note saved",
      pricingSection: "Pricing summary",
      pricingSectionHelp:
        "This shows the saved intake pricing values for the shipment, including any discount and current payment state.",
      paymentStatus: "Payment status",
      amountPaid: "Amount paid",
      amountDue: "Amount due",
      amountDueHelp: "Amount due updates immediately from the shipment total and amount paid.",
      paymentMethod: "Payment method",
      paymentMethodEmpty: "No payment method saved yet",
      paymentMethodPlaceholder: "Select a payment method",
      paymentMethodHelp:
        "Optional. Save the payment method when the team knows how the customer paid for this shipment.",
      paymentMethodOptions: {
        cash: "Cash",
        zelle: "Zelle",
        cashapp: "Cash App",
        mobile_money: "Mobile money",
        card: "Card",
        other: "Other",
      },
      paymentNote: "Payment note",
      paymentNoteEmpty: "No payment note saved yet",
      paymentNotePlaceholder: "Optional payment note",
      paymentNoteHelp:
        "Optional. Save a short note only if it helps the team understand the current payment situation.",
      paymentActionTitle: "Record payment on this shipment",
      paymentActionDescription:
        "Update the amount paid so far, the payment method, and any short payment note directly on the shipment record.",
      amountPaidInput: "Amount paid so far",
      amountPaidHelp:
        "Enter the total amount already collected for this shipment in the vendor's saved currency.",
      amountPaidError: "Enter a valid amount paid that is zero or greater.",
      amountPaidExceedsTotalError:
        "Amount paid cannot be greater than the shipment total.",
      paymentStatusAutoHelp:
        "Payment status is calculated automatically from the amount paid you save here.",
      savePaymentUpdate: "Save payment update",
      markFullyPaid: "Mark fully paid",
      paymentUpdateSuccess: "The shipment payment record was updated successfully.",
      batchActionsTitle: "Batch actions",
      batchActionsDescription:
        "Use shipment detail to assign this shipment into an open batch or remove it from an open linked batch without leaving the record.",
      alreadyLinkedTitle: "This shipment is already linked to a batch",
      alreadyLinkedBodyEditable:
        "The linked batch is still open, so you can remove the shipment here if operations needs to correct the grouping.",
      alreadyLinkedBodyLocked:
        "The linked batch is no longer open, so batch linkage is read-only from this shipment detail view.",
      notEligibleTitle: "Batch assignment is not available right now",
      notEligibleBody:
        "Only pending shipments that are not already linked to a batch can be assigned from this screen in the current operational model.",
      assignToExistingTitle: "Assign to an existing batch",
      assignToExistingBody:
        "Choose one of the vendor's open batches below to group this pending shipment into an operational run.",
      assignToThisBatch: "Assign to this batch",
      openBatch: "Open batch",
      noAssignableBatches:
        "No open batches are available for assignment right now. Create one below if this shipment needs to be grouped now.",
      createBatchTitle: "Create a batch and assign this shipment",
      createBatchBody:
        "If no suitable batch exists yet, create a new open batch here and assign this shipment immediately.",
      createBatchAndAssign: "Create batch and assign",
      createAndAssignSuccess:
        "The new batch was created and the shipment was assigned successfully.",
      createBatchNameHelp:
        "Use a practical batch name the operations team will recognize later.",
      batchNameError: "Enter the batch name before creating it from shipment detail.",
      etaDateError: "Add the ETA date if you want to save an ETA time.",
      etaTimeError: "Add the ETA time if you want to save an ETA date.",
      assignSuccess: "The shipment was assigned to the selected batch successfully.",
      unassignSuccess: "The shipment was removed from the linked batch successfully.",
      timelineTitle: "Status timeline",
      timelineDescription:
        "Track the shipment's recorded operational status changes here as the shipment moves through batch flow.",
      timelineEmpty: "No recorded timeline events are available for this shipment yet.",
      timelineBatch: "Batch:",
      notAvailable: "Not available",
      timelineEventKinds: {
        created: "Shipment created",
        status_change: "Status updated",
        batch_linked: "Added to batch",
        batch_unlinked: "Removed from batch",
        eta_updated: "ETA updated",
      },
    },
    publicTracking: {
      title: "Track a shipment",
      description:
        "Open a shipment by tracking number and view the real customer-safe status and route details without signing in.",
      searchTitle: "Tracking lookup",
      searchDescription:
        "Enter the shipment tracking number to view the current public tracking state.",
      searchPlaceholder: "Enter tracking number",
      searchAction: "Track shipment",
      loadingBody: "Loading the shipment tracking record.",
      emptyTitle: "Enter a tracking number",
      emptyBody:
        "Use the tracking number from the shipment receipt or label to open the public tracking view.",
      notFoundTitle: "Tracking number not found",
      notFoundBody:
        "We could not find a shipment that matches this tracking number.",
      customerSafeNotice:
        "This page shows only customer-safe tracking information for this shipment.",
      currentStatus: "Current status",
      createdAt: "Created",
      eta: "ETA",
      etaHelp: "ETA comes from the real batch operations record when it has been set.",
      etaEmpty: "No ETA yet",
      vendorReference: "Handled by",
      vendorReferenceUnavailable: "CarryMatch vendor",
      routeSection: "Route",
      routeSectionDescription:
        "Use this section to confirm where the shipment started, where it is heading, and which receiving branch it is linked to.",
      origin: "Origin",
      destination: "Destination",
      destinationBranch: "Destination branch",
      destinationBranchMissing: "No destination branch recorded on this shipment",
      destinationBranchAddress: "Pickup / branch address",
      shippingMode: "Shipping mode",
      summarySection: "Shipment summary",
      summarySectionDescription:
        "This public summary keeps only the basic shipment details that are safe to expose.",
      contentsDescription: "Contents description",
      category: "Category",
      quantity: "Quantity",
      weight: "Weight",
      timelineTitle: "Status timeline",
      timelineDescription:
        "Follow the real shipment status history recorded so far.",
      timelineEmpty: "No public timeline entries are available for this shipment yet.",
      timelineEventKinds: {
        created: "Shipment created",
        status_change: "Status updated",
        batch_linked: "Grouped for transit",
        batch_unlinked: "Routing updated",
        eta_updated: "ETA updated",
      },
      notAvailable: "Not available",
    },
    shell: {
      currentState: "Current access state",
      profileFallback:
        "App-owned onboarding tables are not fully available yet, so routing is using the best available fallback.",
    },
    notFound: {
      title: "Page not found",
      body: "This route is outside the current launch-core slice.",
    },
  },
  fr: {
    app: { brand: "CarryMatch CML", tagline: "Noyau logistique vendeur" },
    nav: {
      landing: "Accueil",
      pricing: "Tarifs",
      apply: "Candidature",
      dashboard: "Tableau de bord",
      shipments: "Envois",
      newShipment: "Nouvel envoi",
      scanUpdate: "Scan / Mise a jour",
      batches: "Batchs",
      customers: "Clients",
      notificationLog: "Journal des notifications",
      notificationSettings: "Parametres notifications",
      companyProfile: "Profil entreprise",
      branches: "Agences",
      subscription: "Abonnement",
      admin: "Admin",
      login: "Connexion",
      signup: "Inscription",
      logout: "Deconnexion",
      menu: "Menu",
    },
    common: {
      loading: "Chargement",
      loadingShort: "Chargement...",
      loadingMessage: "Verification de votre session et de votre etat d'acces.",
      retry: "Reessayer",
      backHome: "Retour a l'accueil",
      backToDashboard: "Retour au tableau de bord",
      viewPricing: "Voir les tarifs",
      createAccount: "Creer un compte",
      signIn: "Se connecter",
      signOut: "Se deconnecter",
      continue: "Continuer",
      submit: "Soumettre",
      save: "Enregistrer",
      saving: "Enregistrement...",
      notAvailableYet: "Pas encore disponible",
      environmentWarning: "L'authentification Supabase n'est pas encore configuree pour cet environnement.",
      accessRoutingNote:
        "Le routage d'acces verifie maintenant d'abord les donnees d'onboarding de l'application, puis utilise un repli si ces donnees ne sont pas encore disponibles.",
      deferredDataTitle: "Flux differe",
      deferredDataDescription:
        "Cet ecran est branche dans le chemin de rebuild, mais les workflows operationnels suivants restent hors scope pour le moment.",
      language: "Langue",
      english: "EN",
      french: "FR",
      sessionDetails: "Details de session",
      email: "E-mail",
      password: "Mot de passe",
      fullName: "Nom complet",
      companyName: "Nom de l'entreprise",
      phone: "Numero de telephone",
      whatsAppNumber: "Numero WhatsApp",
      businessType: "Type d'activite",
      monthlyVolume: "Volume mensuel estime",
      corridors: "Corridors principaux",
      officeAddresses: "Adresses des bureaux",
      notes: "Notes",
      status: "Statut",
      reason: "Motif",
      submittedAt: "Soumise le",
      preferredLanguage: "Langue preferee",
      defaultOriginCountry: "Pays d'origine par defaut",
      defaultOriginCity: "Ville d'origine par defaut",
      destinationBranches: "Agences de destination",
      accountEmail: "E-mail du compte",
      plan: "Plan",
    },
    phone: {
      countryPlaceholder: "Choisir un pays",
      numberPlaceholder: "Numero national",
      callingCode: "Indicatif :",
      savedAs: "Enregistre comme :",
      requiredError: "Entrez un numero de telephone valide.",
      optionalError: "Entrez un numero WhatsApp valide ou laissez ce champ vide.",
    },
    customerUpdates: {
      statusLabels: {
        shipment_created: "Colis recu",
        batch_shipped: "En transit",
        batch_arrived: "Arrive a l'agence de destination",
        ready_for_pickup: "Pret pour retrait",
        delayed: "Retarde",
        customs_hold: "Retarde a la douane",
        out_for_last_mile_delivery: "En cours de livraison locale",
        collected: "Recupere",
        returned: "Retourne",
        cancelled: "Annule",
        processing_update: "Mise a jour de l'envoi",
      },
      eventLabels: {
        shipment_created: {
          public: "Colis recu",
          sender: "Envoi cree",
          receiver: "Colis recu",
        },
        batch_shipped: "En transit",
        batch_arrived: "Arrive a l'agence de destination",
        ready_for_pickup: "Pret pour retrait",
        delayed: "Retarde",
        customs_hold: "Retarde a la douane",
        out_for_last_mile_delivery: "En cours de livraison locale",
        collected: "Recupere",
        eta_updated: "Arrivee estimee mise a jour",
        processing_update: "Mise a jour de l'envoi",
      },
    },
    accessState: {
      public: "Public",
      no_vendor_record: "Aucun dossier vendeur",
      application_pending: "Candidature en attente",
      application_rejected: "Candidature rejetee",
      setup_required: "Configuration requise",
      active_vendor: "Vendeur actif",
      suspended_vendor: "Vendeur suspendu",
    },
    errors: {
      title: "Quelque chose demande votre attention",
      signUpFailed: "Impossible de creer votre compte.",
      signInFailed: "Impossible de vous connecter.",
      missingConfig:
        "VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent etre definies avant d'utiliser l'authentification Supabase.",
      profileWarning:
        "Impossible de lire tout le jeu de donnees applicatif, donc le routage utilise le meilleur repli disponible.",
      applicationLoadFailed: "Impossible de charger la candidature pour le moment.",
      applicationSubmitFailed: "Impossible d'enregistrer votre candidature.",
      applicationAlreadyExists: "Une candidature existe deja pour ce compte.",
      setupLoadFailed: "Impossible de charger votre etat de configuration pour le moment.",
      setupSaveFailed: "Impossible d'enregistrer vos details de configuration.",
      vendorProfileSaveFailed: "Impossible d'enregistrer les changements du profil entreprise.",
      branchSaveFailed: "Impossible d'enregistrer les changements des agences.",
      shipmentLookupFailed: "Impossible de rechercher le client pour le moment.",
      shipmentBranchLoadFailed: "Impossible de charger les agences de destination pour le moment.",
      shipmentSaveFailed: "Impossible d'enregistrer l'envoi pour le moment.",
      shipmentDetailLoadFailed: "Impossible de charger le detail de l'envoi pour le moment.",
      publicTrackingLoadFailed: "Impossible de charger le suivi public pour le moment.",
      batchLoadFailed: "Impossible de charger les batches pour le moment.",
      batchSaveFailed: "Impossible d'enregistrer les details du batch pour le moment.",
      batchStatusFailed: "Impossible de mettre a jour le statut du batch pour le moment.",
      batchAssignmentFailed: "Impossible de mettre a jour l'affectation de l'envoi pour le moment.",
      shipmentCollectionFailed: "Impossible de marquer l'envoi comme recupere pour le moment.",
      paymentUpdateFailed: "Impossible d'enregistrer la mise a jour du paiement pour le moment.",
      scanLookupFailed: "Impossible de retrouver cet envoi pour le moment.",
      scanQuickUpdateFailed:
        "Impossible d'enregistrer cette mise a jour rapide de l'envoi pour le moment.",
      notificationLogLoadFailed: "Impossible de charger le journal des notifications pour le moment.",
      notificationSettingsSaveFailed:
        "Impossible d'enregistrer les parametres de notification pour le moment.",
      labelGenerationFailed: "Impossible de generer l'etiquette d'expedition pour le moment.",
      setupRequiresApprovedApplication:
        "Votre candidature doit etre approuvee avant de continuer la configuration.",
      vendorPrefixInUse: "Ce prefixe vendeur est deja utilise.",
    },
    landing: {
      eyebrow: "Phase 1 CML",
      title: "Coque applicative et controle d'acces reconstruits sur des fondations gerees par l'application.",
      description:
        "Cette premiere tranche de lancement relie l'authentification Supabase, les vrais enregistrements d'onboarding, le routage et le support EN/FR sans encore activer les operations d'expedition.",
      primaryCta: "Commencer",
      secondaryCta: "Voir les tarifs",
      card1Title: "Entree publique",
      card1Body: "Accueil, tarifs, inscription et connexion sont actives comme nouvelle porte d'entree.",
      card2Title: "Gating par etat d'acces",
      card2Body:
        "Les utilisateurs sont diriges vers la candidature, le statut, la configuration ou le tableau de bord a partir des vrais enregistrements d'onboarding.",
      card3Title: "Base bilingue",
      card3Body: "Le changement EN/FR est visible maintenant et pret a s'etendre aux ecrans suivants.",
    },
    pricing: {
      title: "Tarification de lancement",
      description: "Le lancement CML Phase 1 est verrouille sur Free et Pro uniquement.",
      freeTitle: "Free",
      freePrice: "$0",
      freeFeatureOne: "Jusqu'a 50 expeditions par mois",
      freeFeatureTwo: "Base d'onboarding et de suivi",
      freeFeatureThree: "Suivi public sous marque CarryMatch",
      proTitle: "Pro",
      proPrice: "$49/mois",
      proFeatureOne: "Expeditions illimitees",
      proFeatureTwo: "Acces equipe et etiquettes de marque",
      proFeatureThree: "Parametres et medias etendus",
      footer:
        "La facturation, l'activation par coupon et l'application des limites restent hors de cette tranche de code.",
    },
    signup: {
      title: "Creer votre compte partenaire",
      description:
        "Cette tranche met en place l'inscription Supabase par e-mail et mot de passe puis vous envoie dans le bon flux launch-core.",
      submit: "Creer le compte",
      successTitle: "Compte cree",
      successBody:
        "Si la confirmation par e-mail est activee dans Supabase, terminez cette etape d'abord. Apres connexion, le routage vous enverra vers le bon ecran CML launch-core.",
      existingAccount: "Vous avez deja un compte ?",
      signInLink: "Se connecter",
    },
    login: {
      title: "Connexion a CarryMatch CML",
      description:
        "Cette tranche relie la connexion Supabase et resout votre etat d'acces launch-core apres connexion.",
      submit: "Se connecter",
      createAccountPrompt: "Besoin d'un compte ?",
      createAccountLink: "S'inscrire",
    },
    apply: {
      title: "Candidature partenaire",
      description:
        "Les utilisateurs connectes sans dossier vendeur peuvent soumettre ici leur candidature partenaire CML Phase 1.",
      signInPrompt:
        "Creez un compte ou connectez-vous d'abord pour soumettre votre candidature partenaire dans le chemin de rebuild.",
      accountRequiredCta: "Aller a l'inscription",
      formTitle: "Details de candidature",
      helper:
        "Cela enregistre la vraie candidature launch-core. L'approbation arrive plus tard hors de cette tranche.",
      businessTypePlaceholder: "Choisir un type d'activite",
      businessTypeRequired: "Choisissez un type d'activite.",
      otherBusinessTypeLabel: "Veuillez preciser",
      otherBusinessTypeRequired: "Veuillez preciser le type d'activite.",
      monthlyVolumePlaceholder: "Par exemple : 250",
      monthlyVolumeHelp:
        "Entrez un nombre estime d'envois ou de colis par mois en utilisant uniquement des chiffres.",
      corridorsHelp: "Ajoutez un corridor principal par ligne pour faciliter la revue.",
      corridorsHint: "Une ligne par corridor, par exemple : Douala vers Yaounde",
      officeAddressesHelp:
        "Ajoutez un bureau par ligne. Incluez la ville ou le quartier si cela aide.",
      officeAddressesHint: "Une adresse de bureau par ligne.",
      submit: "Soumettre la candidature",
      resubmit: "Soumettre a nouveau la candidature",
      successTitle: "Candidature soumise",
      successBody: "Votre candidature a ete enregistree et attend maintenant une revue.",
      resubmitSuccessBody:
        "Votre candidature mise a jour a ete renvoyee et attend maintenant une nouvelle revue.",
      existingApplicationTitle: "Une candidature existe deja",
      existingApplicationBody:
        "Ce compte possede deja un enregistrement de candidature. Ouvrez l'ecran de statut pour voir l'etat actuel.",
      existingApplicationCta: "Voir le statut de candidature",
      rejectedApplicationTitle: "Mettez a jour puis renvoyez cette candidature",
      rejectedApplicationBody:
        "Cette candidature a deja ete refusee. Vous pouvez corriger les details ci-dessous puis la renvoyer pour revue.",
      businessTypeOptions: {
        "Airline Luggage Consolidator": "Consolidateur de bagages aeriens",
        "Container / Barrel Shipper": "Expediteur de conteneurs / barils",
        "Bus Agency Parcels": "Colis d'agence de bus",
        Other: "Autre",
      },
    },
    applicationStatus: {
      title: "Statut de candidature",
      description:
        "Cette page lit votre vraie candidature et l'etat vendeur depuis Supabase et garde le tableau de bord bloque tant que le compte n'est pas pret.",
      pendingTitle: "Votre candidature est en cours de revue",
      pendingBody: "Vous ne pouvez pas encore acceder au tableau de bord vendeur.",
      rejectedTitle: "Votre candidature n'a pas ete approuvee",
      rejectedBody: "L'acces au tableau de bord reste bloque jusqu'a une nouvelle revue.",
      suspendedTitle: "Votre compte vendeur est suspendu",
      suspendedBody: "L'acces au tableau de bord est bloque tant que ce compte reste suspendu.",
      defaultTitle: "Statut indisponible",
      defaultBody: "Nous n'avons pas pu relier ce compte a un etat de candidature ou de vendeur actuel.",
      detailsTitle: "Details de candidature",
      nextStepsTitle: "Etape suivante",
      pendingNextStep:
        "La revue admin reste hors de cette tranche. Une fois la candidature approuvee, le routage vous enverra vers la configuration.",
      rejectedNextStep:
        "Vous pouvez mettre a jour les details de la candidature puis la renvoyer depuis cet ecran quand vous etes pret.",
      suspendedNextStep:
        "La revue de suspension n'est pas construite dans cette tranche, donc cet ecran explique seulement l'etat actuel.",
      defaultNextStep:
        "Si cela semble incorrect, rafraichissez votre session apres correction de l'enregistrement sous-jacent.",
      noApplicationTitle: "Aucune candidature trouvee",
      noApplicationBody: "Ce compte n'a pas encore de candidature enregistree.",
      reapplyCta: "Mettre a jour et renvoyer la candidature",
    },
    setup: {
      title: "Assistant de premiere configuration",
      description:
        "Les vendeurs approuves terminent ici la configuration minimale launch-core avant d'entrer dans le tableau de bord.",
      sectionOne: "Identite vendeur",
      sectionOneHelp:
        "Definissez le nom commercial et le prefixe de suivi a 3 lettres qui identifieront ce vendeur dans les enregistrements launch-core.",
      sectionTwo: "Bureau principal d'origine et configuration des bureaux de retrait",
      sectionTwoHelp:
        "Commencez par le bureau principal d'ou partent le plus souvent les envois, puis ajoutez les bureaux de retrait ou de destination utilises plus tard par les clients.",
      sectionThree: "Tarification par defaut, assurance et plan",
      sectionThreeHelp:
        "Choisissez ici vos valeurs par defaut. Vous pourrez toujours ajuster le prix, les frais et l'assurance plus tard pendant l'intake d'un envoi.",
      companyName: "Nom de l'entreprise",
      companyNameHelp:
        "Ce champ reprend le nom approuve dans la candidature quand il existe, mais vous pouvez l'ajuster avant enregistrement si le nom d'exploitation doit differer.",
      vendorPrefix: "Prefixe vendeur",
      vendorPrefixHelp:
        "Utilisez exactement 3 lettres. Ce prefixe apparait dans les numeros de suivi, par exemple CML.",
      vendorPrefixError: "Entrez exactement 3 lettres pour le prefixe vendeur.",
      defaultOriginCountry: "Pays du bureau principal / d'origine",
      defaultOriginCountryPlaceholder: "Choisir le pays du bureau principal",
      defaultOriginCountryHelp:
        "Choisissez le pays du bureau principal ou d'origine afin d'enregistrer une valeur de localisation propre et filtrable.",
      defaultOriginCountryError: "Choisissez le pays du bureau principal / d'origine.",
      defaultOriginCity: "Ville du bureau principal / d'origine",
      defaultOriginCityHelp: "Entrez la ville du bureau d'ou partent la plupart des envois.",
      destinationBranches: "Bureaux de retrait / destination",
      destinationBranchesHelp:
        "Ajoutez chaque bureau de retrait avec un nom clair, un pays, une ville et une adresse afin que les clients et le personnel identifient facilement la bonne destination plus tard. Exemple : Bureau retrait Yaounde, CM, Yaounde, Mvan pres de la station Total.",
      destinationBranchesHint:
        "Ajoutez chaque bureau separement avec un nom, un pays, une ville et une adresse.",
      destinationOfficesEmpty:
        "Aucun bureau de retrait n'a encore ete ajoute. Ajoutez au moins un bureau de retrait / destination avant de terminer la configuration.",
      destinationOfficesRequired:
        "Ajoutez au moins un bureau de retrait / destination avant de terminer la configuration.",
      destinationOfficeCard: "Bureau de retrait",
      destinationOfficeAdd: "Ajouter un bureau",
      destinationOfficeRemove: "Supprimer",
      destinationOfficeName: "Nom du bureau",
      destinationOfficeNamePlaceholder: "Par exemple : Bureau retrait Yaounde",
      destinationOfficeNameHelp:
        "Utilisez le nom que le personnel et les clients reconnaitront plus tard pour choisir ou confirmer un bureau de retrait.",
      destinationOfficeNameError:
        "Entrez le nom de ce bureau de retrait / destination.",
      destinationOfficeCountry: "Pays",
      destinationOfficeCountryPlaceholder: "Choisir le pays du bureau de retrait",
      destinationOfficeCountryHelp:
        "Choisissez le pays ou ce bureau de retrait opere afin que la selection de destination reste propre plus tard.",
      destinationOfficeCountryError:
        "Choisissez le pays pour ce bureau de retrait / destination.",
      destinationOfficeCity: "Ville",
      destinationOfficeCityPlaceholder: "Par exemple : Yaounde",
      destinationOfficeCityHelp:
        "Entrez la ville de ce bureau de retrait afin que l'intake d'envoi puisse pre-remplir la ville de destination plus fiablement plus tard.",
      destinationOfficeCityError:
        "Entrez la ville de ce bureau de retrait / destination.",
      destinationOfficeAddress: "Adresse",
      destinationOfficeAddressPlaceholder: "Par exemple : Mvan, pres de la station Total",
      destinationOfficeAddressHelp:
        "Ajoutez l'adresse ou les details de localisation dont les clients auront besoin pour trouver ce bureau.",
      destinationOfficeAddressError:
        "Entrez l'adresse de ce bureau de retrait / destination.",
      pricingModel: "Methode tarifaire par defaut",
      pricingModelHelp:
        "Choisissez la methode de depart par defaut. Vous pourrez toujours modifier le prix reel d'un envoi ou ajouter des frais plus tard pendant l'intake.",
      insuranceModel: "Methode d'assurance par defaut",
      insuranceModelHelp:
        "Choisissez l'approche d'assurance par defaut. Vous pourrez toujours ajuster la valeur declaree ou l'assurance par envoi plus tard.",
      planChoice: "Plan de lancement",
      pricingPerKg: "Par kilogramme par defaut",
      pricingFlatFee: "Forfait par defaut",
      pricingManual: "Tarification manuelle par defaut",
      insurancePercentage: "Assurance en pourcentage par defaut",
      insuranceFlat: "Montant d'assurance fixe par defaut",
      planFree: "Free",
      planPro: "Pro",
      defaultsNoticeTitle: "Il s'agit seulement des valeurs par defaut du lancement",
      defaultsNoticeBody:
        "Vous choisissez ici la base de depart pour la tarification et l'assurance. Votre equipe pourra toujours ajuster le prix, les frais supplementaires et l'assurance plus tard pendant l'intake d'un envoi.",
      submit: "Terminer la configuration",
      successTitle: "Configuration terminee",
      successBody:
        "Vos enregistrements vendeur ont ete sauvegardes et ce compte est maintenant actif.",
      approvedNoticeTitle: "Approuve et pret pour la configuration",
      approvedNoticeBody:
        "Ce flux ecrit les enregistrements minimaux vendeur, proprietaire et agences necessaires a l'acces launch-core.",
    },
    dashboard: {
      title: "Tableau de bord vendeur",
      description:
        "Ceci est la coque du tableau de bord launch-core pour les vendeurs actifs. Les modules expedition, batch, facturation et notifications restent hors de cette tranche.",
      activeVendorLabel: "Entreprise active",
      statOne: "Etat d'acces",
      statTwo: "Langue",
      statThree: "Session",
      shipmentIntakeTitle: "Nouvel intake d'envoi",
      shipmentIntakeBody:
        "Commencez ici un vrai envoi avec recherche client par vendeur et numero de suivi genere.",
      startNewShipment: "Commencer un nouvel envoi",
      scanUpdateTitle: "Scan / Mise a jour",
      scanUpdateBody:
        "Retrouvez vite un envoi par numero de suivi ou QR et utilisez une action rapide sure depuis la carte resultat.",
      openScanUpdate: "Ouvrir Scan / Mise a jour",
      batchManagementTitle: "Gestion des batchs",
      batchManagementBody:
        "Regroupez les envois en attente dans des batchs operationnels et faites avancer ici les premiers statuts batch du noyau.",
      manageBatches: "Gerer les batchs",
      businessManagementTitle: "Parametres de l'entreprise",
      businessManagementBody:
        "Gerez ici les details de votre entreprise active sans relancer l'onboarding.",
      manageCompanyProfile: "Gerer le profil entreprise",
      manageBranches: "Gerer les agences",
      notificationLogTitle: "Notifications",
      notificationLogBody:
        "Consultez les vrais evenements de notification que la plateforme enregistre deja et definissez ici les premiers parametres de notification du vendeur.",
      viewNotificationLog: "Voir le journal des notifications",
      manageNotificationSettings: "Parametres notifications",
      nextStepsTitle: "Tranches suivantes",
      nextStepOne: "Workflow d'approbation admin",
      nextStepTwo: "Modules expeditions et batchs",
      nextStepThree: "Paiements, etiquettes et notifications",
      todoTitle: "TODO intentionnels",
      todoBody:
        "Les metriques du tableau de bord et les widgets operationnels sont volontairement differes jusqu'aux prochaines tranches.",
    },
    vendorSettings: {
      title: "Parametres vendeur / profil entreprise",
      description:
        "Les vendeurs actifs peuvent mettre a jour les details principaux de l'entreprise et les valeurs tarifaires par defaut deja enregistres pendant l'onboarding.",
      cardTitle: "Profil entreprise",
      cardDescription:
        "Gardez a jour le nom de l'entreprise, le prefixe de suivi, les details du bureau principal d'origine et les valeurs tarifaires par defaut.",
      companyNameHelp:
        "Mettez a jour le nom d'exploitation qui doit apparaitre sur le dossier vendeur actif.",
      companyNameError: "Entrez le nom de l'entreprise avant d'enregistrer.",
      defaultOriginCityError:
        "Entrez la ville du bureau principal / d'origine avant d'enregistrer.",
      pricingDefaultsTitle: "Tarification par defaut pour l'intake",
      pricingDefaultsDescription:
        "Definissez la regle tarifaire de depart et la devise que l'intake doit utiliser automatiquement. Le personnel pourra toujours modifier le prix d'un envoi plus tard si necessaire.",
      pricingModel: "Modele tarifaire",
      pricingModelHelp:
        "Choisissez comment l'intake doit commencer a tarifer les nouveaux envois par defaut.",
      pricingModelError: "Choisissez le modele tarifaire par defaut avant d'enregistrer.",
      pricingModelOptions: {
        per_kg: "Par kilogramme",
        flat_fee: "Forfait par article",
        manual: "Manuel",
      },
      defaultCurrency: "Devise par defaut",
      defaultCurrencyHelp:
        "Choisissez la devise tarifaire par defaut du vendeur. CarryMatch enregistre seulement le code devise propre a 3 lettres.",
      defaultCurrencyError: "Entrez un code devise valide de 3 lettres.",
      currencyOptions: {
        USD: "USD - Dollar americain",
        XAF: "XAF - Franc CFA d'Afrique centrale (FCFA)",
        NGN: "NGN - Naira nigerian",
        GHS: "GHS - Cedi ghaneen",
        EUR: "EUR - Euro",
        GBP: "GBP - Livre sterling",
      },
      ratePerKg: "Tarif par kilogramme",
      ratePerKgPlaceholder: "Par exemple : 20",
      ratePerKgHelp:
        "Requis seulement quand le modele tarifaire est par kilogramme. L'intake calculera le prix de base comme poids × tarif.",
      ratePerKgError: "Entrez un tarif par kilogramme valide superieur a zero.",
      flatFeePerItem: "Forfait par article",
      flatFeePerItemPlaceholder: "Par exemple : 25",
      flatFeePerItemHelp:
        "Requis seulement quand le modele tarifaire est forfaitaire. L'intake calculera le prix de base comme quantite × forfait.",
      flatFeePerItemError: "Entrez un forfait par article valide superieur a zero.",
      noVendorTitle: "Dossier vendeur indisponible",
      noVendorBody:
        "Impossible de trouver le dossier vendeur actif necessaire pour les parametres de l'entreprise.",
      submit: "Enregistrer le profil entreprise",
      successTitle: "Profil entreprise mis a jour",
      successBody: "Votre dossier vendeur actif a ete mis a jour avec succes.",
    },
    branchManagement: {
      title: "Gestion des agences",
      description:
        "Gerez les bureaux de retrait / destination utilises par votre entreprise active apres l'onboarding, y compris le pays et la ville de chaque agence.",
      helperTitle: "Bureaux de l'entreprise active",
      helperBody:
        "Cette page modifie les vrais enregistrements d'agences vendeur deja lies a l'entreprise active afin que chaque bureau ait un pays, une ville et une adresse utilisables.",
      actionsHelp:
        "Ajoutez, modifiez ou supprimez des bureaux de retrait / destination, puis enregistrez quand la liste vous convient.",
      addBranch: "Ajouter une agence",
      addFirstBranch: "Ajouter la premiere agence",
      removeBranch: "Supprimer",
      save: "Enregistrer les agences",
      emptyTitle: "Aucune agence pour le moment",
      emptyBody:
        "Cette entreprise active n'a pas encore de bureau de retrait / destination enregistre.",
      branchCard: "Agence",
      branchCardHelp:
        "Gardez le nom du bureau et l'adresse clairs pour les operations suivantes.",
      officeNameHelp:
        "Utilisez le nom de bureau que les clients et le personnel reconnaitront plus tard.",
      officeNameError: "Entrez le nom du bureau pour cette agence.",
      country: "Pays",
      countryPlaceholder: "Choisir le pays de l'agence",
      countryHelp:
        "Choisissez le pays de ce bureau afin que l'agence puisse etre filtree et regroupee correctement plus tard.",
      countryError: "Choisissez le pays pour cette agence.",
      city: "Ville",
      cityPlaceholder: "Par exemple : Yaounde",
      cityHelp:
        "Entrez la ville de ce bureau afin que la selection de destination puisse pre-remplir la ville plus fiablement plus tard.",
      cityError: "Entrez la ville pour cette agence.",
      addressHelp:
        "Ajoutez l'adresse ou les details de localisation dont les clients auront besoin pour trouver cette agence.",
      addressError: "Entrez l'adresse pour cette agence.",
      noVendorTitle: "Dossier vendeur indisponible",
      noVendorBody:
        "Impossible de trouver le dossier vendeur actif necessaire pour la gestion des agences.",
      minOneBranchError:
        "Gardez au moins une agence de retrait / destination enregistree afin que l'intake des envois conserve de vraies options d'agence de destination.",
      successTitle: "Agences mises a jour",
      successBody: "La liste des agences a ete enregistree avec succes.",
    },
    notifications: {
      openLog: "Ouvrir le journal des notifications",
      openSettings: "Parametres notifications",
      noVendorTitle: "Dossier vendeur indisponible",
      noVendorBody:
        "Impossible de trouver le dossier vendeur actif necessaire pour la visibilite et les parametres des notifications.",
      logTitle: "Journal des notifications",
      logDescription:
        "Consultez les vrais enregistrements d'evenements de notification deja generes pour ce vendeur avant l'activation de l'envoi reel.",
      logCardTitle: "Evenements de notification enregistres",
      logCardDescription:
        "Ce journal montre les enregistrements de notification propres a ce vendeur actuellement captures depuis l'activite des envois et des batchs.",
      loadingBody: "Chargement des evenements de notification enregistres pour ce vendeur.",
      emptyTitle: "Aucun evenement de notification pour le moment",
      emptyBody:
        "Les enregistrements de notification apparaitront ici des que des actions reelles d'envoi ou de batch declencheront des evenements.",
      createdAt: "Cree le",
      recipientRole: "Role du destinataire",
      recipientRoleOptions: {
        sender: "Expediteur",
        receiver: "Destinataire",
      },
      recipientName: "Nom du destinataire",
      recipientContact: "Contact du destinataire",
      shipmentReference: "Reference d'envoi",
      batchReference: "Reference batch",
      plannedChannel: "Canal prevu",
      plannedChannelOptions: {
        whatsapp: "WhatsApp",
        email: "E-mail",
      },
      deliveryStatus: "Statut de livraison",
      deliveryStatusOptions: {
        recorded: "Enregistre",
        queued: "En file d'attente",
        sent: "Envoye",
        delivered: "Livre",
        read: "Lu",
        failed: "Echoue",
        skipped: "Ignore",
      },
      settingsTitle: "Parametres notifications",
      settingsDescription:
        "Definissez ici les premiers parametres de notification au niveau du vendeur pendant que l'enregistrement reel des evenements continue en fond pour la future integration d'envoi.",
      settingsCardTitle: "Valeurs par defaut des notifications",
      settingsCardDescription:
        "Enregistrez maintenant les choix minimaux de notification au niveau du vendeur afin que les futurs envois puissent reutiliser proprement la meme fondation.",
      notificationsEnabled: "Notifications activees",
      notificationsEnabledHelp:
        "Il s'agit du bouton vendeur pour la future couche d'envoi. L'enregistrement interne des evenements continue quand meme afin que votre journal reste complet.",
      defaultPlannedChannel: "Canal prevu par defaut",
      defaultPlannedChannelHelp:
        "Choisissez le canal que les futurs envois devront preferer par defaut lorsque plusieurs contacts sont disponibles.",
      recordingNoticeTitle: "La capture interne des evenements est deja active",
      recordingNoticeBody:
        "CarryMatch enregistre deja des evenements de notification structures a partir des vraies actions d'envoi et de batch. Cette page enregistre seulement les valeurs par defaut au niveau du vendeur que les futurs envois Meta et e-mail pourront utiliser plus tard.",
      metaPlaceholderTitle: "Emplacement reserve Meta Cloud API direct",
      metaPlaceholderBody:
        "Le Meta Business Manager, le WABA, le numero dedie, les templates et le branchement de livraison restent pour une tranche ulterieure. Cette page prepare seulement la fondation cote vendeur.",
      emailPlaceholderTitle: "Emplacement reserve pour le fallback e-mail",
      emailPlaceholderBody:
        "La connexion du fournisseur fallback et les regles de templates restent pour une tranche ulterieure. Cette page enregistre seulement le choix du canal par defaut au niveau du vendeur.",
      saveButton: "Enregistrer les parametres de notification",
      saveSuccess: "Vos parametres de notification ont ete enregistres avec succes.",
      notAvailable: "Indisponible",
    },
    shippingLabel: {
      title: "Etiquette d'expedition",
      sender: "Expediteur",
      receiver: "Destinataire",
      destinationBranch: "Agence de destination",
      destination: "Destination",
      shippingMode: "Mode d'expedition",
      weight: "Poids",
      contents: "Contenu",
      paymentStatus: "Statut de paiement",
      scanToTrack: "Scannez ou ouvrez ce lien de suivi",
      companyFallback: "Vendeur CarryMatch",
      notAvailable: "Indisponible",
      loadingPreview: "Preparation de votre etiquette d'expedition...",
      preparingAction: "Preparation etiquette...",
    },
    scanUpdate: {
      title: "Scan / Mise a jour",
      description:
        "Ouvrez rapidement un vrai envoi par numero de suivi ou QR afin que le front desk et les operations avancent plus vite.",
      noVendorTitle: "Dossier vendeur actif indisponible",
      noVendorBody:
        "Impossible de trouver le dossier vendeur actif necessaire pour le scan et la mise a jour.",
      successTitle: "Action scan / mise a jour terminee",
      trackingLabel: "Numero de suivi",
      trackingPlaceholder: "Entrez ou scannez le numero de suivi",
      trackingHelp:
        "Vous pouvez saisir directement le numero de suivi ou coller l'URL publique de suivi venant du QR de l'etiquette.",
      trackingRequired: "Entrez ou scannez d'abord un numero de suivi.",
      lookupTitle: "Retrouver vite un envoi",
      lookupDescription:
        "Commencez par la saisie manuelle, puis utilisez le scan QR lorsque le navigateur et la camera de l'appareil le prennent en charge proprement.",
      lookupAction: "Trouver l'envoi",
      normalizeAction: "Nettoyer la valeur de suivi",
      scannerTitle: "Scanner QR",
      scannerDescription:
        "Utilisez la camera de l'appareil pour scanner le QR de l'envoi lorsque le navigateur le permet. La saisie manuelle reste toujours disponible.",
      scannerUnavailableTitle: "Scanner indisponible ici",
      scannerUnavailableBody:
        "Ce navigateur ou cet appareil n'expose pas encore le scan QR natif de facon suffisamment propre, donc utilisez la recherche manuelle sur cette page pour le moment.",
      scannerErrorTitle: "Le scanner demande votre attention",
      scannerStartFailed:
        "Impossible de demarrer le scanner camera. Verifiez les autorisations camera puis reessayez.",
      scannerReadFailed:
        "Impossible de lire un QR valide depuis le flux camera pour le moment.",
      scanInvalidResult:
        "Le resultat du QR scanne ne contenait pas une valeur de suivi exploitable.",
      startScanner: "Demarrer le scanner QR",
      stopScanner: "Arreter le scanner",
      resultTitle: "Resultat de l'envoi",
      resultDescription:
        "Une fois l'envoi trouve, cette carte donne les faits operationnels essentiels ainsi qu'un lien rapide vers le detail complet de l'envoi.",
      emptyTitle: "Aucun envoi ouvert pour le moment",
      emptyBody:
        "Retrouvez un envoi par numero de suivi ou QR et le resultat operationnel apparaitra ici.",
      notFoundBody:
        "Impossible de trouver un envoi correspondant a ce numero de suivi dans ce compte vendeur actif.",
      senderReceiver: "Expediteur / destinataire",
      destinationBranch: "Agence de destination",
      destinationBranchMissing: "Aucune agence de destination enregistree sur cet envoi",
      destination: "Destination",
      shippingMode: "Mode d'expedition",
      openShipmentDetail: "Ouvrir le detail de l'envoi",
      quickCollectAction: "Marquer comme recupere",
      quickCollectSuccess: "L'envoi a ete marque comme recupere avec succes.",
      quickActionHelp:
        "L'action rapide de collecte apparait seulement quand l'envoi est deja en phase de retrait ou de dernier kilometre. Utilisez le detail complet de l'envoi pour les mises a jour plus larges.",
      notAvailable: "Indisponible",
    },
    batches: {
      listTitle: "Liste des batchs",
      listDescription:
        "Consultez, creez et ouvrez les batchs operationnels utilises par votre entreprise active.",
      createBatch: "Creer un batch",
      createFirstBatch: "Creer votre premier batch",
      summaryTitle: "Batchs operationnels",
      summaryBody:
        "Gardez la creation et le regroupement quotidien des batchs au meme endroit, puis ouvrez chaque batch pour affecter les envois et mettre a jour le statut.",
      summaryTotalBatches: "batchs au total",
      summaryEditableBatches: "ouverts ou verrouilles",
      summaryGroupedShipments: "envois regroupes",
      summaryCreateHint:
        "Creez un nouveau batch quand les operations sont pretes a regrouper des envois en attente et fixer une ETA.",
      existingTitle: "Batchs existants",
      existingDescription:
        "Voici les vrais batchs deja enregistres pour votre dossier vendeur actif.",
      noVendorTitle: "Dossier vendeur indisponible",
      noVendorBody:
        "Impossible de trouver le dossier vendeur actif necessaire pour la gestion des batchs.",
      emptyTitle: "Aucun batch pour le moment",
      emptyBody:
        "Creez le premier batch operationnel quand vous etes pret a regrouper des envois en attente.",
      batchName: "Nom du batch",
      batchNamePlaceholder: "Par exemple : Douala vers Yaounde - rotation avril",
      batchNameHelp:
        "Utilisez un nom de batch pratique que votre equipe operations reconnaitra plus tard.",
      batchNameError: "Entrez le nom du batch avant d'enregistrer.",
      eta: "ETA",
      etaHelp:
        "Optionnel. Ajoutez l'heure d'arrivee prevue seulement si vous la connaissez deja.",
      etaDate: "Date ETA",
      etaDateHelp: "Optionnel. Choisissez la date d'arrivee prevue pour ce batch.",
      etaDateError: "Ajoutez la date ETA si vous voulez enregistrer une heure.",
      etaTime: "Heure ETA",
      etaTimeHelp: "Optionnel. Ajoutez l'heure d'arrivee prevue une fois la date choisie.",
      etaTimeError: "Ajoutez l'heure ETA si vous voulez enregistrer une date ETA.",
      etaPreviewTitle: "Apercu ETA",
      etaPreviewEmpty: "Aucune ETA n'a encore ete definie pour ce batch.",
      etaPropagationHelp:
        "Cette ETA de batch devient l'ETA operationnelle principale affichee sur le detail d'envoi lie et le suivi public.",
      noEta: "Aucune ETA definie",
      shipmentCount: "Nombre d'envois",
      createdDate: "Date de creation",
      openBatch: "Ouvrir le batch",
      backToList: "Retour a la liste des batchs",
      createTitle: "Creer un batch",
      createDescription:
        "Demarrez un nouveau batch avec un nom et une ETA optionnelle, puis ajoutez les envois en attente une fois le batch enregistre.",
      detailTitle: "Detail / gestion du batch",
      detailDescription:
        "Gerez un batch operationnel, affectez des envois en attente et faites avancer les premiers statuts batch du noyau.",
      batchDetailsTitle: "Details du batch",
      batchDetailsDescription:
        "Gardez le nom du batch et l'ETA clairs afin que le reste de l'equipe comprenne facilement cette rotation.",
      createPanelTitle: "Creez d'abord le batch",
      createPanelBody:
        "Enregistrez d'abord les informations de base du batch ici. Une fois le dossier cree, vous pourrez affecter les envois en attente tout de suite.",
      createPanelNext:
        "Cet ecran garde la premiere configuration batch simple : enregistrez le batch, verifiez l'ETA, puis passez a l'affectation des envois.",
      createPanelStepOne: "1. Enregistrez le nom du batch et l'ETA optionnelle.",
      createPanelStepTwo: "2. Ajoutez les envois en attente une fois le dossier batch cree.",
      createPanelStepThree: "3. Faites avancer le batch par les changements de statut au fur et a mesure des operations.",
      saveCreateHint:
        "Creez d'abord le dossier batch. L'affectation des envois et les changements de statut s'ouvrent sur l'ecran suivant.",
      saveEditHint:
        "Enregistrez ici toute modification du nom du batch ou de l'ETA, puis utilisez les sections statut et envois ci-dessous pour gerer la rotation.",
      detailsLockedNotice:
        "Ce batch est verrouille. Reouvrez-le d'abord si vous devez ajouter un envoi oublie, retirer un envoi ou mettre a jour les details du batch.",
      detailsReadOnlyNotice:
        "Ce batch a deja depasse l'etape ouverte, donc les details du batch restent en lecture seule ici.",
      saveBatch: "Enregistrer les details du batch",
      successTitle: "Batch mis a jour",
      saveSuccess: "Les details du batch ont ete enregistres avec succes.",
      statusSuccess: "Le statut du batch a ete mis a jour avec succes.",
      reopenSuccess: "Le batch a ete rouvert et peut de nouveau etre modifie.",
      addShipmentSuccess: "L'envoi a ete ajoute au batch avec succes.",
      removeShipmentSuccess: "L'envoi a ete retire du batch avec succes.",
      notFoundTitle: "Batch introuvable",
      notFoundBody:
        "Impossible de trouver un batch enregistre pour ce vendeur et cette route.",
      statusSectionTitle: "Statut du batch",
      statusSectionDescription:
        "Faites avancer le batch seulement par les prochains statuts pratiques prevus dans cette tranche.",
      statusActionsTitle: "Prochaines actions de statut disponibles",
      statusActionsDescription:
        "Utilisez seulement les prochaines actions de statut affichees ici afin que le batch reste aligne avec le flux operationnel actuel.",
      receivingStageTitle: "Controles cote reception",
      receivingStageDescriptions: {
        arrived:
          "Ce batch a atteint le cote reception. Faites-le passer en retrait ou en livraison finale quand l'agence est prete pour l'etape suivante.",
        ready_for_pickup:
          "Ces envois sont maintenant prets a l'agence de reception. Marquez chaque envoi comme recupere au fur et a mesure des retraits clients.",
        out_for_last_mile_delivery:
          "Ces envois sont deja sur la derniere etape locale. Marquez chaque envoi comme recupere une fois la remise terminee.",
      },
      receivingSummaryTitle: "Resume de la phase reception",
      receivingSummaryDescription:
        "Utilisez ces compteurs pour voir ce qui attend a l'agence, ce qui est deja en prise en charge locale et ce qui a deja ete recupere.",
      delayEtaTitle: "Mise a jour ETA retard / douane",
      delayEtaDescription:
        "Les batchs retardes et en blocage douane ont besoin d'une ETA revisee avant que le nouveau statut soit enregistre.",
      delayEtaDescriptions: {
        delayed:
          "Ce batch est retarde. Enregistrez ici la derniere ETA afin que les envois lies et le suivi public affichent tous la nouvelle estimation.",
        customs_hold:
          "Ce batch est en blocage douane. Enregistrez ici la derniere ETA afin que les envois lies et le suivi public affichent tous la nouvelle estimation.",
      },
      delayEtaDateHelp:
        "Choisissez la date d'arrivee revisee qui doit devenir l'ETA active pour ce batch.",
      delayEtaTimeHelp:
        "Choisissez l'heure d'arrivee revisee qui doit devenir l'ETA active pour ce batch.",
      delayEtaDateError:
        "Ajoutez la date ETA revisee si vous voulez enregistrer une heure ETA revisee.",
      delayEtaTimeError:
        "Ajoutez l'heure ETA revisee si vous voulez enregistrer une date ETA revisee.",
      delayEtaRequired:
        "Ajoutez la date et l'heure ETA revisees avant d'enregistrer cette mise a jour de retard.",
      delayEtaPreviewTitle: "Apercu de l'ETA revisee",
      saveEtaAndChangePrefix: "Enregistrer l'ETA et changer le statut vers",
      updateEtaOnly: "Mettre a jour l'ETA seulement",
      delayEtaUpdateSuccess: "L'ETA revisee a ete enregistree avec succes.",
      delayStatusSuccess: "Le statut du batch et l'ETA revisee ont ete enregistres avec succes.",
      reopenTitle: "Faut-il rouvrir ce batch ?",
      reopenBody:
        "Utilisez cela seulement si un envoi a ete oublie ou si une correction est necessaire avant que le batch n'avance davantage. La reouverture remet le batch a ouvert afin que vous puissiez modifier les details et l'affectation des envois.",
      reopenBatch: "Rouvrir le batch",
      noFurtherStatusActions:
        "Aucun autre changement de statut n'est disponible pour ce batch dans la tranche actuelle.",
      inBatchTitle: "Envois deja dans ce batch",
      inBatchDescription:
        "Ces envois sont deja regroupes dans le batch actuel.",
      inBatchEmpty:
        "Aucun envoi n'a encore ete ajoute a ce batch. Ajoutez des envois en attente depuis le panneau de droite quand vous etes pret.",
      availableShipmentsTitle: "Envois en attente disponibles pour affectation",
      availableShipmentsDescription:
        "Seuls les envois en attente qui ne sont pas deja affectes a un autre batch apparaissent ici.",
      availableShipmentsEmpty:
        "Aucun envoi en attente n'est disponible a ajouter pour le moment. Creez d'abord d'autres envois si cette rotation a encore besoin d'articles.",
      assignmentLockedNotice:
        "L'affectation des envois est disponible seulement quand le batch est ouvert. Rouvrez d'abord un batch verrouille si vous devez faire une correction.",
      addShipment: "Ajouter l'envoi",
      removeShipment: "Retirer l'envoi",
      markCollected: "Marquer comme recupere",
      markCollectedSuccess: "L'envoi a ete marque comme recupere.",
      pickupManagementTitle: "Liste retrait / reception",
      pickupManagementDescription:
        "Utilisez cette liste pour voir ce qui attend le retrait ou la livraison locale et marquer chaque remise terminee comme recuperee.",
      shipmentTracking: "Suivi",
      shipmentParties: "Expediteur / destinataire",
      shipmentReceiver: "Destinataire",
      shipmentSender: "Expediteur",
      shipmentDestination: "Destination",
      shipmentDestinationMissing: "Destination non definie",
      shipmentDestinationBranch: "Agence de destination",
      shipmentDestinationBranchMissing: "Aucune agence liee",
      shipmentDestinationBranchLocationMissing: "Aucune ville d'agence enregistree pour le moment",
      shipmentMode: "Mode",
      changeStatusPrefix: "Changer le statut vers",
      statusOptions: {
        open: "Ouvert",
        locked: "Verrouille",
        shipped: "Expedie",
        delayed: "Retarde",
        customs_hold: "Blocage douane",
        arrived: "Arrive",
        ready_for_pickup: "Pret pour retrait",
        out_for_last_mile_delivery: "En cours de livraison finale",
      },
      shipmentStatusOptions: {
        draft: "Brouillon",
        pending: "En attente",
        in_batch: "Dans un batch",
        in_transit: "En transit",
        delayed: "Retarde",
        customs_hold: "Blocage douane",
        arrived: "Arrive",
        ready_for_pickup: "Pret pour retrait",
        out_for_last_mile_delivery: "En cours de livraison finale",
        collected: "Recupere",
        returned: "Retourne",
        cancelled: "Annule",
      },
    },
    shipmentIntake: {
      title: "Nouvel intake d'envoi",
      description:
        "Creez le premier vrai dossier d'envoi pour votre entreprise active avec une recherche client simple et les details d'intake essentiels.",
      noVendorTitle: "Dossier vendeur actif indisponible",
      noVendorBody:
        "Impossible de trouver le dossier vendeur actif necessaire pour creer un envoi.",
      lookupTitle: "Recherche client",
      lookupDescription:
        "Recherchez le client dans la liste de votre entreprise active par numero de telephone de l'expediteur avant de saisir de nouvelles informations.",
      lookupAction: "Rechercher l'expediteur",
      lookupPhoneRequiredTitle: "Telephone expediteur requis",
      lookupPhoneRequiredBody:
        "Entrez un numero de telephone expediteur valide avant de lancer la recherche client.",
      lookupFoundTitle: "Client trouve",
      lookupFoundBody: "Les details existants de l'expediteur ont ete charges pour",
      lookupNotFoundTitle: "Client introuvable",
      lookupNotFoundBody:
        "Aucun dossier expediteur existant ne correspond a ce numero. Continuez a saisir les details expediteur directement.",
      lookupErrorTitle: "La recherche n'a pas pu se terminer",
      senderSection: "Details expediteur",
      senderSectionHelp:
        "Si la recherche ne trouve pas de client, completez ici les details expediteur et ils seront enregistres dans le scope vendeur.",
      senderPhone: "Telephone expediteur",
      senderName: "Nom expediteur",
      senderNameHelp: "Utilisez le nom que l'equipe vendeur doit voir pour cet expediteur.",
      senderNameError: "Entrez le nom de l'expediteur.",
      senderWhatsApp: "Numero WhatsApp expediteur",
      senderEmail: "E-mail expediteur",
      senderEmailHelp: "Optionnel. Ajoutez un e-mail seulement si l'expediteur l'utilise.",
      receiverSection: "Details destinataire",
      receiverSectionHelp:
        "Capturez les details de contact de base du destinataire pour cet envoi.",
      receiverPhone: "Telephone destinataire",
      receiverName: "Nom destinataire",
      receiverNameHelp: "Utilisez le nom que l'agence de retrait reconnaitra.",
      receiverNameError: "Entrez le nom du destinataire.",
      receiverWhatsApp: "Numero WhatsApp destinataire",
      receiverEmail: "E-mail destinataire",
      receiverEmailHelp: "Optionnel. Ajoutez un e-mail seulement si le destinataire l'utilise.",
      shipmentSection: "Bases de l'envoi",
      shipmentSectionHelp:
        "Gardez cette premiere tranche d'intake simple : route, mode, contenu, poids, quantite et categorie.",
      originCountry: "Pays d'origine",
      originCountryPlaceholder: "Choisir le pays d'origine",
      originCountryHelp:
        "Ce champ part de l'origine par defaut du vendeur, mais vous pouvez le changer pour cet envoi.",
      originCountryError: "Choisissez le pays d'origine.",
      originCity: "Ville d'origine",
      originCityHelp: "Entrez la ville d'origine de cet envoi.",
      originCityError: "Entrez la ville d'origine.",
      destinationBranch: "Agence de destination",
      destinationBranchPlaceholder: "Choisir un bureau de retrait / destination enregistre",
      destinationBranchHelp:
        "Choisissez la vraie agence de reception vers laquelle cet envoi part. Le pays enregistre de l'agence se remplira automatiquement ici.",
      destinationBranchError: "Choisissez l'agence de destination pour cet envoi.",
      destinationBranchCountryError:
        "L'agence choisie n'a pas de pays enregistre. Mettez cette agence a jour avant de creer cet envoi.",
      destinationBranchLoadErrorTitle: "Impossible de charger les agences de destination",
      destinationBranchEmptyTitle: "Ajoutez d'abord une agence de destination",
      destinationBranchEmptyBody:
        "Ce vendeur n'a pas encore de bureau de retrait / destination enregistre, donc l'intake ne peut pas viser un vrai bureau de reception.",
      destinationBranchEmptyCta: "Ouvrir la gestion des agences",
      destinationBranchSummary: "Agence de destination choisie",
      destinationBranchAddress: "Adresse d'agence enregistree",
      destinationBranchAddressMissing: "Aucune adresse d'agence enregistree pour le moment",
      destinationCountry: "Pays de destination",
      destinationCountryPlaceholder: "Choisir le pays de destination",
      destinationCountryHelp: "Choisissez le pays ou cet envoi doit arriver.",
      destinationCountryError: "Choisissez le pays de destination.",
      destinationCountryDerivedHelp:
        "Ce pays est derive de l'agence de destination choisie afin que l'envoi reste lie a un vrai bureau de reception.",
      destinationCity: "Ville de destination",
      destinationCityHelp: "Entrez la ville de destination de cet envoi.",
      destinationCityAutoHelp:
        "Cette ville a ete pre-remplie a partir de l'agence choisie. Vous pouvez quand meme l'ajuster si cet envoi a besoin d'une destination plus precise.",
      destinationCityManualHelp:
        "Entrez la ville de destination de cet envoi. L'agence choisie n'a pas encore de ville enregistree, donc vous pouvez la renseigner ici pour le moment.",
      destinationCityError: "Entrez la ville de destination.",
      shippingMode: "Mode d'expedition",
      shippingModeHelp: "Choisissez le mode utilise par le vendeur pour cet envoi.",
      shippingModeError: "Choisissez le mode d'expedition.",
      shippingModeOptions: {
        air: "Aerien",
        sea: "Maritime",
        "road-bus": "Route / bus",
      },
      contentsDescription: "Description du contenu",
      contentsDescriptionPlaceholder: "Par exemple : 2 telephones et accessoires",
      contentsDescriptionHelp:
        "Gardez une description pratique pour l'intake et les operations suivantes.",
      contentsDescriptionError: "Entrez la description du contenu.",
      weightKg: "Poids (kg)",
      weightKgPlaceholder: "Par exemple : 4.5",
      weightKgHelp: "Utilisez des kilogrammes dans cette premiere tranche d'intake.",
      weightError: "Entrez un poids valide superieur a zero.",
      quantity: "Quantite",
      quantityHelp: "Entrez le nombre de colis ou d'articles dans cet envoi.",
      quantityError: "Entrez une quantite valide superieure a zero.",
      category: "Categorie",
      categoryPlaceholder: "Choisir une categorie d'envoi",
      categoryHelp:
        "Utilisez une categorie geree par la plateforme pour garder l'intake propre. Choisissez Autre seulement si l'envoi ne rentre pas dans la liste.",
      categoryError: "Choisissez la categorie de l'envoi.",
      categoryOptions: {
        Documents: "Documents",
        Electronics: "Electronique",
        Clothing: "Vetements",
        Food: "Alimentaire",
        Fragile: "Fragile",
        Household: "Menage",
        Medical: "Medical",
        Other: "Autre",
      },
      categoryOther: "Autre categorie",
      categoryOtherPlaceholder: "Precisez la categorie d'envoi",
      categoryOtherHelp:
        "Ajoutez le nom de categorie que le personnel doit voir quand l'envoi ne correspond pas a la liste geree.",
      categoryOtherError: "Precisez la categorie de l'envoi.",
      pricingSection: "Bases de tarification",
      pricingSectionHelp:
        "Utilisez la regle tarifaire par defaut du vendeur quand elle existe, puis ajustez le prix de l'envoi ou ajoutez une remise simple si necessaire.",
      pricingDefaultLabel: "Regle tarifaire par defaut du vendeur",
      pricingRulePerKg: "Par kilogramme",
      pricingRuleFlatFee: "Forfait par article",
      pricingRuleManual: "Tarification manuelle",
      pricingDefaultUnavailable: "Aucun tarif enregistre n'est encore disponible",
      perKgSuffix: " / kg",
      perItemSuffix: " / article",
      basePrice: "Prix de base",
      basePricePlaceholder: "Par exemple : 15000",
      basePriceHelp: "Entrez le prix de base convenu pour cet envoi.",
      basePriceManualHelp:
        "Ce vendeur utilise une tarification manuelle par defaut, donc entrez directement le prix de base de l'envoi.",
      basePriceMissingDefaultHelp:
        "Cette methode tarifaire par defaut a besoin d'un tarif enregistre avant de pouvoir calculer automatiquement, donc entrez le prix manuellement pour le moment.",
      basePriceAwaitingWeightHelp:
        "Entrez le poids de l'envoi pour calculer automatiquement le prix de base a partir de la regle par kilogramme du vendeur.",
      basePriceAwaitingQuantityHelp:
        "Entrez la quantite de l'envoi pour calculer automatiquement le prix de base a partir du forfait par article du vendeur.",
      basePriceAutoPerKgHelp:
        "Le prix de base est calcule automatiquement a partir de la valeur par kilogramme enregistree, mais vous pouvez toujours le modifier pour cet envoi.",
      basePriceAutoFlatFeeHelp:
        "Le prix de base est calcule automatiquement a partir du forfait par article enregistre, mais vous pouvez toujours le modifier pour cet envoi.",
      basePriceOverrideHelp:
        "Vous avez remplace le calcul par defaut pour cet envoi. Le total enregistre ci-dessous se met a jour immediatement.",
      basePriceError: "Entrez un prix de base valide.",
      discountAmount: "Remise",
      discountAmountPlaceholder: "Montant de remise optionnel",
      discountAmountHelp:
        "Optionnel. Entrez un seul montant de remise pour cet envoi et le total ci-dessous sera mis a jour.",
      discountAmountError: "Entrez un montant de remise valide.",
      discountAmountExceedsBaseError:
        "La remise ne peut pas etre superieure au prix de base.",
      paymentStatus: "Statut de paiement",
      paymentStatusHelp:
        "Choisissez non paye ou totalement paye a l'intake. Enregistrez un paiement partiel plus tard depuis le detail d'envoi quand le montant exact encaisse est connu.",
      paymentStatusError: "Choisissez le statut de paiement.",
      paymentStatusOptions: {
        unpaid: "Non paye",
        partial: "Partiel",
        paid: "Paye",
      },
      pricingSummaryTitle: "Resume tarifaire",
      pricingSummaryHelp:
        "Verifiez le prix de base actuel, la remise et le total avant de creer l'envoi.",
      summaryBasePrice: "Prix de base",
      summaryDiscount: "Remise",
      summaryTotal: "Total",
      referenceNote: "Reference / note",
      referenceNotePlaceholder: "Note optionnelle ou reference client",
      referenceNoteHelp:
        "Optionnel. Ajoutez une note courte ou une reference seulement si cela aide cet intake.",
      submit: "Creer l'envoi",
      reset: "Reinitialiser le formulaire",
      successTitle: "Envoi cree",
      successBody:
        "Le dossier d'envoi, les dossiers clients, le resume tarifaire et le numero de suivi ont ete enregistres avec succes.",
      openShippingLabel: "Ouvrir l'etiquette d'expedition",
      summaryTracking: "Numero de suivi",
      summaryRoute: "Route",
      summaryDestinationBranch: "Agence de destination",
      summaryDestinationBranchFallback: "Enregistree sur le dossier d'envoi",
      summaryParties: "Expediteur / destinataire",
      summaryShipment: "Resume d'envoi",
      summaryWeightQuantity: "Poids / quantite",
      summaryPaymentStatus: "Statut de paiement",
      createAnother: "Creer un autre envoi",
      openShipmentDetail: "Ouvrir le detail de l'envoi",
    },
    shipmentDetail: {
      title: "Detail de l'envoi",
      description:
        "Ouvrez un envoi et voyez le vrai dossier operationnel, l'etat actuel, la tarification, la route et la timeline des statuts au meme endroit.",
      loadingBody: "Chargement du dossier d'envoi et de la timeline.",
      successTitle: "Action sur l'envoi terminee",
      openShippingLabel: "Ouvrir l'etiquette d'expedition",
      noVendorTitle: "Dossier vendeur actif indisponible",
      noVendorBody:
        "Impossible de trouver le dossier vendeur actif necessaire pour ouvrir le detail d'envoi.",
      notFoundTitle: "Envoi introuvable",
      notFoundBody:
        "Impossible de trouver un envoi enregistre pour ce vendeur et cette route.",
      currentStatus: "Statut actuel",
      createdAt: "Cree",
      eta: "ETA operationnelle",
      etaHelp: "Quand cet envoi est lie a un batch, l'ETA du batch est l'ETA utilisee ici.",
      etaEmpty: "Aucune ETA batch disponible pour le moment",
      linkedBatch: "Batch lie",
      noLinkedBatch: "Pas encore lie a un batch",
      openLinkedBatch: "Ouvrir le batch lie",
      removeFromBatch: "Retirer du batch",
      removeFromBatchLocked:
        "Cet envoi ne peut etre retire du batch lie que tant que ce batch reste ouvert.",
      senderSection: "Expediteur",
      receiverSection: "Destinataire",
      routeSection: "Route et operations",
      routeSectionHelp:
        "Utilisez cette section pour confirmer d'ou l'envoi est parti, ou il va et a quelle agence operationnelle il est lie.",
      origin: "Origine",
      destination: "Destination",
      destinationBranch: "Agence de destination",
      destinationBranchMissing: "Aucune agence de destination enregistree sur cet envoi",
      shippingMode: "Mode d'expedition",
      parcelSection: "Details du colis",
      parcelSectionHelp:
        "Gardez le contenu, le poids, la quantite, la categorie et la note lisibles pour les operations quotidiennes.",
      contentsDescription: "Description du contenu",
      weight: "Poids",
      quantity: "Quantite",
      category: "Categorie",
      referenceNote: "Reference / note",
      referenceNoteEmpty: "Aucune note de reference enregistree",
      pricingSection: "Resume tarifaire",
      pricingSectionHelp:
        "Cette section montre les valeurs tarifaires d'intake enregistrees pour l'envoi, y compris la remise et l'etat actuel du paiement.",
      paymentStatus: "Statut de paiement",
      amountPaid: "Montant paye",
      amountDue: "Montant restant",
      amountDueHelp:
        "Le montant restant se met a jour immediatement a partir du total de l'envoi et du montant deja paye.",
      paymentMethod: "Mode de paiement",
      paymentMethodEmpty: "Aucun mode de paiement enregistre pour le moment",
      paymentMethodPlaceholder: "Choisir un mode de paiement",
      paymentMethodHelp:
        "Optionnel. Enregistrez le mode de paiement quand l'equipe sait comment le client a paye cet envoi.",
      paymentMethodOptions: {
        cash: "Especes",
        zelle: "Zelle",
        cashapp: "Cash App",
        mobile_money: "Mobile money",
        card: "Carte",
        other: "Autre",
      },
      paymentNote: "Note de paiement",
      paymentNoteEmpty: "Aucune note de paiement enregistree pour le moment",
      paymentNotePlaceholder: "Note de paiement optionnelle",
      paymentNoteHelp:
        "Optionnel. Enregistrez une courte note seulement si elle aide l'equipe a comprendre la situation de paiement actuelle.",
      paymentActionTitle: "Enregistrer le paiement sur cet envoi",
      paymentActionDescription:
        "Mettez a jour le montant deja paye, le mode de paiement et une courte note de paiement directement sur le dossier d'envoi.",
      amountPaidInput: "Montant deja paye",
      amountPaidHelp:
        "Entrez le montant total deja encaisse pour cet envoi dans la devise enregistree du vendeur.",
      amountPaidError: "Entrez un montant paye valide superieur ou egal a zero.",
      amountPaidExceedsTotalError:
        "Le montant paye ne peut pas etre superieur au total de l'envoi.",
      paymentStatusAutoHelp:
        "Le statut de paiement est calcule automatiquement a partir du montant paye que vous enregistrez ici.",
      savePaymentUpdate: "Enregistrer la mise a jour du paiement",
      markFullyPaid: "Marquer comme totalement paye",
      paymentUpdateSuccess: "Le dossier de paiement de l'envoi a ete mis a jour avec succes.",
      batchActionsTitle: "Actions batch",
      batchActionsDescription:
        "Utilisez le detail d'envoi pour affecter cet envoi a un batch ouvert ou le retirer d'un batch ouvert lie sans quitter le dossier.",
      alreadyLinkedTitle: "Cet envoi est deja lie a un batch",
      alreadyLinkedBodyEditable:
        "Le batch lie est encore ouvert, donc vous pouvez retirer l'envoi ici si les operations doivent corriger le regroupement.",
      alreadyLinkedBodyLocked:
        "Le batch lie n'est plus ouvert, donc le lien batch reste en lecture seule depuis cet ecran de detail.",
      notEligibleTitle: "L'affectation batch n'est pas disponible pour le moment",
      notEligibleBody:
        "Seuls les envois en attente qui ne sont pas deja lies a un batch peuvent etre affectes depuis cet ecran dans le modele operationnel actuel.",
      assignToExistingTitle: "Affecter a un batch existant",
      assignToExistingBody:
        "Choisissez ci-dessous l'un des batchs ouverts du vendeur pour regrouper cet envoi en attente dans une rotation operationnelle.",
      assignToThisBatch: "Affecter a ce batch",
      openBatch: "Ouvrir le batch",
      noAssignableBatches:
        "Aucun batch ouvert n'est disponible pour l'affectation pour le moment. Creez-en un ci-dessous si cet envoi doit etre groupe maintenant.",
      createBatchTitle: "Creer un batch et affecter cet envoi",
      createBatchBody:
        "Si aucun batch adapte n'existe encore, creez ici un nouveau batch ouvert et affectez immediatement cet envoi.",
      createBatchAndAssign: "Creer le batch et affecter",
      createAndAssignSuccess:
        "Le nouveau batch a ete cree et l'envoi a ete affecte avec succes.",
      createBatchNameHelp:
        "Utilisez un nom de batch pratique que l'equipe operations reconnaitra plus tard.",
      batchNameError: "Entrez le nom du batch avant de le creer depuis le detail d'envoi.",
      etaDateError: "Ajoutez la date ETA si vous voulez enregistrer une heure ETA.",
      etaTimeError: "Ajoutez l'heure ETA si vous voulez enregistrer une date ETA.",
      assignSuccess: "L'envoi a ete affecte au batch choisi avec succes.",
      unassignSuccess: "L'envoi a ete retire du batch lie avec succes.",
      timelineTitle: "Timeline de statut",
      timelineDescription:
        "Suivez ici les changements de statut operationnel enregistres au fur et a mesure que l'envoi avance dans le flux batch.",
      timelineEmpty: "Aucun evenement de timeline enregistre n'est encore disponible pour cet envoi.",
      timelineBatch: "Batch :",
      notAvailable: "Indisponible",
      timelineEventKinds: {
        created: "Envoi cree",
        status_change: "Statut mis a jour",
        batch_linked: "Ajoute au batch",
        batch_unlinked: "Retire du batch",
        eta_updated: "ETA mise a jour",
      },
    },
    publicTracking: {
      title: "Suivre un envoi",
      description:
        "Ouvrez un envoi par numero de suivi et voyez le vrai statut client et les details de route sans vous connecter.",
      searchTitle: "Recherche de suivi",
      searchDescription:
        "Entrez le numero de suivi de l'envoi pour afficher son etat public actuel.",
      searchPlaceholder: "Entrez le numero de suivi",
      searchAction: "Suivre l'envoi",
      loadingBody: "Chargement du dossier de suivi public.",
      emptyTitle: "Entrez un numero de suivi",
      emptyBody:
        "Utilisez le numero de suivi du recu ou de l'etiquette pour ouvrir la vue de suivi public.",
      notFoundTitle: "Numero de suivi introuvable",
      notFoundBody:
        "Impossible de trouver un envoi correspondant a ce numero de suivi.",
      customerSafeNotice:
        "Cette page n'affiche que les informations de suivi qui peuvent etre partagees avec le client.",
      currentStatus: "Statut actuel",
      createdAt: "Cree",
      eta: "ETA",
      etaHelp: "L'ETA vient du vrai dossier batch operationnel quand elle a ete definie.",
      etaEmpty: "Aucune ETA pour le moment",
      vendorReference: "Pris en charge par",
      vendorReferenceUnavailable: "Vendeur CarryMatch",
      routeSection: "Route",
      routeSectionDescription:
        "Utilisez cette section pour confirmer d'ou l'envoi est parti, ou il va et a quelle agence de reception il est lie.",
      origin: "Origine",
      destination: "Destination",
      destinationBranch: "Agence de destination",
      destinationBranchMissing: "Aucune agence de destination enregistree sur cet envoi",
      destinationBranchAddress: "Adresse de retrait / agence",
      shippingMode: "Mode d'expedition",
      summarySection: "Resume de l'envoi",
      summarySectionDescription:
        "Ce resume public garde seulement les details de base de l'envoi qui peuvent etre affiches en toute securite.",
      contentsDescription: "Description du contenu",
      category: "Categorie",
      quantity: "Quantite",
      weight: "Poids",
      timelineTitle: "Timeline de statut",
      timelineDescription:
        "Suivez ici le vrai historique de statut deja enregistre pour cet envoi.",
      timelineEmpty: "Aucune entree de timeline publique n'est encore disponible pour cet envoi.",
      timelineEventKinds: {
        created: "Envoi cree",
        status_change: "Statut mis a jour",
        batch_linked: "Regroupe pour transit",
        batch_unlinked: "Routage mis a jour",
        eta_updated: "ETA mise a jour",
      },
      notAvailable: "Indisponible",
    },
    shell: {
      currentState: "Etat d'acces actuel",
      profileFallback:
        "Les tables d'onboarding applicatives ne sont pas encore totalement disponibles, donc le routage utilise le meilleur repli disponible.",
    },
    notFound: {
      title: "Page introuvable",
      body: "Cette route est hors de la tranche launch-core actuelle.",
    },
  },
};

const resolveLanguageValue = () => {
  const persisted = window.localStorage.getItem(STORAGE_KEY);
  if (persisted === "en" || persisted === "fr") return persisted;
  return window.navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en";
};

const getValueByPath = (source, key) =>
  key.split(".").reduce((value, segment) => (value ? value[segment] : undefined), source);

export const I18nProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => resolveLanguageValue());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const contextValue = useMemo(() => {
    const t = (key) => {
      const activeLanguage = translations[language] ?? translations.en;
      return getValueByPath(activeLanguage, key) ?? getValueByPath(translations.en, key) ?? key;
    };

    return { language, setLanguage, t, supportedLanguages: ["en", "fr"] };
  }, [language]);

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within an I18nProvider");
  return context;
};
