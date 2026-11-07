/**
 * About-page identity content. Brand copy, not blog data — like the hero's
 * `currently` line it is FE-owned until (if ever) the BE absorbs it.
 * Sourced from the owner's CV + the two paper PDFs (Nov 2026); all real now —
 * social/contact links are canonically kept in `social.ts`.
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
	/** The thesis branch lights like the gofar line's traveled rail. */
	active?: boolean;
}

export interface Paper {
	title: string;
	year: string;
	note: string;
	abstract: string;
	keywords: string[];
	href: string;
}

export interface StackGroup {
	label: string;
	/** First item may carry an opinion inline — `go, the default answer …`. */
	items: string[];
}

export interface FactRow {
	label: string;
	value: string;
	href?: string;
}

export const profile = {
	name: 'Faiz Ainur Rofiq',
	tagline: 'Backend engineer & occasional photographer.',
	bio: [
		"I build systems that have to keep answering under load — GoMart's features behind the Gojek app, real-time data feeds at Tokopedia — and this blog is where I write down what broke, got fixed, and taught something along the way.",
		'The pen-word gofar; is a nudge, not a boast: go far. It runs in a lineage, too — my first blog was a Vue front end with a Strapi CMS rented on Vercel and Heroku, back in 2021. This one is SvelteKit — and wherever its server ends up living, I will be the one running it.',
		'Off the keyboard I chase light — landscapes and streets, mostly at the wrong hours of the day. Some of it ends up in the gallery.'
	]
};

/** Newest first — the timeline reads top-down like the feed. */
export const experience: Experience[] = [
	{
		role: 'Software Engineer · Backend',
		company: 'Gojek',
		period: 'Apr 2024 — now',
		blurb:
			'Build and maintain core GoMart features across a polyglot backend — Go, Ruby, Clojure, JavaScript — with event-driven plumbing over Kafka, RabbitMQ, and Sidekiq carrying the load. Helped migrate long-lived services from VMs to Kubernetes across team boundaries, and tune applications to survive peak traffic while using the fleet sparingly. Day-to-day also means reviewing peers’ code, planning features with product and front-end, and keeping Grafana, Kibana, and New Relic honest.'
	},
	{
		role: 'Software Engineer',
		company: 'Tokopedia',
		period: 'Apr 2022 — Sep 2023',
		blurb:
			'Owned core features of Tokopedia Affiliate and its real-time data delivery to the partner portal — Server-Sent Events, chosen so affiliates watched their numbers move as they happened. Shipped gRPC and GraphQL APIs in Go over PostgreSQL, Cassandra, Redis, and BigTable, with New Relic and Datadog as the watchdogs, and integrated features across teams into the Tokopedia app.'
	},
	{
		role: 'Software Engineer Internship',
		company: 'JalanMimpi',
		period: 'Oct 2020 — Nov 2020',
		blurb:
			'The first production backend, end to end: designed the PostgreSQL schema, implemented 41 REST endpoints in Express/Firebase with Midtrans payment integration, wrote 31 Jest tests, and shipped beside two front-end engineers. The 41/31 numbers stuck — it was the first time I measured what I built, and this blog still sounds like that habit.'
	}
];

export const education = {
	degree: 'B.Eng. in Computer Engineering',
	school: 'Universitas Indonesia',
	period: '2018 — 2022',
	highlights: [
		{
			body: 'Undergraduate thesis — Catena: a blockchain-based KYC mechanism for small-business loans, on Hyperledger Fabric and IPFS. 35 endpoints, 19.5k lines of code',
			link: { label: 'published in research;', href: '#research' },
			active: true
		},
		{
			body: 'Robotics Team of Universitas Indonesia — software engineer, 2018–2019. Where the habit of writing down what broke started.'
		}
	] satisfies Highlight[]
};

/** Abstracts + keywords transcribed from the local paper PDFs (Nov 2026). */
export const research: Paper[] = [
	{
		title:
			'Design and Development of Know Your Customer Mechanism using Blockchain in the Process of Small Business Loans Application in Indonesia',
		year: '2021',
		note: 'Catena, published: what if the KYC form never had to leave the vault?',
		abstract:
			'Know Your Customer, in general, is a process or mechanism done by an institution to identify and verify the identity of a business partner. In the banking industry, this mechanism is implemented to identify a customer and monitor the transaction activities of a customer, which includes reporting suspicious transactions to the authority. The aim is to avoid criminal acts such as money laundering. However, the existing system has shortcomings that can disrupt business activities: the customer must submit physical documents for each initiation of a business relationship — a duplication process that takes time and makes the whole flow inefficient — and the incumbent centralized model, managed and controlled by a single institution, is more vulnerable to cyber-attacks. This research builds a system using blockchain and the Interplanetary File System (IPFS) that implements the KYC mechanism to provide a more efficient system to the banking industry. From the results of tests carried out on the system, it can be concluded that the performance of the system depends on the specification of the computer used — the better the specification, the better the performance.',
		keywords: ['kyc', 'blockchain', 'ipfs', 'performance'],
		href: 'https://www.researchgate.net/profile/Faiz_Rofiq/publication/353620198_Design_and_Development_of_Know_Your_Customer_Mechanism_using_Blockchain_in_the_Process_of_Small_Business_Loans_Application_in_Indonesia/links/61065e731e95fe241a9f0509/Design-and-Development-of-Know-Your-Customer-Mechanism-using-Blockchain-in-the-Process-of-Small-Business-Loans-Application-in-Indonesia.pdf'
	},
	{
		title:
			'ImBlock: A Blockchain Implementation of Land Ownership Recording System using Hyperledger Fabric',
		year: '2021',
		note: 'Land titles on a ledger nobody owns — the same Fabric stack, pointed at an older trust problem.',
		abstract:
			'Recently blockchain is implemented in many sectors such as arts, gaming, education, and health. Blockchain is proposed as a solution for decentralized ledgering systems. One of the most common problems that depends on a trusted ledger is the certification of land ownership: the records of ownership must be trustworthy and orderly so that issues such as double certification do not occur. This paper presents a certificate of land ownership recording system based on blockchain technology, implemented on Hyperledger Fabric — with the expectation that the system achieves good integrity and transparency, solving the problem of land-ownership disputes.',
		keywords: [
			'blockchain',
			'distributed ledgers',
			'hyperledger',
			'ipfs',
			'management',
			'performance'
		],
		href: 'https://www.researchgate.net/profile/Faiz_Rofiq/publication/353620446_ImBlock_A_Blockchain_Implementation_of_Land_Ownership_Recording_System_using_Hyperledger_Fabric/links/61065ff20c2bfa282a13520d/ImBlock-A-Blockchain-Implementation-of-Land-Ownership-Recording-System-using-Hyperledger-Fabric.pdf'
	}
];

/** Opinions ride inside the groups as annotated first items — no orphan zone. */
export const stack: { groups: StackGroup[] } = {
	groups: [
		{
			label: 'languages',
			items: [
				'go, the default answer until proven otherwise',
				'ruby',
				'clojure',
				'javascript',
				'typescript',
				'java',
				'python'
			]
		},
		{
			label: 'data & streaming',
			items: [
				'kafka and rabbitmq, where every handshake between services is a promise',
				'postgresql',
				'cassandra',
				'redis',
				'mongodb',
				'elasticsearch',
				'bigtable',
				'hyperledger fabric',
				'ipfs'
			]
		},
		{
			label: 'apis & frameworks',
			items: [
				'grpc and graphql in go',
				'server-sent events',
				'gin',
				'fiber',
				'rails',
				'express',
				'vue'
			]
		},
		{
			label: 'ops & observability',
			items: [
				'grafana / new relic / datadog — watch the system, or meet it at 3 a.m.',
				'kubernetes',
				'docker',
				'aws',
				'gcp',
				'tencent cloud',
				'github',
				'gitlab',
				'kibana'
			]
		}
	]
};

export const facts: FactRow[] = [
	{ label: 'based', value: 'depok · jakarta metro' },
	{ label: 'shipped since', value: '2020' },
	{ label: 'focus', value: 'distributed systems · observability' },
	{ label: 'spoken', value: 'indonesia · english' }
];

/** The site's own colophon — the infra-blogger's quiet brag. */
export const colophon: FactRow[] = [
	{ label: 'engine', value: 'sveltekit · svelte 5' },
	{ label: 'privacy', value: 'no trackers; one cookie, for the theme' },
	{
		label: 'source',
		value: 'earendil ↗',
		href: 'https://github.com/kanatabi/earendil'
	}
];

/** Canonical links live in social.ts; re-exported for existing importers. */
export { elsewhere } from './social.ts';
