import { memo } from "react";

/* ═══════════════════════════════════════════════════════
   GameIcons — SVG icons replacing emojis as structural UI
   Each icon accepts className, size (default 24), and aria-hidden
   ═══════════════════════════════════════════════════════ */

const defaultProps = { size: 24, "aria-hidden": true };

/* ── Navigation ──────────────────────────────────────── */
export const HamburgerIcon = memo(({ size = 24, ...props }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2.5"
		strokeLinecap="round"
		{...props}
	>
		<line x1="3" y1="6" x2="21" y2="6" />
		<line x1="3" y1="12" x2="21" y2="12" />
		<line x1="3" y1="18" x2="21" y2="18" />
	</svg>
));

/* ── Rugby Ball ───────────────────────────────────────── */
export const RugbyBallIcon = memo(({ size = 24, ...props }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		{...props}
	>
		<ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-15 12 12)" />
		<line
			x1="7"
			y1="10"
			x2="7"
			y2="14"
			transform="rotate(-15 12 12)"
			strokeWidth="1.5"
		/>
		<line
			x1="12"
			y1="9"
			x2="12"
			y2="15"
			transform="rotate(-15 12 12)"
			strokeWidth="1"
		/>
		<line
			x1="17"
			y1="10"
			x2="17"
			y2="14"
			transform="rotate(-15 12 12)"
			strokeWidth="1.5"
		/>
	</svg>
));

/* ── Resources ────────────────────────────────────────── */
export const CoinIcon = memo(({ size = 24, ...props }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<circle cx="12" cy="12" r="9" />
		<path d="M14.5 8h-4a2 2 0 0 0 0 4h3a2 2 0 0 1 0 4h-4" />
		<line x1="12" y1="7" x2="12" y2="8" />
		<line x1="12" y1="16" x2="12" y2="17" />
	</svg>
));

export const PeopleIcon = memo(({ size = 24, ...props }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
		<circle cx="9" cy="7" r="4" />
		<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
		<path d="M16 3.13a4 4 0 0 1 0 7.75" />
	</svg>
));

export const StarIcon = memo(({ size = 24, ...props }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
	</svg>
));

/* ── Actions ──────────────────────────────────────────── */
export const RefreshIcon = memo(({ size = 24, ...props }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<path d="M1 4v6h6" />
		<path d="M23 20v-6h-6" />
		<path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
	</svg>
));

export const CartIcon = memo(({ size = 24, ...props }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<circle cx="9" cy="21" r="1" />
		<circle cx="20" cy="21" r="1" />
		<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
	</svg>
));

export const TargetIcon = memo(({ size = 24, ...props }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<circle cx="12" cy="12" r="10" />
		<circle cx="12" cy="12" r="6" />
		<circle cx="12" cy="12" r="2" />
	</svg>
));

export const ChartUpIcon = memo(({ size = 24, ...props }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<line x1="18" y1="20" x2="18" y2="10" />
		<line x1="12" y1="20" x2="12" y2="4" />
		<line x1="6" y1="20" x2="6" y2="14" />
	</svg>
));

export const MessageIcon = memo(({ size = 24, ...props }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
	</svg>
));

export const BrainIcon = memo(({ size = 24, ...props }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<path d="M12 4a4 4 0 0 1 3.46 6h-6.92A4 4 0 0 1 12 4z" />
		<path d="M16 10c1.66 0 3 1.34 3 3s-1.34 3-3 3" />
		<path d="M8 10c-1.66 0-3 1.34-3 3s1.34 3 3 3" />
		<path d="M12 10v6" />
		<path d="M10 20h4" />
	</svg>
));

export const BotIcon = memo(({ size = 24, ...props }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<rect x="3" y="7" width="18" height="13" rx="2" />
		<path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
		<line x1="12" y1="12" x2="12" y2="12.01" />
		<line x1="9" y1="12" x2="9" y2="12.01" />
		<line x1="15" y1="12" x2="15" y2="12.01" />
	</svg>
));

export const TrophyIcon = memo(({ size = 24, ...props }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
		<path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
		<path d="M6 3h12v6a6 6 0 0 1-12 0V3z" />
		<path d="M12 15v6" />
		<path d="M8 21h8" />
	</svg>
));

export const ConstructionIcon = memo(({ size = 24, ...props }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<rect x="2" y="6" width="20" height="8" rx="1" />
		<path d="M17 14v7" />
		<path d="M7 14v7" />
		<path d="M17 3v3" />
		<path d="M7 3v3" />
		<path d="M10 14 4 20" />
		<path d="M14 14 20 20" />
	</svg>
));

export const FlaskIcon = memo(({ size = 24, ...props }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<path d="M9 3h6" />
		<path d="M10 3v6.26a4 4 0 0 1-.83 2.4L5.5 17a4 4 0 0 0 3.32 6h6.36a4 4 0 0 0 3.32-6l-3.67-5.34A4 4 0 0 1 14 9.26V3" />
	</svg>
));

export default defaultProps;
