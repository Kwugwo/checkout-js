import { defineConfig, type Options } from 'tsup';

// BUILD_VARIANT: 'all' (default) | 'dev' | 'prod'
//   all  → ESM + CJS + both unminified (.js) and minified (.min.js) IIFE
//   dev  → ESM + CJS + unminified IIFE only
//   prod → ESM + CJS + minified IIFE only
const variant = process.env.BUILD_VARIANT || 'all';
const includeDev = variant === 'all' || variant === 'dev';
const includeProd = variant === 'all' || variant === 'prod';

// Library entry — consumed by bundlers, never minified (consumer's bundler handles that)
const libraryBuild: Options = {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    target: 'es2020',
    treeshake: true,
    minify: false
};

// IIFE bundles for direct <script> tag / CDN usage
const iifeBase: Options = {
    entry: { 'kwugwo-checkout': 'src/global.ts' },
    format: ['iife'],
    globalName: 'KwugwoCheckout',
    sourcemap: true,
    target: 'es2020',
    clean: false
};

const iifeDev: Options = {
    ...iifeBase,
    minify: false,
    outExtension: () => ({ js: '.global.js' })
};

const iifeProd: Options = {
    ...iifeBase,
    minify: true,
    outExtension: () => ({ js: '.global.min.js' })
};

const configs: Options[] = [libraryBuild];
if (includeDev) configs.push(iifeDev);
if (includeProd) configs.push(iifeProd);

export default defineConfig(configs);
