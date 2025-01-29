import * as TOML from 'smol-toml';
import { get } from 'svelte/store';
import YAML from 'yaml';
import { customFileFormats } from '$lib/services/contents/file';
import { siteConfig } from '$lib/services/config';

/**
 * Format the given object as a JSON document using the built-in method.
 * @param {any} obj - Object to be formatted.
 * @param {JsonFormatOptions} [options] - Options.
 * @returns {string} Formatted document.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
 */
export const formatJSON = (obj, options = get(siteConfig)?.output?.json ?? {}) => {
  const {
    indent_style: indentStyle = 'space',
    indent_size: indentSize = indentStyle === 'tab' ? 1 : 2,
  } = options;

  return JSON.stringify(
    obj,
    null,
    indentStyle === 'tab' ? '\t'.repeat(indentSize) : indentSize,
  ).trim();
};

/**
 * Format the given object as a TOML document using a library.
 * @param {any} obj - Object to be formatted.
 * @returns {string} Formatted document.
 * @see https://github.com/squirrelchat/smol-toml
 */
export const formatTOML = (obj) => TOML.stringify(obj).trim();

/**
 * Format the given object as a YAML document using a library.
 * @param {any} obj - Object to be formatted.
 * @param {YamlFormatOptions} [options] - Options.
 * @param {object} [legacyOptions] - Deprecated collection-level options.
 * @param {boolean} [legacyOptions.quote] - Quote option.
 * @returns {string} Formatted document.
 * @see https://eemeli.org/yaml/#tostring-options
 * @todo Remove `collectionOptions` prior to the 1.0 release.
 */
export const formatYAML = (
  obj,
  options = get(siteConfig)?.output?.yaml ?? {},
  legacyOptions = {},
) => {
  const { indent_size: indent = 2, quote = 'none' } = options;
  const { quote: legacyQuote = false } = legacyOptions;

  return YAML.stringify(obj, null, {
    indent,
    lineWidth: 0,
    defaultKeyType: 'PLAIN',
    defaultStringType:
      legacyQuote || quote === 'double'
        ? 'QUOTE_DOUBLE'
        : quote === 'single'
          ? 'QUOTE_SINGLE'
          : 'PLAIN',
    singleQuote: !(legacyQuote || quote === 'double'),
  }).trim();
};

/**
 * Format raw entry content.
 * @param {object} entry - File entry.
 * @param {RawEntryContent | Record<LocaleCode, RawEntryContent>} entry.content - Content object.
 * Note that this method may modify the `content` (the `body` property will be removed if exists) so
 * it shouldn’t be a reference to an existing object.
 * @param {FileConfig} entry._file - Entry file configuration.
 * @returns {Promise<string>} Formatted string.
 */
export const formatEntryFile = async ({ content, _file }) => {
  const { format, fmDelimiters, yamlQuote = false } = _file;
  const customFormatter = customFileFormats[format]?.formatter;

  if (customFormatter) {
    return `${(await customFormatter(content)).trim()}\n`;
  }

  try {
    if (/^ya?ml$/.test(format)) {
      return `${formatYAML(content, undefined, { quote: yamlQuote })}\n`;
    }

    if (format === 'toml') {
      return `${formatTOML(content)}\n`;
    }

    if (format === 'json') {
      return `${formatJSON(content)}\n`;
    }
  } catch (/** @type {any} */ ex) {
    // eslint-disable-next-line no-console
    console.error(ex);

    return '';
  }

  if (/^(?:(?:yaml|toml|json)-)?frontmatter$/.test(format)) {
    const [sd, ed] = fmDelimiters ?? ['---', '---'];
    const body = typeof content.body === 'string' ? content.body : '';

    delete content.body;

    // Support Markdown without a front matter block, particularly for VitePress
    if (!Object.keys(content).length) {
      return `${body}\n`;
    }

    try {
      if (format === 'frontmatter' || format === 'yaml-frontmatter') {
        return `${sd}\n${formatYAML(content, undefined, { quote: yamlQuote })}\n${ed}\n${body}\n`;
      }

      if (format === 'toml-frontmatter') {
        return `${sd}\n${formatTOML(content)}\n${ed}\n${body}\n`;
      }

      if (format === 'json-frontmatter') {
        return `${sd}\n${formatJSON(content)}\n${ed}\n${body}\n`;
      }
    } catch (/** @type {any} */ ex) {
      // eslint-disable-next-line no-console
      console.error(ex);
    }
  }

  return '';
};
