export interface AnnouncementRequest {
  title: string;
  body: string;
  pinned: boolean;
}

export interface AnnouncementResponse {
  id: number;
  title: string;
  body: string;
  authorUserId: number;
  authorName: string | null;
  authorHasAvatar: boolean;
  pinned: boolean;
  createdAt: string;
}

export interface PollRequest {
  question: string;
  closesOn?: string | null;
  options: string[];
}

export interface PollOptionResponse {
  id: number;
  label: string;
  voteCount: number;
}

export interface PollResponse {
  id: number;
  question: string;
  closesOn: string | null;
  closed: boolean;
  totalVotes: number;
  myVotedOptionId: number | null;
  options: PollOptionResponse[];
  createdByName: string | null;
  createdAt: string;
}

export interface PollVoteRequest {
  optionId: number;
}

export interface FeedPostResponse {
  id: number;
  authorUserId: number;
  authorName: string | null;
  authorHasAvatar: boolean;
  content: string;
  hasAttachment: boolean;
  createdAt: string;
  canDelete: boolean;
}
