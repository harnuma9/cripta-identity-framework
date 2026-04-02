const Cripta = require('../lib/cif');

(async () => {
   const pin = '1234';  // Your PIN number

   await Cripta.toggleAirGap(false);   // Toggle AirGap (Default: true)
   console.log('\n');
   await Cripta.help();   // Console Help (deprecated)


   /****** THE BASE ******/

   // Generate Cryptographic ID (Sizes: 256, 384, 512)
   const { tvCode, mnemonic: cid } = await Cripta.generateCID(256);

   // Generate Nonce ID
   const nid = await Cripta.generateNID('My-xmr-wallet#01', 'X', 32);

   // Derive Password Type
   const res = await Cripta.recoverPass(cid, nid, pin); //  25-word Monero seed phrase


   /****** KLAEM MODE ******/
 
   const message = '> Hello world!';

   const nid1 = await Cripta.generateNID('AES-vault#01', 'R', 'AES');
   const nid2 = await Cripta.generateNID('ChaCha20-vault#02', 'R', 'CHACHA');
 
   // AES-256-GCM
   const ciphertext1 = await Cripta.aesEncrypt(cid, nid1, pin, {
     data: message
   });

   const plaintext1 = await Cripta.aesDecrypt(cid, nid1, pin, {
     data: ciphertext1
   });

   // ChaCha20-Poly1305
   const ciphertext2 = await Cripta.chachaEncrypt(cid, nid2, pin, {
     obscureMode: true,  // encrypts nonce and tag
     data: message
   });

   const plaintext2 = await Cripta.chachaDecrypt(cid, nid2, pin, {
     obscureMode: true,
     data: ciphertext2
   });


   /****** ML-KEM mode ******/

   let aliceEncapped, bobDecapped;

   if (await Cripta.kyber.selfCheck())  // Perform a necessary check
   {
     // Generate keypair
     const aliceKeys = await Cripta.kyber.generate(768);
     const bobKeys = await Cripta.kyber.generate(768);

     // Format-agnostic input
     aliceEncapped = await Cripta.encapsulateCID(768, bobKeys.pub.hex, true);
     bobDecapped = await Cripta.decapsulateCID(768, bobKeys.priv.base64, aliceEncapped.ciphertext.base58);
   }

   /****** Additional Utils ******/

   // Obtain other CID formats
   const recoveredFromTV = await Cripta.recoverOtherCID(tvCode);
   const recoveredFromMn =await Cripta.recoverOtherCID(cid);

   // Turn your NID into QR code
   const terminalQR = await Cripta.generateNidQR(nid, { format: 'terminal' });

   // Generate 8 words mental key (128-bit)
   const mentalKey = await Cripta.generateMentalKey();
   // Optional [SECRET] salt (prevent rainbow table attack)
   const saltObf = 'the-sky-is-blue-and-the-ocean-is-deep';

   // Obfuscate CID
   const { mnemonic9: mnemonicObf, scrambled1, scrambled2 } = await Cripta.obfuscateCID(cid, mentalKey, saltObf);
   // Deobfuscate CID
   const recoveredCID = await Cripta.deobfuscateCID(mnemonicObf, scrambled1, scrambled2, saltObf);

   // Scramble CIDs (20 decoys)
   const { mnemonic9: mnemonicVault, splitCIDs } = await Cripta.vaultMixCIDs(cid, mentalKey, 20);
   // Uncramble CIDs
   const recoveredFromVault = await Cripta.vaultUnmixCIDs(mnemonicVault, splitCIDs);

   console.log('\n');
   console.log('\n--- Output');
   console.log('Private CID (TV Code): ', tvCode);
   console.log('Private CID (Mnemonic): ', cid);
   console.log('Public NID: ', nid);
   console.log('PIN number: ', pin);
   console.log('Result: ', res);

   console.log('\n--- KLAEM Results');
   console.log('\nNID1: ', nid1);
   console.log('AES test: ', plaintext1.toString() === message);
   console.log('\nNID2: ', nid2);
   console.log('CHACHA20 test: ', plaintext2.toString() === message);

   console.log('\n--- ML-KEM Results');
   console.log((aliceEncapped.tvCode === bobDecapped.tvCode)
   ? "✅ Result: P2P Post-Quantum handshake verified."
   : `❌ Result: P2P Post-Quantum handshake failed!\n Expected: ${aliceEncapped.tvCode}\n Got: ${bobDecapped.tvCode}`);

   console.log('\n--- Additional Results');
   console.log((recoveredFromTV.mnemonic === cid)
   ? "✅ Success: TV-Code recovered the correct Mnemonic."
   : `❌ Failure: TV-Code did NOT recover the correct Mnemonic.\n Expected: ${cid}\n Got: ${recoveredFromTV.mnemonic}`);

   console.log((recoveredFromMn.tvCode === tvCode)
   ? "✅ Success: Mnemonic recovered the correct TV-Code."
   : `❌ Failure: Mnemonic did NOT recover the correct TV-Code.\n Expected: ${tvCode}\n Got: ${recoveredFromMn.tvCode}`);

   console.log((recoveredCID.mnemonic === cid)
   ? "✅ Success: Deobfuscated CID matches the original CID mnemonic."
   : `❌ Failure: Deobfuscated CID does NOT match the original CID mnemonic.\n Expected: ${cid}\n Got: ${recoveredCID.mnemonic}`);

   console.log((recoveredFromVault.mnemonic === cid)
   ? "✅ Success: Unscrambled and Deobfuscated CID matches the original CID mnemonic."
   : `❌ Failure: Unscrambled and Deobfuscated CID does NOT match the original CID mnemonic.\n Expected: ${cid}\n Got: ${recoveredFromVault.mnemonic}`);

   console.log(`\nQR Code for "${nid}"`);
   console.log(terminalQR);

   console.log('\n');
   await Cripta.toggleAirGap(true);
})();