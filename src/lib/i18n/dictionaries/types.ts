export type Dictionary = {
  common: {
    signIn: string;
    backToHome: string;
    langEnglish: string;
    langFilipino: string;
  };
  home: {
    nav: { howItWorks: string; about: string };
    hero: {
      badge: string;
      titleLine1: string;
      titleLine2: string;
      subtitle: string;
      ctaHowItWorks: string;
      ctaSignIn: string;
      /** {rating} and {count} placeholders, e.g. "Rated {rating}/5 from {count}+ pieces of feedback" */
      ratingText: string;
      tapHint: string;
    };
    floatingCards: {
      saveToContacts: string;
      studioLead: string;
      tapToConnect: string;
      worksAnyPhone: string;
      oneProfile: string;
      cardsLinked: string;
      editOnce: string;
      updatesInstantly: string;
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
