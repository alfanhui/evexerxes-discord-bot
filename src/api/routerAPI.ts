import ESI, { Token } from 'eve-esi-client';

export const getRouteInfo = async (esi: ESI, token: Token, originSystemId: number, destinationSystemId: number) => {
    return (await esi.request<Array<number>>(
        `/route/${originSystemId}/${destinationSystemId}`,
        null,
        null,
        { token }
    )).json();
}