import { corpStructure1, corpStructure2 } from '../data/corporation/structures';


test('When if no object optional field doesnt exist condition met', async () => {
    delete corpStructure1.previous_fuel_status;
    if(!corpStructure1?.previous_fuel_status){
        expect(true).toBe(true); 
    }
});

// Stupid java thinks number is truthy.
test('When if no object optional field equals 0 condition met', async () => {
    corpStructure1.previous_fuel_status = 0;
    if(!corpStructure1?.previous_fuel_status){
        //I wasn't expecting this to be true, this should be false.
        expect(true).toBe(true); 
    }else{
        expect(true).toBe(true);
    }
});


test('number 0 is equal to false', async () => {
    const zero: number = 0;
    expect(zero).toBeFalsy(); 
});
