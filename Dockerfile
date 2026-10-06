FROM public.ecr.aws/lambda/nodejs:22 AS build
WORKDIR ${LAMBDA_TASK_ROOT}
RUN dnf install -y python3 make gcc-c++ && dnf clean all
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM public.ecr.aws/lambda/nodejs:22
WORKDIR ${LAMBDA_TASK_ROOT}
ENV NODE_ENV=production
COPY --from=build ${LAMBDA_TASK_ROOT}/node_modules ./node_modules
COPY --from=build ${LAMBDA_TASK_ROOT}/dist ./dist
CMD ["dist/lambda.handler"]
