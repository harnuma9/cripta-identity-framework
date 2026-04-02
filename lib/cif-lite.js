'use strict';
/**
 * @file Cripta Identity Framework (Lite)
 * @license BUSL-1.1 (See LICENSE file in root)
 * @author Aries Harbinger
 * @description Tactical resource-constrained profile for CIF.
 */

const Cripta = require('./cif');

// --- LITE MODE ACTIVATION ---
Cripta.constants._liteMode = true;

// --- RESOURCE CONSTRAINTS ---
Cripta.constants._bitStandardCID = [256];   // Force 17-word simplicity
Cripta.constants._maxOutputLength = 4096;   // 4KB is plenty for any key or secret
Cripta.constants.chunkSize = 64 * 1024;     // Smaller streams for low RAM

// --- CPU OPTIMIZATION ---
Cripta.constants.argon2.passes = 2;         // Speed up derivation
Cripta.constants.argon2.parallelism = 1;    // Avoid thread-spawning overhead

"undefined" != typeof module && module.exports && (module.exports = Cripta);