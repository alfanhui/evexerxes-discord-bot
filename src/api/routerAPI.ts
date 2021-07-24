import ESI, { Token } from 'eve-esi-client';

export const getRouteInfo = async (request: ESI['request'], token: Token, originSystemId: number, destinationSystemId: number) => {
    return (await request<Array<string>>(
        `/route/${originSystemId}/${destinationSystemId}`,
        null,
        null,
        { token }
    )).json();
}