<script lang="ts">
	import TextField from '../TextField.svelte';
	import { appState } from '../../stores/app-state.store';
	import { createEventDispatcher } from 'svelte';
	import { radarrApi } from '../../apis/radarr/radarr-api';

	const dispatch = createEventDispatcher<{
		change: { baseUrl: string; apiKey: string; stale: boolean };
	}>();

	export let baseUrl = '';
	export let apiKey = '';
	let originalBaseUrl: string | undefined;
	let originalApiKey: string | undefined;
	let timeout: ReturnType<typeof setTimeout>;
	let error = '';
	let healthCheck: Promise<boolean> | undefined;

	appState.subscribe((appState) => {
		baseUrl = baseUrl || appState.user?.settings.radarr.baseUrl || '';
		apiKey = apiKey || appState.user?.settings.radarr.apiKey || '';

		originalBaseUrl = baseUrl;
		originalApiKey = apiKey;

		handleChange();
	});

	function handleChange() {
		clearTimeout(timeout);
		error = '';
		healthCheck = undefined;

		const baseUrlCopy = baseUrl;
		const apiKeyCopy = apiKey;
		const stale = baseUrlCopy !== originalBaseUrl || apiKeyCopy !== originalApiKey;

		dispatch('change', {
			baseUrl: '',
			apiKey: '',
			stale: baseUrl === '' && apiKey === ''
		});

		if (baseUrlCopy === '' || apiKeyCopy === '') return;

		timeout = setTimeout(async () => {
			const p = radarrApi.getHealth(baseUrlCopy, apiKeyCopy);
			healthCheck = p.then((res) => res.status === 200);

			const res = await p;
			if (baseUrlCopy !== baseUrl || apiKeyCopy !== apiKey) return;
			if (res.status !== 200) {
				error =
					res.status === 404
						? 'Server not found'
						: res.status === 401
						? 'Invalid api key'
						: 'Could not connect';

				return; // TODO add notification
			} else {
				dispatch('change', { baseUrl: baseUrlCopy, apiKey: apiKeyCopy, stale });
			}
		}, 1000);
	}
</script>

<div class="space-y-4 mb-4">
	<TextField bind:value={baseUrl} isValid={healthCheck} on:change={handleChange}>Base Url</TextField
	>
	<TextField bind:value={apiKey} isValid={healthCheck} on:change={handleChange}>API Key</TextField>
</div>

{#if error}
	<div class="text-red-500 mb-4">{error}</div>
{/if}