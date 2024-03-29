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
To get symbolicated stack traces for native crashes, you have to upload debug symbols to Sentry. Sentry Wizard creates a convenient sentry-symbols.js script that will upload the Electron symbols for you. After installing the SDK and every time you upgrade the Electron version, run this script:

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
