# Testes locais com PHP Built-in Server

1) Configure `config.php` com credenciais locais do MySQL e `jwt_secret`.
2) Inicie o servidor PHP local na pasta do projeto (no seu ambiente de desenvolvimento):

```bash
php -S localhost:8000 -t ges-api-php
```

3) Defina a senha do administrador (use o e-mail do usuário criado no schema):

```bash
php ges-api-php/set_admin_password.php admin@exemplo.com suaSenha
```

4) Exemplos de requests (curl):

- Login

```bash
curl -X POST http://localhost:8000/api/login -H "Content-Type: application/json" -d '{"email":"admin@exemplo.com","senha":"suaSenha"}'
```

- Criar usuário (substitua TOKEN)

```bash
curl -X POST http://localhost:8000/api/usuarios -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"nome":"Outro","email":"outro@ex.com","senha":"123456"}'
```

- Listar usuários (admin)

```bash
curl -X GET http://localhost:8000/api/usuarios -H "Authorization: Bearer TOKEN"
```

- Criar projeto

```bash
curl -X POST http://localhost:8000/api/projetos -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"nome":"Projeto X","cliente":"Cliente Y","valorHora":50}'
```

- Criar RDO

```bash
curl -X POST http://localhost:8000/api/rdos -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"data":"2025-12-18","projeto_id":1,"descricao_diaria":"Trabalhos","horarios":[{"inicio":"08:00","fim":"12:00"}]}'
```

- Listar RDOs

```bash
curl -X GET 'http://localhost:8000/api/rdos?usuario_id=1' -H "Authorization: Bearer TOKEN"
```

5) Se tudo funcionar, faça o build do frontend (`npm run build`) e suba os arquivos para o `public_html`, garantindo que `VITE_API_BASE_URL` esteja vazio ou relativo.

