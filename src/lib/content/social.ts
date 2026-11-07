/**
 * Canonical social/contact links — single source of truth, consumed by the
 * footer (as brand marks) and the About rail (as mono text links). The real
 * URLs live HERE; do not fork them into components.
 */

export interface SocialLink {
	label: string;
	href: string;
}

export const elsewhere: SocialLink[] = [
	{ label: 'github', href: 'https://github.com/kanatabi' },
	{ label: 'linkedin', href: 'https://www.linkedin.com/in/faizainur' },
	{ label: 'researchgate', href: 'https://www.researchgate.net/profile/Faiz_Rofiq' },
	{ label: 'email', href: 'mailto:faiz@ainurrofiq.com' },
	{ label: 'instagram', href: 'https://www.instagram.com/faizarq' }
];
