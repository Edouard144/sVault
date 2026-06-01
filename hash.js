const bcrypt = require('bcryptjs');

async function generate() {
  const hash = await bcrypt.hash('damn@123', 10);
  console.log(hash);
}

generate();