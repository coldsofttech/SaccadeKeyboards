# Repository setup

The repository settings below are applied by hand in the GitHub UI, or with the `gh` CLI. The `main` ruleset is stored in `.github/rulesets/main.json` and can be imported from Settings > Rules.

## Protections

| Setting                         | Value                    | How                                           |
| ------------------------------- | ------------------------ | --------------------------------------------- |
| Dependency graph                | On                       | Default for public repos                      |
| Dependabot alerts               | On                       | Settings > Advanced Security                  |
| Dependabot security updates     | On                       | Settings > Advanced Security                  |
| Secret protection               | On, with push protection | Settings > Advanced Security                  |
| CodeQL                          | Default setup            | Settings > Advanced Security                  |
| Malware alerts                  | On                       | Manual: Settings > Advanced Security          |
| Copilot Autofix                 | Off                      | Manual: Settings > Advanced Security > CodeQL |
| Private vulnerability reporting | On                       | Manual: Settings > Advanced Security          |

## Ruleset `main` (default branch)

- Restrict deletions and block force pushes
- Require a pull request: dismiss stale approvals, require code owner review, require conversation resolution, squash merge only
- Require status checks to pass (`ci` and `dependency-review`), with branches up to date
- Require code scanning results (CodeQL)
- Require deployments to succeed: included with no environments, so it does nothing until you list one
- Require code quality results: enable manually in the ruleset UI, as it is not included in the JSON

Repository admins can bypass the ruleset through a pull request. This lets a solo maintainer merge despite the code owner requirement, since authors cannot approve their own PRs. Remove the bypass actor in `main.json` if you have more maintainers.

## Manual steps

- Allow squash merging only and delete head branches after merge (Settings > General). Create the `skip-changelog` label used by `.github/release.yml`, and the `language`, `region` and `layout` labels used by the issue forms (a label that does not exist is not applied).
- If the owner is an organization, change `.github/CODEOWNERS` to a team.
- Run `pre-commit install --hook-type pre-commit --hook-type post-commit` locally (the post-commit type is needed for Sweepito cleanup).
- Publish to npm with trusted publishing (no token): create a GitHub environment named `npm` (Settings > Environments), then on npmjs.com open each package's Settings > Trusted publisher and register this repository, the workflow `release.yml` and the `npm` environment. A package must exist on npm before it can be configured, so publish the first version manually with `npm publish --access public`, then register the trusted publisher.
- There are 7 packages to publish: `saccade-keyboards` and the languages `en`, `es`, `fr`, `hi`, `te` and `ur`. Each needs its own trusted publisher on npm. A new language package needs the same.
- CodeQL default setup only works once the repo contains a supported language, so enable it after adding code.
