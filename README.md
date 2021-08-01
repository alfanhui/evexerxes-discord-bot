# evexerxes-discord-bot

Eve corp discord bot notifier

## Dependencies and Setup

- node v14+
- EVE Online Developer ClientID and ClientSecret
- Discord Developer Token

1. Install npx

    ```bash
    npm install --global npx
    ```

2. [Setup MongoDB](https://docs.mongodb.com/manual/administration/install-community/), create a database to be called `esi`, and make sure that it is accessible at [mongo://localhost/esi](mongo://localhost/esi). Currently tested with Mongo Community Edition V5.

    [_For Raspberry pi with Ubuntu:_](https://developer.mongodb.com/how-to/mongodb-on-raspberry-pi/)

    ```bash
    # Install the MongoDB GPG key:
    wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -

    # Add the source location for the MongoDB packages:
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list

    # Download the package details for the MongoDB packages:
    sudo apt-get update

    # Install MongoDB:
    sudo apt-get install -y mongodb-org

    sudo systemctl daemon-reload
    sudo systemctl enable mongod
    sudo systemctl start mongod
    ```

3. Install Node dependencies

    ```bash
    npm install
    ```

4. Create .env file at root directory and fill out the details:

    `./.env`:

    ```bash
    PORT=8002
    CALLBACK_URI=
    EVE_CLIENT_ID=
    EVE_SECRET=
    DISCORD_TOKEN=
    DISCORD_TEST_CHANNEL=
    DEBUG=
    CONTRACT_CRON=0 */5 10,11,12,13,14,15,16,17,18,19,20,21,22 * * *
    FUEL_CRON=0 0 10,13,16,19,22 * * *
    WAR_CRON=0 0 10,11,12,13,14,15,16,17,18,19,20,21,22 * * *
    ```

## How to run

1. Run the service:

    ```bash
    npm run start #development
    #or
    npm run prod #production
    ```

2. [Login to your Eve accounts](localhost:8002/login)

3. Link Bot to discord server: [https://discord.com/oauth2/authorize?&client_id=000000000000000000&scope=bot&permissions=8](https://discord.com/oauth2/authorize?&client_id=000000000000000000&scope=bot&permissions=8)

4. Link Channel to evexerxes-bot:

    Type: `!evexerxes-init`
    Into the discord channel you want the notifications to come from.

## How to enable as Service

1. Copy service to systemd:

    `sudo cp evexerxes-bot.service /etc/systemd/system/`
2. Reload systemd daemon:

    `sudo systemctl daemon-reload`
3. Enable (run on boot) evexerxes-bot service:

    `sudo systemctl enable evexerxes-bot.service`

4. Start evexerxes-bot service:

    `sudo systemctl start evexerxes-bot.service`

## Icons

[https://wiki.eveuniversity.org/UniWiki:Icons](https://wiki.eveuniversity.org/UniWiki:Icons)

## Endpoints

- [localhost:8002/login](localhost:8002/login): To authenticate with EVE to use EVE Online API
- [localhost:8002/callback](localhost:8002/callback) Callback URL to retrieve token from EVE Online
- [localhost:8002/wipe](localhost:8002/wipe) Debug to wipe all documents in DB
- [localhost:8002/wipe/stations](localhost:8002/wipe/stations) Debug to wipe just stations (Structure test)

## Support

debugging:

- `journalctl -fu evexerxes-bot.service`

## Features

* notify when corp contracts are created

## ideas

* have a onboarding to discord where ranks match discord groups -> promotion in eve automatically enroles players in discord groups. When players leave, they can be automatically unenrolled
* validate contracts if originate from an accepted station...
* notify when someone wants to join or has left the corp
* show available corperate blueprints
* show / notify on corp wallet changes
* notify significant changes to corperate containers ( putting in, taking away)
* notify when moon mining is ready
* notify details on corperation industry jobs (? we can corp indy jobs?)
* notify when high number of kills in specified systems
* notify new station anchering in specified systems
* notify when at war, changes to wars we're in
* notify when structures are under attack
