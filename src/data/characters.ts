interface ICharacterById {
    name: string,
    corperation_id: number,
    corperation_name: string,
    authorisations: string[]
}

export var CHARACTERS_BY_ID: { [id: number] : ICharacterById; } = {
    2115057016: {
        name: "florin flynn",
        corperation_id: 98176669,
        corperation_name: 'pixel knights',
        authorisations: [
            "esi-corporations.read_blueprints.v1",
            "esi-contracts.read_corporation_contracts.v1"
        ]
    },
    2118556764: {
        name: "shodan ai",
        corperation_id: 98662212,
        corperation_name: 'pixel knights inc.',
        authorisations: [
            "esi-corporations.read_blueprints.v1",
            "esi-corporations.read_structures.v1",
            "esi-planets.read_customs_offices.v1",
            "esi-contracts.read_corporation_contracts.v1"
        ]
    },
    2118131516: {
        name: "tron_takeo",
        corperation_id: 98676626,
        corperation_name: 'moonbreeze mercenaries',
        authorisations: [
            "esi-corporations.read_blueprints.v1",
            "esi-corporations.read_structures.v1",
            "esi-planets.read_customs_offices.v1",
            "esi-contracts.read_corporation_contracts.v1"
        ]
    }
}

export var CHARACTERS_BY_NAME: { [id: string] : number; } = {
    "florin flynn": 2115057016,
    "shodan ai": 2118556764,
    "tron_takeo": 2118131516
}