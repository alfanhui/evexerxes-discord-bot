# evexerxes-discord-bot

Eve corp discord bot notifier

## Dependencies

- node v14+ 

1. Install npx

    ```bash
    npm install --global npx
    ```

2. [Setup MongoDB](https://docs.mongodb.com/manual/administration/install-community/), create a database to be called `esi`, and make sure that it is accessible at [mongo://localhost/esi](mongo://localhost/esi). Currently tested with Mongo Community Edition V5.

_For Raspberry pi with Ubuntu:_

1. [Setup MongoDB](https://developer.mongodb.com/how-to/mongodb-on-raspberry-pi/)

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

## How to setup

  ```bash
  npm install
  ```

## How to run

  ```bash
  npm start
  ```

## How to add

[https://discord.com/oauth2/authorize?&client_id=000000000000000000&scope=bot&permissions=8](https://discord.com/oauth2/authorize?&client_id=000000000000000000&scope=bot&permissions=8)

## Icons

[https://wiki.eveuniversity.org/UniWiki:Icons](https://wiki.eveuniversity.org/UniWiki:Icons)

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
