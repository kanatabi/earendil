export interface PostSummary {
	slug: string;
	title: string;
	/** Secondary headline shown alongside the main title in listings. */
	subtitle: string;
	/** BE-owned display text (may be the article's opening); the FE only clamps it visually. */
	preview: string;
	date: string;
	readTime: number;
	/** Null when the post has no thumbnail — listings render title + preview only. */
	thumbnail: string | null;
}

export interface Photo {
	src: string;
	alt: string;
	/** Natural dimensions so the masonry grid can reserve layout. */
	width: number;
	height: number;
}

export interface Tag {
	name: string;
	/** Posts carrying the tag in the corpus. Counting and ordering are BE curation. */
	posts: number;
}

export interface PhotoListResponse {
	total: number;
	items: Photo[];
}

export interface PostDetail extends PostSummary {
	tags: string[];
	content: string;
}

export interface PostListResponse {
	total: number;
	items: PostSummary[];
}

export interface SuggestResponse {
	results: PostSummary[];
}

/** URL-safe sort values; relevance only applies to search, absent = BE curation. */
export type SortValue = 'newest' | 'oldest' | 'quickest' | 'longest' | 'relevance';
