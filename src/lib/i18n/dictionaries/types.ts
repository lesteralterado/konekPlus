type Beat = { title: string; body: string };

export type UseCaseId = "realtor" | "sales" | "creative" | "events" | "business";

export type Dictionary = {
  common: {
    signIn: string;
    backToHome: string;
    langEnglish: string;
    langFilipino: string;
  };
  home: {
    nav: { howItWorks: string; about: string; product: string; faq: string; order: string };
    hero: {
      badge: string;
      titleLine1: string;
      titleLine2: string;
      subtitle: string;
      ctaHowItWorks: string;
      /** {price} placeholder — the lowest finish price, e.g. "Get your card · from {price}" */
      ctaOrder: string;
      /** {rating} and {count} placeholders, e.g. "Rated {rating}/5 from {count}+ pieces of feedback" */
      ratingText: string;
      // Trust row — only claims Lester has confirmed are true.
      trustPayment: string;
      trustGuarantee: string;
      trustCompatibility: string;
    };
    deck: {
      hint: string;
      flipHint: string;
      flipBack: string;
      perCard: string;
      popular: string;
      chooseFinish: string;
      finishes: Record<
        "obsidian" | "frost" | "titanium" | "linen" | "aurora",
        { tagline: string; description: string }
      >;
    };
    tryIt: {
      kicker: string;
      heading: string;
      body: string;
      madeFor: string;
      useCases: Record<UseCaseId, { label: string; name: string; role: string; action: string }>;
      dragHint: string;
      tapHint: string;
      whereToTap: string;
      qrToggle: string;
      nfcToggle: string;
      scanning: string;
      saveContact: string;
      saved: string;
      tryAgain: string;
      /** Shown on the demo phone's lock screen. */
      holdNear: string;
    };
    /** Short benefit phrases for the scrolling strip. Only true claims. */
    marquee: string[];
    unboxing: {
      kicker: string;
      // Exactly three, timed to the clip: closed box → lid opens → card.
      beats: [Beat, Beat, Beat];
    };
    about: {
      kicker: string;
      headingPrefix: string;
      headingMiddle: string;
      headingSuffix: string;
      body: string;
      statCardsClaimed: string;
      statSyncLabel: string;
      statSyncValue: string;
      statTapsServed: string;
      statAlwaysInSync: string;
      statOneTap: string;
      statEveryCard: string;
    };
    gallery: {
      kicker: string;
      heading: string;
      imageComingSoon: string;
      items: { title: string; description: string }[];
    };
    cta: { headingPrefix: string; headingSuffix: string; body: string; button: string };
    order: {
      kicker: string;
      heading: string;
      subtitle: string;
      finishLabel: string;
      quantityLabel: string;
      decrease: string;
      increase: string;
      /** {qty} and {pct} placeholders, e.g. "{qty}+ cards: save {pct}%" */
      tier: string;
      /** {amount} placeholder */
      youSave: string;
      total: string;
      paymentLabel: string;
      paymentCod: string;
      paymentGcash: string;
      nameLabel: string;
      phoneLabel: string;
      emailLabel: string;
      addressLabel: string;
      notesLabel: string;
      notesPlaceholder: string;
      /** {total} placeholder */
      submit: string;
      submitting: string;
      guarantee: string;
      noPaymentNow: string;
      successTitle: string;
      /** {reference} and {phone} placeholders */
      successBody: string;
      orderAnother: string;
      errors: Record<
        "finish" | "quantity" | "name" | "phone" | "email" | "address" | "payment" | "server",
        string
      >;
    };
    /** {price} placeholder — the lowest finish price */
    stickyCta: { from: string; order: string };
    faq: { kicker: string; heading: string; items: { q: string; a: string }[] };
    finalCta: { headingPrefix: string; headingSuffix: string; body: string; button: string };
    footer: {
      tagline: string;
      productKicker: string;
      legalKicker: string;
      privacyPolicy: string;
      termsOfService: string;
      rights: string;
    };
  };
  guide: {
    kicker: string;
    heading: string;
    subtitle: string;
    outsideLabel: string;
    insideLabel: string;
    swipeHint: string;
    stepsHeading: string;
    steps: { title: string; body: string }[];
    androidNote: string;
    proTip: string;
    noAppNeeded: string;
    viewFullGuide: string;
    backToDashboard: string;
    pageTitle: string;
    pageSubtitle: string;
    /** Alt text for the six leaflet panels, in carousel order. */
    panelAlts: string[];
    outsideAlt: string;
    insideAlt: string;
  };
  tagStatus: {
    invalidCardTitle: string;
    invalidCardBody: string;
    unavailableTitle: string;
    unavailableBody: string;
  };
  claimForm: {
    title: string;
    subtitle: string;
    tabNew: string;
    tabExisting: string;
    fullName: string;
    jobTitle: string;
    company: string;
    phone: string;
    email: string;
    password: string;
    passwordMin: string;
    submitNew: string;
    submitNewPending: string;
    submitExisting: string;
    submitExistingPending: string;
  };
  profile: {
    saveToContacts: string;
    call: string;
    email: string;
    editButton: string;
    portfolioHeading: string;
    feedbackHeading: string;
    leaveFeedback: string;
    leaveFeedbackFor: string;
    testimonialNamePlaceholder: string;
    testimonialMessagePlaceholder: string;
    testimonialRatingLabel: string;
    testimonialSubmit: string;
    testimonialSending: string;
    testimonialThanksTitle: string;
    testimonialThanksBody: string;
    testimonialAnother: string;
    anonymous: string;
    share: string;
    copied: string;
  };
  feedbackWidget: {
    buttonLabel: string;
    dialogTitle: string;
    dialogSubtitle: string;
    thanksTitle: string;
    thanksBody: string;
    sendAnother: string;
    categoryGeneral: string;
    categoryBug: string;
    categoryFeature: string;
    messagePlaceholder: string;
    ratingLabel: string;
    screenshotLabel: string;
    submit: string;
    sending: string;
  };
  feedbackPage: {
    title: string;
    subtitle: string;
  };
  keychain: {
    heading: string;
    subheading: string;
    added: string;
    keychainCountSingular: string;
    keychainCountPlural: string;
    continue: string;
    backToSummary: string;
    back: string;
    findAccount: string;
    pasteLink: string;
    pasteLinkHint: string;
    displayNameOptional: string;
    confirmAccount: string;
    linkErrorEmpty: string;
    linkErrorMismatch: string;
    yourKeychains: string;
    addAnother: string;
    total: string;
    yourDetails: string;
    fullNamePlaceholder: string;
    phonePlaceholder: string;
    emailPlaceholder: string;
    submit: string;
    submitting: string;
    submitErrorName: string;
    submitErrorContact: string;
    submitErrorGeneric: string;
    doneTitle: string;
    doneBody: string;
  };
};
