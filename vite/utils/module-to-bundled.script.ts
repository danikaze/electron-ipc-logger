import { HtmlTagDescriptor, IndexHtmlTransformResult } from 'vite';

/*
 * hack based on https://github.com/vitejs/vite/discussions/3013#discussioncomment-6793453
 *
 * WHY: Vite bundles the entry script as a module, which is not supported by the
 * browser when loading with file:// protocol.
 *
 * HOW: This plugin moves the import script tag to the end of the body and its
 * attributes to make it work as a "normal" bundled script.
 */
export function moduleToBundleScript() {
  return {
    name: 'module-to-bundle-script',
    transformIndexHtml(html: string): IndexHtmlTransformResult {
      const tags: HtmlTagDescriptor[] = [];

      // transform <script> tags:
      // remove scripts from the html and re-add them at the end of <body>
      html = html.replace(/<script[^>]*>(.*?)<\/script[^>]*>/g, (scriptTag) => {
        const src = scriptTag.match(/src="([^"]*)"/)?.[1];
        if (src) {
          tags.push({
            tag: 'script',
            injectTo: 'body',
            attrs: { src },
          });
        }
        return '';
      });

      // transform <link> tags:
      // just remove the `crossorigin` attribute
      html = html.replace(/<link rel="stylesheet"[^>]*>/g, (match) =>
        match.replace(/crossorigin\s+/, '')
      );

      return {
        html,
        tags,
      };
    },
  };
}
