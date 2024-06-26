<script lang="ts">
	import FullScreenModal from '../../Modal/FullScreenModal.svelte';
	import ManageMediaMenuLayout from '../MediaManagerMenuLayout.svelte';
	import FilesList from '../../MediaManagerModal/LocalFiles/MMLocalFilesTab.svelte';
	import { modalStack } from '../../Modal/modal.store';
	import FileActionsModal from '../modals/FileActionsModal.svelte';
	import DownloadsList from '../DownloadList.svelte';
	import { useRequest } from '../../../stores/data.store';
	import { derived, type Readable } from 'svelte/store';
	import SeasonList from './SeasonList.svelte';
	import { sonarrApi } from '../../../apis/sonarr/sonarr-api';
	import SeasonReleasesModal from './modals/EpisodeListModal.svelte';
	import type { FileResource } from '../../../apis/combined-types';

	export let modalId: symbol;
	export let groupId: symbol;
	export let hidden: boolean;
	export let id: number;

	const { promise: files, refresh: refreshFiles } = useRequest(sonarrApi.getFilesBySeriesId, id);
	const {
		promise: downloads,
		data: downloadsData,
		refresh: refreshDownloads
	} = useRequest(sonarrApi.getDownloadsBySeriesId, id);

	const handleGrabRelease = (guid: string, indexerId: number) =>
		sonarrApi
			.downloadSonarrRelease(guid, indexerId)
			.then((ok) => {
				if (!ok) {
					// TODO: Show error
				}
				refreshFiles(id);

				return ok;
			})
			.finally(() => {
				setTimeout(() => refreshDownloads(id), 8000);
			});
	const handleCancelDownload = (id: number) =>
		sonarrApi.cancelDownload(id).then(() => refreshDownloads(id));

	const grabbedReleases: Readable<Record<string, boolean>> = derived(downloadsData, ($downloads) =>
		($downloads || []).reduce((acc: Record<string, boolean>, download) => {
			acc[`${download.title}`] = true;
			return acc;
		}, {})
	);

	function handleSelectSeason(seasonNumber: number) {
		modalStack.create(
			SeasonReleasesModal,
			{
				seriesId: id,
				seasonNumber,
				grabRelease: handleGrabRelease
			},
			groupId
		);
	}

	function handleSelectFile(file: FileResource) {
		modalStack.create(
			FileActionsModal,
			{
				file,
				handleDeleteFile: (id: number) =>
					sonarrApi.deleteSonarrEpisode(id).then(() => refreshFiles(id))
			},
			groupId
		);
	}
</script>

<FullScreenModal {modalId} {hidden}>
	<ManageMediaMenuLayout focusOnMount>
		<h1 slot="header">Download</h1>
		<SeasonList {id} selectSeason={handleSelectSeason} />
	</ManageMediaMenuLayout>
	<ManageMediaMenuLayout>
		<h1 slot="header">Local Files</h1>
		<FilesList files={$files} {handleSelectFile} />
	</ManageMediaMenuLayout>
	<ManageMediaMenuLayout>
		<h1 slot="header">Downloads</h1>
		<DownloadsList downloads={$downloads} cancelDownload={handleCancelDownload} />
	</ManageMediaMenuLayout>
</FullScreenModal>
