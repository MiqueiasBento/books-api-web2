# Biblioteca API — Express, TypeScript e MongoDB

API REST de livros com CRUD completo. A aplicação usa MongoDB/Mongoose; a implementação SQLite anterior continua disponível somente como referência em `SQLiteBookService.ts` e `database/connection.ts`.

## Executar

É necessário ter Node.js instalado e uma instância MongoDB Atlas acessível.

```bash
npm install
cp .env.example .env
npm run dev
```

- API: `http://localhost:3333`
- Swagger UI: `http://localhost:3333/api-docs`
- Especificação OpenAPI (JSON): `http://localhost:3333/api-docs.json`

Preencha `MONGO_URL` no arquivo `.env` com a URI do Atlas antes de iniciar. O arquivo `.env` é carregado automaticamente e não deve ser versionado. A API encerra com uma mensagem clara se a variável não estiver configurada.

## Implantar na AWS Lambda com imagem Docker

O `Dockerfile` usa a imagem oficial AWS Lambda Node.js 22 e executa `dist/lambda.handler`. Esse handler adapta os eventos HTTP da Function URL ao Express e abre uma conexão MongoDB reutilizada nas invocações quentes. A imagem oficial inclui o runtime interface client exigido pelo Lambda. O banco permanece no MongoDB Atlas.

### 1. Prepare a conexão com o Atlas

No Atlas, crie um usuário de banco e autorize a conexão de rede. Copie a URI incluindo o nome do banco `biblioteca`, por exemplo `mongodb+srv://USUARIO:SENHA@CLUSTER.mongodb.net/biblioteca?retryWrites=true&w=majority`. Se a senha tiver caracteres como `@`, `:`, `/` ou `#`, faça URL-encode desses caracteres. Sem VPC, Lambda não tem IP de saída fixo; para uma atividade simples, a regra `0.0.0.0/0` no Atlas funciona, mas deixa o cluster acessível pela internet e deve ser combinada com senha forte.

### 2. Configure AWS e ECR

Instale o Docker e AWS CLI v2, configure credenciais (`aws configure`) e escolha uma região. ECR e Lambda precisam estar na mesma região. Na pasta `book`, rode os comandos a seguir no Bash, trocando a região se necessário:

```bash
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REPOSITORY=biblioteca_api
export IMAGE_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY

aws ecr create-repository --repository-name "$ECR_REPOSITORY" --region "$AWS_REGION"
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
docker build --platform linux/amd64 -t "$IMAGE_URI:latest" .
```

O comando de criação do repositório é executado uma vez; se ele já existir, prossiga. `linux/amd64` deve corresponder à arquitetura x86_64 escolhida ao criar a função. Em computadores ARM, como Apple Silicon, o `--platform` mantém a imagem compatível com essa arquitetura.

Antes de enviar ao ECR, teste o container localmente. O arquivo `.env` precisa conter a URI funcional do Atlas. No primeiro terminal:

```bash
docker run --rm --env-file .env -p 9000:8080 "$IMAGE_URI:latest"
```

Em outro terminal, envie um evento HTTP no formato usado pela Function URL e confira se a resposta contém `statusCode: 200` e `"status":"ok"`:

```bash
curl -sS -X POST http://localhost:9000/2015-03-31/functions/function/invocations \
  -H 'content-type: application/json' \
  -d '{"version":"2.0","routeKey":"$default","rawPath":"/health","rawQueryString":"","headers":{"host":"localhost"},"requestContext":{"http":{"method":"GET","path":"/health","protocol":"HTTP/1.1","sourceIp":"127.0.0.1","userAgent":"curl"}},"isBase64Encoded":false}'
```

Pare o container local com `Ctrl+C` e envie a imagem testada:

```bash
docker push "$IMAGE_URI:latest"
```

### 3. Crie a função Lambda

No console AWS, abra **Lambda → Create function → Container image**, escolha um nome e selecione a imagem `biblioteca-api:latest` do ECR. Selecione a arquitetura **x86_64**. Após criar, em **Configuration → General configuration → Edit**, configure memória para pelo menos 512 MB e timeout para 30 segundos.

Em **Configuration → Environment variables**, adicione `MONGO_URL` com a URI do Atlas. Para uma atividade simples, variável de ambiente basta, mas quem tiver permissão de editar a função poderá ler seu valor; Secrets Manager é melhor para uso compartilhado ou produção.

### 4. Crie a Function URL e teste

Em **Configuration → Function URL → Create function URL**, escolha **Auth type: NONE** e crie a URL. No console, essa opção também configura as permissões públicas necessárias. A URL ficará acessível a qualquer pessoa, então não use dados sensíveis.

Teste os endpoints substituindo `SUA_URL` pela URL criada:

```bash
curl -i "SUA_URL/health"
curl -i "SUA_URL/api-docs"
curl -i "SUA_URL/api-docs.json"
curl -i -X POST "SUA_URL/books" \
  -H 'content-type: application/json' \
  -d '{"title":"Clean Code","author":"Robert C. Martin","publishedYear":2008,"available":true}'
```

Se a função retornar erro, confira **Monitor → View CloudWatch logs**. Erro de seleção de servidor geralmente indica URI, senha não codificada ou regra de acesso de rede do Atlas; `403` na URL aponta para as permissões da Function URL. A primeira invocação pode demorar enquanto o Lambda inicia e conecta ao MongoDB.

## Swagger

Com a API em execução, acesse `/api-docs` para consultar os contratos e testar as rotas usando **Try it out** e **Execute**. As operações de escrita executadas na interface alteram os dados no MongoDB.

A documentação inclui todas as rotas CRUD, a busca por `search`, o health check, exemplos de requisição e as respostas de sucesso e erro. Os esquemas de criação e atualização são gerados a partir dos DTOs Zod, preservando suas regras de validação. A configuração fica em `src/config/swagger.ts` e funciona tanto com `npm run dev` quanto com `npm run build` seguido de `npm start`.

O servidor OpenAPI usa a mesma origem da documentação, portanto acompanha automaticamente a porta configurada em `PORT`. A especificação pode ser importada em ferramentas que aceitam OpenAPI pela rota `/api-docs.json`.

## Rotas CRUD

| Operação | Método | Rota | Resultado |
| --- | --- | --- | --- |
| Create | POST | `/books` | Cria um livro |
| Read | GET | `/books` | Lista livros; aceita `?search=termo` |
| Read | GET | `/books/:id` | Busca pelo ObjectId |
| Update | PUT | `/books/:id` | Atualiza todos os campos |
| Update | PATCH | `/books/:id` | Atualiza parcialmente |
| Delete | DELETE | `/books/:id` | Exclui um livro |

Também existe `GET /health`.

Corpo de criação:

```json
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "publishedYear": 2008,
  "available": true
}
```

Para `PUT /books/:id`, envie todos os campos do exemplo acima: `title`, `author`, `publishedYear` e `available`. A resposta é `200` com o livro atualizado; campos ausentes ou inválidos retornam `422`, ID inválido retorna `400` e livro inexistente retorna `404`.

Uma atualização parcial com `PATCH` pode enviar somente `{ "available": false }`.

## Organização

- `models/`: schema e model Mongoose.
- `database/mongoConnection.ts`: conexão principal com MongoDB.
- `dtos/`: contratos e validação com Zod.
- `controllers/`: camada HTTP.
- `services/BookService.ts`: operações com Mongoose.
- `routes/`: rotas Express.
- `middlewares/`: tratamento centralizado de erros.
- `services/SQLiteBookService.ts`: implementação relacional preservada e desacoplada.
