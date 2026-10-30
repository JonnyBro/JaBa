<script setup lang="ts">
const year = new Date().getFullYear();
const version = __DASHBOARD_VERSION__;
</script>

<template>
	<footer class="border-t">
		<div
			class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 font-hud text-sm text-muted-foreground sm:flex-row"
		>
			<p>
				© {{ year }}
				<a href="https://github.com/JonnyBro" target="_blank" rel="noopener" class="hover:text-hl">Jonny_Bro</a>
				· {{ $t("footer.tagline") }}
			</p>
			<p class="flex items-center gap-3">
				<span>v{{ version }}</span>
				<a href="https://github.com/JonnyBro/JaBa" target="_blank" rel="noopener" class="hover:text-hl">
					{{ $t("footer.source") }}
				</a>
			</p>
		</div>
	</footer>
</template>
