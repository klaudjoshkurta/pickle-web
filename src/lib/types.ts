export type PollStatus = "OPEN" | "CLOSED";
export type OptionStatus = "APPROVED" | "PENDING" | "REJECTED";

export interface Poll {
  voting_mode?: "SINGLE" | "MULTIPLE";
  voter_count?: number | null;
  id: string;
  question: string;
  creator_id: string;
  allow_suggestions: boolean;
  require_approval: boolean;
  show_results_before_voting: boolean;
  allow_vote_change: boolean;
  status: PollStatus;
  created_at: string;
  closed_at: string | null;
  winner_option_id: string | null;
  expected_voters: number | null;
}

export interface PollOption {
  position?: number | null;
  id: string;
  poll_id: string;
  text: string;
  status: OptionStatus;
  vote_count: number;
  suggested_by: string | null;
  created_at: string;
}

export interface PollBundle {
  poll: Poll;
  options: PollOption[];
  /** option_id of the current user's vote, if any */
  myVoteOptionIds: string[];
}
