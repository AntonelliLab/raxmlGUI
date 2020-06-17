# Building

## Before pushing
* Check if there are any warnings in the console. Those will be treated as errors in the CI environment.

## Recommended GitHub Releases Workflow¶
From [electron.build publish](https://www.electron.build/configuration/publish#recommended-github-releases-workflow)

1. Draft a new release. Set the “Tag version” to the value of version in your application package.json, and prefix it with v. “Release title” can be anything you want.
2. For example, if your application package.json version is 1.0, your draft’s “Tag version” would be v1.0.
3. Push some commits. Every CI build will update the artifacts attached to this draft.

Once you are done, publish the release. GitHub will tag the latest commit for you.
The benefit of this workflow is that it allows you to always have the latest artifacts, and the release can be published once it is ready.
