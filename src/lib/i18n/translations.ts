export type Locale = "en" | "el";
export const LOCALES: Locale[] = ["en", "el"];

const en = {
  appName: "Pickle",
  languageLabel: "Language",

  // Landing
  landingTitle: "Decide together, fast.",
  landingBody:
    "Pickle makes group decisions easy. Create a poll, share the link, and watch the votes roll in.",
  landingCta: "Get the Android app",
  landingHint: "Got a poll link from a friend? Open it to vote right here in your browser.",

  // Footer
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
  signingIn: "Getting things ready…",

  // Poll
  optionsLabel: "Options",
  vote: "Vote",
  changeVote: "Change vote",
  voting: "Voting…",
  selectAnOption: "Pick an option to vote",
  voteLocked: "Your vote is locked in.",
  voteCanChange: "You voted. Pick another option to change your vote.",
  yourPick: "Your pick",
  waitingApproval: "Waiting for approval",
  winner: "Winner",
  resultsHidden: "Results appear after you vote.",
  votesCount: { one: "{n} vote", other: "{n} votes" },
  totalVotes: { one: "{n} vote in total", other: "{n} votes in total" },
  votedOfExpected: "{x} of {n} voted",
  percent: "{n}%",
  voteThanks: "Vote saved!",

  // Closed
  pollClosed: "Poll closed",
  closedAgo: "Closed {time}",
  tie: "It's a tie",

  // Suggest
  suggestLabel: "Suggest an option",
  suggestPlaceholder: "Your idea",
  suggestSubmit: "Suggest",
  suggestEmpty: "Type an option first.",
  suggestDuplicate: "That option is already on the list.",
  suggestSentPending: "Thanks! Your suggestion is waiting for approval.",
  suggestSentApproved: "Your option was added.",

  // Share
  share: "Share",
  linkCopied: "Link copied",
  copyFailed: "Couldn't copy the link",

  // Errors
  errPollClosed: "This poll is closed, so votes can't be changed.",
  errOptionUnavailable: "That option isn't available anymore.",
  errVoteLocked: "This poll doesn't allow changing your vote.",
  errGeneric: "Something went wrong. Please try again.",

  // Profile
  profileTitle: "Who's voting?",
  profileBody: "Pick a name and an avatar so others know it's you.",
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
  signedInAs: "Signed in as {name}",
};

export type Messages = typeof en;
export type MessageKey = {
  [K in keyof Messages]: Messages[K] extends string ? K : never;
}[keyof Messages];
export type PluralKey = {
  [K in keyof Messages]: Messages[K] extends string ? never : K;
}[keyof Messages];

const el: Messages = {
  appName: "Pickle",
  languageLabel: "Γλώσσα",

  landingTitle: "Αποφασίστε μαζί, γρήγορα.",
  landingBody:
    "Το Pickle κάνει τις ομαδικές αποφάσεις εύκολες. Φτιάξε μια ψηφοφορία, μοιράσου τον σύνδεσμο και δες τις ψήφους να έρχονται.",
  landingCta: "Κατέβασε την εφαρμογή Android",
  landingHint: "Σου έστειλαν σύνδεσμο ψηφοφορίας; Άνοιξέ τον για να ψηφίσεις εδώ, στον browser.",

  footerText: "Φτιάξε τις δικές σου ψηφοφορίες με την εφαρμογή Pickle",
  footerCta: "Διαθέσιμο στο Google Play",

  loading: "Φόρτωση ψηφοφορίας…",
  notFoundTitle: "Η ψηφοφορία δεν βρέθηκε",
  notFoundBody: "Ο σύνδεσμος μπορεί να είναι λάθος ή η ψηφοφορία διαγράφηκε.",
  goHome: "Αρχική σελίδα",
  errorTitle: "Δεν ήταν δυνατή η φόρτωση",
  errorBody: "Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.",
  retry: "Δοκίμασε ξανά",
  signingIn: "Ετοιμάζουμε τα πάντα…",

  optionsLabel: "Επιλογές",
  vote: "Ψήφισε",
  changeVote: "Άλλαξε ψήφο",
  voting: "Ψηφίζεις…",
  selectAnOption: "Διάλεξε μια επιλογή για να ψηφίσεις",
  voteLocked: "Η ψήφος σου έχει κλειδώσει.",
  voteCanChange: "Ψήφισες. Διάλεξε άλλη επιλογή για να αλλάξεις την ψήφο σου.",
  yourPick: "Η επιλογή σου",
  waitingApproval: "Αναμένει έγκριση",
  winner: "Νικητής",
  resultsHidden: "Τα αποτελέσματα εμφανίζονται αφού ψηφίσεις.",
  votesCount: { one: "{n} ψήφος", other: "{n} ψήφοι" },
  totalVotes: { one: "{n} ψήφος συνολικά", other: "{n} ψήφοι συνολικά" },
  votedOfExpected: "Ψήφισαν {x} από {n}",
  percent: "{n}%",
  voteThanks: "Η ψήφος σου καταχωρήθηκε!",

  pollClosed: "Η ψηφοφορία έκλεισε",
  closedAgo: "Έκλεισε {time}",
  tie: "Ισοπαλία",

  suggestLabel: "Πρότεινε μια επιλογή",
  suggestPlaceholder: "Η ιδέα σου",
  suggestSubmit: "Πρότεινε",
  suggestEmpty: "Γράψε πρώτα μια επιλογή.",
  suggestDuplicate: "Αυτή η επιλογή υπάρχει ήδη.",
  suggestSentPending: "Ευχαριστούμε! Η πρότασή σου αναμένει έγκριση.",
  suggestSentApproved: "Η επιλογή σου προστέθηκε.",

  share: "Κοινοποίηση",
  linkCopied: "Ο σύνδεσμος αντιγράφηκε",
  copyFailed: "Δεν ήταν δυνατή η αντιγραφή",

  errPollClosed: "Η ψηφοφορία έχει κλείσει, οπότε δεν δέχεται ψήφους.",
  errOptionUnavailable: "Αυτή η επιλογή δεν είναι πια διαθέσιμη.",
  errVoteLocked: "Σε αυτή την ψηφοφορία δεν επιτρέπεται αλλαγή ψήφου.",
  errGeneric: "Κάτι πήγε στραβά. Δοκίμασε ξανά.",

  profileTitle: "Ποιος ψηφίζει;",
  profileBody: "Διάλεξε όνομα και avatar για να ξέρουν οι άλλοι ότι είσαι εσύ.",
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
  signedInAs: "Σύνδεση ως {name}",
};

export const translations: Record<Locale, Messages> = { en, el };
