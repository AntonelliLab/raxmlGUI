require('dotenv').config();
const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appleId = process.env.APPLEID;
  const appleIdPassword = process.env.APPLEIDPASS;
  const ascProvider = process.env.APPLEIDTEAM;

  if (!appleId) {
    console.log(
      'Johannes: Skipping notarization of app because no AppleID is given.'
    );
    console.log('Johannes: This binary is not ready for release.');
    return;
  }
  if (!appleIdPassword) {
    console.log(
      'Johannes: Skipping notarization of app because no AppleID password is given.'
    );
    console.log('Johannes: This binary is not ready for release.');
    return;
  }
  if (!ascProvider) {
    console.log(
      'Johannes: Skipping notarization of app because no AppleID team number is given.'
    );
    console.log('Johannes: This binary is not ready for release.');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  console.log(`Notarizing ${appName} found at ${appOutDir}`);

  return await notarize({
    appBundleId: 'org.jtklein.raxmlGUI2',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
    ascProvider: process.env.APPLEIDTEAM,
  });
};
