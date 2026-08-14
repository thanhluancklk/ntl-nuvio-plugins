const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const outDir = path.join(__dirname, 'providers');
const TARGET_PLUGINS = ['goated', 'videasy', 'cinefreak', '4khdhub', 'uhdmovies', 'netmirro', 'onlykdrama'];

if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

TARGET_PLUGINS.forEach(provider => {
    const entry = path.join(srcDir, provider, 'index.js');
    if (fs.existsSync(entry)) {
        esbuild.build({
            entryPoints: [entry],
            bundle: true,
            outfile: path.join(outDir, `${provider}.js`),
            format: 'cjs',
            minify: false,
            external: ['cheerio-without-node-native', 'crypto-js', 'axios'] 
        }).then(() => {
            console.log(`[Builder] Đã đóng gói sạch sẽ: ${provider}.js`);
        }).catch(() => process.exit(1));
    }
});
