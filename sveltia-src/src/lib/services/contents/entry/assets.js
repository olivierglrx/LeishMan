import { getPathInfo } from '@sveltia/utils/file';
import { escapeRegExp } from '@sveltia/utils/string';
import { get } from 'svelte/store';
import {
  allAssets,
  getAssetByPath,
  getCollectionsByAsset,
  getMediaFieldURL,
} from '$lib/services/assets';
import { getCollection } from '$lib/services/contents/collection';
import { getFieldConfig } from '$lib/services/contents/entry/fields';

/**
 * Get the given entry’s thumbnail URL.
 * @param {EntryCollection} collection - Entry’s collection.
 * @param {Entry} entry - Entry.
 * @returns {Promise<string | undefined>} URL.
 */
export const getEntryThumbnail = async (collection, entry) => {
  const {
    _i18n: { defaultLocale },
    _thumbnailFieldNames,
  } = collection;

  const { locales } = entry;
  const { content } = locales[defaultLocale] ?? Object.values(locales)[0] ?? {};

  if (!content) {
    return undefined;
  }

  /** @type {FieldKeyPath[]} */
  const keyPathList = _thumbnailFieldNames
    .map((name) => {
      // Support a wildcard in the key path, e.g. `images.*.src`
      if (name.includes('*')) {
        const regex = new RegExp(`^${escapeRegExp(name).replace('\\*', '.+')}$`);

        return Object.keys(content).filter((keyPath) => regex.test(keyPath));
      }

      return name;
    })
    .flat(1);

  // Cannot use `Promise.all` or `Promise.any` here because we need the first available URL
  // eslint-disable-next-line no-restricted-syntax
  for (const keyPath of keyPathList) {
    const url = content[keyPath]
      ? // eslint-disable-next-line no-await-in-loop
        await getMediaFieldURL(content[keyPath], entry, { thumbnail: true })
      : undefined;

    if (url) {
      return url;
    }
  }

  return undefined;
};

/**
 * Get a list of assets associated with the given entry.
 * @param {object} args - Arguments.
 * @param {Entry} args.entry - Entry.
 * @param {string} args.collectionName - Name of a collection that the entry belongs to.
 * @param {boolean} [args.relative] - Whether to only collect assets stored at a relative path.
 * @returns {Asset[]} Assets.
 */
export const getAssociatedAssets = ({ entry, collectionName, relative = false }) => {
  const { locales } = entry;
  const collection = getCollection(collectionName);

  const assets = /** @type {Asset[]} */ (
    Object.values(locales)
      .map(({ content }) =>
        Object.entries(content).map(([keyPath, value]) => {
          if (
            typeof value === 'string' &&
            (relative ? !/^[/@]/.test(value) : true) &&
            ['image', 'file'].includes(
              getFieldConfig({ collectionName, keyPath })?.widget ?? 'string',
            )
          ) {
            const asset = getAssetByPath(value, { entry, collection });

            if (asset && getCollectionsByAsset(asset).some((c) => c.name === collectionName)) {
              return asset;
            }
          }

          return undefined;
        }),
      )
      .flat(1)
      .filter((value, index, array) => !!value && array.indexOf(value) === index)
  );

  // Add orphaned/unused entry-relative assets
  if (relative && collection?._assetFolder?.entryRelative) {
    const entryDirName = getPathInfo(Object.values(entry.locales)[0].path).dirname;

    get(allAssets).forEach((asset) => {
      if (
        getPathInfo(asset.path).dirname === entryDirName &&
        !assets.find(({ path }) => path === asset.path)
      ) {
        assets.push(asset);
      }
    });
  }

  return assets;
};
