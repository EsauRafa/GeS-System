# Deploy na UOL (Hospedagem P - PHP + MySQL)

Passos resumidos:

1. Importe o arquivo `schema.sql` no phpMyAdmin (pasta do banco) para criar o schema `gs_db` e as tabelas.
2. Edite `config.php` (preferencialmente coloque em um diretório fora do `public_html`) com as credenciais do banco e uma `jwt_secret` forte.
3. Coloque a pasta `api/` dentro do `public_html` (ex.: `public_html/api/*`), e copie também `.htaccess` para `public_html/`.
4. Se não puder colocar `config.php` fora do webroot, edite as permissões para que não seja acessível publicamente.
5. Configure o usuário admin inicial: rode `php set_admin_password.php admin@exemplo.com suaSenha` no terminal (ou use um script temporário no servidor) para definir a senha.
6. Ajuste o frontend:
   - No seu build Vite, garanta que `VITE_API_BASE_URL` aponte para `''` (padrão) ou deixe vazio; o `client.js` já usa rota relativa. Faça `npm run build` e envie os arquivos para o `public_html` do domínio.
7. Teste endpoints: `POST https://seusite.com/api/login` com `{ email, senha }` e depois chame rotas protegidas com header `Authorization: Bearer <token>`.

Notas:
- Revise limites de memória (384MB) e `max_execution_time` no painel UOL caso precise ajustar uploads/payloads.
- Para produção, gere um `jwt_secret` forte (32+ chars) e mantenha o `config.php` fora do webroot.
- Se quiser HTTPS, ative o certificado no painel UOL (Let's Encrypt geralmente disponível).

