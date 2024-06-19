const { Kenway } = require('../src/index');

const knwy = new Kenway({ dir: './', port: 1234 });
knwy.listen(1234)


knwy.col('test').doc('test').set({ hi: 'mom' })




// describe('Kenway', () => {
//   test.todo('Write tests');

//   test('add data', () => {
//     expect('Edward Kenway').toBe('Edward Kenway');
//   });
// });
