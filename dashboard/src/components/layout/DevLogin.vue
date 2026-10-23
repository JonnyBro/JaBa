<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRoute } from "vue-router";

const ACCOUNTS = [
	{ name: "owner", label: "Dev Owner" },
	{ name: "user", label: "Dev User" },
];

const route = useRoute();
const href = (name: string) => `/auth/dev/${name}?redirect=${encodeURIComponent(route.fullPath)}`;
</script>

<template>
	<DropdownMenu>
		<DropdownMenuTrigger as-child>
			<Button variant="outline" size="sm" class="font-display">DEV</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end" class="font-display">
			<DropdownMenuItem v-for="account in ACCOUNTS" :key="account.name" as="a" :href="href(account.name)">
				{{ account.label }}
			</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
</template>
