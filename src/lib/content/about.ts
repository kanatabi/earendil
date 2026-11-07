/**
 * About-page identity content. Brand copy, not blog data — like the hero's
 * `currently` line it is FE-owned until (if ever) the BE absorbs it.
 * Sourced from the owner's CV (Nov 2026); `PLACEHOLDER` marks remain where a
 * fact must come from the human.
 */

export interface Experience {
	role: string;
	company: string;
	/** Display string — curation here is you, editing this file. */
	period: string;
	blurb: string;
}

export interface Highlight {
	body: string;
	link?: { label: string; href: string };
}

export interface Paper {
	title: string;
	year: string;
	venue: string;
	note: string;
	href: string;
}

export interface Anchor {
	name: string;
	note: string;
}

export interface StackGroup {
	label: string;
	items: string[];
}

export const profile = {
	name: 'Faiz Ainur Rofiq',
	tagline: 'Backend engineer & occasional photographer.',
	bio: [
		"I build systems that have to keep answering under load — GoMart's features behind the Gojek app, real-time data feeds at Tokopedia — and this blog is where I write down what broke, got fixed, and taught something along the way.",
		'The pen-word gofar; is a nudge, not a boast: go far. It runs in a lineage, too — my first blog was a Vue front end with a Strapi CMS rented on Vercel and Heroku, back in 2021. This one is SvelteKit, rendered on servers I host myself.',
		'Off the keyboard I chase light — landscapes and streets, mostly at the wrong hours of the day. Some of it ends up in the gallery.'
	],
	email: 'faiz@ainurrofiq.com'
};

/** Newest first — the timeline reads top-down like the feed. */
export const experience: Experience[] = [
	{
		role: 'Software Engineer · Backend',
		company: 'Gojek',
		period: 'Apr 2024 — now',
		blurb:
			'Core GoMart features in Go, Ruby, Clojure, and JavaScript; event-driven plumbing over Kafka, RabbitMQ, and Sidekiq; migrating services from VMs to Kubernetes; and tuning applications to survive peak load while using the fleet efficiently.'
	},
	{
		role: 'Software Engineer',
		company: 'Tokopedia',
		period: 'Apr 2022 — Sep 2023',
		blurb:
			'Built and maintained Tokopedia Affiliate, including real-time data delivery to the affiliate portal over Server-Sent Events; gRPC and GraphQL APIs in Go, over PostgreSQL, Cassandra, Redis, and BigTable.'
	},
	{
		role: 'Software Engineer Internship',
		company: 'JalanMimpi',
		period: 'Oct 2020 — Nov 2020',
		blurb:
			'The first production sprint: a crowdfunding backend of 41 REST endpoints and 31 Jest tests in Express/Firebase over a designed PostgreSQL schema, built beside two front-end engineers.'
	}
];

export const education = {
	degree: 'B.Eng. in Computer Engineering',
	school: 'Universitas Indonesia',
	period: '2018 — 2022',
	highlights: [
		{
			body: 'Undergraduate thesis — Catena: a blockchain-based KYC mechanism for small-business loans, on Hyperledger Fabric and IPFS. 35 endpoints, 19.5k lines of code, and two published papers',
			link: { label: 'research;', href: '#research' }
		},
		{
			body: 'Robotics Team of Universitas Indonesia — software engineer, 2018–2019. Where the habit of writing down what broke started.'
		}
	] satisfies Highlight[]
};

export const research: Paper[] = [
	{
		title:
			'Design and Development of Know Your Customer Mechanism using Blockchain in the Process of Small Business Loans Application in Indonesia',
		year: '2021',
		// PLACEHOLDER(venue): the conference/journal it appeared in.
		venue: 'PLACEHOLDER venue',
		note: 'Catena, published: what if the KYC form never had to leave the vault?',
		href: 'https://www.researchgate.net/profile/Faiz_Rofiq/publication/353620198_Design_and_Development_of_Know_Your_Customer_Mechanism_using_Blockchain_in_the_Process_of_Small_Business_Loans_Application_in_Indonesia/links/61065e731e95fe241a9f0509/Design-and-Development-of-Know-Your-Customer-Mechanism-using-Blockchain-in-the-Process-of-Small-Business-Loans-Application-in-Indonesia.pdf'
	},
	{
		title:
			'ImBlock: A Blockchain Implementation of Land Ownership Recording System using Hyperledger Fabric',
		year: '2021',
		// PLACEHOLDER(venue): the conference/journal it appeared in.
		venue: 'PLACEHOLDER venue',
		note: 'Land titles on a ledger nobody owns — the same Fabric stack, pointed at an older trust problem.',
		href: 'https://www.researchgate.net/profile/Faiz_Rofiq/publication/353620446_ImBlock_A_Blockchain_Implementation_of_Land_Ownership_Recording_System_using_Hyperledger_Fabric/links/61065ff20c2bfa282a13520d/ImBlock-A-Blockchain-Implementation-of-Land-Ownership-Recording-System-using-Hyperledger-Fabric.pdf'
	}
];

export const stack = {
	anchors: [
		{ name: 'go', note: 'the default answer until proven otherwise' },
		{ name: 'queues', note: 'every handshake between services is a promise' },
		{ name: 'dashboards', note: 'watch the system, or meet it at 3 a.m.' }
	] satisfies Anchor[],
	groups: [
		{
			label: 'languages',
			items: ['go', 'ruby', 'clojure', 'javascript', 'typescript', 'java', 'python']
		},
		{
			label: 'data & streaming',
			items: [
				'postgresql',
				'cassandra',
				'redis',
				'mongodb',
				'elasticsearch',
				'bigtable',
				'kafka',
				'rabbitmq',
				'hyperledger fabric',
				'ipfs'
			]
		},
		{
			label: 'apis & frameworks',
			items: ['gin', 'fiber', 'rails', 'express', 'grpc', 'graphql', 'server-sent events', 'vue']
		},
		{
			label: 'ops & observability',
			items: [
				'kubernetes',
				'docker',
				'aws',
				'gcp',
				'tencent cloud',
				'github',
				'gitlab',
				'grafana',
				'new relic',
				'datadog',
				'kibana'
			]
		}
	] satisfies StackGroup[]
};

export const elsewhere = [
	{ label: 'github', href: 'https://github.com/kanatabi' },
	{ label: 'linkedin', href: 'https://www.linkedin.com/in/faizainur' },
	{ label: 'researchgate', href: 'https://www.researchgate.net/profile/Faiz_Rofiq' },
	{ label: 'email', href: `mailto:${profile.email}` },
	// PLACEHOLDER(link): real Instagram URL.
	{ label: 'instagram', href: 'https://www.instagram.com' }
];
