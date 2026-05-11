#!/usr/bin/env node

const bcryptjs = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('Uso: node scripts/hash-password.js "sua_senha"');
  process.exit(1);
}

if (password.length < 6) {
  console.error('Erro: Senha deve ter pelo menos 6 caracteres');
  process.exit(1);
}

bcryptjs.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Erro ao gerar hash:', err);
    process.exit(1);
  }
  console.log('');
  console.log('Hash gerado para a senha:', password);
  console.log('');
  console.log(hash);
  console.log('');
  console.log('Use este hash no SQL INSERT para criar um novo usuário.');
});
