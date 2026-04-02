'use strict';

// -- Annihilate these
const __null__ = () => null;
"undefined" !== typeof window && (window.eval = __null__, window.open = __null__);
"undefined" !== typeof global && (global.eval = __null__);

// --- Verify
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const pkgRoot = __dirname;
const pubKey = path.join(pkgRoot, 'security', 'mldsa87_pub.pem');
const sig = path.join(pkgRoot, 'security', 'cif.js.sig');
const lib = path.join(pkgRoot, 'lib', 'cif.js');


(function() {
  const check = spawnSync('openssl', ['version'], { encoding: 'utf8' });

  if (check.error || !check.stdout) {
    console.error("❌ Integrity Shield: OpenSSL binary not found.");
    process.exit(1);
  }

  // Minimalist split: "OpenSSL 3.6.1 27 Jan 2026..."
  const parts = check.stdout.split(' ');
  const versionStr = (parts[1] || "0.0.0").replace(/[^0-9.]/g, '');
  const versionMajorMinor = parseFloat(versionStr);

  if (versionMajorMinor < 3.5) {
    console.error(`⚠️  Legacy OpenSSL (v${versionStr}) detected. ML-DSA verification may fail.`);
  }

  if (!fs.existsSync(pubKey) || !fs.existsSync(sig) || !fs.existsSync(lib)) {
    console.error("❌ Integrity Shield: Verification files missing.");
    process.exit(1);
  }

  const verifyProc = spawnSync('openssl', [
    'pkeyutl', '-verify', '-pubin', 
    '-inkey', pubKey, 
    '-sigfile', sig, 
    '-in', lib
  ], { stdio: 'inherit' });

  if (verifyProc.status !== 0) {
    console.error("\n❌ Integrity Shield: VERIFICATION FAILED. TAMPERING DETECTED.");
    process.exit(1);
  }
})();
