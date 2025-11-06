const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Ingresa el código de acceso que deseas usar: ', async (accessCode) => {
  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(accessCode, saltRounds);
    
    console.log('\n✅ Hash generado exitosamente:');
    console.log('─────────────────────────────────────────');
    console.log(hash);
    console.log('─────────────────────────────────────────');
    console.log('\n📝 Agrega esto a tu archivo .env:');
    console.log(`ACCESS_CODE_HASH=${hash}\n`);
    
    rl.close();
  } catch (error) {
    console.error('❌ Error al generar hash:', error);
    rl.close();
  }
});

