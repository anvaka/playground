var Gun = require('gun');

// Create a new gun instance
var gun = Gun();

// Read `greetings`, saving it to a variable.
var greetings = gun.get('greetings');

// Update the value on `greetings`.
greetings.put({
    hello: 'world',
})

// Print the value!
greetings.on(function (update) {
    console.log('Update:', update)
})
