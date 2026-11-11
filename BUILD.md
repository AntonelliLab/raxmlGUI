# Building

## App
### Before pushing
* Check if there are any warnings in the console. Those will be treated as errors in the CI environment.

### Recommended GitHub Releases Workflow¶
From [electron.build publish](https://www.electron.build/configuration/publish#recommended-github-releases-workflow)

1. Draft a new release. Set the “Tag version” to the value of version in your application package.json, and prefix it with v. “Release title” can be anything you want.
2. For example, if your application package.json version is 1.2.3, your draft’s “Tag version” would be v1.2.3.
3. Push some commits. Every CI build will update the artifacts attached to this draft.
4. Once you are done, publish the release. GitHub will tag the latest commit for you.
The benefit of this workflow is that it allows you to always have the latest artifacts, and the release can be published once it is ready.
5. Update CHANGELOG and the download links in `docs/_layouts/default.html` to the new version.
5. Bump the version in package.json to use for the next draft and push to update the download links on the github page.
6. Uploading Debug Information

A production build uploads JavaScript source maps for the main process and the page when `SENTRY_ORG` and `SENTRY_AUTH_TOKEN` are set. The release name is `raxmlGUI@version`. The preload is not included, and a dev start does not upload.

Native crash symbols stay a manual upload. `sentry-symbols.js` downloads the Electron symbols and uploads them with `sentry-cli upload-dif`. After installing the SDK, and again after every Electron upgrade, run `node sentry-symbols.js`.

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
