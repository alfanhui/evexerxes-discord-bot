export const ICON_URLS: { [key: string]: string } = {
    contract_unknown: "https://wiki.eveuniversity.org/images/f/f5/Helpicon.png",
    contract_item_exchange: "https://wiki.eveuniversity.org/images/6/69/Contractitemexchange.png",
    contract_auction: "https://wiki.eveuniversity.org/images/6/62/Contractauction.png",
    contract_courier: "https://wiki.eveuniversity.org/images/4/40/Contractcourier.png",
    contract_loan: "https://wiki.eveuniversity.org/images/2/2a/Notepad.png"
};

export function getCorperationIconURL(corperationId: number){
    return `https://image.eveonline.com/Corporation/${corperationId}_128.png`;
}

export function getAllianceIconURL(allianceId: number){
    return `https://images.evetech.net/alliances/${allianceId}/logo`
}

export function getProfilePictureURL(characterId: number){
    return `https://images.evetech.net/characters/${characterId}/portrait?size=128`;
}