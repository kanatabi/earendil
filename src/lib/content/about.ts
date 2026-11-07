/**
 * About-page identity content. Brand copy, not blog data — like the hero's
 * `currently` line it is FE-owned until (if ever) the BE absorbs it.
 * Everything marked PLACEHOLDER is authored filler: edit the real text in
 * this one file; the page template reads only from these exports.
 */

export interface Experience {
	role: string;
	company: string;
	/** Display string — the BE-curation analogue here is you, editing this file. */
	period: string;
	blurb: string;
}

export const profile = {
	name: 'Faiz Ainur Rofiq',
	tagline: 'Backend engineer & occasional photographer.',
	bio: [
		// PLACEHOLDER(bio): your story so far in 2–3 paragraphs.
		'I write about distributed systems, high-throughput applications, and the quiet details behind reliable software. Most of what lands here comes from things that broke, got fixed, and taught something on the way.',
		'The pen-word gofar; is a nudge, not a boast: go far — build things that keep working long after the launch party.',
		'Off the keyboard I chase light — landscapes and streets, mostly at the wrong hours of the day. Some of it ends up in the gallery.'
	],
	github: 'https://github.com/kanatabi' // PLACEHOLDER(link): confirm personal profile URL
};

/** Newest first — the timeline reads top-down like the feed. */
export const experience: Experience[] = [
	{
		// PLACEHOLDER(role): real company, period, and a two-line-able summary.
		role: 'Backend Engineer',
		company: 'PLACEHOLDER · Current company',
		period: '2024 — now',
		blurb:
			'Queues, metrics, and the reliability work behind systems that must keep answering under pressure.'
	},
	{
		role: 'Platform Engineer',
		company: 'PLACEHOLDER · Previous company',
		period: '2022 — 2024',
		blurb: 'Kubernetes and the self-hosted sprawl: pipelines, upgrades, 3 a.m. autopsies.'
	},
	{
		role: 'Software Engineer',
		company: 'PLACEHOLDER · Earlier company',
		period: '2020 — 2022',
		blurb: 'Services in Go; learned that idempotency is a contract, not a flag.'
	},
	{
		role: 'Freelance / first commits',
		company: 'wherever the terminal was',
		period: '2018 — 2020',
		blurb: 'Small systems, big lessons, and the habit of writing down what broke.'
	}
];

export const elsewhere = [
	{ label: 'GitHub', href: profile.github },
	// PLACEHOLDER(link): LinkedIn + Instagram profile URLs.
	{ label: 'LinkedIn', href: 'https://www.linkedin.com' },
	{ label: 'Instagram', href: 'https://www.instagram.com' }
];
