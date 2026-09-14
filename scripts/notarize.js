require('dotenv').config();
const { execSync } = require('child_process');
const { notarize } = require('@electron/notarize');

const EXPECTED_TEAM_ID = '9VR92ZCXA8';
const EXPECTED_IDENTITY = `Developer ID Application: Johannes Klein (${EXPECTED_TEAM_ID})`;

function assertDeveloperIdSigned(appPath) {
  const output = execSync(`codesign -dv --verbose=4 "${appPath}" 2>&1`, {
    encoding: 'utf8',
  });

  if (!output.includes('Authority=Developer ID Application')) {
    throw new Error(
      `Refusing to notarize ${appPath}: app is not signed with a Developer ID Application certificate (expected ${EXPECTED_IDENTITY}).`
    );
  }

  if (!output.includes(`TeamIdentifier=${EXPECTED_TEAM_ID}`)) {
    throw new Error(
      `Refusing to notarize ${appPath}: expected TeamIdentifier=${EXPECTED_TEAM_ID}.`
    );
  }
}

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appleId = process.env.APPLEID;
  const appleIdPassword = process.env.APPLEIDPASS;
  const teamId = process.env.APPLEIDTEAM;

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
  if (!teamId) {
    console.log(
      'Johannes: Skipping notarization of app because no AppleID team number is given.'
    );
    console.log('Johannes: This binary is not ready for release.');
    return;
  }
  if (teamId !== EXPECTED_TEAM_ID) {
    throw new Error(
      `Refusing to notarize: APPLEIDTEAM=${teamId} does not match signing team ${EXPECTED_TEAM_ID}.`
    );
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  assertDeveloperIdSigned(appPath);

  console.log(`Notarizing ${appName} found at ${appOutDir}`);

  return await notarize({
    appBundleId: 'org.jtklein.raxmlGUI2',
    appPath,
    appleId,
    appleIdPassword,
    teamId,
  });
};
