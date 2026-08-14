const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const outDir = path.join(__dirname, 'providers');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const providers = fs.readdirSync(srcDir).filter(f => fs.statSync(path.join(srcDir, f)).isDirectory());

providers.forEach(provider => {
    const entry = path.join(srcDir, provider, 'index.js');
    if (fs.existsSync(entry)) {
        esbuild.build({
            entryPoints: [entry],
            bundle: true,
            outfile: path.join(outDir, `${provider}.js`),
            format: 'cjs',
            minify: false, // QUAN TRỌNG: Giữ code sạch, không mã hoá!
            // Bỏ qua các thư viện có sẵn trên app Nuvio để file nhẹ
            external: ['cheerio-without-node-native', 'crypto-js', 'axios'] 
        }).then(() => {
            console.log(`[Builder] Đã đóng gói sạch sẽ: ${provider}.js`);
        }).catch(() => process.exit(1));
    }
});
