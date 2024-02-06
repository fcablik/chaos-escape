# Deploying to Fly.io

Prior to your first deployment, you'll need to do a few things:

1. [Install Fly](https://fly.io/docs/getting-started/installing-flyctl/).

   > **Note**: Try `flyctl` instead of `fly` if the commands below won't work.

2. Sign up and log in to Fly:

   ```sh
   fly auth signup
   ```

   > **Note**: If you have more than one Fly account, ensure that you are signed
   > into the same account in the Fly CLI as you are in the browser. In your
   > terminal, run `fly auth whoami` and ensure the email matches the Fly
   > account signed into the browser.

3. Create two apps on Fly, one for staging and one for production:

   ```sh
   fly apps create [YOUR_APP_NAME]
   fly apps create [YOUR_APP_NAME]-staging
   ```

   > **Note**: Make sure this name matches the `app` set in your `fly.toml`
   > file. Otherwise, you will not be able to deploy.

4. Initialize Git.

   ```sh
   git init
   ```

- Create a new [GitHub Repository](https://repo.new), and then add it as the
  remote for your project. **Do not push your app yet!**

  ```sh
  git remote add origin <ORIGIN_URL>
  ```

5. Add secrets:

- Add a `FLY_API_TOKEN` to your GitHub repo. To do this, go to your user
  settings on Fly and create a new
  [token](https://web.fly.io/user/personal_access_tokens/new), then add it to
  [your repo secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
  with the name `FLY_API_TOKEN`.

- Add a `SESSION_SECRET`, `INTERNAL_COMMAND_TOKEN`, and `HONEYPOT_SECRET` to
  your fly app secrets, to do this you can run the following commands:

  ```sh
  fly secrets set SESSION_SECRET=$(openssl rand -hex 32) INTERNAL_COMMAND_TOKEN=$(openssl rand -hex 32) HONEYPOT_SECRET=$(openssl rand -hex 32) --app [YOUR_APP_NAME]
  fly secrets set SESSION_SECRET=$(openssl rand -hex 32) INTERNAL_COMMAND_TOKEN=$(openssl rand -hex 32) HONEYPOT_SECRET=$(openssl rand -hex 32) --app [YOUR_APP_NAME]-staging
  ```

  > **Note**: If you don't have openssl installed, you can also use
  > [1Password](https://1password.com/password-generator) to generate a random
  > secret, just replace `$(openssl rand -hex 32)` with the generated secret.

6. Create production database:

   Create a persistent volume for the sqlite database for both your staging and
   production environments. Run the following (feel free to change the GB size
   based on your needs and the region of your choice
   (`https://fly.io/docs/reference/regions/`). If you do change the region, make
   sure you change the `primary_region` in fly.toml as well):

   ```sh
   fly volumes create data --region ams --size 1 --app [YOUR_APP_NAME]
   fly volumes create data --region ams --size 1 --app [YOUR_APP_NAME]-staging
   ```

7. Attach Consul:

- Consul is a fly-managed service that manages your primary instance for data
  replication
  ([learn more about configuring consul](https://fly.io/docs/litefs/getting-started/#lease-configuration)).

  ```sh
  fly consul attach --app [YOUR_APP_NAME]
  fly consul attach --app [YOUR_APP_NAME]-staging
  ```

8. In case you're going to use Resend:

   This document describes how to get [Resend](https://resend.com) (the ChaosEscape
   email provider) setup.

   > **NOTE**: this is an optional step. During development the emails will be
   > logged to the terminal and in production if you haven't set the proper
   > environment variables yet you will get a warning until you set the environment
   > variables.

   Create [an API Key](https://resend.com/api-keys) and set `RESEND_API_KEY` in
   both prod and staging:

   ```sh
   fly secrets set RESEND_API_KEY="re_blAh_blaHBlaHblahBLAhBlAh" --app [YOUR_APP_NAME]
   fly secrets set RESEND_API_KEY="re_blAh_blaHBlaHblahBLAhBlAh" --app [YOUR_APP_NAME]-staging
   ```

   Setup a [custom sending domain](https://resend.com/domains) and then make sure
   to update the `from` email address in `app/utils/email.server.ts` and the
   `expect(email.from).toBe` in `tests/e2e/onboarding.test.ts` to the one you want
   your emails to come from.


9. Commit!

   The ChaosEscape Stack comes with a GitHub Action that handles automatically
   deploying your app to production and staging environments.

   Now that everything is set up you can commit and push your changes to your
   repo. Every commit to your `main` branch will trigger a deployment to your
   production environment, and every commit to your `dev` branch will trigger a
   deployment to your staging environment.

---

### Optional: Email service setup

Find instructions for this optional step in [the email docs](./email.md).

### Optional: Error monitoring setup

Find instructions for this optional step in
[the error tracking docs](./monitoring.md).

### Optional: Connecting to your production database

Find instructions for this optional step in [the database docs](./database.md).

### Optional: Seeding Production

Find instructions for this optional step in [the database docs](./database.md).

## Deploying locally

If you'd like to deploy locally you definitely can. You need to (temporarily)
move the `Dockerfile` and the `.dockerignore` to the root of the project first.
Then you can run the deploy command:

```
mv ./other/Dockerfile Dockerfile
mv ./other/.dockerignore .dockerignore
fly deploy
```

Once it's done, move the files back:

```
mv Dockerfile ./other/Dockerfile
mv .dockerignore ./other/.dockerignore
```

You can keep the `Dockerfile` and `.dockerignore` in the root if you prefer,
just make sure to remove the move step from the `.github/workflows/deploy.yml`.