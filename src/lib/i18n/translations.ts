export type Locale = "en" | "el";
export const LOCALES: Locale[] = ["en", "el"];

const en = {
  appName: "pickle",
  languageLabel: "Language",
  getTheApp: "Get the app",
  editProfile: "Edit your name and avatar",

  // Landing — hero
  heroEyebrow: "Group polls for your crew",
  heroTitle: "Can't decide? Pickle it.",
  heroBody:
    "Ask a question, share one link, and let the group settle it. Live results, friendly suggestions, and a clear winner at the end.",
  ctaAndroid: "Get the Android app",
  ctaHow: "See how it works",
  heroNote: "Voters don't need the app. They just open the link.",

  // Landing — demo poll
  demoQuestion: "Pizza night: what are we ordering?",
  demoOption1: "Detroit-style from Emmy's",
  demoOption2: "Pepperoni from Slice House",
  demoOption3: "Veggie supreme from Nino's",
  demoOption4: "Margherita from Lupa",

  // Landing — how it works
  howTitle: "Three taps to a decision",
  step1Title: "Ask the crew",
  step1Body: "Write a question and a few options in the Pickle app. Decide if people can suggest their own.",
  step2Title: "Share one link",
  step2Body: "Drop it in the group chat. Anyone with the link can vote from their browser in seconds.",
  step3Title: "Watch it land",
  step3Body: "Results update live as votes come in. Close the poll and Pickle crowns the winner.",

  // Landing — features
  featuresTitle: "Made for group chats",
  feature1Title: "No sign-up to vote",
  feature1Body: "Friends pick a name and an avatar, then vote. That's it.",
  feature2Title: "Live results",
  feature2Body: "Bars move as votes land, so you can see when it's neck and neck.",
  feature3Title: "Crew suggestions",
  feature3Body: "Let people add options, with or without your approval.",
  feature4Title: "Fair finishes",
  feature4Body: "Hide results until people vote, lock votes in, and call ties clearly.",

  // Landing — closing CTA
  ctaBandTitle: "Ready to break the tie?",
  ctaBandBody: "Create your first poll in under a minute.",
  landingHint: "Got a poll link from a friend? Open it to vote right here.",
  footerMadeWith: "Pickle · Group polls, settled.",

  // Footer banner on poll pages
  footerText: "Create your own polls with the Pickle app",
  footerCta: "Get it on Google Play",

  // States
  loading: "Loading poll…",
  notFoundTitle: "Poll not found",
  notFoundBody: "This link may be wrong, or the poll was deleted.",
  goHome: "Go to homepage",
  errorTitle: "Couldn't load the poll",
  errorBody: "Check your connection and try again.",
  retry: "Try again",

  // Status
  statusOpen: "Voting open",
  statusClosed: "Poll closed",
  startedAgo: "Started {time}",
  closedAgo: "Closed {time}",

  // Meta line
  votesSoFar: { one: "{n} vote so far", other: "{n} votes so far" },
  youVoted: "You voted",
  youAndOthers: { one: "You and {n} other voted", other: "You and {n} others voted" },
  votedOfExpected: "{x} of {n} voted",
  noVotesYet: "No votes yet. Be the first!",

  // Results
  inTheLead: "In the lead",
  winner: "Winner",
  tie: "It's a tie",
  tiedAtTop: "Tied at the top: {names}",
  leaderVotes: "{x} of {n} votes",
  aheadBy: "ahead by {n}",
  votesCount: { one: "{n} vote", other: "{n} votes" },
  votesIn: { one: "{n} vote in", other: "{n} votes in" },
  taglineClose: "still anyone's game",
  taglineClear: "a favourite is pulling ahead",
  taglineFinal: "final results",
  live: "Live: updates as votes land",
  yourPick: "Your pick",
  suggestedByYou: "Suggested by you",
  resultsHidden: "Results appear after you vote.",
  percent: "{n}%",

  // Voting
  pickOne: "Pick one",
  vote: "Vote",
  changeVote: "Change vote",
  changeMyVote: "Change my vote",
  keepVote: "Keep my vote",
  voting: "Voting…",
  selectAnOption: "Pick an option to vote",
  voteLocked: "Votes are locked in for this poll.",
  voteThanks: "Vote saved!",

  // Suggest
  suggestTitle: "Got a better idea?",
  suggestBodyApproval: "Suggest an option. The poll creator approves it first.",
  suggestBodyDirect: "Suggest an option. It joins the poll right away.",
  suggestLabel: "Your suggestion",
  suggestPlaceholder: "e.g. Tacos from Rosa's",
  suggestSubmit: "Suggest",
  suggestEmpty: "Type an option first.",
  suggestDuplicate: "That option is already on the list.",
  suggestSentPending: "Thanks! Your suggestion is waiting for approval.",
  suggestSentApproved: "Your option was added.",
  waitingApproval: "Waiting for approval",

  // Share
  shareLead: "Anyone with the link can vote:",
  shareLeadClosed: "Share the results:",
  copyLink: "Copy link",
  share: "Share",
  linkCopied: "Link copied",
  copyFailed: "Couldn't copy the link",

  // Errors
  errPollClosed: "This poll is closed, so it can't take votes.",
  errOptionUnavailable: "That option isn't available anymore.",
  errVoteLocked: "This poll doesn't allow changing your vote.",
  errGeneric: "Something went wrong. Please try again.",

  // Profile
  profileTitle: "Who's voting?",
  profileBody: "Pick a name and an avatar so the crew knows it's you.",
  displayName: "Display name",
  displayNameRequired: "Please enter a name.",
  avatarLabel: "Avatar",
  avatarOption: "Avatar {n}",
  shuffle: "Shuffle",
  shuffleLabel: "Show different avatars",
  continue: "Continue",
  cancel: "Cancel",
  saving: "Saving…",
  haveAccount: "Already have a Pickle account?",
  signInWithEmail: "Sign in with email",

  // Email auth
  emailTitle: "Sign in to Pickle",
  emailSignUpTitle: "Create a Pickle account",
  email: "Email",
  password: "Password",
  signIn: "Sign in",
  signUp: "Create account",
  noAccount: "New to Pickle?",
  createOne: "Create an account",
  haveAccountSignIn: "Have an account? Sign in",
  back: "Back",
  authInvalid: "Wrong email or password.",
  authCheckEmail: "Check your inbox to confirm your email, then sign in.",
  authGeneric: "Couldn't sign in. Please try again.",
};

export type Messages = typeof en;
export type MessageKey = {
  [K in keyof Messages]: Messages[K] extends string ? K : never;
}[keyof Messages];
export type PluralKey = {
  [K in keyof Messages]: Messages[K] extends string ? never : K;
}[keyof Messages];

const el: Messages = {
  appName: "pickle",
  languageLabel: "Γλώσσα",
  getTheApp: "Κατέβασε την εφαρμογή",
  editProfile: "Άλλαξε όνομα και avatar",

  heroEyebrow: "Ομαδικές ψηφοφορίες για την παρέα",
  heroTitle: "Δεν αποφασίζετε; Κάντε το pickle.",
  heroBody:
    "Κάνε μια ερώτηση, μοιράσου έναν σύνδεσμο και άσε την παρέα να αποφασίσει. Ζωντανά αποτελέσματα, προτάσεις από όλους και ξεκάθαρος νικητής στο τέλος.",
  ctaAndroid: "Κατέβασε την εφαρμογή Android",
  ctaHow: "Δες πώς λειτουργεί",
  heroNote: "Όσοι ψηφίζουν δεν χρειάζονται την εφαρμογή. Απλώς ανοίγουν τον σύνδεσμο.",

  demoQuestion: "Βραδιά πίτσας: τι παραγγέλνουμε;",
  demoOption1: "Detroit-style από το Emmy's",
  demoOption2: "Πεπερόνι από το Slice House",
  demoOption3: "Λαχανικών από του Νίνο",
  demoOption4: "Μαργαρίτα από τη Lupa",

  howTitle: "Τρία πατήματα ως την απόφαση",
  step1Title: "Ρώτα την παρέα",
  step1Body: "Γράψε μια ερώτηση και μερικές επιλογές στην εφαρμογή Pickle. Διάλεξε αν μπορούν να προτείνουν κι άλλες.",
  step2Title: "Μοιράσου έναν σύνδεσμο",
  step2Body: "Στείλ' τον στο group chat. Όποιος έχει τον σύνδεσμο ψηφίζει από τον browser σε δευτερόλεπτα.",
  step3Title: "Δες το αποτέλεσμα",
  step3Body: "Τα αποτελέσματα ανανεώνονται ζωντανά. Κλείσε την ψηφοφορία και το Pickle ανακηρύσσει τον νικητή.",

  featuresTitle: "Φτιαγμένο για group chats",
  feature1Title: "Ψήφος χωρίς εγγραφή",
  feature1Body: "Οι φίλοι σου διαλέγουν όνομα και avatar και ψηφίζουν. Τόσο απλά.",
  feature2Title: "Ζωντανά αποτελέσματα",
  feature2Body: "Οι μπάρες κινούνται με κάθε ψήφο, για να βλέπεις πότε είναι στήθος με στήθος.",
  feature3Title: "Προτάσεις από την παρέα",
  feature3Body: "Άσε τους άλλους να προσθέτουν επιλογές, με ή χωρίς την έγκρισή σου.",
  feature4Title: "Δίκαιο φινάλε",
  feature4Body: "Κρύψε τα αποτελέσματα μέχρι να ψηφίσουν, κλείδωσε τις ψήφους και ξεκαθάρισε τις ισοπαλίες.",

  ctaBandTitle: "Έτοιμοι να λύσετε την ισοπαλία;",
  ctaBandBody: "Φτιάξε την πρώτη σου ψηφοφορία σε λιγότερο από ένα λεπτό.",
  landingHint: "Σου έστειλαν σύνδεσμο ψηφοφορίας; Άνοιξέ τον για να ψηφίσεις εδώ.",
  footerMadeWith: "Pickle · Ομαδικές ψηφοφορίες, λυμένες.",

  footerText: "Φτιάξε τις δικές σου ψηφοφορίες με την εφαρμογή Pickle",
  footerCta: "Διαθέσιμο στο Google Play",

  loading: "Φόρτωση ψηφοφορίας…",
  notFoundTitle: "Η ψηφοφορία δεν βρέθηκε",
  notFoundBody: "Ο σύνδεσμος μπορεί να είναι λάθος ή η ψηφοφορία διαγράφηκε.",
  goHome: "Αρχική σελίδα",
  errorTitle: "Δεν ήταν δυνατή η φόρτωση",
  errorBody: "Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.",
  retry: "Δοκίμασε ξανά",

  statusOpen: "Η ψηφοφορία είναι ανοιχτή",
  statusClosed: "Η ψηφοφορία έκλεισε",
  startedAgo: "Ξεκίνησε {time}",
  closedAgo: "Έκλεισε {time}",

  votesSoFar: { one: "{n} ψήφος ως τώρα", other: "{n} ψήφοι ως τώρα" },
  youVoted: "Ψήφισες",
  youAndOthers: { one: "Ψήφισες εσύ και {n} ακόμα", other: "Ψήφισες εσύ και {n} ακόμα" },
  votedOfExpected: "Ψήφισαν {x} από {n}",
  noVotesYet: "Καμία ψήφος ακόμα. Ξεκίνα εσύ!",

  inTheLead: "Προηγείται",
  winner: "Νικητής",
  tie: "Ισοπαλία",
  tiedAtTop: "Ισοπαλία στην κορυφή: {names}",
  leaderVotes: "{x} από {n} ψήφους",
  aheadBy: "μπροστά κατά {n}",
  votesCount: { one: "{n} ψήφος", other: "{n} ψήφοι" },
  votesIn: { one: "{n} ψήφος", other: "{n} ψήφοι" },
  taglineClose: "όλα είναι ανοιχτά",
  taglineClear: "ένα φαβορί ξεχωρίζει",
  taglineFinal: "τελικά αποτελέσματα",
  live: "Ζωντανά: ανανεώνεται με κάθε ψήφο",
  yourPick: "Η επιλογή σου",
  suggestedByYou: "Δική σου πρόταση",
  resultsHidden: "Τα αποτελέσματα εμφανίζονται αφού ψηφίσεις.",
  percent: "{n}%",

  pickOne: "Διάλεξε ένα",
  vote: "Ψήφισε",
  changeVote: "Άλλαξε ψήφο",
  changeMyVote: "Αλλαγή ψήφου",
  keepVote: "Κράτα την ψήφο μου",
  voting: "Ψηφίζεις…",
  selectAnOption: "Διάλεξε μια επιλογή για να ψηφίσεις",
  voteLocked: "Σε αυτή την ψηφοφορία οι ψήφοι κλειδώνουν.",
  voteThanks: "Η ψήφος σου καταχωρήθηκε!",

  suggestTitle: "Έχεις καλύτερη ιδέα;",
  suggestBodyApproval: "Πρότεινε μια επιλογή. Πρώτα την εγκρίνει ο δημιουργός.",
  suggestBodyDirect: "Πρότεινε μια επιλογή. Μπαίνει αμέσως στην ψηφοφορία.",
  suggestLabel: "Η πρότασή σου",
  suggestPlaceholder: "π.χ. Τάκος από τη Rosa",
  suggestSubmit: "Πρότεινε",
  suggestEmpty: "Γράψε πρώτα μια επιλογή.",
  suggestDuplicate: "Αυτή η επιλογή υπάρχει ήδη.",
  suggestSentPending: "Ευχαριστούμε! Η πρότασή σου αναμένει έγκριση.",
  suggestSentApproved: "Η επιλογή σου προστέθηκε.",
  waitingApproval: "Αναμένει έγκριση",

  shareLead: "Όποιος έχει τον σύνδεσμο μπορεί να ψηφίσει:",
  shareLeadClosed: "Μοιράσου τα αποτελέσματα:",
  copyLink: "Αντιγραφή",
  share: "Κοινοποίηση",
  linkCopied: "Ο σύνδεσμος αντιγράφηκε",
  copyFailed: "Δεν ήταν δυνατή η αντιγραφή",

  errPollClosed: "Η ψηφοφορία έχει κλείσει, οπότε δεν δέχεται ψήφους.",
  errOptionUnavailable: "Αυτή η επιλογή δεν είναι πια διαθέσιμη.",
  errVoteLocked: "Σε αυτή την ψηφοφορία δεν επιτρέπεται αλλαγή ψήφου.",
  errGeneric: "Κάτι πήγε στραβά. Δοκίμασε ξανά.",

  profileTitle: "Ποιος ψηφίζει;",
  profileBody: "Διάλεξε όνομα και avatar για να ξέρει η παρέα ότι είσαι εσύ.",
  displayName: "Όνομα εμφάνισης",
  displayNameRequired: "Γράψε ένα όνομα.",
  avatarLabel: "Avatar",
  avatarOption: "Avatar {n}",
  shuffle: "Ανακάτεμα",
  shuffleLabel: "Δείξε άλλα avatar",
  continue: "Συνέχεια",
  cancel: "Άκυρο",
  saving: "Αποθήκευση…",
  haveAccount: "Έχεις ήδη λογαριασμό Pickle;",
  signInWithEmail: "Σύνδεση με email",

  emailTitle: "Σύνδεση στο Pickle",
  emailSignUpTitle: "Δημιουργία λογαριασμού Pickle",
  email: "Email",
  password: "Κωδικός",
  signIn: "Σύνδεση",
  signUp: "Δημιουργία λογαριασμού",
  noAccount: "Νέος στο Pickle;",
  createOne: "Φτιάξε λογαριασμό",
  haveAccountSignIn: "Έχεις λογαριασμό; Σύνδεση",
  back: "Πίσω",
  authInvalid: "Λάθος email ή κωδικός.",
  authCheckEmail: "Έλεγξε τα εισερχόμενά σου για επιβεβαίωση και μετά συνδέσου.",
  authGeneric: "Η σύνδεση απέτυχε. Δοκίμασε ξανά.",
};

export const translations: Record<Locale, Messages> = { en, el };
