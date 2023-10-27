![](/banner.png)

<h1 align="center">laravel-deploy</h1>

<p align="center">
    <strong>A GitHub Action to create on-demand preview environments for Laravel apps.</strong>
</p>

<p align="center">
    <a href="https://github.com/TzviPM/laravel-deploy/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-darkcyan.svg" alt="MIT License"></a>
</p>

## About

`TzviPM/laravel-deploy` is a GitHub Action to automatically deploy new Laravel app instances to Laravel Forge using Envoyer, including branching PlanetScale mysql databases. It's perfect for creating PR preview environments that are isolated, publicly accessible (or privately, depending on your server's settings), and closely resemble your production environment, to preview and test your changes.

When you open a PR and this action runs for the first time, it will:

- Create a new site on Forge with a unique subdomain.
- Create a new project on Envoyer linked to the Forge site and install your Laravel app into it.
- Create a new branch in PlanetScale for the site and configure your app to use it.
- Create and install an SSL certificate and comment on your PR with a link to the site.
- Set up a scheduled job in Forge to run your site's scheduler.
- Enable push-to-deploy on the site so that it updates automatically when you push new code.

## Requirements

Before adding this action to your workflows, make sure you have:

- A Laravel Forge [app server](https://forge.laravel.com/docs/1.0/servers/types.html#app-servers).
- A [wildcard subdomain DNS record](https://en.wikipedia.org/wiki/Wildcard_DNS_record) pointing to your Forge server.
- A Forge API token.
- An Envoyer API token.
- A PlanetScale database and Service token.

## Usage

> **Warning**: This action has direct access to your Laravel Forge, Envoyer, and PlanetScale accounts and should only be used in trusted contexts. Anyone who can push to a GitHub repository using this action will be able to execute code on the connected accounts and servers.

Add your tokens as a [Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository) in your GitHub repository. Then, use `TzviPM/laravel-deploy` inside any workflow.

For the action to be able to clean up preview sites and other resources after a PR is merged, it has to be triggered on the pull request "closed" event. By default, GitHub's `pull_request` event does _not_ trigger a workflow run when its activity type is `closed`, so you may need to place this action in its own workflow file that specifies that event type:

```yaml
# deploy-preview.yml
on:
  pull_request:
    types: [opened, closed]
jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: TzviPM/laravel-deploy@v1
        with:
          forge-token: ${{ secrets.FORGE_TOKEN }}
          envoyer-token: ${{ secrets.ENVOYER_TOKEN }}
          pscale-token-id: ${{ secrets.PSCALE_TOKEN_ID }}
          pscale-token: ${{ secrets.PSCALE_TOKEN }}
          pscale-organization: myorg
          pscale-database: abc_db
          project: My Org Portal
          php-version: php81
          environment: |
            APP_NAME="My Org Portal"
          servers: |
            abc.myorg.com 60041
```

### Inputs

#### `forge-token` (required)

The `forge-token` input parameter accepts your Forge API token, which the action uses to communicate with Laravel Forge to create sites and other resources. **Store this value in an encrypted secret; do not paste it directly into your workflow file.**

#### `envoyer-token` (required)

The `envoyer-token` input parameter accepts your Envoyer API token, which the action uses to communicate with Envoyer to create projects and other resources. **Store this value in an encrypted secret; do not paste it directly into your workflow file.**

#### `project`

The `project` input parameter allows you to specify a friendly name to prefix projects in Envoyer. If not specified, a project name will be auto-generated based on the name of the repository.

#### `php-version`

The php version to use for the envoyer server. PHP Versions:

| Version | Slug  |
|---------|-------|
| PHP 8.1 |	php81 |
| PHP 8.0 |	php80 |
| PHP 7.4 |	php74 |
| PHP 7.3 |	php73 |
| PHP 7.2 |	php72 |
| PHP 7.1 |	php71 |
| PHP 7.0 |	php70 |
| PHP 5.6 |	php56 |

#### `pscale-token-id` and `pscale-token` (required)

The `pscale-token-id` and `pscale-token` input parameters accept your PlanetScale Service API token and id, which the action uses to communicate with PlanetScale to create database branches and other resources. **Store this value in an encrypted secret; do not paste it directly into your workflow file.**

#### `pscale-organization` and `pscale-database` (required)

The `pscale-organization` and `pscale-database` input parameters accept your PlanetScale organization and database IDs, which the action uses to identify the corresponding resources in PlanetScale. **Make sure your API token has been granted access to these resources.**

#### `servers` (required)

The `servers` input parameter accepts a list of Forge servers to deploy to.

Each server must include both a domain name and a server ID, separated by a space. The domain name should be the wildcard subdomain pointing at that server (without the wildcard part). For example, if your wildcard subdomain is `*.abc.myorg.com` and your Forge server ID is `60041`, set this input parameter to `abc.myorg.com 60041`.

If this input parameter contains multiple lines, each line will be treated as a different Forge server. The action currently only deploys to one server; if you list multiple servers, it will use the first one.

#### `environment`

The `environment` input parameter allows you to add and update environment variables in the preview site.

## Development

This action is based on [Jacob Baker-Kretzmar (bakerkretzmar)]([bakerkretzmar](https://github.com/bakerkretzmar))'s [laravel-deploy-preview](https://github.com/bakerkretzmar/laravel-deploy-preview) action. It's written in TypeScript using NestJS and compiled with [`ncc`](https://github.com/vercel/ncc) into a single JavaScript file.

Run `npm run build` to compile a new version of the action for distribution.

To run the action locally, create a `.env` file and add your API tokens to it, then run `npm run start`.

When releasing a new version of the action, update the major version tag to point to the same commit as the latest patch release. This is what allows users to use `TzviPM/laravel-deploy@v1` in their workflows instead of `TzviPM/laravel-deploy@v1.0.2`. For example, after tagging and releasing `v1.0.2`, delete the `v1` tag locally, create it again pointing to the same commit as `v1.0.2`, and force push your tags with `git push -f --tags`.