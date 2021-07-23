# evexerxes-discord-bot

Eve corp discord bot notifier

## Dependencies

1. 
    ```bash
    npm install --global npx
    ```

2. [Setup MongoDB](https://docs.mongodb.com/manual/administration/install-community/), create a database to be called `esi`, and make sure that it is accessible at [mongo://localhost/esi](mongo://localhost/esi). Currently tested with Mongo Community Edition V5.

## How to setup

```bash
npm install
```

## How to run

```bash
npm start
```

## Features

* notify when corp contracts are created
* * validate if its from an accepted station



## ideas

* have a onboarding to discord where ranks match discord groups -> promotion in eve automatically enroles players in discord groups. When players leave, they can be automatically unenrolled

* notify when someone wants to join or has left the corp
* show available corperate blueprints
* show / notify on corp wallet changes
* notify significant changes to corperate containers ( putting in, taking away)
* notify when moon mining is ready
* notify details on corperation industry jobs (? we can corp indy jobs?)
* notify when new corp contact has been made

* notify when structures are under attack
* notify when high number of kills in specified systems
* notify new station anchering in specified systems
* notify when at war, changes to wars we're in
