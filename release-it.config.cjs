const syncTauriVersion = `node -e ${JSON.stringify(`
const fs = require('node:fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const configPath = 'src-tauri/tauri.conf.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
config.version = packageJson.version;
fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\\n');
`)}`;

module.exports = {
  git: {
    commitMessage: "chore: release goose-overlay v${version}",
    tagName: "v${version}",
  },
  github: {
    assets: [
      "src-tauri/target/release/bundle/**/*.dmg",
      "src-tauri/target/release/bundle/**/*.app.tar.gz",
      "src-tauri/target/release/bundle/**/*.app.tar.gz.sig",
      "src-tauri/target/release/bundle/**/*.msi",
      "src-tauri/target/release/bundle/**/*.deb",
      "src-tauri/target/release/bundle/**/*.rpm",
      "src-tauri/target/release/bundle/**/*.AppImage",
    ],
    autoGenerate: true,
    draft: true,
    release: true,
    releaseName: "goose-overlay v${version}",
  },
  hooks: {
    "before:bump": "npm run format:check && npm run lint",
    "after:bump": syncTauriVersion,
    "before:git:release": "git add src-tauri/tauri.conf.json",
    "before:github:release": "npm run tauri -- build",
  },
  npm: false,
};
