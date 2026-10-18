# Deploy the portfolio to Cloudflare Pages

GitHub Actions builds pull requests without Cloudflare credentials. Pushes to `main` build and deploy to production. You can also run **Deploy to Cloudflare Pages** manually from the Actions tab; select `main`.

## One-time setup

In this repository, open **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | A Cloudflare API token with **Account → Cloudflare Pages → Edit**, scoped to your account |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID (32 characters), not a zone ID |

Create the token in your Cloudflare profile's API Tokens page. Enter it directly into GitHub; do not put it in source code, workflow YAML, or chat. If you already have these secrets at organization level, give this repository access to them.

The default project name is `karthik-guduri-portfolio`. The workflow finds or creates the project and uses its returned hostname. To select another name, add an Actions **repository variable** named `CLOUDFLARE_PAGES_PROJECT`. If Cloudflare reports that the hostname is taken, choose a unique name in this variable and rerun.

## First deployment

1. Merge the workflow PR into `main`.
2. Open **Actions → Deploy to Cloudflare Pages**.
3. The push starts a run automatically. If you added the secrets afterward, choose **Run workflow → main**.
4. Open the successful run's summary and click **Open portfolio**.

The live URL is only confirmed after a successful run. The workflow deploys the built `dist/` artifact and verifies that the resulting page responds and includes the portfolio name.

## What it runs

- Build: Node 22, `npm ci`, lint, TypeScript and Vite production build.
- Deploy: download the same build artifact, validate credentials, find/create the Pages project with production branch `main`, upload with Wrangler, and verify the public homepage.
- No production deploy runs from a pull request or a manual run on a different branch.
- The default GitHub token has read-only repository permissions. Cloudflare credentials are supplied only to the deployment job.

## Common failures

- **Missing credentials:** add both secrets above, then rerun.
- **401/403 from Cloudflare:** check token validity, account scope and Pages Edit permission.
- **Project name unavailable:** change `CLOUDFLARE_PAGES_PROJECT`.
- **Existing project has a different production branch:** choose a new project name, or review its settings before reusing it.
- **Build failed:** check the build job's logs; the deployment job will not run.

Official reference: https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/
