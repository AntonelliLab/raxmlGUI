# Building

## App
### Before pushing
* Check if there are any warnings in the console. Those will be treated as errors in the CI environment.

### What CI builds

`.github/workflows/build.yaml` builds the app on macOS, Ubuntu and Windows for every push and every PR into `master`. Only a `v*` tag publishes.

| Build | Publishes | macOS signs and notarizes |
|---|---|---|
| `v*` tag | yes, to a draft release | required; the build fails otherwise |
| PR from a branch in this repo | no | required; the build fails otherwise |
| PR from a fork | no | no; GitHub gives fork PRs no secrets, so the run warns |
| Other branch push | no | only if the repo has the signing secrets |

Signing needs the `mac_certs` and `mac_certs_password` secrets. Notarizing needs `apple_id`, `apple_id_pass` and `apple_id_team`. To check signing before a release, open the PR from a branch in this repo, not a fork.

### Releasing a version

1. Set `version` in `package.json` to the new version, for example `2.1.0`. Update `CHANGELOG.md` and the download links in `docs/_layouts/default.html`. Merge to `master`.
2. Tag that commit with `v` and the same version, and push the tag:
   ```
   git tag v2.1.0
   git push origin v2.1.0
   ```
   CI builds all three platforms and uploads them to a draft release named `v2.1.0`, creating the draft if needed. electron-builder names the release from `package.json`, not from the tag, so the two must match.
3. Check the draft on GitHub, then publish it. Auto-update and the download links only see a published release.

A tag pushed after its release is already published uploads nothing; electron-builder only logs a warning. To redo a release, delete the release and tag, or bump the version.

To publish from your own machine instead, set `GH_TOKEN` and run `yarn publish-all`. It packs for every platform, but macOS can only be signed and notarized on a Mac.

### Uploading debug information

A production build uploads JavaScript source maps for the main process and the page when `SENTRY_ORG` and `SENTRY_AUTH_TOKEN` are set. The release name is `raxmlGUI@version`. The preload is not included, and a dev start does not upload.

Native crash symbols are not uploaded. To add them, download the Electron symbols for the installed Electron version and upload them with `sentry-cli upload-dif`.

## Homepage

Build steps for local development

## Prerequisites
Install ruby 2.4 or higher

Run
```
gem install jekyll bundler
```

In docs folder, run
```
bundle install
```

## Local serve

Run npm script `docs-serve` or in docs folder run
```
bundle exec jekyll serve
```
