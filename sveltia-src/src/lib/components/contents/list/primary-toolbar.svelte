<script>
  import { Button, Icon, Spacer, Toolbar } from '@sveltia/ui';
  import DOMPurify from 'isomorphic-dompurify';
  import { marked } from 'marked';
  import { _ } from 'svelte-i18n';
  import DeleteEntriesDialog from '$lib/components/contents/shared/delete-entries-dialog.svelte';
  // import ImportPubliDialog from '$lib/components/contents/shared/import-publi-dialog.svelte';
  import { goto } from '$lib/services/app/navigation';
  import { selectedCollection } from '$lib/services/contents/collection';
  import { selectedEntries } from '$lib/services/contents/collection/entries';

  let showDeleteDialog = $state(false);
  // let showImportDialog = $state(false);

  /**
   * Parse the given string as Markdown and sanitize the result to only allow certain tags.
   * @param {string} str - Original string.
   * @returns {string} Sanitized string.
   */
  const sanitize = (str) =>
    DOMPurify.sanitize(/** @type {string} */ (marked.parseInline(str)), {
      ALLOWED_TAGS: ['strong', 'em', 'del', 'code', 'a'],
      ALLOWED_ATTR: ['href'],
    });

  const name = $derived($selectedCollection?.name);
  const label = $derived($selectedCollection?.label);
  const description = $derived($selectedCollection?.description);
  const files = $derived($selectedCollection?.files);
  const canCreate = $derived($selectedCollection?.create ?? false);
  const canDelete = $derived($selectedCollection?.delete ?? true);
  const collectionLabel = $derived(label || name || '');
</script>

{#if $selectedCollection}
  <Toolbar variant="primary" aria-label={$_('collection')}>
    <h2 role="none">{collectionLabel}</h2>
    <div role="none" class="description">{@html sanitize(description || '')}</div>
    <Spacer flex />
    <!-- {#if collectionLabel === 'Publications'}
      <Button
        variant="secondary"
        label={$_('import')}
        aria-label={$_('import_entries')}
        onclick={() => {
          showImportDialog = true;
        }}
      >
      </Button>
    {/if} -->

    {#if !files}
      <Button
        variant="ghost"
        label={$_('delete')}
        aria-label={$selectedEntries.length === 1
          ? $_('delete_selected_entry')
          : $_('delete_selected_entries')}
        disabled={!$selectedEntries.length || !canDelete}
        onclick={() => {
          showDeleteDialog = true;
        }}
      />
      <Button
        variant="primary"
        disabled={!canCreate}
        label={$_('create')}
        aria-label={$_('create_new_entry')}
        keyShortcuts="Accel+E"
        onclick={() => {
          goto(`/collections/${name}/new`);
        }}
      >
        {#snippet startIcon()}
          <Icon name="edit" />
        {/snippet}
      </Button>
    {/if}
  </Toolbar>
{/if}

<DeleteEntriesDialog bind:open={showDeleteDialog} />

<style lang="scss">
  h2 {
    flex: none !important;
  }

  .description {
    flex: auto;
    font-size: var(--sui-font-size-small);
    opacity: 0.8;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>
