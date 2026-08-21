# Publishing `esm-reports-app` to npm

This guide documents the process used to publish:

```text
@nmrs-community/esm-reports-app@5.2.5
```

The package is publicly available at:

```text
https://www.npmjs.com/package/@nmrs-community/esm-reports-app
```

The commands below use PowerShell on Windows and assume that the repository is located at:

```text
C:\Users\i7\openmrs_projects\openmrs-esm-admin-tools
```

## What publishing to npm does

Publishing uploads the package source and production `dist` files to the npm registry. It does not, by itself, update an NMRS distro or its import map. A distro must subsequently reference or install the published version.

Every npm release must have a unique version. npm does not permit an existing version to be overwritten.

## 1. Define the working paths

```powershell
$repo = 'C:\Users\i7\openmrs_projects\openmrs-esm-admin-tools'
$package = Join-Path $repo 'packages\esm-reports-app'
Set-Location $repo
```

Defining these paths avoids repeatedly typing long paths and makes the later commands easier to verify.

## 2. Check the repository before releasing

```powershell
git status --short --branch
git log --oneline origin/main..HEAD
```

Confirm that:

- All intended application changes are committed.
- There are no unexpected modified or untracked source files.
- Local credentials such as `.npmrc` are not staged.

The repository ignores `.npmrc` files so that npm credentials cannot be accidentally committed:

```gitignore
.npmrc
```

Never commit an npm access token.

## 3. Check the current npm version

```powershell
corepack yarn npm info @nmrs-community/esm-reports-app --json
```

The registry already contained version `5.2.4`, so the new release was assigned version `5.2.5`.

Update the version in:

```text
packages/esm-reports-app/package.json
```

For the published release, the change was:

```json
{
  "name": "@nmrs-community/esm-reports-app",
  "version": "5.2.5"
}
```

Commit the version change before creating the release package:

```powershell
git add packages/esm-reports-app/package.json
git commit -m "chore(reports): release v5.2.5"
```

For later releases, choose the version according to semantic versioning:

- Patch, for example `5.2.5` to `5.2.6`: compatible fixes and small refinements.
- Minor, for example `5.2.5` to `5.3.0`: backward-compatible features.
- Major, for example `5.2.5` to `6.0.0`: breaking changes.

## 4. Exclude development-only artifacts

The package contains this file:

```text
packages/esm-reports-app/.npmignore
```

Its contents are:

```gitignore
.turbo/
dist/*hot-update*
dist/**/*hot-update*
```

This prevents npm from publishing Turborepo logs and Webpack development-server hot-update files.

When this protection was added, it was committed with:

```powershell
git add packages/esm-reports-app/.npmignore
git commit -m "chore(reports): exclude development build artifacts"
```

## 5. Run the release checks and production build

From the repository root, run:

```powershell
corepack yarn turbo run lint typescript test build --filter=@nmrs-community/esm-reports-app
```

This performs four checks for the reports package:

- `lint`: checks the source for ESLint problems.
- `typescript`: performs TypeScript validation.
- `test`: runs the Jest test suite.
- `build`: creates the production Webpack bundle.

For version `5.2.5`, all four tasks passed and all 16 tests passed.

`corepack yarn` is used instead of plain `yarn` because the repository pins Yarn `4.10.3`, while a global `yarn` executable may not be installed or may have the wrong version.

The build emitted a warning about two large JavaScript chunks. It did not fail the build or block publishing, but bundle-size optimization can be handled separately.

## 6. Use an isolated release build when a development server is running

This section was necessary during the `5.2.5` release because a local OpenMRS development server was actively rewriting the normal `dist` directory with development bundles and hot-update files.

If no development server is running and `dist` contains only a fresh production build, you can proceed to the package inspection section. Otherwise, use the isolated process below.

### 6.1 Create a clean staging directory

```powershell
$version = '5.2.5'
$staging = Join-Path $env:TEMP "esm-reports-app-$version-release"
New-Item -ItemType Directory -Path $staging -Force | Out-Null
```

Use a dedicated directory containing only release files. Do not use a broad directory such as the repository root as a cleanup target.

### 6.2 Export the committed package source

Run this command from the repository root:

```powershell
Set-Location $repo
git archive --format=tar --output="$staging\source.tar" HEAD packages/esm-reports-app
tar -xf "$staging\source.tar" -C $staging
```

`git archive` exports the committed package files. It excludes untracked credentials, development caches, and other working-tree files.

Define the exported package path:

```powershell
$stagedPackage = Join-Path $staging 'packages\esm-reports-app'
```

### 6.3 Build directly into the staging package

```powershell
Set-Location $package
corepack yarn webpack --mode production --output-path "$stagedPackage\dist"
```

This uses the installed repository dependencies but writes the production output into the isolated staging package. The running development server can continue writing to the normal `dist` directory without affecting the release.

Expected principal production files include:

```text
dist/nmrs-community-esm-reports-app.js
dist/nmrs-community-esm-reports-app.js.buildmanifest.json
dist/routes.json
```

## 7. Inspect the npm tarball before publishing

Run the dry-run from the clean package directory:

```powershell
Set-Location $stagedPackage
npm pack --dry-run
```

This shows exactly what npm intends to upload without publishing anything.

Confirm that:

- The package name is `@nmrs-community/esm-reports-app`.
- The version is the intended new version.
- The `dist` directory and principal bundle are present.
- No `.npmrc` file is present.
- No `.turbo` files are present.
- No filename contains `hot-update`.

For the `5.2.5` release, the verified production entry bundles were approximately:

```text
dist/main.js                                10.7 KB
dist/nmrs-community-esm-reports-app.js       8.3 KB
```

Unexpectedly large entry bundles or hot-update files usually indicate that Webpack development output has replaced the production build.

## 8. Authenticate securely with npm

The package uses the public npm registry:

```ini
registry=https://registry.npmjs.org/
```

Authentication can be established with npm's browser login:

```powershell
npm login --registry=https://registry.npmjs.org/ --auth-type=web
```

However, npm may still require either:

- A current authenticator one-time password during publishing; or
- A granular npm access token with package read/write permission and bypass-2FA enabled.

For local token-based publishing, the token can be placed in the ignored package `.npmrc` file:

```ini
registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=REPLACE_WITH_A_VALID_GRANULAR_TOKEN
```

Do not put a real token in documentation, source control, terminal history, or chat messages. Rotate a token immediately if it may have been exposed.

Validate authentication without displaying the token:

```powershell
$npmConfig = Join-Path $package '.npmrc'
npm --userconfig $npmConfig whoami --registry=https://registry.npmjs.org/
```

The expected account for this release was:

```text
adebawo-damilare
```

## 9. Publish the release

After the build and dry-run have been verified, publish the clean staged package:

```powershell
npm --userconfig $npmConfig publish $stagedPackage `
  --access public `
  --tag latest `
  --registry=https://registry.npmjs.org/
```

Explanation of the options:

- `--userconfig $npmConfig`: uses the selected local npm credential file without copying it into the staging package.
- `--access public`: makes the scoped package publicly downloadable.
- `--tag latest`: makes this version the default version installed by npm.
- `--registry`: explicitly targets the public npm registry.

A successful publish ends with output similar to:

```text
+ @nmrs-community/esm-reports-app@5.2.5
```

Do not rerun the publish command after success. npm versions are immutable, and the same version cannot be published twice.

## 10. Verify the published package

```powershell
corepack yarn npm info @nmrs-community/esm-reports-app --json
```

Verify that:

- `versions` includes the new version.
- `dist-tags.latest` equals the new version.
- The package metadata reports the correct browser entry:

```text
dist/nmrs-community-esm-reports-app.js
```

For the completed release, npm reported:

```text
latest: 5.2.5
```

You can also check the npm website:

```text
https://www.npmjs.com/package/@nmrs-community/esm-reports-app/v/5.2.5
```

## 11. Remove the temporary staging directory

First confirm the exact staging path:

```powershell
$resolvedStaging = (Resolve-Path -LiteralPath $staging).Path
$resolvedStaging
```

Only after confirming that it is the dedicated temporary release directory, remove it:

```powershell
Remove-Item -LiteralPath $resolvedStaging -Recurse -Force
```

This removes only generated release files. It does not affect the repository, the published package, or the running development server.

## 12. Check and push the Git commits separately

```powershell
Set-Location $repo
git status --short --branch
git log --oneline origin/main..HEAD
```

Publishing to npm does not push commits to GitHub. Push the reviewed commits separately when ready:

```powershell
git push origin main
```

The `5.2.5` release-related commits were:

```text
fb49030 chore(reports): release v5.2.5
ff51672 chore(reports): exclude development build artifacts
a655f34 chore: ignore local npm credentials
```

## 13. Run `esm-reports-app` locally

There are two useful local workflows:

- Run the package directly from its source code for development and immediate hot reload.
- Build the NMRS frontend configuration against the published npm version to test what a deployment will consume.

### Option A: Run the package from source

This is the recommended workflow while developing or testing code changes.

#### 13.1 Start the OpenMRS backend

Make sure the OpenMRS backend is already running and that you can reach it in a browser. The reports app requires these backend modules:

- `webservices.rest`
- `reporting`
- `reportingrest`
- `nmrsreports`

For example, if the backend is available at:

```text
http://localhost:8081/openmrs
```

then the backend origin supplied to the frontend development server is:

```text
http://localhost:8081
```

Do not include `/openmrs/spa` in the `--backend` value. The OpenMRS development server uses `/openmrs` as its default API path.

#### 13.2 Install the frontend dependencies

From the repository root:

```powershell
Set-Location 'C:\Users\i7\openmrs_projects\openmrs-esm-admin-tools'
corepack yarn install --immutable
```

`--immutable` ensures that installation matches `yarn.lock` and fails instead of silently modifying the lockfile.

You normally need to run this command only after cloning the repository or changing dependencies.

#### 13.3 Start only `esm-reports-app`

When the OpenMRS backend is running on port `8081`, run:

```powershell
corepack yarn start `
  --sources 'packages/esm-reports-app' `
  --backend http://localhost:8081 `
  --port 8080
```

This command:

- Starts the OpenMRS frontend development shell on port `8080`.
- Loads `esm-reports-app` directly from the local source directory.
- Proxies OpenMRS API calls to the backend on port `8081`.
- Watches the source files and rebuilds when they change.
- Opens the local O3 frontend in the default browser.

Open the reports page directly at:

```text
http://localhost:8080/openmrs/spa/reports
```

The frontend port and backend port must be different. If port `8080` is already occupied, choose another frontend port:

```powershell
corepack yarn start `
  --sources 'packages/esm-reports-app' `
  --backend http://localhost:8081 `
  --port 8082
```

Then open:

```text
http://localhost:8082/openmrs/spa/reports
```

If the backend is running on port `8086`, use:

```powershell
corepack yarn start `
  --sources 'packages/esm-reports-app' `
  --backend http://localhost:8086 `
  --port 8080
```

The repository's `spa-build-config.json` currently points to `http://localhost:8086`. Supplying `--backend` explicitly is clearer when switching between local OpenMRS servers.

#### 13.4 Verify the local application

After signing into OpenMRS, check that:

- `/openmrs/spa/reports` opens without a module-loading error.
- The reports history table loads.
- The **Run reports** action opens the report form.
- The report list displays only the intended visible reports and is alphabetically sorted.
- `ART Linelist` and `HTS EXPORT` are available.
- The browser Network panel shows API requests going to the selected local backend.

The frontend calls relative OpenMRS REST URLs, so no backend address is hard-coded in the reports app itself.

#### 13.5 Stop the local development server

Return to the PowerShell window running the frontend and press:

```text
Ctrl+C
```

The development server writes development bundles and hot-update files while it is running. Do not publish its live `dist` directory. Use the production or isolated release build described earlier in this guide.

### Option B: Build the NMRS configuration using the published npm package

Use this workflow to verify that the NMRS configuration can resolve and assemble the version published to npm.

The build configuration is:

```text
C:\Users\i7\openmrs_projects\openmrs-config-nmrs-main\configuration\prod-build-config.json
```

It currently contains:

```json
{
  "frontendModules": {
    "@nmrs-community/esm-reports-app": "latest"
  }
}
```

Because npm's `latest` tag points to `5.2.5`, this resolves version `5.2.5`. For a reproducible deployment, pin the exact version instead:

```json
{
  "frontendModules": {
    "@nmrs-community/esm-reports-app": "5.2.5"
  }
}
```

From Git Bash, run the configuration's build script:

```bash
cd /c/Users/i7/openmrs_projects/openmrs-config-nmrs-main
./prod-build.sh
```

From WSL, use the mounted Windows drive path:

```bash
cd /mnt/c/Users/i7/openmrs_projects/openmrs-config-nmrs-main
./prod-build.sh
```

From PowerShell with a Bash executable available, the equivalent command is:

```powershell
Set-Location 'C:\Users\i7\openmrs_projects\openmrs-config-nmrs-main'
bash ./prod-build.sh
```

The script:

- Removes the previous generated `frontend` directory.
- Downloads and assembles the configured frontend modules from npm.
- Writes the assembled O3 frontend to `openmrs-config-nmrs-main/frontend`.
- Adds the NMRS configuration and logo assets.

The cleanup performed by `prod-build.sh` is expected, but any manual files placed inside the generated `frontend` directory will be removed. Keep source configuration and custom assets outside that generated directory.

After the build, confirm that the generated import map contains the correct module:

```powershell
Select-String `
  -Path 'C:\Users\i7\openmrs_projects\openmrs-config-nmrs-main\frontend\importmap.json' `
  -Pattern '@nmrs-community/esm-reports-app'
```

Deploy or copy the generated `frontend` directory using the local OpenMRS SPA-serving setup, restart that frontend if required, and then open:

```text
http://localhost:<local-port>/openmrs/spa/reports
```

Use Option A when actively changing the app. Use Option B when validating the exact npm package that will be consumed by an NMRS distribution.

## Troubleshooting

### `yarn` is not recognized

Use Corepack so that the repository's pinned Yarn version is selected:

```powershell
corepack yarn --version
corepack yarn turbo run build --filter=@nmrs-community/esm-reports-app
```

### npm returns `401 Unauthorized`

The credential is missing, expired, revoked, or being read from the wrong `.npmrc` file.

```powershell
npm --userconfig $npmConfig whoami --registry=https://registry.npmjs.org/
```

Rotate the credential if necessary. Do not keep retrying with a token that may have been exposed.

### npm returns `403 Forbidden` mentioning two-factor authentication

The account is authenticated, but the credential is not authorized for direct publishing. Use a current npm authenticator code or a granular read/write token configured to bypass 2FA for publishing.

### npm says the version already exists

Check the registry and increment the package version:

```powershell
corepack yarn npm info @nmrs-community/esm-reports-app --json
```

Never attempt to replace an existing npm version.

### The tarball contains `.turbo` or `hot-update` files

Confirm that `.npmignore` contains the required exclusions, then create a new isolated production build and rerun:

```powershell
npm pack --dry-run
```

### The development server changes `dist` while packaging

Do not publish the live `dist` directory. Use the isolated staging build described in section 6. This allows development to continue without stopping the server and keeps the release deterministic.

## Condensed release checklist

```text
[ ] Intended source changes are committed
[ ] Existing npm version checked
[ ] package.json version incremented and committed
[ ] .npmrc is ignored by Git
[ ] Lint passed
[ ] TypeScript validation passed
[ ] Tests passed
[ ] Production build passed
[ ] npm pack --dry-run inspected
[ ] No credentials, Turbo logs, or hot-update files included
[ ] npm whoami returned the expected maintainer
[ ] Package published with public access and the latest tag
[ ] npm registry confirms the new latest version
[ ] Temporary release staging directory removed
[ ] Git commits pushed separately when ready
[ ] Local source-development command verified when applicable
[ ] Published version resolved by the NMRS build configuration when applicable
```
