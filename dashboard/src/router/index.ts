import { getMe, loginUrl } from "@/api";
import { ME_QUERY_KEY } from "@/composables/useAuth";
import { i18n } from "@/i18n";
import { queryClient } from "@/plugins/query";
import { watch } from "vue";
import { createRouter, createWebHistory } from "vue-router";

declare module "vue-router" {
	interface RouteMeta {
		/** i18n key of the page title */
		title?: string;
		requiresAuth?: boolean;
		requiresOwner?: boolean;
		section?: string;
	}
}

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	scrollBehavior: (to, from, saved) => {
		if (saved) return saved;
		if (to.hash) return { el: to.hash, behavior: "smooth", top: 80 };
		if (to.path === from.path) return false;
		return { top: 0 };
	},
	routes: [
		{
			path: "/",
			name: "home",
			component: () => import("@/views/HomeView.vue"),
		},
		{
			path: "/commands",
			name: "commands",
			component: () => import("@/views/CommandsView.vue"),
			meta: { title: "header.commands" },
		},
		{
			path: "/leaderboard",
			name: "leaderboard",
			component: () => import("@/views/LeaderboardView.vue"),
			meta: { title: "header.leaderboard" },
		},
		{
			path: "/profile",
			name: "profile",
			component: () => import("@/views/ProfileView.vue"),
			meta: { title: "userMenu.profile", requiresAuth: true },
		},
		{
			path: "/playlists",
			name: "playlists",
			component: () => import("@/views/PlaylistsView.vue"),
			meta: { title: "header.playlists", requiresAuth: true },
		},
		{
			path: "/servers",
			name: "servers",
			component: () => import("@/views/ServersView.vue"),
			meta: { title: "header.servers", requiresAuth: true },
		},
		{
			path: "/servers/:id",
			component: () => import("@/views/ServerView.vue"),
			meta: { requiresAuth: true, section: "servers" },
			children: [
				{ path: "", name: "server", component: () => import("@/views/server/SettingsTab.vue") },
				{
					path: "members",
					name: "server-members",
					component: () => import("@/views/server/MembersTab.vue"),
				},
				{
					path: "tickets",
					name: "server-tickets",
					component: () => import("@/views/server/TicketsTab.vue"),
				},
				{
					path: "messages",
					name: "server-messages",
					component: () => import("@/views/server/MessagesTab.vue"),
				},
				{ path: "audit", name: "server-audit", component: () => import("@/views/server/AuditTab.vue") },
				{ path: "music", name: "server-music", component: () => import("@/views/server/MusicTab.vue") },
				{
					path: "leaderboard",
					name: "server-leaderboard",
					component: () => import("@/views/server/LeaderboardTab.vue"),
				},
			],
		},
		{
			path: "/owner",
			component: () => import("@/views/OwnerView.vue"),
			meta: { title: "header.owner", requiresAuth: true, requiresOwner: true, section: "owner" },
			children: [
				{ path: "", name: "owner", component: () => import("@/views/owner/OverviewTab.vue") },
				{ path: "servers", name: "owner-servers", component: () => import("@/views/owner/ServersTab.vue") },
				{ path: "lavalink", name: "owner-lavalink", component: () => import("@/views/owner/LavalinkTab.vue") },
				{ path: "stats", name: "owner-stats", component: () => import("@/views/owner/StatsTab.vue") },
				{
					path: "blacklist",
					name: "owner-blacklist",
					component: () => import("@/views/owner/BlacklistTab.vue"),
				},
				{ path: "logs", name: "owner-logs", component: () => import("@/views/owner/LogsTab.vue") },
			],
		},
		{
			path: "/:pathMatch(.*)*",
			name: "not-found",
			component: () => import("@/views/NotFoundView.vue"),
			meta: { title: "notFound.text" },
		},
	],
});

router.beforeEach(async to => {
	if (!to.meta.requiresAuth) return;

	const me = await queryClient
		.fetchQuery({ queryKey: ME_QUERY_KEY, queryFn: getMe, staleTime: 60_000 })
		.catch(() => null);

	// Discord login is a full page redirect, not a route
	if (!me) {
		window.location.href = loginUrl(to.fullPath);
		return false;
	}

	if (to.meta.requiresOwner && !me.owner)
		return { name: "not-found", params: { pathMatch: to.path.slice(1).split("/") } };
});

const updateTitle = () => {
	const title = router.currentRoute.value.meta.title;
	document.title = title ? `${i18n.global.t(title)} · JaBa` : "JaBa";
};

router.afterEach(updateTitle);
watch(i18n.global.locale, updateTitle);

export default router;
