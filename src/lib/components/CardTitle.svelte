<script lang="ts">
	interface Props {
		title: string;
	}

	let { title }: Props = $props();
</script>

<!-- Card kicker shared by every rail card: uppercase mono letterspaced voice. -->
<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">{title}</p>
